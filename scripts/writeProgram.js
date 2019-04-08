/**
 * Writes a .p4z zip file with the program and data memory initialization files from the memory contents.
 *
 * @requires JSZip
 * @requires generateMIF
 *
 * @author Dinis Madeira (dinismadeira@tecnico.ulisboa.pt)
 * @version 2018
 */
 
'use strict';

if (typeof require == 'function' && typeof JSZip == 'undefined') {
    var JSZip = require("./jszip.min.js");
    var generateMIF = require('./generateMIF.js');
}

const writeProgram = (programMemory, dataMemory, type) => {
    const zip = new JSZip();
    zip.file("prog.mif", generateMIF(programMemory, 16, 16));
    zip.file("data.mif", generateMIF(dataMemory, 16, 16));
    return zip.generateAsync({type: type});
};

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = writeProgram;
}
