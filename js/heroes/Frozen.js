// js/heroes/Frozen.js
import { Player } from '../entities/Player.js';
import CONFIG from '../config.js';

export class Frozen extends Player {
    constructor(x, y) {
        super(x, y);
        this.heroId = 'frozen';
        this.heroColor = '#003366';   // тёмно-синий
        this.autoRespawn = false;

        this.ability1Cost = 10;       // заморозка
        this.ability2Cost = 2;        // аура (для тултипа, реальный расход 2/сек)

        this.shieldHealth = 1;
        this.shieldActive = true;     // щит активен при старте
        this.shieldCooldown = 0;
        this.shieldCooldownMax = 20 * 60;

        this.slowAuraActive = false;
        this.slowAuraTimer = 0;

        this.freezeAimActive = false;

        this.updateAbilityStats();
    }

    updateAbilityStats() {
        const freezeRadii = [80, 100, 120, 150, 200];
        const freezeDurations = [1, 1.2, 1.5, 1.75, 2];
        this.freezeRadius = freezeRadii[this.ability1Level - 1] || 80;
        this.freezeDuration = freezeDurations[this.ability1Level - 1] || 1;
        this.maxShiftCooldown = 3 * 60;

        const slowRadii = [50, 75, 100, 125, 150];
        const slowPercentages = [0.70, 0.65, 0.60, 0.55, 0.50];
        this.slowAuraRadius = slowRadii[this.ability2Level - 1] || 50;
        this.slowAuraFactor = slowPercentages[this.ability2Level - 1] || 0.70;
    }

    updateAbilityCooldowns() {
        this.updateAbilityStats();
    }

    // Переопределяем только для щита, базовые кулдауны тикают в Player
    updateCooldowns() {
        super.updateCooldowns();
        if (!this.shieldActive && this.shieldCooldown > 0) {
            this.shieldCooldown--;
            if (this.shieldCooldown <= 0) {
                this.shieldActive = true;
                this.shieldHealth = 1;
            }
        }
    }

    update(input, gameState, arena = null) {
        super.update(input, gameState, arena);   // здесь _lastGameState, кулдауны, движение
        if (this.downed) return;
        if (this.abilitiesBlocked) return;

        // ----- Заморозка (Shift) -----
        const shiftPressed = input.isDown('ShiftLeft') || input.isDown('ShiftRight');
        if (shiftPressed) {
            if (!this.freezeAimActive) {
                // Первое нажатие: показать область (всегда, даже при кулдауне)
                this.freezeAimActive = true;
                input.keys['ShiftLeft'] = false;
                input.keys['ShiftRight'] = false;
            } else {
                // Второе нажатие: либо активировать, либо отменить
                if (this.shiftCooldown <= 0 && this.energy >= this.ability1Cost) {
                    this.useFreeze(gameState);
                    this.shiftCooldown = this.maxShiftCooldown;
                    this.freezeAimActive = false;
                } else {
                    // Не готовы – отменяем прицеливание
                    this.freezeAimActive = false;
                }
                input.keys['ShiftLeft'] = false;
                input.keys['ShiftRight'] = false;
            }
        }

        // ----- Аура замедления (Space) -----
        if (input.isDown('Space')) {
            this.slowAuraActive = !this.slowAuraActive;
            input.keys['Space'] = false;
        }

        // Обработка ауры
        const affectedEnemies = new Set();
        if (this.slowAuraActive) {
            this.slowAuraTimer++;
            if (this.slowAuraTimer >= 60) {
                this.slowAuraTimer = 0;
                if (this.energy >= 2) {
                    this.energy -= 2;
                } else {
                    this.slowAuraActive = false;
                }
            }
            if (gameState.enemies && this.slowAuraActive) {
                for (let enemy of gameState.enemies) {
                    const dx = enemy.x - this.x;
                    const dy = enemy.y - this.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist <= this.slowAuraRadius) {
                        enemy.slowFactor = this.slowAuraFactor;
                        affectedEnemies.add(enemy);
                    }
                }
            }
        }

        if (gameState.enemies) {
            for (let enemy of gameState.enemies) {
                if (!affectedEnemies.has(enemy)) {
                    enemy.slowFactor = 1;
                }
            }
        }
    }

    useFreeze(gameState) {
        this.energy -= this.ability1Cost;
        const freezeTime = Math.floor(this.freezeDuration * 60);
        for (let enemy of gameState.enemies) {
            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist <= this.freezeRadius) {
                enemy.frozen = true;
                enemy.frozenTimer = freezeTime;
            }
        }
    }

    onDamage(gameEngine) {
        if (this.godMode) return;
        if (this.shieldHealth > 0) {
            this.shieldHealth--;
            if (this.shieldHealth <= 0) {
                this.shieldActive = false;
                this.shieldCooldown = this.shieldCooldownMax;
            }
            this.invulnerable = true;
            this.invulnerableTime = 60;
            return;
        }
        gameEngine.playerDies();
    }

    getAbilityDescriptions() {
        return this.getLocalizedAbilityDescriptions('frozen', {
            ability1: [this.freezeRadius, this.freezeDuration, this.ability1Cost],
            ability2: [this.slowAuraRadius, (100 - this.slowAuraFactor * 100).toFixed(0), '2']
        });
    }

    onAbility1Click() {
        if (this.shiftCooldown <= 0 && this.energy >= this.ability1Cost) {
            if (!this.freezeAimActive) {
                this.freezeAimActive = true;
            } else {
                this.useFreeze(this._lastGameState);
                this.freezeAimActive = false;
                this.shiftCooldown = this.maxShiftCooldown;
            }
        } else if (this.freezeAimActive) {
            this.freezeAimActive = false; // отмена по клику
        }
    }

    onAbility2Click() {
        this.slowAuraActive = !this.slowAuraActive;
    }

    render(ctx) {
        super.render(ctx);

        // Ореол щита
        if (this.shieldActive) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius + 4, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(51, 153, 255, 0.3)';
            ctx.fill();
            ctx.strokeStyle = '#3399ff';
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        // Область прицеливания заморозки
        if (this.freezeAimActive) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.freezeRadius, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0, 255, 255, 0.15)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(0, 255, 255, 0.8)';
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        // Аура замедления
        if (this.slowAuraActive) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.slowAuraRadius, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0, 100, 255, 0.2)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(0, 150, 255, 0.8)';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }
}