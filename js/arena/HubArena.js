// js/arena/HubArena.js (оставляем без метода enforceSafeZoneForEnemy)
import { Arena } from './Arena.js';
import { Portal } from '../Portal.js';
import CONFIG from '../config.js';
import { XPOrb } from '../XPOrb.js';
import {
    Asteroid, AsterBlack, AsterSniper, AsterChaser, AsterDash,
    AsterSlow, AsterCripple, AsterDrain, AsterSilence,
    AsterPull, AsterHyperPull, AsterPush       // <-- добавить
} from '../enemies/Asteroids.js';

export class HubArena extends Arena {
    constructor() {
        super(0);
        this.displayName = 'Песочница';  
        this.width = 1000;
        this.height = 1000;

        const cx = this.width / 2;
        const cy = this.height / 2;
        const half = 125;
        this.hubSafeZone = {
            left: cx - half,
            right: cx + half,
            top: cy - half,
            bottom: cy + half
        };

        this.sawProfiles = [
            { count: 10, config: { direction: 'cw', speed: 4 } },
            { count: 10, config: { direction: 'ccw', speed: 4 } },
            { count: 5, config: { direction: 'cw', speed: 2.5, radius: 60 } },
            { count: 10, config: { direction: 'ccw', speed: 6, radius: 12 } }
        ];
        
        this.enemyTypes = [
            { type: 'asterdefault', max: 5, weight: 1 },
            { type: 'asterblack', max: 5, weight: 1 },
            { type: 'astersniper', max: 5, weight: 1 },
            { type: 'asterchaser', max: 5, weight: 1 },
            { type: 'asterdash', max: 5, weight: 1 },
            { type: 'asterslow',    max: 5, weight: 1 },
            { type: 'asterdrain',   max: 5, weight: 1 },
            { type: 'astercripple', max: 5, weight: 1 },
            { type: 'astersilence', max: 5, weight: 1 },
            { type: 'astersaw', max: 35, weight: 1 },
            { type: 'asterpush', max: 5, weight: 1 },
            { type: 'asterpull', max: 5, weight: 1 },
            { type: 'asterhyperpull', max: 5, weight: 1 }
        ];

        this.enemyConfigs = {
            'astersniper': { radius: 6, },
            'asterdrain': { auraValue: 3 },
        };

        const portalWidth = 50;
        const portalHeight = 50;
        const portalX = (this.hubSafeZone.left + this.hubSafeZone.right) / 2 - portalWidth / 2;
        const portalY = this.hubSafeZone.top + 10;
        const toCore = new Portal(
            portalX,
            portalY,
            'forward',
            {
                width: portalWidth,
                height: portalHeight,
                color: '#888888',
                onEnter: (gameEngine) => {
                    gameEngine.loadUniverse('CentralCore');
                }
            }
        );
        this.portals = [toCore];
    }

    isInSafeZone(x, y, playerRadius = 0) {
        return (
            x > this.hubSafeZone.left &&
            x < this.hubSafeZone.right &&
            y > this.hubSafeZone.top &&
            y < this.hubSafeZone.bottom
        );
    }

    renderSafeZones(ctx) {
        const width = this.hubSafeZone.right - this.hubSafeZone.left;
        const height = this.hubSafeZone.bottom - this.hubSafeZone.top;
        ctx.fillStyle = 'rgba(0, 255, 0, 0.2)';
        ctx.fillRect(this.hubSafeZone.left, this.hubSafeZone.top, width, height);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.hubSafeZone.left, this.hubSafeZone.top, width, height);
    }
    // js/arena/HubArena.js – в класс HubArena добавить:
blocksLineOfSight(x1, y1, x2, y2) {
    const zone = this.hubSafeZone;
    // Проверка пересечения отрезка с прямоугольником через пересечение со всеми четырьмя сторонами
    const rectSides = [
        { x1: zone.left, y1: zone.top,    x2: zone.right, y2: zone.top },
        { x1: zone.right, y1: zone.top,    x2: zone.right, y2: zone.bottom },
        { x1: zone.right, y1: zone.bottom, x2: zone.left,  y2: zone.bottom },
        { x1: zone.left,  y1: zone.bottom, x2: zone.left,  y2: zone.top }
    ];

    for (const side of rectSides) {
        if (this._lineIntersectsLine(x1, y1, x2, y2, side.x1, side.y1, side.x2, side.y2)) {
            return true;
        }
    }

    // Дополнительно: если одна из точек внутри safe‑зоны (враг не должен был, но для страховки)
    if (this.isInSafeZone(x1, y1) || this.isInSafeZone(x2, y2)) return true;

    return false;
}

_lineIntersectsLine(x1, y1, x2, y2, x3, y3, x4, y4) {
    const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    if (denom === 0) return false;
    const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
    const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;
    return t >= 0 && t <= 1 && u >= 0 && u <= 1;
}
    getRespawnPoint(currentX) {
        const centerX = (this.hubSafeZone.left + this.hubSafeZone.right) / 2;
        const centerY = (this.hubSafeZone.top + this.hubSafeZone.bottom) / 2;
        return { x: centerX, y: centerY };
    }

    getEnemySpawnBounds() {
        return { minX: 0, maxX: this.width, minY: 0, maxY: this.height };
    }
    getEnemyMovementBounds() {
        return { minX: 0, maxX: this.width, minY: 0, maxY: this.height };
    }
    getSawBounds() {
        return { left: 0, right: this.width, top: 0, bottom: this.height };
    }

    // метод enforceSafeZoneForEnemy полностью удалён

    spawnEnemyOfType(type, gameState, areaLevel = 1) {
        const bounds = this.getEnemySpawnBounds();
        let x, y;
        let attempts = 0;
        const maxAttempts = 100;
        do {
            x = bounds.minX + Math.random() * (bounds.maxX - bounds.minX);
            y = bounds.minY + Math.random() * (bounds.maxY - bounds.minY);
            attempts++;
        } while (this.isInSafeZone(x, y, 1) && attempts < maxAttempts);
        if (attempts >= maxAttempts) return null;

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
            case 'asterpush': enemy = new AsterPush(x, y); break;
            case 'asterpull': enemy = new AsterPull(x, y); break;
            case 'asterhyperpull': enemy = new AsterHyperPull(x, y); break;
            case 'astersilence': enemy = new AsterSilence(x, y); break;
            default: return null;
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
        gameState.enemies.push(enemy);
        return enemy;
    }

    spawnRandomXPOrb(gameState) {
    if (gameState.xpOrbs.length >= CONFIG.XP_SPAWN.MAX_ORBS) return;
    const bounds = this.getEnemySpawnBounds();
    let x, y;
    let attempts = 0;
    const maxAttempts = 100;
    do {
        x = bounds.minX + Math.random() * (bounds.maxX - bounds.minX);
        y = bounds.minY + Math.random() * (bounds.maxY - bounds.minY);
        attempts++;
    } while (this.isInSafeZone(x, y, 1) && attempts < maxAttempts);
    if (attempts >= maxAttempts) return;
    gameState.xpOrbs.push(new XPOrb(x, y, 1000)); // <-- 1000 XP
}
    spawnXPOrbAt(x, y, amount, gameState) {
    gameState.xpOrbs.push(new XPOrb(x, y, 1000)); // всегда 1000 XP
}
}