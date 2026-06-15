// js/localization.js
import LOCALE_EN from './language/en.js';
import LOCALE_RU from './language/ru.js';

const locales = {
    en: LOCALE_EN,
    ru: LOCALE_RU
};

let currentLang = 'en';
let currentLocale = locales.en;

export function getLocale() {
    return currentLocale;
}

export function setLanguage(lang) {
    if (locales[lang] && lang !== currentLang) {
        currentLang = lang;
        currentLocale = locales[lang];
        const msg = `Language: ${lang === 'ru' ? 'Русский' : 'English'}`;
        console.log(msg);
        return true;
    }
    return false;
}

export function getCurrentLanguage() {
    return currentLang;
}

export function detectLanguage() {
    const browserLang = navigator.language || navigator.userLanguage || 'en';
    const lang = browserLang.startsWith('ru') ? 'ru' : 'en';
    setLanguage(lang);
}