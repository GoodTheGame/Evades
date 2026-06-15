// js/engine/GameEngine.js
import { InputManager } from './InputManager.js';
import { Renderer } from './Renderer.js';
import { HeroFactory } from '../heroes/HeroFactory.js';
import { Camera } from '../Camera.js';
import { MiniMap } from '../MiniMap.js';
import CONFIG from '../config.js';
import { Portal } from '../Portal.js';
import { UIManager } from '../ui/UIManager.js';
import { HubArena } from '../arena/HubArena.js';
import { UniverseUniversal } from '../arena/UniverseUniversal.js';
import { Admin } from '../admin.js';
export class GameEngine {
    constructor(ctx, width, height) {
        this.admin = new Admin(this);
        this.input = new InputManager();
        this.renderer = new Renderer(ctx, width, height);
        this.canvasWidth = width;
        this.canvasHeight = height;
        this.isRunning = false;

        this.gameState = {
            width: 0,
            height: 0,
            enemies: [],
            xpOrbs: [],
            bullets: []
        };

        const heroName = window.selectedHeroName || 'Mirage';
        this.player = HeroFactory.createHero(
            heroName,
            CONFIG.PORTAL.WIDTH + CONFIG.SAFE_ZONE.WIDTH / 2,
            this.canvasHeight / 2
        );
        this.camera = new Camera(CONFIG.VIEWPORT.WIDTH, CONFIG.VIEWPORT.HEIGHT);
        this.uiManager = new UIManager();
        this.miniMap = new MiniMap();

        this.areaNumber = 1;                                          // сначала задаём номер
        this.currentUniverse = new UniverseUniversal(this.areaNumber); // потом создаём арену
        this.completedAreas = new Set();

        this.enemiesKilled = 0;
        this.uiUpdateTimer = 0;
        this.frameCount = 0;
        this.xpSpawnTimer = 0;

        this.gameState.width = this.currentUniverse.width;
        this.gameState.height = this.currentUniverse.height;
        const spawn = this.currentUniverse.getRespawnPoint(this.player.x);
        this.player.x = spawn.x;
        this.player.y = spawn.y;
    }

    start() {
        this.isRunning = true;

        this.uiManager.setStarClickCallback((abilityNum, starIndex) => {
            const currentLevel = this.player[`ability${abilityNum}Level`];
            if (starIndex === currentLevel && this.player.statPoints > 0) {
                this.upgradeAbility(abilityNum);
            }
        });
        this.uiManager.bindAbilityIconClicks();

        if (this.currentUniverse) {
            this.currentUniverse.spawnInitialXPOrbs(CONFIG.XP_SPAWN.INITIAL_AMOUNT, this.gameState);
            this.currentUniverse.resetWaves();
        }

        this.loop();
    }

    stop() {
        this.isRunning = false;
    }

