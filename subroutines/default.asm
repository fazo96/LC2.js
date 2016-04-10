; LC2.js Default Subroutines

; Before this code there are the addresses linked to the Console Peripheral
; First instructions need to be jumps to the corresponding operation

;###################################

.ORIG xFF20
brnzp GETC_fn
brnzp OUT_fn
brnzp PUTS_fn
brnzp IN_fn
brnzp PUTSP_fn
brnzp HALT_fn

in_loc .FILL xFF16
out_loc .FILL xFF17
cmd_loc .FILL xFF18
stat_loc .FILL xFF19

;###################################

OUT_fn

;###################################

; Backup registers
ST r1, r1_bak

; Wait for Console ready
WT_OUT
LDI r1, stat_loc
and r1, r1, #1
brnz WT_OUT

; Prepare output data
STI r0, out_loc

; Send Command
and r1, r1, #0
add r1, r1, #2
STI r1, cmd_loc ; send command to console

; Reload registers and return
LD r1, r1_bak
RET

r1_bak .BLKW 1

;###################################

PUTS_fn

;###################################

; Backup registers
ST r0, r0_bak
ST r1, r1_bak
ST r7, r7_bak

; Load dest address to r1
and r1, r1, #0
add r1, r0, #0

; character addr is already in r0
; stop if character is 0
puts_loop
LDR r0, r1, #0
brz ret_puts
; print a character and advance pointer
OUT
add r1, r1, #1
brnzp puts_loop

; Reload registers and return
ret_puts

LD r0, r0_bak
LD r1, r1_bak
LD r7, r7_bak

RET

r0_bak .BLKW 1
r1_bak .BLKW 1

;###################################

HALT_fn

;###################################

and r0, r0, #0
STI r0, mac_on_loc
; MACHINE SHOULD NOW TURN OFF

mac_on_loc .FILL xFF15

RET

;###################################

.END
