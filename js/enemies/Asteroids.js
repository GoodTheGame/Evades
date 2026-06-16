// js/enemies/Asteroids.js
import { Enemy } from '../entities/Enemy.js';
import CONFIG from '../config.js';

// Обычный серый астероид
export class Asteroid extends Enemy {
    constructor(x, y) {
        super(x, y, {
            color: '#888888',
            radius: 14,
            speed: 1,
            xp: 10,
            type: 'asterdefault'
        });
        const angle = Math.random() * Math.PI * 2;
        this.baseSpeed = this.speed;          // запоминаем базовую скорость (можно менять через enemyConfigs)
        this._updateSpeedFromRadius();        // пересчитываем скорость под радиус
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;
    }

    // Метод, который ставит скорость в зависимости от текущего радиуса
    _updateSpeedFromRadius() {
        // Формула: скорость = базоваяСкорость * (20 / радиус)
        // Можно подкорректировать множитель (20) или степень
        this.speed = this.baseSpeed * (20 / this.radius);
        // Минимальная скорость 0.2, максимальная не ограничена, но радиус не меньше 1
        if (this.speed < 0.2) this.speed = 0.2;
    }
}

// Чёрный астероид, иммунный к способностям
export class AsterBlack extends Asteroid {
    constructor(x, y) {
        super(x, y);
        this.color = '#000000';
        this.type = 'asterblack';
        this.immuneToAbilities = true;
    }
}

// Базовый класс для врагов с аурой
export class AsterAura extends Asteroid {
    constructor(x, y, auraConfig = {}) {
        super(x, y);
        this.auraRadiusBase = auraConfig.radius || 120;
        this.auraColor = auraConfig.color || '#FF0000';
        this.auraEffect = auraConfig.effect || 'slow';
        this.auraValue = auraConfig.value || 0.5;
        this.auraDisabled = false;
        this.auraDisableTimer = 0;
        this.baseRadius = this.radius;
    }

    update(bounds, worldWidth, worldHeight, gameState = null) {
        if (this.disarmed) return;   // <-- вот это
        super.update(bounds, worldWidth, worldHeight, gameState);

        if (!gameState) return;
        if (gameState.areEnemiesDisabled) return;
        if (this.auraDisabled) {
            this.auraDisableTimer--;
            if (this.auraDisableTimer <= 0) this.auraDisabled = false;
            return;
        }

        const player = gameState.player;
        if (!player) return;
        if (gameState.isPlayerInSafeZone || gameState.isPlayerUnavailable) return;

        const scale = this.radius / this.baseRadius;
        const currentAuraRadius = this.auraRadiusBase * scale;

        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist <= currentAuraRadius) {
            if (this.auraEffect === 'pull' || this.auraEffect === 'push') {
                const angle = Math.atan2(player.y - this.y, player.x - this.x);
                // Масштабируем силу: чем больше шар, тем сильнее эффект (база 14 px)
                const strength = this.auraValue * (this.radius / 14);
                if (this.auraEffect === 'pull') {
                    player.pullForceX += Math.cos(angle) * strength;
                    player.pullForceY += Math.sin(angle) * strength;
                } else { // push
                    player.pullForceX -= Math.cos(angle) * strength;
                    player.pullForceY -= Math.sin(angle) * strength;
                }
            }
            this.applyEffect(player);
        }
    }

    applyEffect(player) {
        switch (this.auraEffect) {
            case 'slow':
                if (this.auraValue < player.slowFactor) {
                    player.slowFactor = this.auraValue;
                }
                break;
            case 'drain':
                player.energyDrainRate = Math.max(player.energyDrainRate || 0, this.auraValue);
                break;
            case 'silence':
                player.abilitiesBlocked = true;
                break;
        }
    }

    disableAura(seconds) {
        this.auraDisabled = true;
        this.auraDisableTimer = seconds * 60;
    }

    render(ctx) {
        if (this.disarmed) return; // не рисуем ауру, если враг обезврежен

        const scale = this.radius / this.baseRadius;
        const currentAuraRadius = this.auraRadiusBase * scale;
        ctx.beginPath();
        ctx.arc(this.x, this.y, currentAuraRadius, 0, Math.PI * 2);
        ctx.fillStyle = this.auraColor + '33';
        ctx.fill();
        super.render(ctx);
    }
}

// Красный шар – замедление (слабое)
export class AsterSlow extends AsterAura {
    constructor(x, y) {
        super(x, y, {
            color: '#FF0000',
            radius: 120,
            effect: 'slow',
            value: 0.5
        });
        this.color = '#FF0000';
        this.type = 'asterslow';
    }
}

