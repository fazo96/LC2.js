#!/usr/bin/env node
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
// This part of the emulator is the main Command Line Interface

// Tip: install this package globally with npm to use this tool from anywhere.

var common = require('./lib/common.js')

var Assembler = require('./lib/assembler.js')
var LC2 = require('./lib/LC2.js')
var cli = require('commander')
var fs = require('fs')
var process = require('process')
var proginfo = require('./package.json')

var done = false

function readChar (block, done) {
  process.stdin.setEncoding('utf8')
  process.stdin.setRawMode(!block)
  if (block) process.stdin.write('$> ')
  var cb = function () {
    var r = process.stdin.read()
    if (r !== null) {
      done(r)
      process.stdin.removeListener('readable', cb)
    }
  }
  process.stdin.on('readable', cb)
}

function writeToStdout (x) {
  process.stdout.write(x.toString())
}

cli
  .version(proginfo.version)
  .description(proginfo.description)
  .option('-d, --debug', 'enable debugging information')

cli
  .command('parse <source>')
  .description('parses an LC-2 Assembly program and outputs the result in human readable form')
  .action(file => {
    done = true
    fs.readFile(file, (err, data) => {
      if (err) {
        console.log('[FATAL] There was an error while reading the file:', err)
      } else {
        var assembler = new Assembler(cli.debug)
        var res = assembler.toList(assembler.assemble(data.toString()))
        console.log(res.join('\n'))
      }
    })
  })

cli
  .command('assemble <source> <output>')
  .description('assembles an LC-2 Assembly program')
  .action((file, output) => {
    done = true
    fs.readFile(file, (err, data) => {
      if (err) {
        console.log('[FATAL] There was an error while reading the file:', err)
      } else {
        var assembler = new Assembler(cli.debug)
        var binary = assembler.toBinary(assembler.assemble(data.toString()))
        if (cli.debug) console.log('ASSEMBLED:', Array.from(binary).map(x => common.pad(x.toString(2), 16)))
        var buffer = new Buffer(binary.buffer)
        if (cli.debug) console.log('WRITING BUFFER:', buffer)
        fs.writeFile(output, buffer, err => {
          if (err) {
            console.log('[FATAL] There was an error while writing the file:', err)
          }
        })
      }
    })
  })

cli
  .command('run <binary>')
  .description('executes an LC-2 binary program')
  .option('-m, --mem-dump', 'dumps all the memory when done')
  .action((file, options) => {
    done = true
    fs.readFile(file, (err, data) => {
      if (err) {
        console.log('[FATAL] There was an error while reading the file:', err)
      } else {
        var cpu = new LC2(cli.debug)
        cpu.readChar = readChar
        cpu.writeString = cpu.writeChar = writeToStdout
        // Convert Buffer to Uint16Array
        var arr = new Uint16Array(data.length / 2)
        for (var i = 0; i < data.length; i += 2) {
          // arr[i / 2] = (data[i + 1] << 8) | data[i] // Little endian
          arr[i / 2] = (data[i] << 8) | data[i + 1] // Big endian
        }
        console.log('Loading Program...')
        cpu.loadProgram(arr)
        console.log('Running Program...')
        cpu.run(() => {
          console.log('\n=== REG DUMP ===\n' + cpu.regdump().join('\n'))
          if (options.memDump) console.log('\n\n=== MEM DUMP ===\n' + cpu.memdump(0, 65535).join('\n'))
          process.exit() // workaround for stdin event listener hanging
        })
      }
    })
  })

cli.parse(process.argv)
if (!done) cli.help()
