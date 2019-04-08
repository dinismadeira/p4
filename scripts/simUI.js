/**
 * P4 Simulator User Interface Module
 *
 * @author Dinis Madeira (dinismadeira@tecnico.ulisboa.pt)
 * @version 2018
 */
 
'use strict';

document.addEventListener('readystatechange', () => {
    if (document.readyState == "interactive") {
        
        window.simUI = {};
        
        simUI.registerDisplay = {
            PC: null,
            RI: null,
            setPC: PC => simUI.registerDisplay.PC.innerText = simUI.registerFormat.current(PC),
            setRI: RI => simUI.registerDisplay.RI.innerText = simUI.registerFormat.current(RI),
            init: () => {
                simUI.registerDisplay.PC = document.getElementById("simPC");
                simUI.registerDisplay.RI = document.getElementById("simRI");
                simUI.registerDisplay.setPC(0);
                simUI.registerDisplay.setRI(0);
            }
        };
        // register format
        simUI.registerFormat = {
            current: null,
            formats: null,
            hex: n => n.toString(16).padStart(4, '0'),
            dec: n => String(n << 16 >> 16).padStart(6, ' '),
            udec: n => String(n).padStart(5, ' '),
            bin: n => n.toString(2).padStart(16, '0'),
            init: () => {
                const rf = simUI.registerFormat;
                rf.formats = [rf.hex, rf.dec, rf.udec, rf.bin];
                rf.update();
                simUI.registerDisplay.init();
            },
            update: () => {
                simUI.registerFormat.current = simUI.registerFormat.formats[p4.settings.get("regFormat")];
            },
            toggle: () => {
                p4.settings.set("regFormat", (p4.settings.get("regFormat") + 1) % simUI.registerFormat.formats.length);
                simUI.registerFormat.update();
            }
        };
        
        // registers UI
        simUI.registerBank = {
            registers: [],
            setRegister: (i, data) => simUI.registerBank.registers[i].innerHTML = simUI.registerFormat.current(data),
            init: () => {
                simUI.registerFormat.init();
                for (let i = 1; i < 8; i++) {
                    const p = document.createElement("div");
                    const label = document.createElement("span");
                    label.innerText = 'R' + i + ': ';
                    const span = simUI.registerBank.registers[i] = document.createElement("span");
                    span.innerText = simUI.registerFormat.current(0);
                    p.appendChild(label);
                    p.appendChild(span);
                    document.getElementById("simRegisterBank").appendChild(p);
                }
            }
        };
        simUI.registerBank.init();
        
        // switches UI
        simUI.switches = {
            switches: [],
            getState: i => simUI.switches.switches[i].checked,
            init: () => {
                for (let i = 9; i > -1; i--) {
                    const sw = document.createElement("label");
                    sw.className = "switch";
                    sw.setAttribute("title", "SW" + i);
                    const slider = document.createElement("span");
                    slider.className = "slider";
                    const checkBox = simUI.switches.switches[i] = document.createElement("input");
                    checkBox.setAttribute("type", "checkbox");
                    sw.appendChild(checkBox);
                    sw.appendChild(slider);
                    document.getElementById("simSwitches").appendChild(sw);
                } 
            }
        };
        simUI.switches.init();
        
            
        // LEDs UI
        simUI.LEDs = {
            leds: [],
            setLed: (i, state) => simUI.LEDs.leds[i].className = state ? 'on' : '',
            init: () => {
                const simLEDs = document.getElementById("simLEDs");
                for (let i = 9; i > -1; i--) {
                    const span = simUI.LEDs.leds[i] = document.createElement("span");
                    span.innerHTML = '&nbsp;';
                    span.setAttribute("title", "LEDR" + i);
                    simLEDs.appendChild(span);
                }
            }
        };
        simUI.LEDs.init();
        
        /** Represents a Memory Content Display */
        class MemoryDisplay {
            constructor(div, options) {
                this.memory = [];
                this.addrEls = []; // visible addr elements
                options = options || {};
                this.rows = options.rows || 16;
                this.cols = options.cols || 8;
                this.onscroll = options.onscroll;
                this.offset = options.offset || 0; // first visible addr
                this.dataEls = []; // data elements by index in the visible area
                this.charEls = []; // char elements by index in the visible area
                this.memorydataEls = {}; // data elements by index in the memory (only visible)
                this.memorycharEls = {}; // char elements by index in the memory (only visible)
                
                // scroll
                this.scroll = {};
                const scrollableDiv = document.createElement("div");
                scrollableDiv.className = 'memoryScrollableContainer';
                div.appendChild(scrollableDiv);
                const contentDiv = document.createElement("div");
                contentDiv.className = 'memoryScrollableContent';
                scrollableDiv.appendChild(contentDiv);
                const scrollDiv = document.createElement("div");
                scrollDiv.className = 'memoryScroll';
                scrollableDiv.appendChild(scrollDiv);;
                const scrollThumb = document.createElement("div");
                this.scroll.track = scrollDiv;
                this.scroll.thumb = scrollThumb;
                this.scroll.position = 0;
                scrollThumb.className = 'memoryScrollThumb';
                scrollDiv.appendChild(scrollThumb);
                scrollThumb.style.height = Math.floor(this.rows / 256 * 100) + '%';
                
                // grab scroll thumb handler
                scrollDiv.addEventListener('mousedown', e => {
                    if (e.target == scrollDiv) {
                        this.setScrollPositionAbsolute(e.offsetY - this.getScrollThumbHeight() / 2);
                        this.scroll.handler({});
                    }
                    const screenY = e.screenY;
                    const position = this.scroll.position;
                    const thumbMove = e => {
                        const offset = e.screenY - screenY;
                        this.setScrollPositionAbsolute(position + offset);
                        this.scroll.handler({});
                    };
                    const thumbMoveEnd = () => {
                        document.removeEventListener("mousemove", thumbMove);
                        document.removeEventListener("mouseup", thumbMoveEnd);
                        scrollDiv.classList.remove('grabbed');
                    };
                    scrollDiv.classList.add('grabbed');
                    document.addEventListener("mousemove", thumbMove);
                    document.addEventListener("mouseup", thumbMoveEnd);
                    e.preventDefault();
                });
                
                // content
                for (let row = 0, index = 0; row < this.rows; row++) {
                    const rowEl = document.createElement("div");
                    const addrEl = this.addrEls[row] = document.createElement("span");
                    addrEl.className = 'memoryAddr';
                    const dataRowEl = document.createElement("span");
                    dataRowEl.className = 'memoryDataRow';
                    const charRowEl = document.createElement("span");
                    charRowEl.className = 'charDataRow';
                    rowEl.appendChild(addrEl);
                    rowEl.appendChild(dataRowEl);
                    rowEl.appendChild(charRowEl);
                    addrEl.innerText = this.formatDataValue(index);
                    for (let col = 0, dataIndex = index; col < this.cols; col++, dataIndex++) {
                        const dataEl = this.dataEls[dataIndex] = document.createElement("span");
                        dataRowEl.appendChild(dataEl);
                    }
                    for (let col = 0, charIndex = index; col < this.cols; col++, charIndex++) {
                        const charEl = this.charEls[charIndex] = document.createElement("span");
                        charRowEl.appendChild(charEl);
                    }
                    index += this.cols;
                    contentDiv.appendChild(rowEl);
                }

                // initial addr input row
                const addrInputRow = document.createElement("div");
                addrInputRow.className = 'memoryAddrInputRow';
                const addrInput = document.createElement("input");
                addrInput.setAttribute("type", "text");
                addrInput.setAttribute("maxlength", "4");
                addrInputRow.appendChild(addrInput);
                const sliderHighEl = document.createElement("input");
                sliderHighEl.setAttribute("type", "range");
                sliderHighEl.setAttribute("min", "0");
                sliderHighEl.setAttribute("max", "127");
                sliderHighEl.value = 0;
                addrInputRow.appendChild(sliderHighEl);
                div.appendChild(addrInputRow);
                
                const setOffset = offset => {
                    this.offset = offset;
                    if (offset < 0) this.offset = 0;
                    else {
                        const limit = this.memory.length - (this.rows * this.cols);
                        if (offset > limit) this.offset = limit;
                    }
                };

                // update addr handler
                const updateSliders = () => {
                    sliderHighEl.value = (this.offset >> 8) & 255;
                    this.setScrollPosition((this.offset & 255) / 255);
                };
                const updateAddrInput = () => {
                    addrInput.value = this.formatDataValue(this.offset);
                };
                const updateAddrs = () => {
                    for (let i = 0; i < this.addrEls.length; i++) {
                        this.addrEls[i].innerText = this.formatDataValue(i * this.cols + this.offset);
                    }
                };
                
                const onAddr = e => {
                    // Update Addresses
                    updateAddrs();
                    
                    // Call Handler
                    if (this.onscroll) this.onscroll(this);
                    
                    // Update Content
                    this.update();
                };
                
                const onWheel = e => {
                    e.preventDefault();
                    setOffset(this.offset + (e.deltaY > 0 ? 1 : -1) * this.cols);
                    updateAddrInput();
                    updateSliders();
                    onAddr();
                };
                const onScroll = e => {
                    setOffset((Number(sliderHighEl.value) << 8) | (Math.floor(this.getScrollPosition() * 255 / this.cols) * this.cols));
                    updateAddrInput();
                    onAddr();
                };
                const onInput = e => {
                    const offset = Math.floor(parseInt(addrInput.value = addrInput.value.replace(/[^0-9a-f]+/ig, ''), 16) / this.cols) * this.cols || 0;
                    setOffset(offset);
                    updateSliders();
                    onAddr();
                };

                // bind events
                addrInput.addEventListener("focus", e => e.target.select());
                div.addEventListener("wheel", onWheel);
                addrInput.addEventListener("input", onInput);
                sliderHighEl.addEventListener("input", onScroll);
                addrInput.addEventListener("change", () => addrInput.value = this.formatDataValue(addrInput.value));
                this.scroll.handler = onScroll;

                // populate
                updateAddrs();
                updateAddrInput();
                updateSliders();
                this.update();
            }

            setScrollPosition(n) {
                this.setScrollPositionAbsolute(n * this.getScrollLength());
            }
            setScrollPositionAbsolute(n) {
                this.scroll.position = Math.max(0, Math.min(this.getScrollLength(), n));
                this.scroll.thumb.style.top = this.scroll.position + 'px';
            }
            getScrollPosition() {
                return this.scroll.position / this.getScrollLength();
            }
            getScrollThumbHeight() {
                return this.scroll.thumb.offsetHeight;
            }
            getScrollLength() {
                return this.scroll.track.offsetHeight - this.getScrollThumbHeight();
            }

            formatDataValue(n) { return n.toString(16).padStart(4, '0'); }
            formatCharValue(n) { return n > 31 && n < 128 ? String.fromCodePoint(n) : '.'; }

            // update all visible cells
            update() {
                this.memorydataEls = {};
                this.memorycharEls = {};
                for (let i = 0, addr = this.offset; i < this.cols * this.rows; i++, addr++) {
                    (this.memorydataEls[addr] = this.dataEls[i]).innerText = this.formatDataValue(this.memory[addr] || 0);
                    (this.memorycharEls[addr] = this.charEls[i]).innerHTML = this.formatCharValue(this.memory[addr] || 0);
                    this.dataEls[i].style.backgroundColor = ''; // clear background colour
                }
                this.updated = {}; // mark all cells as updated
            }

            // update updated cells
            updateUI() {
                for (const addr in this.updated) {
                    // only update if addr is being shown in the table
                    if (addr in this.memorydataEls) {
                        let value = this.memory[addr];
                        const dataEl = this.memorydataEls[addr];
                        dataEl.innerText = this.formatDataValue(value);
                        clearTimeout(dataEl.clearBackground);
                        dataEl.style.transition = '';
                        dataEl.style.backgroundColor = '#a6ffa6';
                        dataEl.clearBackground = setTimeout(() => {
                            dataEl.style.transition = 'background-color 2s';
                            dataEl.style.backgroundColor = '';
                        }, 1000);
                        this.memorycharEls[addr].innerHTML = this.formatCharValue(value);
                    }
                }
                this.updated = {}; // mark all cells as updated
            }

            // mark cell as updated
            onUpdate(addr) {
                this.updated[addr] = true;
            }

            setMemory(memory) {
                this.memory = memory;
                this.update();
            }
        }

        /** Represents an Assembly Display */
        class AssemblyDisplay extends MemoryDisplay {
            constructor(div, options) {
                options = options || {};
                options.rows = options.rows || 32;
                options.cols = options.cols || 1;
                super(div, options);
            }
            formatCharValue(n) { 
                return (typeof disassemble !== 'undefined' ? disassemble.instruction(n) : 'NOP').replace(/[^ ]+/, '<b>$&</b>');
            }
        }
        
        // memory viwers
        simUI.memoryDisplay = {
            assembly: null,
            program: null,
            data: null,
            makeOptions: id => ({
                offset: Number(storage.get("memoryPosition" + id) || 0),
                onscroll: memory => {
                    storage.set("memoryPosition" + id, memory.offset);
                }
            }),
            init: () => {
                simUI.memoryDisplay.assembly = new AssemblyDisplay(document.getElementById("simProgramAssembly"), simUI.memoryDisplay.makeOptions("ProgramAssembly"));
                simUI.memoryDisplay.program = new MemoryDisplay(document.getElementById("simProgramMemory"), simUI.memoryDisplay.makeOptions("ProgramMemory"));
                simUI.memoryDisplay.data = new MemoryDisplay(document.getElementById("simDataMemory"), simUI.memoryDisplay.makeOptions("DataMemory"));
            }
        };
        simUI.memoryDisplay.init();

    }
});