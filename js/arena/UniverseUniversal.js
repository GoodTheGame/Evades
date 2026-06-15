// js/arena/UniverseUniversal.js
import { Arena } from './Arena.js';
import { Portal } from '../Portal.js';
import CONFIG from '../config.js';
import { XPOrb } from '../XPOrb.js';
import {
    Asteroid, AsterBlack, AsterSniper, AsterChaser, AsterDash,
    AsterSlow, AsterCripple, AsterDrain, AsterSilence
} from '../enemies/Asteroids.js';

export class UniverseUniversal extends Arena {
    constructor(areaNumber) {
        super(areaNumber);

        // ---------- Размеры вселенной ----------
        this.width = 3000;
        this.height = 500;

        // ---------- Переопределяем safe-зоны ----------
        this.leftSafeZone = {
            start: 0,
            end: CONFIG.PORTAL.WIDTH + CONFIG.SAFE_ZONE.WIDTH
        };
        this.rightSafeZone = {
            start: this.width - CONFIG.PORTAL.WIDTH - CONFIG.SAFE_ZONE.WIDTH,
            end: this.width
        };

this.displayName = `Универсальная Вселенная ${this.areaNumber}`;
        // ---------- Инициализация ----------
        this.enemyTypes = [];
        this.enemyConfigs = {};
        this.maxOrbs = 200; // лимит орбов

        // Сначала настраиваем врагов (пока без пил)
        this._setupEnemiesForArea();

        // Затем добавляем пилы в зависимости от уровня
        this._setupSawsForArea();

        // Если это не золотая арена, добавляем пилы в enemyTypes
        if (!this._isGoldenArea() && this.sawProfiles.length > 0) {
            const totalSaws = this.sawProfiles.reduce((sum, p) => sum + p.count, 0);
            this.enemyTypes.push({ type: 'astersaw', max: totalSaws, weight: 1 });
            // Инициализируем счётчики пил, чтобы они появились при первом же спавне
            this._initSawCounters();
        }

        // ---------- Порталы ----------
        if (this._isGoldenArea()) {
            const finishPortal = new Portal(
                this.width - CONFIG.PORTAL.WIDTH,
                0,
                'forward',
                {
                    onEnter: (gameEngine) => {
                        if (this.areaNumber === 41) {
                            alert('Вы прошли Универсальную Вселенную! Frozen разблокирован.');
                            gameEngine.unlockHero('frozen');
                        } else if (this.areaNumber === 81) {
                            alert('Вы прошли Универсальную Вселенную! Pulsar разблокирован.');
                            gameEngine.unlockHero('pulsar');
                        }
                        gameEngine.loadUniverse('Hub');
                    }
                }
            );
            this.portals = [finishPortal];
        } else {
            const forwardPortal = new Portal(
                this.width - CONFIG.PORTAL.WIDTH,
                0,
                'forward'
            );
            this.portals = [forwardPortal];
            if (this.areaNumber > 1) {
                const backwardPortal = new Portal(0, 0, 'backward');
                this.portals.push(backwardPortal);
            }
        }
    }

    // ---------- Границы ----------
    getEnemySpawnBounds() {
        return {
            minX: this.leftSafeZone.end + 50,
            maxX: this.rightSafeZone.start - 50,
            minY: 50,
            maxY: this.height - 50
        };
    }

    getEnemyMovementBounds() {
        return {
            minX: this.leftSafeZone.end,
            maxX: this.rightSafeZone.start,
            minY: 0,
            maxY: this.height
        };
    }

    getSawBounds() {
        return {
            left: this.leftSafeZone.end,
            right: this.rightSafeZone.start,
            top: 0,
            bottom: this.height
        };
    }

    _isGoldenArea() {
        return this.areaNumber === 41 || this.areaNumber === 81;
    }

