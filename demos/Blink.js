fileManager.demos.Blink = String.raw`

; I/O addresses (ff00h to ffffh)
LEDS			EQU		FFF8h
LCD_WRITE       EQU     FFF5h
LCD_CONTROL     EQU     FFF4h

TEXT			STR		'Blink Demo'

				BR		Main

Delay:     		MVI 	R5, ffffh
                MVI 	R6, ah
.Loop:      	DEC 	R5
				BR.NZ 	.Loop 
                DEC 	R6
                BR.NZ 	.Loop
                JMP		R7

Main:           MVI 	R1, LEDS
                MVI		R2,	LCD_WRITE
                MVI		R3,	LCD_CONTROL
                
				MVI		R4, 8003h
                STOR	M[R3], R4		; set cursor position
				MVI		R4, TEXT
                MVI		R5, 000ah		; text length
PrintText:      LOAD	R6, M[R4]
                STOR	M[R2], R6
                INC		R4
                CMP		R4, R5
                BR.NZ	PrintText

Loop:           MVI 	R4, ffffh
                STOR 	M[R1], R4		; turn on LEDS
                MVI 	R4, 8003h
                STOR 	M[R3], R4		; turn on LCD
                JAL		Delay

				STOR	M[R1], R0 		; turn off LEDS
                STOR 	M[R3], R0		; turn off LCD
                JAL		Delay
                BR		Loop





`.trim();