    // ===================== ОСНОВНОЙ ЦИКЛ =====================
    update() {
        this.frameCount++;

        if (this.input.mouseActive) {
            const worldMouse = this.camera.screenToWorld(this.input.mouseX, this.input.mouseY);
            this.input.mouseWorldX = worldMouse.x;
            this.input.mouseWorldY = worldMouse.y;
        }

        const w = this.currentUniverse.width;
        const h = this.currentUniverse.height;
        this.gameState.width = w;
        this.gameState.height = h;

        this.player.slowFactor = 1.0;
        this.player.energyDrainRate = 0;
        this.player.abilitiesBlocked = false;

        this.gameState.player = this.player;
        this.gameState.arena = this.currentUniverse;

        // Стандартная проверка safe-зоны
        this.gameState.isPlayerInSafeZone = this.currentUniverse.isInSafeZone(
            this.player.x, this.player.y, this.player.radius
        );

        // Зона игнорирования Пульсара – переопределяет safe-зону для врагов
        if (this.player.ignoreZone) {
            const zone = this.player.ignoreZone;
            const dx = this.player.x - zone.x;
            const dy = this.player.y - zone.y;
            if (dx * dx + dy * dy <= zone.radius * zone.radius) {
                this.gameState.isPlayerInSafeZone = true;
            }
        }

        this.gameState.isPlayerUnavailable = this.player.downed || this.player.invulnerable;

        if (this.currentUniverse) {
            this.currentUniverse.updateSpawning(this.gameState, this.areaNumber);
            this.spawnXpIfNeeded();
            this.updatePortals();
        }

        const bounds = this.currentUniverse.getEnemyMovementBounds();
        for (let enemy of this.gameState.enemies) {
            enemy.update(bounds, w, h, this.gameState);
        }

        // Отскок врагов от центральной safe-зоны (хаба)
        if (this.currentUniverse.hubSafeZone) {
            const zone = this.currentUniverse.hubSafeZone;
            for (const enemy of this.gameState.enemies) {
                if (enemy._sawCounterIndex !== undefined) continue;

                const closestX = Math.max(zone.left, Math.min(enemy.x, zone.right));
                const closestY = Math.max(zone.top, Math.min(enemy.y, zone.bottom));

                const dx = enemy.x - closestX;
                const dy = enemy.y - closestY;
                const distSq = dx * dx + dy * dy;
                const minDist = enemy.radius;

                if (distSq < minDist * minDist && distSq > 0) {
                    const dist = Math.sqrt(distSq);
                    const nx = dx / dist;
                    const ny = dy / dist;

                    enemy.x = closestX + nx * minDist;
                    enemy.y = closestY + ny * minDist;

                    const vn = enemy.vx * nx + enemy.vy * ny;
                    if (vn < 0) {
                        enemy.vx -= 2 * vn * nx;
                        enemy.vy -= 2 * vn * ny;
                    }
                } else if (distSq === 0) {
                    enemy.x = zone.right + enemy.radius;
                    enemy.vx = Math.abs(enemy.vx);
                }
            }
        }

        this.player.update(this.input, this.gameState, this.currentUniverse);
        this.camera.update(this.player, w, h);

        for (let orb of this.gameState.xpOrbs) orb.update(this.player);

        // пули
        for (let i = this.gameState.bullets.length - 1; i >= 0; i--) {
            const bullet = this.gameState.bullets[i];
            bullet.x += bullet.vx;
            bullet.y += bullet.vy;
            bullet.life--;

            // Игрок в safe-зоне (включая сферу) – пули не наносят урон
            if (this.gameState.isPlayerInSafeZone) {
                // пули просто удаляются, чтобы не засорять мир
                this.gameState.bullets.splice(i, 1);
                continue;
            }

            if (!this.gameState.isPlayerUnavailable) {
                const dx = this.player.x - bullet.x;
                const dy = this.player.y - bullet.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < this.player.radius + bullet.radius) {
                    if (typeof this.player.onDamage === 'function') {
                        this.player.onDamage(this);
                    } else {
                        this.playerDies();
                    }
                    this.gameState.bullets.splice(i, 1);
                    continue;
                }
            }

            if (this.currentUniverse.isInSafeZone(bullet.x, bullet.y, bullet.radius)) {
                this.gameState.bullets.splice(i, 1);
                continue;
            }

            if (bullet.life <= 0 || bullet.x < 0 || bullet.x > w || bullet.y < 0 || bullet.y > h) {
                this.gameState.bullets.splice(i, 1);
            }
        }

        this.checkCollisions();
        this.checkPortalCollisions();
        this.checkXPCollection();

        this.gameState.xpOrbs = this.gameState.xpOrbs.filter(o => !o.collected);

