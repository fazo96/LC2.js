# LC2.js

Work in progress LC-2 emulator, debugger and IDE implemented in Javascript.

LC-2 is an older variant of the
[LC-3 computer](https://en.wikipedia.org/wiki/LC-3),
both are created for learning purposes.

You can find Documentation on the LC-2 in
[this PDF](https://www.cs.utexas.edu/users/fussell/cs310h/simulator/lc2.pdf).

### Status

- __CPU Emulator__
    - finished, except:
      - support for interrupts
      - support for PUTSP subroutine
    - peripheral emulation code is a placeholder for an accurate implementation
    - debug mode is a little ugly
- __Assembler__
    - feature complete with original assembler
    - error handling is nowhere near good enough
    - debug mode is a little ugly
- __APIs__
    - done, not very well documented
- __User Interfaces__
    - Command Line Interface (available as the `lc2` command) done, still unpolished though
    - no graphical user interface or IDE yet

### How to use it

A CLI and the API are available now. In the future I'll make a graphical user
interface for the browser.

#### Command Line Interface

__Notice__: this software is still experimental and also incomplete.
Documentation is also still lacking.

1. run `npm install -g lc2.js`
1. use the newly available `lc2` command

The CLI will be available on NPM once a stable release is ready.

#### API

the LC2 emulator and Assembler both offer an API so that you can use them
programmatically. These APIs are not documented yet but will be once a stable,
complete version arrives.

On __node__, __browserify__ or __webpack__:

```javascript
// CPU emulator
var LC2 = require('lc2.js')
var cpu = new LC2.LC2()
// Assembler
var assembler = new LC2.Assembler()
// use them! Read the code to figure out the API, in the future proper docs will
// exist.
```

Of course you need the `lc2.js` module from npm installed.

On the __browser__, you will need to browserify `lib.js` using browserify,
webpack, or other tools.

### License

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
