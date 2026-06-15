// js/locale.js
const LOCALE = {
    // Интерфейс
    speed: 'Speed',
    energy: 'Energy',
    regen: 'Regen',
    abilityCost: 'Cost',
    abilityDrain: 'Drain',
    area: 'Area',
    level: 'Level',
    sp: 'SP',
    shift: 'Shift',
    space: 'Space',
    reset: 'RES',
    god: 'GOD',
    exp: 'EXP', 

    // Герои
    hero_mirage_name: 'Mirage',
    hero_mirage_desc: 'Teleports to safe zone, shoots a projectile that teleports to enemy on hit.',
    hero_frozen_name: 'Frozen',
    hero_frozen_desc: 'Freezes enemies, slows nearby enemies, has a shield.',
    hero_pulsar_name: 'Pulsar',
    hero_pulsar_desc: 'Gravity projectile that disarms enemies, ignores enemies in a zone.',

    // Способности
    ability1_desc_mirage: 'Teleport to last safe zone',
    ability2_desc_mirage: 'Shoot a projectile that teleports you to the first enemy hit',
    ability1_desc_frozen: 'Freeze enemies in an area',
    ability2_desc_frozen: 'Toggle slow aura around you',
    ability1_desc_pulsar: 'Gravity projectile that creates a disarming zone',
    ability2_desc_pulsar: 'Ignore zone: enemies do not see or attack you',

    // Статистика способностей (шаблоны)
    ability1_stats_mirage: (cd, cost) => `Cooldown: ${cd} sec\nCost: ${cost}`,
    ability2_stats_mirage: (cd, invuln, cost) => `Range: 800\nCooldown: ${cd} sec\nInvulnerability: ${invuln} sec\nCost: ${cost}`,
    ability1_stats_frozen: (radius, duration, cost) => `Radius: ${radius} px\nDuration: ${duration} sec\nCooldown: 3 sec\nCost: ${cost}`,
    ability2_stats_frozen: (radius, slow, drain) => `Radius: ${radius} px\nSlow: ${slow}%\nDrain: ${drain}/sec`,
    ability1_stats_pulsar: (radius, cost) => `Radius: ${radius} px\nCooldown: 15 sec\nDuration: 4 sec\nCost: ${cost}`,
    ability2_stats_pulsar: (radius, cost) => `Radius: ${radius} px\nCooldown: 12 sec\nDuration: 3 sec\nCost: ${cost}`,
};

export default LOCALE;