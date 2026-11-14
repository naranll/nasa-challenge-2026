# TASKS — 5 хүний ажлын хуваарилалт (PLAN.md-ээс)

**Эх сурвалж:** зөвхөн [PLAN.md](PLAN.md), [GLOSSARY.md](GLOSSARY.md). Шийдвэр бүр PLAN-ийн D-дугаартай холбогдоно.
**Цаг:** хакатон дуусах цагийг **T** гэж тэмдэглэв (PLAN §9.3, нөхөж бичнэ). **Feature freeze = T − 4 цаг.**
**Дараалал:** MVP → MVP+ → Nice-to-have. MVP дуусаагүй байхад MVP+ эхлэхгүй.

---

## 0. Хил хязгаарын дүрэм (бүгд мөрдөнө)

1. **Өөрийн хавтсаа л засна.** Бусдын файл унших нь чөлөөтэй. Өөрчлөх хэрэгтэй бол эзэнд нь хэлнэ, өөрөө засахгүй.
2. **Lane хооронд зөвхөн файлаар харилцана:** `/contracts` (JSON schema) ба `/fixtures`. Schema өөрчлөх = эзэн нь өөрчилж, хэрэглэгч бүрт мэдэгдэнэ.
3. **Fixture бол SYNTHETIC.** Зөвхөн UI барихад ашиглана. Demo-д хэзээ ч харагдахгүй (`MOCK=false`, P4-08).
4. **Тоо бүр скриптээс.** Demo, pitch, UI дээрх тоо бүр скриптийн гаралтаас ирж, `docs/claims.md`-д бүртгэгдэнэ (P5).
5. **Зохиохгүй.** Өгөгдөл, эх сурвалж, статус ("одоо ажиллаж байна"), сэрэмжлүүлэг зохиохгүй. Мэдэхгүй бол `ASSUMPTION` гэж бичээд P5-д хэлнэ.
6. **Шинэ санаа → `docs/parking_lot.md`.** Энэ файлд мөр болж ороогүй ажил хийхгүй.
7. **Time-box хэтэрвэл:** байгаагаа ship хийж, статусаа хэлээд дараагийн ажилдаа ор. Хүлээж суухгүй, fixture ашиглана.
8. **Claude Code-д** session бүрийн эхэнд: "Чи зөвхөн [МИНИЙ ХАВТАС]-ыг засна. Одоогийн task: [ID]. Done when: [...]. Өөр файл засах, шинэ feature нэмэх, refactor хийхгүй. Эхлээд plan харуул." гэж бич.
9. **Нууц:** `FIRMS_MAP_KEY` зөвхөн `.env`-д. Client код руу огт орохгүй, commit хийхгүй.
10. **Ажлаа дуусгавал** (дарааллаар): өөр хүний bug засахад туслах → PR review → утсан дээр тест → MN/EN текст шалгах. Шинэ feature эхлүүлэхгүй.

---

## 1. Хэн юуг эзэмших вэ

| Lane | Үүрэг | **Засах эрхтэй** | **Хэзээ ч хийхгүй** |
|---|---|---|---|
| **P1** | Data pipeline | `/pipeline/fetch`, `/pipeline/prep`, `/pipeline/requirements.txt`, `/data` (gitignore), `public/data/{regions,pipeline_stats}.json`, `public/data/hex_year/raw.json`, `public/data/exports/`, `docs/data_audit.md` | Ratio, validation, таамаглал тооцох. UI, текст засах. Дэлхийн бүх өгөгдлийг татах. |
| **P2** | Science / Validation | `/contracts`, `/fixtures`, `/pipeline/science`, `/pipeline/tests`, `public/data/{ratios,validation,matches_summary,case_study}.json`, `public/data/calendar/`, `public/data/hex_year/harm.json`, `docs/methods.md` | Өгөгдөл татах, шүүх (P1-ийн ажил). UI засах. Тест муу гарсныг нуух. |
| **P3** | Globe | `/app/src/globe`, `/app/src/harmonize`, `/scripts/tle`, `public/data/satellites.json` | Шинжлэх ухааны тооцоог browser-т хийх (JSON-оос л уншина). Компонент дотор текст hardcode хийх. Calendar, routing. |
| **P4** | App UI + deploy | `/app` (globe, harmonize, i18n-ээс бусад бүгд), `/app/package.json`, deploy тохиргоо | Тооцоо хийх. Компонент дотор текст hardcode хийх. Globe код засах. |
| **P5** | Story / QA / Lead | `/docs` (`data_audit`, `methods`-ээс бусад), `/app/src/i18n/{mn,en}.json`, `TASKS.md`, `PLAN.md` §9 ба нэрсийг нөхөх | Арга зүй, тоо өөрчлөх. Эх сурвалжгүй статус, сэрэмжлүүлэг бичих. Freeze-ээс өмнө pitch/слайд эхлэх. |

