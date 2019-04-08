/**
 * Minified Web Version Creation Tool
 *
 * Creates a minified version of the P4 Assembler and Simulator ready for use in a web server.
 * 
 * To create the minified version: node web.js
 * 
 * As folder named 'web' will be created with all the contents that should be put in the web server.
 *
 * @author Dinis Madeira (dinismadeira@tecnico.ulisboa.pt)
 * @version 2018
 */
 
'use strict';

const initTime = Date.now();
const fs = require('fs-extra');
const CleanCSS = require('clean-css');
const minifyHTML = require('html-minifier').minify;
const UglifyJS = require("uglify-es");
const minifyHTMLLiterals = require('minify-html-literals').minifyHTMLLiterals

const parseElement = element => {
    const attrs = {};
    const attrMatches = element.match(/<\w+ (.+?)(?:><\/\w+>|>)/i);
    const attrString = attrMatches[1];
    const attrPairs = attrString.match(/\w+(=("[^"]+"|[^ ]))?/g);
    for (const attrPair of attrPairs) {
        const attrMatches = attrPair.match(/(\w+)(?:=("[^"]+"|[^ ]))?/);
        const attrName = attrMatches[1];
        const attrValue = (attrMatches[2] || "").replace(/^"(.+)"$/, '$1');
        attrs[attrName] = attrValue;
    }
    return attrs;
};

const process = async () => {
    const contents = (await fs.readFile('index.htm')).toString();
    const filesPromise = [];
    const files = [];
    const minified = {script: [], defer: [], css: [], index: contents};
    const scriptMatches = contents.match(/<script .+?><\/script>/gi);
    for (const element of scriptMatches) {
        const attrs = parseElement(element);
        if (attrs.src) {
            minified.index = minified.index.replace(element, '');
            filesPromise.push(fs.readFile(attrs.src));
            files.push({type: 'script', attrs: attrs});
        }
    }

    const linkMatches = contents.match(/<link .+?\/?>/gi);
    for (const element of linkMatches) {
        const attrs = parseElement(element);
        if (attrs.rel == 'stylesheet' && attrs.href) {
            minified.index = minified.index.replace(element, '');
            filesPromise.push(fs.readFile(attrs.href));
            files.push({type: 'css', attrs: attrs});
        }
    }
    const filesContent = await Promise.all(filesPromise);
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const content = filesContent[i].toString();
        if (file.type == 'css') minified.css.push(content);
        else if ('defer' in file.attrs) minified.defer.push(content);
        else minified.script.push(content);
    }
    
    const scriptSrc = `script-${initTime}.js`;
    const deferSrc = `script-defer-${initTime}.js`;
    const cssSrc = `styles-${initTime}.css`;
    
    const rootDir = `web/`
    const scriptFile = rootDir + `script.js`;
    const deferFile = rootDir + `script-defer.js`;
    const cssFile = rootDir + `styles.css`;
    const htmFile = rootDir + `index.htm`;

    const UglifyJSOptions = {
        compress: {
            ecma: 6
        }
    };
    const minifyScript = (file, content) => {
        const minifiedLiterals = minifyHTMLLiterals(content, {fileName: ''});
        const minified = UglifyJS.minify(minifiedLiterals ? minifiedLiterals.code : content, UglifyJSOptions);
        return fs.writeFile(file, minified.code);
    };
    
    minified.index = minified.index.
        replace(/<script>([^]+?)<\/script>/ig, (match, p1) => '<script>' + UglifyJS.minify(p1, UglifyJSOptions).code + '</script>').
        replace(/<\/head>/, `
            <link rel="stylesheet" href="${cssSrc}">
            <script src="${scriptSrc}"></script>
            <script src="${deferSrc}" defer></script>
        </head>`);
    
    const minifyHTMLOptions = {
        collapseBooleanAttributes: true,
        collapseInlineTagWhitespace: true,
        collapseWhitespace: true,
        conservativeCollapse: true,
        decodeEntities: true,
        removeAttributeQuotes: true,
        removeComments: true,
        removeOptionalTags: true,
        removeRedundantAttributes: true,
        removeScriptTypeAttributes: true,
        removeStyleLinkTypeAttributes: true,
        sortAttributes: true,
        sortClassName: true,
        useShortDoctype: true
    };
 
    // Create 'web' folder
    if (!fs.existsSync(rootDir)){
        fs.mkdirSync(rootDir);
    }
    
    // Write minified files and copy necessary folders
    await Promise.all([
        fs.copy('fonts', rootDir + 'fonts'),
        fs.copy('demos', rootDir + 'demos'),
        fs.writeFile(cssFile, new CleanCSS({}).minify(minified.css.join("\n")).styles),
        minifyScript(scriptFile, minified.script.join("\n")),
        minifyScript(deferFile, minified.defer.join("\n")),
        fs.writeFile(htmFile, minifyHTML(minified.index, minifyHTMLOptions))
    ]);

    console.log(`Completed in ${(Date.now() - initTime) / 1000} seconds.`);
};

process();
