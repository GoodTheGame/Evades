// js/arena/CentralCoreUniverse.js
import { Arena } from './Arena.js';
import { Portal } from '../Portal.js';
import CONFIG from '../config.js';

export class CentralCoreUniverse extends Arena {
    constructor() {
        super(1);
        this.displayName = 'Ядро Системы';
        this.rewardTechnology = 'Ионные двигатели';

        // Лимиты врагов для этой вселенной
        // Профили пил: 10 по часовой, 10 против часовой
        this.sawProfiles = [
            { count: 10, config: { direction: 'cw', speed: 4 } },
            { count: 10, config: { direction: 'ccw', speed: 4 } },
            { count: 5, config: { direction: 'cw', speed: 2.5, radius: 60 } },
            { count: 10, config: { direction: 'ccw', speed: 6, radius: 12 } }
        ];
        
        this.enemyTypes = [
            { type: 'asterdefault', max: 0, weight: 1 },
            { type: 'asterblack', max: 0, weight: 1 },
            { type: 'astersniper', max: 0, weight: 1 },
            { type: 'asterchaser', max: 0, weight: 1 },
            { type: 'asterdash', max: 0, weight: 1 },
            { type: 'asterslow',    max: 0, weight: 1 },
            { type: 'asterdrain',   max: 0, weight: 1 },
            { type: 'astercripple', max: 0, weight: 1 },
            { type: 'astersilence', max: 0, weight: 1 },
            { type: 'astersaw', max: 35, weight: 1 }
        ];

        // Кастомные параметры врагов (переопределяем свойства)
        this.enemyConfigs = {
            'astersniper': { radius: 6, }, // ещё мельче, чем по умолчанию 8
            'asterdrain': { auraValue: 3 },
            // можно также менять speed, xp, color и др.
        };

        const forwardPortal = new Portal(
            this.width - CONFIG.PORTAL.WIDTH,
            0,
            'forward'
        );
        const toHub = new Portal(
            0, // x = 0, левая сторона
            0,
            'backward', // тип
            {
                width: CONFIG.PORTAL.WIDTH,
                height: this.height, // на всю высоту
                color: '#0000FF', // синий
                onEnter: (gameEngine) => {
                    gameEngine.loadUniverse('Hub');
                }
            }
        );
        this.portals.push(toHub);
        this.portals = [forwardPortal];
    }
}