// Тёмно-красный шар – сильное замедление (80%)
export class AsterCripple extends AsterAura {
    constructor(x, y) {
        super(x, y, {
            color: '#8B0000',
            radius: 120,
            effect: 'slow',
            value: 0.2
        });
        this.color = '#8B0000';
        this.type = 'astercripple';
    }
}

// Синий шар – отнимает энергию (0.25 ед./сек по умолчанию)
export class AsterDrain extends AsterAura {
    constructor(x, y) {
        super(x, y, {
            color: '#0000FF',
            radius: 120,
            effect: 'drain',
            value: 0.25
        });
        this.color = '#0000FF';
        this.type = 'asterdrain';
    }
}

// Салатовый шар – блокирует способности (№1 и №2)
export class AsterSilence extends AsterAura {
    constructor(x, y) {
        super(x, y, {
            color: '#7FFF00',
            radius: 120,
            effect: 'silence',
            value: true
        });
        this.color = '#7FFF00';
        this.type = 'astersilence';
    }
}

// Снайпер с задержкой прицеливания
export class AsterSniper extends Asteroid {
    constructor(x, y) {
        super(x, y);
        this.baseColor = '#CD7F32';
        this.aimColor = '#FF8C00';
        this.color = this.baseColor;
        this.type = 'astersniper';
        this.radius = 8;
        this._updateSpeedFromRadius(); // пересчитываем скорость под новый радиус
        this.baseRadius = this.radius;

        this.shootCooldown = 0;
        this.shootCooldownMax = 120;
        this.aimDelay = 36;
        this.aimTimer = 0;
        this.bulletSpeed = 6;
        this.sightRadius = 1000;
    }

    update(bounds, worldWidth, worldHeight, gameState = null) {
        if (this.disarmed) return;
        if (!gameState) {
            super.update(bounds, worldWidth, worldHeight, gameState);
            return;
        }

        const player = gameState.player;
        const canSee = player &&
            !gameState.isPlayerInSafeZone &&
            !gameState.isPlayerUnavailable;

        if (this.shootCooldown > 0) {
            this.shootCooldown--;
        }

        const canShoot = this.shootCooldown <= 0;

        if (canSee) {
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist <= this.sightRadius) {
                if (canShoot) {
                    this.aimTimer++;
                    this.color = this.aimColor;
                    this.radius = this.baseRadius * 1.2;

                    if (this.aimTimer >= this.aimDelay) {
                        this.shoot(gameState, player);
                        this.aimTimer = 0;
                        this.shootCooldown = this.shootCooldownMax;
                        this.color = this.baseColor;
                        this.radius = this.baseRadius;
                    }
                }
            } else {
                this.aimTimer = 0;
                this.color = this.baseColor;
                this.radius = this.baseRadius;
            }
        } else {
            this.aimTimer = 0;
            this.color = this.baseColor;
            this.radius = this.baseRadius;
        }

        super.update(bounds, worldWidth, worldHeight, gameState);
    }

    shoot(gameState, player) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist === 0) return;

        const bullet = {
            x: this.x,
            y: this.y,
            vx: (dx / dist) * this.bulletSpeed,
            vy: (dy / dist) * this.bulletSpeed,
            radius: 4,
            life: 180,
            color: '#FF8C00'
        };
        gameState.bullets.push(bullet);
    }
}

// Преследователь (коричневый) – теперь с проверкой прямой видимости
export class AsterChaser extends Asteroid {
    constructor(x, y) {
        super(x, y);
        this.color = '#8B4513';
        this.type = 'asterchaser';
        this.sightRadius = 400;
        this.radius = 12;
        this._updateSpeedFromRadius();
        this._wasChasing = false;
        this.speed = 2;
        const angle = Math.atan2(this.vy, this.vx);
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;
    }

