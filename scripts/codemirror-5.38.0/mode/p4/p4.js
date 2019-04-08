// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

(function(mod) {
    if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"));
    else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror"], mod);
    else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
    "use strict";

    CodeMirror.defineMode('p4', function(_config, parserConfig) {
        const ez80 = parserConfig.ez80;
        const keywords = /^(addc?|subb?|and|x?or|dec|inc|com|sh[rl]a?|ro[rl]c?|cmp|test|neg|mov|load|stor|mvi[hl]?|stc|clc|cmc|nop|br|jmp|jal|orig|equ|str|tab|word|rti|eni|dsi|int|push|pop|call|ret|retn|opt)\b/i;
        const variables = /^(r[0-8]|sp|pc)\b/i;
        const errors = /^([hl][xy]|i[xy][hl]|slia|sll)\b/i;
        const numbers = /^([\da-f]+h|[0-7]+o|[01]+b|\d+d?)\b/i;
        const contexts = {initial: 0, keyword: 1};

        return {
            startState: function() {
                return {
                    context: contexts.initial
                };
            },
            token: function(stream, state) {
                if (!stream.column()) state.context = 0;

                if (stream.eatSpace()) return null;

                var w;

                if (stream.eatWhile(/\w/)) {
                    if (ez80 && stream.eat('.')) {
                        stream.eatWhile(/\w/);
                    }
                    w = stream.current();

                    if (state.context == contexts.keyword && variables.test(w)) {
                        return 'variable-2';
                    }
                    else if (state.context == contexts.keyword && numbers.test(w)) {
                        return 'number';
                    }
                    else if (state.context == contexts.keyword && /^m$/i.test(w) && stream.peek() == '[') {
                        return 'def';
                    }
                    else if (keywords.test(w)) {
                        state.context = contexts.keyword;
                        return 'keyword';
                    } 
                    else {
                        return 'atom';
                    }
                }
                else if (stream.eat('[') || stream.eat(']')) return 'bracket';
                else if (stream.eat(';')) {
                    stream.skipToEnd();
                    return 'comment';
                } 
                else if (stream.eat("'")) {
                    while (w = stream.next()) {
                        if (w == "'") break;

                        if (w == '\\') stream.next();
                    }
                    return 'string';
                } 
                else if (stream.eat('\'')) {
                    if (stream.match(/\\?.'/)) return 'number';
                } 
                else if (stream.eat('.') || stream.sol() && stream.eat('#')) {
                    state.context = 5;

                    if (stream.eatWhile(/\w/)) return 'def';
                } 
                else if (stream.eat('$')) {
                    if (stream.eatWhile(/[\da-f]/i))
                    return 'number';
                } 
                else if (stream.eat('%')) {
                    if (stream.eatWhile(/[01]/))
                    return 'number';
                } 
                else {
                    stream.next();
                }
                return null;
            },
            /*indent: (state, textAfter) => {
                console.log("textAfter", textAfter, /^\w+:/.test(textAfter));
                if (/^\w+:/.test(textAfter)) return 0;
                return 16;
            },
            electricInput: /^\s*(?:\w+:)$/,*/
        };
    });

    CodeMirror.defineMIME("text/x-p4", "p4");

});
