fileManager.demos.LCD = String.raw`

; I/O addresses (ff00h to ffffh)
LCD_WRITE       EQU     fff5h
LCD_CONTROL     EQU     fff4h

LINE1        	STR     '------ P4 ------'
LINE2         	STR     '                Pequeno Processador Pedagogico com Pipeline                '
                ; Print First Line
                MVI 	R1, LINE1		; Address of the char being printed
                MVI 	R2, 16			; Number of chars to print
L1: 			LOAD 	R3, M[R1]		; Retrieve char from memory
                MVI		R4,	LCD_WRITE
                STOR 	M[R4], R3		; Print char in the LCD
                INC		R1				; Address of the next char
                CMP 	R1, R2			; Check if all chars were printed
                BR.NZ 	L1				; Print next char

                ; Print Second Line
L2A:            MVI		R1, 0			; Text Shift
L2B:            MVI		R2, LINE2		; Address of the char being printed
                ADD		R2, R1, R2		; Add Shift
                MVI 	R3, 16			; Number of chars to print
L2C:            LOAD	R4, M[R2]		; Retrieve char from memory
                MVI		R5,	LCD_WRITE
                STOR	M[R5], R4		; Print char in the LCD
                INC		R2				; Address of the next char
                DEC		R3				; Decrement the number of chars to print
                BR.NZ	L2C				; Print next char
                JAL		Delay
                
                ; Reposition cursor in the second line
                MVI		R4, 8010h
                MVI		R5, LCD_CONTROL
                STOR	M[R5], R4		
                
                ; Shift Text
                INC		R1

				MVI		R4, 59			; Max Shift
                CMP		R1, R4			; Compare current shift to max shift
                BR.NZ	L2B				; Print Second Line
                BR		L2A				; Reset Shift and Print Second Line
                
Delay:     		MVI 	R5, ffffh
                MVI 	R6, 0100h
.Loop:          DEC 	R5
				BR.NZ 	.Loop
                DEC 	R6
                BR.NZ 	.Loop
                JMP		R7

`.trim();