# 02 — Geometry authoring: walls with real holes

## Read

| Path | What to learn |
| --- | --- |
| `src/core/BufferGeometry.js` | position/normal/uv attributes, index, `computeVertexNormals` |
| `src/extras/core/Path.js`, `Shape.js` | contours and holes |
| `src/geometries/ShapeGeometry.js` | triangulation of a shape with holes |
| `src/geometries/ExtrudeGeometry.js` | depth, bevel, curve segments |
| `manual/pages/custom-buffergeometry.html` | building attributes by hand |

## The technique

A wall is not four boxes around a window. It is one planar surface with holes:

```js
const shape = new THREE.Shape();
shape.moveTo(0, z0); shape.lineTo(L, z0); shape.lineTo(L, z0 + h); …
openings.forEach(o => {
  const hole = new THREE.Path();
  hole.moveTo(a, v0); hole.lineTo(a, v1); hole.lineTo(b, v1); …
  shape.holes.push(hole);
});
```

Then map the geometry into world space and assign UVs from the **wall length**,
not from each triangle:

```js
uv.setXY(i, (u0 + localX) / TEX_M, localY / TEX_M);   // TEX_M = 2 m
```

This is what keeps stone courses continuous across the whole façade and lets the
frame sit back in a 0.2 m reveal.

## Build — `labs/02-wall-holes`

A wall builder with arbitrary openings, inset by 3 mm so coplanar edges do not
z-fight, and a UV check.

## Prove

- hole count equals the openings supplied
- no triangle centroid lies inside a hole (topological check, not a visual one)
- UVs are exactly `world / TEX_M` at every vertex
- bounding box equals the wall length/height

## Notes

- Shape holes must wind opposite to the outer contour.
- `ShapeGeometry` is non-indexed; triangle count = `position.count / 3`.
- Current Three.js has `ShapeUtils` and earcut internally; keeping holes simple
  (convex, non-overlapping) avoids triangulation artefacts.
- In r128 UVs are `Vector2` attributes with no color-space metadata.
