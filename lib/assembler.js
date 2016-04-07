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

// Takes a program in string form and returns a program in object
// Steps: string --> Object
Assembler.prototype.assemble = function (str) {
  this.symbolTable = {}
  var arr = str.trim().split('\n').map(x => x.trim())
  if (this.debug) console.log('PARSING:', arr)
  this.rows = arr.length
  this.currentInstrDelta = 0
  if (this.debug) console.log('[DEBUG] Parsing ' + this.rows + ' lines')
  // --- Preprocessing
  // remove comments, save istruction row number in source file
  arr = arr.map((l, i) => {
    var s = l.split(';', 1)[0]
    while (s.indexOf('\t') >= 0) s = s.replace('\t', ' ')
    return {
      row: i + 1,
      string: s.trim()
    }
  })
  // remove empty lines
  .filter(l => l.string.length > 0)
  // --- First Pass: build symbol table
  .map(this.firstPass, this)
  // --- Second Pass: convert to object form
  .map(this.secondPass, this)
  .filter(i => i !== undefined)
  return arr
}

Assembler.prototype.toList = function (arr) {
  return arr.map(this.writeInstruction, this)
}

Assembler.prototype.writeInstruction = function (o, i) {
  var pos = common.pad((i === 0 ? 0 : (i + this.orig - 1)).toString(16), 4)
  var val = this.buildInstruction(o)
  var hex = common.pad(val.toString(16), 4).toUpperCase()
  var bin = common.pad(val.toString(2), 16)
  var index = common.pad(o.row ? o.row.toString(10) : '???', 4, ' ').toUpperCase()
  var label = common.pad(o.label || '', 16, ' ').toUpperCase()
  var opname = common.pad(o.opname || '???', 6, ' ')
  var args = o.args ? o.args.map((x, i) => this.buildArgument(i, o), this).join() : ''
  return '(' + pos + ') ' + hex + '  ' + bin + ' (' + index + ')' + label + opname + ' ' + args
}

// Takes a program in Object form and returns it in binary
// Steps: Object --> Binary
Assembler.prototype.toBinary = function (arr) {
  arr = arr.map(this.buildInstruction, this)
  var final = []
  for (var i = 0; i < arr.length; i++) {
    if (typeof arr[i] === 'number') {
      final.push(arr[i])
    } else if (arr[i].slice !== undefined) {
      // Instruction was actually an array. This is because .BLKW produces
      // multiple instructions
      if (this.debug) console.log('Found Array left by .BLKW call at ', i + ':', arr[i])
      for (var j = 0; j < arr[i].length; j++) final.push(arr[i][j])
    } else {
      console.log('[FATAL] Invalid instruction while postprocessing:', arr[i])
    }
  }
  if (this.debug) console.log('=== SYMBOL TABLE', this.symbolTable)
  return Uint16Array.from(final.map(common.switchEndian))
}

Assembler.prototype.readInstruction = function (obj, i) {
  if (obj.slice !== undefined) return obj // Is an instruction array, skip
  if (typeof obj === 'number') return obj // Already built, skip
  var x = obj.string
  // Instruction format is "[label ]opname arg1[, arg2[, arg3]]"
  // regex: /^((\w+)[ \t]+){0,1}(\w+)([ \t]+(\w+)([ \t]*,[ \t]*(\w+))*)*$/
  var label, parts
  var words = x.split(/\s/)
  var firstWord = words[0].toLowerCase()
  if (firstWord.indexOf('.') !== 0 && common.opnames[firstWord] === undefined && !/^br([nzp]+$)/.test(firstWord)) {
    // Has Label
    label = x.split(' ', 1)[0]
    if (words.length === 1) {
      // Has only label
      console.log('[WARNING] Line ' + obj.row + ' only contains label: ' + obj.string)
      return { label: label, opname: 'NOP', args: [], row: obj.row, empty: true }
    }
    x = x.substring(label.length + 1).trim()
    words = words.slice(1)
  }
  var opname = words[0].toUpperCase()
  if (opname === 'IN') {
    opname = 'TRAP'
    parts = ['x23']
  } else if (opname === 'OUT') {
    opname = 'TRAP'
    parts = ['x21']
  } else if (opname === 'HALT') {
    opname = 'TRAP'
    parts = ['x25']
  } else parts = x.substring(opname.length).split(/,| /).filter(x => x.length > 0)
  return { label: label, opname: opname, args: parts, row: obj.row }
}

