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
    return data & 511
  },
  index6: function (data) {
    return data & 63
  },
  trapvect8: function (data) {
    return data & 255
  },
  PC7msb: function (data) {
    return data & parseInt('1111111000000000', 2)
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
    'in': 15
  }
}

if (module && module.exports) {
  module.exports = LC2Common
} else window.LC2Common = LC2Common
