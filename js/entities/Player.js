// js/entities/Player.js
import CONFIG from '../config.js';
import { getLocale } from '../localization.js';

export class Player {
    constructor(x, y) {
        this.autoRespawn = false;
        this.x = x;
        this.y = y;
        this.radius = CONFIG.PLAYER_BASE.RADIUS;

        this.speed = CONFIG.PLAYER_BASE.BASE_SPEED;
        this.maxEnergy = CONFIG.PLAYER_BASE.MAX_ENERGY;
        this.regen = CONFIG.PLAYER_BASE.ENERGY_REGEN;
        this.energy = this.maxEnergy;

        this.level = 1;
        this.xp = 0;
        this.xpToNextLevel = CONFIG.STATS.XP_PER_LEVEL_BASE;
        this.statPoints = 0;

        this.ability1Level = 1;
        this.ability2Level = 1;
        this.moveDirX = 0;
        this.moveDirY = 0;

        this.downed = false;
        this.invulnerable = false;
        this.invulnerableTime = 0;
        this.lastSafeZone = { x: CONFIG.PORTAL.WIDTH + CONFIG.SAFE_ZONE.WIDTH / 2, y: 350 };

        this.width = CONFIG.WORLD.WIDTH;
        this.height = CONFIG.WORLD.HEIGHT;

        this.teleportFreeze = 0;
        this.slowFactor = 1.0;
        this.energyDrainRate = 0;
        this.abilitiesBlocked = false;
        this.pullForceX = 0;
        this.pullForceY = 0;
        this.ability1Cost = CONFIG.ABILITIES.SHIFT_COST;
        this.ability2Cost = CONFIG.ABILITIES.SPACE_COST;
        this.heroId = 'mirage';
        this.heroColor = '#00d9ff';
        this.shieldHealth = 0;

        this.shiftCooldown = 0;         // <-- базовые кулдауны
        this.spaceCooldown = 0;
        this._lastGameState = null;     // <-- сохраняем gameState
    }

    update(input, gameState, arena = null) {
        this._lastGameState = gameState;
        this.updateCooldowns();

        if (this.downed) return;

        if (this.teleportFreeze > 0) {
            this.teleportFreeze--;
            return;
        }

        let dx = 0, dy = 0;

        if (input.keyboardActive || input.isMovementKeyPressed()) {
            if (input.isDown('KeyW') || input.isDown('ArrowUp')) dy = -1;
            if (input.isDown('KeyS') || input.isDown('ArrowDown')) dy = 1;
            if (input.isDown('KeyA') || input.isDown('ArrowLeft')) dx = -1;
            if (input.isDown('KeyD') || input.isDown('ArrowRight')) dx = 1;

            if (dx !== 0 || dy !== 0) {
                const len = Math.sqrt(dx * dx + dy * dy);
                this.moveDirX = dx / len;
                this.moveDirY = dy / len;
            }

            this.x += dx * this.speed * this.slowFactor;
            this.y += dy * this.speed * this.slowFactor;
        } else if (input.mouseActive) {
            const direction = input.getMouseDirection(this.x, this.y);
            const effectiveSpeed = this.speed * this.slowFactor;
            const mouseSpeed = input.getMouseSpeed(direction.distance, effectiveSpeed);
            if (mouseSpeed > 0) {
                this.x += direction.dx * mouseSpeed;
                this.y += direction.dy * mouseSpeed;
            }
            this.moveDirX = direction.dx;
            this.moveDirY = direction.dy;
        }

        // Притяжение / вытеснение
        let totalPullX = 0, totalPullY = 0, pullCount = 0;
        let totalPushX = 0, totalPushY = 0, pushCount = 0;
        const maxForceAuras = 2;

        if (gameState && !gameState.isPlayerUnavailable) {
            for (let enemy of gameState.enemies) {
                if (enemy.type === 'asterpull' || enemy.type === 'asterhyperpull' || enemy.type === 'asterpush') {
                    if (enemy.auraDisabled) continue;
                    const edx = this.x - enemy.x;
                    const edy = this.y - enemy.y;
                    const dist = Math.sqrt(edx * edx + edy * edy);
                    const scale = enemy.radius / (enemy.baseRadius || enemy.radius);
                    const radius = (enemy.auraRadiusBase || 120) * scale;
                    if (dist <= radius) {
                        const angle = Math.atan2(this.y - enemy.y, this.x - enemy.x);
                        const strength = (enemy.auraValue || 0.25) * (enemy.radius / 14);
                        if (enemy.auraEffect === 'pull') {
                            totalPullX += Math.cos(angle) * strength;
                            totalPullY += Math.sin(angle) * strength;
                            pullCount++;
                            if (pullCount >= maxForceAuras) break;
                        } else if (enemy.auraEffect === 'push') {
                            totalPushX -= Math.cos(angle) * strength;
                            totalPushY -= Math.sin(angle) * strength;
                            pushCount++;
                            if (pushCount >= maxForceAuras) break;
                        }
                    }
                }
            }
        }

        this.pullForceX = totalPullX + totalPushX;
        this.pullForceY = totalPullY + totalPushY;
        this.x += this.pullForceX;
        this.y += this.pullForceY;

        this.x = Math.max(this.radius, Math.min(gameState.width - this.radius, this.x));
        this.y = Math.max(this.radius, Math.min(gameState.height - this.radius, this.y));

        if (arena && arena.isInSafeZone(this.x, this.y, this.radius)) {
            const spawn = arena.getRespawnPoint(this.x);
            this.lastSafeZone = { x: spawn.x, y: spawn.y };
        } else if (!arena) {
            const leftSafeStart = CONFIG.PORTAL.WIDTH;
            const leftSafeEnd = CONFIG.PORTAL.WIDTH + CONFIG.SAFE_ZONE.WIDTH;
            const rightSafeStart = gameState.width - CONFIG.PORTAL.WIDTH - CONFIG.SAFE_ZONE.WIDTH;
            const rightSafeEnd = gameState.width - CONFIG.PORTAL.WIDTH;
            if ((this.x >= leftSafeStart && this.x <= leftSafeEnd) ||
                (this.x >= rightSafeStart && this.x <= rightSafeEnd)) {
                this.lastSafeZone = { x: this.x, y: this.y };
            }
        }

        if (this.energy < this.maxEnergy) {
            this.energy = Math.min(this.maxEnergy, this.energy + this.regen / 60);
        }

        if (gameState && !gameState.isPlayerUnavailable) {
            let totalDrain = 0;
            let drainCount = 0;
            const maxDrainAuras = 3;
            for (let enemy of gameState.enemies) {
                if (enemy.type === 'asterdrain' && !enemy.auraDisabled) {
                    const edx = this.x - enemy.x;
                    const edy = this.y - enemy.y;
                    const dist = Math.sqrt(edx * edx + edy * edy);
                    const scale = enemy.radius / (enemy.baseRadius || enemy.radius);
                    const radius = (enemy.auraRadiusBase || 120) * scale;
                    if (dist <= radius) {
                        totalDrain += enemy.auraValue || 0.25;
                        drainCount++;
                        if (drainCount >= maxDrainAuras) break;
                    }
                }
            }
            this.energyDrainRate = totalDrain;
        }

        if (this.energy > 0 && this.energyDrainRate > 0) {
            this.energy -= this.energyDrainRate / 60;
            if (this.energy < 0) this.energy = 0;
        }

        if (this.invulnerable) {
            this.invulnerableTime--;
            if (this.invulnerableTime <= 0) this.invulnerable = false;
        }
    }

