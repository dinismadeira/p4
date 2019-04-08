fileManager.demos['G-Sensor'] = String.raw`

; I/O addresses
LEDS            EQU     FFF8h
DISP7SEG_3      EQU     FFF3h
DISP7SEG_2      EQU     FFF2h
DISP7SEG_1      EQU     FFF1h
DISP7SEG_0      EQU     FFF0h
GSENSOR_X       EQU     FFEBh

                MVI     R1, GSENSOR_X
                MVI     R2, LEDS

                ; Read X-Axis acceleration
Loop:           LOAD    R3, M[R1]

                ; Print to display
                MOV     R5, R3
                MVI     R4, DISP7SEG_0
                STOR    M[R4], R5
                SHR     R5
                SHR     R5
                SHR     R5
                SHR     R5
                MVI     R4, DISP7SEG_1
                STOR    M[R4], R5
                SHR     R5
                SHR     R5
                SHR     R5
                SHR     R5
                MVI     R4, DISP7SEG_2
                STOR    M[R4], R5
                SHR     R5
                SHR     R5
                SHR     R5
                SHR     R5
                MVI     R4, DISP7SEG_3
                STOR    M[R4], R5

                ; Compute LEDs value
                MVI     R5, 1100000000b
                MVI     R4, 00C0h
                CMP     R3, R4
                BR.P    UpdateLeds
                SHR     R5
                MVI     R4, 0060h
                CMP     R3, R4
                BR.P    UpdateLeds
                SHR     R5
                MVI     R4, 0030h
                CMP     R3, R4
                BR.P    UpdateLeds
                SHR     R5
                MVI     R4, 0018h
                CMP     R3, R4
                BR.P    UpdateLeds
                SHR     R5
                MVI     R4, -0018h
                CMP     R3, R4
                BR.P    UpdateLeds
                SHR     R5
                MVI     R4, -0030h
                CMP     R3, R4
                BR.P    UpdateLeds
                SHR     R5
                MVI     R4, -0060h
                CMP     R3, R4
                BR.P    UpdateLeds
                SHR     R5
                MVI     R4, -00C0h
                CMP     R3, R4
                BR.P    UpdateLeds
                SHR     R5
                ; Update LEDs
UpdateLeds:     STOR    M[R2], R5
                BR      Loop

`.trim();