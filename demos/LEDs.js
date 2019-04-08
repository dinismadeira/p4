fileManager.demos.LEDs = String.raw`

; I/O addresses (ff00h to ffffh)
SWITCHES		EQU		FFF9h
LEDS			EQU		FFF8h
DISP7SEG_2      EQU     FFF2h
DISP7SEG_1      EQU     FFF1h
DISP7SEG_0      EQU     FFF0h

                MVI		R1, SWITCHES
                MVI 	R2, LEDS
                MVI		R3, DISP7SEG_0
                MVI		R4, DISP7SEG_1
                MVI		R5, DISP7SEG_2
                
Main:			LOAD 	R6, M[R1] 		; carregar valor dos switches
                STOR 	M[R2], R6 		; mostrar valor nos leds
                STOR	M[R3], R6		; mostrar valor no mostrador 1
                SHR		R6
                SHR		R6
                SHR		R6
                SHR		R6
                STOR	M[R4], R6		; mostrar valor no mostrador 2
                SHR		R6
                SHR		R6
                SHR		R6
                SHR		R6
                STOR	M[R5], R6		; mostrar valor no mostrador 3
                BR		Main

`.trim();