    // ---------- Настройка пил по уровням ----------
    _setupSawsForArea() {
        const a = this.areaNumber;
        this.sawProfiles = [];

        if (a >= 1 && a <= 20) {
            this.sawProfiles = [
                { count: 20, config: { direction: 'cw', speed: 2.5 } }
            ];
        } else if (a >= 21 && a <= 40) {
            this.sawProfiles = [
                { count: 20, config: { direction: 'cw', speed: 2.5 } },
                { count: 20, config: { direction: 'ccw', speed: 2.5 } }
            ];
        } else if (a >= 41 && a <= 60) {
            this.sawProfiles = [
                { count: 20, config: { direction: 'cw', speed: 2.5 } },
                { count: 20, config: { direction: 'ccw', speed: 2.5 } },
                { count: 10, config: { direction: 'cw', speed: 2.5, radius: 60 } }
            ];
        } else if (a >= 61 && a <= 70) {
            this.sawProfiles = [
                { count: 20, config: { direction: 'cw', speed: 2.5 } },
                { count: 20, config: { direction: 'ccw', speed: 2.5 } },
                { count: 10, config: { direction: 'cw', speed: 2.5, radius: 60 } },
                { count: 20, config: { direction: 'ccw', speed: 6, radius: 12 } }
            ];
        } else if (a >= 71 && a <= 79) {
            this.sawProfiles = [
                { count: 30, config: { direction: 'cw', speed: 2.5 } },
                { count: 30, config: { direction: 'ccw', speed: 2.5 } },
                { count: 30, config: { direction: 'cw', speed: 2.5, radius: 60 } },
                { count: 30, config: { direction: 'ccw', speed: 2.5, radius: 60 } },
                { count: 10, config: { direction: 'cw', speed: 10, radius: 12 } }
            ];
        } else if (a === 80) {
            this.sawProfiles = [
                { count: 50, config: { direction: 'cw', speed: 4, radius: 100 } },
                { count: 10, config: { direction: 'ccw', speed: 14, radius: 12 } }
            ];
        }
    }

