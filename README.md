# LC2.js

Work in progress LC-2 emulator, debugger and IDE implemented in Javascript.

LC-2 is an older variant of the
[LC-3 computer](https://en.wikipedia.org/wiki/LC-3),
both are created for learning purposes.

### Status

- __CPU Emulator__
    - mostly done, 14 out of 16 instructions implemented
    - most other functions implemented
    - not tested much yet
    - no error handling
- __Assembler__
    - can parse instructions (14 out of 16)
    - argument parsing mostly works but is incomplete
    - can't build symbol table or understand labels yet
    - no variable support yet
    - no error handling implemented yet
    - not tested much yet
    - API to compile program not tested yet
- __APIs__
    - APIs to read binaries, write them or assemble programs not done yet
- __User Interfaces__
    - not started yet
- __IDE__
    - not started yet

### How to use it

You can use the existing APIs for now, since there is no UI yet.

On __node__:

```javascript
// CPU emulator
var LC2 = require('./LC2.js')
var cpu = new LC2()
// Assembler
var Assembler = require('./assembler.js')
var assembler = new Assembler()
// use them! Read the code to figure out the API.
```

On the __browser__, import the script, then the LC2 object should be attached to
window and available globally. This has not been tested yet though.

The code is mostly undocumented for now, and also super short, so take a look
to see what you can do while it's still simple :+1:

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
