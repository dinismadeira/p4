/**
 * P4 Simulator Module
 *
 * @author Dinis Madeira (dinismadeira@tecnico.ulisboa.pt)
 * @version 2018
 */
 
'use strict';

/** Class representing the IO unit. */
class IO {
    constructor() {
        this.terminal = new Terminal();
        this.switches = new Switches();
        this.leds = new LEDs();
        this.timer = new Timer();
        this.LCD = new LCD();
        this.display = [];
        for (let i = 0; i < 6; i++) {
            this.display[i] = new Display(i);
        }
        this.accelerometer = {x: 0, y: 0, z: 0};
        this.dataMemory = new Uint16Array(32768);
    }
    read(addr) {
        // Memory space
        if ((addr >>> 8) !== 0xff) return this.dataMemory[addr & 32767];
        // IO space
        switch (addr) {
            case 0xffff: return this.terminal.read();
            case 0xfffd: return this.terminal.state;
            case 0xfffa: return this.interrupts;
            case 0xfff9: return this.switches.data;
            case 0xffed: return this.accelerometer.z;
            case 0xffec: return this.accelerometer.y;
            case 0xffeb: return this.accelerometer.x;
            default: return 0xffff;
        }
    }
    write(addr, data) {
        // Memory space
        if ((addr >>> 8) !== 0xff) {
            const memAddr = addr & 32767;
            this.dataMemory[memAddr] = data;
            simUI.memoryDisplay.data.onUpdate(memAddr); // fixme: abstrair
        }
        // IO space
        switch (addr) {
            case 0xfffe: this.terminal.write(data); break;
            case 0xfffc: this.terminal.cursor(data); break;
            case 0xfffb: this.terminal.color(data); break;
            case 0xfffa: this.interrupts = data; break;
            case 0xfff8: this.leds.write(data); break;
            case 0xfff7: (data & 1) ? this.timer.start() : this.timer.stop(); break;
            case 0xfff6: this.timer.setUnits(data); break;
            case 0xfff5: this.LCD.write(data); break;
            case 0xfff4: this.LCD.control(data); break;
            case 0xfff3: this.display[3].write(data); break;
            case 0xfff2: this.display[2].write(data); break;
            case 0xfff1: this.display[1].write(data); break;
            case 0xfff0: this.display[0].write(data); break;
            case 0xffef: this.display[5].write(data); break;
            case 0xffee: this.display[4].write(data); break;
        }
    }
    reset() {
        this.LCD.reset();
        this.terminal.reset();
        this.leds.reset();
        this.display.forEach(display => display.reset());
        this.interrupts = 0;
    }
    updateUI() {
        this.LCD.updateUI();
        this.terminal.updateUI();
        this.leds.updateUI();
        this.display.forEach(display => display.updateUI());
        simUI.memoryDisplay.data.updateUI();
    }
}

/** Class representing the LED interface. */
class LEDs {
    constructor() {
        this.reset();
    }
    reset() {
        this.write(0);
    }
    write(data) {
        this.data = data;
        this.updated = true;
    }
    updateUI() {
        if (this.updated) {
            this.updated = false;
            let data = this.data;
            for (let i = 0; i < 10; i++) {
                simUI.LEDs.setLed(i, data & 1);
                data >>= 1;
            }
        }
    }
}

/** Class representing a 7-segment display. */
class Display {
    constructor(i) {
        this.id = i;
        this.reset();
    }
    reset() {
        this.write(0);
    }
    write(data) {
        this.data = data;
        this.updated = true;
    }
    updateUI() {
        if (this.updated) {
            this.updated = false;
            simUI.display.setDisplay(this.id, (this.data & 15).toString(16).toUpperCase());
        }
    }
}

/** Class representing the switches. */
class Switches {
    constructor() {
        this.data = 0;
    }
    updateValue() {
        this.data = 0;
        for (let i = 9; i > -1; i--) {
            if (simUI.switches.getState(i)) {
                ++this.data;
            }
            if (i) this.data <<= 1;
        }
    }
}

/** Class representing the LCD display. */
class LCD {
    constructor() {
        this.reset();
    }
    reset() {
        this.cursor = 0;
        this.state = 1;
        this.clear();
    }
    clear() {
        this.mustClear = true;
        this.text = {}; // text to be updated on next updateUI
    }
    control(data) {
        this.state = data >> 15;
        if (data >> 5 & 1) this.clear();
        this.cursor = data & 31;
    }
    write(data) {
        this.text[this.cursor] = data;
        if (this.cursor == 31) {
            this.cursor = 0;
        }
        else ++this.cursor;
    }
    updateUI() {
        simUI.LCD.setState(this.state);
        if (this.mustClear) {
            this.mustClear = false;
            simUI.LCD.clear();
        }
        for (const i in this.text) {
            simUI.LCD.setDigit(i, String.fromCodePoint(this.text[i] & 255));
        }
        this.text = {};
    }
}

