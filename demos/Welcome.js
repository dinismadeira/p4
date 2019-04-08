fileManager.demos.Welcome = String.raw`

; Write some assembly code here.
; Then click 'Assemble and Run' to run it on the P3 simulator.
; Comments start with ';'.

; For more information check 'About P3JS'.



; ------------- ;
; Try the Demos ----->  ----->  ----->  ----->  ----->  ----->  ----->  ----->
; ------------- ;



; This is a simple program that counts to ffffh and shows the result in binary
; on the LEDS.

; Click 'Assemble and Run' then check the tab 'Input/Output'.


LEDS            EQU     fff8h           ; constant with the I/O address to
                                        ; control the LEDS

                ORIG    0000h           ; indication that we want to put the
                                        ; code at position 0000h

                ; the CPU starts running code at the address 0000h
                ; the first instruction is to jump to the Main code

                JMP     Main            ; jump to the Main code

                ; this next code is a simple delay routine
                ; uses R3 to count to 0000h then returns, this is not the ideal
                ; way to make delays, you should use the timer and interrupts

Delay:          MVI     R3, f000h       ; initialize R3 with f000h
.Inc:           INC     R3              ; increment R3
                BR.NZ   .Inc            ; if R3 is not 0000h, jump to DelayInc
                JMP     R7              ; else return from the routine

                ; the Main code starts here

Main:           MOV     R1, R0          ; initialize R1 with 0 (R0 is always 0)
                MVI     R2, LEDS        ; initialize R2 with LEDS
Loop:           INC     R1              ; increment R1
                STOR    M[R2], R1       ; write the value of R1 to the LEDS
                JAL     Delay           ; call the Delay routine
                BR      Loop            ; branch jump back to Loop

`.trim();