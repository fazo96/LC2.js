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

var common
if (require !== undefined) {
  common = require('./common.js')
} else common = window.LC2Common

var Assembler = function (debug) {
  this.symbolTable = {}
  this.debug = debug || false
}

// Takes a program in string form and returns a program in binary form
// Steps: string --> Object --> Binary
Assembler.prototype.assemble = function (str) {
  this.symbolTable = {}
  var arr = str.split('\n')
  // --- Preprocessing
  // remove comments, save istruction row number in source file
  .map((l, i) => {
    return {
      row: i,
      string: l.split(';', 1)[0].trim()
    }
  })
  // remove empty lines
  .filter(l => l.string.length > 0)
  // TODO: build symbol table now

  // --- Processing: convert to object form
  .map(this.parseInstruction, this)

  // --- Postprocessing: convert to binary form (TODO)
  .map(this.buildInstruction, this)
  return Uint16Array.from(arr)
}

// Takes instruction in string form and returns instruction in object form
Assembler.prototype.parseInstruction = function (obj) {
  var x = (typeof obj === 'string' ? obj : obj.string)
  // Instruction format is "label: opcode arg1[, arg2[, arg3]]"
  if (x.indexOf(':') > 0) { // label is present
    var label = x.split(':', 1)[0]
    x = x.substring(label.length + 1).trim()
  }
  var opname = x.split(' ')[0].toUpperCase()
  var parts = x.substring(opname.length).split(',')
  var opcode = opname.indexOf('br') === 0 ? 0 : common.opnames.indexOf(opname.toLowerCase())
  var args = parts.map(l => l.trim()).map(this.parseArgument, this)
  var ret = { row: obj.row, label: label, opname: opname, opcode: opcode, args: args, string: x }
  if (this.debug) console.log(x + ' -->\n', ret)
  return ret
}

// Takes instruction in object form and returns instruction in binary
Assembler.prototype.buildInstruction = function (x) {
  var res = x.opcode << 12
  var dst, src, i6, mem
  if (x.opcode === 0) { // BR
    var nzp = 0
    if (x.opname.indexOf('n') > 0) nzp = nzp | 4
    if (x.opname.indexOf('z') > 0) nzp = nzp | 2
    if (x.opname.indexOf('p') > 0) nzp = nzp | 1
    var arg = common.pgoffset9(this.buildArgument(x.args[0]))
    res = res | arg | (nzp << 9)
  } else if (x.opcode === 1 || x.opcode === 5) { // ADD, AND
    dst = this.buildArgument(x.args[0])
    src = this.buildArgument(x.args[1])
    if (x.args[2].register !== undefined) { // Use register
      res = res | x.args[2].register | (src << 7) | (dst << 9)
    } else { // Use literal
      res = res | x.args[2].literal | (src << 7) | (dst << 9) | 32
    }
  } else if (x.opcode >= 2 && x.opcode <= 4) { // LD, ST, JSR
    dst = this.buildArgument(x.args[0])
    src = common.pgoffset9(this.buildArgument(x.args[1]))
    res = res | (dst << 9) | src
  } else if (x.opcode === 6 || x.opcode === 7) { // LDR, STR
    dst = this.buildArgument(x.args[0])
    src = this.buildArgument(x.args[1])
    i6 = common.index6(this.buildArgument(x.args[2]))
    res = res | i6 | (src << 7) | (dst << 9)
  } else if (x.opcode === 8) { // RTI
    // Nothing to do
  } else if (x.opcode === 9) { // NOT
    res = res | 127 | (src << 7) | (dst << 9)
  } else if (x.opcode === 10 || x.opcode === 11) { // LDI, STI
    dst = this.buildArgument(x.args[0])
    mem = this.buildArgument(x.args[1])
    res = res | (dst << 9) | mem
  } else if (x.opcode === 12) { // JSRR
    src = this.buildArgument(x.args[0])
    i6 = this.buildArgument(x.args[1])
    res = res | (src << 7) | i6
  } else if (x.opcode === 13) { // RET
    res = res
  } else if (x.opcode === 14) { // LEA
    var pg9 = common.pgoffset9(this.buildArgument(x.args[1]))
    dst = this.buildArgument(x.args[0])
    res = res | (dst << 9) | pg9
  } else if (x.opcode === 15) { // TRAP
    var tv8 = this.buildArgument(x.args[0])
    res = res | common.trapvect8(tv8)
  }
  if (this.debug) console.log('Assembling "' + x.string + '" to ' + common.pad(res.toString(2), 16))
  return res
}

Assembler.prototype.buildArgument = function (x) {
  return x.literal || x.register || x.variable || 0
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

if (module && module.exports) module.exports = Assembler