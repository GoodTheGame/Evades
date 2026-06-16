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

        this.width = 3000;
        this.height = 600;

        this.leftSafeZone = {
            start: 0,
            end: CONFIG.PORTAL.WIDTH + CONFIG.SAFE_ZONE.WIDTH
        };
        this.rightSafeZone = {
            start: this.width - CONFIG.PORTAL.WIDTH - CONFIG.SAFE_ZONE.WIDTH,
            end: this.width
        };

        // ---------- ПОБЕДНАЯ АРЕНА (41) ----------
        if (areaNumber === 41) {
            this.displayName = 'VICTORY!';
            this.maxOrbs = 500;
            this._goldenOrbTimer = 0;
            this._goldenOrbInterval = 12;
            this._goldenOrbBatch = 5;
            this.enemyTypes = [];
            this.sawProfiles = [];
            this.enemyConfigs = {};

            const backPortal = new Portal(0, 0, 'backward', {
                onEnter: (gameEngine) => {
                    gameEngine.areaNumber = 40;
                    gameEngine.loadUniverse('Universal');
                    gameEngine.player.x = gameEngine.currentUniverse.width 
                                          - CONFIG.PORTAL.WIDTH - gameEngine.player.radius;
                    gameEngine.player.y = gameEngine.currentUniverse.height / 2;
                    gameEngine.player.teleportFreeze = 15;
                }
            });
            const forwardPortal = new Portal(
                this.width - CONFIG.PORTAL.WIDTH, 0, 'forward',
                {
                    onEnter: (gameEngine) => {
                        gameEngine.areaNumber++;
                        gameEngine.loadUniverse('Universal');
                        gameEngine.player.x = CONFIG.PORTAL.WIDTH + gameEngine.player.radius;
                        gameEngine.player.y = gameEngine.currentUniverse.height / 2;
                        gameEngine.player.teleportFreeze = 15;
                    }
                }
            );
            this.portals = [backPortal, forwardPortal];
            return;
        }

        // ---------- ОБЫЧНАЯ / БОСС АРЕНА ----------
        this.displayName = `Универсальная Вселенная ${this.areaNumber}`;
        this.enemyTypes = [];
        this.enemyConfigs = {};
        this.maxOrbs = 200;

        this._setupEnemiesForArea();
        this._setupSawsForArea();

        if (!this._isGoldenArea() && this.sawProfiles.length > 0) {
            const totalSaws = this.sawProfiles.reduce((sum, p) => sum + p.count, 0);
            this.enemyTypes.push({ type: 'astersaw', max: totalSaws, weight: 1 });
            this._initSawCounters();
        }

        // Порталы
        if (this._isGoldenArea()) {
            const finishPortal = new Portal(
                this.width - CONFIG.PORTAL.WIDTH, 0, 'forward',
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
            const forwardPortal = new Portal(this.width - CONFIG.PORTAL.WIDTH, 0, 'forward');
            this.portals = [forwardPortal];
            if (this.areaNumber > 1) {
                this.portals.push(new Portal(0, 0, 'backward'));
            }
        }
    }

    // ------------------------------------------------------------
    //  ГРАНИЦЫ
    // ------------------------------------------------------------
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

    // ------------------------------------------------------------
    //  ПИЛЫ
    // ------------------------------------------------------------
    _setupSawsForArea() {
        const a = this.areaNumber;
        this.sawProfiles = [];

        if (a >= 1 && a <= 20) {
            this.sawProfiles = [{ count: 20, config: { direction: 'cw', speed: 2.5 } }];
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
                { count: 10, config: { direction: 'cw', speed: 3 } },
                { count: 10, config: { direction: 'ccw', speed: 3 } },
                { count: 5, config: { direction: 'cw', speed: 2, radius: 50 } },   
                { count: 5, config: { direction: 'ccw', speed: 2, radius: 50 } }, 
                { count: 6, config: { direction: 'cw', speed: 0.5, radius: 70 } },   
                { count: 6, config: { direction: 'ccw', speed: 0.5, radius: 70 } },   
                { count: 15, config: { direction: 'cw', speed: 10, radius: 12 } }
            ];
        } else if (a === 80) {
            this.sawProfiles = [
                { count: 10, config: { direction: 'cw', speed: 2, radius: 80 } },
                { count: 10, config: { direction: 'ccw', speed: 2, radius: 80 } },
                { count: 10, config: { direction: 'ccw', speed: 14, radius: 12 } }
            ];
        }
    }

    // ------------------------------------------------------------
    //  ВРАГИ
    // ------------------------------------------------------------
    _setupEnemiesForArea() {
        const a = this.areaNumber;
        this.enemyTypes = [];
        this.enemyConfigs = {};

        let baseSpeed = 3;
        if (a <= 40) baseSpeed = Math.min(6, 3 + (a - 1) * 0.1);
        else baseSpeed = 7;

        const bossRadius = 35;

        // ---------- 1-10 ----------
        if (a >= 1 && a <= 10) {
            let normalCount = 10 + (a - 1) * 5;
            if (a === 10) {
                this.displayName = `Универсальная Вселенная ${a} (BOSS)`;
                this.enemyTypes = [
                    { type: 'asterdefault', max: 40, weight: 1 },
                    { type: 'asterdefault_big', max: 10, weight: 1 }
                ];
                this.enemyConfigs['asterdefault'] = { baseSpeed: 4, radiusMin: 14, radiusMax: 25 };
                this.enemyConfigs['asterdefault_big'] = { baseSpeed: 6, radiusMin: bossRadius, radiusMax: bossRadius + 10 };
            } else {
                this.enemyTypes = [{ type: 'asterdefault', max: normalCount, weight: 1 }];
                const bs = (a >= 5) ? Math.min(6, 1 + a * 0.1) : 1;
                this.enemyConfigs['asterdefault'] = {
                    baseSpeed: bs,
                    radius: (a >= 3) ? undefined : 14,
                    radiusMin: (a >= 3) ? 14 : undefined,
                    radiusMax: (a >= 3) ? 25 : undefined,
                };
            }
        }

        // ---------- 11-20 ----------
        else if (a >= 11 && a <= 20) {
            let normalCount, dashCount, normalSpeed, dashSpeed;
            if (a === 20) {
                this.displayName = `Универсальная Вселенная ${a} (BOSS)`;
                normalCount = 15; dashCount = 20;
                normalSpeed = 4.0; dashSpeed = 4.0;
            } else {
                if (a <= 16) {
                    normalCount = 15 + (a - 11) * 3;
                    dashCount = 2 + (a - 11);
                } else {
                    normalCount = 30 - (a - 16) * 3;
                    dashCount = 7 + (a - 16) * 2;
                }
                normalSpeed = Math.min(4.0, 3.0 + (a - 11) * 0.2);
                dashSpeed = 2.0 + (a - 11) * 0.2;
            }
            this.enemyTypes = [
                { type: 'asterdefault', max: normalCount, weight: 1 },
                { type: 'asterdash', max: dashCount, weight: 1 }
            ];
            this.enemyConfigs['asterdefault'] = { baseSpeed: normalSpeed, radiusMin: 14, radiusMax: 25 };
            this.enemyConfigs['asterdash'] = { baseSpeed: dashSpeed };
        }

        // ---------- 21-30 ----------
        else if (a >= 21 && a <= 30) {
            let normalCount, chaserCount, normalSpeed, chaserSpeed;
            if (a === 30) {
                this.displayName = `Универсальная Вселенная ${a} (BOSS)`;
                this.enemyTypes = [
                    { type: 'asterdefault', max: 20, weight: 1 },
                    { type: 'asterchaser_big', max: 20, weight: 1 }
                ];
                this.enemyConfigs['asterdefault'] = { baseSpeed: 4.5, radius: 16 };
                this.enemyConfigs['asterchaser_big'] = { baseSpeed: 4.0, radiusMin: bossRadius, radiusMax: bossRadius + 10, maxSpeed: 3 };
            } else {
                if (a <= 26) normalCount = 12 + (a - 21) * 2;
                else normalCount = 20 - (a - 26) * 2;
                chaserCount = 2 + (a - 21) * 2;
                normalSpeed = Math.min(4.0, 3.5 + (a - 21) * 0.1);
                chaserSpeed = Math.min(4.0, 3.0 + (a - 21) * 0.15);
                this.enemyTypes = [
                    { type: 'asterdefault', max: normalCount, weight: 1 },
                    { type: 'asterchaser', max: chaserCount, weight: 1 }
                ];
                this.enemyConfigs['asterdefault'] = { baseSpeed: normalSpeed, radiusMin: 14, radiusMax: 25 };
                this.enemyConfigs['asterchaser'] = {
                    baseSpeed: chaserSpeed,
                    radiusChoices: [12, 16, 20],
                    maxSpeed: 3
                };
            }
        }

        // ---------- 31-35 ----------
        else if (a >= 31 && a <= 35) {
            const sniperCount = 5 + (a - 31) * 2;
            let slowCount = 0;
            let crippleCount = 0;

            if (a === 31) slowCount = 4;
            else if (a === 32) slowCount = 6;
            else if (a === 33) slowCount = 8;
            else if (a === 34) slowCount = 10;
            else if (a === 35) {
                this.displayName = `Универсальная Вселенная ${a} (BOSS)`;
                slowCount = 15;
            }

            if (a === 34) crippleCount = 3;
            else if (a === 35) crippleCount = 5;

            this.enemyTypes = [
                { type: 'astersniper', max: sniperCount, weight: 1 },
                { type: 'asterslow', max: slowCount, weight: 1 }
            ];
            if (crippleCount > 0) {
                this.enemyTypes.push({ type: 'astercripple', max: crippleCount, weight: 1 });
            }

            this.enemyConfigs['astersniper'] = { baseSpeed: 1 };
            this.enemyConfigs['asterslow']   = { baseSpeed: 2 };
            this.enemyConfigs['astercripple'] = { baseSpeed: 2, maxSpeed: 1 };
        }

        // ---------- 36-40 ----------
        else if (a >= 36 && a <= 40) {
            if (a === 40) {
                this.displayName = `Универсальная Вселенная ${a} (BOSS)`;
                this.enemyTypes = [
                    { type: 'asterdefault_big', max: 25, weight: 1 },
                    { type: 'asterchaser',      max: 10, weight: 1 },
                    { type: 'astersniper',      max: 3,  weight: 1 },
                    { type: 'asterdash',        max: 3,  weight: 1 },
                    { type: 'astercripple',     max: 5,  weight: 1 }
                ];
                this.enemyConfigs = {
                    'asterdefault_big': { baseSpeed: 1, radius: 50, maxSpeed: 1 },
                    'asterchaser':      { baseSpeed: 4, radius: 20, maxSpeed: 3 },
                    'astersniper':      { baseSpeed: 1 },
                    'asterdash':        { baseSpeed: 4 },
                    'astercripple':     { baseSpeed: 2, maxSpeed: 1 }
                };
            } else {
                let dashCount;
                if (a === 36) dashCount = 10;
                else if (a === 37) dashCount = 12;
                else if (a === 38) dashCount = 15;
                else dashCount = 20;

                this.enemyTypes = [
                    { type: 'astercripple', max: 5, weight: 1 },
                    { type: 'asterdash',    max: dashCount, weight: 1 }
                ];
                this.enemyConfigs = {
                    'astercripple': { baseSpeed: 2, maxSpeed: 1 },
                    'asterdash':    { baseSpeed: 4 }
                };
            }
        }

        // ---------- 71-80 ----------
        else if (a >= 71 && a <= 80) {
            if (a === 71) {
                this.enemyTypes = [
                    { type: 'asterdefault', max: 10, weight: 1 },
                    { type: 'asterdash',    max: 10, weight: 1 },
                    { type: 'astercripple', max: 5,  weight: 1 }
                ];
                this.enemyConfigs = {
                    'asterdefault': { baseSpeed: 3, radiusMin: 14, radiusMax: 25 },
                    'asterdash':    { baseSpeed: 3.5 },
                    'astercripple': { baseSpeed: 2, maxSpeed: 1 }
                };
            } else if (a === 72) {
                this.enemyTypes = [
                    { type: 'asterchaser',  max: 12, weight: 1 },
                    { type: 'astersniper',  max: 8,  weight: 1 },
                    { type: 'asterslow',    max: 5,  weight: 1 }
                ];
                this.enemyConfigs = {
                    'asterchaser': { baseSpeed: 4, radiusChoices: [12, 16, 20], maxSpeed: 3 },
                    'astersniper': { baseSpeed: 1 },
                    'asterslow':   { baseSpeed: 2 }
                };
            } else if (a === 73) {
                this.enemyTypes = [
                    { type: 'asterdefault', max: 15, weight: 1 },
                    { type: 'asterblack',   max: 10, weight: 1 },
                    { type: 'astercripple', max: 5,  weight: 1 }
                ];
                this.enemyConfigs = {
                    'asterdefault': { baseSpeed: 3, radiusMin: 14, radiusMax: 25 },
                    'asterblack':   { baseSpeed: 3, radius: 14 },
                    'astercripple': { baseSpeed: 2, maxSpeed: 1 }
                };
            } else if (a === 74) {
                this.enemyTypes = [
                    { type: 'asterdash',   max: 8,  weight: 1 },
                    { type: 'astersniper', max: 10, weight: 1 },
                    { type: 'asterdrain',  max: 5,  weight: 1 }
                ];
                this.enemyConfigs = {
                    'asterdash':   { baseSpeed: 3.5 },
                    'astersniper': { baseSpeed: 1 },
                    'asterdrain':  { baseSpeed: 2 }
                };
            } else if (a === 75) {
                this.enemyTypes = [
                    { type: 'asterchaser',  max: 15, weight: 1 },
                    { type: 'asterslow',    max: 5,  weight: 1 },
                    { type: 'asterdrain',   max: 5,  weight: 1 },
                    { type: 'asterdefault', max: 5,  weight: 1 }
                ];
                this.enemyConfigs = {
                    'asterchaser':  { baseSpeed: 4, radiusChoices: [12, 16, 20], maxSpeed: 3 },
                    'asterslow':    { baseSpeed: 2 },
                    'asterdrain':   { baseSpeed: 2 },
                    'asterdefault': { baseSpeed: 3, radiusMin: 14, radiusMax: 25 }
                };
            } else if (a === 76) {
                this.enemyTypes = [
                    { type: 'asterdefault', max: 10, weight: 1 },
                    { type: 'asterdash',    max: 10, weight: 1 },
                    { type: 'astersniper',  max: 5,  weight: 1 },
                    { type: 'astercripple', max: 5,  weight: 1 }
                ];
                this.enemyConfigs = {
                    'asterdefault': { baseSpeed: 3, radiusMin: 14, radiusMax: 25 },
                    'asterdash':    { baseSpeed: 3.5 },
                    'astersniper':  { baseSpeed: 1 },
                    'astercripple': { baseSpeed: 2, maxSpeed: 1 }
                };
            } else if (a === 77) {
                this.enemyTypes = [
                    { type: 'asterchaser', max: 8, weight: 1 },
                    { type: 'astersniper', max: 8, weight: 1 },
                    { type: 'asterslow',   max: 8, weight: 1 },
                    { type: 'asterdefault',max: 6, weight: 1 }
                ];
                this.enemyConfigs = {
                    'asterchaser':  { baseSpeed: 4, radiusChoices: [12, 16, 20], maxSpeed: 3 },
                    'astersniper':  { baseSpeed: 1 },
                    'asterslow':    { baseSpeed: 2 },
                    'asterdefault': { baseSpeed: 3, radiusMin: 14, radiusMax: 25 }
                };
            } else if (a === 78) {
                this.enemyTypes = [
                    { type: 'asterblack',   max: 12, weight: 1 },
                    { type: 'asterdash',    max: 8,  weight: 1 },
                    { type: 'asterdrain',   max: 5,  weight: 1 },
                    { type: 'astercripple', max: 5,  weight: 1 }
                ];
                this.enemyConfigs = {
                    'asterblack':   { baseSpeed: 3, radius: 14 },
                    'asterdash':    { baseSpeed: 3.5 },
                    'asterdrain':   { baseSpeed: 2 },
                    'astercripple': { baseSpeed: 2, maxSpeed: 1 }
                };
            } else if (a === 79) {
                this.enemyTypes = [
                    { type: 'asterdefault', max: 15, weight: 1 },
                    { type: 'asterchaser',  max: 10, weight: 1 },
                    { type: 'astersniper',  max: 5,  weight: 1 },
                    { type: 'asterslow',    max: 5,  weight: 1 }
                ];
                this.enemyConfigs = {
                    'asterdefault': { baseSpeed: 3, radiusMin: 14, radiusMax: 25 },
                    'asterchaser':  { baseSpeed: 4, radiusChoices: [12, 16, 20], maxSpeed: 3 },
                    'astersniper':  { baseSpeed: 1 },
                    'asterslow':    { baseSpeed: 2 }
                };
            } else if (a === 80) {
                this.displayName = `Универсальная Вселенная ${a} (BOSS)`;
                this.enemyTypes = [
                    { type: 'asterdefault',  max: 15, weight: 1 },
                    { type: 'asterdefault_big', max: 5, weight: 1 },
                    { type: 'asterslow',     max: 5, weight: 1 },
                    { type: 'astercripple',  max: 5, weight: 1 },
                    { type: 'asterdrain',    max: 5, weight: 1 },
                    { type: 'asterblack',    max: 30, weight: 1 }
                ];
                this.enemyConfigs = {
                    'asterdefault':      { baseSpeed: 3.5, radiusMin: 14, radiusMax: 25 },
                    'asterdefault_big':  { baseSpeed: 1, radius: 50, maxSpeed: 1 },
                    'asterslow':         { baseSpeed: 2 },
                    'astercripple':      { baseSpeed: 2, maxSpeed: 1 },
                    'asterdrain':        { baseSpeed: 2 },
                    'asterblack':        { baseSpeed: 2, radius: 30 }
                };
            }
        }

        // Глобальный лимит скорости для всех преследователей
        for (const t of this.enemyTypes) {
            if (t.type === 'asterchaser' || t.type === 'asterchaser_big') {
                const cfg = this.enemyConfigs[t.type] = this.enemyConfigs[t.type] || {};
                if (cfg.maxSpeed === undefined) cfg.maxSpeed = 3;
            }
            if (!this.enemyConfigs[t.type]) this.enemyConfigs[t.type] = {};
            if (!this.enemyConfigs[t.type].baseSpeed && !this.enemyConfigs[t.type].speed) {
                this.enemyConfigs[t.type].baseSpeed = baseSpeed;
            }
        }
    }

    // ------------------------------------------------------------
    //  СПАВН ВРАГОВ
    // ------------------------------------------------------------
    spawnEnemyOfType(type, gameState, areaLevel = 1) {
        if (this.areaNumber === 41) return null;

        const bounds = this.getEnemySpawnBounds();
        const x = bounds.minX + Math.random() * (bounds.maxX - bounds.minX);
        const y = bounds.minY + Math.random() * (bounds.maxY - bounds.minY);

        const config = this.enemyConfigs[type] || {};

        let radius = config.radius;
        if (config.radiusChoices && Array.isArray(config.radiusChoices) && config.radiusChoices.length > 0) {
            radius = config.radiusChoices[Math.floor(Math.random() * config.radiusChoices.length)];
        } else if (config.radiusMin !== undefined && config.radiusMax !== undefined) {
            radius = config.radiusMin + Math.floor(Math.random() * (config.radiusMax - config.radiusMin + 1));
        }

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
                enemy.radius = radius || 35;
                enemy.type = type;
                break;
            case 'asterblack_big':
                enemy = new AsterBlack(x, y);
                enemy.radius = radius || 35;
                enemy.type = type;
                break;
            case 'asterchaser_big':
                enemy = new AsterChaser(x, y);
                enemy.radius = radius || 35;
                enemy.type = type;
                break;

            case 'astersaw': return null;
            default: return null;
        }

        if (enemy) {
            if (radius !== undefined && enemy.radius !== radius) enemy.radius = radius;
            if (config.baseSpeed !== undefined) enemy.baseSpeed = config.baseSpeed;
            Object.assign(enemy, config);

            if (typeof enemy._updateSpeedFromRadius === 'function') {
                enemy._updateSpeedFromRadius();
            }

            if (config.maxSpeed !== undefined && enemy.speed > config.maxSpeed) {
                enemy.speed = config.maxSpeed;
            }

            const angle = Math.atan2(enemy.vy, enemy.vx);
            enemy.vx = Math.cos(angle) * enemy.speed;
            enemy.vy = Math.sin(angle) * enemy.speed;

            if (enemy.type === 'asterdash' && config.baseSpeed) {
                enemy.baseSpeed = config.baseSpeed;
                enemy.speed = config.baseSpeed;
                const ang = Math.atan2(enemy.vy, enemy.vx);
                enemy.vx = Math.cos(ang) * enemy.speed;
                enemy.vy = Math.sin(ang) * enemy.speed;
            }

            gameState.enemies.push(enemy);
        }
        return enemy;
    }

    // ------------------------------------------------------------
    //  ОРБЫ И ЗОЛОТАЯ АРЕНА
    // ------------------------------------------------------------
    spawnInitialXPOrbs(count, gameState) {
        if (this.areaNumber === 41) {
            for (let i = 0; i < this.maxOrbs; i++) {
                if (gameState.xpOrbs.length >= this.maxOrbs) break;
                this.spawnRandomXPOrb(gameState);
            }
            return;
        }
        for (let i = 0; i < this.maxOrbs; i++) {
            if (gameState.xpOrbs.length >= this.maxOrbs) break;
            this.spawnRandomXPOrb(gameState);
        }
    }

    spawnRandomXPOrb(gameState) {
        if (this.areaNumber === 41) {
            if (gameState.xpOrbs.length >= this.maxOrbs) return;
            const bounds = this.getEnemySpawnBounds();
            const x = bounds.minX + Math.random() * (bounds.maxX - bounds.minX);
            const y = bounds.minY + Math.random() * (bounds.maxY - bounds.minY);
            gameState.xpOrbs.push(new XPOrb(x, y, 500));
            return;
        }
        super.spawnRandomXPOrb(gameState);
    }

    updateSpawning(gameState, areaLevel) {
        if (this.areaNumber === 41) {
            this._goldenOrbTimer++;
            if (this._goldenOrbTimer >= this._goldenOrbInterval) {
                this._goldenOrbTimer = 0;
                for (let i = 0; i < this._goldenOrbBatch; i++) {
                    if (gameState.xpOrbs.length >= this.maxOrbs) break;
                    this.spawnRandomXPOrb(gameState);
                }
            }
            return;
        }
        super.updateSpawning(gameState, areaLevel);
    }

    renderSafeZones(ctx) {
        if (this.areaNumber === 41) {
            ctx.fillStyle = '#eefc86';
            ctx.fillRect(0, 0, this.width, this.height);

            ctx.strokeStyle = '#a8b359';
            ctx.lineWidth = 1;
            const gs = CONFIG.GRID.SIZE;
            for (let x = 0; x <= this.width; x += gs) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, this.height);
                ctx.stroke();
            }
            for (let y = 0; y <= this.height; y += gs) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(this.width, y);
                ctx.stroke();
            }
        }
        super.renderSafeZones(ctx);
    }
}