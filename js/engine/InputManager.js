import CONFIG from '../config.js';

export class InputManager {
    constructor() {
        this.keys = {};
        this.mouseX = 0;
        this.mouseY = 0;
        this.mouseWorldX = 0;
        this.mouseWorldY = 0;
        this.mouseActive = false;
        this.keyboardActive = false;
        this.lastMode = 'keyboard';

        this.MAX_SPEED_AT_DISTANCE = 100;
        this.MIN_SPEED_FRACTION_AT_CENTER = 0.05;

        window.addEventListener('keydown', (e) => this.onKeyDown(e));
        window.addEventListener('keyup', (e) => this.onKeyUp(e));
        window.addEventListener('mousemove', (e) => this.onMouseMove(e));
        window.addEventListener('mousedown', (e) => this.onMouseDown(e));
    }

    onKeyDown(e) {
        this.keys[e.code] = true;
        if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
            this.keyboardActive = true;
            this.mouseActive = false;
            this.lastMode = 'keyboard';
        }
    }

    onKeyUp(e) {
        this.keys[e.code] = false;
        if (!this.isMovementKeyPressed()) {
            this.keyboardActive = false;
        }
    }

    onMouseMove(e) {
        const canvas = document.getElementById('gameCanvas');
        const rect = canvas.getBoundingClientRect();
        this.mouseX = e.clientX - rect.left;
        this.mouseY = e.clientY - rect.top;
    }

    onMouseDown(e) {
    if (e.button === 0) {
        // Список ID элементов UI, по которым клик не должен переключать мышь
        const uiIds = [
            'upgradeSpeed', 'upgradeEnergy', 'upgradeRegen',
            'statsPanel', 'areaInfo', 'levelInfo',
            'energyBox', 'regenBox',
            'settingsContainer',
            'ability1Icon', 'ability2Icon'
        ];
        for (const id of uiIds) {
            const el = document.getElementById(id);
            if (el && el.contains(e.target)) {
                return;
            }
        }
        // Звёзды и иконки способностей
        if (e.target.matches('.ability-stars span, .ability-icon')) {
            return;
        }
        // Админ-панель и язычок
        if (e.target.closest('#adminPanel') || e.target.closest('#adminTab')) return;

        // Миникарта
        const canvas = document.getElementById('gameCanvas');
        if (canvas) {
            const rect = canvas.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const clickY = e.clientY - rect.top;

            const mmX = CONFIG.MINIMAP.PADDING;
            const mmY = CONFIG.MINIMAP.PADDING;
            const mmWidth = CONFIG.MINIMAP.WIDTH;
            const mmHeight = CONFIG.MINIMAP.HEIGHT;

            if (clickX >= mmX && clickX <= mmX + mmWidth &&
                clickY >= mmY && clickY <= mmY + mmHeight) {
                return;
            }
        }

        this.mouseActive = !this.mouseActive;
        if (this.mouseActive) {
            this.keyboardActive = false;
            this.lastMode = 'mouse';
        }
    }
}

    isMovementKeyPressed() {
        return this.keys['KeyW'] || this.keys['KeyA'] || this.keys['KeyS'] || this.keys['KeyD'] ||
               this.keys['ArrowUp'] || this.keys['ArrowDown'] || this.keys['ArrowLeft'] || this.keys['ArrowRight'];
    }

    isDown(code) {
        return this.keys[code] === true;
    }

    getMouseDirection(playerX, playerY) {
        if (!this.mouseActive) return { dx: 0, dy: 0, distance: 0 };

        const dx = this.mouseWorldX - playerX;
        const dy = this.mouseWorldY - playerY;
        const distance = Math.hypot(dx, dy);

        if (distance > 0) {
            const normalizedDx = dx / distance;
            const normalizedDy = dy / distance;
            return { dx: normalizedDx, dy: normalizedDy, distance };
        } else {
            return { dx: 0, dy: 0, distance: 0 };
        }
    }

    getMouseSpeed(distance, maxSpeed) {
        const maxDist = this.MAX_SPEED_AT_DISTANCE;
        const minFrac = this.MIN_SPEED_FRACTION_AT_CENTER;

        let t = distance / maxDist;
        t = Math.min(t, 1.0);

        let easedT = 1 - Math.pow(1 - t, 3);

        const speedFraction = minFrac + (1.0 - minFrac) * easedT;

        return maxSpeed * speedFraction;
    }
}