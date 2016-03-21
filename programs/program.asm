.ORIG x3000
TRAP x23            ; Read Character (with prompt) into r0
ADD   r0, r0, r0    ; double the number
TRAP  x21           ; print result
TRAP  x25           ; halt
.END
