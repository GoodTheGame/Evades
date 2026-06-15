// js/utils.js

export function makeRainbow(element) {
    element.classList.add('rainbow-text');
}

export function removeRainbow(element) {
    element.classList.remove('rainbow-text');
}

export function makeWaveText(element, baseColor = '#400080', brightColor = '#ff66ff', speed = 3) {
    const text = element.textContent;
    if (element.dataset.originalText === text && element.querySelector('.wave-char')) {
        return;
    }
    element.dataset.originalText = text;
    element.innerHTML = '';

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const span = document.createElement('span');
        span.textContent = char;
        span.classList.add('wave-char');
        span.style.animationDelay = `${(i / text.length) * speed}s`;
        span.style.animationDuration = `${speed}s`;
        span.style.setProperty('--wave-base', baseColor);
        span.style.setProperty('--wave-bright', brightColor);

        // Гарантируем, что пробелы не схлопнутся
        if (char === ' ') {
            span.style.whiteSpace = 'pre';
        }

        element.appendChild(span);
    }
}

export function removeWaveText(element) {
    // Восстанавливаем исходный текст, только если он отличается от сохранённого
    if (element.dataset.originalText) {
        if (element.textContent !== element.dataset.originalText) {
            element.textContent = element.dataset.originalText;
        }
        delete element.dataset.originalText;
    }
    // Удаляем все спаны волны
    const spans = element.querySelectorAll('.wave-char');
    spans.forEach(span => span.remove());
}