    updateCooldowns() {
        if (this.godMode) {
            this.shiftCooldown = 0;
            this.spaceCooldown = 0;
            return;
        }
        if (this.shiftCooldown > 0) this.shiftCooldown--;
        if (this.spaceCooldown > 0) this.spaceCooldown--;
    }

    getLocalizedAbilityDescriptions(heroId, params) {
        const loc = getLocale();
        return {
            ability1: {
                desc: loc[`ability1_desc_${heroId}`] || 'Ability 1',
                stats: loc[`ability1_stats_${heroId}`]
                    ? loc[`ability1_stats_${heroId}`](...params.ability1)
                    : ''
            },
            ability2: {
                desc: loc[`ability2_desc_${heroId}`] || 'Ability 2',
                stats: loc[`ability2_stats_${heroId}`]
                    ? loc[`ability2_stats_${heroId}`](...params.ability2)
                    : ''
            }
        };
    }

    getAbilityDescriptions() {
        return {
            ability1: { desc: 'Способность 1', stats: '' },
            ability2: { desc: 'Способность 2', stats: '' }
        };
    }

    addXP(amount) {
        this.xp += amount;
        while (this.xp >= this.xpToNextLevel && this.level < CONFIG.STATS.MAX_LEVEL) {
            this.levelUp();
        }
    }

    levelUp() {
        this.xp -= this.xpToNextLevel;
        this.level++;
        this.xpToNextLevel = Math.floor(this.xpToNextLevel * CONFIG.STATS.XP_MULTIPLIER);
        this.statPoints++;
    }

    upgradeStat(stat) {
        if (this.statPoints <= 0) return false;
        switch (stat) {
            case 'speed':
                if (this.speed >= CONFIG.PLAYER_BASE.MAX_SPEED) return false;
                this.speed += CONFIG.STATS.SPEED_PER_POINT;
                break;
            case 'energy':
                if (this.maxEnergy >= CONFIG.PLAYER_BASE.MAX_ENERGY_CAP) return false;
                this.maxEnergy += CONFIG.STATS.ENERGY_PER_POINT;
                break;
            case 'regen':
                if (this.regen >= CONFIG.PLAYER_BASE.MAX_REGEN) return false;
                this.regen += CONFIG.STATS.REGEN_PER_POINT;
                break;
            default:
                return false;
        }
        this.statPoints--;
        return true;
    }

    onDamage(gameEngine) {
        gameEngine.playerDies();
    }
    
    updateAbilityCooldowns() {}

    respawn() {
        const leftSafeEnd = CONFIG.PORTAL.WIDTH + CONFIG.SAFE_ZONE.WIDTH;
        const rightSafeStart = this.width - CONFIG.PORTAL.WIDTH - CONFIG.SAFE_ZONE.WIDTH;

        if (this.x < leftSafeEnd) {
            this.x = CONFIG.PORTAL.WIDTH + CONFIG.SAFE_ZONE.WIDTH / 2;
        } else if (this.x > rightSafeStart) {
            this.x = this.width - CONFIG.PORTAL.WIDTH - CONFIG.SAFE_ZONE.WIDTH / 2;
        } else {
            this.x = CONFIG.PORTAL.WIDTH + CONFIG.SAFE_ZONE.WIDTH / 2;
        }

        this.y = this.height / 2;
        this.downed = false;
        this.invulnerable = true;
        this.invulnerableTime = 120;
    }

    render(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        if (this.invulnerable) {
            ctx.fillStyle = this.heroColor;
            ctx.fill();
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        } else {
            ctx.fillStyle = this.heroColor;
        }
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    useAbility1(input, gameState) { throw new Error("Ability1 not implemented"); }
    useAbility2(input, gameState) { throw new Error("Ability2 not implemented"); }

    onAbility1Click() {}
    onAbility2Click() {}
}