**Хуваалцсан нэг дүрэм:** Python сан нэмэх бол P1-д, npm сан нэмэх бол P4-д хэлнэ.

---

## 2. Gate-үүд

| Gate | Хэзээ | Шалгуур |
|---|---|---|
| **G0** | одооноос +1 цаг | Repo + deploy URL ажиллана. `/contracts` + SYNTHETIC fixture бэлэн. MAP_KEY ажиллаж, татах скрипт ажиллаж эхэлсэн. |
| **G1** | G0 + ~5 цаг | Монголын **бодит** Raw + Harmonized calendar deploy хийсэн сайт дээр харагдана. |
| **G2** | G1 + ~4 цаг | `validation.json` бодит тоотой (Aqua LOYO WAPE). Harmonize хуудас (хоёр globe) бодит өгөгдөл дээр. MVP бүрэн. |
| **G3** | **T − 4 цаг** | **FEATURE FREEZE.** Зөвхөн засвар. Demo, pitch эхэлнэ. |

---

## 3. Task board-ууд

Формат: **ID · Task · Time-box · Хүлээх зүйл (Needs) · Done when**

### P1 — Data pipeline

| ID | Түвшин | Task | Box | Needs | Done when |
|---|---|---|---|---|---|
| P1-01 | MVP | MAP_KEY авч `.env`-д хийх, key-ийн status-аар transaction-ий хязгаарыг шалгах (§9.2) | 15 мин | — | Status дуудлага хязгаарын тоог буцаана, тоог `docs/data_audit.md`-д бичсэн |
| P1-02 | MVP | **Татах скрипт** (D6 bbox W85 S37 E127 N56): `MODIS_SP`, `VIIRS_SNPP_SP`, `VIIRS_NOAA20_SP` + SP хоцорсон саруудад `_NRT`. `DAY_RANGE ≤ 5`, resumable, throttled, CSV/Parquet cache. **Шууд ажиллуулж эхлүүлнэ.** API гацвал Country Yearly Summary zip руу шилжинэ | 1 цаг бичих + ~1 цаг арын ажил | P1-01 | Kill хийгээд дахин эхлүүлэхэд үргэлжилнэ. Platform × жил бүрийн мөрийн тоо log-д |
| P1-03 | MVP | **Header audit** → `docs/data_audit.md`: багана, platform, огнооны хүрээ, мөрийн тоо, Aqua-ийн FIRMS дээрх эхний өдөр, VIIRS SP-д `type` багана бий эсэх | 45 мин | P1-02 | Хүснэгт: файл × platform × огноо × мөр. §9.5-ын асуултууд хариулагдсан |
| P1-04 | MVP | **Шүүлт** (§3.3): `type == 0`, байнгын дулааны эх үүсвэрийг **flag** болгох (устгахгүй), NRT-д SP-ээс гаргасан mask | 1.5 цаг | P1-03 | Flag асаах/унтраахад тоо өөрчлөгдөнө. Юу хасагдсаныг тоогоор log-д |
| P1-05 | MVP | **Нэгж + шошго** (D9, §3.4–5): MODIS = пиксел. VIIRS = fire unit (H3 res 8 × overpass, ижил platform + огноо + `acq_time` ±10 мин). Түүхий VIIRS пикселийн тоог тусад нь хадгална. Улс (Natural Earth), аймаг (geoBoundaries, 22 нэгж), day/night. Python `h3` v4-ийг тогтооно | 2 цаг | P1-04 | `data/interim/monthly_counts.parquet` (бүс × сар × platform × day/night: pixel, fire_unit) P2-ийн contract-д таарна |
| P1-06 | MVP | **H3 тест вектор:** 20 координат → res 5 ба res 8 cell ID → `pipeline/tests/h3_vectors.json` (P3 h3-js-ээр шалгана) | 15 мин | P1-05 | Файл байгаа, P3-т хэлсэн |
| P1-07 | MVP | `hex_year/raw.json` (H3 res 5 × жил × platform, **түүхий пиксел**, D12), `regions.json`, `pipeline_stats.json` (хэдэн мөр, platform, жил) | 1 цаг | P1-05 | Contract-д таарна, тоо скриптээс гарсан |
| P1-08 | MVP | **Hotspot CSV export:** бүс × жилээр урьдчилан бэлдсэн CSV-ууд `public/data/exports/` (platform, огноо/цаг, lat, lon, frp, confidence, scan, track, flags) | 1 цаг | P1-05 | Excel-д нээгдэнэ, P4 татах товчинд холбосон |
| P1-09 | MVP+ | Aqua-ийн түүхэн давтамжийн heatmap (D11): 2003–2025, зөвхөн Aqua, H3 res 5, "гал гарсан өдрийн тоо / жил" | 1 цаг | P1-05 | JSON contract-д таарна |
| P1-10 | MVP+ | Бүс/галын түүхийн өгөгдөл: бүс бүрийн гал гарсан онууд, он бүрийн газрууд, **он бүрийн хамгийн том галын бүс** (камер нисэх зорилго, §4) | 1.5 цаг | P1-05 | P3/P4 уншиж чадна |
| P1-11 | MVP+ | Hotspot дэлгэрэнгүй: сонгосон он × бүсийн hotspot атрибутууд (жижиг хэсгүүдэд хуваасан JSON) | 1 цаг | P1-05 | Файл бүр < ~2 MB |
| P1-12 | Nice | Калифорни: өөр bbox дээр pipeline-ийг дахин ажиллуулах (кодын өөрчлөлтгүй) | 1 цаг | бүгд | Config-оор л ажиллана |

