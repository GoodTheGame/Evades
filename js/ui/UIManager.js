// js/ui/UIManager.js
import CONFIG from '../config.js';
import { getLocale } from '../localization.js';
import { makeRainbow, removeRainbow } from '../utils.js';
export class UIManager {
    constructor() {
        this.levelCircle = document.getElementById('levelCircle');
        this.xpFill = document.getElementById('xpFill');
        this.pointsCount = document.getElementById('pointsCount');
        this.speedValue = document.getElementById('speedValue');
        this.energyValue = document.getElementById('energyValue');
        this.regenValue = document.getElementById('regenValue');
        this.areaName = document.getElementById('areaName');

        this.upgradeSpeedBtn = document.getElementById('upgradeSpeed');
        this.upgradeEnergyBtn = document.getElementById('upgradeEnergy');
        this.upgradeRegenBtn = document.getElementById('upgradeRegen');

        this.regenBox = document.getElementById('regenBox');
        this.energyTooltip = document.getElementById('energyTooltip');

        this._starClickCallback = null;
    }

    setStarClickCallback(callback) {
        this._starClickCallback = callback;
    }

    update(player, universe, areaNumber) {
        this.player = player;
        const loc = getLocale();

        if (player && player.heroId) {
            const container = document.getElementById('gameContainer');
            if (container) {
                container.classList.remove('theme-mirage', 'theme-frozen', 'theme-pulsar');
                container.classList.add(`theme-${player.heroId}`);
            }
        }

        if (this.levelCircle) this.levelCircle.textContent = player.level;
        if (this.xpFill) this.xpFill.style.width = `${(player.xp / player.xpToNextLevel) * 100}%`;
        if (this.pointsCount) this.pointsCount.textContent = player.statPoints;
        if (this.speedValue) this.speedValue.textContent = player.speed.toFixed(1);
        if (this.energyValue) this.energyValue.textContent = Math.floor(player.maxEnergy);
        if (this.regenValue) this.regenValue.textContent = player.regen.toFixed(1);
        if (this.areaName) {
    removeRainbow(this.areaName); // сбрасываем, если был
    if (universe.displayName) {
            this.areaName.textContent = universe.displayName;
            if (universe.displayName === 'Песочница') {
                makeRainbow(this.areaName);
            }
        } else {
            this.areaName.textContent = `${loc.area} ${areaNumber}`;
        }
    }


        this.updateAbilityUI('ability1', player.shiftCooldown, player.maxShiftCooldown, player.ability1Level, player.statPoints);
        this.updateAbilityUI('ability2', player.spaceCooldown, player.maxSpaceCooldown, player.ability2Level, player.statPoints);

        const cost1 = document.getElementById('ability1Cost');
        const cost2 = document.getElementById('ability2Cost');
        if (cost1) cost1.textContent = `${loc.abilityCost}: ${player.ability1Cost}`;
        if (cost2) {
            if (player.heroId === 'frozen') {
                cost2.textContent = `${loc.abilityDrain}: 2/s`;
            } else {
                cost2.textContent = `${loc.abilityCost}: ${player.ability2Cost}`;
            }
        }

        if (typeof player.getAbilityDescriptions === 'function') {
            const desc = player.getAbilityDescriptions();
            [1, 2].forEach(num => {
                const tooltip = document.getElementById(`ability${num}Tooltip`);
                if (tooltip) {
                    const info = desc[`ability${num}`];
                    tooltip.innerHTML = `
                        <div class="tooltip-desc">${info.desc}</div>
                        <div class="tooltip-divider"></div>
                        <div class="tooltip-stats">${info.stats.replace(/\n/g, '<br>')}</div>
                    `;
                }
            });
        }

        this.updateEnergyBar(player);
        this.updateUpgradeButtons(player);
    }

    updateAbilityUI(abilityName, cooldown, maxCooldown, level, statPoints) {
        const icon = document.getElementById(`${abilityName}Icon`);
        const overlay = document.getElementById(`${abilityName}Overlay`);
        const timer = document.getElementById(`${abilityName}Timer`);
        const starsContainer = document.getElementById(`${abilityName}Stars`);

        if (!icon || !overlay || !timer || !starsContainer) return;

        const hasSP = statPoints > 0;

        if (starsContainer.children.length === 0) {
            for (let i = 0; i < CONFIG.STATS.ABILITY_MAX_LEVEL; i++) {
                const star = document.createElement('span');
                star.textContent = '★';
                star.dataset.index = i;
                star.dataset.ability = abilityName;
                if (this._starClickCallback) {
                    star.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const idx = parseInt(e.currentTarget.dataset.index);
                        const abNum = abilityName === 'ability1' ? 1 : 2;
                        this._starClickCallback(abNum, idx);
                    });
                }
                starsContainer.appendChild(star);
            }
        }

        for (let i = 0; i < starsContainer.children.length; i++) {
            const star = starsContainer.children[i];
            star.className = '';
            if (i < level) star.classList.add('active');
            else if (i === level && hasSP) star.classList.add('blink');
            else star.classList.add('inactive');
        }

        if (cooldown > 0) {
            icon.classList.remove('ready');
            timer.textContent = (cooldown / 60).toFixed(1);
            overlay.style.height = `${(cooldown / maxCooldown) * 100}%`;
            overlay.style.opacity = '1';
        } else {
            icon.classList.add('ready');
            timer.textContent = '';
            overlay.style.height = '0%';
            overlay.style.opacity = '0';
        }

        if (this.player && this.player.abilitiesBlocked) {
            icon.classList.add('blocked');
        } else {
            icon.classList.remove('blocked');
        }
    }

    updateEnergyBar(player) {
        if (!this.regenBox) return;
        const percent = (player.energy / player.maxEnergy) * 100;
        this.regenBox.style.background = `linear-gradient(to right, 
            rgba(0, 217, 255, 0.4) ${percent}%, 
            rgba(0, 80, 150, 0.3) ${percent}%)`;
        if (this.energyTooltip) {
            this.energyTooltip.textContent = `${Math.floor(player.energy)}/${player.maxEnergy}`;
        }
        if (this.player && this.player.energyDrainRate > 0) {
            this.regenBox.classList.add('draining');
        } else {
            this.regenBox.classList.remove('draining');
        }
    }

    updateUpgradeButtons(player) {
        const sp = player.statPoints;
        this._setButton(this.upgradeSpeedBtn, player.speed >= CONFIG.PLAYER_BASE.MAX_SPEED, sp);
        this._setButton(this.upgradeEnergyBtn, player.maxEnergy >= CONFIG.PLAYER_BASE.MAX_ENERGY_CAP, sp);
        this._setButton(this.upgradeRegenBtn, player.regen >= CONFIG.PLAYER_BASE.MAX_REGEN, sp);
    }

    bindAbilityIconClicks() {
    document.getElementById('ability1Icon')?.addEventListener('click', () => {
        if (this.player && typeof this.player.onAbility1Click === 'function') {
            this.player.onAbility1Click();
        }
    });
    document.getElementById('ability2Icon')?.addEventListener('click', () => {
        if (this.player && typeof this.player.onAbility2Click === 'function') {
            this.player.onAbility2Click();
        }
    });
}

    _setButton(btn, isMaxed, statPoints) {
        if (!btn) return;
        if (isMaxed) {
            btn.textContent = 'MAX';
            btn.disabled = true;
            btn.classList.add('maxed');
        } else {
            btn.textContent = '+';
            btn.disabled = statPoints <= 0;
            btn.classList.remove('maxed');
        }
    }
}