        this.uiUpdateTimer++;
        if (this.uiUpdateTimer >= 10) {
            this.uiManager.update(this.player, this.currentUniverse, this.areaNumber);
            this.uiUpdateTimer = 0;
        }
    }

    spawnXpIfNeeded() {
        this.xpSpawnTimer++;
        if (this.xpSpawnTimer >= CONFIG.XP_SPAWN.SPAWN_RATE) {
            this.currentUniverse.spawnRandomXPOrb(this.gameState);
            this.xpSpawnTimer = 0;
        }
    }

    updatePortals() {
        if (this.currentUniverse.portals) {
            for (let portal of this.currentUniverse.portals) portal.update();
        }
    }

    // ===================== КОЛЛИЗИИ =====================
    checkCollisions() {
        if (this.player.downed || this.player.invulnerable) return;
        if (this.player.godMode) return;                // <-- бессмертие
        // Используем универсальный флаг, который включает и сферу игнорирования
        if (this.gameState.isPlayerInSafeZone) return;

        for (let enemy of this.gameState.enemies) {
            const dist = Math.hypot(this.player.x - enemy.x, this.player.y - enemy.y);
            if (dist < this.player.radius + enemy.radius) {
                if (typeof this.player.onDamage === 'function') {
                    this.player.onDamage(this);
                } if (!this.player.godMode) {
                    if (typeof this.player.onDamage === 'function') {
                        this.player.onDamage(this);
                    } else {
                        this.playerDies();
                    }
                }
                break;
            }
        }
    }

    checkPortalCollisions() {
        if (!this.currentUniverse.portals) return;
        const pl = this.player.x - this.player.radius;
        const pr = this.player.x + this.player.radius;
        const pt = this.player.y - this.player.radius;
        const pb = this.player.y + this.player.radius;

        for (let portal of this.currentUniverse.portals) {
            const ph = portal.height || this.currentUniverse.height;
            if (pr > portal.x && pl < portal.x + portal.width && pb > portal.y && pt < portal.y + ph) {
                if (portal.onEnter) {
                    portal.onEnter(this);
                } else if (portal.portalType === 'forward') {
                    this.nextArea();
                } else if (portal.portalType === 'backward') {
                    this.previousArea();
                }
                return;
            }
        }
    }

    checkXPCollection() {
        for (let orb of this.gameState.xpOrbs) {
            if (orb.isCollected(this.player)) {
                this.player.addXP(orb.amount);
                orb.collected = true;
            }
        }
    }

    // ===================== СОСТОЯНИЕ ИГРОКА =====================
    playerDies() {
        this.player.downed = true;
        this.player.invulnerable = true;
        this.player.invulnerableTime = 120;
        setTimeout(() => {
            if (this.player.downed) {
                if (this.player.autoRespawn) {
                    this.player.respawn();
                    const spawn = this.currentUniverse.getRespawnPoint(this.player.x);
                    this.player.x = spawn.x;
                    this.player.y = spawn.y;
                    this.player.teleportFreeze = 30;
                } else {
                    this.stop();
                    document.getElementById('mainMenu').style.display = 'flex';
                    window.game = null;
                }
            }
        }, 2000);
    }

    killEnemy(enemy) {
        const idx = this.gameState.enemies.indexOf(enemy);
        if (idx > -1) {
            this.gameState.enemies.splice(idx, 1);
            this.enemiesKilled++;
            if (this.currentUniverse) {
                this.currentUniverse.spawnXPOrbAt(enemy.x, enemy.y, enemy.xp, this.gameState);
            }
        }
    }

    // ===================== ПЕРЕХОДЫ МЕЖДУ ВСЕЛЕННЫМИ =====================
    loadUniverse(universeName) {
        if (universeName === 'Hub') {
            this.currentUniverse = new HubArena();
        } else if (universeName === 'Universal') {
            this.currentUniverse = new UniverseUniversal(this.areaNumber);
        } else if (universeName === 'CentralCore') {
            this.currentUniverse = new CentralCoreUniverse();
        }

        this.gameState.enemies = [];
        this.gameState.xpOrbs = [];
        this.gameState.bullets = [];
        this.gameState.width = this.currentUniverse.width;
        this.gameState.height = this.currentUniverse.height;

        const spawn = this.currentUniverse.getRespawnPoint(this.player.x);
        this.player.x = spawn.x;
        this.player.y = spawn.y;
        this.player.teleportFreeze = 30;
        this.areaNumber = this.currentUniverse.areaNumber || 0;
        this.completedAreas.clear();
        this.currentUniverse.resetWaves();
    }

    nextArea() {
    this.areaNumber++;
    this.enemiesKilled = 0;
    this.resetAreaState();

    // --- Разблокировка героев ---
    if (this.areaNumber === 41 && !localStorage.getItem('hero_frozen_unlocked')) {
        this.unlockHero('frozen');
        alert('Разблокирован: Frozen!');
    } else if (this.areaNumber === 81 && !localStorage.getItem('hero_pulsar_unlocked')) {
        this.unlockHero('pulsar');
        alert('Разблокирован: Pulsar!');
    }

    // --- Создаём новую вселенную ---
    this.currentUniverse = new UniverseUniversal(this.areaNumber);
    this.gameState.width = this.currentUniverse.width;
    this.gameState.height = this.currentUniverse.height;

    // Позиция игрока у левой safe-зоны
    this.player.x = CONFIG.PORTAL.WIDTH + this.player.radius;
    this.player.y = this.currentUniverse.height / 2;
    this.player.teleportFreeze = 15;

    // Награда за завершение предыдущей области (кроме золотой)
    if (!this.completedAreas.has(this.areaNumber - 1) && this.areaNumber !== 41 && this.areaNumber !== 81) {
        const areaXP = Math.floor(CONFIG.PROGRESSION.AREA_COMPLETION_XP *
            Math.pow(CONFIG.PROGRESSION.AREA_XP_MULTIPLIER, this.areaNumber - 2));
        this.player.addXP(areaXP);
        this.completedAreas.add(this.areaNumber - 1);
    }

    // --- Спавним сразу 200 орбов ---
    if (this.currentUniverse.spawnInitialXPOrbs) {
        this.currentUniverse.spawnInitialXPOrbs(this.currentUniverse.maxOrbs || 200, this.gameState);
    }

    this.currentUniverse.nextWave();
}

