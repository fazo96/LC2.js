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
        - some missing default subroutines will be implemented shortly, the old version of them is implemented in the stable branch though.
          - support for interrupts
    - debug mode is a little ugly
    - peripheral emulation code incomplete
    - needs more testing
- __Assembler__
    - feature complete with original assembler
    - error handling is not polished yet
    - debug mode is a little ugly
    - needs more testing
- __APIs__
    - undocumented, but mostly complete
- __User Interfaces__
    - Command Line Interface (available as the `lc2` command) done, still unpolished though
    - no graphical user interface or IDE yet

### How to use it

A CLI and the API are available now. In the future I'll make a graphical user
interface for the browser.

#### Command Line Interface

__Notice__: this software is still experimental and also incomplete.
Documentation is also still lacking.

1. clone this repository, then `cd` to its directory
1. run `npm install -g .`
1. use the newly available `lc2` command

The CLI will be available on NPM once a stable release is ready.

#### API

the LC2 emulator and Assembler both offer an API so that you can use them
programmatically. These APIs are not documented yet but will be once a stable,
complete version arrives.

On __node__:

```javascript
// CPU emulator
var LC2 = require('./LC2.js')
var cpu = new LC2()
// Assembler
var Assembler = require('./assembler.js')
var assembler = new Assembler()
// use them! Read the code to figure out the API, in the future proper docs will
// exist.
```

On the __browser__, import `lib/common.js` then the other scripts depending on
which you need. Assembler and LC2 should then be attached to window and
available globally. This has not been tested yet though.

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
