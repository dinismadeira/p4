/**
 * Board Control.
 *
 * @author Dinis Madeira (dinismadeira@tecnico.ulisboa.pt)
 * @version 2018
 */

'use strict';

if (typeof require == 'function') {
    const fs = require('fs');
    const {exec, spawn} = require('child_process');
    const path = require('path');
        
    const board = {
        busy: false,
        hardware: null, // selected hardware
        device: null, // selected device
        devices: {}, // available hardwares and devices
        memories: null, // available memories in the selected device
        init: () => {
            board.UI.init();
        },
        setBusy: busy => {
            board.busy = busy;
            board.UI.update();
        },
        setDevice: device => {
            board.device = device;
            board.UI.update();
        },
        // scan devices in all available hardwares
        scanDevices: async () => {
            board.setDevice(null);
            board.devices = {};
            let hardwares = await board.quartus.stp.getHardwares();
            if (hardwares) {
                for (let hardware of hardwares) {
                    board.devices[hardware] = await board.quartus.stp.getDevices(hardware);
                }
            }
        },
        // select a device (operations will be done on this device)
        selectDevice: (hardware, device) => {
            board.hardware = hardware;
            board.setDevice(device);
            console.log("Selected device: ", hardware, device);
            return board.scanMemories();
        },
        // scan memories in the selected device
        scanMemories: async () => {
            board.memories = null;
            let memories = await board.quartus.stp.getMemoryInstances(board.hardware, board.device);
            if (memories) {
                board.memories = board.util.parseMemoryInstances(memories);
                if (board.checkP4()) return board.quartus.stp.beginMemoryEdit();
            }
        },
        selectDeviceAuto: () => board.selectFirstAvailableDevice(),
        // select the first available device
        selectFirstAvailableDevice: () => {
            for (let hardware in board.devices) {
                return board.selectDevice(hardware, board.devices[hardware][0]);
            }
        },
        checkP4: () => board.memories && board.memories.prog && board.memories.data,
        checkInstallP4: () => board.checkP4() || board.installP4(),
        // install P4 using quartus_pgm on the selected device and scan memory instances
        installP4: async () => {
            if (board.quartus.stp.editingMemory) await board.quartus.stp.endMemoryEdit();
            return board.quartus.pgm.exec(`-m jtag -c 1 -o "p;P4.sof`).then(board.scanMemories);
        },
        // write memories to selected device on the selected device
        generateMIFs: async memoryUpdates => {

            // compute necessary memory files to write
            const writeFilePromises = [];
            if ('prog' in memoryUpdates && !memoryUpdates.prog) {
                writeFilePromises.push(board.util.writeFile(memoryUpdates.prog = "program_memory.mif", generateMIF(p4.result.program, 16, 16)));
            }
            if ('data' in memoryUpdates && !memoryUpdates.data) {
                writeFilePromises.push(board.util.writeFile(memoryUpdates.data = "data_memory.mif", generateMIF(p4.result.data, 16, 16)));
            }

            // write necessary files
            await Promise.all(writeFilePromises);

            // use default files when no file has been selected
            if ('font' in memoryUpdates && !memoryUpdates.font) memoryUpdates.font = "font_memory.mif";
            if ('pltt' in memoryUpdates && !memoryUpdates.pltt) memoryUpdates.pltt = "palette_memory.mif";

        },
        control: {
            start: () => board.quartus.stp.memoryWrite("800000000", "ctrl"),
            stop: () => board.quartus.stp.memoryWrite("800000001", "ctrl"),
            step: () => board.quartus.stp.memoryWrite("800000002", "ctrl"),
            reset: () => board.quartus.stp.memoryWrite("200000000", "ctrl"),
            exec: instruction => board.quartus.stp.memoryWrite("40000" + instruction, "ctrl"),
            update: () => board.quartus.stp.memoryRead("ctrl")
        },
        // UI related objects and functions
        UI: {
            elements: {},
            init: () => {
                document.getElementById("boardControlUnavailable").style.display = 'none';
                board.UI.elements.boardControlAvailable = document.getElementById("boardControlAvailable");
                board.UI.elements.boardControlQuartusInstall = document.getElementById("boardControlQuartusInstall");
                
                board.UI.elements.boardConsole = document.getElementById("boardConsole");
                board.UI.elements.boardScanDevices = document.getElementById("boardScanDevices");
                board.UI.elements.boardDevices = document.getElementById("boardDevices");
                board.UI.elements.boardInstallP4 = document.getElementById("boardInstallP4");
                board.UI.elements.boardInstallMIF = document.getElementById("boardInstallMIF");
                board.UI.elements.programButton = document.getElementById("programButton");
                board.UI.elements.mifUploadFile = document.getElementById("mifUploadFile");
                board.UI.elements.mifUploadText = document.getElementById("mifUploadText");
                board.UI.elements.mifUploadType = document.getElementById("mifUploadType");

                // bind events
                board.UI.elements.boardScanDevices.addEventListener('click', board.UI.actions.scanDevices);
                board.UI.elements.boardDevices.addEventListener('input', e => {
                    let selectedOption = e.target.selectedOptions[0];
                    board.selectDevice(selectedOption.getAttribute("data-hardware"), selectedOption.getAttribute("data-device"));
                });
                board.UI.elements.programButton.addEventListener('click', board.UI.actions.installProgram);
                board.UI.elements.boardInstallP4.addEventListener('click', board.UI.actions.installP4);
                document.getElementById("updateProgramMemory").addEventListener('click', board.UI.actions.updateProgramMemory);
                document.getElementById("updateDataMemory").addEventListener('click', board.UI.actions.updateDataMemory);
                document.getElementById("updateFontMemory").addEventListener('click', board.UI.actions.updateFontMemory);
                document.getElementById("updatePaletteMemory").addEventListener('click', board.UI.actions.updatePaletteMemory);
                document.getElementById("boardInstallMIF").addEventListener('click', board.UI.actions.updateCheckedMemorys);
                
                document.getElementById("boardStart").addEventListener('click', board.control.start);
                document.getElementById("boardStop").addEventListener('click', () => board.control.stop().then(board.UI.actions.control.update));
                document.getElementById("boardStep").addEventListener('click', () => board.control.step().then(board.UI.actions.control.update));
                document.getElementById("boardReset").addEventListener('click', board.control.reset);
                document.getElementById("boardUpdate").addEventListener('click', board.UI.actions.control.update);
                document.getElementById("boardExec").addEventListener('click', board.UI.actions.control.exec);
                board.UI.updateDevices();
                
                board.UI.elements.successSound = document.createElement('audio');
                board.UI.elements.successSound.setAttribute('src', 'success.mp3');
                document.body.appendChild(board.UI.elements.successSound);
                
                board.UI.actions.checkQuartusInstalled();
            },
            actions: {
                playSound: () => board.UI.elements.successSound.play(),
                control: {
                    update: async () => {
                        const content = await board.control.update();
                        if (/^[0-9a-f]+$/i.test(content)) {
                            document.getElementById("boardPC").innerHTML = content.substr(-8, 4);
                            const RI = content.substr(-4, 4);
                            document.getElementById("boardRI").innerHTML = RI;
                            document.getElementById("boardInstruction").innerHTML = disassemble.instruction(parseInt(RI, 16));
                        }
                        else alert(content);
                    },
                    exec: () => {
                        const exec = assembly => board.control.exec(assembly).then(board.UI.actions.control.update);
                        const assembly = document.getElementById("boardExecInput").value;
                        if (/[0-9a-f]{4}/i.test(assembly)) exec(assembly);
                        else {
                            try {
                                const result = assembler.assemble(assembly);
                                if (result.program[1]) throw new Error(i18n`Error: This assembly instruction translates to more than one machine instructions.`);
                                exec(result.program[0].toString(16).padStart(2, '0'));
                            } catch (e) {
                                console.error(e);
                                alert(e.message);
                            }
                        }
                    }
                },
                checkQuartusInstalled: async () => {
                    if (await board.quartus.checkQuartusInstalled()) {
                        board.UI.actions.quartusInstalled();
                    }
                    else {
                        board.UI.elements.boardControlAvailable.style.display = 'none';
                        const quartusFolderResult = document.getElementById("quartusFolderResult");
                        document.getElementById("quartusFolder").addEventListener("input", async e => {
                            const root = e.target.value.replace(/[\\/](bin\d*[\\/]?)?$/i, '');
                            if (!root) quartusFolderResult.innerText = i18n`Please select a folder.`;
                            else {
                                storage.set('QUARTUS_ROOTDIR', root);
                                if (await board.quartus.checkQuartusInstalled()) {
                                    board.UI.actions.quartusInstalled();
                                }
                                else quartusFolderResult.innerText = i18n`Quartus binaries not found under: ${root}`;
                            }
                        });
                    }
                },
                quartusInstalled: () => {
                    board.UI.elements.boardControlAvailable.style.display = 'block';
                    board.UI.elements.boardControlQuartusInstall.style.display = 'none';
                    
                    // automatically search for devices on startup
                    board.UI.actions.scanDevices().catch(e => {
                        console.error(e);
                        alert(e.message);
                    });
                },
                scanDevices: async () => {
                    board.setBusy(true);
                    boardMessage.innerText = 'Searching devices...';
                    await board.scanDevices();
                    board.UI.updateDevices();
                    boardMessage.innerText = 'Selecting device...';
                    await board.selectDeviceAuto();
                    board.setBusy(false);
                },
                installP4: async () => {
                    board.setBusy(true);
                    boardMessage.innerText = 'Installing P4...';
                    await board.installP4();
                    board.setBusy(false);
                    board.UI.actions.playSound();
                },
                updateCheckedMemorys: () => {
                    const memoryUpdates = {};
                    if (document.getElementById("checkProgramMIF").checked) memoryUpdates.prog = document.getElementById("programMIF").value;
                    if (document.getElementById("checkDataMIF").checked) memoryUpdates.data = document.getElementById("dataMIF").value;
                    if (document.getElementById("checkFontMIF").checked) memoryUpdates.font = document.getElementById("fontMIF").value;
                    if (document.getElementById("checkPaletteMIF").checked) memoryUpdates.pltt = document.getElementById("paletteMIF").value;
                    board.UI.actions.memoryUpdates(memoryUpdates);
                },
                installProgram: () => board.UI.actions.memoryUpdates({prog: '', data: ''}),
                updateProgramMemory: () => board.UI.actions.memoryUpdates({prog: document.getElementById("programMIF").value}),
                updateDataMemory: () => board.UI.actions.memoryUpdates({data: document.getElementById("dataMIF").value}),
                updateFontMemory: () => board.UI.actions.memoryUpdates({font: document.getElementById("fontMIF").value}),
                updatePaletteMemory: () => board.UI.actions.memoryUpdates({pltt: document.getElementById("paletteMIF").value}),
                memoryUpdates: async memoryUpdates => {
                    board.setBusy(true);
                    
                    // make sure P4 is installed
                    await board.checkInstallP4();
                    
                    boardMessage.innerText = 'Writing Memory...';
                    await board.generateMIFs(memoryUpdates); // generate necessary MIFs
                    console.time("program");
                    await board.quartus.stp.memoryUpdates(memoryUpdates); // write MIFs to the memories
                    console.timeEnd("program");
                    board.setBusy(false);
                    board.UI.actions.playSound();
                }
            },
            updateDevices: () => {
                if (Object.keys(board.devices).length) {
                    board.UI.elements.boardDevices.innerHTML = '';
                    for (let hardware in board.devices) {
                        let optgroup = document.createElement("optgroup");
                        optgroup.setAttribute("label", hardware);
                        for (let device of board.devices[hardware]) {
                            let option = document.createElement("option");
                            option.innerText = device;
                            option.setAttribute("data-hardware", hardware);
                            option.setAttribute("data-device", device);
                            optgroup.appendChild(option);
                        }
                        board.UI.elements.boardDevices.appendChild(optgroup);
                    }
                }
                else {
                    board.UI.elements.boardDevices.disabled = true;
                    board.UI.elements.boardDevices.innerHTML = '<option>' + i18n`No Devices Found` + '</option>'
                }
            },
            // update buttons
            update: () => {
                // disable all buttons if busy or no device is selected
                const busyOrNoDevice = board.busy || !board.device;
                document.querySelectorAll("#boardControlAvailable button, #boardSelectDevice select").forEach(e => e.disabled = busyOrNoDevice);
                board.UI.elements.programButton.disabled = busyOrNoDevice;
                
                // board control buttons must be disabled if no P4 device is selected
                if (!busyOrNoDevice) document.querySelectorAll("#boardControl button").forEach(e => e.disabled = !board.checkP4());
                
                // search devices is available even if no device is selected
                board.UI.elements.boardScanDevices.disabled = board.busy;
                
                // update message when ready
                if (!board.busy) boardMessage.innerText = board.device ? 'Ready.' : (Object.keys(board.devices).length ? i18n`No device selected.` : i18n`No devices found.`);
            },
            stateUpdated: oldState => {
                return;
                board.UI.elements.programButton.disabled = busy | !board.device;
            },
            log: text => {
                board.UI.elements.boardConsole.value += text;
                board.UI.elements.boardConsole.scrollTop = 99999;
            }
        },
        quartus: {
            path: '',
            getRoot: () => storage.get('QUARTUS_ROOTDIR') || process.env.QUARTUS_ROOTDIR,
            checkQuartusInstalled: async () => board.quartus.getRoot() && await board.quartus.getPath("quartus_stp"),
            getPath: async file => {
                const filePath = (basePath, file) => basePath + path.sep + file + (process.platform === "win32" ? ".exe" : "");
                if (board.quartus.path) {
                    // use cached value
                    return filePath(board.quartus.path, file);
                }
                const root = board.quartus.getRoot();
                if (!root) {
                    const message = i18n(`$1 environment variable not defined.`, 'QUARTUS_ROOTDIR');
                    // board.UI.log(message);
                    // throw new Error(message);
                    console.warn(message);
                }
                let basePath = version => root + path.sep + "bin" + version;
                let searchPath = path => board.util.fileExists(path);
                let versions = ['', '64', '32'];
                for (let version of versions) {
                    const searchBasePath = basePath(version);
                    const searchFilePath = filePath(searchBasePath, file);
                    console.log("Checking if file exists:" + searchFilePath);
                    if (await searchPath(searchFilePath)) {
                        return board.quartus.path = searchBasePath;
                    }
                }
                const message = file + " not found under " + root + ".";
                console.warn(message);
                // board.UI.log(message);
                // throw new Error(message);
            },
            exec: (file, args) => new Promise(resolve => {
                board.quartus.getPath(file).then(path => {
                    let cmd = `${path} ${args}`;
                    console.log("exec:", cmd);
                    board.UI.log('> ' + cmd + "\n");
                    exec(cmd, (e, stdout, stderr) => {
                        if (e) console.error(e);
                        if (stdout) console.log(stdout);
                        resolve(stdout);
                        if (stderr) alert(stderr);
                        board.UI.log(stdout);
                    });
                });
            }),
            stp: {
                queue: [],
                child: null,
                editingMemory: false,
                unload: async () => {
                    if (board.quartus.stp.child) {
                        if (board.quartus.stp.editingMemory) await board.quartus.stp.endMemoryEdit();
                        board.quartus.stp.child.kill();
                    }
                },
                eval: async tcl => {
                    console.log("> " + tcl);
                    let result = await board.quartus.stp.send(tcl);
                    result = result.replace(/^tcl> /gm, '').trim();
                    console.log("tcl result:", result);
                    // if (/^ERROR:/.test(result)) alert(result);
                    return result;
                },
                send: cmd => new Promise(async resolve => {
                    if (!board.quartus.stp.child) {
                        await board.quartus.stp.spawn();
                    }
                    cmd += "\n";
                    board.UI.log(cmd);
                    board.quartus.stp.queue.push(resolve);
                    board.quartus.stp.child.stdin.write(cmd);
                }),
                spawn: async () => {
                    let stpBin = await board.quartus.getPath("quartus_stp");
                    let args = "-s";
                    let cmd = `${stpBin} ${args}`;
                    console.log("spawn:", cmd);
                    let child = board.quartus.stp.child = spawn(stpBin, args.split(" "));
                    child.on('exit', function (code, signal) {
                        console.log('child process exited with ' + `code ${code} and signal ${signal}`);
                        board.quartus.stp.child = null;
                    });
                    child.on('error', function (code, signal) {
                        console.log('child process errored with ' + `code ${code} and signal ${signal}`);
                        board.quartus.stp.child = null;
                    });
                    child.on('disconnect', function (code, signal) {
                        console.log('child process disconnected with ' + `code ${code} and signal ${signal}`);
                        board.quartus.stp.child = null;
                    });
                    child.stderr.on('data', data => {
                        console.error(`child stderr:\n${data}`);
                    });
                    await new Promise(resolve => child.stdout.on('data', data => {
                        data = data.toString();
                        board.UI.log(data);
                        const handler = board.quartus.stp.queue.shift();
                        if (handler) handler(data);
                        if (/tcl> $/.test(data)) resolve();
                    }));
                },
                getHardwares: async () => {
                    if (board.quartus.stp.editingMemory) await board.quartus.stp.endMemoryEdit();
                    const result = await board.quartus.stp.eval(`get_hardware_names`);
                    console.log("get_hardware_names:", result);
                    if (!result) return [];
                    const hardwares = board.util.parseTclResult(result);
                    console.log("hardwares:", hardwares);
                    return hardwares;
                },
                getDevices: async hardware => {
                    const result = await board.quartus.stp.eval(`get_device_names -hardware_name ${board.util.quoteTcl(hardware)}`);
                    console.log("get_device_names:", result);
                    const devices = board.util.parseTclResult(result);
                    console.log("devices:", devices);
                    return devices;
                },
                getMemoryInstances: async (hardware, device) => {
                    const result = await board.quartus.stp.eval(`get_editable_mem_instances -hardware_name ${board.util.quoteTcl(hardware)} -device_name ${board.util.quoteTcl(device)}`);
                    console.log("get_editable_mem_instances:", result);
                    const memories = board.util.parseTclResult(result);
                    console.log("memories:", memories);
                    return memories;
                },
                tcl: {
                    beginMemoryEdit: () => `begin_memory_edit -hardware_name ${board.util.quoteTcl(board.hardware)} -device_name ${board.util.quoteTcl(board.device)}`,
                    endMemoryEdit: () => `end_memory_edit`,
                    memoryRead: (memory, addr, words) => `read_content_from_memory -content_in_hex -instance_index ${board.memories[memory].index} -start_address ${addr} -word_count ${words || board.memories[memory].depth}`,
                    memoryWrite: (content, memory, addr) => `write_content_to_memory -content "${content}" -content_in_hex -instance_index ${board.memories[memory].index} -start_address ${addr} -word_count ${Math.ceil(content.length * 4 / board.memories[memory].width)}`,
                    memoryUpdate: (memory, file) => `update_content_to_memory_from_file -instance_index ${board.memories[memory].index} -mem_file_path ${board.util.quoteTcl(file)} -mem_file_type mif`
                },
                beginMemoryEdit: () => {
                    board.quartus.stp.editingMemory = true;
                    return board.quartus.stp.eval(board.quartus.stp.tcl.beginMemoryEdit());
                },
                endMemoryEdit: async () => {
                    const result = await board.quartus.stp.eval(board.quartus.stp.tcl.endMemoryEdit());
                    board.quartus.stp.editingMemory = false;
                    return result;
                },
                memoryRead: (memory, addr = 0, words = 0) => board.quartus.stp.eval(board.quartus.stp.tcl.memoryRead(memory, addr, words)),
                memoryWrite: (content, memory, addr = 0) => board.quartus.stp.eval(board.quartus.stp.tcl.memoryWrite(content, memory, addr)),
                memoryUpdate: (memory, file) => board.quartus.stp.eval(board.quartus.stp.tcl.memoryUpdate(memory, file)),
                memoryUpdates: async memoryUpdates => {
                    console.log('memoryUpdates', memoryUpdates);
                    const memoryUpdatePromises = [];
                    for (const memory in memoryUpdates) {
                        const file = memoryUpdates[memory];
                        memoryUpdatePromises.push(board.quartus.stp.memoryUpdate(memory, file));
                    }
                    return await Promise.all(memoryUpdatePromises);
                }
            },
            pgm: {
                exec: args => board.quartus.exec("quartus_pgm", args)
            }
        },
        util: {
            parseMemoryInstances: memories => {
                // let fields = ['index', 'depth', 'width', 'mode', 'type', 'name'];
                let parsedMemories = {};
                for (let memory of memories) {
                    let memoryArray = memory.split(" ");
                    // let parsedMemory = {};
                    // for (let i = 0; i < memoryArray.length; i++) {
                        // parsedMemory[fields[i]] = memoryArray[i];
                    // }
                    // parsedMemories[parsedMemory['name']] = parsedMemory;
                    parsedMemories[memoryArray[5]] = {
                        index: Number(memoryArray[0]),
                        depth: Number(memoryArray[1]),
                        width: Number(memoryArray[2]),
                        mode: memoryArray[3],
                        type: memoryArray[4],
                        name: memoryArray[5]
                    };
                }
                return parsedMemories;
            },
            parseTclResult: result => {
                let matches = result.match(/\{.+?\}/g);
                return matches ? matches.map(m => m.replace(/\{(.+)\}/, '$1')) : null;
            },
            quoteTcl: s => '"' + s.replace(/\\/g, '\\\\').replace(/\[/g, "\\[").replace(/\]/g, "\\]") + '"',
            fileExists: s => new Promise(r => fs.access(s, fs.F_OK, e => r(!e))),
            writeFile: (file, content) => new Promise(function(resolve, reject) {
                fs.writeFile(file, content, e => {
                    if (e) reject(e);
                    else resolve();
                });
            })
        }
    };

    //document.addEventListener("DOMContentLoaded", board.init);
    board.init();
    
    window.addEventListener("beforeunload", () => {
        board.quartus.stp.unload();
    });
    
    window.board = board;
    
}
