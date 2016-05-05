/*
    LC2.js
    Copyright (C) 2016 Enrico Fasoli (fazo96)

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

// # LC2.js
// LC2 emulator in javascript
// ## Console Peripheral
// this is the default implementation of the LC2 Console peripheral

var subroutines = `
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
`

// Creates a new Console. Of course it needs a reference to a `lc2` CPU,
// the `position` in memory that will map to the Console registers, and wether
// or not debug mode might be activated.
function Console (lc2, position, debug) {
  this.lc2 = lc2
  this.position = position
  this.debug = debug || false
  this.name = 'Console'
  this.lastReadKey = 0
  this.inputBuffer = 0
  this.outputKey = 0
  this.displayReady = 1
}

// Standard `status` method of a peripheral. It returns the peripheral status
// as a LC-2 Word.
Console.prototype.status = function () {
  // In this peripheral's specific case, the lowest bit will tell the CPU
  // wether the display is ready for outputting, and the second lowest bit will
  // tell wether the input key in the buffer has already been read.
  var s = (this.lastReadKey !== 0 ? 2 : 0) + (this.displayReady !== 0 ? 1 : 0)
  if (this.debug) console.log('Console Peripheral Status:', s)
  return s
}

// Send a command to the Console
Console.prototype.command = function (cmd) {
  if (cmd & 1) {
    // `1` will inform the Console that the input key has been read.
    this.lastReadKey = 1
  }
  if (cmd & 2) {
    // `2` will tell the Console to write the character in the output buffer.
    this.displayReady = 0
    this.output(String.fromCharCode(this.outputKey))
    this.displayReady = 1
  }
}

// The default implementation of the Output command.
Console.prototype.output = function () {
  if (process && process.stdout && process.stdout.write) process.stdout.write(String.fromCharCode(this.outputKey))
  else console.log((this.debug ? 'OUTPUT(CHAR): ' : '') + String.fromCharCode(this.outputKey))
}

// This function is used by the User Interface to inform the Console that a new
// input value has arrived.
Console.prototype.input = function (value) {
  if (typeof value === 'string') this.inputBuffer = value.charCodeAt(0)
  else this.inputBuffer = parseInt(value, 10)
  this.lastReadKey = 0
  if (this.debug) console.log('Inputting', value, 'into console: saving it as', this.inputBuffer)
}

// Called by the CPU before a program starts to load subroutines into the memory.
// In this case, the Console compiles and loads the standard
// `GETC`, `IN`, `OUT`, `PUTS` and `HALT` subroutines, so that they may be used
// via `TRAP` calls to the standard addresses as defined in the LC-2 User Manual.
Console.prototype.loadSubroutines = function () {
  if (this.lc2.debug) console.log('Compiling Console subroutines...')
  var Assembler = require('../lib/assembler.js')
  var a = new Assembler(this.lc2.debug)
  var assembled = a.assemble(subroutines.toString()) // subroutines is a "template"
  var c = a.toBinary(assembled)
  if (this.lc2.debug) console.log('Loading Console subroutines...')
  this.lc2.loadCode(c)
  var s = parseInt('20', 16)
  for (var i = 0; i < 6; i++) {
    this.lc2.memory[s + i] = assembled[0] + i
    if (this.lc2.debug) console.log('Loading Subroutine at', this.lc2.memory[s + i].toString(16), 'into', (s + i).toString(16))
  }
}

// Used to read the four peripheral registers.
Console.prototype.mem = function (i) {
  var ret = 0
  if (i === 0) ret = this.inputBuffer
  else if (i === 1) ret = this.outputKey
  else if (i === 3) ret = this.status()
  return ret
}

// Used to write data into the output buffer.
Console.prototype.write = function (value) {
  if (typeof value === 'string') value = value.charCodeAt(0)
  this.outputKey = value
}

module.exports = Console
