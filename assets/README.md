# AutoDemo assets

## Cursor (`cursor.png`)

Place a PNG cursor here as `cursor.png`. The compositor loads it once per render and draws it at logged click/hover positions.

**Hot spot:** AutoDemo defaults to pixel `(4,2)` in the PNG. If your pointer tip is elsewhere, pass `--cursor-hotspot-x` and `--cursor-hotspot-y` (pixels from the top-left of the PNG).

If `cursor.png` is missing, AutoDemo falls back to the built-in vector cursor.