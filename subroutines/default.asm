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
ST r1, or1_bak

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
LD r1, or1_bak
RET

or1_bak .BLKW 1

;###################################

PUTS_fn

;###################################

; Backup registers
ST r0, pr0_bak
ST r1, pr1_bak
ST r7, pr7_bak

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

LD r0, pr0_bak
LD r1, pr1_bak
LD r7, pr7_bak

RET

pr0_bak .BLKW 1
pr1_bak .BLKW 1
pr7_bak .BLKW 1

;###################################

HALT_fn

;###################################

and r7, r7, #0
STI r7, mac_on_loc
; MACHINE SHOULD NOW TURN OFF

mac_on_loc .FILL xFF15

RET

;###################################

GETC_fn

;###################################

ST r1, gr1_bak ; Backup r1
LDI r1, stat_loc
and r1, r1, #2
brp getc_fl ; if there are no chars, put zero in r0 and return

LDI r0, in_loc ; Read last character

and r1, r1, #0
add r1, r1, #1
STI r1, cmd_loc ; send "I have read the character" to Console

getc_rt
LD r1, gr1_bak ; restore r1
RET

getc_fl and r0, r0, #0
brnzp getc_rt

gr1_bak .BLKW 1

;###################################

IN_fn

;###################################

; print the prompt
ST r7, ir7_bak
LEA r0, prompt
PUTS

; wait for user input then return
iloop GETC
OUT
ADD r0, r0, #0
brz iloop

LD r7, ir7_bak
RET

ir7_bak .BLKW 1
prompt .STRINGZ "Input a character > "

;###################################

.END
