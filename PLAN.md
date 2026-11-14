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

**Гол бүтээгдэхүүн ✅ (2026-11-14 23:56 шинэчилсэн):** **ирэх сарын галын таамаглал (ML model)**. Harmonization бол түүний суурь: model 12 биш **23 жилийн** label дээр сурдаг, harmonized түүх таамаглалыг сайжруулдаг эсэхийг backtest arm-аар баталгаажуулна (D11, D15). Challenge-ийн шаардсан harmonized calendar MVP-д хэвээр үлдэнэ.

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
- Challenge hotspot-ийн тоо шаарддаг. Cell-day бол hotspot-ийн тоо биш (`docs/research/harmonization_v0.md`, Limitations 5). v0-ийн тоонууд (0.05° fire cell-day, өдөр, 2013–2022) = **v0 prototype-ын баримжаа**, PLAN-ийн нэгжийн эцсийн тоо биш, pitch-д ашиглахгүй.

### D3 ✅ Reference chain: **Aqua → Suomi NPP → NOAA-20**, нэг мөчид нэг platform (Q3)
| Хугацаа | Тоолох platform | Харьцуулалт |
|---|---|---|
| 2002-07 → 2012-01-19 | Aqua | × 1 |
| 2012-01-20 → 2026-11-02 | Suomi NPP | × r₁(сар, D/N) |
| 2026-11-02 → өнөөг хүртэл | NOAA-20 | × r₁(сар, D/N) × r₂ |
- ⚙️ Эхний мөр 2002-07, r₁(сар, D/N) (2026-11-15, P1-01 өгөгдлөөр). Өмнө нь: Aqua 2003-01-01 → 2012-01-19, × r₁(сар).
- Давхар тоолохгүй, шилжилт бүр calibrate хийгдсэн. **NOAA-21 ашиглахгүй** (NOAA-20-ийн нөөц).
- **Чиглэлийн нэг тодорхойлолт ✅:** `r = Σ(өмнөх platform) / Σ(дараагийн platform)`, `harmonized = дараагийн platform-ын тоо × r`.

### D4 ⚙️ Calendar 2002-07-оос эхэлнэ (2026-11-15, P1-01 өгөгдлөөр) · ✅ Terra→Aqua ratio хийхгүй
- Өмнө нь: ✅ Calendar 2003-01-01-нээс эхэлнэ.
- Aqua 2002-05-04-нд хөөргөгдсөн (MODIS Fire User Guide §8.1.2). ~~FIRMS дээрх Aqua-ийн эхний өдрийг `data_availability`-аар шалгана.~~ **Шийдэгдсэн:** Монгол дахь Aqua-ийн эхний илрүүлэлт **2002-07-05** (`docs/research/data_audit.md`).
- Учир: challenge "early 2000s" гэдэг. v0 prototype-ын баримжаагаар 2002 онд том улирал байсан (зөвхөн 9-р сард 1,836 Aqua cell-day).
- **2002 = бүрэн бус жил.** Baseline (медиан, P25–P75), "хамгийн их шатсан он"-ы жагсаалт, rolling-origin тест зөвхөн бүтэн жилүүдийг (2003-аас) ашиглана.
- Terra өглөө (~10:30), Aqua үдээс хойш (~13:30) гатлах тул Terra/Aqua ratio бүс, улирлаас хүчтэй хамаарна, нэмэлт ердөө 2 жил. Terra нь globe болон Raw view-д харагдсаар байна.

### D5 ✅ Calibration window r₁: **2012-01-20 → 2021-12-31**
- **Баримт:** Aqua 2021-12-д drag-makeup маневраа дуусгаж, **2022-01-ээс** A-Train-ээс гарч чөлөөтэй drift хийж эхэлсэн. Гатлах цаг нь 2026 оны сүүлд ~13:30 → ~15:30 болно.
- Diagnostic: жил бүрийн Aqua vs S-NPP `acq_time`-ийн зөрүүний график (drift-ийг өөрсдийн өгөгдлөөр харуулна).
- v0 нь 2013–2022-ыг ашигласан. 2022 онд Aqua drift хийсэн тул PLAN-ийн window хэвээр.
- r₂ window: 2018-04-01 → 2026-11-02 (NOAA-20 ба S-NPP хоёулаа VIIRS, ~50 мин зайтай).

### D6 ⚙️ Газарзүйн хамрах хүрээ: **MVP = зөвхөн Монгол** (21 аймаг + Улаанбаатар, улсын хэмжээ) (2026-11-15, P1-01 өгөгдлөөр)
- Өмнө нь: ✅ Монгол + ~500 км хилийн бүс (Q4), bbox ⚙️ W85, S37, E127, N56, hotspot бүрд Монгол / Орос / Хятад шошго.
- Учир: challenge бүс сонгохыг шаарддаг, хил дамнасан бүс шаарддаггүй. Монголын өгөгдөл бэлэн (FIRMS Archive Download, buffer 0 км).
- Globe-ийн Монголоос гадна хэсэг "demo-д ороогүй" гэж бүдэг харагдана.
- **Nice-to-have:** Монгол + ~500 км bbox (**W85, S37, E127, N56**: Алтай, Тува, Буриад, Өвөрбайгаль, Өвөр Монгол, Хойд Шинжаан) ба RU/CN (хилийн бүс) шошго.
- **Калифорни = nice-to-have** (pipeline-ийг өөр bbox дээр дахин ажиллуулна, кодын өөрчлөлтгүй).

