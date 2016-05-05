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
// ## Common
// this part of the emulator contains common structures for the Assembler
// and the CPU.

var LC2Common = {

  // ### Utils

  switchEndian: function (x) {
    return ((x & 255) << 8) | ((x & (65535 - 255)) >> 8)
  },
  pad: function (arg, len, c) {
    if (typeof arg !== 'string') arg = arg.toString()
    while (arg.length < len) arg = (c || '0') + arg
    return arg
  },
  bits: function (n) {
    return Math.pow(2, n) - 1
  },
  toTwoComplement: function (n, bits) {
    var max = Math.pow(2, bits)
    if (n >= 0) return n
    return ((max + n) & (max - 1))
  },
  fromTwoComplement: function (n, bits) {
    if (n === 0) return 0
    var max = Math.pow(2, bits)
    if ((n & (max / 2)) === 0) return n
    return (((max - n) & (max - 1))) * -1
  },

  // ### Data Extraction

  pgoffset9: function (data) {
    return data & 511 // pgoffset9 is an address, can't be negative
  },
  index6: function (data) {
    return this.fromTwoComplement(data & 63, 6)
  },
  trapvect8: function (data) {
    return data & 255 // pgoffset9 is an address, can't be negative
  },
  PC7msb: function (data) {
    return data & parseInt('1111111000000000', 2)
  },
  imm5: function (data) {
    return this.fromTwoComplement(data & 31, 5)
  },

  // ### Data Tables

  opnames: {
    'nop': 0,
    'br': 0,
    'add': 1,
    'ld': 2,
    'st': 3,
    'jsr': 4,
    'jmp': 4,
    'and': 5,
    'ldr': 6,
    'str': 7,
    'rti': 8,
    'not': 9,
    'ldi': 10,
    'sti': 11,
    'jsrr': 12,
    'jmprr': 12,
    'ret': 13,
    'lea': 14,
    'trap': 15,
    'out': 15,
    'in': 15,
    'halt': 15,
    'puts': 15
  }
}

// Export
if (module && module.exports) {
  module.exports = LC2Common
} else window.LC2Common = LC2Common
