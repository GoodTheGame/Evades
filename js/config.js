const CONFIG = {
    CANVAS: { WIDTH: 1200, HEIGHT: 700 },
    WORLD: { WIDTH: 1800, HEIGHT: 700 },
    VIEWPORT: { WIDTH: 1200, HEIGHT: 700 },
    SAFE_ZONE: { WIDTH: 160 },
    PORTAL: { WIDTH: 40 },
    GRID: { SIZE: 40 },
    MINIMAP: { WIDTH: 200, HEIGHT: 117, PADDING: 10 },
    PROGRESSION: {
        TOTAL_AREAS: 40,
        AREA_COMPLETION_XP: 50,
        AREA_XP_MULTIPLIER: 1.2
    },
    PLAYER_BASE: {
        RADIUS: 12,
        BASE_SPEED: 4,
        MAX_SPEED: 7,
        MAX_ENERGY: 30,
        MAX_ENERGY_CAP: 150,
        ENERGY_REGEN: 1,
        MAX_REGEN: 3
    },
    STATS: {
        MAX_LEVEL: 50,
        XP_PER_LEVEL_BASE: 5,
        XP_MULTIPLIER: 1.5,
        SPEED_PER_POINT: 0.2,
        ENERGY_PER_POINT: 5,
        REGEN_PER_POINT: 0.1,
        ABILITY_MAX_LEVEL: 5
    },
    ENEMY_SPAWN: {
        MAX_ENEMIES: 30
    },
    XP_SPAWN: {
        INITIAL_AMOUNT: 50,
        MAX_ORBS: 100,
        SPAWN_RATE: 60
    },
    ABILITIES: {
        MAX_LEVEL: 5,
        XP_PER_ABILITY_LEVEL: 500,
        SHIFT_COST: 5,
        SPACE_COST: 15,
        SHIFT_BASE_COOLDOWN: 10,
        SPACE_BASE_COOLDOWN: 20
    },
    ENEMY_SPEED: {
        NORMAL: { MIN: 0.5, MAX: 4, SCALE_PER_AREA: 0.03 },
        WALL: { MIN: 0.3, MAX: 2, SCALE_PER_AREA: 0.02 }
    },
    HEROES: [
    {
        id: 'mirage',
        name: 'Мираж',
        icon: '🌀',
        description: 'Неуязвимость при телепорте, сброс aggro.',
        className: 'Mirage'
    },
    {
        id: 'frozen',
        name: 'Фрозен',
        icon: '❄️',
        description: 'Замораживает врагов, замедляющая аура, щит.',
        className: 'Frozen',
        theme: {
            primary: '#3399ff',   // ярко-синий (кнопки, рамки)
            dark: '#1a2b3c',      // тёмный фон панелей
            light: '#e0f0ff'      // светлый текст
        }
    },
    {
        id: 'pulsar',
        name: 'Пульсар',
        icon: '🟣',
        description: 'Гравитационный снаряд, хаотичная аура, барьеры.',
        className: 'Pulsar',
        theme: {
            primary: '#800080',
            dark: '#1a0030',
            light: '#e0d0ff'
        }
    }
]
    
};

export default CONFIG;