/** Class representing the Terminal interface. */
class Terminal {
    constructor() {
        this.reset();
    }
    reset() {
        this.index = 0;
        this.currentColor = 0x00ff; // white text on black background
        this.lastKey = 0; // last key pressed
        this.state = 0; // whether a key was pressed since last reading
        this.clear();
    }
    clear() {
        this.mustClear = true;
        this.updated = {}; // indexes to be updated on the next updateUI
    }
    read() {
        this.state = 0;
        return this.lastKey;
    }
    keyPressed(cp) {
        this.lastKey = cp;
        this.state = 1;
        sim.hardware.setInterrupt(7);
    }
    cursor(data) {
        //console.log("cursor", data.toString(2));
        if (data >> 8 == 0xff) {
            if (data & 0xff == 0xff) this.clear();
        }
        else {
            // This is based on HW implementation in order to mimic the behaviour when an invalid position is set
            const line = (data >> 8) & 63;
            const col = data & 127;
            this.index = (line * 80 + col) & 4095;
        }
    }
    color(data) { this.currentColor = data; }
    write(data) {
        this.updated[this.index] = {data: data, color: this.currentColor};
        if (this.index == 3599 || this.index == 4095) this.index = 0;
        else ++this.index;
    }
    updateUI() {
        if (this.mustClear) {
            this.mustClear = false;
            for (let index = 0; index < 3600; index++) {
                const span = simUI.terminal.chars[index];
                span.innerText = ' ';
                span.style.color = '';
                span.style.backgroundColor = '';
            }
        }
        const colorCache = {};
        for (const index in this.updated) {
            if (index > 3599) continue;
            const colorRGB = n => [n >> 5 & 7, n >> 2 & 7, n & 3];
            const map7 = [0, 36, 73, 109, 146, 182, 219, 255]; // n*255/7
            const map3 = [0, 85, 170, 255]; // n*255/3
            const rgbc = n => n.toString(16).padStart(2, '0');
            const colorHex = rgb => '#' + rgbc(map7[rgb[0]]) + rgbc(map7[rgb[1]]) + rgbc(map3[rgb[2]]);

            const updated = this.updated[index];
            const data = updated.data;
            const color = updated.color;

            const span = simUI.terminal.chars[index];

            // apply cached color on current span
            if (color in colorCache) colorCache[color](span);
            else {
                const bgcolor = color >> 8;
                const fgcolor = color & 255;

                const bgcolorRGB = colorRGB(bgcolor);
                const fgcolorRGB = colorRGB(fgcolor);

                const bgcolorHex = colorHex(bgcolorRGB);
                const fgcolorHex = colorHex(fgcolorRGB);

                // cache computed color for future use and apply it on the current span
                (colorCache[color] = span => {
                    if (bgcolor != 0x00) span.style.backgroundColor = bgcolorHex;
                    if (fgcolor != 0xff) span.style.color = fgcolorHex;
                })(span);
            }

            span.innerText = cp437.toChar(data & 255);
        }
        this.updated = {};
    }
}

/** Class representing the timer. */
class Timer {
    constructor() {
        this.reset();
        this.timer = 0;
        this.startTime = 0;
        this.units = 0; // delay in deciseconds
    }
    start() {
        if (!this.timer) {
            this.startTime = Date.now();
            this.timer = setTimeout(() => {
                this.timer = 0;
                sim.hardware.setInterrupt(15);
            }, this.units * 100);
        }
    }
    stop() {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = 0;
        }
    }
    setUnits(units) {
        this.units = units;
    }
    read() {
        return ((Date.now() - this.startTime) / 100) & 65535;
    }
    reset() {
        this.stop();
    }
}

/** Class representing the State Register. */
class StateRegister {
    constructor() {
        this.reset();
    }
    reset() {
        this.E = 0;
        this.O = 0;
        this.N = 0;
        this.C = 0;
        this.Z = 0;
    }
}

/** Class representing the Register Bank. */
class RegisterBank {
    constructor() {
        this.reset();
    }
    reset() {
        this.registers = new Uint16Array(8);
        this.update();
    }
    update() {
        this.updated = [true, true, true, true, true, true, true, true];
    }
    write(selC, RC) {
        if (selC) { // disable writing to R0
            this.registers[selC] = RC;
            this.updated[selC] = true;
        }
    }
    updateUI() {
        for (let i = 1; i < this.updated.length; i++) {
            if (this.updated[i]) {
                simUI.registerBank.setRegister(i, this.registers[i]);
                this.updated[i] = false;
            }
        }
    }
}

/** Class representing the board. */
class Hardware {
    constructor() {
        this.jump = {jump: false, dest: 0};
        this.interrupt = {interrupt: false, dest: 0, ret: 0, pending: {}, E: 0};
        this.PC = 0;
        this.stateRegister = new StateRegister();
        this.registerBank = new RegisterBank();
        this.IO = new IO();
        this.programMemory = new Uint16Array(32768);
        this.programMemoryCache = null;
    }
    clock() {
        const PC = this.PC;
        if (this.jump.jump) {
            this.jump.jump = false;
            this.PC = this.jump.dest;
        }
        else if (this.PC === 32767) this.PC = 0;
        else ++this.PC;
        this.programMemoryCache[PC]();
        if (this.interrupt.interrupt && !this.jump.jump) {
            this.attendInterrupt();
        }
    }
    reset() {
        this.registerBank.reset();
        this.PC = 0;
        this.IO.reset();
        this.stateRegister.reset();
        this.jump.jump = false;
        this.interrupt.interrupt = false;
    }
    attendInterrupt() {
        console.log("ATTEND INTERRUPT", this.interrupt.dest.toString(16));
        this.interrupt.interrupt = false;
        this.interrupt.E = this.stateRegister.E;
        this.stateRegister.E = 0;
        this.interrupt.ret = this.PC;
        this.PC = this.interrupt.dest;
    }
    setInterrupt(i, isIntInstruction) {
        console.log("SET INTERRUPT", i, isIntInstruction, this.stateRegister.E);
        if (isIntInstruction || (this.stateRegister.E && (i > 15 || ((1 << i) & this.IO.interrupts)))) {
            this.interrupt.interrupt = true;
            this.interrupt.dest = 0x7f00 | (isIntInstruction ? i : i << 4);
            console.log("interrupt.dest", i, isIntInstruction, this.interrupt.dest.toString(16));
        }
        // add to pending interrupts
        else this.interrupt.pending[i] = true;
    }
    nextInterrupt() {
        const pending = Object.keys(this.interrupt.pending);
        if (pending.length) {
            const pendingEnabled = pending.map(Number).filter(i => (1 << i) & this.IO.interrupts);
            if (pendingEnabled.length) {
                const next = Math.min(...pendingEnabled);
                delete(this.interrupt.pending[next]);
                console.log("PENDING INTERRUPT:", next);
                this.setInterrupt(next);
            }
        }
    }
    setJump(dest) {
        this.jump.jump = true;
        this.jump.dest = dest;
    }
    updateRegisterUI() {
        simUI.registerDisplay.setPC(this.PC);
        simUI.registerDisplay.setRI(this.programMemory[this.PC]);
    }
    updateUI() {
        this.updateRegisterUI();
        this.registerBank.updateUI();
        this.IO.updateUI();
        sim.UI.elements.simSR.innerText = String(this.stateRegister.E) + String(this.stateRegister.Z) + String(this.stateRegister.C) + String(this.stateRegister.N) + String(this.stateRegister.O);
    }
}

