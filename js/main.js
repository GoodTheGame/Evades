// js/main.js
import CONFIG from './config.js';
import { GameEngine } from './engine/GameEngine.js';
import { logVersion } from './version.js';
import { detectLanguage, getCurrentLanguage, setLanguage } from './localization.js';
logVersion();

// Автоопределение языка при старте
detectLanguage();

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = CONFIG.CANVAS.WIDTH;
canvas.height = CONFIG.CANVAS.HEIGHT;

// Создание UI
function createUI() {
    const ui = document.getElementById('uiLayer');
    ui.innerHTML = `
        <div id="areaInfo">
            <div class="area-name" id="areaName">Area 1</div>
        </div>
        
        <div id="levelInfo">
            <div class="level-circle" id="levelCircle">1</div>
            <div class="xp-bar">
                <div class="xp-fill" id="xpFill"></div>
            </div>
            <div class="stat-points" id="statPoints">
                <span class="xp-orb-icon">●</span> × <span id="pointsCount">0</span>
            </div>
        </div>
        
        <div id="statsPanel">
            <div class="stat-box">
                <div class="stat-label">Speed</div>
                <div class="stat-value" id="speedValue">4.0</div>
                <button class="upgrade-btn" id="upgradeSpeed">+</button>
            </div>
            <div class="stat-box energy-box" id="energyBox">
                <div class="stat-label">Energy</div>
                <div class="stat-value" id="energyValue">30</div>
                <button class="upgrade-btn" id="upgradeEnergy">+</button>
            </div>
            <div class="stat-box energy-box" id="regenBox">
                <div class="stat-label">Regen</div>
                <div class="stat-value" id="regenValue">1.0</div>
                <div class="energy-tooltip" id="energyTooltip">30/30</div>
                <button class="upgrade-btn" id="upgradeRegen">+</button>
            </div>
            <div class="stat-box ability-box">
                <div class="stat-label">Shift</div>
                <div class="ability-icon" id="ability1Icon">
                    <div class="ability-overlay" id="ability1Overlay"></div>
                    <div class="ability-timer" id="ability1Timer"></div>
                </div>
                <div class="ability-tooltip" id="ability1Tooltip"></div>
                <div class="ability-stars" id="ability1Stars"></div>
                <div class="ability-cost" id="ability1Cost">Cost: ${CONFIG.ABILITIES.SHIFT_COST}</div>
            </div>
            <div class="stat-box ability-box">
                <div class="stat-label">Space</div>
                <div class="ability-icon" id="ability2Icon">
                    <div class="ability-overlay" id="ability2Overlay"></div>
                    <div class="ability-timer" id="ability2Timer"></div>
                </div>
                <div class="ability-tooltip" id="ability2Tooltip"></div>
                <div class="ability-stars" id="ability2Stars"></div>
                <div class="ability-cost" id="ability2Cost">Cost: ${CONFIG.ABILITIES.SPACE_COST}</div>
            </div>
        </div>
    `;
}

createUI();
// ---------- НАСТРОЙКИ ----------
const settingsButton = document.getElementById('settingsButton');
const settingsPanel = document.getElementById('settingsPanel');
const languageSelect = document.getElementById('languageSelect');

settingsButton.addEventListener('click', () => {
    settingsPanel.style.display = settingsPanel.style.display === 'none' ? 'block' : 'none';
});

// Установим текущий язык в выпадающем списке при загрузке
languageSelect.value = getCurrentLanguage();

languageSelect.addEventListener('change', () => {
    const lang = languageSelect.value;
    const changed = setLanguage(lang);
    if (changed && window.game && window.game.uiManager) {
        window.game.uiManager.update(
            window.game.player,
            window.game.currentUniverse,
            window.game.areaNumber
        );
    }
});


// Закрытие панели настроек при клике вне её области
document.addEventListener('click', (e) => {
    const settingsContainer = document.getElementById('settingsContainer');
    if (!settingsContainer) return;
    if (!settingsContainer.contains(e.target)) {
        document.getElementById('settingsPanel').style.display = 'none';
    }
});

// ---------- ГЛАВНОЕ МЕНЮ ----------
const mainMenu = document.getElementById('mainMenu');
const heroGrid = document.getElementById('heroGrid');
const startButton = document.getElementById('startButton');
let selectedHeroId = null;

CONFIG.HEROES.forEach(hero => {
    const card = document.createElement('div');
    card.className = 'hero-card';
    card.dataset.heroId = hero.id;
    card.innerHTML = `
        <div class="hero-icon">${hero.icon}</div>
        <div class="hero-name">${hero.name}</div>
        <div class="hero-desc">${hero.description}</div>
    `;
    card.addEventListener('click', () => {
        document.querySelectorAll('.hero-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        selectedHeroId = hero.id;
    });
    heroGrid.appendChild(card);
});

const firstCard = document.querySelector('.hero-card');
if (firstCard) {
    firstCard.classList.add('selected');
    selectedHeroId = CONFIG.HEROES[0].id;
}

startButton.addEventListener('click', () => {
    if (!selectedHeroId) return;
    mainMenu.style.display = 'none';
    startGame(selectedHeroId);
});

function startGame(heroId) {
    const heroConfig = CONFIG.HEROES.find(h => h.id === heroId);
    if (!heroConfig) return;
    
    window.selectedHeroName = heroConfig.className;
    
    const game = new GameEngine(ctx, CONFIG.CANVAS.WIDTH, CONFIG.CANVAS.HEIGHT);
    window.game = game;
    
    document.getElementById('upgradeSpeed').addEventListener('click', () => game.upgradeStat('speed'));
    document.getElementById('upgradeEnergy').addEventListener('click', () => game.upgradeStat('energy'));
    document.getElementById('upgradeRegen').addEventListener('click', () => game.upgradeStat('regen'));
    
    // Закрываем панель настроек при входе в игру
    const settingsPanel = document.getElementById('settingsPanel');
    if (settingsPanel) settingsPanel.style.display = 'none';

    game.start();
}