### D7 ✅ Ratio: сар бүрийн pooled ratio + fallback (Q5)
- r₁(m) = Σ_window Aqua(m) / Σ_window S-NPP(m), **жилийн ratio-уудын дундаж биш**.
- ⚙️ **Day/night тусад нь:** r₁(сар, D/N) = үндсэн хувилбар, fallback = тухайн D/N-ийн жилийн нэг ratio. D/N нийлсэн pooled хувилбар = D10-ын тестэд харьцуулах baseline (2026-11-15, P1-01 өгөгдлөөр). Өмнө нь: r₁(m) D/N нийлсэн, day/night зөвхөн diagnostic.
  - Учир (v0 prototype-ын баримжаа, S-NPP/Aqua cell-day): шөнө **6.08**, өдөр **2.09**.
- v0 prototype-ын баримжаа (S-NPP/Aqua, өдөр): улирлын ratio хавар 1.95, зун 2.50, намар 1.79; жил бүрийн 1.88–2.44 → ratio жилийн дотор өөрчлөгддөг ч жил хооронд тогтвортой.
- Тухайн сард matched/тоо цөөн бол (⚙️ < 30 fire unit) тухайн D/N-ийн жилийн нэг ratio руу шилжинэ.
- **r₂ = нэг тоо.** Sanity check: r₂ ≈ 1 байх ёстой (ижил sensor). ⚙️ ±15% дотор байвал хэвийн, хэтэрвэл шалтгааныг судална (~50 мин зай + өдрийн галын идэвхийн өөрчлөлт). Шууд "алдаа" гэж дүгнэхгүй.
- **Diagnostic:** D/N нийлсэн pooled ratio (baseline), drift. ⚙️ Улсаар (MN/RU/CN) ratio → bbox-той хамт Nice-to-have (2026-11-15, P1-01 өгөгдлөөр). Өмнө нь: улсаар (MN/RU/CN) ratio, day/night ratio, ялгаа их бол 24 ratio руу шилжих эсэхийг D10-ын тестээр шийднэ.
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
- v0 prototype-ын баримжаа (өдөр, 2013–2022): raw hotspot-оор S-NPP/Aqua = 6.17, нэгтгэсэн cell-day-ээр 2.09 → нэгтгэх нь pixel-size-ийн нөлөөг их бууруулдаг.
- **Python `h3` ба `h3-js` хоёуланг v4 дээр тогтоож**, ижил координатад ижил cell ID гарч байгааг шалгах тест бичнэ.
- Overpass-ийн тодорхойлолт ⚙️: ижил platform + `acq_date` + `acq_time` ±10 мин. Header-ийг шалгасны дараа эцэслэнэ.
- Sensitivity ⚙️: res 7-оор нэг удаа ажиллуулж ratio-гийн тогтвортой байдлыг шалгана (nice-to-have).

### D10 ✅ Баталгаажуулалт: гол нотолгоо = **Aqua reconstruction** (Q8)
1. **LOYO (r₁):** 2012–2021-ээс нэг жил хасаж, үлдсэнээр r₁ тооцно → тэр жилийн S-NPP × r₁-ийг жинхэнэ Aqua-тай сар бүрээр харьцуулна. 10 удаа давтана.
2. **Forward тест:** 2012–2018-аар calibrate хийж, 2019–2021 дээр шалгана. LOYO-той зэрэгцүүлж тайлагнана.
3. **"Бүх жилд нэг ratio" baseline**-тэй харьцуулж сарын ratio илүү эсэхийг тоогоор батална. ⚙️ D/N нийлсэн pooled хувилбарыг мөн baseline болгон харьцуулна (2026-11-15, P1-01 өгөгдлөөр). Өмнө нь: Day/night шийдвэрийг мөн ингэж гаргана.
4. **r₂ LOYO:** бүтэн жилүүд **2019–2025** дээр, NOAA-20 × r₂ → S-NPP-г сэргээн гаргана. Хагас жилүүд (2018, 2026) зөвхөн ratio тооцоонд орно.
- **Метрик:** **WAPE** = Σ|алдаа| / Σбодит (MAPE биш, өвлийн бага тоотой саруудаас болж гажихгүйн тулд) + correlation.
  - ⚙️ + жилийн нийт тооны **Spearman rank correlation**: challenge "аль он хамгийн их" гэж асуудаг тул онуудын эрэмбэ хадгалагдаж байгааг хэмжинэ. v0 prototype-ын баримжаа: 0.99 (2026-11-15, P1-01 өгөгдлөөр).
