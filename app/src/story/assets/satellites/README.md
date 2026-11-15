# Satellite pictures

Drop the pictures here. The story picks them up by file name (no code change):

| File (any of `.webp` `.png` `.jpg` `.jpeg` `.avif`) | Satellite | Sensor |
|---|---|---|
| `terra` | Terra | MODIS |
| `aqua` | Aqua | MODIS |
| `snpp` | Suomi NPP | VIIRS |
| `noaa20` | NOAA-20 | VIIRS |
| `noaa21` | NOAA-21 | VIIRS |

- Used in chapter 3 (the two crews, large, in front of the map) and chapter 7 (the handover: Terra and Aqua dim, NOAA-21 lights up).
- Until a file exists, the page shows a labelled placeholder with the expected file name. It never shows a made-up picture.
- Edges are faded with a CSS mask, so a picture on a dark background or a cut-out both work. Landscape works best (the placeholder is 16:10; on a phone the crews scene crops to a tall frame).
- Do not use `refs/*_plate.png`: they have the satellite's name and facts baked into the image.
