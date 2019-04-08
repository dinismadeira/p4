/**
 * Parses a MIF and returns an array representing the memory contents.
 *
 * @author Dinis Madeira (dinismadeira@tecnico.ulisboa.pt)
 * @version 2018
 */
 
'use strict';

const parseMIF = content => {
    
    const parseRadix = radix => {
        switch (radix.toUpperCase()) {
            case 'HEX': return 16;
            case 'DEC': return 10;
            case 'BIN': return 2;
        }
        throw new Error("Unknown radix: " + radix);
    };
    
    const deph = (() => {
        const matches = content.match(/DEPTH=(\d+);/);
        if (!matches) throw new Error("Could not find address radix.");
        return Number(matches[1]);
    })();
    
    const addrRadix = (() => {
        const matches = content.match(/ADDRESS_RADIX=(.+);/);
        if (!matches) throw new Error("Could not find address radix.");
        return parseRadix(matches[1]);
    })();
    
    const dataRadix = (() => {
        const matches = content.match(/DATA_RADIX=(.+);/);
        if (!matches) throw new Error("Could not find data radix.");
        return parseRadix(matches[1]);
    })();
    
    const result = new Uint16Array(deph);
    const matches = content.match(/([0-9a-f]+|\[[0-9a-f]+\.\.[0-9a-f]+\])\s*:\s*[0-9a-f]+/ig);
    for (const match of matches) {
        const m1 = match.match(/([0-9a-f]+)\s*:\s*([0-9a-f]+)/i);
        if (m1) {
            const addr = parseInt(m1[1], addrRadix);
            const data = parseInt(m1[2], dataRadix);
            result[addr] = data;
        }
        else {
            const m2 = match.match(/\[([0-9a-f]+)\.\.([0-9a-f]+)\]\s*:\s*([0-9a-f]+)/i);
            if (m2) {
                const addrFrom = parseInt(m2[1], addrRadix);
                const addrTo = parseInt(m2[2], addrRadix);
                const data = parseInt(m2[3], dataRadix);
                for (let addr = addrFrom; addr < addrTo + 1; addr++) {
                    result[addr] = data;
                }
            }
        }
    }
    return result;
};