- **Bootstrap** (жилүүдээр resample хийх) ratio бүрийн тодорхойгүй байдал → **nice-to-have-ийн хамгийн эхэнд**.
- **Тест муу гарвал нуухгүй**, PLAN болон demo-д шударгаар харуулна.

### D11 ✅ Таамаглал (Prediction) салаа (Q9, Q10)
- **Түвшин 1 (MVP): Baseline.** Сар бүрийн harmonized тооны **медиан** + хэвийн хүрээ **P25–P75**. Хоёуланг **interpolate хийдэггүй quantile (`method="lower"`)**-аар тооцно, ингэснээр log1p-тэй яг солигдоно: median(log1p x) = log1p(median x). Reference жилүүд = тухайн мөчөөс өмнөх бүх бүтэн жил (UI-д 2003–2025). Calendar дээр ирэх саруудыг тасархай нүдээр харуулна.
- **Түвшин 2 (MVP+): Log-anomaly persistence.**
  `log1p(дараа сар) = b(дараа сар) + β × (log1p(энэ сар) − b(энэ сар))`, b = log1p(baseline), **бүс бүрд нэг β**.
  - Бүсүүд ⚙️ (тогтмол, урьдчилан тооцно): Монгол (улс), **Монголын 22 нэгж** (21 аймаг + Улаанбаатар) (2026-11-15, P1-01 өгөгдлөөр). Өмнө нь: + Орос (хилийн бүс), Хятад (хилийн бүс). Дурын AOI дээр зөвхөн Түвшин 1 харагдана.
  - **Rolling-origin тест:** 2015–2025 он бүрийг (Y) түүнээс өмнөх бүх жилээр сургаж таамаглана. **Leakage-аас сэргийлж Y бүрд r₁-ийг зөвхөн Y-ээс өмнөх overlap жилүүдээр дахин тооцно.**
  - **Kill criterion (үр дүнг харахаас өмнө тохирсон):** (WAPE_baseline − WAPE_model) / WAPE_baseline ≥ **0.05 (харьцангуй 5%)** **БӨГӨӨД** β-ийн bootstrap интервал 0-ийг агуулахгүй. Хангахгүй бүсэд таамаглал харуулахгүй, зөвхөн "хэвийн хүрээ" харуулна.
  - Raw vs harmonized: яг ижил загварыг (Түвшин 1 ба 2) гурван **backtest arm** дээр сургаж, rolling-origin тестээр алдааг харьцуулна. Энэ нь **demo-д зориулсан дэмжих нотолгоо**, гол нотолгоо биш (гол нотолгоо = D10-ын Aqua reconstruction).
    - **raw-all:** 2003–(Y−1), platform бүрийн өөрийн тоо, 2012 оны үсрэлттэй.
    - **raw-VIIRS-only:** 2012–(Y−1), зөвхөн Suomi NPP-ийн өөрийн тоо.
    - **harmonized-all:** 2003–(Y−1), harmonized count.
    - **Нэг зорилт:** гурвуулаа Y жилд Suomi NPP-ийн бодит тоог таамаглана (2015–2025 онд reference chain-ий platform). harmonized-all-ийн гаралтыг Y-ээс өмнөх жилүүдээр тооцсон r₁(сар)-д хувааж Suomi NPP-ийн нэгж рүү буцаана. Метрик = WAPE.
    - **Шийдвэрлэх харьцуулалт = harmonized-all vs raw-VIIRS-only:** MODIS-ийн 2003–2011 оны түүх нь таамаглалыг сайжруулдаг уу (baton relay-ийн шударга шалгалт). harmonized-all > raw-all нь зөвхөн 2012 оны үсрэлт байгааг харуулна, Raw view үүнийг аль хэдийн харуулдаг. Y эрт байх тусам raw-VIIRS-only-д цөөн жил (2015 онд 3) байгаа тул үр дүнг Y бүрээр тайлагнана.
    - Үр дүн ямар ч гарсан нуухгүй. Ялагдвал аль бүсэд тусалдаг, аль бүсэд тусалдаггүйг үнэнээр нь харуулна.
- **MVP+: Aqua-ийн түүхэн давтамжийн heatmap.** 2003–2025, зөвхөн Aqua, H3 res 5 ⚙️, "гал гарсан өдрийн тоо / жил". Таамаглал биш, тодорхойлох зураг.
- ~~Түвшин 3 = Future work~~ → **2026-11-14 23:56 шинэчилсэн ✅: Түвшин 3 ML model нь гол бүтээгдэхүүн болов (D15).** Түвшин 1 ба 2 нь ML-ийн давах ёстой **baseline** болж MVP-д орно. Зөвхөн H3 магадлалын газрын зураг Future work хэвээр.