Assembler.prototype.setLabel = function (label) {
  var value = this.currentInstrDelta
  this.symbolTable[label] = value - common.PC7msb(this.orig + value) + this.orig - 1
  var final = 'x' + common.pad((this.symbolTable[label] + common.PC7msb(this.orig + value)).toString(16), 4).toUpperCase()
  if (this.debug) console.log('Setting Label:', label, 'to', this.symbolTable[label], 'whichs maps to', final)
}

Assembler.prototype.firstPass = function (x, i) {
  if (this.debug) console.log('STARTED FIRST PASS, currentInstrDelta', this.currentInstrDelta)
  var obj = this.readInstruction(x)
  if (this.debug) console.log('Reading:', x)
  if (this.debug) console.log('Examining:', obj)
  var ret
  if (obj.row === this.rows && obj.opname !== '.END') {
    console.log('[WARNING] Line ' + obj.row + ': final instruction isn\'t .END')
  }
  if (obj.label !== undefined) this.setLabel(obj.label.toLowerCase())
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
        }
      }
    } else if (obj.opname === '.END') {
      if (obj.row !== this.rows) {
        console.log('[WARNING] Line ' + obj.row + ': .END has to be at the end of the file!', this.rows)
      }
      ret = undefined
    } else if (obj.opname === '.FILL') {
      if (obj.args.length !== 1) {
        console.log('[FATAL] Line ' + obj.row + ': .FILL needs ONE argument, found ' + obj.args.length + ' instead!')
        ret = undefined
      } else {
        ret = this.parseArgument(obj.args[0])
        if (ret.literal === undefined) {
          console.log('[FATAL] Line ' + obj.row + ': .FILL argument invalid')
          ret = undefined
        } else ret = ret.literal
      }
    } else if (obj.opname === '.BLKW') {
      if (obj.args.length < 1 || obj.args.length > 2) {
        console.log('[FATAL] Line ' + obj.row + ': .BLKW needs 1 or 2 arguments, found ' + obj.args.length + ' instead!')
        ret = undefined
      } else {
        var len = this.parseArgument(obj.args[0]).literal
        var content = obj.args.length > 1 ? this.parseArgument(obj.args[1]).literal : 0
        ret = new Array(len).fill(content)
        if (this.debug) console.log('Reserving', len, 'memory cells with content', content, 'for .BLKW call')
        this.currentInstrDelta += len - 1
      }
    } else {
      console.log('[WARNING] Line ' + obj.row + ': Unimplemented or invalid pseudo instruction:', obj.string)
      ret = undefined
    }
  } else ret = x
  if (!obj.empty) this.currentInstrDelta++
  if (this.debug) console.log('FINISHED FIRST PASS, currentInstrDelta', this.currentInstrDelta)
  return ret
}