    // ---------- Настройка врагов ----------
    _setupEnemiesForArea() {
        const a = this.areaNumber;
        this.enemyTypes = [];
        this.enemyConfigs = {};

        let baseSpeed = 3;
        if (a <= 40) {
            baseSpeed = Math.min(6, 3 + (a - 1) * 0.1);
        } else {
            baseSpeed = 7;
        }
        const bossRadius = 35;   // <-- уменьшено с 50 до 35

        // ---------- Уровни 1-10 ----------
        if (a >= 1 && a <= 10) {
            let normalCount = 10 + (a - 1) * 5;
            if (a === 10) {
                this.enemyTypes = [
                    { type: 'asterdefault', max: 40, weight: 1 },
                    { type: 'asterdefault_big', max: 10, weight: 1 }
                ];
                this.enemyConfigs['asterdefault'] = { speed: baseSpeed, radius: 14 };
                this.enemyConfigs['asterdefault_big'] = { speed: baseSpeed, radius: bossRadius };
            } else {
                this.enemyTypes = [
                    { type: 'asterdefault', max: normalCount, weight: 1 }
                ];
                const rad = (a >= 3) ? 14 + Math.floor(Math.random() * 11) : 14;
                this.enemyConfigs['asterdefault'] = { speed: baseSpeed, radius: rad };
            }
        }

        // ---------- Уровни 11-20 ----------
        else if (a >= 11 && a <= 20) {
            let normalCount = 20 + (a - 11) * 5;
            let dashCount = Math.floor((a - 10) * 2);
            if (a === 20) {
                this.enemyTypes = [
                    { type: 'asterdefault', max: 30, weight: 1 },
                    { type: 'asterdash', max: 20, weight: 1 }
                ];
                this.enemyConfigs['asterdash'] = { baseSpeed: baseSpeed };
            } else {
                this.enemyTypes = [
                    { type: 'asterdefault', max: normalCount, weight: 1 },
                    { type: 'asterdash', max: dashCount, weight: 1 }
                ];
            }
        }

        // ---------- Уровни 21-30 ----------
        else if (a >= 21 && a <= 30) {
            let normalCount = 20 + (a - 21) * 2;
            let chaserCount = 5 + Math.floor((a - 20) * 2);
            if (a === 30) {
                this.enemyTypes = [
                    { type: 'asterdefault_big', max: 20, weight: 1 },
                    { type: 'asterchaser_big', max: 10, weight: 1 }
                ];
                this.enemyConfigs['asterdefault_big'] = { radius: bossRadius, speed: baseSpeed };
                this.enemyConfigs['asterchaser_big'] = { radius: bossRadius, speed: baseSpeed };
            } else {
                this.enemyTypes = [
                    { type: 'asterdefault', max: normalCount, weight: 1 },
                    { type: 'asterchaser', max: chaserCount, weight: 1 }
                ];
            }
        }

        // ---------- Уровни 31-35 ----------
        else if (a >= 31 && a <= 35) {
            let sniperCount = 5 + (a - 30) * 5;
            if (a === 35) {
                this.enemyTypes = [
                    { type: 'astersniper', max: 30, weight: 1 }
                ];
            } else {
                this.enemyTypes = [
                    { type: 'astersniper', max: sniperCount, weight: 1 }
                ];
            }
        }

        // ---------- Уровни 36-40 ----------
        else if (a >= 36 && a <= 40) {
            if (a === 36) {
                this.enemyTypes = [
                    { type: 'asterdefault_big', max: 20, weight: 1 }
                ];
                this.enemyConfigs['asterdefault_big'] = { radius: bossRadius, speed: baseSpeed };
            } else if (a === 37) {
                this.enemyTypes = [
                    { type: 'asterdefault_big', max: 10, weight: 1 },
                    { type: 'asterdash', max: 20, weight: 1 }
                ];
                this.enemyConfigs['asterdefault_big'] = { radius: bossRadius, speed: baseSpeed };
                this.enemyConfigs['asterdash'] = { baseSpeed: baseSpeed };
            } else if (a === 38) {
                this.enemyTypes = [
                    { type: 'asterdefault_big', max: 10, weight: 1 },
                    { type: 'asterdash', max: 15, weight: 1 },
                    { type: 'asterchaser', max: 15, weight: 1 }
                ];
            } else if (a === 39) {
                this.enemyTypes = [
                    { type: 'asterdefault_big', max: 10, weight: 1 },
                    { type: 'asterdash', max: 10, weight: 1 },
                    { type: 'asterchaser', max: 10, weight: 1 },
                    { type: 'astersniper', max: 20, weight: 1 }
                ];
            } else if (a === 40) {
                this.enemyTypes = [
                    { type: 'asterdefault_big', max: 20, weight: 1 },
                    { type: 'asterdash', max: 10, weight: 1 },
                    { type: 'asterchaser', max: 10, weight: 1 },
                    { type: 'astersniper', max: 10, weight: 1 }
                ];
                this.enemyConfigs = {
                    'asterdefault_big': { radius: bossRadius, speed: baseSpeed },
                    'asterdash': { baseSpeed: baseSpeed },
                    'asterchaser': { speed: baseSpeed },
                    'astersniper': { speed: baseSpeed }
                };
            }
        }

        // ---------- Уровни 41-50 ----------
        else if (a >= 41 && a <= 50) {
            let blackCount = 10 + (a - 41) * 3;
            this.enemyTypes = [
                { type: 'asterblack', max: blackCount, weight: 1 }
            ];
            if (a >= 46) {
                const slowCount = (a - 45) * 3;
                this.enemyTypes.push({ type: 'asterslow', max: slowCount, weight: 1 });
            }
            if (a === 50) {
                this.enemyTypes = [
                    { type: 'asterblack_big', max: 20, weight: 1 },
                    { type: 'astercripple', max: 20, weight: 1 }
                ];
                this.enemyConfigs['asterblack_big'] = { radius: bossRadius, speed: baseSpeed };
                this.enemyConfigs['astercripple'] = { auraValue: 0.2 };
            }
        }

        // Установим глобальную скорость для всех обычных врагов
        for (const t of this.enemyTypes) {
            if (!this.enemyConfigs[t.type]) this.enemyConfigs[t.type] = {};
            if (!this.enemyConfigs[t.type].speed) this.enemyConfigs[t.type].speed = baseSpeed;
        }
    }