### D15 ✅ ML таамаглалын model (гол бүтээгдэхүүн)
- **Зорилт:** бүс бүрийн **дараа сарын** harmonized hotspot тоо, `log1p` хэлбэрээр. Бүсүүд давхардалгүй **22**: Монголын 22 нэгж (D6: MVP = зөвхөн Монгол; Орос/Хятадын хилийн бүс → bbox-той хамт Nice). Монголын нийт = 22 нэгжийн нийлбэр. ~23 жил × 12 сар × 22 ≈ 6,100 мөр.
- **Model ⚙️:** LightGBM (жижиг мод, хүчтэй regularization). **Ridge regression нөөц**: LightGBM ялахгүй эсвэл тогтворгүй бол Ridge. Deep learning хэрэглэхгүй (өгөгдөл бага).
- **v1 feature (зөвхөн галын түүх):** сүүлийн 1–3 сарын тоо, өнгөрсөн жилийн ижил сар, сарын baseline медиан, энэ сарын log-anomaly, сар (cyclical), бүсийн ID.
- **v2 feature (+ Meteomatics цаг агаар):** бүс бүрийн **энэ сарын** (таамаглаж буй сарын биш) дундаж температур, нийт хур тунадас, сүүлийн 3 сарын хур тунадас, дундаж харьцангуй чийгшил, дундаж салхи, сарын сүүлийн цасны зузаан. Параметрийн яг нэрийг Meteomatics URL Creator-оор шалгана. Бүс бүрд 3–5 цэгийн дундаж.
- **Leakage-гүй дүрэм:** m+1 сарыг таахад зөвхөн m сарын төгсгөл хүртэлх мэдээлэл. Ирэх сарын **бодит** цаг агаарыг feature болгохгүй. Rolling-origin-ий Y бүрд r₁-ийг Y-ээс өмнөх overlap жилүүдээр дахин тооцно (D11-тэй ижил).
- **Шалгалт:** rolling-origin 2015–2025 (Y бүрийг өмнөх бүх жилээр сургана). Метрик WAPE. **Давах ёстой:** Түвшин 1 (медиан) ба Түвшин 2 (β). v1 ба v2-ийг тусад нь тайлагнана, ингэснээр "цаг агаар хэр тусалсан" нь тоогоор харагдана.
- **Kill criterion (өмнө нь тохирсон, хэвээр):** baseline-аас харьцангуй ≥ 5% бага WAPE **БӨГӨӨД** bootstrap интервал (жилүүдээр) 0-ийг агуулахгүй. Хангахгүй бүсэд ML-ийн тоо харуулахгүй, зөвхөн "хэвийн хүрээ". Ялагдвал нуухгүй.
- **Тодорхойгүй байдлын хүрээ ⚙️:** rolling-origin-ий үлдэгдлийн P10–P90-ийг сар бүрээр ашиглана (нэмэлт quantile model хийхгүй).
- **Harmonization-ий нотолгоо:** ижил LightGBM-ийг 3 backtest arm (raw-all / raw-VIIRS-only / harmonized-all) дээр сургана. Шийдвэрлэх харьцуулалт = harmonized-all vs raw-VIIRS-only.
- **"Яагаад" тайлбар ⚙️:** feature importance (gain). Бүс бүрийн SHAP = nice-to-have.
- **Meteomatics gate ⚙️:** account-ын төрлийг эхлээд шалгана. **Free Basic** account нь зөвхөн сүүлийн 24 цагийн түүхтэй тул сургалтад **ашиглах боломжгүй**. Space Apps эсвэл trial account (1940 оноос түүхтэй, trial-д 1,000 query) хэрэгтэй. 2002–2026 оны өдрийн өгөгдлийг нэг query-д олон цэг (`+`) ба урт хугацаагаар татаж ~100-аас бага query-д багтаана. Түүх авах боломжгүй бол **v1-ээр л явна**, demo-д v2 гэж хэлэхгүй.

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

1. **Татах ⚙️ (2026-11-15, P1-01 өгөгдлөөр):** үндсэн эх сурвалж = аль хэдийн татсан **FIRMS Archive Download** (Монгол, buffer 0 км, CSV, 4 сенсор × archive + NRT = 8 файл, жагсаалт: [docs/research/data_audit.md](docs/research/data_audit.md)).
   - FIRMS Area API зөвхөн NRT шинэчлэх болон bbox (Nice)-д: `MODIS_SP` (Terra+Aqua, `satellite` баганаар ялгана), `VIIRS_SNPP_SP`, `VIIRS_NOAA20_SP` + SP хоцрогдсон сүүлийн саруудад `_NRT`. `DAY_RANGE ≤ 5`. Resumable, throttled, CSV/Parquet-ээр cache хийнэ.
   - **Баримт (bbox, Nice):** манай bbox-д хүсэлт бүр MODIS = 3, VIIRS = 10 transaction. Нийт ~3,400 хүсэлт / ~22,000 transaction. Түгээмэл хязгаар 5,000/10 мин (MAP_KEY status-аар батална) → ~45–60 мин.
   - **Нөөц:** FIRMS Country Yearly Summary zip (хүлээлтгүй, шууд татна; MODIS ~65–90 MB/жил, S-NPP ~300–385 MB/жил; зөвхөн SP).