// Takes instruction in string form and returns instruction in object form
Assembler.prototype.secondPass = function (x, i) {
  if (x === undefined) return undefined
  if (typeof x === 'number') return x
  if (x.slice !== undefined) return x // Is an instruction array, skip
  var obj = this.readInstruction(x)
  if (obj === undefined) return undefined
  var opcode
  if (obj.opname === 'NOP') {
    if (obj.label !== undefined) {
      // This came from a line with only the label and no instruction
      return undefined
    }
    opcode = 0
  } else if (/^BR([NZP]+$)/.test(obj.opname)) {
    opcode = 0
  } else {
    opcode = common.opnames[obj.opname.toLowerCase()]
  }
  if (opcode < 0) {
    console.log('[FATAL] Line ' + obj.row + ' INVALID INSTRUCTION', x, 'OPNAME:', obj.opname)
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
  if (x.slice !== undefined) return x // Is an instruction array, skip
  if (this.debug) console.log('BUILDING:', x)
  var res = x.opcode << 12
  var dst, src, i6, mem, l
  if (x.opcode === 0) {
    if (x.opname === 'NOP') {
      res = 0
    } else { // BR
      var nzp = 0
      if (x.opname.indexOf('N') > 0) nzp = nzp | 4
      if (x.opname.indexOf('Z') > 0) nzp = nzp | 2
      if (x.opname.indexOf('P') > 0) nzp = nzp | 1
      var arg = common.pgoffset9(this.buildArgument(0, x))
      if (this.debug) console.log('BR Argument:', arg)
      res = res | arg | (nzp << 9)
    }
  } else if (x.opcode === 1 || x.opcode === 5) { // ADD, AND
    dst = this.buildArgument(0, x)
    src = this.buildArgument(1, x)
    if (x.args[2].register !== undefined) { // Use register
      res = res | common.imm5(x.args[2].register) | (src << 6) | (dst << 9)
    } else { // Use literal
      res = res | common.imm5(x.args[2].literal) | (src << 6) | (dst << 9) | 32
    }
  } else if (x.opcode >= 2 && x.opcode <= 3) { // LD, ST
    dst = this.buildArgument(0, x)
    src = common.pgoffset9(this.buildArgument(1, x))
    res = res | (dst << 9) | src
  } else if (x.opcode === 4) { // JSR, JMP
    l = x.opname === 'JSR' ? 1 : 0
    dst = common.pgoffset9(this.buildArgument(0, x))
    res = res | (l << 11) | dst
  } else if (x.opcode === 6 || x.opcode === 7) { // LDR, STR
    dst = this.buildArgument(0, x)
    src = this.buildArgument(1, x)
    i6 = common.index6(this.buildArgument(2, x))
    res = res | i6 | (src << 6) | (dst << 9)
  } else if (x.opcode === 8) { // RTI
    // Nothing to do
  } else if (x.opcode === 9) { // NOT
    dst = this.buildArgument(0, x)
    src = this.buildArgument(1, x)
    res = res | 63 | (src << 6) | (dst << 9)
  } else if (x.opcode === 10 || x.opcode === 11) { // LDI, STI
    dst = this.buildArgument(0, x)
    mem = this.buildArgument(1, x)
    res = res | (dst << 9) | mem
  } else if (x.opcode === 12) { // JSRR
    l = x.opname === 'JSRR' ? 1 : 0
    src = this.buildArgument(0, x)
    i6 = this.buildArgument(1, x)
    res = res | (l << 11) | (src << 6) | i6
  } else if (x.opcode === 13) { // RET
    res = res
  } else if (x.opcode === 14) { // LEA
    var pg9 = common.pgoffset9(this.buildArgument(1, x))
    dst = this.buildArgument(0, x)
    res = res | (dst << 9) | pg9
  } else if (x.opcode === 15) { // TRAP
    var tv8 = this.buildArgument(0, x)
    res = res | common.trapvect8(tv8)
  }
  if (this.debug) console.log('Assembling "' + x.string + '" to ' + common.pad(res.toString(2), 16))
  return res
}

Assembler.prototype.buildArgument = function (i, obj) {
  if (obj.args[i] === undefined) {
    console.log('[FATAL] MISSING REQUIRED ARGUMENT NUMBER', i, 'FROM', obj)
  } else {
    var x = obj.args[i]
    var ret = x.literal || x.register || x.variable || this.symbolTable[x.variableName] || 0
  }
  return ret
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
  else if (this.symbolTable[arg]) ret = { variable: this.symbolTable[arg] }
  else ret = { variableName: arg }
  if (this.debug) {
    console.log('ARGUMENT: ' + orarg + ' -->', ret, '\nSymbol Table:', this.symbolTable)
  }
  return ret
}

Assembler.prototype.parseArgument = function (arg) {
  return this.readArgument(arg)
}

if (module && module.exports) module.exports = Assembler
