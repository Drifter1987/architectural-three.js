# Reference — do not edit

`parti-pris-three.js.html` is the **authoritative reference implementation** of
the Parti Pris architectural app. It is kept here byte-for-byte as published,
and it is the only file in this repository that must never change.

- Bytes: **960,097**
- SHA-256: `e1f2a51191bff67c6e0662f04854ef1bc42e4d02b9434f45b9f30f79f30a4cf5`
- Lines: 4,064 (LF only)
- Origin: `https://github.com/Drifter1987/architectural-three.js`
  (`main` @ `318a0cf`, file `parti-pris-three.js.html`)

The original filename was kept. Only its directory changed, from the repo root
to `reference/`. No byte was edited.

## Why the strictness

The whole project is a fidelity study of this file. If the reference can drift,
every comparison, screenshot and measurement becomes meaningless. The hash is
therefore enforced twice:

```bash
npm run verify:reference   # standalone check
npm test                   # fails the suite on any byte change
```

`tests/reference-integrity.test.mjs` asserts the SHA-256, the exact byte length,
the absence of CRLF, and that the old root-level path no longer exists.

`.gitattributes` marks the file `-text` so Git can never apply end-of-line
conversion to it on any platform.

## May I rename it?

Yes — a rename is allowed. Nothing else is: no reformatting, no prettifying, no
"while I'm here" edits, no dependency updates, no comment cleanup. A rename must
be followed by updating `SHA256SUMS` **filename only** (never the hash) and the
path assertions in the tests.

## May I copy code out of it?

Study it, measure it, and reimplement the techniques in original code. Do not
lift the file into the new app, and do not ship it as a product. See the root
`LICENSE` (PolyForm Noncommercial 1.0.0) and `THIRD-PARTY-NOTICES.md`.