2. **Header audit ⚙️ хийгдсэн (2026-11-15, P1-01 өгөгдлөөр):** бодит багана, platform, огнооны хүрээ, мөрийн тоо → [docs/research/data_audit.md](docs/research/data_audit.md).
3. **Шүүлт ⚙️:** SP-д `type == 0` (ургамлын гал), байнгын дулааны эх үүсвэрийн (ДЦС, уурхай) mask-ыг toggle хэлбэрээр хийнэ, чимээгүй устгахгүй. VIIRS archive-д `type` багана бий.
   - ⚙️ **NRT mask:** NRT-д `type` байхгүй → archive-ийн type 1/2/3-тай 0.02° нүд (136 нүд) → NRT-д flag. 0.02° нь ASSUMPTION (2026-11-15, P1-01 өгөгдлөөр).
   - ⚙️ **Confidence:** MODIS 0–100, VIIRS l/n/h → low/nominal/high атрибут болгон хадгална, шүүхгүй (2026-11-15, P1-01 өгөгдлөөр).
4. **Нэгж:** MODIS = пиксел. VIIRS = fire unit (H3 res 8 × overpass). Raw VIIRS пикселийн тоог тусад нь хадгална.
5. **Шошго:** аймаг (geoBoundaries), day/night, platform. ⚙️ Улсын шошго (Natural Earth) MVP-д хэрэггүй, bbox (Nice)-д л хэрэгтэй (2026-11-15, P1-01 өгөгдлөөр).
   - ⚙️ **Огноо:** Calendar-ийн огноо = Монголын орон нутгийн огноо (UTC+8). Overpass бүлэглэлт (D9) нь UTC `acq_date` + `acq_time`-аар (2026-11-15, P1-01 өгөгдлөөр).
6. **Ratio:** r₁(сар, D/N) + fallback, r₂, diagnostic-ууд (D/N pooled baseline, drift).
7. **Harmonized сарын цуваа:** бүс бүрд (22 нэгж + улс), мөн H3 res 5 × жил (globe-д).
8. **Baseline + Түвшин 2 + kill criterion.**
9. **Match class** (R = 100/300/500).
10. **Validation:** D10-ын бүх тест → `validation.json` + график.
11. **Pipeline stats:** хэдэн мөр, platform, жил → demo-гийн тоонууд (**тоо бүр зөвхөн скриптээс**).
12. **Цаг агаар (D15):** Meteomatics → `etl/data/processed/weather_monthly.parquet` (бүс × сар × параметр). `METEOMATICS_USER/PASSWORD` зөвхөн `.env`-д.
13. **ML (D15):** feature table → rolling-origin backtest (v1, v2, 3 arm) → kill check → `forecast.json` + `model_metrics.json`.

**Өгөгдлийн гэрээ (JSON) ⚙️:** `regions.json` · `calendar/{region}.json` (сар × он: harmonized, raw platform тус бүрээр, baseline, P25–P75, forecast, flags) · `ratios.json` · `validation.json` · `hex_year/{raw,harm}.json` · `matches_summary.json` · `case_study.json` · `pipeline_stats.json` · `satellites.json` (TLE snapshot + metadata + эх сурвалж).

## 4. App (Vite + React + TS) ⚙️

