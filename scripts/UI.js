/**
 * P4 Assembler and Simulator UI Event Handlers
 *
 * @author Dinis Madeira (dinismadeira@tecnico.ulisboa.pt)
 * @version 2018
 */
 
'use strict';

// turns a link in to a download link for the provided content
const createDownloadLink = (a, name, content, type = "plain/text") => {
    const file = new File([content], name, {type: type});
    const url = URL.createObjectURL(file);
    a.setAttribute('download', name);
    a.setAttribute('href', url);
};

// file manager interface
document.getElementById("newFileButton").addEventListener("click", fileManager.newFile);
document.getElementById("saveFileButton").addEventListener("click", () => fileManager.saveFile());
document.getElementById("deleteFileButton").addEventListener("click", fileManager.deleteFile);
document.getElementById("uploadFileButton").addEventListener("click", fileManager.uploadFile);
document.getElementById("fileSelect").addEventListener("input", fileManager.selectedFile);

// download source
document.getElementById("downloadSource").addEventListener("click", e => {
    saveAs(new Blob([codeMirror.getValue()], {type: "text/plain;charset=utf-8"}), (fileManager.currentFile || i18n`new`) + ".as");
    e.preventDefault();
});

// download program
document.getElementById("downloadProgram").addEventListener("click", e => {
    writeProgram(p4.result.program, p4.result.data, "blob").then(content => {
        saveAs(content, (fileManager.currentFile || i18n`new`) + ".p4z");
    });
    e.preventDefault();
});

// assemble button
document.getElementById("assembleButton").addEventListener("click", () => UI.assembler.assemble());

// keyboard shortcuts
document.addEventListener("keydown", e => {
    switch (e.key) {
        case "F5": location.reload(); break; // F5: page reloas
        case "s": if (e.ctrlKey) fileManager.saveFile(); break; // CTRL+S: save
        case "J": {
            if (e.ctrlKey) { // ctrl+shift+J: open console
                if (typeof require == 'function') {
                    require('nw.gui').Window.get().showDevTools();
                }
            }
            break;
        }
        case "Escape": UI.fullscreen.exit(); break;
    }
});

// backup settings
document.getElementById("backupSettings").addEventListener("click", e => {
    const name = 'P4-Backup ' + (new Date().toISOString().slice(0, -5).replace(/T/, ' ').replace(/:/g, '.')) + ".json";
    createDownloadLink(e.target, name, JSON.stringify(localStorage));
});

// restore settings
document.getElementById("restoreSettings").addEventListener("click", e => {
    UI.fileUploader.upload(async (file, getFileContent) => {
        const data = await getFileContent();
        try {
            const items = JSON.parse(data);
            if (confirm(i18n`This action will replace your current settings and files.`)) {
                for (const name in items) {
                    storage.set(name, items[name]);
                }
                settings.load();
                settings.updateUI();
            }
        } catch (e) {
            console.error(e);
            alert(i18n`Error: Invalid backup file.`);
        }
    }, ".json");
});