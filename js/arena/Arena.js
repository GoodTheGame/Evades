// js/arena/Arena.js
import CONFIG from '../config.js';
import { Portal } from '../Portal.js';
import { XPOrb } from '../XPOrb.js';
import {
    Asteroid, AsterBlack, AsterSniper, AsterChaser, AsterDash,
    AsterSlow, AsterCripple, AsterDrain, AsterSilence, AsterSaw, AsterPull, AsterHyperPull, AsterPush
} from '../enemies/Asteroids.js';

export class Arena {
    constructor(areaNumber) {
        this.areaNumber = areaNumber;
        this.width = CONFIG.WORLD.WIDTH;
        this.height = CONFIG.WORLD.HEIGHT;

        this.leftSafeZone = {
            start: 0,
            end: CONFIG.PORTAL.WIDTH + CONFIG.SAFE_ZONE.WIDTH
        };
        this.rightSafeZone = {
            start: this.width - CONFIG.PORTAL.WIDTH - CONFIG.SAFE_ZONE.WIDTH,
            end: this.width
        };

        this.displayName = 'Неизвестная вселенная';
        this.requiredResource = null;
        this.rewardTechnology = null;
        this.enemyModifiers = [];
        this.enemyTypes = [];
        this.enemyConfigs = {};

        this.sawProfiles = [];
        this.portals = [];
        this.waveNumber = 1;
        this.waveComplete = false;

        this._sawCounters = [];
        this._sawEnemies = [];
        this._sawPositionsReady = false;
        this._sawProfilesGenerated = false;
    }

    setPortals(forwardPortal, backwardPortal) {
        this.portals = [];
        if (forwardPortal) this.portals.push(forwardPortal);
        if (backwardPortal) this.portals.push(backwardPortal);
    }

    getPortalByType(type) {
        return this.portals.find(p => p.portalType === type);
    }

    isInSafeZone(x, y, playerRadius = 0) {
        const playerLeft = x - playerRadius;
        const playerRight = x + playerRadius;
        return (
            (playerLeft >= this.leftSafeZone.start && playerRight <= this.leftSafeZone.end) ||
            (playerLeft >= this.rightSafeZone.start && playerRight <= this.rightSafeZone.end)
        );
    }

    enforceSafeZoneForEnemy(enemy) { }

    getEnemyMovementBounds() {
        return {
            minX: CONFIG.PORTAL.WIDTH + CONFIG.SAFE_ZONE.WIDTH,
            maxX: this.width - CONFIG.PORTAL.WIDTH - CONFIG.SAFE_ZONE.WIDTH,
            minY: 0,
            maxY: this.height
        };
    }

    getRespawnPoint(currentX) {
        const distToLeft = Math.abs(currentX - (this.leftSafeZone.start + this.leftSafeZone.end) / 2);
        const distToRight = Math.abs(currentX - (this.rightSafeZone.start + this.rightSafeZone.end) / 2);
        if (distToLeft <= distToRight) {
            return { x: (this.leftSafeZone.start + this.leftSafeZone.end) / 2, y: this.height / 2 };
        } else {
            return { x: (this.rightSafeZone.start + this.rightSafeZone.end) / 2, y: this.height / 2 };
        }
    }

    getEnemySpawnBounds() {
        return {
            minX: this.leftSafeZone.end + 50,
            maxX: this.rightSafeZone.start - 50,
            minY: 50,
            maxY: this.height - 50
        };
    }

    getSawBounds() {
        return {
            left: CONFIG.PORTAL.WIDTH + CONFIG.SAFE_ZONE.WIDTH,
            right: this.width - CONFIG.PORTAL.WIDTH - CONFIG.SAFE_ZONE.WIDTH,
            top: 0,
            bottom: this.height
        };
    }

    renderSafeZones(ctx) {
        ctx.fillStyle = 'rgba(255, 215, 0, 0.15)';
        const leftW = CONFIG.PORTAL.WIDTH + CONFIG.SAFE_ZONE.WIDTH;
        const rightX = this.width - CONFIG.PORTAL.WIDTH - CONFIG.SAFE_ZONE.WIDTH;
        ctx.fillRect(0, 0, leftW, this.height);
        ctx.fillRect(rightX, 0, leftW, this.height);
    }

    spawnInitialXPOrbs(count, gameState) {
        for (let i = 0; i < count; i++) {
            this.spawnRandomXPOrb(gameState);
        }
    }

