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
  this.rows = arr.length
  if (this.debug) console.log('[DEBUG] Parsing ' + this.rows + ' lines')
  // --- Preprocessing
  // remove comments, save istruction row number in source file
  arr = arr.map((l, i) => {
    return {
      row: i + 1,
      string: l.split(';', 1)[0].trim()
    }
  })
  // remove empty lines
  .filter(l => l.string.length > 0)
  // --- First Pass: build symbol table
  .map(this.firstPass, this)
  // --- Second Pass: convert to object form
  .map(this.secondPass, this)
  .filter(i => i !== undefined)
  // --- Postprocessing: convert to final binary form
  .map(this.buildInstruction, this)
  .map(common.switchEndian)
  if (this.debug) console.log('=== SYMBOL TABLE', this.symbolTable)
  return Uint16Array.from(arr)
}

Assembler.prototype.readInstruction = function (obj, i) {
  if (typeof obj === 'number') return obj // Already built
  var x = obj.string
  // Instruction format is "[label ]opname arg1[, arg2[, arg3]]"
  // regex: /^((\w+)[ \t]+){0,1}(\w+)([ \t]+(\w+)([ \t]*,[ \t]*(\w+))*)*$/
  var label
  var hasLabel = false
  var firstWord = x.split(' ')[0].toLowerCase()
  if (firstWord.indexOf('.') !== 0 && common.opnames.indexOf(firstWord) < 0) {
    // TODO: rewrite this
    hasLabel = true
  }
  if (hasLabel) {
    label = x.split(' ', 1)[0]
    x = x.substring(label.length + 1).trim()
  }
  var opname = x.split(' ')[0].toUpperCase()
  var parts = x.substring(opname.length).split(',').map(l => l.trim())
  return { label: label, opname: opname, args: parts, row: obj.row }
}

Assembler.prototype.firstPass = function (x, i) {
  var obj = this.readInstruction(x)
  var ret
  if (obj.row === this.rows - 1 && obj.opname !== '.END') {
    console.log('[WARNING] Line ' + obj.row + ': final instruction isn\'t .END')
  }
  if (i === 0 && obj.opname !== '.ORIG') {
    console.log('[FATAL] Line ' + obj.row + ': .ORIG has to be the first instruction!')
  } else if (obj.opname.indexOf('.') === 0) {
    // This is a pseudoinstruction
    if (obj.opname === '.ORIG') {
      if (i !== 0) {
        console.log('[FATAL] Line ' + obj.row + ': .ORIG has to be the first instruction!')
        ret = undefined
      } else if (obj.args.length !== 1) {
        console.log('[FATAL] Line ' + obj.row + ': .ORIG needs ONE argument, found ' + obj.args.length + ' instead!')
        ret = undefined
      } else {
        ret = this.parseArgument(obj.args[0])
        if (ret.literal === undefined) {
          console.log('[FATAL] Line ' + obj.row + ': .ORIG argument invalid')
          ret = undefined
        } else {
          ret = ret.literal
          this.orig = ret
          this.page = common.PC7msb(this.orig)
        }
      }
    } else if (obj.opname === '.END') {
      if (obj.row !== this.rows - 1) {
        console.log('[WARNING] Line ' + obj.row + ': .END has to be at the end of the file!')
      }
      ret = undefined
    } else if (obj.opname === '.FILL') {
      if (obj.args.length !== 1) {
        console.log('[FATAL] Line ' + obj.row + ': .FILL needs ONE argument, found ' + obj.args.length + ' instead!')
        ret = undefined
      } else {
        if (obj.label !== undefined) {
          this.symbolTable[obj.label] = i + this.orig - this.page - 1
        }
        ret = this.parseArgument(obj.args[0])
        if (ret.literal === undefined) {
          console.log('[FATAL] Line ' + obj.row + ': .FILL argument invalid')
          ret = undefined
        } else ret = ret.literal
      }
    } else {
      // TODO: implement other pseudoinstructions
      console.log('[WARNING] Line ' + obj.row + ': Unimplemented or invalid pseudo instruction!')
      ret = undefined
    }
  } else ret = x
  return ret
}

// Takes instruction in string form and returns instruction in object form
Assembler.prototype.secondPass = function (x, i) {
  if (x === undefined) return undefined
  if (typeof x === 'number') return x
  var obj = this.readInstruction(x)
  if (obj === undefined) return undefined
  var opcode = obj.opname.indexOf('br') === 0 ? 0 : common.opnames.indexOf(obj.opname.toLowerCase())
  if (opcode < 0) {
    console.log('[FATAL] Line ' + obj.row + ' INVALID INSTRUCTION', x)
    return undefined
  }
  var args = obj.args.map(this.parseArgument, this)
  var ret = { row: obj.row, label: obj.label, opname: obj.opname, opcode: opcode, args: args, string: x.string }
  if (this.debug) console.log(x.string + ' -->\n', ret || '(no instruction)')
  return ret
}

// Takes instruction in object form and returns instruction in binary
Assembler.prototype.buildInstruction = function (x) {
  if (x === undefined) return undefined
  if (typeof x === 'number') return x // Instruction was already built
  var res = x.opcode << 12
  var dst, src, i6, mem
  if (x.opcode === 0) {
    if (x.opname === 'NOP') {
      res = 0
    } else { // BR
      var nzp = 0
      if (x.opname.indexOf('n') > 0) nzp = nzp | 4
      if (x.opname.indexOf('z') > 0) nzp = nzp | 2
      if (x.opname.indexOf('p') > 0) nzp = nzp | 1
      var arg = common.pgoffset9(this.buildArgument(x.args[0]))
      res = res | arg | (nzp << 9)
    }
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
Assembler.prototype.readArgument = function (arg) {
  if (this.debug) {
    var orarg = arg
  }
  var ret
  arg = arg.toLowerCase()
  if (!isNaN(arg)) return { literal: parseInt(arg, 10) }
  else if (arg.indexOf('x') === 0) ret = { literal: parseInt(arg.slice(1), 16) }
  else if (arg.indexOf('#') === 0) ret = { literal: parseInt(arg.slice(1), 10) }
  else if (/^r[0-7]$/i.test(arg)) ret = { register: parseInt(arg.slice(1), 10) }
  else ret = { variable: this.symbolTable[arg] }
  if (this.debug) {
    console.log('ARGUMENT: ' + orarg + ' -->', ret)
  }
  return ret
}

Assembler.prototype.parseArgument = function (arg) {
  return this.readArgument(arg)
}

if (module && module.exports) module.exports = Assembler
