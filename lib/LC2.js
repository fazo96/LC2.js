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
// LC2 - this part of the emulator emulates the actual CPU

'use strict'

var common, LC2Console
if (require !== undefined) {
  common = require('./common.js')
  LC2Console = require('../peripherals/console.js')
} else {
  common = window.LC2Common
  LC2Console = window.LC2Console
}

function LC2 (debug) {
  this.debug = debug
  this.peripherals_loc = parseInt('FF00', 16)
  this.machine_on_loc = parseInt('FF15', 16)
  this.reset()
  var p = parseInt('FF16', 16)
  this.console = new LC2Console(this, p, this.debug)
  this.console.loadSubroutines()
  this.peripherals = {}
  this.peripherals[p] = this.console
}

LC2.prototype.isOn = function () {
  if (this.debug) console.log('Checking if machine is on:', this.mem(this.machine_on_loc))
  return this.mem(this.machine_on_loc) !== 0
}

LC2.prototype.reset = function (peripherals) {
  if (this.debug) console.log('Resetting machine')
  this.memorySize = Math.pow(2, 16)
  this.memory = new Uint16Array(this.memorySize)
  this.memory[this.machine_on_loc] = 1
  this.isOn()
  this.gpr = new Uint16Array(8)
  this.pc = 0
  this.cc = 7
}

LC2.prototype.loadCode = function (code, dest) {
  var co
  if (dest === undefined) {
    if (this.debug) console.log('Using ORIG to determine binary position')
    dest = code[0]
    co = 1
  } else {
    co = 0
  }
  if (this.debug) console.log('Loading binary:', code.length - co, 'words at', 'x' + common.pad(dest.toString(16), 4))
  for (var i = 0; i < code.length - co; i++) {
    this.mem(i + dest, code[co + i])
  }
}

LC2.prototype.loadProgram = function (program) {
  this.pc = program[0]
  if (this.debug) console.log('PC = x' + common.pad(this.pc.toString(16), 4))
  this.loadCode(program)
}

LC2.prototype.step = function (cb) {
  this.execute(this.mem(this.pc))
  if (cb) cb(!this.isOn())
}

LC2.prototype.run = function (cb) {
  var lc2 = this
  var step_cb = () => {
    if (this.isOn()) setTimeout(() => lc2.step(step_cb), 10)
    else cb(!this.isOn())
  }
  if (this.isOn()) step_cb()
}

LC2.prototype.mem = function (i, value) {
  if (value !== undefined) { // Writing
    this.memory[i] = value
    if (this.peripherals && i >= this.peripherals_loc) {
      // Try CMD
      var per = this.peripherals[i - 2]
      if (per !== undefined) {
        if (this.debug) console.log('Sending command to peripheral', per.name, 'with value', 'b' + common.pad(value.toString(2), 16))
        per.command(value)
      } else {
        // Try Write to DataOut
        per = this.peripherals[i - 1]
        if (per !== undefined) {
          if (this.debug) console.log('Writing to peripheral', per.name, 'value', 'x' + common.pad(value.toString(16), 4))
          per.write(value)
        }
      }
    }
  } else if (this.peripherals && i >= this.peripherals_loc) {
    // Try READ
    var p = this.peripherals[i] || this.peripherals[i - 3] // Select peripheral
    if (p !== undefined) {
      var z = i - p.position
      if (this.debug) console.log('Reading from peripheral SUCCESS:', p.name, 'at index', z, 'with original dest', i)
      return p.mem(z)
    }
  }
  return value || this.memory[i]
}

LC2.prototype.memdump = function (start, end) {
  var s = []
  for (var i = start; i < end; i++) {
    s.push('x' + common.pad(i.toString(16), 4) + ' | x' + common.pad(this.mem(i).toString(16), 4) + ' b' + common.pad(this.mem(i).toString(2), 16) + ' ' + this.mem(i))
  }
  return s
}

LC2.prototype.regdump = function () {
  var s = []
  for (var i = 0; i <= 7; i++) {
    s.push('r' + i + ' | x' + common.pad(this.gpr[i].toString(16), 4) + ' b' + common.pad(this.gpr[i].toString(2), 16) + ' x' + common.pad(this.gpr[i].toString(16), 4) + ' ' + this.gpr[i])
  }
  s.push('PC | x' + common.pad(this.pc.toString(16), 4) + ' b' + common.pad(this.pc.toString(2), 16) + ' x' + common.pad(this.pc.toString(16), 4))
  return s
}