    update(bounds, worldWidth, worldHeight, gameState = null) {
        if (this.disarmed) return;
        if (!gameState) {
            super.update(bounds, worldWidth, worldHeight, gameState);
            return;
        }

        const player = gameState.player;
        const canSee = player &&
            !gameState.isPlayerInSafeZone &&
            !gameState.isPlayerUnavailable;

        if (canSee) {
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist <= this.sightRadius && dist > 0) {
                // Проверка линии видимости через арену
                const blocked = gameState.arena && gameState.arena.blocksLineOfSight
                    ? gameState.arena.blocksLineOfSight(this.x, this.y, player.x, player.y)
                    : false;

                if (!blocked) {
                    // Видимость есть – преследуем
                    this.vx = (dx / dist) * this.speed;
                    this.vy = (dy / dist) * this.speed;
                    this._wasChasing = true;
                } else {
                    // Видимость заблокирована препятствием – прекращаем преследование
                    if (this._wasChasing) {
                        const angle = Math.random() * Math.PI * 2;
                        this.vx = Math.cos(angle) * this.speed;
                        this.vy = Math.sin(angle) * this.speed;
                        this._wasChasing = false;
                    }
                }
            } else {
                // Цель далеко – прекращаем преследование
                if (this._wasChasing) {
                    const angle = Math.random() * Math.PI * 2;
                    this.vx = Math.cos(angle) * this.speed;
                    this.vy = Math.sin(angle) * this.speed;
                    this._wasChasing = false;
                }
            }
        } else {
            // Игрок в safe‑зоне или недоступен – сбрасываем преследование
            if (this._wasChasing) {
                const angle = Math.random() * Math.PI * 2;
                this.vx = Math.cos(angle) * this.speed;
                this.vy = Math.sin(angle) * this.speed;
                this._wasChasing = false;
            }
        }

        super.update(bounds, worldWidth, worldHeight, gameState);
    }
}

// Синий ускоритель: замирает, потом рывок 4x
export class AsterDash extends Asteroid {
    constructor(x, y) {
        super(x, y);
        this.color = '#3498db';
        this.type = 'asterdash';
        this.baseSpeed = 1;
        this.speed = this.baseSpeed;
        this.radius = 12;
        this._updateSpeedFromRadius();
        this.dashSpeed = 10;

        this.dashCooldown = 120;
        this.warningTimer = 0;
        this.boostTimer = 0;
        this.warningDuration = 60;
        this.boostDuration = 180;
    }

    update(bounds, worldWidth, worldHeight, gameState = null) {
        if (this.disarmed) return;
        if (this.warningTimer > 0) {
            this.speed = 0;
            this.vx = 0;
            this.vy = 0;
            const pulse = Math.sin(this.warningTimer * 0.2) * 2;
            this.radius = (this.baseRadius || 12) + pulse;
            this.warningTimer--;
            if (this.warningTimer === 0) {
                this.speed = this.dashSpeed;
                this.boostTimer = this.boostDuration;
                this._updateVelocity();
            }
            return;
        } else if (this.boostTimer > 0) {
            this.boostTimer--;
            if (this.boostTimer === 0) {
                this.speed = this.baseSpeed;
                this._updateVelocity();
            }
            super.update(bounds, worldWidth, worldHeight, gameState);
            return;
        }

        this.dashCooldown--;
        if (this.dashCooldown <= 0) {
            this._savedAngle = Math.atan2(this.vy, this.vx);
            this.speed = 0;
            this.vx = 0;
            this.vy = 0;
            this.warningTimer = this.warningDuration;
            this.dashCooldown = 120;
            return;
        }

        super.update(bounds, worldWidth, worldHeight, gameState);
    }

    _updateVelocity() {
        const angle = this._savedAngle ?? Math.atan2(this.vy, this.vx);
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;
        this._savedAngle = null;
    }
}
// Светло-фиолетовый вытеснитель (push)
export class AsterPush extends AsterAura {
    constructor(x, y) {
        super(x, y, {
            color: '#a000a0',    // светло-фиолетовый
            radius: 120,
            effect: 'push',
            value: 0.25          // базовая сила (будет масштабироваться)
        });
        this.color = '#a000a0';
        this.type = 'asterpush';
    }
}

// Тёмно-фиолетовый притяжатель (pull)
export class AsterPull extends AsterAura {
    constructor(x, y) {
        super(x, y, {
            color: '#800080',    // тёмно-фиолетовый
            radius: 120,
            effect: 'pull',
            value: 0.25
        });
        this.color = '#800080';
        this.type = 'asterpull';
    }
}

// Гипер-притяжатель (очень сильный pull)
export class AsterHyperPull extends AsterAura {
    constructor(x, y) {
        super(x, y, {
            color: '#4B0082',    // ещё темнее
            radius: 120,
            effect: 'pull',
            value: 0.75
        });
        this.color = '#4B0082';
        this.type = 'asterhyperpull';
    }
}
// Пила (полностью управляется ареной через setPosition)
export class AsterSaw extends Enemy {
    constructor(x, y, config = {}) {
        super(x, y, {
            color: config.color || '#000000',
            radius: config.radius || 20,
            speed: config.speed || 2,
            xp: 15,
            type: 'astersaw',
            immuneToAbilities: true
        });
    }

    setPosition(x, y) {
        this.x = x;
        this.y = y;
    }

    update(bounds, worldWidth, worldHeight, gameState = null) {
        // Ничего не делаем – движение полностью управляется из Arena._updateSaws()
    }
}