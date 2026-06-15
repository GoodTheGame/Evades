// js/entities/Enemy.js
import CONFIG from '../config.js';

export class Enemy {
    constructor(x, y, config) {
        this.x = x;
        this.y = y;
        this.radius = config.radius || 15;
        this.color = config.color || '#888888';
        this.speed = config.speed || 1;
        this.vx = config.vx || (Math.random() - 0.5) * this.speed;
        this.vy = config.vy || (Math.random() - 0.5) * this.speed;
        this.xp = config.xp || 10;
        this.isWall = config.isWall || false;
        this.aura = config.aura || false;
        this.auraColor = config.auraColor || null;
        this.type = config.type || 'unknown';
        this.sightRadius = config.sightRadius || 0;
        this.frozen = false;
        this.frozenTimer = 0;
        this.slowFactor = 1; // для замедления
        this.disarmed = false; // для способностей типа "гравитационный снаряд"
    }

    update(bounds, worldWidth, worldHeight, gameState = null) {
    // Временные векторы скорости с учётом замедления (slowFactor)
    const effectiveVx = this.vx * this.slowFactor;
    const effectiveVy = this.vy * this.slowFactor;
    // Полная остановка при disarmed (используется гравитационной зоной)
    if (this.disarmed) {
        this.vx = 0;
        this.vy = 0;
        return;
    }
    // Если враг disarmed, не даём ему двигаться или действовать – полностью пропускаем обновление
    if (this.disarmed) {
        // Но таймеры (заморозка, аура и т.п.) не должны тикать? Для гравитационной зоны мы обнуляем всё.
        return;
    }
    // Сразу сбрасываем slowFactor, чтобы он не накапливался
    this.slowFactor = 1;

    if (this.disarmed) {
    // Полностью замораживаем врага: не двигаемся и не действуем
    this.vx = 0;
    this.vy = 0;
    // Не сбрасываем disarmed здесь, чтобы зона могла удерживать врага несколько кадров
    return;
}
    // Если враг заморожен — не двигаемся
    if (this.frozen) {
        this.frozenTimer--;
        if (this.frozenTimer <= 0) this.frozen = false;
        return;
    }

    this.x += effectiveVx;
    this.y += effectiveVy;

    // Отскок от границ
    const leftBound = bounds.minX;
    const rightBound = bounds.maxX;
    const topBound = bounds.minY;
    const bottomBound = bounds.maxY;

    if (this.x < leftBound + this.radius) {
        this.vx = Math.abs(this.vx);
        this.x = leftBound + this.radius;
    }
    if (this.x > rightBound - this.radius) {
        this.vx = -Math.abs(this.vx);
        this.x = rightBound - this.radius;
    }
    if (this.y < topBound + this.radius) {
        this.vy = Math.abs(this.vy);
        this.y = topBound + this.radius;
    }
    if (this.y > bottomBound - this.radius) {
        this.vy = -Math.abs(this.vy);
        this.y = bottomBound - this.radius;
    }

    // Никакого сброса slowFactor в конце!
}

    render(ctx) {
        if (this.frozen) {
            ctx.fillStyle = '#aaddff'; // ледяной оттенок
        } else {
            ctx.fillStyle = this.color;
        }
        if (this.aura && this.auraColor) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius + 20, 0, Math.PI * 2);
            ctx.fillStyle = this.auraColor;
            ctx.fill();
        }
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}