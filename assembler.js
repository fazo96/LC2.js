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
// Assembler - this part of the emulator compiles LC2 Assembler into LC2 binary

'use strict'

var Assembler = function () {
  this.symbolTable = {}
}

// Takes a program in string form and returns a program in binary form
// Steps: string --> Object --> Binary
Assembler.prototype.assemble = function (str) {
  this.symbolTable = {}
  return str.split('\n')
  // --- Preprocessing
  // remove comments, save istruction position in source file
  .map((l, i) => {
    return {
      position: i,
      string: l.split(';', 1)[0].trim()
    }
  })
  // remove empty lines
  .filter(l => l.string.length > 0)
  // TODO: build symbol table now

  // --- Processing: convert to object form
  .map(this.parseInstruction)

  // --- Postprocessing: convert to binary form (TODO)
  .map(this.buildInstruction)
}

Assembler.opnames = ['br', 'add', 'ld', 'st', 'jsr', 'and', 'ldr', 'str', 'rti', 'not', 'ldi', 'sti', 'jsrr', 'ret', 'lea', 'trap']

// Takes instruction in string form and returns instruction in object form
Assembler.prototype.parseInstruction = function (obj) {
  var x = (typeof obj === 'string' ? obj : obj.string)
  // Instruction format is "label: opcode arg1[, arg2[, arg3]]"
  if (x.indexOf(':') > 0) { // label is present
    var label = x.split(':', 1)[0]
  }
  x = x.substring(label.length).trim()
  var parts = x.split(',')
  var opname = parts[0].trim()
  var opcode = opname.indexOf('br') === 0 ? 0 : Assembler.opnames.indexOf(opname)
  var args = parts.slice(1).map(l => l.trim()).map(this.parseArgument)
  return { label: label, opname: opname, opcode: opcode, args: args }
}

Assembler.pgoffset9 = function (data) {
  return data & 511
}

Assembler.index6 = function (data) {
  return data & 63
}

Assembler.trapvect8 = function (data) {
  return data & 255
}

// Takes instruction in object form and returns instruction in binary
Assembler.prototype.buildInstruction = function (x) {
  var res = x.opcode << 13
  if (x.opcode === 0) { // BR
    var nzp = 0
    if (x.opname.indexOf('n') > 0) nzp = nzp | 4
    if (x.opname.indexOf('z') > 0) nzp = nzp | 2
    if (x.opname.indexOf('p') > 0) nzp = nzp | 1
    var arg = Assembler.pgoffset9(this.buildArgument(x.args[0]))
    return res | arg | (nzp << 9)
  } else if (x.opcode === 1) { // ADD

  } else if (x.opcode >= 2 && x.opcode <= 4) { // LD, ST, JSR
    var reg = this.buildArgument(x.args[0])
    var frm = Assembler.pgoffset9(this.buildArgument(x.args[1]))
    return res | frm | (reg << 9)
  } else if (x.opcode === 5) { // AND

  } else if (x.opcode === 6 || x.opcode === 7) { // LDR, STR
    var dst = this.buildArgument(x.args[0])
    var src = this.buildArgument(x.args[1])
    var i6 = Assembler.index6(this.buildArgument(x.args[2]))
    return res | i6 | (src << 6) | (dst << 9)
  } else if (x.opcode === 8) { // RTI
    return res
  } else if (x.opcode === 9) { // NOT
    var dst = this.buildArgument(x.args[0])
    var src = this.buildArgument(x.args[1])
    return res | 127 | (src << 6) | (dst << 9)
  } else if (x.opcode === 10 || x.opcode === 11) { // LDI, STI
    var reg = this.buildArgument(x.args[0])
    var mem = this.buildArgument(x.args[1])
    return res | (reg << 9) | mem
  } else if (x.opcode === 12) { // JSRR
    var src = this.buildArgument(x.args[0])
    var i6 = this.buildArgument(x.args[1])
    return res | (src << 6) | i6
  } else if (x.opcode === 13) { // RET
    return res
  } else if (x.opcode === 14) { // LEA
    var pg9 = Assembler.pgoffset9(this.buildArgument(x.args[1]))
    var dst = this.buildArgument(x.args[0])
    return res | (dst << 9) | pg9
  } else if (x.opcode === 15) { // TRAP
    var tv8 = this.buildArgument(x.args[0])
    return res | Assembler.trapvect8(tv8)
  }
}

Assembler.prototype.buildArgument = function (x) {

}

// Takes argument in string form and returns argument in object form
Assembler.prototype.parseArgument = function (arg) {
  arg = arg.toLowerCase()
  if (!isNaN(arg)) return { literal: parseInt(arg, 10) }
  else if (arg.indexOf('x') === 0) return { literal: parseInt(arg.slice(1), 16) }
  else if (arg.indexOf('#') === 0) return { literal: parseInt(arg.slice(1), 10) }
  else if (/^r[0-7]$/i.test(arg)) return { register: parseInt(arg.slice(1), 10) }
  else return { variable: this.symbolTable[arg] }
}
