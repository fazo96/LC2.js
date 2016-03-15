// LC-2 javascript emulator
'use strict'

function LC2 () {
  this.reset()
}

LC2.prototype.reset = function () {
  this.memory = new Uint16Array(Math.pow(2, 16))
  this.gpr = new Uint16Array(8)
  this.pc = 0
  this.cc = 0
}

LC2.dest_loc = parseInt('0000111000000000', 2)
LC2.dest = function (op) {
  return (op & LC2.dest_loc) >>> 9
}

LC2.src_loc = parseInt('0000000111000000', 2)
LC2.src = function (op) {
  return (op & LC2.src_loc) >>> 6
}

LC2.pgoffset9 = function (data) {
  return data & 511
}

LC2.index6 = function (data) {
  return data & 63
}

LC2.prototype.execute = function (op) {
  var opcode = op >>> 12
  if (opcode === 0) { // NOP
    this.nop()
  } else if (opcode === 1) { // ADD
    if ((op & 32) > 0) { // use register
      let second_reg = (op & 7)
      this.add(LC2.dest(op), LC2.src(op), second_reg, true)
    } else { // use literal
      let num = op & 31
      this.add(LC2.dest(op), LC2.src(op), num, false)
    }
  } else if (opcode === 2) { // LD
    this.ld(LC2.dest(op), LC2.pgoffset9(op))
  } else if (opcode === 3) { // ST STORE
    this.st(LC2.dest(op), LC2.pgoffset9(op))
  } else if (opcode === 5) { // AND
    if ((op & 64) > 0) { // use register
      let second_reg = (op & 7)
      this.and(LC2.dest(op), LC2.src(op), second_reg, true)
    } else { // use literal
      let num = op & 31
      this.and(LC2.dest(op), LC2.src(op), num, false)
    }
  } else if (opcode === 9) { // NOT
    if ((op & 63) !== 63) console.log('trailing bits in NOT not set to one (this error is harmless)')
    this.not(LC2.dest(op), LC2.src(op))
  } else if (opcode === 14) { // LEA
    this.lea(LC2.dest(op), LC2.pgoffset9(op))
  }
}

LC2.prototype.setCC = function (reg) {
  var data = this.gpr[reg]
  if (data < 0) this.cc = 4
  else if (data > 0) this.cc = 1
  else this.cc = 2
}

LC2.prototype.PC7msb = function () {
  return this.pc & parseInt('1111111000000000', 2)
}

// INSTRUCTIONS

LC2.prototype.nop = function () { this.pc++ }
LC2.prototype.add = function (dest, a, b, use_register) {
  this.gpr[dest] = this.gpr[a] + (use_register ? this.gpr[b] : b)
  this.setCC(dest)
  this.pc++
}
LC2.prototype.ld = function (dest, src) {
  this.gpr[dest] = this.memory[src + this.PC7msb()]
}
LC2.prototype.st = function (src, data) {
  this.memory[data + this.PC7msb()] = this.gpr[src]
}
LC2.prototype.ldi = function (dest, src) {
  this.gpr[dest] = this.memory[this.memory[src + this.PC7msb()]]
}
LC2.prototype.sri = function (src, data) {
  this.memory[this.memory[data + this.PC7msb()]] = this.gpr[src]
}
LC2.prototype.ldr = function (dest, br, index6) {
  this.gpr[dest] = this.memory[this.gpr[br] + index6]
}
LC2.prototype.str = function (dest, br, index6) {
  this.memory[this.gpr[br] + index6] = this.gpr[dest]
}
LC2.prototype.and = function (dest, a, b, use_register) {
  this.gpr[dest] = this.gpr[a] & (use_register ? this.gpr[b] : b)
  this.setCC(dest)
  this.pc++
}
LC2.prototype.not = function (dest, src) {
  this.gpr[dest] = ~this.gpr[src]
  this.setCC(dest)
  this.pc++
}
LC2.prototype.lea = function (dest, data) {
  this.gpr[dest] = this.PC7msb() + LC2.pgoffset9(data)
  this.setCC(dest)
  this.pc++
}
LC2.prototype.jsr = function (trapvect8) {
  this.gpr[7] = this.pc
  this.pc = trapvect8
}
LC2.prototype.trap = function (trapvect8) {
  this.gpr[7] = this.pc
  this.pc = trapvect8
}

// END INSTRUCTIONS

if (module && module.exports) module.exports = LC2
