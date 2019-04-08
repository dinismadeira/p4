/**
 * Command Line Assembler for P4
 *
 * Given a P4 assembly source file, generates a .p4z zip file with the program and data memory initialization files.
 * 
 * To assemble a program use: node p4as.js INPUT_FILE.as
 * 
 * For a custom output file append " -o OUTPUT_FILE" to the command above.
 * To show references append " --show-refs".
 *
 * @author Dinis Madeira (dinismadeira@tecnico.ulisboa.pt)
 * @version 2018
 */
 
'use strict';

const initTime = Date.now();
const path = require('path');
const fs = require('fs');
const assembler = require('./scripts/assembler.js');
const writeProgram = require('./scripts/writeProgram.js');

const inputFileArg = process.argv[2];

if (!inputFileArg) {
    console.error('No input file.');
    process.exit(1);
}

let outputFile;
let showRefs = false;

for (let i = 3; i < process.argv.length; i++) {
    const arg = process.argv[i];
    if (arg == '-o') {
        outputFile = process.argv[++i];
        if (!outputFile) {
            console.error('Missing output file.');
            process.exit(1);
        }
    }
    else if (arg == '--show-refs') showRefs = true;
    else {
        console.error("Unknown option:", arg);
        process.exit(1);
    }
}

const inputFile = path.normalize(inputFileArg);
if (!outputFile) {
    const inputFileParts = path.parse(inputFile);
    outputFile = path.join(inputFileParts.dir, inputFileParts.name + '.p4z');
}

console.log(`Assembling "${inputFile}"...`);

fs.readFile(inputFile, 'utf8', (e, contents) => {
    if (e) throw e;
    
    const result = assembler.assemble(contents);
        
    if (result.errors.length) {
        console.log(`Errors / Warnings:`);
        for (const error of result.errors) {
            const log = `${error.line}:${error.from}-${error.to} ${error.message}`;
            if (error.severity == 'warning') console.warn('  [Warning] ' + log);
            else console.error('  [Error] ' + log);
        }
    }
    else  console.log('  OK');

    console.log('Statistics:');
    console.log("  Errors: " + result.stats.errors);
    console.log("  Warnings: " + result.stats.warnings);
    console.log("  References: " + Object.keys(result.labels).length);
    console.log('  Pseudo Instructions: ' + result.stats.pseudoInstructions);
    console.log('  Instructions: ' + result.stats.instructions);
    
    const memoryUsage = (used, total) => `${used}/${total} (${Math.round(used / total * 10000) / 100}%)`;
    console.log('  Program Memory:', memoryUsage(result.stats.programMemoryUsage, result.program.length));
    console.log('  Data Memory:', memoryUsage(result.stats.dataMemoryUsage, result.data.length));

    if (showRefs) {
        console.log('References:');
        Object.keys(result.labels).forEach(name => {
        console.log(`  ${name}:`, result.labels[name].toString(16).padStart('0', 4));
        });
    }
    
    console.log(`Generating program...`);
    writeProgram(result.program, result.data, "uint8array").then(content => {
        console.log('  OK');
        console.log(`Writing program to "${outputFile}"...`);
        fs.writeFile(outputFile, content, e => {  
            if (e) throw e;
            console.log('  OK');
            console.log(`Completed in ${(Date.now() - initTime) / 1000} seconds.`);
        });
    });
});
