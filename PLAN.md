# PLAN — MODIS ↔ VIIRS Hotspot Harmonization (NASA Space Apps 2026)

**Challenge:** [Harmonization of MODIS and VIIRS Hot Spots](https://www.spaceappschallenge.org/2026/challenges/modis-and-viirs-hot-spots/)
**Бичсэн:** 2026-11-14, grill session-ий үр дүн. Нэр томьёо: [GLOSSARY.md](GLOSSARY.md).
**Тэмдэглэгээ:** ✅ = багийн баталсан шийдвэр · ⚙️ = default-оор баталсан (санал болгосон хариултыг шууд хэрэглэсэн, эсэргүүцвэл өөрчилнө)

---

## 0. Challenge юу шаардаж байна (албан ёсны текстээс)

- **Гол бүтээгдэхүүн:** harmonized **burning activity calendar**, 2000-аад оны эхнээс өнөөг хүртэлх hotspot-ийн тоо. Аль сар/он хамгийн их, **одоогийн сар vs түүхэн медиан**.
- Хэрэглэгч **бүс + огнооны муж** сонгоно, analytics/visualization татаж авна.
- Шалгуур: *"the sensor of origin no longer matters"*.
- Санал болгосон (заавал биш): hotspot **CSV**, хүртээмжтэй color ramp, газрын зураг дээр AOI зурах / lat-lon, олон жилийн дунджаас anomaly.

## 1. Түүх (нэг өгүүлбэрээр)

> **Baton relay:** MODIS бол 20+ жилийн *санах ой*, VIIRS бол *нүд*. Бид энэ baton-ыг газар дээр, өгөгдлийн түвшинд **Aqua → Suomi NPP → NOAA-20** гэж дамжуулж, нэг тасралтгүй цуваа болгосон бөгөөд MODIS ажиллаж байсан жилүүд дээр Aqua-г сэргээн гаргаж баталгаажуулсан.

"Яагаад одоо" гэдэг нь: Suomi NPP-ийн FIRMS өгөгдөл **2026-11-02**-нд зогссон. Aqua MODIS-ийн шинжлэх ухааны цуглуулалтыг NASA LAADS **~2026-08** гэж төлөвлөсөн (CAMS ~2027-09 гэж бичсэн, эх сурвалжууд зөрж байна). Terra **~2027-01**-д зогсоно.

**Шагналын чиглэл ✅:** Best Use of Data. Demo + Harmonize хуудас: "3 platform × 23 жил → нэг автомат pipeline → нэг цуваа, Aqua LOYO-оор баталгаажуулсан". Боловсруулсан өгөгдлийн **бодит хэмжээг pipeline-аас** гаргаж харуулна.
**Хэрэглэгчийн өнцөг ✅:** аймгийн anomaly-г "Энэ сард танай аймагт гал хэвийнээс X дахин их" гэж малчин, онцгой байдлын албанд ойлгомжтой хэлбэрээр.

---

## 2. Шийдвэрүүд ба үндэслэл

### D1 ✅ Harmonization бол газар дээрх өгөгдлийн ажил, satellite tasking биш (Q1)
- **Баримт:** MODIS (Terra/Aqua), VIIRS (S-NPP/NOAA-20/21) нь тогтмол sun-synchronous тойрог замтай, чиглүүлэх боломжгүй. Swath бүхэлдээ scan хийдэг (MODIS ~2330 км, VIIRS ~3060 км). Хиймэл дагуулууд хоорондоо өгөгдөл солилцдоггүй. VIIRS MODIS-ийн харсан бүх газрыг аль хэдийн хардаг.
- Анхны "MODIS → VIIRS руу дамжуулж, VIIRS тийш очно" санааг Harmonize хуудсанд **"яагаад ингэж болохгүй, тиймээс бид ингэсэн"** гэсэн нэг өгүүлбэр болгон үлдээнэ.

### D2 ✅ Calendar-ийн нэгж = **Aqua MODIS-equivalent hotspot count** (Q2)
- "Aqua MODIS ажилласаар байсан бол хэдэн hotspot тоолох байсан бэ." Түүхэн MODIS өгөгдлийг өөрчлөхгүй, зохиохгүй.
- **Raw view toggle** заавал байна: 2012 оны үсрэлтийг харуулна.

### D3 ✅ Reference chain: **Aqua → Suomi NPP → NOAA-20**, нэг мөчид нэг platform (Q3)
| Хугацаа | Тоолох platform | Харьцуулалт |
|---|---|---|
| 2003-01-01 → 2012-01-19 | Aqua | × 1 |
| 2012-01-20 → 2026-11-02 | Suomi NPP | × r₁(сар) |
| 2026-11-02 → өнөөг хүртэл | NOAA-20 | × r₁(сар) × r₂ |
- Давхар тоолохгүй, шилжилт бүр calibrate хийгдсэн. **NOAA-21 ашиглахгүй** (NOAA-20-ийн нөөц).
- **Чиглэлийн нэг тодорхойлолт ✅:** `r = Σ(өмнөх platform) / Σ(дараагийн platform)`, `harmonized = дараагийн platform-ын тоо × r`.

### D4 ✅ Calendar 2003-01-01-нээс эхэлнэ, Terra→Aqua ratio хийхгүй
- Aqua 2002-05-04-нд хөөргөгдсөн (MODIS Fire User Guide §8.1.2). FIRMS дээрх Aqua-ийн эхний өдрийг `data_availability`-аар шалгана.
- Terra өглөө (~10:30), Aqua үдээс хойш (~13:30) гатлах тул Terra/Aqua ratio бүс, улирлаас хүчтэй хамаарна, нэмэлт ердөө 2 жил. 2003 оноос эхлүүлбэл "хамгийн их шатсан он"-ы жагсаалтад хагас жил орохгүй. Terra нь globe болон Raw view-д харагдсаар байна.

### D5 ✅ Calibration window r₁: **2012-01-20 → 2021-12-31**
- **Баримт:** Aqua 2021-12-д drag-makeup маневраа дуусгаж, **2022-01-ээс** A-Train-ээс гарч чөлөөтэй drift хийж эхэлсэн. Гатлах цаг нь 2026 оны сүүлд ~13:30 → ~15:30 болно.
- Diagnostic: жил бүрийн Aqua vs S-NPP `acq_time`-ийн зөрүүний график (drift-ийг өөрсдийн өгөгдлөөр харуулна).
- r₂ window: 2018-04-01 → 2026-11-02 (NOAA-20 ба S-NPP хоёулаа VIIRS, ~50 мин зайтай).

### D6 ✅ Газарзүйн хамрах хүрээ: **Монгол + ~500 км хилийн бүс** (Q4)
- Bbox ⚙️ ойролцоогоор **W85, S37, E127, N56**: Алтай, Тува, Буриад, Өвөрбайгаль, Өвөр Монгол, Хойд Шинжааныг хамарна.
- Hotspot бүрийг "Монгол / Орос (хилийн бүс) / Хятад (хилийн бүс)" гэж шошголно. Globe-ийн бусад хэсэг "demo-д ороогүй" гэж бүдэг харагдана.
- **Калифорни = nice-to-have** (pipeline-ийг өөр bbox дээр дахин ажиллуулна, кодын өөрчлөлтгүй).

### D7 ✅ Ratio: сар бүрийн pooled ratio + fallback (Q5)
- r₁(m) = Σ_window Aqua(m) / Σ_window S-NPP(m), **жилийн ratio-уудын дундаж биш**.
- Тухайн сард matched/тоо цөөн бол (⚙️ < 30 fire unit) жилийн нэг ratio руу шилжинэ.
- **r₂ = нэг тоо.** Sanity check: r₂ ≈ 1 байх ёстой (ижил sensor). ⚙️ ±15% дотор байвал хэвийн, хэтэрвэл шалтгааныг судална (~50 мин зай + өдрийн галын идэвхийн өөрчлөлт). Шууд "алдаа" гэж дүгнэхгүй.
- **Diagnostic:** улсаар (MN/RU/CN) ratio, **day/night ratio**. Ялгаа их бол 24 ratio (сар × day/night) руу шилжих эсэхийг D10-ын тестээр шийднэ.
- Тайлбарт ашигласан "хавар 1 MODIS = 4.1 VIIRS, зун 2.3" гэх тоонууд **зөвхөн жишээ**. Бодит тоог өгөгдлөөс гаргана.

### D8 ✅ Match class: 4 анги (Q6)
- **Both / MODIS only / VIIRS only / Not comparable (саарал)**. Ямар ч hotspot-ыг устгахгүй.
- Match дүрэм: VIIRS hotspot-ийн төв MODIS пикселийн `scan × track` тэгш өнцөгтийн дотор (+ VIIRS-ийн хагас пикселийн buffer) орсон, |Δt| ≤ 60 мин, day/night ижил.
- **"Харж байсан" proxy:** нөгөө platform тэр Δt цонхонд R км радиус дотор ≥1 hotspot илрүүлсэн байх. Хангаагүй бол → Not comparable.
- **R бол параметр (100 / 300 / 500 км) ✅.** Тус бүрээр Not comparable-ийн эзлэх хувийг гаргаж, сонгосон утгаа үндэслэлтэйгээр энд нөхөж бичнэ. *(Нээлттэй, өгөгдлөөс шийднэ.)*
- Тоолох нэгж: MODIS талд **пиксел**, VIIRS талд **fire unit** (H3 res 8 × overpass).
- **Хоёр чиглэлээр тайлагнана:** P(VIIRS | MODIS) ба P(MODIS | VIIRS). "Both" хувь бол ratio-гийн **sanity check**, бие даасан нотолгоо биш.
- Ratio нь нийт тоогоор тооцогддог тул matching-ийн алдаа calendar-т нөлөөлөхгүй, зөвхөн визуал ба sanity check-т нөлөөлнө.

### D9 ✅ VIIRS-ийн нэгж: **H3 res 8 × overpass = fire unit** (Q7)
- H3 нь **ойролцоогоор** тэнцүү талбайтай (~0.74 км²), яг тэнцүү биш. 0.01° grid-ийг ашиглахгүй, учир нь 37°–56°N хооронд талбай нь ~30% зөрнө.
- Нүдний яг хэмжээ ratio-д шингэдэг. Хамгийн чухал нь бүх хугацаанд тогтвортой байх.
- **Python `h3` ба `h3-js` хоёуланг v4 дээр тогтоож**, ижил координатад ижил cell ID гарч байгааг шалгах тест бичнэ.
- Overpass-ийн тодорхойлолт ⚙️: ижил platform + `acq_date` + `acq_time` ±10 мин. Header-ийг шалгасны дараа эцэслэнэ.
- Sensitivity ⚙️: res 7-оор нэг удаа ажиллуулж ratio-гийн тогтвортой байдлыг шалгана (nice-to-have).

### D10 ✅ Баталгаажуулалт: гол нотолгоо = **Aqua reconstruction** (Q8)
1. **LOYO (r₁):** 2012–2021-ээс нэг жил хасаж, үлдсэнээр r₁ тооцно → тэр жилийн S-NPP × r₁-ийг жинхэнэ Aqua-тай сар бүрээр харьцуулна. 10 удаа давтана.
2. **Forward тест:** 2012–2018-аар calibrate хийж, 2019–2021 дээр шалгана. LOYO-той зэрэгцүүлж тайлагнана.
3. **"Бүх жилд нэг ratio" baseline**-тэй харьцуулж сарын ratio илүү эсэхийг тоогоор батална. Day/night шийдвэрийг мөн ингэж гаргана.
4. **r₂ LOYO:** бүтэн жилүүд **2019–2025** дээр, NOAA-20 × r₂ → S-NPP-г сэргээн гаргана. Хагас жилүүд (2018, 2026) зөвхөн ratio тооцоонд орно.
- **Метрик:** **WAPE** = Σ|алдаа| / Σбодит (MAPE биш, өвлийн бага тоотой саруудаас болж гажихгүйн тулд) + correlation.
- **Bootstrap** (жилүүдээр resample хийх) ratio бүрийн тодорхойгүй байдал → **nice-to-have-ийн хамгийн эхэнд**.
- **Тест муу гарвал нуухгүй**, PLAN болон demo-д шударгаар харуулна.

### D11 ✅ Таамаглал (Prediction) салаа (Q9, Q10)
- **Түвшин 1 (MVP): Baseline.** Сар бүрийн harmonized тооны **медиан** + хэвийн хүрээ **P25–P75**. Хоёуланг **interpolate хийдэггүй quantile (`method="lower"`)**-аар тооцно, ингэснээр log1p-тэй яг солигдоно: median(log1p x) = log1p(median x). Reference жилүүд = тухайн мөчөөс өмнөх бүх бүтэн жил (UI-д 2003–2025). Calendar дээр ирэх саруудыг тасархай нүдээр харуулна.
- **Түвшин 2 (MVP+): Log-anomaly persistence.**
  `log1p(дараа сар) = b(дараа сар) + β × (log1p(энэ сар) − b(энэ сар))`, b = log1p(baseline), **бүс бүрд нэг β**.
  - Бүсүүд (тогтмол, урьдчилан тооцно): Монгол, Орос (хилийн бүс), Хятад (хилийн бүс), **Монголын 22 нэгж** (21 аймаг + Улаанбаатар). Дурын AOI дээр зөвхөн Түвшин 1 харагдана.
  - **Rolling-origin тест:** 2015–2025 он бүрийг (Y) түүнээс өмнөх бүх жилээр сургаж таамаглана. **Leakage-аас сэргийлж Y бүрд r₁-ийг зөвхөн Y-ээс өмнөх overlap жилүүдээр дахин тооцно.**
  - **Kill criterion (үр дүнг харахаас өмнө тохирсон):** (WAPE_baseline − WAPE_model) / WAPE_baseline ≥ **0.05 (харьцангуй 5%)** **БӨГӨӨД** β-ийн bootstrap интервал 0-ийг агуулахгүй. Хангахгүй бүсэд таамаглал харуулахгүй, зөвхөн "хэвийн хүрээ" харуулна.
  - Raw vs harmonized: яг ижил загварыг raw цуваан дээр сургаж алдааг харьцуулна. Энэ нь **demo-д зориулсан дэмжих нотолгоо**, гол нотолгоо биш.
- **MVP+: Aqua-ийн түүхэн давтамжийн heatmap.** 2003–2025, зөвхөн Aqua, H3 res 5 ⚙️, "гал гарсан өдрийн тоо / жил". Таамаглал биш, тодорхойлох зураг.
- **Түвшин 3 (цаг агаар + ML + H3 магадлал) = Future work ✅.** Кодоор хийхгүй. "Бидний harmonized цуваа = ирээдүйн ML-ийн label" гэсэн мессеж болгоно.

### D12 ✅ Harmonize hero визуал: **хоёр globe + scrubber** (Q11)
- Зүүн **Raw**, баруун **Harmonized**, **ижил камер** (sync), ижил бүс. Hex = H3 res 5, өндөр/өнгө = жилийн тоо. Доор нь 2003 → 2025 scrubber + globe бүрийн доор жижиг шугаман график.
- **Raw globe дээр VIIRS-ийг түүхий пикселийн тоогоор ✅** харуулна (fire unit биш), ингэснээр үсрэлт шударга, бүрэн харагдана. Шошго: "түүхий пиксел".
- Hex бүрт бүсийн сарын ratio хэрэглэж байгаа нь **ойролцоолол** гэдгийг UI дээр жижиг тэмдэглэлээр бичнэ ✅.
- Дараалал: үсрэлт тэгширнэ → Түвшин 1–2 таамаглал гарна → "3 platform · 23 жил · N сая hotspot → 1 цуваа" + Aqua LOYO WAPE.
- **Нөөц ✅:** Raw vs Harmonized **calendar heatmap**-ийг зэрэгцүүлж Harmonize хуудасны доод хэсэгт "For scientists" нэрээр харуулна. WebGL ажиллахгүй эсвэл FPS бага үед автоматаар энэ рүү шилжинэ.
- Тэмдэглэл: нэг globe-ийг зураасаар хуваахгүй, учир нь хоёр тал өөр газар харуулах бөгөөд "harmonized цэг" гэж байдаггүй.

### D13 ✅ Нүүр хуудасны Method хэсэг
- Зүүн багана: дугаарласан **pipeline алхмууд** (§3). Баруун багана: дугаарласан **баталгаажуулалтын тестүүд** (LOYO, forward, нэг-ratio baseline, r₂ LOYO).

### D14 ✅ Case study
- Нэг бодит түүхэн түймрийг **өгөгдлөөс скриптээр** сонгоно ⚙️: Монгол дотор, 2012–2021 (хоёр sensor хоёулаа ажиллаж байсан, match class харагдана), harmonized сарын anomaly хамгийн өндөр. Нэр, огноог албан ёсны/мэдээний эх сурвалжаар баталгаажуулсны дараа л нэрлэнэ. Хэнийг ч буруутгахгүй.

---

## 3. Data pipeline (Python → статик JSON)

1. **Татах ⚙️:** FIRMS Area API, `MODIS_SP` (Terra+Aqua, `satellite` баганаар ялгана), `VIIRS_SNPP_SP`, `VIIRS_NOAA20_SP` + SP хоцрогдсон сүүлийн саруудад `_NRT`. `DAY_RANGE ≤ 5`. Resumable, throttled, CSV/Parquet-ээр cache хийнэ.
   - **Баримт:** манай bbox-д хүсэлт бүр MODIS = 3, VIIRS = 10 transaction. Нийт ~3,400 хүсэлт / ~22,000 transaction. Түгээмэл хязгаар 5,000/10 мин (MAP_KEY status-аар батална) → ~45–60 мин.
   - **Нөөц:** FIRMS Country Yearly Summary zip (хүлээлтгүй, шууд татна; MODIS ~65–90 MB/жил, S-NPP ~300–385 MB/жил; зөвхөн SP).
   - Archive Download (email-ээр ирдэг) хүсэлт **илгээх шаардлагагүй**.
2. **Header audit:** бодит багана, platform, огнооны хүрээ, мөрийн тоо (`docs/data_audit.md`).
3. **Шүүлт ⚙️:** SP-д `type == 0` (ургамлын гал), байнгын дулааны эх үүсвэрийн (ДЦС, уурхай) mask-ыг toggle хэлбэрээр хийнэ, чимээгүй устгахгүй. VIIRS SP-д `type` багана байгаа эсэхийг header-ээс шалгана. NRT-д `type` байхгүй бол SP жилүүдээс гаргасан байнгын нүдний mask хэрэглэнэ.
4. **Нэгж:** MODIS = пиксел. VIIRS = fire unit (H3 res 8 × overpass). Raw VIIRS пикселийн тоог тусад нь хадгална.
5. **Шошго:** улс (Natural Earth), аймаг (geoBoundaries), day/night, platform.
6. **Ratio:** r₁(сар) + fallback, r₂, diagnostic-ууд (улс, day/night, drift).
7. **Harmonized сарын цуваа:** бүс бүрд (22 нэгж + 3 улс + bbox), мөн H3 res 5 × жил (globe-д).
8. **Baseline + Түвшин 2 + kill criterion.**
9. **Match class** (R = 100/300/500).
10. **Validation:** D10-ын бүх тест → `validation.json` + график.
11. **Pipeline stats:** хэдэн мөр, platform, жил → demo-гийн тоонууд (**тоо бүр зөвхөн скриптээс**).

**Өгөгдлийн гэрээ (JSON) ⚙️:** `regions.json` · `calendar/{region}.json` (сар × он: harmonized, raw platform тус бүрээр, baseline, P25–P75, forecast, flags) · `ratios.json` · `validation.json` · `hex_year/{raw,harm}.json` · `matches_summary.json` · `case_study.json` · `pipeline_stats.json` · `satellites.json` (TLE snapshot + metadata + эх сурвалж).

## 4. App (Vite + React + TS) ⚙️

- **Stack ✅:** `react-globe.gl` (three-globe) + `satellite.js`. CelesTrak-ийн бодит TLE-г build хийх үед snapshot болгоно. Demo-гийн үед live API дуудахгүй, **MAP_KEY client-д огт орохгүй**, бүх өгөгдөл статик JSON.
- **Нүүр:** хар сансар + жижиг одод, 3D globe, **5 platform** (Terra, Aqua = MODIS өнгө; S-NPP, NOAA-20, NOAA-21 = VIIRS өнгө), dotted тойрог зам, ижил sensor-тэй platform-уудыг **нарийн зураасаар** холбоно ✅. Анхаар: Aqua + 3 VIIRS бараг нэг хавтгайд явдаг тул тойрог замууд нь давхцана. Harmonize товч, Method хэсэг.
- **Hover ⚙️:** platform, sensor, хөөргөсөн огноо, **манай өгөгдөл дэх сүүлийн илрүүлэлтийн огноо**, албан ёсны статусын мөр (эх сурвалжийн линктэй). "Одоо ажиллаж байна"-г гараар бичихгүй.
- **Satellite хуудас ⚙️:** зураг (NASA, credit-тэй), sensor, ажилласан хугацаа, bbox дахь hotspot-ийн тоо (жилээр), reference chain дахь үүрэг. **"Арга хэмжээ авч мэдээлэл дамжуулж чадсан уу" гэсэн хэсгийг хасна:** өгөгдлийн эх сурвалж байхгүй, зохиохгүй.
- **Бүс/галын түүх:** globe дарахад зүүн тийш шилжиж zoom хийнэ. Хажууд нь гал гарсан онууд, он дээр дарахад тухайн оны газрууд, газар дээр дарахад дэлгэрэнгүй мэдээлэл. Scroll хийхэд ⚙️ камер **bbox дотор тухайн оны хамгийн том галын бүс рүү** нисч ("дэлхий эргэх" мэдрэмж), энэ бүсийг өгөгдлөөс тооцно. `prefers-reduced-motion` үед анимацгүй.
- **Hotspot дэлгэрэнгүй ⚙️:** FIRMS атрибутууд (platform, огноо/цаг, `frp`, confidence, `scan × track`, match class) + **NASA GIBS**-ийн тухайн өдрийн true-color зураг (layer нэрийг шалгана). "Чийгшил, уулын нягтаршил" зураг FIRMS-д **байхгүй** тул харуулахгүй.
- **Uncertainty дүрс ✅/⚙️:** пикселийн footprint `scan × track` тэгш өнцөгт. Зөвхөн zoom хийсэн, нэг он сонгосон үед зурна, бүгдийг нэг дор зурахгүй.
- **Calendar ⚙️:** сар × он, харагдах байдал нь хүртээмжтэй sequential ramp (cividis төст). Raw view toggle. **Одоогийн бүрэн бус сар:** "сарын эхний N хоног, ижил хугацааны медиантай харьцуулав". **NOAA-20-оор тооцоолсон хэсэг** (2026-11-02-ноос) тасархай хүрээгээр ялгагдана. AOI сонголт (аймаг / зурах / lat-lon), огнооны муж, **CSV татах** (hotspot + calendar).
- **Anomaly хэллэг ⚙️:** "Энэ сард танай аймагт гал хэвийнээс X дахин их". Baseline < 5 fire unit бол "Энэ сард ихэвчлэн бараг гал гардаггүй. Энэ жил: N" гэж бичнэ. Бүх мессежид "**Мэдээллийн зорилготой, албан ёсны сэрэмжлүүлэг биш**" гэсэн тэмдэглэл байна.
- **Sticky bar (баруун, 30–40 px) ⚙️:** дээрээс доош Сансар (нүүр/хиймэл дагуул) → Гадаргуу (бүс/calendar) → Цөм (Method/For scientists). Scroll-ын байрлалыг харуулж, дарахад тухайн хэсэг рүү шилжинэ.
- **Хоосон төлөв гаргахгүй ✅:** өгөгдөл app-тай хамт статик байдлаар ирнэ. Ачаалж байх үед skeleton харуулна. Гал огт байгаагүй бүсэд бодит өгүүлбэр ("2003 оноос хойш энэ бүсэд hotspot бүртгэгдээгүй") харуулна. Хэзээ ч "N/A" эсвэл хоосон график харуулахгүй.

## 5. Scope

| Түвшин | Юу |
|---|---|
| **MVP** | Pipeline 1–11 (bbox, chain, сарын r₁ + fallback, r₂) · Aqua LOYO + forward + нэг-ratio baseline + r₂ LOYO · Calendar + Raw toggle + AOI (аймаг) + огнооны муж + CSV · Түвшин 1 baseline · Нүүрний globe + 5 platform + hover · Harmonize: хоёр globe + scrubber + calendar нөөц · Method хэсэг · Case study · Хоосон төлөвгүй fallback |
| **MVP+** | Түвшин 2 таамаглал + rolling-origin + kill criterion · Aqua давтамжийн heatmap · Match class 4 өнгө + R sweep · Satellite хуудас · Scroll-оор камер нисэх · Hotspot дэлгэрэнгүй + GIBS зураг · Sticky bar |
| **Nice-to-have** | (1) **Bootstrap** · day/night 24 ratio · H3 res 7 sensitivity · AOI зурах / lat-lon · Калифорни · Uncertainty тэгш өнцөгт |
| **Future work** | Түвшин 3 (цаг агаар + ML + H3 магадлал) · TLE-ээр жинхэнэ overpass/үүл тооцох · Land cover-оор ratio |
| **Хассан** | Satellite tasking санаа · "Арга хэмжээ авч мэдээлэл дамжуулсан" мэдээлэл · Чийгшил/уулын зураг · Бүх дэлхийн өгөгдөл · Америк руу scroll хийх (Калифорни нэмэгдвэл буцаана) |

## 6. Demo (1 минут) ⚙️

1. **0–10 с:** Нүүр. Globe дээр 5 platform эргэлдэнэ. "MODIS 23 жил ажиллаад одоо зогсож байна. S-NPP 12 хоногийн өмнө зогссон."
2. **10–25 с:** Harmonize. Хоёр globe, scrubber 2012-ыг давахад Raw globe "гэрэлтэнэ", Harmonized globe тэгш хэвээр. Тоонууд: "3 platform · 23 жил · N сая hotspot → 1 цуваа".
3. **25–40 с:** Нотолгоо. "MODIS ажиллаж байсан жилүүдэд бид Aqua-г WAPE X%-ийн алдаатай сэргээн гаргасан."
4. **40–55 с:** Case study аймаг: calendar, "энэ сард хэвийнээс X дахин их", CSV татах.
5. **55–60 с:** "Энэ цуваа бол ирээдүйн fire-risk ML-ийн label" + limitation-ийн нэг өгүүлбэр.

## 7. Pitch-ийн дүрэм ✅
- Хэт их амлахгүй ("эхний", "аврах", "урьдчилан сэргийлнэ" гэх үг хэрэглэхгүй). Тоо бүрийг скриптийн гаралтаас авна.
- Limitation-ыг шударгаар хэлнэ (§8). Тест муу гарвал түүнийгээ харуулна.

## 8. Limitations (PLAN + UI + pitch)
- Ratio нь bbox-ийн сарын дундаж тул hex/аймаг бүрт хэрэглэх нь ойролцоолол. Галын төрлөөс хамаарсан ялгаа үлдэнэ.
- **Not comparable proxy:** ганц, тусгаар гал элбэг тал хээрт нөгөө sensor-ийн "харж байсан" нотолгоо олдохгүй тул жинхэнэ мэдрэмжийн ялгаа саарал ангид живэх эрсдэлтэй. Үүл ба утааг ялгадаггүй.
- Pooled ratio-г нэг онцгой жил давамгайлж болно (bootstrap хийвэл ил гарна).
- 2026-11-02-ноос хойш r₁ × r₂ хуримтлагдсан тодорхойгүй байдал (NOAA-20-ийн хэсгийг ялгаж харуулна).
- Aqua/Terra-ийн тойрог замын drift. NRT өгөгдөл ~5 сарын дараа SP-ээр солигдоно.
- Хил: geoBoundaries 2017.

## 9. Нээлттэй асуудлууд
1. **Өгөгдөл:** дискэнд FIRMS файл олдсонгүй. Өгөгдөл хаана байгаа вэ, эсвэл API-аар шинээр татах уу?
2. **`FIRMS_MAP_KEY`** тохируулагдаагүй. Хүлээн авч `.env`-д хийнэ (commit хийхгүй). Transaction-ий хязгаарыг key-ийн status-аар батална.
3. **Хакатон дуусах цаг** (11-р сарын 15, хэдэн цагт?) → feature freeze ⚙️ = дуусахаас 4 цагийн өмнө.
4. Багийн бүрэлдэхүүн (хүний тоо, нэр) → §10-ын lane-уудад хуваарилна.
5. Өгөгдөл ирсний дараа: Aqua-ийн FIRMS-ийн эхний огноо, VIIRS SP-д `type` багана байгаа эсэх, overpass-ийн цонх, R (100/300/500), ratio-ууд, bbox-ийн эцсийн хил.
6. Aqua MODIS одоо ажиллаж байгаа эсэх (NASA LAADS ~2026-08 vs CAMS ~2027-09). Өгөгдлийн сүүлийн огноогоор шийднэ.
7. GIBS layer нэрс, NASA хиймэл дагуулын зургийн лиценз/credit.

## 10. Багийн lane-ууд ⚙️ (нэрийг нөхнө)
| Lane | Эзэмшинэ | Зэрэгцэх нөхцөл |
|---|---|---|
| **L1 Data/Science** | `/pipeline`: татах, audit, шүүлт, ratio, validation, JSON гэрээ | Эхний 1 цагт JSON schema + **"SYNTHETIC" гэж шошголсон** жижиг fixture гаргаж бусдыг блоклохгүй |
| **L2 Globe** | Нүүрний globe, 5 platform + TLE, hover, хоёр globe sync, scrubber | Fixture-ээр ажиллана |
| **L3 App UI** | Calendar, AOI, CSV, бүсийн view, Method, satellite хуудас, sticky bar, fallback | Fixture-ээр ажиллана |
| **L4 Story/QA** | Case study-ийн эх сурвалж, MN/EN текст, demo script, limitation, credit/лиценз, бодит төхөөрөмж дээр тест | Pipeline-ийн тоог скриптээс авна |

Synthetic fixture-ийг **зөвхөн UI scaffolding-д** ашиглана. Demo-д fixture хэзээ ч харагдахгүй (`MOCK=false` шалгалт).

## 11. Эх сурвалж
- [Challenge page](https://www.spaceappschallenge.org/2026/challenges/modis-and-viirs-hot-spots/)
- [FIRMS API — Area](https://firms.modaps.eosdis.nasa.gov/api/area/) · [FIRMS Archive Download](https://firms.modaps.eosdis.nasa.gov/download/) · [Country Yearly Summary](https://firms.modaps.eosdis.nasa.gov/country/)
- [Transitioning from Suomi NPP (Earthdata)](https://www.earthdata.nasa.gov/news/blog/transitioning-from-suomi-npp-viirs-omps-what-firms-users-need-know)
- [MODIS to VIIRS Transition (LAADS)](https://ladsweb.modaps.eosdis.nasa.gov/learn/modis-to-viirs-transition) · [CAMS: Drifting away from MODIS](https://atmosphere.copernicus.eu/drifting-away-modis-cams-global-fire-assimilation-system)
- [Aqua Status March 2022](https://aqua.nasa.gov/sites/default/files/AquaStatus_March2022.pdf) · [Terra orbit drift poster (NTRS)](https://ntrs.nasa.gov/citations/20250000522)
- [MODIS C6/C6.1 Fire User Guide](https://earthdata.nasa.gov/s3fs-public/2023-09/MODIS_C6_C6.1_Fire_User_Guide_1.0.pdf)
- [geoBoundaries MNG ADM1 (ODbL, © OpenStreetMap contributors)](https://www.geoboundaries.org/api/current/gbOpen/MNG/ADM1/)
