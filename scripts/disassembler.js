/**
 * Disassemble P4 instructions.
 *
 * @author Dinis Madeira (dinismadeira@tecnico.ulisboa.pt)
 * @version 2018
 */
 
'use strict';

(() => {
    
    const formatConstant = n => n < 10 ? n : n.toString(16).toUpperCase() + 'h'; // decimal for numbers < 10, hexadecimal otherwise
    
    const indent = line => {
        const matches = line.match(/(.+?)(?: (.+))?$/);
        return ' '.repeat(16) + (matches[2] ? matches[1].padEnd(8, ' ') + matches[2] : matches[1]);
    };
    
    const disassemble = {
    
        // Assembly Source Code
        source: {
            NOP: () => `NOP`,
            BR: (flag, offset) => `BR${flag} ${offset}`,
            JMP: (flag, RB) => `JMP${flag} R${RB}`,
            JAL: (flag, RB) => `JAL${flag} R${RB}`,
            MOV: (RC, RB) => `MOV R${RC}, R${RB}`,
            LOAD: (RC, RB) => `LOAD R${RC}, M[R${RB}]`,
            STOR: (RB, RA) => `STOR M[R${RB}], R${RA}`,
            ENI: () => `ENI`,
            DSI: () => `DSI`,
            RTI: () => `RTI`,
            INT: (C) => `INT ${C}`,
            ADD: (RC, RA, RB) => `ADD R${RC}, R${RA}, R${RB}`,
            NEG: RC => `NEG R${RC}`,
            SUB: (RC, RA, RB) => `SUB R${RC}, R${RA}, R${RB}`,
            CMP: (RA, RB) => `CMP R${RA}, R${RB}`,
            ADDC: (RC, RA, RB) => `ADDC R${RC}, R${RA}, R${RB}`,
            SUBB: (RC, RA, RB) => `SUBB R${RC}, R${RA}, R${RB}`,
            DEC: (RC) => `DEC R${RC}`,
            INC: (RC) => `INC R${RC}`,
            COM: (RC) => `COM R${RC}`,
            AND: (RC, RA, RB) => `AND R${RC}, R${RA}, R${RB}`,
            TEST: (RA, RB) => `TEST R${RA}, R${RB}`,
            OR: (RC, RA, RB) => `OR R${RC}, R${RA}, R${RB}`,
            XOR: (RC, RA, RB) => `XOR R${RC}, R${RA}, R${RB}`,
            SHR: RC => `SHR R${RC}`,
            SHL: RC => `SHL R${RC}`,
            SHRA: RC => `SHRA R${RC}`,
            SHLA: RC => `SHLA R${RC}`,
            ROR: RC => `ROR R${RC}`,
            ROL: RC => `ROL R${RC}`,
            RORC: RC => `RORC R${RC}`,
            ROLC: RC => `ROLC R${RC}`,
            MVI: (RC, C) => `MVI R${RC}, ${formatConstant(C)}`,
            MVIH: (RC, C) => `MVIH R${RC}, ${formatConstant(C)}`,
            MVIL: (RC, C) => `MVIL R${RC}, ${formatConstant(C)}`,
            CLC: () => `CLC`,
            STC: () => `STC`,
            CMC: () => `CMC`
        },
        
        // Disassembles a single instruction and returns the assembly source code
        instruction: RI => disassemble.instructionWithHandler(RI, disassemble.source),
        
        // Disassembles a single instruction and calls the given handler
        instructionWithHandler: (RI, i) => {
            const format = RI >> 14;
            switch (format) {
                // control instructions
                case 0: {
                    const op = RI >> 12 & 3;
                    // NOP
                    if (op === 0) return i.NOP();
                    else {
                        const cond = RI >> 8 & 15;
                        let flag = '';
                        //if ((cond >> 2) != 3) {
                        if (cond != 1) {
                            flag += '.';
                            if (cond & 1) flag += 'N'; // negative condition
                            switch (cond >> 1) {
                                /*case 0: flag += 'Z'; break; // zero
                                case 1: flag += 'C'; break; // carry
                                case 2: flag += 'N'; break; // negative
                                case 3: flag += 'O'; break; // overflow
                                case 4: flag += 'P'; break; // positive*/
                                case 1: flag += 'Z'; break; // zero
                                case 2: flag += 'C'; break; // carry
                                case 3: flag += 'N'; break; // negative
                                case 4: flag += 'O'; break; // overflow
                                case 5: flag += 'P'; break; // positive
                                default: throw new Error("Wrong cond value: " + cond);
                            }
                        }

                        // BR
                        if (op == 1) {
                            let offset = RI & 127;
                            // negative number
                            if (RI >> 7 & 1) {
                                offset -= 128;
                            }
                            return i.BR(flag, offset);
                        }
                        else {
                            const RB = RI & 7;
                            // JMP
                            if (op == 2) return i.JMP(flag, RB);
                            // JAL
                            else return i.JAL(flag, RB);
                        }
                    }
                    break;
                }
                // transfer instructions
                case 1: {
                    const RC = RI >> 11 & 7;
                    const OP = RI >> 8 & 7;
                    const RA = RI >> 3 & 7;
                    const RB = RI & 7;
                    switch (OP) {
                        case 0: return i.MOV(RC, RB); // MOV
                        case 2: return i.LOAD(RC, RB); // LOAD
                        case 3: return i.STOR(RB, RA); // STOR
                        case 4: return i.ENI(); // ENI
                        case 5: return i.DSI(); // DSI
                        case 6: return i.RTI(); // RTI
                        case 7: return i.INT(RI & 255); // INT
                    }
                    break;
                }
                // Arithmetic, Logic, Shift Instructions
                case 2: {
                    const RC = RI >> 11 & 7;
                    const ALUC = RI >> 6 & 31;
                    const RA = RI >> 3 & 7;
                    const RB = RI & 7;
                    const unit = ALUC >> 3;
                    const op = ALUC & 7;
                    switch (unit) {
                        // arithmetic unit
                        case 0: {
                            switch (op) {
                                case 0: return i.ADD(RC, RA, RB);
                                case 1: return RC ? (RC == RB && !RA ? i.NEG(RC) : i.SUB(RC, RA, RB)) : i.CMP(RA, RB);
                                case 2: return i.ADDC(RC, RA, RB);
                                case 3: return i.SUBB(RC, RA, RB);
                                case 4: return i.DEC(RC);
                                case 5: return i.INC(RC);
                            }
                            break;
                        }
                        // logic unit
                        case 1: {
                            switch (op) {
                                case 0: return i.COM(RC);
                                case 1: return RC ? i.AND(RC, RA, RB) : i.TEST(RA, RB);
                                case 2: return i.OR(RC, RA, RB);
                                case 3: return i.XOR(RC, RA, RB);
                            }
                            break;
                        }
                        // shift unit
                        case 2: {
                            switch (op) {
                                case 0: return i.SHR(RC);
                                case 1: return i.SHL(RC);
                                case 2: return i.SHRA(RC);
                                case 3: return i.SHLA(RC);
                                case 4: return i.ROR(RC);
                                case 5: return i.ROL(RC);
                                case 6: return i.RORC(RC);
                                case 7: return i.ROLC(RC);
                            }
                        }
                    }
                    break;
                }
                // transfer and generic instructions
                case 3: {
                    const RC = RI >> 11 & 7;
                    const OP = RI >> 8 & 7;
                    const C = RI & 255;
                    switch (OP) {
                        case 0: return i.MVI(RC, C);
                        case 2: return i.MVIH(RC, C);
                        case 3: return i.MVIL(RC, C);
                        case 4: return i.CLC();
                        case 5: return i.STC();
                        case 6: return i.CMC();
                    }
                    break;
                }
            }
            throw new Error("Could not disassemble: " + RI.toString(2).padStart(16, '0'));
        },
        
        // Disassembles the Program Memory
        prog: data => {
            let result = [`ORIG 0000h`];
            let nop = 0; // pending NOPs
            let jump = false; // last instruction was a jump
            let useDelaySlot = false; // use custom delay slots
            const delaySlots = {}; // delay sloys index
            for (let i = 0; i < data.length; i++) {
                const instruction = data[i];
                if (!instruction) {
                    if (jump) {
                         // Mark delay slots
                        jump = false;
                        delaySlots[result.length] = true;
                        result.push("NOP");
                    }
                    else nop++;
                }
                else {
                    if (jump) useDelaySlot = true; // A delay slot that is not a NOP was found, we must enable delay slots
                    if (nop) {
                        if (nop == 1) result.push("NOP");
                        else result.push(`ORIG ${formatConstant(i)}`);
                        nop = 0;
                    }
                    const assembly = disassemble.instruction(instruction);
                    result.push(assembly);
                    jump = /^(br|jmp|jal|int|rti)(\..?.)? /i.test(assembly);
                }
            }
            if (useDelaySlot) result.unshift(`OPT ENABLE_DELAY_SLOTS`);
            else result = result.filter((instruction, index) => !delaySlots[index]); // No delay slots were used
            return result.map(indent).join("\n");
        },
        
        // Disassembles the Data Memory
        data: data => {
            const result = [indent(`ORIG 0000h`)];
            let tokens = [];
            let token = '';
            let str = false;
            let nop = 0;
            let sindex = 0;
            const push = c => {
                if (c && c < 256) {
                    // console.log("push", c, token);
                    if (!str) str = true;
                    token += cp437.toChar(c);
                }
                else {
                    if (str) pushToken();
                    tokens.push(c);
                }
            };
            const pushToken = () => {
                // console.log("pushToken", token);
                tokens.push(`'${token}'`);
                token = '';
                str = false;
            };
            const pushTokens = () => {
                // console.log('pushTokens', tokens.join(','));
                result.push(('_D' + sindex++).padEnd(16, ' ') + 'STR     ' + tokens.join(','));
                tokens = [];
            };
            
            for (let i = 0; i < data.length; i++) {
                const c = data[i];
                if (!c) nop++;
                else {
                    // console.log("c", c);
                    if (nop) {
                        // console.log("nop", nop);
                        if (nop < 2) {
                            for (let i = 0; i < nop; i++) push(0);
                        }
                        else {
                            if (str) pushToken();
                            pushTokens();
                            result.push(indent(`ORIG ${formatConstant(i)}`));
                        }
                    }
                    push(c);
                    nop = 0;
                }
            }
            
            if (str) pushToken();
            if (tokens.length) pushTokens();
            return result.join("\n");
        }
    };
    
    if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') { 
        module.exports = disassemble;
    }
    else window.disassemble = disassemble;
})();
