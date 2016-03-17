#!/usr/bin/env node
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

// LC2.js - LC2 emulator in javascript
// Run Program - this part of the emulator is a script used to test the emulator
// since no user interface has been made yet

// DISCLAIMER: this script is really bare right now. It will be improved

console.log('LC2.js Run Program test script')
var LC2 = require('./LC2.js')
var Assembler = require('./assembler.js')

// Read program.asm
var fs = require('fs')
var program = fs.readFileSync('./program.asm').toString()
// Prepare LC2
var assembler = new Assembler()
// Assemble source
var binary = assembler.assemble(program)
var cpu = new LC2()
// Load program to LC2
cpu.loadProgram(binary)

// Used to convert to binary string with padding
function toBinary (x) {
  var s = x.toString(2)
  while (s.length < 16) s = '0' + s
  return s
}

// Dump LC2 memory where the binary was copied to console
console.log('\nDumping Memory')
console.log(Array.from(cpu.memory).slice(0, binary.length).map(toBinary))
// Run program
console.log('\nRunning program...')
cpu.run()
// Dump registers and CC to console
console.log('\nDone! Dumping GPRs')
console.log(cpu.gpr)
console.log('Condition codes:', cpu.cc.toString(2))
console.log('\nMemory Dump (stops when encountering a cell containing a 0)')
console.log('Format is ADDR(INT) - VAL(INT) VAL(HEX) VAL(BIN)\n')
var i = 0
do {
  console.log(i + ' - ' + cpu.memory[i] + ' x' + cpu.memory[i].toString(16) + ' b' + toBinary(cpu.memory[i]))
  i++
} while (cpu.memory[i] !== 0)
console.log('\nDone, exiting')