### P2 — Science / Validation

| ID | Түвшин | Task | Box | Needs | Done when |
|---|---|---|---|---|---|
| P2-01 | MVP | **Бүх JSON contract + SYNTHETIC fixture** (§3 өгөгдлийн гэрээ): `regions`, `calendar/{region}`, `ratios`, `validation`, `hex_year/{raw,harm}`, `matches_summary`, `case_study`, `pipeline_stats`, `satellites`, мөн P1-ийн `monthly_counts` parquet-ийн schema. Fixture бүрт `"synthetic": true` | 1 цаг | — | **G0.** P3, P4 fixture-ээр дэлгэц зурж чадна. P1 баганаа баталсан |
| P2-02 | MVP | **Ratio функцүүд** (D3, D7): r₁(сар) = Σ Aqua / Σ S-NPP (жилийн дундаж биш), < 30 fire unit бол жилийн ratio руу fallback. r₂ = нэг тоо. Reference chain-ий огноогоор harmonized цуваа. Unit test-тэй, synthetic өгөгдөл дээр | 2 цаг | P2-01 | Тест ногоон. Чиглэл `r = Σ(өмнөх) / Σ(дараагийн)` |
| P2-03 | MVP | **Validation** (D10): Aqua LOYO (2012–2021, 10 удаа), forward (2012–18 → 2019–21), нэг-ratio baseline, r₂ LOYO (2019–2025). Метрик WAPE + correlation → `validation.json` + график | 1.5 цаг | P2-02 | Synthetic дээр ажиллана, бодит өгөгдөл ирэхэд нэг командаар дахин ажиллана |
| P2-04 | MVP | **Түвшин 1 baseline** (D11): сар бүрийн медиан + P25–P75, `method="lower"`, log1p. Одоогийн бүрэн бус сар = "сарын эхний N хоног vs ижил хугацааны медиан" | 1 цаг | P2-02 | Гараар 3 тоо шалгасан |
| P2-05 | MVP | **Бодит өгөгдөл дээр ажиллуулах:** `ratios.json` (+ diagnostic: улсаар, day/night, Aqua drift `acq_time` график), r₂ ±15% sanity, `calendar/*.json` (22 нэгж + 3 улс + bbox), `hex_year/harm.json` | 2 цаг | P1-05, P1-07 | **G1.** Raw vs harmonized график хадгалсан (үр дүн ямар ч байсан) |
| P2-06 | MVP | Бодит `validation.json` + `docs/methods.md` (pipeline алхмууд, тест бүрийн үр дүн, limitation) | 1 цаг | P2-05 | **G2.** Тест бүрт тоо байна, муу гарсан бол тэр хэвээрээ бичигдсэн |
| P2-07 | MVP | **Case study сонгох скрипт** (D14): Монгол, 2012–2021, harmonized сарын anomaly хамгийн өндөр → `case_study.json` (нэргүй, зөвхөн огноо + бүс) | 45 мин | P2-05 | Нэр оноохыг P5-д дамжуулсан |
| P2-08 | MVP+ | **Түвшин 2 таамаглал** (D11): log-anomaly persistence, бүс бүрд β. Rolling-origin 2015–2025, Y бүрд r₁-ийг Y-ээс өмнөх жилүүдээр дахин тооцно. **Kill criterion** (≥ 5% + β-ийн интервал 0-гүй). 3 backtest arm | 3 цаг | P2-06 | Бүс бүрээр "таамаглал харуулах / харуулахгүй" шийдэгдсэн |
| P2-09 | MVP+ | **Match class** (D8): Both / MODIS only / VIIRS only / Not comparable, R = 100/300/500 км → `matches_summary.json`, сонгосон R-ийн үндэслэлийг PLAN D8-д нөхнө | 2 цаг | P2-05 | Хоёр чиглэлийн хувь (P(V\|M), P(M\|V)) гарсан |
| P2-10 | Nice | **Bootstrap** (жилүүдээр resample) → ratio-ийн интервал. Day/night 24 ratio. H3 res 7 sensitivity | 2 цаг | P2-06 | Интервал `ratios.json`-д |

