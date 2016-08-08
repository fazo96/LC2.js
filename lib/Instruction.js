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
// ## Assembler
// This part of the emulator contains the Instruction object

let common = require('./common.js')

class Instruction {
  constructor (options = {}) {
    this.isInstruction = true
    this.value = options.value
    this.source = options.source || ''
    this.row = options.row
    this.errors = options.errors || []
    this.warnings = options.warnings || []
    this.label = options.label
    this.opname = options.opname
    this.opcode = options.opcode
    this.args = options.args || []
    this.empty = options.empty || false
    // this.built = options.built || false
  }

  static fromSource (source, row, symbolTable = {}) {
    let instruction = new Instruction({ source, row })
    instruction.build(symbolTable)
    return instruction
  }

  hasErrors () {
    return this.errors.length > 0
  }

  addWarning (warn, log = false) {
    this.addMessage(warn, 'WARNING', this.warnings, log)
  }

  addError (err, log = false) {
    this.addMessage(err, 'ERROR', this.errors, log)
  }

  addMessage (msg, type, container, log = false) {
    let message = '[' + type + '] Line ' + this.row + ': ' + msg
    container.push(message)
    if (log || true) console.log(message)
    return message
  }

}

module.exports = Instruction
