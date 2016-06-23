let assert = require('chai').assert
let fs = require('fs')
let path = require('path')
let { Assembler } = require('../lib.js')
let { describe, it } = global

describe('Assembler "complex programs" test suite', () => {
  let folder = './programs/complex/'
  let files = fs.readdirSync(folder)
  let asmFiles = files.filter(filename => /\.asm$/.test(filename))
  let binaries = asmFiles.map(filename => {
    let file = fs.readFileSync(path.join(folder, filename), { encoding: 'utf-8' })
    let assembler = new Assembler()
    let assembled = assembler.assemble(file)
    let binaryFilename = filename.replace(/\.asm$/g, '.obj')
    return { filename, binaryFilename, binary: assembler.toBinary(assembled) }
  }).map(item => {
    let data = fs.readFileSync(path.join(folder, item.binaryFilename))
    // Convert Buffer to Uint16Array
    let arr = new Uint16Array(data.length / 2)
    for (let i = 0; i < data.length; i += 2) {
      // arr[i / 2] = (data[i + 1] << 8) | data[i] // Little endian
      arr[i / 2] = (data[i] << 8) | data[i + 1] // Big endian
    }
    item.origBinary = arr
    return item
  }).forEach(item => {
    it('should correctly assemble "' + item.filename + '"', () => {
      assert.equal(item.binary.length, item.origBinary.length)
      for (let i = 0; i < item.binary.length; i++) {
        assert.equal(item.binary[i], item.origBinary[i])
      }
    })
  })
})
