/**
 * P4 Assembler and Simulator
 *
 * @author Dinis Madeira (dinismadeira@tecnico.ulisboa.pt)
 * @version 2018
 */
 
'use strict';

window.p4 = {};

/** Storage API */
const storage = {
    get: name => {
        try {
            return localStorage.getItem(name);
        }
        catch (e) {
            console.warn(e);
            try {
                return JSON.parse(window.name)[name];
            }
            catch (e) {
                console.warn(e);
            }
        }
    },
    set: (name, value) => {
        try {
            localStorage.setItem(name, value);
        }
        catch (e) {
            console.warn(e);
            try {
                const data = JSON.parse(window.name);
                data[name] = value;
                window.name = JSON.stringify(data);
            }
            catch (e) {
                console.warn(e);
            }
        }
    },
    rem: name => {
        try {
            localStorage.removeItem(name, value);
        }
        catch (e) {
            console.warn(e);
            try {
                const data = JSON.parse(window.name);
                delete(data[name]);
                window.name = JSON.stringify(data);
            }
            catch (e) {
                console.warn(e);
            }
        }
    },
    has: name => {
        try {
            return localStorage.hasOwnProperty(name);
        }
        catch (e) {
            console.warn(e);
            try {
                const data = JSON.parse(window.name);
                return name in data;
            }
            catch (e) {
                console.warn(e);
            }
        }
    }
};

