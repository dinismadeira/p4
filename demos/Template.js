fileManager.demos.Template = String.raw`

;===============================================================================
;
;       Empty template for new programs (replace with Title)
;
;       Year Author <Email>
;
;       Description
;
;===============================================================================

; I/O addresses (ff00h to ffffh)
TERM_READ       EQU     FFFFh
TERM_WRITE      EQU     FFFEh
TERM_STATE      EQU     FFFDh
TERM_CURSOR     EQU     FFFCh
TERM_COLOR      EQU     FFFBh
INT_MASK        EQU     FFFAh
SWITCHES        EQU     FFF9h
LEDS            EQU     FFF8h
TIMER_CONTROL   EQU     FFF7h
TIMER_VALUE     EQU     FFF6h
LCD_WRITE       EQU     FFF5h
LCD_CONTROL     EQU     FFF4h
DISP7SEG_3      EQU     FFF3h
DISP7SEG_2      EQU     FFF2h
DISP7SEG_1      EQU     FFF1h
DISP7SEG_0      EQU     FFF0h
DISP7SEG_5      EQU     FFEFh
DISP7SEG_4      EQU     FFEEh
GSENSOR_Z       EQU     FFEDh
GSENSOR_Y       EQU     FFECh
GSENSOR_X       EQU     FFEBh

; Other constants
STR_END         EQU     0000h
SP_ADDRESS      EQU     fdffh
INT_MASK_VALUE  EQU     FFFFh

;============== Data Region (starting at address 8000h) ========================

                ORIG    8000h
                ; allocate variables and data here (WORD, STR and TAB)

;============== Code Region (starting at address 0000h) ========================

                ORIG    0000h
                JMP     Main                    ; jump to main

;-------------- Routines -------------------------------------------------------

                ; put routines here

;-------------- Main Program ---------------------------------------------------

Main:
                MVI     R6, SP_ADDRESS          ; set stack pointer
                MVI     R1, INT_MASK
                MVI     R2, INT_MASK_VALUE
                STOR    M[R1], R2               ; set interrupt mask
                ENI                             ; enable interrupts
                
                ; start code here
                
Stop:           BR      Stop

;-------------- Interrupts -----------------------------------------------------

                ; Button 0
                ORIG    7F00h
                RTI

                ; Button 1
                ORIG    7F10h
                RTI

                ; Button Right
                ORIG    7F20h
                RTI

                ; Button Up
                ORIG    7F30h
                RTI

                ; Button Down
                ORIG    7F40h
                RTI

                ; Button Left
                ORIG    7F50h
                RTI

                ; Button Select
                ORIG    7F60h
                RTI

                ; Keyboard
                ORIG    7F70h
                RTI

                ; Timer
                ORIG    7FF0h
                RTI
                
;===============================================================================
                
`.trim();