- **Stack ✅:** `react-globe.gl` (three-globe) + `satellite.js`. CelesTrak-ийн бодит TLE-г build хийх үед snapshot болгоно. Demo-гийн үед live API дуудахгүй, **MAP_KEY client-д огт орохгүй**, бүх өгөгдөл статик JSON.
- **Нүүр:** хар сансар + жижиг одод, 3D globe, **5 platform** (Terra, Aqua = MODIS өнгө; S-NPP, NOAA-20, NOAA-21 = VIIRS өнгө), dotted тойрог зам, ижил sensor-тэй platform-уудыг **нарийн зураасаар** холбоно ✅. Анхаар: Aqua + 3 VIIRS бараг нэг хавтгайд явдаг тул тойрог замууд нь давхцана. Harmonize товч, Method хэсэг.
- **Hover ⚙️:** platform, sensor, хөөргөсөн огноо, **манай өгөгдөл дэх сүүлийн илрүүлэлтийн огноо**, албан ёсны статусын мөр (эх сурвалжийн линктэй). "Одоо ажиллаж байна"-г гараар бичихгүй.
- **Satellite хуудас ⚙️:** зураг (NASA, credit-тэй), sensor, ажилласан хугацаа, Монгол дахь hotspot-ийн тоо (жилээр), reference chain дахь үүрэг. **"Арга хэмжээ авч мэдээлэл дамжуулж чадсан уу" гэсэн хэсгийг хасна:** өгөгдлийн эх сурвалж байхгүй, зохиохгүй.
- **Таамаглалын дэлгэц ✅ (D15):** аймаг бүрийн ирэх сарын таамаглал + P10–P90 хүрээ + сарын baseline, "хэвийнээс X дахин их/бага байх төлөвтэй", гол 3 feature. Kill criterion-д тэнцээгүй бүсэд зөвхөн "хэвийн хүрээ". Model-ийн backtest-ийн үр дүн (ML vs baseline, harmonized vs raw-VIIRS-only) тоогоор. "Мэдээллийн зорилготой, албан ёсны сэрэмжлүүлэг биш" тэмдэглэл.
- **Бүс/галын түүх:** globe дарахад зүүн тийш шилжиж zoom хийнэ. Хажууд нь гал гарсан онууд, он дээр дарахад тухайн оны газрууд, газар дээр дарахад дэлгэрэнгүй мэдээлэл. Scroll хийхэд ⚙️ камер **Монгол дотор тухайн оны хамгийн том галын бүс рүү** нисч ("дэлхий эргэх" мэдрэмж), энэ бүсийг өгөгдлөөс тооцно. `prefers-reduced-motion` үед анимацгүй.
- **Hotspot дэлгэрэнгүй ⚙️:** FIRMS атрибутууд (platform, огноо/цаг, `frp`, confidence, `scan × track`, match class) + **NASA GIBS**-ийн тухайн өдрийн true-color зураг (layer нэрийг шалгана). "Чийгшил, уулын нягтаршил" зураг FIRMS-д **байхгүй** тул харуулахгүй.
- **Uncertainty дүрс ✅/⚙️:** пикселийн footprint `scan × track` тэгш өнцөгт. Зөвхөн zoom хийсэн, нэг он сонгосон үед зурна, бүгдийг нэг дор зурахгүй.
- **Calendar ⚙️:** сар × он, харагдах байдал нь хүртээмжтэй sequential ramp (cividis төст). Raw view toggle. **Одоогийн бүрэн бус сар:** "сарын эхний N хоног, ижил хугацааны медиантай харьцуулав". **NOAA-20-оор тооцоолсон хэсэг** (2026-11-02-ноос) тасархай хүрээгээр ялгагдана. AOI сонголт (аймаг / зурах / lat-lon), огнооны муж, **CSV татах** (hotspot + calendar).
- **Anomaly хэллэг ⚙️:** "Энэ сард танай аймагт гал хэвийнээс X дахин их". Baseline < 5 fire unit бол "Энэ сард ихэвчлэн бараг гал гардаггүй. Энэ жил: N" гэж бичнэ. Бүх мессежид "**Мэдээллийн зорилготой, албан ёсны сэрэмжлүүлэг биш**" гэсэн тэмдэглэл байна.
- **Sticky bar (баруун, 30–40 px) ⚙️:** дээрээс доош Сансар (нүүр/хиймэл дагуул) → Гадаргуу (бүс/calendar) → Цөм (Method/For scientists). Scroll-ын байрлалыг харуулж, дарахад тухайн хэсэг рүү шилжинэ.
- **Хоосон төлөв гаргахгүй ✅:** өгөгдөл app-тай хамт статик байдлаар ирнэ. Ачаалж байх үед skeleton харуулна. Гал огт байгаагүй бүсэд бодит өгүүлбэр ("2003 оноос хойш энэ бүсэд hotspot бүртгэгдээгүй") харуулна. Хэзээ ч "N/A" эсвэл хоосон график харуулахгүй.

## 5. Scope

| Түвшин | Юу |
|---|---|
| **MVP** | Pipeline 1–13 (Монгол ⚙️, chain, сарын r₁(D/N) ⚙️ + fallback, r₂, цаг агаар, ML) · Aqua LOYO + forward + нэг-ratio baseline + r₂ LOYO · **ML v1 + v2 (Meteomatics gate) + rolling-origin + kill criterion + 3 backtest arm** · Түвшин 1 ба 2 baseline · **Таамаглалын дэлгэц** · Calendar + Raw toggle + AOI (аймаг) + огнооны муж + CSV · Нүүрний globe + 5 platform + hover · Harmonize: хоёр globe + scrubber + calendar нөөц · Method хэсэг · Хоосон төлөвгүй fallback |
| **MVP+** | Case study · Aqua давтамжийн heatmap · Match class 4 өнгө + R sweep · Satellite хуудас · Scroll-оор камер нисэх · Hotspot дэлгэрэнгүй + GIBS зураг · Sticky bar · Globe дээр аймгийг таамаглалаар будах |
| **Nice-to-have** | (1) **Bootstrap** · ⚙️ Монгол + ~500 км bbox (W85 S37 E127 N56) + RU/CN шошго · H3 res 7 sensitivity · AOI зурах / lat-lon · Калифорни · Uncertainty тэгш өнцөгт |
| **Future work** | H3 нүдний түвшний галын магадлалын газрын зураг · Бүс бүрийн SHAP · TLE-ээр жинхэнэ overpass/үүл тооцох · Land cover-оор ratio |
| **Хассан** | Satellite tasking санаа · "Арга хэмжээ авч мэдээлэл дамжуулсан" мэдээлэл · Чийгшил/уулын зураг · Бүх дэлхийн өгөгдөл · Америк руу scroll хийх (Калифорни нэмэгдвэл буцаана) |

