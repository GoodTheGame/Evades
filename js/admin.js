// js/admin.js
import CONFIG from './config.js';

export class Admin {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.enabled = false;          // активно ли меню
        this.godMode = false;
        this.savedState = null;
        this.angle = 0;
        this.isDragging = false;
        this.dragStartAngle = 0;
        this.dragStartMouseAngle = 0;

        // Геометрия кольца (будет рисоваться из центра 300,150)
        this.centerX = 300;
        this.centerY = 150;
        this.outerRadius = 130;        // внешний край
        this.innerRadius = 100;        // внутренний край (ободок 30px)
        this.buttonRadius = 115;       // середина ободка

        // 20 кнопок
        this.actions = [
            'areaUp10', 'areaUp5', 'areaUp1',
            'toggleGod',
            'areaDown1', 'areaDown5', 'areaDown10',
            'respawnLevel',
            'toggleGod', 'toggleGod', 'toggleGod',
            'toggleGod', 'toggleGod', 'toggleGod',
            'toggleGod', 'toggleGod', 'toggleGod',
            'toggleGod', 'toggleGod', 'toggleGod'
        ];

        this._createPanel();
        this._setupKeys();
        this._setupScroll();
    }

    _createPanel() {
        if (document.getElementById('adminPanel')) return;

        const panel = document.createElement('div');
        panel.id = 'adminPanel';
        panel.innerHTML = `
            <div class="admin-ring-bg"></div>
            <div class="admin-ring-inner" id="adminRingInner">
                ${this.actions.map((a, i) => {
                    const label = this._actionLabel(a);
                    const isGod = a === 'toggleGod';
                    return `<button class="admin-btn ${isGod ? 'god-btn' : ''}" data-action="${a}" data-index="${i}">${label}</button>`;
                }).join('')}
            </div>
            <div id="adminTab" class="admin-tab">☰</div>
        `;
        document.getElementById('gameContainer').appendChild(panel);

        // Обработчики кликов по кнопкам
        panel.querySelectorAll('.admin-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this._handleAction(e.currentTarget.dataset.action);
            });
        });

        // Язычок: открыть/закрыть меню
        const tab = document.getElementById('adminTab');
        tab.addEventListener('click', () => {
            this.enabled = !this.enabled;
            if (this.enabled) {
                panel.classList.add('open');
            } else {
                panel.classList.remove('open');
                if (this.godMode) this._toggleGodMode(true);
            }
        });

        this._updateButtonPositions();
    }

    _actionLabel(action) {
        switch (action) {
            case 'areaUp1': return '+1';
            case 'areaUp5': return '+5';
            case 'areaUp10': return '+10';
            case 'areaDown1': return '-1';
            case 'areaDown5': return '-5';
            case 'areaDown10': return '-10';
            case 'respawnLevel': return 'RES';
            default: return 'GOD';
        }
    }

    _setupKeys() {
        window.addEventListener('keydown', (e) => {
            if (e.code === 'F1') {
                e.preventDefault();
                // F1 тоже переключает меню
                this.enabled = !this.enabled;
                const panel = document.getElementById('adminPanel');
                if (panel) {
                    if (this.enabled) panel.classList.add('open');
                    else panel.classList.remove('open');
                }
                if (!this.enabled && this.godMode) this._toggleGodMode(true);
            }
        });
    }

    _setupScroll() {
        const panel = document.getElementById('adminPanel');
        if (!panel) return;

        panel.addEventListener('wheel', (e) => {
            if (!this.enabled) return;
            e.preventDefault();
            this.angle += e.deltaY * 0.01;
            this._updateButtonPositions();
        });

        panel.addEventListener('mousedown', (e) => {
            if (!this.enabled) return;
            this.isDragging = true;
            const rect = panel.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            this.dragStartMouseAngle = Math.atan2(e.clientY - cy, e.clientX - cx);
            this.dragStartAngle = this.angle;
            e.preventDefault();
        });
        window.addEventListener('mousemove', (e) => {
            if (!this.isDragging || !this.enabled) return;
            const rect = panel.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            const ma = Math.atan2(e.clientY - cy, e.clientX - cx);
            this.angle = this.dragStartAngle + (ma - this.dragStartMouseAngle);
            this._updateButtonPositions();
        });
        window.addEventListener('mouseup', () => { this.isDragging = false; });
    }

    _updateButtonPositions() {
        const buttons = document.querySelectorAll('#adminPanel .admin-btn');
        const visibleStart = Math.PI / 2;      // 90°
        const visibleEnd = 3 * Math.PI / 2;    // 270°

        buttons.forEach((btn, i) => {
            const a = (i * (Math.PI * 2 / this.actions.length)) + this.angle;
            let n = ((a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
            const vis = (n >= visibleStart && n <= visibleEnd);
            if (!vis) { btn.style.display = 'none'; return; }
            btn.style.display = 'block';

            const x = this.centerX + Math.cos(a) * this.buttonRadius - btn.offsetWidth / 2;
            const y = this.centerY + Math.sin(a) * this.buttonRadius - btn.offsetHeight / 2;
            btn.style.left = `${x}px`;
            btn.style.top = `${y}px`;
        });
    }

    _handleAction(action) {
        const ge = this.gameEngine;
        switch (action) {
            case 'areaUp1': this._changeArea(1); break;
            case 'areaUp5': this._changeArea(5); break;
            case 'areaUp10': this._changeArea(10); break;
            case 'areaDown1': this._changeArea(-1); break;
            case 'areaDown5': this._changeArea(-5); break;
            case 'areaDown10': this._changeArea(-10); break;
            case 'respawnLevel': ge.loadUniverse('Universal'); break;
            case 'toggleGod': this._toggleGodMode(); break;
        }
    }

    _changeArea(delta) {
        const ge = this.gameEngine;
        ge.areaNumber = Math.max(1, ge.areaNumber + delta);
        ge.loadUniverse('Universal');
    }

    _toggleGodMode(forceOff = false) {
        const p = this.gameEngine.player;
        if (forceOff && this.godMode) { this._restorePlayer(); this.godMode = false; return; }
        if (!this.godMode) {
            this.savedState = {
                level: p.level, speed: p.speed, maxEnergy: p.maxEnergy, regen: p.regen,
                ability1Level: p.ability1Level, ability2Level: p.ability2Level,
                statPoints: p.statPoints, shiftCooldown: p.shiftCooldown, spaceCooldown: p.spaceCooldown
            };
            p.level = CONFIG.STATS.MAX_LEVEL; p.xp = 0;
            p.speed = CONFIG.PLAYER_BASE.MAX_SPEED;
            p.maxEnergy = CONFIG.PLAYER_BASE.MAX_ENERGY_CAP; p.energy = p.maxEnergy;
            p.regen = CONFIG.PLAYER_BASE.MAX_REGEN;
            p.statPoints = 0;
            p.ability1Level = CONFIG.STATS.ABILITY_MAX_LEVEL;
            p.ability2Level = CONFIG.STATS.ABILITY_MAX_LEVEL;
            p.updateAbilityCooldowns();
            p.shiftCooldown = 0; p.spaceCooldown = 0;
            p.godMode = true; this.godMode = true;
        } else {
            this._restorePlayer(); this.godMode = false;
        }
        this.gameEngine.uiManager.update(p, this.gameEngine.currentUniverse, this.gameEngine.areaNumber);
    }

    _restorePlayer() {
        const p = this.gameEngine.player;
        if (!this.savedState) return;
        p.level = this.savedState.level;
        p.speed = this.savedState.speed;
        p.maxEnergy = this.savedState.maxEnergy; p.energy = p.maxEnergy;
        p.regen = this.savedState.regen;
        p.ability1Level = this.savedState.ability1Level;
        p.ability2Level = this.savedState.ability2Level;
        p.statPoints = this.savedState.statPoints;
        p.updateAbilityCooldowns();
        p.shiftCooldown = this.savedState.shiftCooldown;
        p.spaceCooldown = this.savedState.spaceCooldown;
        p.godMode = false;
        this.savedState = null;
    }
}