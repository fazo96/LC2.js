; This is an example program used to test the LC2.js emulator and assembler
; Use the included cli.js CLI or globally install this package and use the lc2
; executable to assemble and run this program

; This program takes a number and writes it back doubled.
; In the future more serious examples will be bundled with the emulator

trap  x23           ; Read Character (with prompt) into r0
add   r0, r0, r0    ; double the number
trap  x21           ; print result
trap  x25           ; halt