const fileManager = p4.fileManager = {
    initialContent: null, // promise to the initial value of the editor
    currentFile: null, // current file in the editor
    currentFileOption: null, // selected option (in the select HTML element)
    currentFileIsDemo: false,
    currentFileChanged: false,
    fileSelect: null, // select HTML element
    fileDemosGroup: null, // group HTML element
    fileSavedGroup: null, // group HTML element
    demos: {}, // loaded demos
    fileList: {}, // saved files
    // store file list
    fileListStore: () => storage.set("FILELIST", JSON.stringify(fileManager.fileList)),
    // retrieves file list from storage
    fileListLoad: () => {
        const fileList = storage.get("FILELIST");
        fileManager.fileList = fileList ? JSON.parse(fileList) : {};
    },
    // demo list
    demoList: () => ({Welcome: i18n`Welcome`, Blink: i18n`Blink`, 'G-Sensor': i18n`G-Sensor`, LCD: i18n`LCD`, LEDs: i18n`LEDs`, Terminal: i18n`Terminal`, 'Logo-P4': i18n`Logo P4`, 'Logo-P3': i18n`Logo P3`, Keyboard: i18n`Keyboard`, 'Keyboard-Interrupts': i18n`Keyboard Interrupts`, Template: i18n`Template`}),
    currentFileIsSavable: () => fileManager.currentFile && !fileManager.currentFileIsDemo,
    getDemoContent: demo => new Promise((resolve, reject) => {
        if (fileManager.demos[demo]) resolve(fileManager.demos[demo]);
        else {
            const script = document.createElement("script");
            script.setAttribute("src", "demos/" + demo + ".js");
            script.addEventListener("load", () => resolve(fileManager.demos[demo]));
            document.head.appendChild(script);
        }
    }),
    // populate select with saved files and demos
    addFileOptions: () => {
        for (const file in fileManager.fileList) {
            fileManager.addSavedFileOption(file);
        }
        const demoList = fileManager.demoList();
        for (const file in demoList) {
            fileManager.addDemoFileOption(file, demoList[file]);
        }
    },
    // add file to the list
    addFileOption: (file, label, fileGroup, fileIsDemo) => {
        const option = document.createElement("option");
        if (fileIsDemo) option.setAttribute("data-demo", "");
        option.setAttribute("data-file", file);
        option.innerText = label;
        fileGroup.appendChild(option);
        return option;
    },
    addSavedFileOption: file => fileManager.addFileOption(file, file, fileManager.fileSavedGroup),
    addDemoFileOption: (file, label) => fileManager.addFileOption(file, label, fileManager.fileDemosGroup, true),
    // remove file from the list
    removeFileOption: file => {
        const option = fileManager.getFileOption(file);
        option.parentNode.removeChild(option);
    },
    // get option for file
    getFileOption: (file, fileIsDemo = false) => {
        const iscurrentFile = fileIsDemo ?
            option => option.getAttribute("data-file") === file && option.hasAttribute("data-demo") :
            option => option.getAttribute("data-file") === file;
        for (const option of fileManager.fileSelect.options) {
            if (iscurrentFile(option)) return option;
        }
        // return new file option
        return fileManager.fileSelect.options[0];
    },
    // get current file option
    getCurrentFileOption: () => fileManager.getFileOption(fileManager.currentFile, fileManager.currentFileIsDemo),
    // get selected option
    getSelectedOption: () => fileManager.fileSelect.options[fileManager.fileSelect.selectedIndex],
    // set has changes marker
    setHasChangesMarker: option => option.innerText += '*',
    // clear has changes marker
    clearHasChangesMarker: option => option.innerText = option.getAttribute("data-file") || i18n`New File…`,
    // select new file (will prompt when were unsaved changes, returns false if canceled)
    newFile: () => {
        fileManager.fileSelect.selectedIndex = 0;
        return fileManager.selectedFile();
    },
    saveFile: fileName => {
        const save = file => storage.set("FILE " + file, codeMirror.getValue());
        if (fileManager.currentFileIsSavable()) {
            const file = fileManager.currentFile;
            fileManager.fileList[file].modified = Date.now();
            fileManager.fileListStore();
            save(file);
            fileManager.fileChanged(false);
        }
        else {
            const file = fileName || prompt(i18n`File name?`, fileManager.currentFile || new Date().toLocaleString());
            if (file) {
                const fileExists = file in fileManager.fileList;
                if (!fileExists || confirm(i18n`There's already a file named ${file}, overwrite?`)) {
                    fileManager.fileList[file] = {created: Date.now(), modified: Date.now()};
                    fileManager.fileListStore();
                    save(file);
                    fileManager.fileChanged(false);

                    if (fileExists) fileManager.removeFileOption(file);
                    const option = fileManager.addSavedFileOption(file);
                    option.selected = true;
                    fileManager.selectedFile();
                }
            }
        }
    },
    deleteFile: () => {
        if (fileManager.currentFileIsSavable()) {
            if (confirm(i18n`Are you sure you want to delete this file?`)) {
                fileManager.fileChanged(false); // disable save changes prompt
                const file = fileManager.currentFile;
                delete(fileManager.fileList[file]);
                fileManager.fileListStore();
                storage.rem("FILE " + file);
                fileManager.removeFileOption(file);
                fileManager.newFile();
            }
        }
    },
    // sets selected file as current file
    selectedFile: () => {
        if (fileManager.currentFileChanged && !confirm(i18n`Changes to current file will be lost. Continue?`)) {
            // cancel change
            const option = fileManager.getCurrentFileOption();
            option.selected = true;
            return false;
        }
        fileManager.fileChanged(false); // clear *
        const option = fileManager.getSelectedOption();
        fileManager.currentFile = option.getAttribute("data-file") || "";
        fileManager.currentFileIsDemo = option.hasAttribute("data-demo");
        storage.set("fileManager.currentFile", fileManager.currentFile);
        storage.set("fileManager.currentFileIsDemo", fileManager.currentFileIsDemo);
        fileManager.loadFile();
        return true;
    },
    getFile: async () => {
        const file = fileManager.currentFile;
        return fileManager.currentFileIsDemo ?
            fileManager.getDemoContent(file) :
            (file ? storage.get("FILE " + file) || "" : "");
    },
    loadFile: async () => {
        const content = await fileManager.getFile();
        // console.log("loadFile", fileManager.currentFile, fileManager.currentFileIsDemo, content);
        codeMirror.setValue(content);
    },
    uploadFile: () => {
        UI.fileUploader.upload(async (file, getFileContent) => {
            if (/\.as$/i.test(file.name)) {
                if (fileManager.newFile()) {
                    const content = await getFileContent();
                    codeMirror.setValue(content);
                    fileManager.fileChanged(true);
                    //fileManager.saveFile(file.name.replace(/\.as$/i, ''));
                }
            }
            else if (/\.p4z$/i.test(file.name)) {
                if (fileManager.newFile()) {
                    const content = await getFileContent(true);
                    const {prog, data} = await readProgram(content);
                    const progAssembly = disassemble.prog(prog);
                    const dataAssembly = disassemble.data(data);
                    codeMirror.setValue(dataAssembly + "\n" + progAssembly);
                    fileManager.fileChanged(true);
                }
            }
            else alert(i18n`File extension not recognized in: ${file.name}`);
        }, ".as,.p4z");
    },
    fileChanged: changed => {
        if (fileManager.currentFileChanged != changed) {
            if (changed) {
                // add has changes marker to selected option
                fileManager.setHasChangesMarker(fileManager.getSelectedOption());
            }
            else {
                // clear has changes marker to current file
                fileManager.clearHasChangesMarker(fileManager.getCurrentFileOption());
            }
            fileManager.currentFileChanged = changed;
            storage.set("fileManager.currentFileChanged", changed);
        }
        storage.set("FILECONTENT", codeMirror.getValue());
    },
    preload: () => {
        // load default values
        if (!storage.has("fileManager.currentFile")) {
            fileManager.currentFile = fileManager.demoList().Welcome;
            fileManager.currentFileIsDemo = true;
            fileManager.currentFileChanged = false;
        }
        // load saved values
        else {
            fileManager.currentFile = storage.get("fileManager.currentFile");
            fileManager.currentFileIsDemo = storage.get("fileManager.currentFileIsDemo") === "true";
            fileManager.currentFileChanged = storage.get("fileManager.currentFileChanged") === "true";
        }
        // restore content
        if (fileManager.currentFileChanged) {
            fileManager.initialContent = new Promise(resolve => resolve(storage.get("FILECONTENT")));
        }
        // load file content
        else fileManager.initialContent = fileManager.getFile();
    },
    init: () => {
        fileManager.fileSelect = document.getElementById("fileSelect");
        fileManager.fileSavedGroup = document.getElementById("fileSavedGroup");
        fileManager.fileDemosGroup = document.getElementById("fileDemosGroup");

        fileManager.fileListLoad();
        fileManager.addFileOptions();

        // select current file
        const option = fileManager.getFileOption(fileManager.currentFile, fileManager.currentFileIsDemo);
        option.selected = true;

        // set has changes marker and restore content
        if (fileManager.currentFileChanged) {
            fileManager.setHasChangesMarker(option);
        }
        
        // load content
        fileManager.initialContent.then(content => {
            codeMirror.setValue(content);
            UI.assembler.lint();
        });
    }
};
fileManager.preload();