previousArea() {
    if (this.areaNumber <= 1) return;
    this.areaNumber--;
    this.resetAreaState();

    this.currentUniverse = new UniverseUniversal(this.areaNumber);
    this.gameState.width = this.currentUniverse.width;
    this.gameState.height = this.currentUniverse.height;

    this.player.x = this.currentUniverse.width - CONFIG.PORTAL.WIDTH - this.player.radius;
    this.player.y = this.currentUniverse.height / 2;
    this.player.teleportFreeze = 15;

    // --- Спавним сразу 200 орбов ---
    if (this.currentUniverse.spawnInitialXPOrbs) {
        this.currentUniverse.spawnInitialXPOrbs(this.currentUniverse.maxOrbs || 200, this.gameState);
    }

    this.currentUniverse.nextWave();
}

    resetAreaState() {
        this.gameState.enemies = [];
        this.gameState.xpOrbs = [];
    }

    unlockHero(heroId) {
    const heroConfig = CONFIG.HEROES.find(h => h.id === heroId);
    if (heroConfig) {
        heroConfig.locked = false;
        // Сохраняем в localStorage, чтобы не сбрасывалось после обновления
        localStorage.setItem(`hero_${heroId}_unlocked`, 'true');
    }
}
    // ===================== ПРОКАЧКА =====================
    upgradeStat(stat) {
        if (this.player.upgradeStat(stat))
            this.uiManager.update(this.player, this.currentUniverse, this.areaNumber);
    }

    upgradeAbility(abilityNum) {
        if (this.player.statPoints <= 0) return false;
        const maxLevel = CONFIG.STATS.ABILITY_MAX_LEVEL;
        if (abilityNum === 1 && this.player.ability1Level < maxLevel) {
            this.player.ability1Level++;
        } else if (abilityNum === 2 && this.player.ability2Level < maxLevel) {
            this.player.ability2Level++;
        } else {
            return false;
        }
        this.player.updateAbilityCooldowns();
        this.player.statPoints--;
        this.uiManager.update(this.player, this.currentUniverse, this.areaNumber);
        this.uiUpdateTimer = 0; // чтобы на следующем кадре тоже обновилось

        return true;
    }

    // ===================== РЕНДЕРИНГ =====================
    render() {
        this.renderer.clear();
        this.camera.apply(this.renderer.ctx);

        this.renderGrid();
        this.currentUniverse.renderSafeZones(this.renderer.ctx);

        if (this.currentUniverse.portals) {
            for (let portal of this.currentUniverse.portals) {
                portal.render(this.renderer.ctx, this.currentUniverse.height);
            }
        }

        for (let orb of this.gameState.xpOrbs) orb.render(this.renderer.ctx);
        for (let enemy of this.gameState.enemies) enemy.render(this.renderer.ctx);
        for (let bullet of this.gameState.bullets) {
            this.renderer.ctx.beginPath();
            this.renderer.ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
            this.renderer.ctx.fillStyle = bullet.color;
            this.renderer.ctx.fill();
        }

        this.player.render(this.renderer.ctx);
        this.camera.reset(this.renderer.ctx);

        // Мини-карта отключена для хаба
        if (!(this.currentUniverse instanceof HubArena)) {
            this.miniMap.render(
                this.renderer.ctx,
                this.camera,
                this.player,
                this.gameState.enemies,
                {
                    forward: this.currentUniverse.getPortalByType('forward'),
                    backward: this.currentUniverse.getPortalByType('backward')
                }
            );
        }
    }

    renderGrid() {
        const ctx = this.renderer.ctx;
        const w = this.currentUniverse.width;
        const h = this.currentUniverse.height;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        const gs = CONFIG.GRID.SIZE;
        for (let x = 0; x <= w; x += gs) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
        }
        for (let y = 0; y <= h; y += gs) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
        }
    }

    // ===================== ГЛАВНЫЙ ЦИКЛ =====================
    loop() {
        if (!this.isRunning) return;
        this.update();
        this.render();
        requestAnimationFrame(() => this.loop());
    }
}