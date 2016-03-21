var LC2Common = {
  switchEndian: function (x) {
    return ((x & 255) << 8) | ((x & (65535 - 255)) >> 8)
  },
  pad: function (arg, len) {
    if (typeof arg !== 'string') arg = arg.toString()
    while (arg.length < len) arg = '0' + arg
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
  opnames: ['br', 'add', 'ld', 'st', 'jsr', 'and', 'ldr', 'str', 'rti', 'not', 'ldi', 'sti', 'jsrr', 'ret', 'lea', 'trap']
}

if (module && module.exports) {
  module.exports = LC2Common
} else window.LC2Common = LC2Common
