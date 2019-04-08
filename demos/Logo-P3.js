fileManager.demos['Logo-P3'] = String.raw`

;===============================================================================
;
;       P3CPU Unofficial ASCII Logo
;
;       2017 Gonçalo Baltazar <me@goncalomb.com>
;       I place this code in the public domain.
;       https://creativecommons.org/publicdomain/zero/1.0/
;
;===============================================================================

INT15_TIMER     EQU     fe0fh

TIMER_VALUE     EQU     fff6h
TIMER_CONTROL   EQU     fff7h
INT_MASK        EQU     fffah
TERM_CURSOR     EQU     fffch
TERM_WRITE      EQU     fffeh

SP_ADDRESS      EQU     fdffh
INT_MASK_VALUE  EQU     8000h

;============== Data Region (starting at address 8000h) ========================

                ORIG    8000h

LOGO_00         STR     ' ______________________________________________________________________________ '
LOGO_01         STR     '|    _____________      ____________                                           |'
LOGO_02         STR     '|   /             \    /            \                                          |'
LOGO_03         STR     '|  /\     _____    \  /\_________    \        THE P3 EDUCATIONAL CPU           |'
LOGO_04         STR     '|  \ \    \___ \    \ \/_________\    \           P3JS Simulator               |'
LOGO_05         STR     '|   \ \    \__\_\    \    ________\    \                                       |'
LOGO_06         STR     '|    \ \              \  /\             \     ______    ______    __  __       |'
LOGO_07         STR     '|     \ \     ________/  \ \_________    \   /\  ___\  /\  __ \  /\ \/\ \      |'
LOGO_08         STR     '|      \ \    \______/    \/_________\    \  \ \ \     \ \ \_\ \ \ \ \ \ \     |'
LOGO_09         STR     '|       \ \    \              ________\    \  \ \ \     \ \  ___\ \ \ \ \ \    |'
LOGO_10         STR     '|        \ \    \            /\             \  \ \ \____ \ \ \__/  \ \ \_\ \   |'
LOGO_11         STR     '|         \ \____\           \ \____________/   \ \_____\ \ \_\     \ \_____\  |'
LOGO_12         STR     '|          \/____/            \/___________/     \/_____/  \/_/      \/_____/  |'
LOGO_13         STR     '|______________________________________________________________________________|'
LOGO_14         STR     0000h

STR_0           STR     'Your browser is running a demo simulation of the P3 CPU!',0
STR_1           STR     'Visit https://p3js.goncalomb.com/ for the full simulator and more demos...',0

SPINNER_STR     STR     '|\-/'
SPINNER_VALUE   WORD    0

COUNTER         WORD    0

;============== Code Region (starting at address 0000h) ========================

                ORIG    0000h
                JMP     Main

;-------------- Routines -------------------------------------------------------

                ; interrupt timer routine

Int15Routine:   JAL    	DrawSpinner
                JAL    	DrawCounter
                JAL    	StartTimer
                RTI

                ; routine to start the timer

StartTimer:     MOV		R5, R1
                STOR	M[R6], R5
                DEC		R6
                MVI     R1, 2
                MVI 	R5, TIMER_VALUE
                STOR    M[R5], R1
                MVI     R1, 1
                MVI 	R5, TIMER_CONTROL
                STOR    M[R5], R1
                INC		R6
                LOAD	R1, M[R6]
                JMP		R7

                ; routine to draw the logo

DrawLogo:       STOR	M[R6], R1
                DEC		R6
                STOR	M[R6], R2
                DEC		R6
                STOR	M[R6], R3
                DEC		R6
                MVI     R1, ffffh
                MVI		R5, TERM_CURSOR
                STOR    M[R5], R1
                MVI     R1, LOGO_00
                MOV     R2, R0

DrawLogoLoop:   LOAD    R3, M[R1]
                CMP     R3, R0
                BR.Z    DrawLogoRet
                MVI		R5, TERM_CURSOR
                STOR    M[R5], R2
                MVI		R5, TERM_WRITE
                STOR    M[R5], R3

                MVI     R3,  0100h
DrawLogoDelay:  DEC     R3
                BR.NZ   DrawLogoDelay

                INC     R1
                INC     R2

                MOV     R3, R2
                MVI		R5, 00ffh
                AND     R3, R3, R5
                MVI		R5, 80
                CMP     R3, R5
                BR.NZ   DrawLogoLoop

                MVI		R5, 00ffh
                OR      R2, R2, R5
                INC     R2
                BR      DrawLogoLoop

DrawLogoRet:    INC		R6
                LOAD	R3, M[R6]
                INC		R6
                LOAD	R2, M[R6]
                INC		R6
                LOAD	R1, M[R6]
                JMP		R7

                ; routine to draw the spinners
                
DrawSpinner:    STOR	M[R6], R1
                DEC		R6
                STOR	M[R6], R2
                DEC		R6

                MVI     R1, SPINNER_STR
                MVI		R5, SPINNER_VALUE
                LOAD	R5, M[R5]
                ADD     R1, R1, R5
                LOAD    R1, M[R1]

                MVI     R2, 032ch
                MVI		R5, TERM_CURSOR
				STOR    M[R5], R2
                MVI		R5, TERM_WRITE
                STOR    M[R5], R1
                MVI		R5, 25
                ADD     R2, R2, R5
                MVI		R5, TERM_CURSOR
                STOR    M[R5], R2
                MVI		R5, TERM_WRITE
                STOR    M[R5], R1

                MVI		R5, SPINNER_VALUE
                LOAD    R1, M[R5]
                INC     R1
                MVI		R5, 0003h
                AND     R1, R1, R5
                MVI		R5, SPINNER_VALUE
                STOR    M[R5], R1

                INC		R6
                LOAD	R2, M[R6]
                INC		R6
                LOAD	R1, M[R6]
                JMP		R7

                ; routine to draw strings

DrawString:     STOR	M[R6], R1
                DEC		R6
                STOR	M[R6], R2
                DEC		R6
                STOR	M[R6], R3
                DEC		R6
                MOV	    R5, R6
                MVI     R4, 5
                ADD     R5, R5, R4
                LOAD    R1, M[R5]
                MOV	    R5, R6
                MVI     R4, 4
                ADD     R5, R5, R4
                LOAD    R2, M[R5]

DrawStringLoop: LOAD    R3, M[R1]
                CMP     R3, R0
                BR.Z    DrawStringRet
                MVI		R5, TERM_CURSOR
                STOR    M[R5], R2
                MVI		R5, TERM_WRITE
                STOR    M[R5], R3
                INC     R1
                INC     R2
                BR      DrawStringLoop

DrawStringRet:  INC		R6
                LOAD	R3, M[R6]
                INC		R6
                LOAD	R2, M[R6]
                INC		R6
                LOAD	R1, M[R6]
                JMP		R7

                ; routine to draw binary counter

DrawCounter:    STOR	M[R6], R1
                DEC		R6
                STOR	M[R6], R2
                DEC		R6
                STOR	M[R6], R3
                DEC		R6
                STOR	M[R6], R4
                DEC		R6

                MVI		R5, COUNTER
                LOAD    R1, M[R5]
                MVI     R2, 16
                MVI     R3, 1402h

DrawCounterLoop:SHL     R1
                MVI     R4, '0'
                ADDC    R4, R4, R0
                MVI		R5, TERM_CURSOR
                STOR    M[R5], R3
                MVI		R5, TERM_WRITE
                STOR    M[R5], R4
                INC     R3
                DEC     R2
                BR.NZ   DrawCounterLoop

                MVI		R5, COUNTER
                LOAD	R4, M[R5]
                INC     R4
                STOR	M[R5], R4
                INC		R6
                LOAD	R4, M[R6]
                INC		R6
                LOAD	R3, M[R6]
                INC		R6
                LOAD	R2, M[R6]
                INC		R6
                LOAD	R1, M[R6]
                JMP		R7

;-------------- Main Program ---------------------------------------------------

Main:           MVI     R1, SP_ADDRESS
                MOV     R6, R1

                MVI     R1, Int15Routine
                MVI     R5, INT15_TIMER
                STOR    M[R5], R1

                MVI     R1, INT_MASK_VALUE
                MVI		R5, INT_MASK
                STOR    M[R5], R1
                ENI

                JAL     DrawLogo
                JAL     DrawSpinner
                JAL     DrawCounter
                JAL     StartTimer

                MVI		R5, STR_0
                STOR	M[R6], R5
                DEC		R6
                MVI		R5, 1002h
                STOR	M[R6], R5
                DEC		R6
                JAL     DrawString

                MVI		R5, STR_1
                STOR	M[R6], R5
                DEC		R6
                MVI		R5, 1202h
                STOR	M[R6], R5
                DEC		R6
                JAL     DrawString

TheEnd:         BR      TheEnd

                ORIG    7FF0h
                JMP     Int15Routine

;===============================================================================

`.trim();