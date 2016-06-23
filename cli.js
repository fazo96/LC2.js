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
process.stdin.setEncoding('utf8')
var cpu
var onReadCb
var reading = false

// Control reading and writing of the `reading` variable, so that it doesn't get
// sucked into function scopes and it stays in sync.
function readingFn (v) {
  if (v) reading = v
  return reading
}

// This function processes an input key from STDIN.
function onRead (key) {
  if (key !== null) {
    if (cli.debug) console.log('Key:', key)
    // Exits on CTRL-C
    if (key === '\u0003') process.exit()
    // If enter is pressed and the program is waiting for the user to press enter
    // so that the emulator can step forward, then call the appropriate callback
    if (key.charCodeAt(0) === 13 && readingFn() && onReadCb) onReadCb(key.charCodeAt(0))
    else if (cpu) {
      // Since the CPU is initialized and the program is not waiting for the user
      // to press enter, pass the pressed key to the LC-2 CPU Console.
      cpu.console.input(key)
    }
    readingFn(false)
  }
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
  .option('-m, --magic', 'enable Magic: this turns on useful features not supported by the original LC2 Assembler')
  .action((file, output, options) => {
    done = true
    fs.readFile(file, (err, data) => {
      if (err) {
        console.log('[FATAL] There was an error while reading the file:', err)
      } else {
        // Start assembling
        var assembler = new Assembler(cli.debug, options.magic)
        var binary = assembler.toBinary(assembler.assemble(data.toString()), true)
        if (cli.debug) console.log('ASSEMBLED:', Array.from(binary).map(x => common.pad(x.toString(2), 16)))
        // Create and store the data buffer to file
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
  .option('-s, --step', 'go step by step. Press enter after a step to perform the next one')
  .action((file, options) => {
    done = true
    fs.readFile(file, (err, data) => {
      if (err) {
        console.log('[FATAL] There was an error while reading the file:', err)
      } else {
        cpu = new LC2(cli.debug)
        cpu.turnOn()
        // Start catching key events from STDIN and pass them to the onRead
        process.stdin.setRawMode(true)
        process.stdin.on('data', onRead)
        // Convert Buffer to Uint16Array
        var arr = new Uint16Array(data.length / 2)
        for (var i = 0; i < data.length; i += 2) {
          // arr[i / 2] = (data[i + 1] << 8) | data[i] // Little endian
          arr[i / 2] = (data[i] << 8) | data[i + 1] // Big endian
        }
        if (options.step && !cli.debug) console.log('[WARNING] Step By Step enabled, but debug mode disabled!')
        console.log('Loading Program...')
        cpu.loadProgram(arr)
        // Called when the LC-2 program has finished running
        function end () {
          console.log('\n=== REG DUMP ===\n' + cpu.regdump().join('\n'))
          if (options.memDump) console.log('\n\n=== MEM DUMP ===\n' + cpu.memdump(0, 65535).join('\n'))
          process.exit() // workaround for stdin event listener hanging
        }
        if (options.step) {
          // Step by step mode
          console.log('Running Program Step by Step...')
          function cb (finished) {
            if (finished) {
              end()
            } else {
              if (cli.debug) {
                console.log(cpu.regdump().join('\n'))
              }
              onReadCb = () => { cpu.step(cb); reading = true }
              reading = true
              console.log('Press enter to perform next step.')
            }
          }
          cpu.step(cb)
        } else {
          // Run full program
          console.log('Running Program...')
          cpu.run(end)
        }
      }
    })
  })

cli.parse(process.argv)
if (!done) cli.help()
