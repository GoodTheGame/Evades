// js/utils.js

/**
 * Делает текст элемента переливающимся радугой.
 * @param {HTMLElement} element
 */
export function makeRainbow(element) {
    element.classList.add('rainbow-text');
}

/**
 * Убирает радужный эффект с элемента.
 * @param {HTMLElement} element
 */
export function removeRainbow(element) {
    element.classList.remove('rainbow-text');
}

/**
 * Делает границу элемента радужной (вращающийся градиент).
 * @param {HTMLElement} element
 */
export function makeRainbowBorder(element) {
    element.style.borderImage = 'conic-gradient(red, yellow, lime, cyan, blue, magenta, red) 1';
    element.style.borderWidth = '2px';
    element.style.borderStyle = 'solid';
    element.style.animation = 'rainbowSpin 4s linear infinite';
}

// Добавим keyframes в head, если ещё нет
if (!document.getElementById('rainbow-keyframes')) {
    const style = document.createElement('style');
    style.id = 'rainbow-keyframes';
    style.textContent = `
        @keyframes rainbowSpin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);
}