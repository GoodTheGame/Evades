// js/language/ru.js
const LOCALE = {
    speed: 'Speed',
    energy: 'Energy',
    regen: 'Regen',
    abilityCost: 'Стоимость',
    abilityDrain: 'Расход',
    area: 'Область',
    level: 'Уровень',
    sp: 'ОП',
    shift: 'Shift',
    space: 'Space',
    reset: 'СБРОС',
    god: 'БОГ',

    hero_mirage_name: 'Мираж',
    hero_mirage_desc: 'Телепорт в сейв-зону, выстрел снарядом с телепортацией при попадании.',
    hero_frozen_name: 'Фрозен',
    hero_frozen_desc: 'Замораживает врагов, замедляет ближайших врагов, имеет щит.',
    hero_pulsar_name: 'Пульсар',
    hero_pulsar_desc: 'Гравитационный снаряд, обезвреживающий врагов, зона игнорирования.',

    ability1_desc_mirage: 'Телепорт в последнюю сейв-зону',
    ability2_desc_mirage: 'Выстрел снарядом: телепортирует к первому поражённому врагу',
    ability1_desc_frozen: 'Замораживает врагов в области',
    ability2_desc_frozen: 'Переключаемая аура замедления вокруг вас',
    ability1_desc_pulsar: 'Гравитационный снаряд, создающий зону обезвреживания',
    ability2_desc_pulsar: 'Зона игнорирования: враги не видят и не атакуют вас',

    ability1_stats_mirage: (cd, cost) => `Перезарядка: ${cd} сек\nСтоимость: ${cost}`,
    ability2_stats_mirage: (cd, invuln, cost) => `Дальность: 800\nПерезарядка: ${cd} сек\nНеуязвимость: ${invuln} сек\nСтоимость: ${cost}`,
    ability1_stats_frozen: (radius, duration, cost) => `Радиус: ${radius} пикс.\nДлительность: ${duration} сек\nПерезарядка: 3 сек\nСтоимость: ${cost}`,
    ability2_stats_frozen: (radius, slow, drain) => `Радиус: ${radius} пикс.\nЗамедление: ${slow}%\nРасход: ${drain}/сек`,
    ability1_stats_pulsar: (radius, cost) => `Радиус: ${radius} пикс.\nПерезарядка: 15 сек\nДлительность: 4 сек\nСтоимость: ${cost}`,
    ability2_stats_pulsar: (radius, cost) => `Радиус: ${radius} пикс.\nПерезарядка: 12 сек\nДлительность: 3 сек\nСтоимость: ${cost}`,
};

export default LOCALE;