/** Returns a function that computes the corresponding ALU operation. */
const ALU = (unit, op, RC, RA, RB) => {
    
    const hw = sim.hardware;
    const state = hw.stateRegister;

    const a = () => hw.registerBank.registers[RA]; // function that retrieves RA's value from the Register Bank
    const b = () => hw.registerBank.registers[RB]; // function that retrieves RB's value from the Register Bank

    let r; // function that computes the result for the ALU operation
    let carry; // function that computes the carry bit for given the result
    let overflow; // function that computes the overflow bit given the result

    // operands are treated as unsigned 16 bit numbers

    switch (unit) {
        // arithmetic unit
        case ALU.arith: {
            carry = r => r >> 16 & 1;
            overflow = op & 1 ?
                // sub, subb: overflow when a and b signals are different, and r and a signal are the same
                (r => (a() >> 15) !== (b() >> 15) ? (r >> 15) ^ (a() >> 15) : 0) :
                // add, addc: overflow when a and b signals are the same, and r signal is different
                (r => (a() >> 15) === (b() >> 15) ? (r >> 15) ^ (a() >> 15) : 0);

            switch (op) {
                case ALU.ADD:  r = () => a() + b(); break; // ADD
                case ALU.SUB:  r = () => a() - b(); break; // SUB
                case ALU.ADDC: r = () => a() + b() + state.C; break; // ADDC
                case ALU.SUBB: r = () => a() - b() - (state.C ^ 1); break; // SUBB
                case ALU.DEC:  r = () => a() - 1; overflow = r => a() >> 15 & ~(r >> 15); break; // overflow when a is negative and r is positive
                case ALU.INC:  r = () => a() + 1; overflow = r => ~(a() >> 15) & r >> 15; break; // overflow when a is positive and r is negative
            }
            break;
        }
        // logic unit
        case ALU.logic: {
            switch (op) {
                case ALU.COM: r = () => a() ^ 65535; break; // COM
                case ALU.AND: r = () => a() & b(); break; // AND
                case ALU.OR: r = () => a() | b(); break; // OR
                case ALU.XOR: r = () => a() ^ b(); break; // XOR
            }
            break;
        }
        // shift unit
        case ALU.shift: {
            //               left ----------   right -------
            carry = op & 1 ? () => a() >> 15 : () => a() & 1;
            switch (op) {
                case ALU.SHR: r = () => a() >> 1; break; // SHR
                case ALU.SHL: r = () => a() << 1; break; // SHL
                case ALU.SHRA: r = () => a() >> 1; break; // SHRA
                case ALU.SHLA: r = () => a() << 1; overflow = r => (a() >>> 15) ^ (r >>> 15);  break; // SHLA // overflow when a is negative and r is positive
                case ALU.ROR: r = () => ((a() & 1) << 15) | (a() >> 1); break; // ROR
                case ALU.ROL: r = () => (a() << 1) | (a() >> 15); break; // ROL
                case ALU.RORC: r = () => (state.C << 15) | (a() >> 1); break; // RORC
                case ALU.ROLC: r = () => (a() << 1) | state.C; break; // ROLC
            }
            break;
        }
    }
    if (!r) throw new Error("Unknown operation: " + op + " (unit: " + unit + ")");
    
    return () => {
        const result32 = r();                       // compute 32 bit result
        if (carry) state.C = carry(result32);       // compute carry state bit based on the 32 bit result
        
        const result = result32 & 65535;            // convert result to 16 bits
        if (overflow) state.O = overflow(result);   // compute overflow state bit
        state.N = result >> 15;                     // compute negative state bit
        state.Z = result === 0 ? 1 : 0;             // compute zero state bit
        hw.registerBank.write(RC, result);          // write result to RC
    };
};

// ALU Constants
ALU.arith = 0;
ALU.logic = 1;
ALU.shift = 2;

ALU.ADD =  0;
ALU.SUB =  1;
ALU.ADDC = 2;
ALU.SUBB = 3;
ALU.DEC =  4;
ALU.INC =  5;

ALU.COM =  0;
ALU.AND =  1;
ALU.OR =   2;
ALU.XOR =  3;