    // ---------- Спавн врагов (исправлено: тип врага теперь соответствует заявленному) ----------
    spawnEnemyOfType(type, gameState, areaLevel = 1) {
        if (this._isGoldenArea()) return null;

        const bounds = this.getEnemySpawnBounds();
        const x = bounds.minX + Math.random() * (bounds.maxX - bounds.minX);
        const y = bounds.minY + Math.random() * (bounds.maxY - bounds.minY);

        let enemy;
        switch (type) {
            case 'asterdefault': enemy = new Asteroid(x, y); break;
            case 'asterblack': enemy = new AsterBlack(x, y); break;
            case 'astersniper': enemy = new AsterSniper(x, y); break;
            case 'asterchaser': enemy = new AsterChaser(x, y); break;
            case 'asterdash': enemy = new AsterDash(x, y); break;
            case 'asterslow': enemy = new AsterSlow(x, y); break;
            case 'astercripple': enemy = new AsterCripple(x, y); break;
            case 'asterdrain': enemy = new AsterDrain(x, y); break;
            case 'astersilence': enemy = new AsterSilence(x, y); break;

            case 'asterdefault_big':
                enemy = new Asteroid(x, y);
                enemy.radius = this.enemyConfigs[type]?.radius || 35;
                enemy.type = type;          // <-- чтобы fillEnemiesToLimit видел
                break;
            case 'asterblack_big':
                enemy = new AsterBlack(x, y);
                enemy.radius = this.enemyConfigs[type]?.radius || 35;
                enemy.type = type;
                break;
            case 'asterchaser_big':
                enemy = new AsterChaser(x, y);
                enemy.radius = this.enemyConfigs[type]?.radius || 35;
                enemy.type = type;
                break;

            case 'astersaw': return null;
            default: return null;
        }

        if (this.enemyConfigs[type]) {
            const config = this.enemyConfigs[type];
            const oldSpeed = enemy.speed;
            Object.assign(enemy, config);
            if (config.speed && enemy.speed !== oldSpeed && enemy.speed > 0) {
                const currentAngle = Math.atan2(enemy.vy, enemy.vx);
                enemy.vx = Math.cos(currentAngle) * enemy.speed;
                enemy.vy = Math.sin(currentAngle) * enemy.speed;
            }
            if (enemy.type === 'asterdash' && config.baseSpeed) {
                enemy.baseSpeed = config.baseSpeed;
                enemy.speed = config.baseSpeed;
                const angle = Math.atan2(enemy.vy, enemy.vx);
                enemy.vx = Math.cos(angle) * enemy.speed;
                enemy.vy = Math.sin(angle) * enemy.speed;
            }
        }

        gameState.enemies.push(enemy);
        return enemy;
    }

    // ---------- Орбы: всегда 200 при старте и при переходе ----------
    spawnInitialXPOrbs(count, gameState) {
        // Всегда заполняем до лимита
        for (let i = 0; i < this.maxOrbs; i++) {
            if (gameState.xpOrbs.length >= this.maxOrbs) break;
            this.spawnRandomXPOrb(gameState);
        }
    }

    spawnRandomXPOrb(gameState) {
        if (gameState.xpOrbs.length >= this.maxOrbs) return;
        if (this._isGoldenArea()) {
            const bounds = this.getEnemySpawnBounds();
            const x = bounds.minX + Math.random() * (bounds.maxX - bounds.minX);
            const y = bounds.minY + Math.random() * (bounds.maxY - bounds.minY);
            gameState.xpOrbs.push(new XPOrb(x, y, 500));
            return;
        }
        super.spawnRandomXPOrb(gameState);
    }

    spawnXPOrbAt(x, y, amount, gameState) {
        if (gameState.xpOrbs.length >= this.maxOrbs) return;
        gameState.xpOrbs.push(new XPOrb(x, y, amount));
    }
}