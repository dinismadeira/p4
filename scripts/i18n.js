/**
 * Internationalization Module
 *
 * @author Dinis Madeira (dinismadeira@tecnico.ulisboa.pt)
 * @version 2018
 */
 
'use strict';

(() => {
    // Translate a string
    var i18n = function (strings, ...values) {
        let text;
        if (typeof strings === 'string') text = strings;
        else {
            text = strings[0];
            for (let i = 1; i < strings.length; i++) {
                text += "$" + i + strings[i];
            }
        }
        const translation = (i18n.lang != "en" && i18n.dics[i18n.lang][text] || text).replace(/\$(\d)/g, (match, p1) => values[Number(p1) - 1]);
        // console.log("i18n:", text, translation);
        // console.log("i18n:", strings, values, text, translation);
        return translation;
    };

    i18n.lang = 'en';
    i18n.dics = {};
    
    // Set language for translation
    i18n.setLanguage = lang => i18n.lang = lang in i18n.dics ? lang : 'en';
    
    // Search for elements in the document to translate
    i18n.elements = () => document.querySelectorAll("*[data-i18n]");

    // Translate the document
    i18n.translate = () => {
        const isEn = i18n.lang == "en";
        if (!i18n.map) {
            if (isEn) return;
            i18n.map = new Map();
        }
        const getTranslation = isEn ? text => text : text => i18n.dics[i18n.lang][text];
        for (const el of i18n.elements()) {
            const inMap = i18n.map.has(el);
            const text = inMap ? i18n.map.get(el) : el.innerHTML;
            const translation = getTranslation(text);
            if (translation) {
                el.innerHTML = translation;
                if (!inMap) i18n.map.set(el, text);
            }
        }
    };

    if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') module.exports = i18n;
    else window.i18n = i18n;
})();
