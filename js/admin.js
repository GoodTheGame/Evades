// js/admin.js
import CONFIG from './config.js';
import { getLocale } from './localization.js';
import { makeRainbow } from './utils.js';

export class Admin {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.enabled = false;
        this.godMode = false;
        this.savedState = null;
        
        // Плавное вращение
        this.angle = 0;
        this.targetAngle = 0;
        this.damping = 0.5;

        this.isDragging = false;
        this.dragStartAngle = 0;
        this.dragStartMouseAngle = 0;

        // Увеличенная геометрия
        this.panelWidth = 420;
        this.panelHeight = 420;
        this.centerX = this.panelWidth / 2;   // 210
        this.centerY = this.panelHeight / 2;  // 210
        this.outerRadius = 200;
        this.innerRadius = 110;
        this.buttonRadius = 150;

        // Функциональные кнопки (9 штук)
        this.actions = [
            'areaUp1', 'areaUp5', 'areaUp10', 'resetArea',
            'toggleGod',               // ← теперь здесь
            'addExperience',
            'areaDown1', 'areaDown5', 'areaDown10'
        ];

        this._createPanel();
        this._setupKeys();
        this._setupScroll();
    }

    update() {
        const diff = this.targetAngle - this.angle;
        if (Math.abs(diff) > 0.001) {
            this.angle += diff * this.damping;
            this._updateButtonPositions();
        }
    }

    _createPanel() {
        if (!document.getElementById('adminTab')) {
            const tab = document.createElement('div');
            tab.id = 'adminTab';
            tab.className = 'admin-tab';
            tab.textContent = '☰';
            tab.addEventListener('click', () => {
                this.enabled = !this.enabled;
                const panel = document.getElementById('adminPanel');
                if (panel) panel.classList.toggle('open', this.enabled);
                if (!this.enabled && this.godMode) this._toggleGodMode(true);
            });
            document.getElementById('gameContainer').appendChild(tab);
        }

        if (document.getElementById('adminPanel')) return;

        const panel = document.createElement('div');
        panel.id = 'adminPanel';
        panel.style.width = this.panelWidth + 'px';
        panel.style.height = this.panelHeight + 'px';
        panel.innerHTML = `
            <div class="admin-ring-bg"></div>
            <div class="admin-ring-inner" id="adminRingInner"></div>
        `;
        document.getElementById('gameContainer').appendChild(panel);

        const ringInner = document.getElementById('adminRingInner');
        this.actions.forEach((action, i) => {
            const btn = document.createElement('button');
            btn.className = 'admin-btn' + (action === 'toggleGod' ? ' god-btn' : '');
            btn.dataset.action = action;
            btn.dataset.index = i;
            btn.textContent = this._getLabel(action);
            if (action === 'toggleGod') {
                makeRainbow(btn);
            }
            btn.addEventListener('click', (e) => this._handleAction(e.currentTarget.dataset.action));
            ringInner.appendChild(btn);
        });

        this._updateButtonPositions();
    }

    _getLabel(action) {
        const loc = getLocale();
        switch (action) {
            case 'areaUp1': return `+1 ${loc.level || 'Lvl'}`;
            case 'areaUp5': return `+5 ${loc.level || 'Lvl'}`;
            case 'areaUp10': return `+10 ${loc.level || 'Lvl'}`;
            case 'areaDown1': return `-1 ${loc.level || 'Lvl'}`;
            case 'areaDown5': return `-5 ${loc.level || 'Lvl'}`;
            case 'areaDown10': return `-10 ${loc.level || 'Lvl'}`;
            case 'resetArea': return loc.reset || 'RES';
            case 'addExperience': return loc.exp || 'EXP';
            case 'toggleGod': return loc.god || 'GOD';
            default: return '';
        }
    }

    _setupKeys() {
        window.addEventListener('keydown', (e) => {
            if (e.code === 'F1') {
                e.preventDefault();
                this.enabled = !this.enabled;
                const panel = document.getElementById('adminPanel');
                if (panel) panel.classList.toggle('open', this.enabled);
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
            const delta = e.deltaY > 0 ? 0.15 : -0.15;
            this.targetAngle += delta;
        });

        panel.addEventListener('mousedown', (e) => {
            if (!this.enabled) return;
            this.isDragging = true;
            const rect = panel.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            this.dragStartMouseAngle = Math.atan2(e.clientY - cy, e.clientX - cx);
            this.dragStartAngle = this.targetAngle;
            e.preventDefault();
        });
        window.addEventListener('mousemove', (e) => {
            if (!this.isDragging || !this.enabled) return;
            const rect = panel.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            const ma = Math.atan2(e.clientY - cy, e.clientX - cx);
            this.targetAngle = this.dragStartAngle + (ma - this.dragStartMouseAngle);
        });
        window.addEventListener('mouseup', () => { this.isDragging = false; });
    }

    _updateButtonPositions() {
        const buttons = document.querySelectorAll('#adminPanel .admin-btn');
        const N = this.actions.length;
        if (N === 0) return;
        const angleStart = Math.PI / 2;
        const angleEnd = 3 * Math.PI / 2;
        const angleStep = (angleEnd - angleStart) / (N - 1);

        buttons.forEach((btn) => {
            const i = parseInt(btn.dataset.index);
            const a = this.angle + angleStart + i * angleStep;
            const x = this.centerX + Math.cos(a) * this.buttonRadius - btn.offsetWidth / 2;
            const y = this.centerY + Math.sin(a) * this.buttonRadius - btn.offsetHeight / 2;
            btn.style.left = `${x}px`;
            btn.style.top = `${y}px`;
            btn.style.display = 'block';
            btn.style.opacity = '1';
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
            case 'resetArea': ge.loadUniverse('Universal'); break;
            case 'addExperience': this._addExperience(); break;
            case 'toggleGod': this._toggleGodMode(); break;
        }
    }

    _changeArea(delta) {
    const ge = this.gameEngine;
    ge.areaNumber = Math.max(1, ge.areaNumber + delta);
    ge.loadUniverse('Universal');
    // Мгновенно обновляем UI, чтобы название арены и другие данные сразу изменились
    ge.uiManager.update(ge.player, ge.currentUniverse, ge.areaNumber);
}

    _addExperience() {
        const player = this.gameEngine.player;
        // Даём 200 000 опыта – этого точно хватит на 5+ уровней в любом диапазоне
        player.addXP(200000);
        this.gameEngine.uiManager.update(player, this.gameEngine.currentUniverse, this.gameEngine.areaNumber);
    }

    _toggleGodMode(forceOff = false) {
        const p = this.gameEngine.player;
        if (forceOff && this.godMode) {
            this._restorePlayer();
            this.godMode = false;
            this._updateGodButtonState();
            return;
        }
        if (!this.godMode) {
            this.savedState = {
                level: p.level,
                speed: p.speed,
                maxEnergy: p.maxEnergy,
                regen: p.regen,
                ability1Level: p.ability1Level,
                ability2Level: p.ability2Level,
                statPoints: p.statPoints,
                shiftCooldown: p.shiftCooldown,
                spaceCooldown: p.spaceCooldown
            };
            p.level = CONFIG.STATS.MAX_LEVEL;
            p.xp = 0;
            p.speed = CONFIG.PLAYER_BASE.MAX_SPEED;
            p.maxEnergy = CONFIG.PLAYER_BASE.MAX_ENERGY_CAP;
            p.energy = p.maxEnergy;
            p.regen = CONFIG.PLAYER_BASE.MAX_REGEN;
            p.statPoints = 0;
            p.ability1Level = CONFIG.STATS.ABILITY_MAX_LEVEL;
            p.ability2Level = CONFIG.STATS.ABILITY_MAX_LEVEL;
            p.updateAbilityCooldowns();
            p.shiftCooldown = 0;
            p.spaceCooldown = 0;
            p.godMode = true;
            this.godMode = true;
        } else {
            this._restorePlayer();
            this.godMode = false;
        }
        this._updateGodButtonState();
        this.gameEngine.uiManager.update(p, this.gameEngine.currentUniverse, this.gameEngine.areaNumber);
    }

    _updateGodButtonState() {
        const godBtn = document.querySelector('#adminPanel .god-btn');
        if (godBtn) {
            if (this.godMode) {
                godBtn.classList.add('god-active');
            } else {
                godBtn.classList.remove('god-active');
            }
        }
    }

    _restorePlayer() {
        const p = this.gameEngine.player;
        if (!this.savedState) return;
        p.level = this.savedState.level;
        p.speed = this.savedState.speed;
        p.maxEnergy = this.savedState.maxEnergy;
        p.energy = p.maxEnergy;
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

    refreshLabels() {
        const buttons = document.querySelectorAll('#adminPanel .admin-btn');
        buttons.forEach(btn => {
            const action = btn.dataset.action;
            if (action) btn.textContent = this._getLabel(action);
        });
        this._updateButtonPositions();
    }
}