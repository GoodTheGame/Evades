// js/version.js

export const VERSION = {
    number: '1.1', // Обновляем номер версии
    name: 'Beta - First Release',
    date: '2026-06-13',
    changelog: [
        {
            version: '0.1.1',
            date: '2026-06-13',
            name: 'Alpha - Mouse & UI Refinement', // Название для новой версии
            changes: [
                {
                    type: 'changed',
                    description: 'Система управления мышью: реализована плавная кривая ускорения/замедления без DEAD_ZONE, имитирующая поведение Evades.'
                },
                {
                    type: 'changed',
                    description: 'Система управления мышью: добавлена настройка MIN_SPEED_FRACTION_AT_CENTER для контроля минимальной скорости в центре.'
                },
                {
                    type: 'changed',
                    description: 'Блокировка кликов по UI: обновлена логика InputManager.onMouseDown для корректной блокировки переключения режима мыши при кликах по элементам UI.'
                },
                {
                    type: 'added',
                    description: 'Блокировка кликов по миникарте: добавлена проверка в InputManager.onMouseDown для блокировки переключения режима мыши при клике на область миникарты.'
                },
                {
                    type: 'fixed',
                    description: 'Исправлено "дрожание" и "взаимоперенаправляемое движение" шара в центре при управлении мышью.'
                },
                {
                    type: 'fixed',
                    description: 'Исправлена проблема, при которой клики по хотбару, кнопкам прокачки, звёздам способностей и миникарте переключали режим мыши.'
                }
            ]
        },
        {
            version: '0.1.0',
            date: '2026-06-13',
            name: 'Alpha - Foundation',
            changes: [
                {
                    type: 'added',
                    description: 'Базовая система движения игрока (WASD/стрелки)'
                },
                {
                    type: 'added',
                    description: 'Камера с плавным следованием за игроком'
                },
                {
                    type: 'added',
                    description: 'Мини-карта с отображением всей арены (1800x700)'
                },
                {
                    type: 'added',
                    description: 'Система порталов для перехода между аренами'
                },
                {
                    type: 'added',
                    description: 'Safe zones с обеих сторон арены (неуязвимость)'
                },
                {
                    type: 'added',
                    description: 'Спавн врагов (Normal и Wall типы)'
                },
                {
                    type: 'added',
                    description: 'Система XP орбов (радужные цвета, магнит к игроку)'
                },
                {
                    type: 'added',
                    description: 'Система уровней игрока и очков прокачки (SP)'
                },
                {
                    type: 'added',
                    description: 'Прокачка характеристик: Speed, Energy, Regen'
                },
                {
                    type: 'added',
                    description: 'Система способностей с кулдаунами'
                },
                {
                    type: 'added',
                    description: 'Способность 1 (Shift): телепорт в safe zone'
                },
                {
                    type: 'added',
                    description: 'Способность 2 (Space): телепорт к врагу с неуязвимостью'
                },
                {
                    type: 'added',
                    description: 'Прокачка способностей через звёзды (5 уровней)'
                },
                {
                    type: 'added',
                    description: 'UI: хотбар с характеристиками и способностями'
                },
                {
                    type: 'added',
                    description: 'Визуальные индикаторы: кулдауны, мана, XP'
                },
                {
                    type: 'added',
                    description: 'Система мерцающих звёзд для прокачки'
                },
                {
                    type: 'fixed',
                    description: 'Исправлены границы спавна врагов (только в игровой зоне)'
                },
                {
                    type: 'fixed',
                    description: 'Исправлена система неуязвимости после телепорта'
                },
                {
                    type: 'fixed',
                    description: 'Исправлено отображение кулдаунов способностей'
                }
            ]
        }
    ]
};

// Утилита для отображения версии в консоли
export function logVersion() {
    console.log(`%c${VERSION.name} v${VERSION.number}`, 'color: #00d9ff; font-size: 20px; font-weight: bold;');
    console.log(`%cReleased: ${VERSION.date}`, 'color: #888; font-size: 12px;');
    console.log(`%cTotal changes: ${VERSION.changelog.reduce((sum, release) => sum + release.changes.length, 0)}`, 'color: #888; font-size: 12px;');
}

// Утилита для получения форматированного changelog
export function getChangelogFormatted() {
    let output = '';
    for (const release of VERSION.changelog) {
        output += `\n${'='.repeat(60)}\n`;
        output += `Version ${release.version} - ${release.name}\n`;
        output += `Released: ${release.date}\n`;
        output += `${'='.repeat(60)}\n`;

        const grouped = {
            added: [],
            changed: [],
            fixed: [],
            removed: []
        };

        for (const change of release.changes) {
            if (grouped[change.type]) {
                grouped[change.type].push(change.description);
            }
        }

        if (grouped.added.length > 0) {
            output += '✨ ADDED:\n';
            grouped.added.forEach(item => output += `  • ${item}\n`);
            output += '\n';
        }
        if (grouped.changed.length > 0) {
            output += '🔄 CHANGED:\n';
            grouped.changed.forEach(item => output += `  • ${item}\n`);
            output += '\n';
        }
        if (grouped.fixed.length > 0) {
            output += '🐛 FIXED:\n';
            grouped.fixed.forEach(item => output += `  • ${item}\n`);
            output += '\n';
        }
        if (grouped.removed.length > 0) {
            output += '🗑️  REMOVED:\n';
            grouped.removed.forEach(item => output += `  • ${item}\n`);
            output += '\n';
        }
    }
    return output;
}