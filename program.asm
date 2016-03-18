; This is an example program used to test the LC2.js emulator and assembler
; Use the included cli.js CLI or globally install this package and use the lc2
; executable to assemble and run this program

; This program is just some random instructions for debugging
; purposes. In the future, simple but actually purposeful programs will be
; included with this emulator

add r0, r0, #4
add r1, r1, #2
add r2, r0, r1
st r2, #4
