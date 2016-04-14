var LC2Common = {
  switchEndian: function (x) {
    return ((x & 255) << 8) | ((x & (65535 - 255)) >> 8)
  },
  pad: function (arg, len, c) {
    if (typeof arg !== 'string') arg = arg.toString()
    while (arg.length < len) arg = (c || '0') + arg
    return arg
  },
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
  // opnames: ['br', 'add', 'ld', 'st', 'jsr', 'and', 'ldr', 'str', 'rti', 'not', 'ldi', 'sti', 'jsrr', 'ret', 'lea', 'trap']
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

if (module && module.exports) {
  module.exports = LC2Common
} else window.LC2Common = LC2Common