// UTILS

LC2.prototype.setCC = function (reg) {
  var data = this.gpr[reg]
  if (data < 0) this.cc = 4
  else if (data > 0) this.cc = 1
  else this.cc = 2
}

LC2.dest_loc = parseInt('0000111000000000', 2)
LC2.dest = function (op) {
  return (op & LC2.dest_loc) >>> 9
}

LC2.src_loc = parseInt('0000000111000000', 2)
LC2.src = function (op) {
  return (op & LC2.src_loc) >>> 6
}

LC2.l_loc = parseInt('0000100000000000', 2)
LC2.l = function (op) {
  return (op & LC2.lc_loc) > 0
}

// DECODER

LC2.prototype.execute = function (op) {
  if (this.pc >= this.memorySize) {
    this.pc -= this.memorySize
    if (this.debug) console.log('[WARNING] Program Counter overflowed!')
  }
  if (this.debug) console.log('Running instruction at x' + common.pad(this.pc.toString(16), 4) + ':', common.pad(op.toString(2), 16))
  var opcode = op >>> 12
  this.pc++
  if (op === 0) {
    this.nop()
  } else if (opcode === 0) { // BR
    var nzp = (op >>> 9) & 7
    this.br(nzp, common.pgoffset9(op))
  } else if (opcode === 1 || opcode === 5) { // ADD, AND
    var f = (opcode === 1 ? this.add : this.and).bind(this)
    if ((op & 32) <= 0) { // use register
      let second_reg = (op & 7)
      f(LC2.dest(op), LC2.src(op), second_reg, true)
    } else { // use literal
      let num = common.imm5(op)
      f(LC2.dest(op), LC2.src(op), num, false)
    }
  } else if (opcode === 2) { // LD
    this.ld(LC2.dest(op), common.pgoffset9(op))
  } else if (opcode === 3) { // ST STORE
    this.st(LC2.dest(op), common.pgoffset9(op))
  } else if (opcode === 4) { // JSR, JMP
    this.jsr(LC2.dest(op), common.pgoffset9(op), LC2.l(op))
  } else if (opcode === 6) { // LDR
    this.ldr(LC2.dest(op), LC2.src(op), common.index6(op))
  } else if (opcode === 7) { // STR
    this.str(LC2.dest(op), LC2.src(op), common.index6(op))
  } else if (opcode === 8) { // RTI
    this.rti()
  } if (opcode === 9) { // NOT
    if ((op & 63) !== 63) console.log('[WARNING] trailing bits in NOT not set to one')
    this.not(LC2.dest(op), LC2.src(op))
  } else if (opcode === 10) { // LDI
    this.ldi(LC2.dest(op), common.pgoffset9(op))
  } else if (opcode === 11) { // STI
    this.sti(LC2.dest(op), common.pgoffset9(op))
  } else if (opcode === 12) { // JSRR, JMPR
    this.jsrr(LC2.src(op), common.index6(op), LC2.l(op))
  } else if (opcode === 13) { // RET
    this.ret()
  } else if (opcode === 14) { // LEA
    this.lea(LC2.dest(op), common.pgoffset9(op))
  } else if (opcode === 15) { // TRAP
    this.trap(common.trapvect8(op))
  }
}

// INSTRUCTIONS