    spawnRandomXPOrb(gameState) {
        if (gameState.xpOrbs.length >= CONFIG.XP_SPAWN.MAX_ORBS) return;
        const bounds = this.getEnemySpawnBounds();
        const x = bounds.minX + Math.random() * (bounds.maxX - bounds.minX);
        const y = bounds.minY + Math.random() * (bounds.maxY - bounds.minY);
        gameState.xpOrbs.push(new XPOrb(x, y, 1));
    }

    spawnXPOrbAt(x, y, amount, gameState) {
        gameState.xpOrbs.push(new XPOrb(x, y, amount));
    }

    spawnEnemyOfType(type, gameState, areaLevel = 1) {
        const bounds = this.getEnemySpawnBounds();
        const x = bounds.minX + Math.random() * (bounds.maxX - bounds.minX);
        const y = bounds.minY + Math.random() * (bounds.maxY - bounds.minY);

        let enemy;
        switch (type) {
            case 'asterdefault':
                enemy = new Asteroid(x, y);
                break;
            case 'asterblack':
                enemy = new AsterBlack(x, y);
                break;
            case 'astersniper':
                enemy = new AsterSniper(x, y);
                break;
            case 'asterchaser':
                enemy = new AsterChaser(x, y);
                break;
            case 'asterdash':
                enemy = new AsterDash(x, y);
                break;
            case 'asterslow':
                enemy = new AsterSlow(x, y);
                break;
            case 'astercripple':
                enemy = new AsterCripple(x, y);
                break;
            case 'asterdrain':
                enemy = new AsterDrain(x, y);
                break;
            case 'asterpull':
                enemy = new AsterPull(x, y);
                break;
            case 'asterhyperpull':
                enemy = new AsterHyperPull(x, y);
                break;
            case 'astersilence':
                enemy = new AsterSilence(x, y);
                break;
            case 'asterpush':
                enemy = new AsterPush(x, y);
                break;
            default:
                console.warn(`Unknown enemy type: ${type}`);
                return null;
        }

        if (enemy && this.enemyConfigs[type]) {
            const oldSpeed = enemy.speed;
            Object.assign(enemy, this.enemyConfigs[type]);
            if (enemy.speed !== oldSpeed && enemy.speed > 0) {
                const currentAngle = Math.atan2(enemy.vy, enemy.vx);
                enemy.vx = Math.cos(currentAngle) * enemy.speed;
                enemy.vy = Math.sin(currentAngle) * enemy.speed;
            }
        }

        if (enemy) {
            gameState.enemies.push(enemy);
        }
        return enemy;
    }

    fillEnemiesToLimit(gameState, areaLevel = 1) {
        if (!this.enemyTypes || this.enemyTypes.length === 0) return;

        for (const typeConfig of this.enemyTypes) {
            const currentCount = gameState.enemies.filter(e => e.type === typeConfig.type).length;
            const need = typeConfig.max - currentCount;
            if (need <= 0) continue;

            if (typeConfig.type === 'astersaw') {
                if (!this._sawProfilesGenerated) {
                    this._spawnAllSaws(gameState);
                }
            } else {
                for (let i = 0; i < need; i++) {
                    this.spawnEnemyOfType(typeConfig.type, gameState, areaLevel);
                }
                break;
            }
        }
    }

    _initSawCounters() {
        this._sawCounters = [];
        this._sawEnemies = [];

        for (const profile of this.sawProfiles) {
            const speed = profile.config.speed || this.enemyConfigs['astersaw']?.speed || 2;
            const direction = profile.config.direction || 'cw';
            const radius = profile.config.radius || this.enemyConfigs['astersaw']?.radius || 20;
            this._sawCounters.push({
                totalDistance: 0,
                speed,
                direction,
                count: profile.count,
                radius
            });
        }
        this._sawPositionsReady = true;
        this._sawProfilesGenerated = false;
    }

