# Third-party notices

This repository contains a frozen reference HTML file that bundles third-party
code. The PolyForm Noncommercial licence in `LICENSE` covers the original work
in this repository only. The components below remain under their own licences,
and their notices are reproduced here as those licences require.

The reference file also loads three font families at runtime from Google Fonts
(Reem Kufi, IBM Plex Sans Arabic, IBM Plex Sans). Those fonts are **not**
included in this repository; they are distributed by Google under the SIL Open
Font License 1.1. The app still works without them, falling back to local
system fonts.

---

## Three.js r128

The reference embeds a minified build of Three.js, revision 128
(`THREE.REVISION === '128'`, `reference/parti-pris-three.js.html` line 1988),
including the `OrbitControls` addon. Both are MIT licensed.

```
The MIT License

Copyright © 2010-2021 Three.js Authors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```

Upstream: <https://github.com/mrdoob/three.js>

---

## OrbitControls

`OrbitControls` is part of the Three.js examples and is distributed under the
same MIT licence and copyright shown above. It is embedded in the reference at
`reference/parti-pris-three.js.html` lines 1990–3035.

Upstream: <https://github.com/mrdoob/three.js/blob/r128/examples/js/controls/OrbitControls.js>

---

## Scope of the repository licence

`LICENSE` (PolyForm Noncommercial 1.0.0) applies to original code, documents and
assets created for this project. It does **not** relicense the third-party
components above, and it does not impose any restriction beyond MIT on them.
