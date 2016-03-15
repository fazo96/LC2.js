# LC2.js

Work in progress LC-2 emulator and debugger implemented in javascript.

LC-2 is an older variant of the [LC-3 computer](https://en.wikipedia.org/wiki/LC-3), both are created for learning purposes.

### What works

Almost nothing, it runs some machine code instructions sometimes without errors.

### How to use it

On __node__:

```javascript
var LC2 = require('LC2.js')
var cpu = new LC2()
// use it!
```

On the __browser__, import the script, then the LC2 object should be attached to window and available globally. This has not been tested yet though.

The code is undocumented for now, and also super short, so take a look to see what you can do

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