    _spawnAllSaws(gameState) {
        gameState.enemies = gameState.enemies.filter(e => e.type !== 'astersaw');
        this._sawEnemies = [];

        const bounds = this.getSawBounds();
        const left = bounds.left;
        const right = bounds.right;
        const top = bounds.top;
        const bottom = bounds.bottom;

        for (let cIdx = 0; cIdx < this._sawCounters.length; cIdx++) {
            const counter = this._sawCounters[cIdx];
            const r = counter.radius;
            const innerLeft = left + r;
            const innerRight = right - r;
            const innerTop = top + r;
            const innerBottom = bottom - r;

            const hLen = innerRight - innerLeft;
            const vLen = innerBottom - innerTop;
            const perimeter = 2 * (hLen + vLen);
            const step = perimeter / counter.count;
            counter.totalDistance = 0;

            for (let i = 0; i < counter.count; i++) {
                const dist = (i * step) % perimeter;
                const point = this._getPointOnPerimeter(dist, innerLeft, innerRight, innerTop, innerBottom);
                const config = {
                    startX: point.x,
                    startY: point.y,
                    startVX: 0,
                    startVY: 0,
                    ...this.enemyConfigs['astersaw'],
                    radius: r,
                    speed: counter.speed,
                    direction: counter.direction
                };
                const saw = new AsterSaw(point.x, point.y, config);
                saw._sawCounterIndex = cIdx;
                saw._sawIndexInCounter = i;
                this._sawEnemies.push(saw);
                gameState.enemies.push(saw);
            }
        }
        this._sawProfilesGenerated = true;
    }

    _updateSaws() {
        if (!this._sawPositionsReady || this._sawCounters.length === 0) return;
        if (!this._sawProfilesGenerated) return;

        const bounds = this.getSawBounds();
        const left = bounds.left;
        const right = bounds.right;
        const top = bounds.top;
        const bottom = bounds.bottom;

        for (const counter of this._sawCounters) {
            const r = counter.radius;
            const innerLeft = left + r;
            const innerRight = right - r;
            const innerTop = top + r;
            const innerBottom = bottom - r;
            const hLen = innerRight - innerLeft;
            const vLen = innerBottom - innerTop;
            const perimeter = 2 * (hLen + vLen);

            if (counter.direction === 'cw') {
                counter.totalDistance = (counter.totalDistance + counter.speed) % perimeter;
            } else {
                counter.totalDistance = (counter.totalDistance - counter.speed + perimeter) % perimeter;
            }
        }

        for (const saw of this._sawEnemies) {
            const counter = this._sawCounters[saw._sawCounterIndex];
            if (!counter) continue;
            const r = counter.radius;
            const innerLeft = left + r;
            const innerRight = right - r;
            const innerTop = top + r;
            const innerBottom = bottom - r;
            const hLen = innerRight - innerLeft;
            const vLen = innerBottom - innerTop;
            const perimeter = 2 * (hLen + vLen);
            const step = perimeter / counter.count;
            const dist = (counter.totalDistance + saw._sawIndexInCounter * step) % perimeter;
            const point = this._getPointOnPerimeter(dist, innerLeft, innerRight, innerTop, innerBottom);
            saw.x = point.x;
            saw.y = point.y;
        }
    }

    _getPointOnPerimeter(dist, innerLeft, innerRight, innerTop, innerBottom) {
        const dTop = innerRight - innerLeft;
        const dRight = innerBottom - innerTop;
        const dBottom = innerRight - innerLeft;

        if (dist < dTop) {
            const x = innerLeft + dist;
            const y = innerTop;
            return { x, y };
        }
        dist -= dTop;
        if (dist < dRight) {
            const x = innerRight;
            const y = innerTop + dist;
            return { x, y };
        }
        dist -= dRight;
        if (dist < dBottom) {
            const x = innerRight - dist;
            const y = innerBottom;
            return { x, y };
        }
        dist -= dBottom;
        const x = innerLeft;
        const y = innerBottom - dist;
        return { x, y };
    }

    blocksLineOfSight(x1, y1, x2, y2) {
        return false;
    }

    nextWave() {
        this.waveNumber++;
        this.waveComplete = false;
        this._sawProfilesGenerated = false;
        this._initSawCounters();
    }

    resetWaves() {
        this.waveNumber = 1;
        this.waveComplete = false;
        this._sawProfilesGenerated = false;
        this._initSawCounters();
    }

    updateSpawning(gameState, areaLevel) {
        if (this.waveComplete) return;

        if (this.sawProfiles.length > 0 && !this._sawPositionsReady) {
            this._initSawCounters();
        }

        this.fillEnemiesToLimit(gameState, areaLevel);
        this._updateSaws();

        if (gameState.enemies.length === 0) {
            this.waveComplete = true;
        }
    }
}