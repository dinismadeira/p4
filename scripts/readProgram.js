/**
 * Reads a .p4z zip file with the program and data memory initialization files from the memory contents.
 *
 * @requires JSZip
 * @requires parseMIF
 *
 * @author Dinis Madeira (dinismadeira@tecnico.ulisboa.pt)
 * @version 2018
 */
 
'use strict';

const readProgram = content => new Promise(resolve => {
    const zip = new JSZip();
    zip.loadAsync(content).then(async zip => {
        const progMIF = await zip.file("prog.mif").async("string");
        const dataMIF = await zip.file("data.mif").async("string");
        const prog = parseMIF(progMIF);
        const data = parseMIF(dataMIF);
        resolve({prog: prog, data: data}); 
    });
});