### P3 — Globe

| ID | Түвшин | Task | Box | Needs | Done when |
|---|---|---|---|---|---|
| P3-01 | MVP | `scripts/tle`: CelesTrak-аас 5 platform-ын TLE snapshot (build үед) + metadata + эх сурвалж → `satellites.json` | 45 мин | P2-01 | Contract-д таарна, demo-гийн үед сүлжээ дуудахгүй |
| P3-02 | MVP | **Нүүрний globe:** хар сансар + одод, `react-globe.gl`, 5 platform `satellite.js`-ээр хөдөлнө, dotted тойрог зам, ижил sensor-тэй platform-уудыг нарийн зураасаар холбох (MODIS/VIIRS өнгө), bbox-оос гадна бүдэг | 2 цаг | P4-01, P3-01 | Утсан дээр гацахгүй эргэлдэнэ |
| P3-03 | MVP | **Hover:** platform, sensor, хөөргөсөн огноо, манай өгөгдөл дэх сүүлийн илрүүлэлтийн огноо (`pipeline_stats`), албан ёсны статусын мөр + линк (P5-04-өөс). "Одоо ажиллаж байна" гэж гараар бичихгүй | 45 мин | P3-02 | Бүх текст i18n key-ээс |
| P3-04 | MVP | **h3-js тест:** P1-06-ийн векторуудыг h3-js v4-өөр шалгах | 15 мин | P1-06 | Бүх ID таарсан |
| P3-05 | MVP | **Harmonize hero** (D12): хоёр globe (зүүн Raw "түүхий пиксел", баруун Harmonized), **камер sync**, H3 res 5 hex (өндөр/өнгө = жилийн тоо), 2003→2025 scrubber, globe бүрийн доор жижиг шугаман график, "ratio-г hex бүрт хэрэглэх нь ойролцоолол" тэмдэглэл | 3 цаг | P1-07, P2-05 (эхлээд fixture) | **G2.** Scrubber 2012-ыг давахад Raw "гэрэлтэж", Harmonized тэгш хэвээр |
| P3-06 | MVP | **WebGL fallback:** WebGL байхгүй эсвэл FPS бага → автоматаар P4-07-ийн "For scientists" calendar руу шилжинэ | 45 мин | P4-07 | Chrome-д WebGL унтраахад fallback гарна |
| P3-07 | MVP+ | Бүс дарахад globe зүүн тийш шилжиж zoom хийх. Scroll хийхэд он солигдож, камер тухайн оны хамгийн том галын бүс рүү нисэх. `prefers-reduced-motion` үед анимацгүй | 2 цаг | P1-10 | Reduced-motion дээр анимацгүй |
| P3-08 | Nice | Uncertainty дүрс: `scan × track` тэгш өнцөгт (зөвхөн zoom + нэг он сонгосон үед) | 1 цаг | P1-11 | Бүгдийг нэг дор зурахгүй |

### P4 — App UI + deploy

