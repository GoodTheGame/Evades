// js/heroes/Pulsar.js
import { Player } from '../entities/Player.js';
import CONFIG from '../config.js';

export class Pulsar extends Player {
    constructor(x, y) {
        super(x, y);
        this.heroId = 'pulsar';
        this.heroColor = '#800080';
        this.ability1Cost = 30;
        this.ability2Cost = 30;

        this.projectile = null;
        this.gravityZone = null;
        this.ignoreZone = null;
        this.passiveTimer = 0;

        this.updateAbilityStats();
    }

    updateAbilityStats() {
        const zoneRadii = [100, 125, 150, 175, 200];
        this.zoneRadius = zoneRadii[this.ability1Level - 1] || 100;
        this.maxShiftCooldown = 15 * 60;

        const ignoreRadii = [50, 75, 100, 125, 150];
        this.ignoreRadius = ignoreRadii[this.ability2Level - 1] || 50;
        this.maxSpaceCooldown = 12 * 60;
    }

    updateAbilityCooldowns() {
        this.updateAbilityStats();
    }

    update(input, gameState, arena = null) {
        super.update(input, gameState, arena);

        // --- Обновление активных способностей (всегда, даже после смерти) ---

        // Снаряд и зона (способность 1)
        if (this.projectile) {
            const p = this.projectile;
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
            if (p.life <= 0) {
                this.createGravityZone(gameState, p.x, p.y);
                this.projectile = null;
            }
        }

        if (this.gravityZone) {
            const zone = this.gravityZone;
            zone.timer--;
            if (zone.timer <= 0) {
                for (let enemy of zone.enemies) {
                    enemy.disarmed = false;
                    const angle = Math.random() * Math.PI * 2;
                    const speed = enemy.speed || 1;
                    enemy.vx = Math.cos(angle) * speed;
                    enemy.vy = Math.sin(angle) * speed;
                }
                this.gravityZone = null;
            } else {
                for (let enemy of gameState.enemies) {
                    if (enemy.immuneToAbilities || enemy.type === 'asterblack' || enemy.type === 'astersaw') continue;
                    const dx = enemy.x - zone.x;
                    const dy = enemy.y - zone.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist <= zone.radius) {
                        if (!zone.enemies.has(enemy)) {
                            zone.enemies.add(enemy);
                            enemy.disarmed = true;
                        }
                        enemy.x = zone.x;
                        enemy.y = zone.y;
                        enemy.vx = 0;
                        enemy.vy = 0;
                    }
                }
            }
        }

        // Зона игнорирования (способность 2)
        if (this.ignoreZone) {
            this.ignoreZone.timer--;
            if (this.ignoreZone.timer <= 0) {
                this.ignoreZone = null;
            }
        }

        // --- Дальше только если игрок жив ---
        if (this.downed) return;
        if (this.abilitiesBlocked) return;

        // Пассивка
        this.passiveTimer++;
        if (this.passiveTimer >= 120 && gameState.enemies) {
            this.passiveTimer = 0;
            for (let enemy of gameState.enemies) {
                if (enemy.immuneToAbilities || enemy.type === 'asterblack' || enemy.type === 'astersaw') continue;
                const dx = enemy.x - this.x;
                const dy = enemy.y - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist <= 100 && Math.random() < 0.3) {
                    const angle = Math.random() * Math.PI * 2;
                    const speed = enemy.speed || 1;
                    enemy.vx = Math.cos(angle) * speed;
                    enemy.vy = Math.sin(angle) * speed;
                }
            }
        }

        // ---------- Управление способностями ----------
        if (input.isDown('ShiftLeft') || input.isDown('ShiftRight')) {
            if (this.shiftCooldown <= 0 && this.energy >= this.ability1Cost && !this.projectile && !this.gravityZone) {
                let dirX = 0, dirY = 0;
                if (input.mouseActive) {
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
                const range = 500;
                this.projectile = {
                    x: this.x,
                    y: this.y,
                    vx: dirX * speed,
                    vy: dirY * speed,
                    radius: this.radius,
                    life: Math.floor(range / speed)
                };
                this.energy -= this.ability1Cost;
                this.shiftCooldown = this.maxShiftCooldown;
                input.keys['ShiftLeft'] = false;
                input.keys['ShiftRight'] = false;
            }
        }

        if (input.isDown('Space')) {
            if (this.spaceCooldown <= 0 && this.energy >= this.ability2Cost && !this.ignoreZone) {
                this.ignoreZone = {
                    x: this.x,
                    y: this.y,
                    radius: this.ignoreRadius,
                    timer: 3 * 60
                };
                this.energy -= this.ability2Cost;
                this.spaceCooldown = this.maxSpaceCooldown;
            }
            input.keys['Space'] = false;
        }
    }

    onAbility1Click() {
        if (this.shiftCooldown <= 0 && this.energy >= this.ability1Cost && !this.projectile && !this.gravityZone) {
            let dirX = 0, dirY = 0;
            if (this._lastGameState?.input?.mouseActive) {
                const dir = this._lastGameState.input.getMouseDirection(this.x, this.y);
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
            const range = 500;
            this.projectile = {
                x: this.x,
                y: this.y,
                vx: dirX * speed,
                vy: dirY * speed,
                radius: this.radius,
                life: Math.floor(range / speed)
            };
            this.energy -= this.ability1Cost;
            this.shiftCooldown = this.maxShiftCooldown;
        }
    }

    onAbility2Click() {
        if (this.spaceCooldown <= 0 && this.energy >= this.ability2Cost && !this.ignoreZone) {
            this.ignoreZone = {
                x: this.x,
                y: this.y,
                radius: this.ignoreRadius,
                timer: 3 * 60
            };
            this.energy -= this.ability2Cost;
            this.spaceCooldown = this.maxSpaceCooldown;
        }
    }

    createGravityZone(gameState, x, y) {
        this.gravityZone = {
            x, y,
            radius: this.zoneRadius,
            timer: 4 * 60,
            enemies: new Set()
        };
    }

    getAbilityDescriptions() {
        return this.getLocalizedAbilityDescriptions('pulsar', {
            ability1: [this.zoneRadius, this.ability1Cost],
            ability2: [this.ignoreRadius, this.ability2Cost]
        });
    }

    render(ctx) {
        super.render(ctx);

        if (this.projectile) {
            ctx.beginPath();
            ctx.arc(this.projectile.x, this.projectile.y, this.projectile.radius, 0, Math.PI * 2);
            ctx.fillStyle = '#800080';
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        if (this.gravityZone) {
            const zone = this.gravityZone;
            ctx.beginPath();
            ctx.arc(zone.x, zone.y, zone.radius, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(128, 0, 128, 0.2)';
            ctx.fill();
            ctx.strokeStyle = '#800080';
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        if (this.ignoreZone) {
            const zone = this.ignoreZone;
            const progress = zone.timer / (3 * 60);
            const alpha = 0.2 * progress;
            ctx.beginPath();
            ctx.arc(zone.x, zone.y, zone.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(128, 0, 128, ${alpha})`;
            ctx.fill();
            ctx.strokeStyle = '#800080';
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        // Пассивная аура
        ctx.beginPath();
        ctx.arc(this.x, this.y, 100, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(128, 0, 128, 0.05)';
        ctx.fill();
    }
}