var Assembler = function () {

}

Assembler.prototype.assemble = function (str) {
  var lines = str.split('\n')
  // Preprocessing
  // remove comments, save istruction position in source file
  lines.map((l, i) => {
    return {
      position: i,
      string: l.split(';', 1)[0].trim()
    }
  })
  // remove empty istructions
  lines.filter(l => l.string.length > 0) // remove empty lines
  // TODO finish
}

Assembler.opnames = ['br', 'add', 'ld', 'st', 'jsr', 'and', 'ldr', 'str', 'rti', 'not', 'ldi', 'sti', 'jsrr', 'ret', 'lea', 'trap']
Assembler.prototype.parseInstruction = function (x) {
  // etichetta: opcode arg1, arg2[, arg3]
  if (x.indexOf(':') > 0) { // label is present
    var label = x.split(':', 1)[0]
  }
  x = x.substring(label.length).trim()
  var parts = x.split(',')
  var opname = parts[0].trim()
  var opcode = Assembler.opnames.indexOf(opname)
  var args = parts.slice(1).map(l => l.trim()).map(this.parseArgument)
  return { label: label, opcode: opcode, args: args }
}

Assembler.prototype.parseArgument = function (arg) {
  arg = arg.toLowerCase()
  if (!isNaN(arg)) return parseInt(arg, 10)
  else if (arg.indexOf('x') === 0) return parseInt(arg, 16)
  else if (arg.indexOf('#') === 0) return parseInt()
}
