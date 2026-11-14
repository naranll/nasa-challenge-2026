# Words used in the tickets

Short meanings. Read this first if a word is new.

| Word | Meaning |
|---|---|
| **Hotspot** | One satellite pixel that shows fire heat. One fire usually has many hotspots. |
| **Platform** | The satellite itself (Terra, Aqua, Suomi NPP, NOAA-20, NOAA-21). |
| **Sensor** | The camera on the satellite. MODIS is on Terra and Aqua. VIIRS is on Suomi NPP, NOAA-20 and NOAA-21. |
| **MODIS / VIIRS** | Two kinds of sensor. MODIS is old and will stop. VIIRS is newer and sees smaller fires, so it counts more. |
| **Harmonize** | Make MODIS-era and VIIRS-era counts comparable on one timeline. We do it on the ground with old data. Satellites do not talk to each other. |
| **Harmonized count** | The number of hotspots that Aqua (MODIS) would have counted. |
| **Raw count** | The number a platform really counted, with no change. |
| **Ratio** | A number that changes one platform's count into another's. Example: old total divided by new total. |
| **Fire unit** | How we count VIIRS: one map cell (H3 size 8) with at least one hotspot, in one satellite pass. |
| **H3** | A way to cut the Earth into hexagon cells. Size 5 is large (for the globe). Size 8 is small (for counting). |
| **FIRMS** | The NASA website where we get the hotspot files. |
| **NRT** | "Near real time." The newest data. It is replaced later by checked data. It has no `type` column. |
| **Baseline** | What is normal for a month: the median and the range from P25 to P75. |
| **Median** | The middle value when numbers are in order. |
| **P25 / P75 / P10 / P90** | Percentiles. P25 means 25 out of 100 values are lower. |
| **Fixture / synthetic** | Fake sample data to build with. Never shown in the final demo. |
| **Contract** | A written description of a JSON file: its names and types. Everyone follows it. |
| **JSON** | A simple text file format for data. The website reads JSON files. |
| **Parquet** | A compact file format for big tables. |
| **MOCK** | A switch. MOCK=true uses fake sample files. MOCK=false uses real files. |
| **LOYO** | Leave one year out. Hide one year, learn from the other years, then predict the hidden year. |
| **Backtest** | Pretend it is an earlier year, forecast, then compare with what really happened. |
| **Leakage** | A mistake: the model sees information from the future. Results become false. |
| **WAPE** | Error measure. Total size of the errors divided by the total real numbers. Smaller is better. |
| **Kill check** | A rule. If the model is not clearly better than the simple baseline, we do not show the forecast. |
| **Feature** | One input to the model, such as last month's count. |
| **TLE** | Orbit data for a satellite. It tells us where the satellite is. |
| **WebGL** | The browser tool that draws 3D. Some phones cannot use it. |
| **Gate (G0, G1, G2, G3)** | A check point in time. G0 = setup ready. G1 = real calendar online. G2 = tests and forecast ready. G3 = freeze (only bug fixes). |
| **Lane (P1 to P5)** | One person's area of work. You only change files in your lane. |
