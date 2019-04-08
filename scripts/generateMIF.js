/**
 * Generates a Memory Initialization File (MIF)
 *
 * @param {Array.<Number>} data - The memory content.
 * @param {Number} addrRadix - The radix for address values.
 * @param {Number} dataRadix - The radix for data values.
 * @param {Number} width - The size of data in bits.
 * @param {Number} depth - The size of memory in words.
 *
 * @author Dinis Madeira (dinismadeira@tecnico.ulisboa.pt)
 * @version 2018
 */
 
'use strict';

(() => {
    const generateMIF = (data, addrRadix, dataRadix, width = 16, depth = 32768) => {
        const radix = {2: 'BIN', 10: 'UNS', 16: 'HEX'};
        const dataPadding = width / Math.log2(dataRadix);
        const dataFormat = n => n.toString(dataRadix).padStart(dataPadding, '0');
        const addrFormat = addr => addr.toString(addrRadix);
        const m = [];
        let lastValue = data[1];
        let valueCount = 0; // count addresses with the same value
        const addRange = i => {
            if (valueCount === 1) m.push(addrFormat(i - 1).padStart(13, ' ') + ' : ' + dataFormat(lastValue) + ";");
            else m.push(('[' + addrFormat(i - valueCount) + '..' + addrFormat(i - 1) + ']').padStart(13, ' ') + ' : ' + dataFormat(lastValue) + ";");
        };
        for (let i = 0; i < data.length; i++) {
            const n = data[i];

            if (lastValue != n) {
                if (i) addRange(i);
                lastValue = n;
                valueCount = 1;
            }
            else ++valueCount;
        }
        addRange(data.length);
        return `WIDTH=${width};
    DEPTH=${depth};

    ADDRESS_RADIX=${radix[addrRadix]};
    DATA_RADIX=${radix[dataRadix]};

    CONTENT BEGIN
    ${m.join("\n")}
    END;
    `;
    };
    if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
        module.exports = generateMIF;
    }
    else window.generateMIF = generateMIF;
})();