ALU.SHR =  0;
ALU.SHL =  1;
ALU.SHRA = 2;
ALU.SHLA = 3;
ALU.ROR =  4;
ALU.ROL =  5;
ALU.RORC = 6;
ALU.ROLC = 7;

/** Simulator Statistics Module */
class SimStats {
    constructor() {
        this.reset();
    }
    // clear all stats
    reset() {
        this.clocks = 0;
        this.restart();
    }
    // clear speed stats
    restart() {
        this.sampleCount = 0;
        this.samples = new Array(10);
        this.sampleIndex = 0;
        this.samplesFull = false; // unless samples is full we use first sample in order to speed up first speed update
    }
    updateSpeed (clocksPerMs) {
            sim.UI.elements.simSpeed.innerText = sim.UI.speedFormat(clocksPerMs);
    }
    updateUI() {
        if (!sim.control.running) this.updateSpeed(0);
        else {
            if (this.sampleCount == 5) {
                this.sampleCount = 0;
                const now = Date.now();
                const sample = this.samples[this.samplesFull ? this.sampleIndex : 0];
                if (sample) {
                    this.updateSpeed((this.clocks - sample[0]) / (now - sample[1]));
                }
                this.samples[this.sampleIndex] = [this.clocks, now];
                if (this.sampleIndex == 9) {
                    this.sampleIndex = 0;
                    this.samplesFull = true;
                }
                else ++this.sampleIndex;
            }
            else ++this.sampleCount;
        }
        sim.UI.elements.simClocks.innerText = String(this.clocks).replace(/\d(?=(\d{3})+$)/g, '$&,');
    }
    clock(n = 1) { this.clocks += n; }
}