| ID | Түвшин | Task | Box | Needs | Done when |
|---|---|---|---|---|---|
| P4-01 | MVP | **Scaffold:** Vite + React + TS, router, сан (`react-globe.gl`, `satellite.js`, `h3-js` v4), `public/data`-аас уншдаг data client (`MOCK` горимтой), **static deploy + нийтийн URL** | 1 цаг | — | **G0.** Бүх гишүүн clone хийгээд ажиллуулна, URL incognito-д нээгдэнэ |
| P4-02 | MVP | **Layout:** Нүүр / Harmonize / Бүс + Calendar / Method хуудас, i18n plumbing (P5-ийн key), өнгө, монгол фонт (ө, ү) шалгах | 1 цаг | P4-01 | MN/EN солигдоно, кирилл зөв харагдана |
| P4-03 | MVP | **Calendar** (§4): сар × он, хүртээмжтэй sequential ramp (cividis төст), **Raw view toggle**, NOAA-20 хэсэг (2026-11-02-оос) тасархай хүрээ, ирэх сарууд тасархай нүд, бүрэн бус сарын тэмдэглэл, tooltip | 2.5 цаг | P2-01 (fixture) → P2-05 | **G1.** Монголын бодит calendar deploy сайт дээр |
| P4-04 | MVP | **AOI + муж + CSV:** аймаг/улс/bbox сонгох, огнооны муж, calendar CSV (browser-т JSON-оос), hotspot CSV (P1-08-ийн файлууд) | 1.5 цаг | P4-03, P1-08 | Аймаг сонгоход CSV татагдана |
| P4-05 | MVP | **Anomaly өгүүлбэр:** "Энэ сард танай аймагт гал хэвийнээс X дахин их", baseline < 5 fire unit бол тусгай өгүүлбэр, **"Мэдээллийн зорилготой, албан ёсны сэрэмжлүүлэг биш"** | 45 мин | P4-03, P5-02 | Текст i18n-ээс, тоо JSON-оос |
| P4-06 | MVP | **Method хэсэг** (D13): зүүн багана pipeline алхмууд, баруун багана баталгаажуулалтын тестүүд + `validation.json`-ий тоо | 1 цаг | P2-06 | Тоо бүр JSON-оос |
| P4-07 | MVP | **"For scientists"**: Raw vs Harmonized calendar зэрэгцээ (Harmonize хуудасны доод хэсэг), мөн P3-06-ийн fallback | 45 мин | P4-03 | P3 импортлож чадна |
| P4-08 | MVP | **Хоосон төлөвгүй:** skeleton, "2003 оноос хойш hotspot бүртгэгдээгүй" өгүүлбэр, хэзээ ч "N/A" эсвэл хоосон график харуулахгүй. **Production build-д `synthetic: true` файл байвал build унана** | 45 мин | P4-01 | Fixture-тэй production build унадаг |
| P4-09 | MVP+ | **Satellite хуудас:** зураг (NASA, credit), sensor, ажилласан хугацаа, bbox дахь жилийн hotspot-ийн тоо, reference chain дахь үүрэг. "Арга хэмжээ авсан" хэсэг **байхгүй** | 1.5 цаг | P3-01, P5-03 | Тоо бүр JSON-оос |
| P4-10 | MVP+ | **Бүсийн галын түүх:** онуудын жагсаалт → он дарахад газрууд → газар дарахад hotspot дэлгэрэнгүй + NASA GIBS true-color зураг (layer нэрийг шалгасны дараа) | 2 цаг | P1-10, P1-11 | Чийгшил/уулын зураг харуулахгүй |
| P4-11 | MVP+ | **Sticky bar** (баруун, 30–40 px): Сансар → Гадаргуу → Цөм, scroll-ын байрлал, дарахад шилжинэ | 1 цаг | P4-02 | Keyboard-оор ажиллана |
| P4-12 | Nice | AOI зурах / lat-lon оруулах | 1.5 цаг | P4-04 | — |

### P5 — Story / QA / Lead

