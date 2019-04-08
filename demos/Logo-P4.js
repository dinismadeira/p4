fileManager.demos['Logo-P4'] = String.raw`

TERM_WRITE      EQU     FFFEh
TERM_CURSOR     EQU     FFFCh
TERM_COLOR      EQU     FFFBh

                MVI     R1, TERM_WRITE
                MVI     R2, 3600
ClearLoop:      STOR    M[R1], R0
                DEC     R2
                BR.NZ   ClearLoop

TerminalStr     STR     0,2,7e0h,'█████████████████████████████████████████████████████████████████████████████████                                                                              ██                                                                              ██                                                                              ██                                                                              ██                                                                              ██                                                                              ██                                                                              ██                                                                              ██                                                                              ██                                                                              ██                                                                              ██                                                                              ██                                                                              ██                                                                              ██                             ',0,2,7fdh,'████████         ███',0,2,7e0h,'                             ██                             ',0,2,7fdh,'█████████       ████',0,2,7e0h,'                             ██                             ',0,2,7fdh,'███   ███      █████',0,2,7e0h,'                             ██                             ',0,2,7fdh,'███   ███     ██████',0,2,7e0h,'                             ██                             ',0,2,7fdh,'███   ███     ██ ███',0,2,7e0h,'                             ██                             ',0,2,7fdh,'████████     ██  ███',0,2,7e0h,'                             ██                             ',0,2,7fdh,'███████     ███  ███',0,2,7e0h,'                             ██                             ',0,2,7fdh,'███         █████████',0,2,7e0h,'                            ██                             ',0,2,7fdh,'███         █████████',0,2,7e0h,'                            ██                             ',0,2,7fdh,'███              ███',0,2,7e0h,'                             ██                             ',0,2,7fdh,'███              ███',0,2,7e0h,'                             ██                             ',0,2,7fdh,'███              ███',0,2,7e0h,'                             ██                                                                              ██                                                                              ██                                                                              ██                  ',0,2,7ffh,'Pequeno Processador Pedagógico com Pipeline',0,2,7e0h,'                 ██                                                                              ██                                                                              ██                                                                              ██                                                                              ██                                                                              ██                                                                              ██                                                                              ██                                                                              ██                                                                              ██                                                                              ██                                                                              ██                                                                              ██                                                                              █████████████████████████████████████████████████████████████████████████████████',0,0
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
                BR      0
                
`.trim();