/** P4 Simulator Module */
const sim = window.sim = {
    hardware: new Hardware(),
    
    // Creates a JavaScript function for every instruction in the program memory
    cacheInstructions: () => {
        const hw = sim.hardware;
        let RI;
        let PC;
        
        // Returns a JavaScript function to test a condition
        const makeTest = flag => {
            switch (flag.slice(1)) {
                case 'Z': return () => hw.stateRegister.Z;
                case 'C': return () => hw.stateRegister.C;
                case 'N': return () => hw.stateRegister.N;
                case 'O': return () => hw.stateRegister.O;
                case 'P': return () => (hw.stateRegister.N | hw.stateRegister.Z) ^ 1;
                case 'NZ': return () => hw.stateRegister.Z ^ 1;
                case 'NC': return () => hw.stateRegister.C ^ 1;
                case 'NN': return () => hw.stateRegister.N ^ 1;
                case 'NO': return () => hw.stateRegister.O ^ 1;
                case 'NP': return () => hw.stateRegister.N | hw.stateRegister.Z;
            }
            throw new Error("Invalid flag: " + flag);
        };
        
        // Returns a JavaScript function for an instruction
        const js = {
            NOP: () => () => {},
            BR: (flag, offset) => {
                const dest = (PC + offset) & 32767;
                return flag ?
                    ((test, dest) => () => {
                        if (test()) hw.setJump(dest);
                    })(makeTest(flag), dest) :
                    () => hw.setJump(dest);
            },
            JMP: (flag, RB) => flag ?
                ((test, RB) => () => {
                    if (test()) hw.setJump(hw.registerBank.registers[RB] & 32767);
                })(makeTest(flag), RB) :
                () => hw.setJump(hw.registerBank.registers[RB] & 32767),
            JAL: (flag, RB) => flag ?
                ((test, RB, PC) => () => {
                    if (test()) {
                        hw.setJump(hw.registerBank.registers[RB]);
                        hw.registerBank.write(7, PC);
                    }
                })(makeTest(flag), RB, PC + 1) :
                ((RB, PC) => () => {
                    hw.setJump(hw.registerBank.registers[RB]);
                    hw.registerBank.write(7, PC);
                })(RB, PC + 1),
            MOV: (RC, RB) => () => hw.registerBank.write(RC, hw.registerBank.registers[RB]),
            LOAD: (RC, RB) => () => hw.registerBank.write(RC, hw.IO.read(hw.registerBank.registers[RB])),
            STOR: (RB, RA) => () => hw.IO.write(hw.registerBank.registers[RB], hw.registerBank.registers[RA]),
            ENI: () => () => {
                hw.stateRegister.E = 1;
                hw.nextInterrupt();
            },
            DSI: () => () => hw.stateRegister.E = 0,
            RTI: () => () => {
                hw.stateRegister.E = hw.interrupt.E;
                hw.PC = hw.interrupt.ret;
                hw.nextInterrupt();
            },
            INT: C => () => hw.setInterrupt(C, true),
            ADD: (RC, RA, RB) => ALU(ALU.arith, ALU.ADD, RC, RA, RB),
            NEG: RC => ALU(ALU.arith, ALU.SUB, RC, 0, RC),
            SUB: (RC, RA, RB) => ALU(ALU.arith, ALU.SUB, RC, RA, RB),
            CMP: (RA, RB) => ALU(ALU.arith, ALU.SUB, 0, RA, RB),
            ADDC: (RC, RA, RB) => ALU(ALU.arith, ALU.ADDC, RC, RA, RB),
            SUBB: (RC, RA, RB) => ALU(ALU.arith, ALU.SUBB, RC, RA, RB),
            DEC: RC => ALU(ALU.arith, ALU.DEC, RC, RC),
            INC: RC => ALU(ALU.arith, ALU.INC, RC, RC),
            COM: RC => ALU(ALU.logic, ALU.COM, RC, RC),
            AND: (RC, RA, RB) => ALU(ALU.logic, ALU.AND, RC, RA, RB),
            TEST: (RA, RB) => ALU(ALU.logic, ALU.AND, 0, RA, RB),
            OR: (RC, RA, RB) => ALU(ALU.logic, ALU.OR, RC, RA, RB),
            XOR: (RC, RA, RB) => ALU(ALU.logic, ALU.XOR, RC, RA, RB),
            SHR: RC => ALU(ALU.shift, ALU.SHR, RC, RC),
            SHL: RC => ALU(ALU.shift, ALU.SHL, RC, RC),
            SHRA: RC => ALU(ALU.shift, ALU.SHRA, RC, RC),
            SHLA: RC => ALU(ALU.shift, ALU.SHLA, RC, RC),
            ROR: RC => ALU(ALU.shift, ALU.ROR, RC, RC),
            ROL: RC => ALU(ALU.shift, ALU.ROL, RC, RC),
            RORC: RC => ALU(ALU.shift, ALU.RORC, RC, RC),
            ROLC: RC => ALU(ALU.shift, ALU.ROLC, RC, RC),
            MVI: (RC, C) => () => hw.registerBank.write(RC, C),
            MVIH: (RC, C) => () => (CH => hw.registerBank.write(RC, CH | (hw.registerBank.registers[RC] & 255)))(C << 8),
            MVIL: (RC, C) => () => hw.registerBank.write(RC, (hw.registerBank.registers[RC] & 0xff00) | C),
            CLC: () => () => hw.stateRegister.C = 0,
            STC: () => () => hw.stateRegister.C = 1,
            CMC: () => () => hw.stateRegister.C ^= 1
        };
        
        // Program Memory cache loop
        hw.programMemoryCache = [];
        for (PC = 0; PC < hw.programMemory.length; PC++) {
            let cachedInstruction;
            RI = hw.programMemory[PC];
            cachedInstruction = disassemble.instructionWithHandler(RI, js);
            if (!cachedInstruction) throw new Error("Could not cache instruction: " + RI.toString(2).padStart(16, '0'));
            hw.programMemoryCache[PC] = cachedInstruction;
        }
    },
    /** Breakpoints Module */
    breakpoints: {
        steps: {},
        updated: false,
        breakpoints: null,
        hasBreakPoints: false,
        hasBreakPoint: PC => sim.breakpoints.breakpoints.has(PC),
        update: force => {
            
            const breakpoints = sim.breakpoints.breakpoints = new Set();
            const lines = new Set(); // some lines span multiple instructions, we just want to add a breakpoint to the first instruction
            
            for (const PC in sim.breakpoints.steps) {
                const line = sim.breakpoints.steps[PC];
                const gutterMarkers = codeMirror.lineInfo(line).gutterMarkers;
                if (gutterMarkers && 'breakpoints' in gutterMarkers && !lines.has(line)) {
                    breakpoints.add(Number(PC));
                    lines.add(line);
                }
            }
            sim.breakpoints.hasBreakPoints = breakpoints.size ? true : false;
            console.log("breakpoints:", breakpoints);
        }
    },
    /** Module for the controlling of the simulator. */
    control: {
        reseting: false,        // flag to indicate the reset button is pressed
        clockFrequency: 0,      // selected clock frequency in Hz
        clockTimer: 0,          // timer to add delays between clock loops
        waitingUpdateUI: false, // flag to indicate an update UI has already been requested
        stats: new SimStats(),
        running: false,         // flag to indicate the simulator is running
        autoLoad: () => {
            if (settings.get('autoLoad')) sim.control.load();
        },
        // load an assembled program in the simulator
        load: () => {
            // stop and reset current simulation
            if (sim.UI.inited) sim.control.reset();
            sim.hardware.programMemoryCache = null;
            // load the current program to the simulator
            sim.breakpoints.steps = p4.result.steps;
            sim.hardware.IO.dataMemory = p4.result.data;
            sim.hardware.programMemory = p4.result.program;
            // update memory viewers
            simUI.memoryDisplay.assembly.setMemory(sim.hardware.programMemory);
            simUI.memoryDisplay.program.setMemory(sim.hardware.programMemory);
            simUI.memoryDisplay.data.setMemory(sim.hardware.IO.dataMemory);
        },
        // prepare the simulator to start
        prepare: () => {
            if (!sim.UI.inited) sim.UI.init();
            if (!sim.hardware.programMemoryCache) {
                sim.cacheInstructions();
            }
        },
        // start the simulator
        start: () => {
            if (sim.control.running) throw new Error("Simulator already running."); // shouldn't happen
            sim.control.running = true;
            sim.UI.elements.simStartStop.innerHTML = i18n`Stop`;
            sim.control.stats.restart();

            sim.control.prepare();
            
            sim.breakpoints.update(); // update breakpoints

            const minClockDelay = 0; // minimum time betweeen loops (browser sets its own limit)
            const maxComputeTime = 25; // maximum time a loop can work
            let clocksPerLoop = 1; // how any clocks per loop
            let lastLoop = Date.now();

            const clockLoop = () => {

                const clockFrequency = sim.control.clockFrequency; // clock frequency in Hz
                const clockPeriod = 1000 / clockFrequency; // clock period in miliseconds

                const beforeComputeTime = Date.now();
                
                // loop whith breakpoints
                if (sim.breakpoints.hasBreakPoints) {
                    for (let i = 0; i < clocksPerLoop; i++) {
                        sim.hardware.clock();
                        if (sim.breakpoints.hasBreakPoint(sim.hardware.PC)) {
                            sim.control.stats.clock(i); // update clock count before stopping
                            sim.control.stop();
                            return;
                        }
                    }
                }
                // loop without breakpoints (this way we don't waste time checking for a breakpoint)
                else {
                    for (let i = 0; i < clocksPerLoop; i++) {
                        sim.hardware.clock();
                    }
                }
                sim.control.stats.clock(clocksPerLoop); // update clock count
                
                const now = Date.now();
                const computeDuration = now - beforeComputeTime; // time spent in the loop
                const loopDuration = now - lastLoop; // time elapsed since the end of the previous loop (accounts the delay between loops)
                lastLoop = now;

                // compute the maximum clocks per loop
                // it's based on the time per clock of the previous loop and the max loop duration
                // it can't be more than 16 times the clocks in the previous loop to make sure it increases gradually at the beginning
                let maxClocksPerLoop = Math.min(clocksPerLoop << 4, maxComputeTime / (computeDuration / clocksPerLoop));
                
                // compute the delay before the next loop
                // it's the difference between the target clock period and the time already spent in the loop
                let nextLoopDelay = Math.max(minClockDelay, clockPeriod - computeDuration);
                
                // compute clocks per loop
                // it's the loop duration in seconds times the target clock frequency
                clocksPerLoop = Math.max(1, Math.round(Math.min(maxClocksPerLoop, loopDuration * clockFrequency / 1000)));

                // create the timer for the next loop using the computed delay
                sim.control.clockTimer = setTimeout(clockLoop, nextLoopDelay);
                
                //console.log("Took %d ms for %d clocks. Compute time: %d ms. Max clocks: %d Delay: %d", loopDuration, clocksPerLoop, computeDuration, maxClocksPerLoop, nextLoopDelay);
            };
            clockLoop();
            sim.control.requestUpdateUI();
        },
        // stop the simulator
        stop: () => {
            if (sim.control.running) {
                sim.control.running = false;
                sim.UI.elements.simStartStop.innerHTML = i18n`Start`;
                sim.UI.updateMarker();
                clearTimeout(sim.control.clockTimer);
            }
        },
        // toggle start/stop the simulator
        toggle: () => {
             if (sim.control.running) {
                sim.control.stop();
            }
            else {
                sim.control.start();
            }
        },
        // simulate a single clock
        step: () => {
            sim.control.stop();
            sim.control.prepare();
            sim.control.stats.clock();
            sim.hardware.clock();
            sim.control.requestUpdateUI();
            sim.UI.updateMarker();
        },
        // stop and reset the simulator
        reset: () => {
            sim.control.reseting = sim.control.running;
            sim.control.stop();
            sim.hardware.reset();
            // update UI
            sim.control.stats.reset();
            sim.control.requestUpdateUI();
        },
        // restart the simulator when releasing the reset button
        restart: () => {
            if (sim.control.reseting) sim.control.start();
        },
        // update user interface
        updateUI: () => {
            sim.control.waitingUpdateUI = false;
            // update UI
            sim.control.stats.updateUI();
            sim.hardware.updateUI();
            // keep updating while the simulator is running
            if (sim.control.running) {
                sim.control.requestUpdateUI();
                // update current line marker on slow speeds
                if (sim.control.clockFrequency < 11) {
                    sim.UI.updateMarker();
                }
            }
        },
        // make a request to update the user interface before the next repaint
        requestUpdateUI: () => {
            if (!sim.control.waitingUpdateUI) {
                sim.control.waitingUpdateUI = true;
                requestAnimationFrame(sim.control.updateUI);
            }
        }
    },
    init: () => {

        sim.UI.elements.simStartStop = document.getElementById("simStartStop");
        sim.UI.elements.simSpeed = document.getElementById("simSpeed");

        // load
        document.getElementById("loadButton").addEventListener("click", () => {
            if (!p4.result) return alert(i18n`Assemble a program first.`);
            document.getElementById("simulatorContainer").scrollIntoView({block: "start"});
            sim.control.load();
        });
        
        // simulate
        document.getElementById("simulateButton").addEventListener("click", () => {
            document.getElementById("simulatorContainer").scrollIntoView({block: "start"});
            sim.control.reset();
            sim.control.start();
        });

        // start-stop
        sim.UI.elements.simStartStop.addEventListener("click", sim.control.toggle);
        document.getElementById("simStep").addEventListener("click", sim.control.step);
        
        // speed control
        const simSpeedInputRange = document.getElementById("simSpeedInputRange");
        const simSpeedInputText = document.getElementById("simSpeedInputText");
        const updateClockFrequency = e => {
            const speed = simSpeedInputRange.value;
            sim.control.clockFrequency = Math.pow(10, Number(speed));
            simSpeedInputText.innerText = speed == 10 ? i18n`Max.` : sim.UI.speedFormat(sim.control.clockFrequency / 1000);
        };
        updateClockFrequency();
        simSpeedInputRange.addEventListener("input", updateClockFrequency);
        
        // Register Display
        document.getElementById("registerDisplay").addEventListener("click", () => {
            simUI.registerFormat.toggle();
            sim.hardware.registerBank.update(); // force updating every register
            sim.hardware.registerBank.updateUI();
            sim.hardware.updateRegisterUI();
        });

        // register assembler callback
        UI.assembler.callbacks.push(sim.control.autoLoad);
        if (p4.result) sim.control.autoLoad();
    },
    UI: {
        inited: false,
        elements: {},
        // highlights assembly line being executed
        updateMarker: () => {
            const codeLine = sim.breakpoints.steps[sim.hardware.PC];
            if (codeLine != undefined) {
                if (sim.UI.marker) sim.UI.marker.clear();
                const line = codeMirror.getLine(codeLine);
                if (line) { // the line may not exist anymore if the editor's content has changed
                    sim.UI.marker = codeMirror.markText({line: codeLine, ch: 0}, {line: codeLine, ch: line.length}, {className: 'hl-line'});
                    if (!codeMirror.hasFocus()) {
                        const scrollingElement = document.scrollingElement || document.documentElement;
                        const documentScroll = scrollingElement.scrollTop;
                        codeMirror.scrollIntoView({line: codeLine, ch: 0}, 100);
                        scrollingElement.scrollTop = documentScroll;
                    }
                }
            }
        },
        speedFormat: clocksPerMs => {
            if (clocksPerMs < .5) return Math.round(clocksPerMs * 1000) + " Hz";
            else if (clocksPerMs < 500) return clocksPerMs.toFixed(clocksPerMs < 5 ? 1 : 0) + " kHz";
            else if (clocksPerMs < 500000) return (clocksPerMs / 1000).toFixed(1) + " MHz";
            else return (clocksPerMs / 1000000).toFixed(1) + " GHz";
        },
        init: () => {
            sim.UI.inited = true;
            
            sim.UI.elements.simPC = document.getElementById("simPC");
            sim.UI.elements.simRI = document.getElementById("simRI");
            sim.UI.elements.simSR = document.getElementById("simSR");
            sim.UI.elements.simClocks = document.getElementById("simClocks");
            
            // reset button
            const simReset = document.getElementById("simReset");
            simReset.addEventListener("mousedown", sim.control.reset);
            simReset.addEventListener("mouseup", sim.control.restart);

            // Terminal UI 
            simUI.terminal = {
                inited: false,
                chars: [],
                container: null,
                // fullscreen module
                fullscreen: {
                    state: false,
                    button: null,
                    labels: {enter: '\u2197', leave: '\u2715'},
                    toggle: () => UI.fullscreen.toggle(simUI.terminal.container, state => {
                        simUI.terminal.fullscreen.state = state;
                        simUI.terminal.fullscreen.button.innerHTML = UI.fullscreen.state ? 
                            simUI.terminal.fullscreen.labels.leave : simUI.terminal.fullscreen.labels.enter;
                        const container = simUI.terminal.container;
                        if (UI.fullscreen.state) {
                            container.classList.add("fullscreen");
                            container.removeAttribute("tabindex");
                            container.style.resize = 'none';
                            container.focus();
                        }
                        else {
                            container.classList.remove("fullscreen");
                            container.setAttribute("tabindex", "0");
                            container.style.resize = '';
                        }
                        simUI.terminal.size.setFullscreen(UI.fullscreen.state)
                    }),
                    init: () => {
                        const container = simUI.terminal.container = document.getElementById("simTerminal");
                        const button = simUI.terminal.fullscreen.button = document.createElement("button");
                        button.innerText = simUI.terminal.fullscreen.labels.enter;
                        container.appendChild(button);
                        button.addEventListener('click', simUI.terminal.fullscreen.toggle);
                        container.addEventListener('dblclick', simUI.terminal.fullscreen.toggle);
                    }
                },
                // resize module
                size: {
                    fontSize: null,
                    get: () => [simUI.terminal.container.offsetWidth, simUI.terminal.container.offsetHeight],
                    computeMaxFontSize: () => {
                        const [w, h] = simUI.terminal.size.get();
                        const sw = Math.floor(w / 80); // max font size for width
                        const sh = Math.floor(h / 45); // max font size for height
                        return Math.min(sw, sh); // max font size
                    },
                    // resizes the terminal and font to the current font size
                    update: () => {
                        const s = simUI.terminal.size.fontSize;
                        if (s) {
                            simUI.terminal.container.style.width = (s * 80) + 'px';
                            simUI.terminal.container.style.height = (s * 45) + 'px';
                            simUI.terminal.size.setFontSize(s);
                        }
                    },
                    // resizes the font to the specified size
                    setFontSize: s => {
                        simUI.terminal.container.style.fontSize = s + "px";
                        simUI.terminal.container.style.lineHeight = s + "px";
                    },
                    // resizes font to fit current terminal size
                    setMaxFontSize: () => {
                        const s = simUI.terminal.size.fontSize = simUI.terminal.size.computeMaxFontSize();
                        // console.log("w: %d h: %d sw: %d sh: %d cw: %d ch: %d", w, h, sw, sh, sw * 80, sh * 45);
                        simUI.terminal.size.setFontSize(s);
                    },
                    // update font size for fullscreen state
                    setFullscreen: state => {
                        if (state) simUI.terminal.size.setMaxFontSize();
                        else {
                            simUI.terminal.size.fontSize = p4.settings.get('terminalFontSize'); // restore font size from settings
                            simUI.terminal.size.update();
                        }
                    },
                    init: () => {
                        simUI.terminal.size.fontSize = p4.settings.get('terminalFontSize');
                        let simTerminalSizeChanged = false;
                        let terminalObserverDisabled = false;
                        const terminalObserver = new MutationObserver(mutations => {
                            if (!terminalObserverDisabled && !simUI.terminal.fullscreen.state) {
                                terminalObserverDisabled = true;
                                simTerminalSizeChanged = true;
                                requestAnimationFrame(() => {
                                    simUI.terminal.size.setMaxFontSize();
                                    terminalObserverDisabled = false;
                                });
                            }
                        });
                        terminalObserver.observe(simUI.terminal.container, {attributes: true});
                        simUI.terminal.container.addEventListener("mouseup", () => {
                            if (simTerminalSizeChanged) {
                                simTerminalSizeChanged = false;
                                p4.settings.set('terminalFontSize', simUI.terminal.size.fontSize);
                                simUI.terminal.size.update();
                            }
                        });
                        simUI.terminal.size.update();
                    }
                },
                init: () => {
                    simUI.terminal.inited = true;
                    
                    // terminal fullscreen
                    simUI.terminal.fullscreen.init();
                    
                    // terminal resize
                    simUI.terminal.size.init();
                    
                    // terminal content
                    const simTerminalContent = document.getElementById("simTerminalContent");
                    for (let line = 0, i = 0; line < 45; line++) {
                        for (let col = 0; col < 80; col++) {
                            const span = simUI.terminal.chars[i++] = document.createElement("span");
                            span.innerText = ' ';
                            simTerminalContent.appendChild(span);
                        }
                        simTerminalContent.appendChild(document.createElement("br"));
                    }
                    
                    // terminal input
                    simUI.terminal.container.addEventListener("keydown", e => {
                        const cp = e.key.length == 1 ? cp437.fromChar(e.key) : simUI.terminal.computeKeyValue(e.code);
                        if (cp) {
                            const keys = (e.altKey ? 1 << 10 : 0) | (e.ctrlKey ? 1 << 9 : 0) | (e.shiftKey ? 1 << 8 : 0);
                            sim.hardware.IO.terminal.keyPressed(keys | cp);
                            e.preventDefault();
                        }
                    });
                },
                computeKeyValue: code => {
                    switch (code) {
                        case 'F1': return 0x01;
                        case 'F2': return 0x02;
                        case 'F3': return 0x03;
                        case 'F4': return 0x04;
                        case 'F5': return 0x05;
                        case 'F6': return 0x06;
                        case 'F7': return 0x07;
                        case 'F8': return 0x08;
                        case 'F9': return 0x09;
                        case 'F10': return 0x0A;
                        case 'F11': return 0x0B;
                        case 'F12': return 0x0C;
                        case 'ScrollLock': return 0x0E;
                        case 'Pause': return 0x0F;
                        case 'End': return 0x10;
                        case 'Home': return 0x11;
                        case 'Insert': return 0x12;
                        case 'Backspace': return 0x13;
                        case 'Enter': return 0x14;
                        case 'Tab': return 0x16;
                        case 'Escape': return 0x17;
                        case 'ArrowUp': return 0x18;
                        case 'ArrowDown': return 0x19;
                        case 'ArrowRight': return 0x1A;
                        case 'ArrowLeft': return 0x1B;
                        case 'NumLock': return 0x1C;
                        case 'Delete': return 0x1D;
                        case 'PageUp': return 0x1E;
                        case 'PageDown': return 0x1F;
                        case 'ContextMenu': return 0x7F;
                        case 'MetaLeft': return 0xA9;
                        case 'MetaRight': return 0xAA;
                        default: return 0;
                    }
                }
            };
            simUI.terminal.init();

            // LCD
            simUI.LCD = {
                el: null,
                digits: [],
                clear: () => simUI.LCD.digits.forEach(digit => digit.innerText = ' '),
                setDigit: (i, text) => simUI.LCD.digits[i].innerText = text,
                setState: state => simUI.LCD.el.className = state ? '' : 'off',
                init: () => {
                    const el = simUI.LCD.el = document.getElementById("simLCD");
                    el.innerHTML = '';
                    for (let i = 0; i < 32; i++) {
                        const span = simUI.LCD.digits[i] = document.createElement("span");
                        span.innerText = ' ';
                        el.appendChild(span);
                        if (i == 15) {
                            el.appendChild(document.createElement("br"));
                        }
                    }
                }
            };
            simUI.LCD.init();
            
            // 7-segs UI
            simUI.display = {
                displays: [],
                setDisplay: (i, text) => simUI.display.displays[i].innerText = text,
                init: () => {
                    const display = document.getElementById("display");
                    display.innerHTML = '';
                    for (let i = 5; i > -1; i--) {
                        const span = simUI.display.displays[i] = document.createElement("span");
                        span.setAttribute("title", "HEX" + i);
                        span.innerText = '0';
                        display.appendChild(span);
                    }
                }
            };
            simUI.display.init();
            
            // Switches
            for (const checkbox of simUI.switches.switches) {
                checkbox.addEventListener("input", () => sim.hardware.IO.switches.updateValue());
            }
            
            // G-Sensor
            const accelerometerValue = n => Math.round(n < 0 ? Math.pow(2, Math.abs(n) / 32768) - 1 : -Math.pow(2, n / 32768));
            document.getElementById("simAccelerometerX").addEventListener('input', e => sim.hardware.IO.accelerometer.x = accelerometerValue(e.target.value));
            document.getElementById("simAccelerometerY").addEventListener('input', e => sim.hardware.IO.accelerometer.y = accelerometerValue(e.target.value));
            document.getElementById("simAccelerometerZ").addEventListener('input', e => sim.hardware.IO.accelerometer.z = accelerometerValue(e.target.value));
            
            // Push Buttons
            document.querySelectorAll("#simPushButtons > button").forEach(button => {
                button.addEventListener("click", () => {
                    sim.hardware.setInterrupt(Number(button.value));
                });
            });
        }
    }
};

sim.init();