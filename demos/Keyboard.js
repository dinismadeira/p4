fileManager.demos['Keyboard'] = String.raw`

; Endereços de E/S
TERM_READ       EQU     FFFFh
TERM_WRITE      EQU     FFFEh
TERM_STATE      EQU     FFFDh
LEDS            EQU     FFF8h
LCD_WRITE       EQU     FFF5h
DISP7SEG_3      EQU     FFF3h
DISP7SEG_2      EQU     FFF2h
DISP7SEG_1      EQU     FFF1h
DISP7SEG_0      EQU     FFF0h

                ; Limpar Terminal
                MVI     R1, TERM_WRITE
                MVI     R2, 3600
ClearLoop:      STOR    M[R1], R0
                DEC     R2
                BR.NZ   ClearLoop

                ; Ler Estado
Loop:           MVI     R1, TERM_STATE
                LOAD    R2, M[R1]
                CMP     R2, R0
                BR.Z    Loop

                ; Obter Tecla Premida
Read:           MVI     R1, TERM_READ
                LOAD    R2, M[R1]

                ; Mostrar no Terminal
                MVI     R1, TERM_WRITE
                STOR    M[R1], R2

                ; Mostrar nos LEDs
                MVI     R1, LEDS
                STOR    M[R1], R2

                ; Mostrar no Ecrã LCD
                MVI     R1, LCD_WRITE
                STOR    M[R1], R2

                ; Mostrar nos Mostradores
                MVI     R1, DISP7SEG_0
                STOR    M[R1], R2
                SHR     R2
                SHR     R2
                SHR     R2
                SHR     R2
                MVI     R1, DISP7SEG_1
                STOR    M[R1], R2
                SHR     R2
                SHR     R2
                SHR     R2
                SHR     R2
                MVI     R1, DISP7SEG_2
                STOR    M[R1], R2
                SHR     R2
                SHR     R2
                SHR     R2
                SHR     R2
                MVI     R1, DISP7SEG_3
                STOR    M[R1], R2

                BR      Loop

`.trim();