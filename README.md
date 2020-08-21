# P4 - Pequeno Processador Pedagógico com Pipeline

This is the source code for the Assembler and Simulator for the P4 educational CPU.

## Running the Assembler and Simulator for the P4 educational CPU

### On the web browser:

* Open the `index.html` file on a web browser.

### As an NW.js application:

* Install [NW.js](https://nwjs.io/).
* Put the source code inside a `package.nw` folder.
* Run the `nw` executable.

### On a HTTP server:

* Put the source code in a directory served by your HTTP server.
* Open the URL for your HTTP server on a web browser.

There's a [Minified Web Version Creation Tool](https://github.com/dinismadeira/p4/blob/master/web.js) in [Node.js](https://nodejs.org/) that allows you to create a minified web version that will load faster.

In order to create a minified version run `node web.js`. A `web` folder containing the minified version will be created.

## Command Line Assembler for P4

You can create a `.p4z` zip file with the program and data memory initialization files for P4 from assembly source files using the [Command Line Assembler for P4](https://github.com/dinismadeira/p4/blob/master/p4as.js) in [Node.js](https://nodejs.org/).

### Assemble a P4 program:

* Install packages: `npm install`
* Assemble: `node p4as.js INPUT_FILE.as`

Where `INPUT_FILE.as` is the name of the P4 assembly source file.

You can set a custom output file by appending the option: `-o OUTPUT_FILE` where `OUTPUT_FILE` is the output file.
 
To show references append the option `--show-refs`.

### Build NW.js executables:

You can create NW.js executables for several operating systems using the [nwjs-builder-phoenix](https://github.com/evshiron/nwjs-builder-phoenix) Node.js module.

* Install packages: `npm install`
* Create executables: `./node_modules/.bin/build --tasks win-x64,mac-x64,linux-x64,linux-x86,win-x86`.