const UI = p4.UI = {
    elements: {}, // HTML elements
    assembler: {
        callbacks: [],
        assemblyHashCode: null, // hash code of the last assembled assembly
        // assemble and update UI
        assemble: lint => {
            const assembly = codeMirror.getValue();
            const now = Date.now();
            const result = p4.result = assembler.assemble(assembly);
            console.log("Assembled in: " + (Date.now() - now) + " ms.");
            const errors = [];
            if (result.stats.errors) errors.push(`<span style="color: red">${result.stats.errors} ${result.stats.errors == 1 ? i18n`error` : i18n`errors`}</span>`);
            if (result.stats.warnings) errors.push(`<span style="color: orange">${result.stats.warnings} ${result.stats.warnings == 1 ? i18n`warning` : i18n`warnings`}</span>`);
            UI.message.set(i18n(`Program assembled in $1 ms$2.`, Date.now() - now, (errors.length ? " " + i18n`with` + " " + errors.join(" " + i18n`and` + " ") : '')));
            UI.assembler.output.update()
            for (const cb of UI.assembler.callbacks) cb();
            console.log("Result:", result);
            return result; 
        },
        lint: () => {
            const assembly = codeMirror.getValue();
            const assemblyHashCode = (s => s.split("").reduce((a,b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a }, 0))(assembly);
            if (UI.assembler.assemblyHashCode != assemblyHashCode) { // assemble only if hash code has changed
                UI.assembler.assemblyHashCode = assemblyHashCode;
                return UI.assembler.assemble();
            }
            else console.log("Already linted.");
        },
        output: {
            debug: result => {
                const debug = [];
                for (const e of result.errors) result.debug[e.line].errors.push(e); // FIXME: altera result?
                for (const d of result.debug) {
                    if (d.assembly.length) {
                        const code = d.code.replace(/^(\s+)|(\s+)$/g, '').replace(/\s+/g, ' ');
                        debug.push(
                            code.padEnd(40, ' ') +
                            (d.assembly.length ? " " + d.assembly.map(a => String(a.addr).padStart(5, ' ') + ": " + a.data.toString(2).padStart(16 ,'0')).join(", ") : "") + (
                            d.errors.length ? ' ' + d.errors.map(e => e.message).join(" ") : "")
                        );
                    }
                }
                return debug.join("\n");
            },
            labels: labels => {
                const dec2char = n => cp437.toChar(n);
                const output = [];
                for (const label in labels) {
                    const value = labels[label];
                    output.push([
                        label.padEnd(15, ' '),
                        String(value).padStart(5, ' '),
                        value.toString(16).padStart(4, '0'),
                        value.toString(2).padStart(16, '0'),
                        (value < 256 ? dec2char(value) : '')
                    ].join("  "));
                }
                return output.join("\n");
            },
            errors: result => {
                const errors = Array.from(result.errors);
                errors.sort((e1, e2) => e2.line > e1.line ? -1 : 1);
                return errors.map(e => i18n`Line: ${e.line + 1} Col: ${e.from}-${e.to} ${e.message}`).join("\n");
            },
            BIN: instructions => Array.from(instructions).map(i => i.toString(2).padStart(16, '0')).join("\n").replace(/(0{16})(\n0{16})+(\n0{16})/g, "$1\n...$2"),
            HEX: instructions => Array.from(instructions).map(i => i.toString(16).padStart(4, '0')).join("\n").replace(/(0{4})(\n0{4})+(\n0{4})/g, "$1\n...$2"),
            ASCII: instructions => instructions.map(i => String.fromCharCode(i >> 8, i & 255)).join(""),
            /*intelHexCheckSum: bytes => {
                let sum = 0;
                for (let i = 0; i < bytes.length; i += 2) {
                    sum += parseInt(bytes.substr(i, 2), 16);
                }
                return bytes + ((256 - (sum & 255)) & 255).toString(16).padStart(2, '0');
            },
            HEX: instructions => Array.from(instructions).map(
                (i, addr) => ':' + intelHexCheckSum('02' + addr.toString(16).padStart(4, '0') + '00' + i.toString(16).padStart(4, '0')).toUpperCase()
            ).join("\n") + "\n:00000001FF\n",*/
            generate: (result, type) => {
                switch (type) {
                    case 'errors': return UI.assembler.output.errors(result);
                    case 'debug': return UI.assembler.output.debug(result);
                    case 'labels': return UI.assembler.output.labels(result.labels);
                    case 'HEX': return UI.assembler.output.HEX(result.program);
                    case 'MIF': return generateMIF(result.program, 16, 16);
                    case 'BIN': return UI.assembler.output.BIN(result.program);
                    //case 'ASCII': return generateASCII(result.program);
                    //case 'IntelHex': return generateIntelHEX(result.program);
                }
            },
            update: () => {
                if (!assembler.result.instructions) return;
                const outContainer = UI.elements.outContainer;
                const outputType = settings.get('outputType');
                if (outputType == "none") outContainer.style.display = 'none';
                else {
                    outContainer.value = UI.assembler.output.generate(assembler.result, outputType);
                    outContainer.style.display = '';
                }
            }
        }
    },
    editor: {
        breakpoint: {
            marker: () => {
                const marker = document.createElement("div");
                marker.style.color = "red";
                marker.innerHTML = "●";
                return marker;
            }
        },
        init: () => {
            window.codeMirror = new CodeMirror(document.getElementById("editorContainer"), {
                lineNumbers: true,
                indentUnit: 8,
                gutters: ["CodeMirror-lint-markers", "breakpoints"],
                mode: 'p4',
                theme: 'eclipse',
                lint: {
                    getAnnotations: code => {
                        if (settings.get('linter')) {
                            console.log("Linting...");
                            if (!window.codeMirror) return;
                            UI.assembler.lint();
                            return p4.result.errors.map(e => ({
                                severity: e.severity || 'error',
                                message: e.from + ':' + e.to + ' ' + e.message,
                                from: CodeMirror.Pos(e.line, e.from),
                                to: CodeMirror.Pos(e.line, e.to)
                            }));
                        }
                        else return [];
                    }
                },
                rulers: (() => {
                    const rulers = [];
                    for (let i = 0; i < 81; i += 8) {
                        rulers.push({column: i, className: "rulerExtra", color: "#dadada"});
                    }
                    rulers.push({column: 16, className: "ruler", color: "#c0c0ff"});
                    rulers.push({column: 24, className: "ruler", color: "#c0c0ff"});
                    rulers.push({column: 80, className: "ruler", color: "#ffc0c0"});
                    return rulers;
                })(),
                extraKeys: {
                    Tab: function(cm) {
                        var spaces = new Array(cm.getOption("indentUnit") + 1).join(" ");
                        cm.replaceSelection(spaces, "end", "+input");
                    }
                }
            });
            codeMirror.on("change", (instance, changeObj) => {
                console.log("Editor content changed.", changeObj);
                if (changeObj.origin != 'setValue') fileManager.fileChanged(true);
                
                // smart indent
                const cursor = codeMirror.getCursor();
                const left = codeMirror.getRange({line: cursor.line, ch: 0}, {line: cursor.line, ch: cursor.ch});
                const replaceLeft = replacement => codeMirror.replaceRange(replacement, {line: cursor.line, ch: 0}, {line: cursor.line, ch: cursor.ch});
                if (!/;/.test(left)) {
                    if (changeObj.origin == "+input") {
                        if (changeObj.text[0] == ':') {
                            replaceLeft(left.replace(/^\s+/, '').padEnd(16, ' '));
                        }
                        else if (/^[ \t]$/.test(changeObj.text[0])) {
                            if (left.length < 16) replaceLeft(left.replace(/\t/, ' ').padEnd(16, " "));
                            else if (left.length < 24) replaceLeft(left.replace(/\t/, ' ').padEnd(24, " "));
                        }
                    }
                    else if (changeObj.origin == "+delete") {
                        // Delete space with backspace
                        if (/^[ \t]$/.test(changeObj.removed[0]) && changeObj.from.sticky == 'after' && !('xRel' in changeObj.from)) {
                            if (left.length > 24) replaceLeft(left.replace(/\s+$/, '').padEnd(24, " "));
                            else if (left.length > 16) replaceLeft(left.replace(/\s+$/, '').padEnd(16, " "));
                            else replaceLeft(left.replace(/\s+$/, ''));
                        }
                    }
                }
            });
            codeMirror.on("gutterClick", function(cm, n) {
                const info = cm.lineInfo(n);
                const hasBreakpoint = info.gutterMarkers && info.gutterMarkers.breakpoints;
                cm.setGutterMarker(n, "breakpoints", hasBreakpoint ? null : UI.editor.breakpoint.marker());
            });
        }
    },
    filePicker:  {
        //picker: null,
        //handler: null,
        init: () => {
            //UI.filePicker.picker = document.getElementById("filePicker");
            //UI.filePicker.picker.addEventListener("input", () => UI.filePicker.handler(UI.filePicker.picker.value));
            const inputs = document.querySelectorAll('[data-filepicker]');
            for (const input of inputs) {
                const fileInput = document.createElement("input");
                fileInput.setAttribute("type", "file");
                fileInput.setAttribute("accept", input.getAttribute("data-filepicker"));
                fileInput.style.display = 'none';
                input.parentNode.insertBefore(fileInput, input);
                fileInput.addEventListener("input", () => input.value = fileInput.value);
                input.addEventListener("click", () => fileInput.click());
            }
        }/*,
        pick: (handler, accept) => {
            UI.filePicker.picker.setAttribute("accept", accept);
            UI.filePicker.handler = handler;
            UI.filePicker.picker.click();
        }*/
    },
    fileUploader: {
        fileUpload: null,
        handler: null,
        init: () => {
            const fileUpload = UI.fileUploader.fileUpload = document.getElementById("fileUpload");
            fileUpload.addEventListener('change', async e => {
                if (!e.target.files.length) return;
                const file = e.target.files[0];
                const getFileContent = readAsArrayBuffer => new Promise(resolve => {
                    const fileReader = new FileReader();
                    fileReader.onload = e => {
                        resolve(e.target.result);
                    };
                    if (readAsArrayBuffer) fileReader.readAsArrayBuffer(file);
                    else fileReader.readAsText(file);
                });
                UI.fileUploader.handler(file, getFileContent);
            });
        },
        upload: (handler, accept) => {
            UI.fileUploader.handler = handler;
            const fileUpload = UI.fileUploader.fileUpload;
            fileUpload.setAttribute("accept", accept || "");
            fileUpload.value = '';
            fileUpload.click();
        }
    },
    fullscreen: {
        state: false,
        handlers: new Map(),
        init: () => {
            document.getElementById("fullscreen").addEventListener("click", () => {
                UI.fullscreen.toggle(document.documentElement, state => {
                    document.getElementById("fullscreen").innerHTML = state ? '✕' : '↗';
                });
            });
            ["webkit", "moz", "ms", ""].forEach(p => {
                document.addEventListener(p + "fullscreenchange", UI.fullscreen.updateState);
            });
        },
        toggle: (el, handler) => {
            if (UI.fullscreen.state) UI.fullscreen.exit();
            else UI.fullscreen.request(el, handler);
        },
        request: (el, handler) => {
            const requestFullScreen = el.requestFullscreen || el.msRequestFullscreen || el.mozRequestFullScreen || el.webkitRequestFullscreen;
            if (requestFullScreen) {
                UI.fullscreen.handlers.set(el, handler);
                requestFullScreen.apply(el);
            }
        },
        exit: () => {
            const exitFullScreen = document.exitFullscreen || document.msExitFullscreen || document.mozCancelFullScreen || document.webkitExitFullscreen;
            if (exitFullScreen) exitFullScreen.apply(document);
        },
        updateState: e => {
            UI.fullscreen.state = !UI.fullscreen.state;
            const handler = UI.fullscreen.handlers.get(e.target);
            if (handler) handler(UI.fullscreen.state);
        }
    },
    message: {
        set: (text, className) => {
            UI.elements.outMessage.innerHTML = text;
            UI.elements.outMessage.className = className;
        }
    },
    init: () => {
        UI.elements.outContainer = document.getElementById('out');
        UI.elements.outMessage = document.getElementById('outMessage');
        UI.editor.init();
        UI.fullscreen.init();
        UI.filePicker.init();
        UI.fileUploader.init();
    }
};

