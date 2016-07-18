let assert = require('chai').assert
let fs = require('fs')
let path = require('path')
let { LC2 } = require('../lib.js')
let { describe, it } = global

describe('Emulator basic test suite', () => {
  let folder = './programs/simple/'
  let files = fs.readdirSync(folder)
  let jsonFiles = files.filter(filename => /\.json/.test(filename))
  let binaries = jsonFiles.map(filename => {
    let objFilename = filename.replace('.json', '.obj')
    let file = fs.readFileSync(path.join(folder, filename), { encoding: 'utf-8' })
    let data = fs.readFileSync(path.join(folder, objFilename))
    return {
      filename: objFilename,
      expectedResult: JSON.parse(file),
      data
    }
  }).map(item => {
    let data = fs.readFileSync(path.join(folder, item.filename))
    // Convert Buffer to Uint16Array
    let arr = new Uint16Array(data.length / 2)
    for (let i = 0; i < data.length; i += 2) {
      // arr[i / 2] = (data[i + 1] << 8) | data[i] // Little endian
      arr[i / 2] = (data[i] << 8) | data[i + 1] // Big endian
    }
    item.binary = arr
    return item
  }).forEach(item => {
    it('should correctly run "' + item.filename + '"', done => {
      let lc2 = new LC2()
      lc2.loadProgram(item.binary)
      lc2.run(() => {
        // Verify result
        for (let i in item.expectedResult.registers) {
          assert.equal(item.expectedResult.registers[i], lc2.gpr[i])
        }
        done()
      })
    })
  })
})
