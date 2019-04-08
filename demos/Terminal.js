fileManager.demos.Terminal = String.raw`

; I/O addresses (ff00h to ffffh)
TERM_WRITE      EQU     FFFEh
TERM_CURSOR     EQU     FFFCh
TERM_COLOR      EQU     FFFBh

                MVI 	R1, TERM_WRITE
                MVI 	R2, TERM_CURSOR
                MVI 	R3, TERM_COLOR


; ------------- Set new colors --
                MVI 	R4, 17ffh
                STOR 	M[R3], R4

; ------------- Set new line --
                MVI 	R4, 100h
                STOR 	M[R2], R4

                MVI 	R4, ' '
                STOR 	M[R1], R4

                MVI 	R4, ' '
                STOR 	M[R1], R4

                MVI 	R4, ' '
                STOR 	M[R1], R4

                MVI 	R4, ' '
                STOR 	M[R1], R4

                MVI 	R4, ' '
                STOR 	M[R1], R4

                MVI 	R4, ' '
                STOR 	M[R1], R4

                MVI 	R4, ' '
                STOR 	M[R1], R4

                MVI 	R4, ' '
                STOR 	M[R1], R4

                MVI 	R4, ' '
                STOR 	M[R1], R4

                MVI 	R4, ' '
                STOR 	M[R1], R4

                MVI 	R4, ' '
                STOR 	M[R1], R4

; ------------- Set new line --
                MVI 	R4, 200h
                STOR 	M[R2], R4

                MVI 	R4, ' '
                STOR 	M[R1], R4

                MVI 	R4, '█'
                STOR 	M[R1], R4

                MVI 	R4, ' '
                STOR 	M[R1], R4

                MVI 	R4, '█'
                STOR 	M[R1], R4

                MVI 	R4, '█'
                STOR 	M[R1], R4

                MVI 	R4, '█'
                STOR 	M[R1], R4

                MVI 	R4, ' '
                STOR 	M[R1], R4

                MVI 	R4, '█'
                STOR 	M[R1], R4

                MVI 	R4, '█'
                STOR 	M[R1], R4

                MVI 	R4, '█'
                STOR 	M[R1], R4

                MVI 	R4, ' '
                STOR 	M[R1], R4

; ------------- Set new line --
                MVI 	R4, 300h
                STOR 	M[R2], R4

                MVI 	R4, ' '
                STOR 	M[R1], R4

                MVI 	R4, '█'
                STOR 	M[R1], R4

                MVI 	R4, ' '
                STOR 	M[R1], R4

                MVI 	R4, '█'
                STOR 	M[R1], R4

                MVI 	R4, ' '
                STOR 	M[R1], R4

                MVI 	R4, ' '
                STOR 	M[R1], R4

                MVI 	R4, ' '
                STOR 	M[R1], R4

                MVI 	R4, ' '
                STOR 	M[R1], R4

                MVI 	R4, '█'
                STOR 	M[R1], R4

                MVI 	R4, ' '
                STOR 	M[R1], R4

                MVI 	R4, ' '
                STOR 	M[R1], R4

; ------------- Set new line --
                MVI 	R4, 400h
                STOR 	M[R2], R4

                MVI 	R4, ' '
                STOR 	M[R1], R4

                MVI 	R4, '█'
                STOR 	M[R1], R4

                MVI 	R4, ' '
                STOR 	M[R1], R4

                MVI 	R4, '█'
                STOR 	M[R1], R4

                MVI 	R4, '█'
                STOR 	M[R1], R4

                MVI 	R4, '█'
                STOR 	M[R1], R4

                MVI 	R4, ' '
                STOR 	M[R1], R4

                MVI 	R4, ' '
                STOR 	M[R1], R4

                MVI 	R4, '█'
                STOR 	M[R1], R4

                MVI 	R4, ' '
                STOR 	M[R1], R4

                MVI 	R4, ' '
                STOR 	M[R1], R4

; ------------- Set new line --
                MVI 	R4, 500h
                STOR 	M[R2], R4

                MVI 	R4, ' '
                STOR 	M[R1], R4

                MVI 	R4, '█'
                STOR 	M[R1], R4

                MVI 	R4, ' '
                STOR 	M[R1], R4

                MVI 	R4, ' '
                STOR 	M[R1], R4

                MVI 	R4, ' '
                STOR 	M[R1], R4

                MVI 	R4, '█'
                STOR 	M[R1], R4

                MVI 	R4, ' '
                STOR 	M[R1], R4

                MVI 	R4, ' '
                STOR 	M[R1], R4

                MVI 	R4, '█'
                STOR 	M[R1], R4

                MVI 	R4, ' '
                STOR 	M[R1], R4

                MVI 	R4, ' '
                STOR 	M[R1], R4

; ------------- Set new line --
                MVI 	R4, 600h
                STOR 	M[R2], R4

                MVI 	R4, ' '
                STOR 	M[R1], R4

                MVI 	R4, '█'
                STOR 	M[R1], R4

                MVI 	R4, ' '
                STOR 	M[R1], R4

                MVI 	R4, '█'
                STOR 	M[R1], R4

                MVI 	R4, '█'
                STOR 	M[R1], R4

                MVI 	R4, '█'
                STOR 	M[R1], R4

                MVI 	R4, ' '
                STOR 	M[R1], R4

                MVI 	R4, ' '
                STOR 	M[R1], R4

                MVI 	R4, '█'
                STOR 	M[R1], R4

                MVI 	R4, ' '
                STOR 	M[R1], R4

                MVI 	R4, ' '
                STOR 	M[R1], R4

; ------------- Set new line --
                MVI 	R4, 700h
                STOR 	M[R2], R4

                MVI 	R4, ' '
                STOR 	M[R1], R4

                MVI 	R4, ' '
                STOR 	M[R1], R4

                MVI 	R4, ' '
                STOR 	M[R1], R4

                MVI 	R4, ' '
                STOR 	M[R1], R4

                MVI 	R4, ' '
                STOR 	M[R1], R4

                MVI 	R4, ' '
                STOR 	M[R1], R4

                MVI 	R4, ' '
                STOR 	M[R1], R4

                MVI 	R4, ' '
                STOR 	M[R1], R4

                MVI 	R4, ' '
                STOR 	M[R1], R4

                MVI 	R4, ' '
                STOR 	M[R1], R4

                MVI 	R4, ' '
                STOR 	M[R1], R4

; ------------- Set new line --
                MVI 	R4, a00h
                STOR 	M[R2], R4

                MVI 	R4, 'I'
                STOR 	M[R1], R4

                MVI 	R4, 'n'
                STOR 	M[R1], R4

                MVI 	R4, 's'
                STOR 	M[R1], R4

                MVI 	R4, 't'
                STOR 	M[R1], R4

                MVI 	R4, 'i'
                STOR 	M[R1], R4

                MVI 	R4, 't'
                STOR 	M[R1], R4

                MVI 	R4, 'u'
                STOR 	M[R1], R4

                MVI 	R4, 't'
                STOR 	M[R1], R4

                MVI 	R4, 'o'
                STOR 	M[R1], R4

                MVI 	R4, ' '
                STOR 	M[R1], R4

                MVI 	R4, 'S'
                STOR 	M[R1], R4

                MVI 	R4, 'u'
                STOR 	M[R1], R4

                MVI 	R4, 'p'
                STOR 	M[R1], R4

                MVI 	R4, 'e'
                STOR 	M[R1], R4

                MVI 	R4, 'r'
                STOR 	M[R1], R4

                MVI 	R4, 'i'
                STOR 	M[R1], R4

                MVI 	R4, 'o'
                STOR 	M[R1], R4

                MVI 	R4, 'r'
                STOR 	M[R1], R4

                MVI 	R4, ' '
                STOR 	M[R1], R4

                MVI 	R4, 'T'
                STOR 	M[R1], R4

                MVI 	R4, 'é'
                STOR 	M[R1], R4

                MVI 	R4, 'c'
                STOR 	M[R1], R4

                MVI 	R4, 'n'
                STOR 	M[R1], R4

                MVI 	R4, 'i'
                STOR 	M[R1], R4

                MVI 	R4, 'c'
                STOR 	M[R1], R4

                MVI 	R4, 'o'
                STOR 	M[R1], R4

; ------------- Set new colors --
                MVI 	R4, e0h
                STOR 	M[R3], R4

; ------------- Set new line --
                MVI 	R4, e00h
                STOR 	M[R2], R4

                MVI 	R4, 'P'
                STOR 	M[R1], R4

                MVI 	R4, '4'
                STOR 	M[R1], R4

; ------------- Set new line --
                MVI 	R4, 1000h
                STOR 	M[R2], R4

                MVI 	R4, 'P'
                STOR 	M[R1], R4

                MVI 	R4, 'e'
                STOR 	M[R1], R4

                MVI 	R4, 'q'
                STOR 	M[R1], R4

                MVI 	R4, 'u'
                STOR 	M[R1], R4

                MVI 	R4, 'e'
                STOR 	M[R1], R4

                MVI 	R4, 'n'
                STOR 	M[R1], R4

                MVI 	R4, 'o'
                STOR 	M[R1], R4

                MVI 	R4, ' '
                STOR 	M[R1], R4

                MVI 	R4, 'P'
                STOR 	M[R1], R4

                MVI 	R4, 'r'
                STOR 	M[R1], R4

                MVI 	R4, 'o'
                STOR 	M[R1], R4

                MVI 	R4, 'c'
                STOR 	M[R1], R4

                MVI 	R4, 'e'
                STOR 	M[R1], R4

                MVI 	R4, 's'
                STOR 	M[R1], R4

                MVI 	R4, 's'
                STOR 	M[R1], R4

                MVI 	R4, 'a'
                STOR 	M[R1], R4

                MVI 	R4, 'd'
                STOR 	M[R1], R4

                MVI 	R4, 'o'
                STOR 	M[R1], R4

                MVI 	R4, 'r'
                STOR 	M[R1], R4

                MVI 	R4, ' '
                STOR 	M[R1], R4

                MVI 	R4, 'P'
                STOR 	M[R1], R4

                MVI 	R4, 'e'
                STOR 	M[R1], R4

                MVI 	R4, 'd'
                STOR 	M[R1], R4

                MVI 	R4, 'a'
                STOR 	M[R1], R4

                MVI 	R4, 'g'
                STOR 	M[R1], R4

                MVI 	R4, 'ó'
                STOR 	M[R1], R4

                MVI 	R4, 'g'
                STOR 	M[R1], R4

                MVI 	R4, 'i'
                STOR 	M[R1], R4

                MVI 	R4, 'c'
                STOR 	M[R1], R4

                MVI 	R4, 'o'
                STOR 	M[R1], R4

                MVI 	R4, ' '
                STOR 	M[R1], R4

                MVI 	R4, 'c'
                STOR 	M[R1], R4

                MVI 	R4, 'o'
                STOR 	M[R1], R4

                MVI 	R4, 'm'
                STOR 	M[R1], R4

                MVI 	R4, ' '
                STOR 	M[R1], R4

                MVI 	R4, 'P'
                STOR 	M[R1], R4

                MVI 	R4, 'i'
                STOR 	M[R1], R4

                MVI 	R4, 'p'
                STOR 	M[R1], R4

                MVI 	R4, 'e'
                STOR 	M[R1], R4

                MVI 	R4, 'l'
                STOR 	M[R1], R4

                MVI 	R4, 'i'
                STOR 	M[R1], R4

                MVI 	R4, 'n'
                STOR 	M[R1], R4

                MVI 	R4, 'e'
                STOR 	M[R1], R4
                
Stop:           BR 		Stop
                
`.trim();