| ID | Түвшин | Task | Box | Needs | Done when |
|---|---|---|---|---|---|
| P5-01 | MVP | **T-г тогтоох**, freeze = T − 4 цаг. Lane бүрт нэр оноож энэ файлд бичих. PLAN §9-ийн нээлттэй асуултыг эзэнд нь хуваарилах. `docs/parking_lot.md`, `docs/claims.md` үүсгэх | 30 мин | — | **G0.** Хүн бүр ID-гаа мэднэ |
| P5-02 | MVP | **MN/EN текст** (`i18n/{mn,en}.json`): UI, calendar тайлбар, anomaly загвар, disclaimer, Method текст, D1-ийн "яагаад satellite tasking болохгүй" өгүүлбэр, Harmonize тэмдэглэлүүд | 2 цаг | P4-02 | Key бүр хоёр хэлэнд байна, хүн уншиж шалгасан |
| P5-03 | MVP | **Credit/лиценз** → `docs/credits.md`: FIRMS citation, NASA зураг, geoBoundaries (ODbL, © OpenStreetMap contributors), Natural Earth, CelesTrak, GIBS layer нэр (§9.7) | 1 цаг | — | App-ын footer/About-д орох текст бэлэн |
| P5-04 | MVP | **Platform статус** → `docs/platform_status.md`: Terra, Aqua, S-NPP, NOAA-20, NOAA-21 тус бүр эх сурвалжийн линктэй. Aqua-ийн зөрүүтэй эх сурвалжийг (§9.6) хоёуланг нь бичнэ | 45 мин | — | P3 hover-т ашиглана |
| P5-05 | MVP | **Case study батлах:** P2-07-ийн огноо/бүсээр албан ёсны эсвэл мэдээний эх сурвалж олох. Олдсон тохиолдолд л нэрлэнэ, хэнийг ч буруутгахгүй | 1 цаг | P2-07 | Эх сурвалжтай нэр эсвэл "нэргүй үлдээнэ" гэсэн шийдвэр |
| P5-06 | MVP | **Limitations** (§8) текст: UI, pitch-д | 45 мин | — | i18n + `docs/limitations.md` |
| P5-07 | MVP | **Claims ledger:** demo/pitch-д орох тоо бүр → скрипт + гаралтын файл + commit | үргэлжилнэ | P1-07, P2-06 | Ledger-д оруулаагүй тоо pitch-д байхгүй |
| P5-08 | MVP | **QA:** deploy сайтыг 2 утас + laptop, удаан сүлжээ, reduced-motion, keyboard-оор шалгах. Bug бүрийг эзэнд нь ID-тайгаар өгөх | 1 цаг (G2-ийн дараа) | G2 | Blocker байхгүй |
| P5-09 | Freeze-ийн дараа | **Demo script** (§6, 1 минут) бодит тоотой, **pitch** (§7: хэт амлахгүй, limitation шударга), шүүгчийн хүнд асуултын cheat sheet ("ratio 30% зөрсөн ч таны тест давах уу?" гэх мэт) | 2 цаг | P5-07 | Тоо бүр ledger-т байгаа |
| P5-10 | Freeze-ийн дараа | **Илгээх:** README (ажиллуулах алхам), бүх линк logged-out шалгах, бичлэг, илгээх форм | 1.5 цаг | P5-09 | Илгээсэн, баталгааны screenshot |

---

## 4. Хэн хэнийг блоклодог вэ (critical path)

```
P4-01 ──────────────► бүгд (repo + URL)
P2-01 (fixture) ────► P3, P4 (fixture-ээр шууд эхэлнэ)
P1-01 → P1-02 → P1-03 → P1-04 → P1-05 ─┬─► P1-07 ─► P3-05
                                        └─► P2-05 ─► P4-03 (G1) ─► P2-06 ─► P4-06 (G2)
P2-02 → P2-03 (synthetic дээр, P1-ийг хүлээхгүй)
P2-07 → P5-05 (case study нэр)
P5-02 → P3-03, P4-05 (текст)
```

**Хамгийн эхний 1 цагт:** P1 өгөгдөл татаж эхэлнэ, P2 contract/fixture бичнэ, P4 repo + deploy хийнэ, P3 TLE + globe, P5 T болон нэрсийг тогтооно.

## 5. Хоцорвол юуг эхэлж хасах вэ

Доороос дээш: Nice-to-have бүгд → P4-11 sticky bar → P3-07 камер нисэх → P4-10 галын түүх → P2-09 match class → P4-09 satellite хуудас → P1-09 Aqua heatmap → P2-08 Түвшин 2.

**Хэзээ ч хасахгүй:** calendar + Raw toggle, CSV, Aqua LOYO, хоёр globe (эсвэл түүний calendar нөөц), Method хэсэг, хоосон төлөвгүй байдал, demo.
