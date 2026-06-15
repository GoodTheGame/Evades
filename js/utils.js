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