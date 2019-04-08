/**
 * Internationalization Developer Module
 *
 * @author Dinis Madeira (dinismadeira@tecnico.ulisboa.pt)
 * @version 2018
 */

(() => {
    const fs = require('fs');
    
    // Search strings to be translated in a file
    i18n.searchStringsInFile = file => new Promise(resolve => {
        fs.readFile(file, 'utf8', function(e, content) {
            if (e) throw e;
            const strings = [];
            const matches = content.match(/i18n\(?`.+?`/g);
            if (matches) {
                for (const match of matches) {
                    let i = 0;
                    const text = match.match(/i18n\(?`(.+?)`/)[1].replace(/\${.+?}/g, () => '$' + ++i);
                    strings.push(text);
                }
            }
            resolve(strings);
        });
    });

    // Search elements to be translated
    i18n.searchElements = () => {
        const els = i18n.elements();
        const strings = [];
        for (let i = 0; i < els.length; i++) {
            const el = els[i];
            const text = i18n.map.get(el) || el.innerHTML;
            strings.push(text);
        }
        return strings;
    };
    
    // Search scripts to be translated
    i18n.searchScripts = () => Array.from(document.getElementsByTagName("script")).map(e => e.getAttribute("src")).filter(e => e);

    // Search all strings to be translated and generate the dictionary
    i18n.search = async (lang = "pt") => {
        // Search elements
        const strings = i18n.searchElements();
        
        // Search strings in script files
        for (const file of i18n.searchScripts()) {
            strings.push(...await i18n.searchStringsInFile(file));
        }
        
        // Compute strings and translations
        const set = new Set();
        const dic = [];
        for (const text of strings) {
            if (set.has(text)) continue;
            set.add(text);
            dic.push("    " + JSON.stringify(text) + ": `" + (i18n.dics[lang][text] || "") + "`");
        }
        
        // Generate dictionary object
        const result = `i18n.dics.${lang} = {\n${dic.join(",\n")}\n};\n`;
        
        // Write dictionary file
        const dicFile = `i18n-${lang}.js`;
        fs.writeFile(dicFile, result, e => {
            if (e) console.error(e);
            else console.log(`Dictionary file '${dicFile}' generated.`);
        }); 
        
        return result;
    };
})();