const settings = p4.settings = {
    // default values
    data: {
        linter: true,
        autoLoad: true,
        rulers: true,
        rulersExtra: false,
        outputType: 'MIF',
        simSpeedInputRange: 10,
        regFormat: 0,
        terminalFontSize: 9,
        lang: navigator.language.replace(/-.+/, ''),
        simMemoryAddr: {}
    },
    bindEvents: true, // this flag is set to false on updateUI to prevent binding events more than once
    dataChanged: true,
    updatedSetting: (name, value) => {
        switch (name) {
            case 'rulers': codeMirror.getWrapperElement().classList[value ? 'add' : 'remove']('showRulers'); break;
            case 'rulersExtra': codeMirror.getWrapperElement().classList[value ? 'add' : 'remove']('showRulersExtra'); break;
            case 'outputType': UI.assembler.output.update(); break;
            case 'lang': {
                console.time("translate");
                i18n.setLanguage(value);
                i18n.translate();
                i18n.translate(value); 
                console.timeEnd("translate");
                break;
            }
            case 'terminalFontSize': {
                if (value) {
                    const container = document.getElementById("simTerminal");
                    container.style.width = (value * 80) + 'px';
                    container.style.height = (value * 45) + 'px';
                }
                break;
            }
        }
    },
    updateSetting: (name, value) => {
        settings.set(name, value);
        settings.updatedSetting(name, value);
    },
    init: () => {
        // load settings
        settings.load();
        
        // store changes every 30 seconds
        setInterval(settings.storeChanges, 30000);

        // store changes on exit
        window.addEventListener("beforeunload", settings.storeChanges);
    },
    updateUI: () => {
        // update UI for current stored settings
        for (const i in settings.data) settings.updatedSetting(i, settings.data[i]);

        // update inputs and add listeners
        const inputs = document.querySelectorAll('[data-sets]');
        for (const input of inputs) {
            const name = input.getAttribute('data-sets') || input.id;
            const value = settings.data[name];
            if (input.tagName == 'INPUT') {
                switch (input.type) {
                    case 'checkbox': {
                        input.checked = value;
                        if (settings.bindEvents) {
                            input.addEventListener('click', () => settings.updateSetting(name, input.checked));
                        }
                        break;
                    }
                    case 'range': {
                        input.value = value;
                        if (settings.bindEvents) {
                            input.addEventListener('input', () => settings.updateSetting(name, input.value));
                        }
                        break;
                    }
                }
            }
            else if (input.tagName == 'SELECT') {
                for (const option of input.options) {
                    if (option.value == value) {
                        option.selected = true;
                        break;
                    }
                }
                if (settings.bindEvents) {
                    input.addEventListener('change', () => settings.updateSetting(name, input.options[input.options.selectedIndex].value));
                }
            }
        }
        settings.bindEvents = false;
    },
    get: name => settings.data[name],
    set: (name, value) => {
        settings.dataChanged = true;
        settings.data[name] = value;
    },
    storeChanges: () => {
        if (settings.dataChanged) {
            settings.store();
        }
    },
    load: () => {
        // retrieve settings from storage
        let storedSets;
        try { storedSets = JSON.parse(storage.get('sets')); } catch (e) { console.warn(e); }

        // replace defaults with stored settings
        if (storedSets) {
            for (const i in settings.data) {
                if (i in storedSets) settings.data[i] = storedSets[i];
            }
        }
    },
    store: () => {
        console.log('Storing settings.');
        storage.set('sets', JSON.stringify(settings.data));
        settings.dataChanged = false;
    }
};

settings.init();

document.onreadystatechange = function () {
  if (document.readyState == "interactive") {
    UI.init();
    fileManager.init();
    settings.updateUI();
  }
};

window.addEventListener("error", e => {
    console.error(e);
    alert(e.message);
});
