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
var proginfo = require('./package.json')

var done = false

cli
  .version(proginfo.version)
  .description(proginfo.description)
  .option('-d, --debug', 'enable debugging information')

cli
  .command('assemble <source> <output>')
  .action((file, output) => {
    fs.readFile(file, (err, data) => {
      if (err) {
        console.log('[FATAL] There was an error while reading the file:', err)
      } else {
        var assembler = new Assembler(cli.debug)
        var binary = assembler.assemble(data.toString())
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
    done = true
  })

cli
  .command('run <binary>')
  .action(file => {
    fs.readFile(file, (err, data) => {
      if (err) {
        console.log('[FATAL] There was an error while reading the file:', err)
      } else {
        var cpu = new LC2(cli.debug)
        var arr = new Uint16Array(data.length / 2)
        for (var i = 0; i < data.length; i += 2) {
          arr[i / 2] = (data[i + 1] << 8) | data[i] // Little endian
        }
        console.log('Loading Program...')
        cpu.loadProgram(arr)
        console.log('Running Program...')
        cpu.run()
        console.log('Done.\n')
        console.log('=== MEM DUMP ===\n' + cpu.memdump().join('\n'))
        console.log('\n=== REG DUMP ===\n' + cpu.regdump().join('\n'))
      }
    })
    done = true
  })

cli.parse(process.argv)
if (!done) cli.help()