## 6. Demo (1 минут) ⚙️

1. **0–10 с:** Нүүр. Globe дээр 5 platform эргэлдэнэ. "MODIS 23 жил ажиллаад одоо зогсож байна. S-NPP 12 хоногийн өмнө зогссон."
2. **10–25 с:** Harmonize. Хоёр globe, scrubber 2012-ыг давахад Raw globe "гэрэлтэнэ", Harmonized globe тэгш хэвээр. Тоонууд: "3 platform · 23 жил · N сая hotspot → 1 цуваа".
3. **25–40 с:** Нотолгоо. "MODIS ажиллаж байсан жилүүдэд бид Aqua-г WAPE X%-ийн алдаатай сэргээн гаргасан."
4. **40–55 с:** Таамаглал: нэг аймгийн ирэх сарын таамаглал + хүрээ + "яагаад", дараа нь backtest: "ML baseline-аас X% бага алдаатай, harmonized түүх Y% сайжруулсан" (тоо скриптээс, ялагдвал үнэнээр нь). Calendar, CSV татах.
5. **55–60 с:** "Харьцуулж болохуйц 23 жилийн түүх = илүү сайн таамаглал" + limitation-ийн нэг өгүүлбэр.

## 7. Pitch-ийн дүрэм ✅
- Хэт их амлахгүй ("эхний", "аврах", "урьдчилан сэргийлнэ" гэх үг хэрэглэхгүй). Тоо бүрийг скриптийн гаралтаас авна.
- Limitation-ыг шударгаар хэлнэ (§8). Тест муу гарвал түүнийгээ харуулна.

## 8. Limitations (PLAN + UI + pitch)
- Ratio нь улсын (Монгол) сарын дундаж тул hex/аймаг бүрт хэрэглэх нь ойролцоолол. Галын төрлөөс хамаарсан ялгаа үлдэнэ.
- **Not comparable proxy:** ганц, тусгаар гал элбэг тал хээрт нөгөө sensor-ийн "харж байсан" нотолгоо олдохгүй тул жинхэнэ мэдрэмжийн ялгаа саарал ангид живэх эрсдэлтэй. Үүл ба утааг ялгадаггүй.
- Pooled ratio-г нэг онцгой жил давамгайлж болно (bootstrap хийвэл ил гарна).
- 2026-11-02-ноос хойш r₁ × r₂ хуримтлагдсан тодорхойгүй байдал (NOAA-20-ийн хэсгийг ялгаж харуулна).
- Aqua/Terra-ийн тойрог замын drift. NRT өгөгдөл ~5 сарын дараа SP-ээр солигдоно.
- Хил: geoBoundaries 2017.