LC2.prototype.br = function (nzp, dest) {
  if (this.debug) console.log('Executing BR: CC:', common.pad(this.cc.toString(2), 3), 'NZP:', common.pad(nzp.toString(2), 3))
  if ((this.cc & nzp) !== 0) {
    this.pc = common.PC7msb(this.pc) | dest
    if (this.debug) console.log('PC', '=', 'x' + common.pad(this.pc.toString(16), 4))
  }
}
LC2.prototype.nop = function () {}
LC2.prototype.add = function (dest, a, b, use_register) {
  this.gpr[dest] = this.gpr[a] + (use_register ? this.gpr[b] : b)
  if (this.debug) console.log('R' + dest, '=', 'R' + a, '+', (use_register ? ('R' + b) : b))
  this.setCC(dest)
}
LC2.prototype.ld = function (dest, src) {
  var addr = src | common.PC7msb(this.pc)
  this.gpr[dest] = this.mem(addr)
  if (this.debug) console.log('R' + dest, '=', 'mem[' + addr + ']')
  this.setCC(dest)
}
LC2.prototype.st = function (src, data) {
  var addr = data | common.PC7msb(this.pc)
  this.mem(addr, this.gpr[src])
  if (this.debug) console.log('mem[' + addr + ']', '=', 'R' + src)
}
LC2.prototype.ldi = function (dest, src) {
  var addr = src | common.PC7msb(this.pc)
  var a = this.mem(addr)
  this.gpr[dest] = this.mem(a)
  if (this.debug) console.log('R' + dest, '=', 'mem[mem[x' + common.pad(addr.toString(16), 4) + '] = x' + common.pad(a.toString(16), 4) + ']')
  this.setCC(dest)
}
LC2.prototype.sti = function (src, data) {
  var addr = data | common.PC7msb(this.pc)
  this.mem(this.mem(addr), this.gpr[src])
  if (this.debug) console.log('mem[mem[' + addr + ']]', '=', 'R' + src)
}
LC2.prototype.ldr = function (dest, br, index6) {
  this.gpr[dest] = this.mem(this.gpr[br] + index6)
  if (this.debug) console.log('R' + dest, '=', 'mem[R' + br, '+', index6, ']')
  this.setCC(dest)
}
LC2.prototype.str = function (dest, br, index6) {
  this.mem(this.gpr[br] + index6, this.gpr[dest])
  if (this.debug) console.log('mem[R' + br, '+', index6 + ']', '=', 'R' + dest)
}
LC2.prototype.and = function (dest, a, b, use_register) {
  this.gpr[dest] = this.gpr[a] & (use_register ? this.gpr[b] : b)
  if (this.debug) console.log('R' + dest, '=', 'R' + a, '&', (use_register ? ('R' + b) : b))
  this.setCC(dest)
}
LC2.prototype.not = function (dest, src) {
  this.gpr[dest] = ~this.gpr[src]
  if (this.debug) console.log('R' + dest, '=', '!R' + src)
  this.setCC(dest)
}
LC2.prototype.lea = function (dest, data) {
  var addr = common.PC7msb(this.pc) | data
  this.gpr[dest] = addr
  if (this.debug) console.log('R' + dest, '=', 'x' + common.pad(addr.toString(16), 4))
  this.setCC(dest)
}
LC2.prototype.jsr = function (dest, l) {
  if (l) this.gpr[7] = this.pc
  this.pc = common.PC7msb(this.pc) + dest
  if (this.debug) {
    if (l) console.log('R7 = ', 'x' + common.pad(this.gpr[7].toString(16), 4), '(PC)')
    console.log('PC =', this.pc)
  }
}
LC2.prototype.jsrr = function (src, i6, l) {
  if (l) this.gpr[7] = this.pc
  this.pc = this.gpr[src] + i6
  if (this.debug) {
    if (l) console.log('R7 = ', 'x' + common.pad(this.gpr[7].toString(16), 4), '(PC)')
    console.log('PC = R' + src, '+', i6)
  }
}
LC2.prototype.trap = function (trapn) {
  this.gpr[7] = this.pc
  this.pc = parseInt('FF00', 16) + trapn
  if (this.debug) console.log('PC = x' + common.pad(this.pc.toString(16), 4))
}
LC2.prototype.ret = function () {
  this.pc = this.gpr[7]
  if (this.debug) console.log('PC', '=', 'R' + 7)
}
LC2.prototype.rti = function () {
  this.setCC(6)
  this.gpr[6] = this.gpr[6] - 1
  this.pc = this.mem(this.gpr[6])
  this.gpr[6] = this.gpr[6] - 1
}

LC2.prototype.writeChar = function (x) {
  console.log((this.debug ? 'OUTPUT(CHAR): ' : '') + String.fromCharCode(x))
}
LC2.prototype.buildString = function (x) {
  var str = ''
  if (this.debug) console.log('[DEBUG] Building string starting from addr x' + common.pad(x.toString(16), 4))
  while (this.mem(x) !== 0) {
    if (this.debug) console.log('[DEBUG] Building String:', this.mem(x), String.fromCharCode(this.mem(x)))
    str += String.fromCharCode(this.mem(x))
    x++
  }
  if (this.debug) console.log('[DEBUG] Built string with len', str.length)
  return str
}
LC2.prototype.writeString = function (x) {
  console.log((this.debug ? 'OUTPUT(STRING): ' : '') + x)
}
LC2.prototype.readChar = function (block, done) {
  console.log('[FATAL] Input method unimplemented. You need to provide your own cpu.readChar function!')
  done()
}

// END

if (module && module.exports) module.exports = LC2
