# MODIS–VIIRS Hotspot Harmonization

A web app that merges two generations of satellite fire detections (MODIS, VIIRS) into one consistent burning-activity record, so the sensor a detection came from no longer matters.

## Sensors and detections

**Hotspot**:
One satellite pixel flagged as containing active fire (a thermal anomaly), as published by FIRMS.
_Avoid_: Fire (one fire is usually many hotspots), point, detection event

**Sensor**:
The instrument that produced a hotspot: MODIS (on Terra and Aqua) or VIIRS (on Suomi NPP, NOAA-20, NOAA-21).
_Avoid_: Satellite (a satellite carries a sensor; use "platform" for the satellite)

**Platform**:
The satellite that carries a sensor (Terra, Aqua, Suomi NPP, NOAA-20, NOAA-21).
_Avoid_: Satellite when the specific spacecraft matters

**Pixel footprint**:
The ground area one hotspot pixel actually covers; it is larger than nominal resolution away from nadir. Drawn as the hotspot's uncertainty shape.
_Avoid_: Accuracy radius, error circle

## Harmonization

**Harmonization**:
Making MODIS-era and VIIRS-era hotspot counts comparable on one timeline, done entirely on the ground with archived data. Never implies satellites communicating or being steered.
_Avoid_: Tasking, sensor handoff, satellites sharing data

**Overlap period**:
Any span when two platforms in the reference chain both observed; the part of it used to derive a conversion is the calibration window.

**Calibration window**:
The part of an overlap period trusted for deriving a conversion ratio, e.g. Aqua vs Suomi NPP only before Aqua began drifting.

**Reference chain**:
The single platform that defines the harmonized count at any moment, handed over in time: Aqua → Suomi NPP → NOAA-20. Only one platform contributes at a time, so detections are never double counted.
_Avoid_: Sensor fusion, merged VIIRS

**Harmonized count**:
The calendar's unit: the number of hotspots Aqua MODIS would have recorded. Aqua counts are used as-is; later platforms are converted by chained ratios.
_Avoid_: Fire count, total hotspots

**Conversion ratio**:
How many hotspots the earlier platform in the chain records per hotspot of the later one, pooled over the calibration window (sum ÷ sum, not an average of yearly ratios). Aqua↔Suomi NPP has one ratio per calendar month; Suomi NPP↔NOAA-20 has a single ratio.
_Avoid_: Scaling factor, correction factor

**Overpass**:
One pass of one platform over the area; all hotspots from the same platform at nearly the same acquisition time.

**Fire unit**:
An approximately equal-area ~0.74 km² cell (H3 resolution 8) with at least one VIIRS hotspot in one overpass; the VIIRS side of every count and match. MODIS is counted per pixel.
_Avoid_: 1 km cell, deduplicated hotspot

**Baseline**:
For a calendar month in an area, the median harmonized count over the reference years plus its typical range; what "normal" looks like.
_Avoid_: Average, expected value, prediction

**Backtest arm**:
One training history in the prediction backtest: _raw-all_ (2003 on, each platform's own counts), _raw-VIIRS-only_ (2012 on, Suomi NPP counts) or _harmonized-all_ (2003 on, harmonized counts). All arms are scored on the same Suomi NPP counts; harmonized-all vs raw-VIIRS-only is the comparison that tests whether the MODIS years help.
_Avoid_: Model variant

**Raw view**:
The calendar showing each platform's own uncorrected hotspot counts, so the jumps that harmonization removes are visible.

**Matched hotspot**:
A MODIS hotspot and a VIIRS hotspot judged to be the same fire because they are close in both space and time.

**Match class**:
The label every hotspot in the overlap period gets: _MODIS only_, _VIIRS only_, _Both_ or _Not comparable_ (the other sensor saw no hotspot nearby in the time window, so it probably did not look; PLAN D8). No hotspot is discarded for being seen by only one sensor. The share of _Both_ is a sanity check on the ratio, not independent proof.

**Baton relay**:
The product's story of harmonization: MODIS supplies the long-term memory (the historical baseline), VIIRS continues the record with finer detail after MODIS retires.
