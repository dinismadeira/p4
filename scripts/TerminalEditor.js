/**
 * Terminal Editor Window
 * 
 * @requires modal
 *
 * @author Dinis Madeira (dinismadeira@tecnico.ulisboa.pt)
 * @version 2018
 */
 
'use strict';

const TerminalEditor = () => {
        
    // Open Terminal Editor Window
    const html = String.raw; // used for minification
    modal.open(html`
        <style>
            #terminalEdit {
                font-size: 12px;
                margin: 5px;
                width: 960px;
                height: 540px;
                line-height: 12px;
                word-break: break-all;
            }
            #terminalAssembly {
                width: 95%;
                height: 90vh;
            }
            #terminalChars > button {
                font-family: Terminal;
                background-color: #000;
                margin: 1px;
                width: 25px;
                min-width: 0;
                font-size: 20px;
                padding: 0;
                line-height: 25px;
            }
        </style>
        <label>${i18n`Colour`}: <input type="color" id="terminalForegroundColor" value="#FFFFFF" /></label> <button id="terminalForegroundColorSet">${i18n`Set`}</button>
        <label>${i18n`Background Colour`}: <input type="color" value="#000000" id="terminalBackgroundColor" /></label> <button id="terminalBackgroundColorSet">${i18n`Set`}</button>
        <button id="terminalGenerateAssembly">${i18n`Generate Assembly`}</button>
        <div id="terminalEdit" class="terminal" contenteditable="true" spellcheck="false"></div>
        <div>
            <span id="terminalChars"></span>
            <label>${i18n`Repeat`}: <input id="terminalCharsRepeat" type="number" min="1" max="3600" value="1"></label>
        </div>
        <br>
        <div id="terminalAssembly"></div>
    `);
    
    // Character Picker
    const computeChars = () => {
        const makeRange = (a, b) => Array(b - a + 1).fill().map((e, i)=> i + a);
        const chars = 
            makeRange(1, 31).
            concat([127, 134, 143, 145, 146, 155, 157, 158, 159]).
            concat(makeRange(169, 173)).
            concat(makeRange(176, 254));
        const terminalChars = [];
        for (const c of chars) {
            terminalChars.push(`<button>${cp437.toChar(c)}</button>`);
        }
        return terminalChars.join(" ");
    };
    const terminalChars = document.getElementById("terminalChars");
    terminalChars.innerHTML = computeChars();
    terminalChars.addEventListener("click", e => {
        const c = e.target.innerText;
        const repeat = Math.min(3600, Number(document.getElementById("terminalCharsRepeat").value));
        document.execCommand("insertText", false, c.repeat(repeat));
    });
    
    // Colour Selection
    const colorInput = document.getElementById('terminalForegroundColor');
    const applyColor = () => document.execCommand("foreColor", false, colorInput.value);
    colorInput.addEventListener("input", applyColor);
    document.getElementById("terminalForegroundColorSet").addEventListener("click", applyColor);

    // Background Colour Selection
    const bgcolorInput = document.getElementById('terminalBackgroundColor');
    const applyBgColor = () => document.execCommand("hiliteColor", false, bgcolorInput.value);
    bgcolorInput.addEventListener("input", applyBgColor);
    document.getElementById("terminalBackgroundColorSet").addEventListener("click", applyBgColor);
        
    const parseContent = window.parseContent = () => {
        const ranges = [];
        let range;
        
        let insideDiv = false;
        let index = 0;
        const rgb = s => s.replace(/^(rgb|rgba)\(/,'').replace(/\)$/,'').replace(/\s/g,'').split(',').map(Number).slice(0, 3).reduce((t, n) => (t << 8) + n);
        const pushRange = () => {
            if (range && (range.text.trim().length || range.color != 0xffffff || range.bgcolor)) ranges.push(range);
        };
        const newRange = (color, bgcolor) => {
            // console.log("-new range-", range, color, bgcolor);
            pushRange();
            range = {index, index, text: '', color: color, bgcolor: bgcolor};
        };
        const newLine = () => {
            // console.log("-newline-", index);
            const newIndex = (Math.floor(index / 80) + 1) * 80;
            const spaces = newIndex - index;
            if (spaces < 5) range.text += ' '.repeat(spaces);
            else {
                index = newIndex;
                newRange(range.color, range.bgcolor);
            }
        };
        const parseNodes = (nodes, color = 0xffffff, bgcolor = 0) => {
            if (index == 3600) return;
            for (let node of nodes) {
                // console.log("NODE:", node, color, bgcolor, range.color, range.bgcolor);
                
                if (node.nodeType === 3) {
                    // console.log("text:", node.nodeValue, index, color, bgcolor);
                    if (color != range.color || bgcolor != range.bgcolor) {
                        newRange(color, bgcolor);
                    }
                    for (const c of node.nodeValue) {
                        range.text += cp437.fromChar(c) ? c : ' '; // if the character doesn't exist in CP437 it will be replaced by a space
                        if (++index == 3600) return;
                    }
                }
                else if (node.nodeType === 1) {
                    if (!insideDiv) {
                        insideDiv = node.nodeName == "DIV";
                        //if (insideDiv || node.nodeName == "BR") {
                        if (insideDiv) {
                            newLine();
                        }
                    }
                    
                    const newColor = rgb(getComputedStyle(node).color);
                    const newBgcolor = rgb(getComputedStyle(node).backgroundColor);
                    // console.log("color:", getComputedStyle(node).color, getComputedStyle(node).backgroundColor, newColor, newBgcolor);
                    parseNodes(node.childNodes, newColor, newBgcolor);

                    
                    
                    if (node.nodeName == "DIV") {
                        insideDiv = false;
                    }
                }
            }
        };
        newRange(0xffffff, 0);
        parseNodes(terminalContainer.childNodes);
        pushRange();
        return ranges;
    };
    
    const renderContent = ranges => {
        let line = 0;
        let insideDiv = false;
        let div = [];
        const nodes = [];
        const hex = dec => '#' + dec.toString(16).padStart(6, '0');
        const pushDiv = () => {
            nodes.push(`<div>${div.join("")}</div>`);
        };
        const newLine = () => {
            if (div.length) {
                pushDiv();
                div = [];
            }
            else nodes.push(`<div><br></div>`);
            ++line;
        };
        for (const range of ranges) {
            const rangeLine = Math.floor(range.index / 80);
            while (line != rangeLine) {
                newLine();
            }
            div.push(`<span style="color:${hex(range.color)};background-color:${hex(range.bgcolor)}">${range.text}</span>`);
        }
        if (div.length) pushDiv();
        return nodes.join("");
    };
    
    const terminalColor = (color, bgcolor) => {
        const b = (value, shiftRight, shiftLeft) => (value >> shiftRight) << shiftLeft;
        const e = (value, shift) => (value >> shift) & 0xff;
        return b(e(bgcolor, 16), 5, 13) | b(e(bgcolor, 8), 5, 10) | b(e(bgcolor, 0), 6, 8) | 
            b(e(color, 16), 5, 5) | b(e(color, 8), 5, 2) | b(e(color, 0), 6, 0);
    };
 

    // Terminal Editor
    let contentChanged = false;
    const terminalContainer = document.getElementById('terminalEdit');
    terminalContainer.innerHTML = document.getElementById("simTerminalContent").innerHTML;
    document.execCommand("styleWithCSS", false, true);
    const parsedContent = parseContent();
    console.log(parsedContent);
    terminalContainer.innerHTML = renderContent(parsedContent);
    terminalContainer.focus();
    
    terminalContainer.addEventListener("input", e => {
        console.log(e);
        contentChanged = true;
        // const parsedContent = parseContent();
        // console.log(parsedContent);
        // generateAssembly(parsedContent);
    });
    
    terminalContainer.addEventListener("keydown", e => {
        if (e.key.length == 1 && !cp437.fromChar(e.key)) {
            const key = e.key.
                replace(/€/, 'ε').
                replace(/[ÁÀÂÃ]/, 'A').
                replace(/[ÈÊ]/, 'E').
                replace(/[ÍÌ]/, 'I').
                replace(/[ÓÒÔÕ]/, 'O').
                replace(/[ÚÙÛ]/, 'U').
                replace(/ã/, 'a').
                replace(/õ/, 'o');
            if (key != e.key) document.execCommand("insertText", false, key);
            e.preventDefault();
        }
    });
    
    // Assembler Result
    const terminalAssembly = new CodeMirror(document.getElementById("terminalAssembly"), {
        mode: 'p4',
        theme: 'eclipse',
        readOnly: true
    });

    const UIGenerateAssembly = () => terminalAssembly.setValue(generateAssembly(parseContent()));

  
    const assemblyProgram = data => `TERM_WRITE      EQU     FFFEh
TERM_CURSOR     EQU     FFFCh
TERM_COLOR      EQU     FFFBh

TerminalStr     STR     ${data}
                MVI     R1, TERM_WRITE
                MVI     R2, TERM_CURSOR
                MVI     R3, TERM_COLOR
                MVI     R4, TerminalStr

TerminalLoop:
                LOAD    R5, M[R4]
                INC     R4
                CMP     R5, R0
                BR.Z    .Control
                STOR    M[R1], R5
                BR      TerminalLoop

.Control:
                LOAD    R5, M[R4]
                INC     R4
                DEC     R5
                BR.Z    .Position
                DEC     R5
                BR.Z    .Color
                BR      .End

.Position:
                LOAD    R5, M[R4]
                INC     R4
                STOR    M[R2], R5
                BR      TerminalLoop

.Color:
                LOAD    R5, M[R4]
                INC     R4
                STOR    M[R3], R5
                BR      TerminalLoop

.End:
                BR      0`;

    const generateAssembly = ranges => {
        let index = 0;
        let data = [];
        let color = 0xffffff;
        let bgcolor = 0;
        const dataPush = (c, isChar) => {
            if (isChar) data.push(`'${c}'`);
            else data.push(c > 9 ? c.toString(16) + 'h' : c);
        };
        const setPosition = newIndex => {
            dataPush(0, false);
            dataPush(1, false);
            dataPush((Math.floor(newIndex / 80) << 8) | (newIndex % 80), false);
            index = newIndex;
        };
        const setColor = (newColor, newBgcolor) => {
            dataPush(0, false);
            dataPush(2, false);
            dataPush(terminalColor(newColor, newBgcolor), false);
            color = newColor;
            bgcolor = newBgcolor;
        };
        for (const range of ranges) {
            if (range.index != index) setPosition(range.index);
            if (range.color != color || range.bgcolor != bgcolor) setColor(range.color, range.bgcolor);
            dataPush(range.text, true);
            index += range.text.length;
        }
        dataPush(0, false);
        dataPush(0, false);
        return assemblyProgram(data.join(","));
    };

    UIGenerateAssembly();
    document.getElementById("terminalGenerateAssembly").addEventListener("click", UIGenerateAssembly);

    // Window Close Handler
    modal.onClose = () => !contentChanged || confirm(i18n`Changes will be lost, continue?`);
};

document.getElementById("simTerminalEdit").addEventListener("click", TerminalEditor);
