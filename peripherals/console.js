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
// Console Peripheral - this is an implementation of the LC2 console

var fs = require('fs')

function Console (lc2, position, debug) {
  this.lc2 = lc2
  this.position = position
  this.debug = debug || false
  this.name = 'Console'
  this.lastReadKey = 0
  this.outputKey = 0
  this.displayReady = 1
}

Console.prototype.status = function () {
  var s = (this.lastReadKey !== 0 ? 2 : 0) + (this.displayReady !== 0 ? 1 : 0)
  this.lc2.memory[this.position + 3] = s
  return s
}

Console.prototype.command = function (cmd) {
  if (cmd & 1) { // Key Read
    this.lastReadKey = 0
  }
  if (cmd & 2) { // Display Char
    this.displayReady = 0
    this.status()
    console.log((this.debug ? 'OUTPUT(CHAR): ' : '') + String.fromCharCode(this.outputKey))
    this.displayReady = 1
    this.status()
  }
}

Console.prototype.input = function (value) {
  if (this.lastReadKey !== 0) return
  this.lastReadKey = value.charCodeAt(0)
  this.lc2.memory[this.position + 1] = value.charCodeAt(0)
  this.status()
}

Console.prototype.loadSubroutines = function () {
  if (this.lc2.debug) console.log('Compiling Console subroutines...')
  var data = fs.readFileSync(__dirname + '/../subroutines/default.asm')
  var Assembler = require('../lib/assembler.js')
  var a = new Assembler(this.lc2.debug)
  var c = a.toBinary(a.assemble(data.toString('utf-8')))
  console.log(c[0].toString(16))
  console.log(c[1].toString(16))
  if (this.lc2.debug) console.log('Loading Console subroutines...')
  this.lc2.loadCode(c)
}

if (module && module.exports) {
  module.exports = Console
} else window.LC2Console = Console