## 9. Нээлттэй асуудлууд
1. ~~**Өгөгдөл:** дискэнд FIRMS файл олдсонгүй.~~ **Шийдэгдсэн ⚙️ (2026-11-15, P1-01 өгөгдлөөр):** 8 файл байгаа ([docs/research/data_audit.md](docs/research/data_audit.md)), гэхдээ git-д ороогүй (`etl/.gitignore`) → бусад гишүүдэд хуваалцах.
2. **`FIRMS_MAP_KEY`** тохируулагдаагүй. Хүлээн авч `.env`-д хийнэ (commit хийхгүй). Transaction-ий хязгаарыг key-ийн status-аар батална. ⚙️ Archive өгөгдөлд MAP_KEY хэрэггүй, зөвхөн NRT шинэчлэх/bbox-д хэрэгтэй (2026-11-15, P1-01 өгөгдлөөр).
3. **Хакатон дуусах цаг** (11-р сарын 15, хэдэн цагт?) → feature freeze ⚙️ = дуусахаас 4 цагийн өмнө.
4. Багийн бүрэлдэхүүн (хүний тоо, нэр) → §10-ын lane-уудад хуваарилна.
5. Өгөгдөл ирсний дараа: overpass-ийн цонх, R (100/300/500), ratio-ууд, bbox-ийн эцсийн хил (Nice). **Шийдэгдсэн (2026-11-15, P1-01 өгөгдлөөр):** Aqua-ийн FIRMS-ийн эхний огноо (Монголд 2002-07-05); VIIRS archive-д `type` багана бий, NRT-д байхгүй.
6. Aqua MODIS одоо ажиллаж байгаа эсэх (NASA LAADS ~2026-08 vs CAMS ~2027-09). Өгөгдлийн сүүлийн огноогоор шийднэ. Aqua science 2026-08-31 хүртэл, NRT 2026-11-14 хүртэл өгөгдөлтэй (`docs/research/data_audit.md`).
7. GIBS layer нэрс, NASA хиймэл дагуулын зургийн лиценз/credit.
8. MODIS archive-ийн `version` 6.03 (95,080 мөр) vs 61.03 (4,985 мөр) ялгаа юу вэ.
9. `origin/p1/P1-01`-ийн `etl/harmonize_v0.py` бол prototype (cell-day, VIIRS-eq чиглэл, улирлын ratio, 2013–2022, зөвхөн өдөр, NOAA-20-д r₂ байхгүй) → PLAN-ийн нэгжээр дахин хийнэ. `etl/clean_hotspots.py` нь type 1/2/3 болон NRT mask-тай мөрийг устгадаг (нийт 4,492 мөр) → PLAN: flag + toggle, устгахгүй. `etl/get_boundaries.py`-ийн эхний 4 мөрөнд мөрийн дугаар орсон (SyntaxError). `etl/requirements.txt`-д `h3` байхгүй.
10. ~~Кодын хавтас `etl/` vs TASKS-ийн `/pipeline/...`~~ **Шийдэгдсэн:** TASKS.md бүхэлдээ `etl/` хавтсыг ашиглана.
11. **Meteomatics account-ын төрөл:** Space Apps / trial / Free Basic? 2003 оноос түүх авч болох уу, query-ийн хязгаар хэд вэ? (D15 gate.)

## 10. Багийн lane-ууд ⚙️ (нэрийг нөхнө)
| Lane | Эзэмшинэ | Зэрэгцэх нөхцөл |
|---|---|---|
| *(дэлгэрэнгүй 5 хүний хуваарилалт: [TASKS.md](TASKS.md))* | | |
| **L1 Data/Science** | `etl/`: татах, audit, шүүлт, ratio, validation, JSON гэрээ, **цаг агаар, ML** | Эхний 1 цагт JSON schema + **"SYNTHETIC" гэж шошголсон** жижиг fixture гаргаж бусдыг блоклохгүй |
| **L2 Globe** | Нүүрний globe, 5 platform + TLE, hover, хоёр globe sync, scrubber | Fixture-ээр ажиллана |
| **L3 App UI** | Calendar, AOI, CSV, бүсийн view, Method, satellite хуудас, sticky bar, fallback | Fixture-ээр ажиллана |
| **L4 Story/QA** | Case study-ийн эх сурвалж, MN/EN текст, demo script, limitation, credit/лиценз, бодит төхөөрөмж дээр тест | Pipeline-ийн тоог скриптээс авна |

Synthetic fixture-ийг **зөвхөн UI scaffolding-д** ашиглана. Demo-д fixture хэзээ ч харагдахгүй (`MOCK=false` шалгалт).

## 11. Эх сурвалж
- [Challenge page](https://www.spaceappschallenge.org/2026/challenges/modis-and-viirs-hot-spots/)
- [FIRMS API — Area](https://firms.modaps.eosdis.nasa.gov/api/area/) · [FIRMS Archive Download](https://firms.modaps.eosdis.nasa.gov/download/) · [Country Yearly Summary](https://firms.modaps.eosdis.nasa.gov/country/)
- [Transitioning from Suomi NPP (Earthdata)](https://www.earthdata.nasa.gov/news/blog/transitioning-from-suomi-npp-viirs-omps-what-firms-users-need-know)
- [MODIS to VIIRS Transition (LAADS)](https://ladsweb.modaps.eosdis.nasa.gov/learn/modis-to-viirs-transition) · [CAMS: Drifting away from MODIS](https://atmosphere.copernicus.eu/drifting-away-modis-cams-global-fire-assimilation-system)
- [Meteomatics: Getting started](https://meteomatics.com/en/api/getting-started) · [Meteomatics free/trial account-ын нөхцөл](https://flightweather.meteomatics.com/en/weather-api/weather-api-free/) · [Meteomatics × Space Apps](https://www.meteomatics.com/en/meteomatics-and-nasa-space-apps-challenge/)
- [Aqua Status March 2022](https://aqua.nasa.gov/sites/default/files/AquaStatus_March2022.pdf) · [Terra orbit drift poster (NTRS)](https://ntrs.nasa.gov/citations/20250000522)
- [MODIS C6/C6.1 Fire User Guide](https://earthdata.nasa.gov/s3fs-public/2023-09/MODIS_C6_C6.1_Fire_User_Guide_1.0.pdf)
- [geoBoundaries MNG ADM1 (ODbL, © OpenStreetMap contributors)](https://www.geoboundaries.org/api/current/gbOpen/MNG/ADM1/)
