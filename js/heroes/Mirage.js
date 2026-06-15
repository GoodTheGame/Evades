// js/heroes/Mirage.js
import { Player } from '../entities/Player.js';
import CONFIG from '../config.js';

export class Mirage extends Player {
    constructor(x, y) {
        super(x, y);
        this.heroId = 'mirage';
        this.heroColor = '#00d9ff';
        this.autoRespawn = true;

        this.projectile = null;

        this.maxInvulnTime = 2;
        this.updateAbilityCooldowns();

        // Параметры самонаводки
        this.homingRadius = 50;
        this.homingStrength = 0.08;
        this.maxTurnAngle = 0.06;
    }

    updateAbilityCooldowns() {
        const shiftCooldowns = [10, 9, 8, 7, 5];
        this.maxShiftCooldown = (shiftCooldowns[this.ability1Level - 1] || 10) * 60;

        const spaceCooldowns = [20, 18, 16, 14, 12];
        this.maxSpaceCooldown = (spaceCooldowns[this.ability2Level - 1] || 20) * 60;

        const invulnDurations = [2, 2.5, 3, 3.5, 4];
        this.maxInvulnTime = invulnDurations[this.ability2Level - 1] || 2;
    }

    update(input, gameState, arena = null) {
        super.update(input, gameState, arena);   // обновляет _lastGameState, кулдауны, движение

        // --- Обновление снаряда (всегда, даже если игрок мёртв) ---
        if (this.projectile) {
            const p = this.projectile;

            // Самонаводка
            let nearestEnemy = null;
            let nearestDist = this.homingRadius;
            for (let enemy of gameState.enemies) {
                const dx = enemy.x - p.x;
                const dy = enemy.y - p.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < nearestDist) {
                    nearestDist = dist;
                    nearestEnemy = enemy;
                }
            }

            if (nearestEnemy) {
                const dx = nearestEnemy.x - p.x;
                const dy = nearestEnemy.y - p.y;
                const targetAngle = Math.atan2(dy, dx);
                const currentAngle = Math.atan2(p.vy, p.vx);
                let angleDiff = targetAngle - currentAngle;
                if (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                if (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
                const maxTurn = this.maxTurnAngle;
                const clampedDiff = Math.max(-maxTurn, Math.min(maxTurn, angleDiff * this.homingStrength));
                const newAngle = currentAngle + clampedDiff;
                const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
                p.vx = Math.cos(newAngle) * speed;
                p.vy = Math.sin(newAngle) * speed;
            }

            p.x += p.vx;
            p.y += p.vy;

            // Отскок от границ
            if (p.x < p.radius) {
                p.x = p.radius;
                p.vx = Math.abs(p.vx);
            } else if (p.x > gameState.width - p.radius) {
                p.x = gameState.width - p.radius;
                p.vx = -Math.abs(p.vx);
            }
            if (p.y < p.radius) {
                p.y = p.radius;
                p.vy = Math.abs(p.vy);
            } else if (p.y > gameState.height - p.radius) {
                p.y = gameState.height - p.radius;
                p.vy = -Math.abs(p.vy);
            }

            p.life--;

            // Столкновение с врагами
            let hit = false;
            for (let enemy of gameState.enemies) {
                const dist = Math.hypot(p.x - enemy.x, p.y - enemy.y);
                if (dist < p.radius + enemy.radius) {
                    this.x = enemy.x;
                    this.y = enemy.y;

                    if (!this.downed) {
                        this.invulnerable = true;
                        const invDurations = [2, 2.5, 3, 3.5, 4];
                        this.invulnerableTime = Math.floor(invDurations[this.ability2Level - 1] * 60);
                    }

                    this.projectile = null;
                    hit = true;
                    break;
                }
            }

            if (!hit && p.life <= 0) {
                this.projectile = null;
            }
        }

        if (this.downed) return;
        if (this.abilitiesBlocked) return;

        // Способность 1 (Shift) – телепорт в ПОСЛЕДНЮЮ safe-зону
        if (input.isDown('ShiftLeft') || input.isDown('ShiftRight')) {
            if (this.shiftCooldown <= 0 && this.energy >= CONFIG.ABILITIES.SHIFT_COST) {
                this.useAbility1();
                this.shiftCooldown = this.maxShiftCooldown;
                input.keys['ShiftLeft'] = false;
                input.keys['ShiftRight'] = false;
            }
        }

        // Способность 2 (Space) – выстрел снарядом
        if (input.isDown('Space')) {
            if (this.spaceCooldown <= 0 && this.energy >= CONFIG.ABILITIES.SPACE_COST && !this.projectile) {
                this.fireProjectile(input);
                this.energy -= CONFIG.ABILITIES.SPACE_COST;
                this.spaceCooldown = this.maxSpaceCooldown;
            }
            input.keys['Space'] = false;
        }
    }

    fireProjectile(input = null) {
        let dirX = 0, dirY = 0;
        if (input && input.mouseActive) {
            const dir = input.getMouseDirection(this.x, this.y);
            dirX = dir.dx;
            dirY = dir.dy;
        } else {
            dirX = this.moveDirX || 0;
            dirY = this.moveDirY || 0;
        }
        const len = Math.sqrt(dirX * dirX + dirY * dirY);
        if (len > 0) { dirX /= len; dirY /= len; }
        else { dirX = 1; dirY = 0; }

        const speed = 8;
        const range = 800;
        this.projectile = {
            x: this.x,
            y: this.y,
            vx: dirX * speed,
            vy: dirY * speed,
            radius: this.radius,
            life: Math.floor(range / speed)
        };
    }

    // Телепорт в последнюю safe‑зону (используем lastSafeZone)
    useAbility1() {
        if (this.shiftCooldown > 0 || this.energy < CONFIG.ABILITIES.SHIFT_COST) return;
        this.x = this.lastSafeZone.x;
        this.y = this.lastSafeZone.y;
        this.teleportFreeze = 15;
        this.energy -= CONFIG.ABILITIES.SHIFT_COST;
        this.downed = false;
    }

    // Авто‑респавн тоже должен быть в последнюю safe‑зону
    respawn() {
        super.respawn(); // восстанавливает состояние, но перемещает в стандартную точку
        // Перемещаемся в последнюю safe‑зону
        this.x = this.lastSafeZone.x;
        this.y = this.lastSafeZone.y;
    }

    onAbility2Click() {
        if (this.spaceCooldown <= 0 && this.energy >= CONFIG.ABILITIES.SPACE_COST && !this.projectile) {
            this.fireProjectile(null);
            this.energy -= CONFIG.ABILITIES.SPACE_COST;
            this.spaceCooldown = this.maxSpaceCooldown;
        }
    }

    onAbility1Click() {
        this.useAbility1();
        this.shiftCooldown = this.maxShiftCooldown;
    }

    getAbilityDescriptions() {
        return this.getLocalizedAbilityDescriptions('mirage', {
            ability1: [this.maxShiftCooldown / 60, this.ability1Cost],
            ability2: [this.maxSpaceCooldown / 60, this.maxInvulnTime, this.ability2Cost]
        });
    }

    render(ctx) {
        super.render(ctx);

        if (this.projectile) {
            ctx.beginPath();
            ctx.arc(this.projectile.x, this.projectile.y, this.projectile.radius, 0, Math.PI * 2);
            ctx.fillStyle = '#00d9ff';
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }
}