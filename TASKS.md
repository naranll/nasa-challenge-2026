# TASKS — 5 хүний ажлын хуваарилалт (PLAN.md-ээс)

**Шинэчилсэн:** 2026-11-14 23:56. **Гол бүтээгдэхүүн = ирэх сарын галын таамаглал (ML)**, harmonization бол түүний суурь (PLAN §1, D15).
**Эх сурвалж:** зөвхөн [PLAN.md](PLAN.md), [GLOSSARY.md](GLOSSARY.md). Шийдвэр бүр PLAN-ийн D-дугаартай холбогдоно.
**Цаг:** хакатон дуусах цагийг **T** гэж тэмдэглэв (PLAN §9.3, нөхөж бичнэ). **Feature freeze = T − 4 цаг.**
**Дараалал:** MVP → MVP+ → Nice-to-have. MVP дуусаагүй байхад MVP+ эхлэхгүй.

---

## 0. Хил хязгаарын дүрэм (бүгд мөрдөнө)

1. **Өөрийн хавтсаа л засна.** Бусдын файл, кодыг унших, **import хийх** нь чөлөөтэй. Өөрчлөх хэрэгтэй бол эзэнд нь хэлнэ, өөрөө засахгүй.
2. **Lane хооронд зөвхөн файлаар харилцана:** `/contracts` (schema) ба `/fixtures`. Schema өөрчлөх = P2 өөрчилж, хэрэглэгч бүрт мэдэгдэнэ.
3. **Fixture бол SYNTHETIC.** Зөвхөн код барихад ашиглана. Demo-д хэзээ ч харагдахгүй (P4-08).
4. **Тоо бүр скриптээс.** Demo, pitch, UI дээрх тоо бүр скриптийн гаралтаас ирж, `docs/claims.md`-д бүртгэгдэнэ (P5).
5. **Зохиохгүй.** Өгөгдөл, эх сурвалж, статус, сэрэмжлүүлэг зохиохгүй. Мэдэхгүй бол `ASSUMPTION` гэж бичээд P5-д хэлнэ.
6. **Leakage-гүй.** m+1 сарыг таахад зөвхөн m сарын төгсгөл хүртэлх мэдээлэл (PLAN D15). Үүнийг зөрчсөн үр дүн demo-д орохгүй.
7. **Шинэ санаа → `docs/parking_lot.md`.** Энэ файлд мөр болж ороогүй ажил хийхгүй.
8. **Time-box хэтэрвэл:** байгаагаа ship хийж, статусаа хэлээд дараагийн ажилдаа ор. Хүлээж суухгүй, fixture ашиглана.
9. **Claude Code-д** session бүрийн эхэнд: "Чи зөвхөн [МИНИЙ ХАВТАС]-ыг засна. Одоогийн task: [ID]. Done when: [...]. Өөр файл засах, шинэ feature нэмэх, refactor хийхгүй. Эхлээд plan харуул." гэж бич.
10. **Нууц:** `FIRMS_MAP_KEY`, `METEOMATICS_USER`, `METEOMATICS_PASSWORD` зөвхөн `.env`-д. Client код руу огт орохгүй, commit хийхгүй.
11. **Ажлаа дуусгавал** (дарааллаар): P2-д туслах (хамгийн их ачаалалтай) → өөр хүний bug → PR review → утсан дээр тест → MN/EN текст шалгах. Шинэ feature эхлүүлэхгүй.

---

## 1. Хэн юуг эзэмших вэ

| Lane | Үүрэг | **Засах эрхтэй** | **Хэзээ ч хийхгүй** |
|---|---|---|---|
| **P1** | Data + Harmonization | `/pipeline/fetch`, `/pipeline/prep`, `/pipeline/harmonize`, `/pipeline/requirements.txt`, `/data` (gitignore), `public/data/{regions,pipeline_stats,ratios}.json`, `public/data/calendar/`, `public/data/hex_year/`, `public/data/exports/`, `docs/data_audit.md`, `docs/methods_harmonization.md` | Model сургах, validation тооцох. UI, текст засах. Дэлхийн бүх өгөгдлийг татах. |
| **P2** | Validation + ML | `/contracts`, `/fixtures`, `/pipeline/validation`, `/pipeline/ml`, `public/data/{validation,baseline,forecast,model_metrics,matches_summary}.json`, `docs/methods_model.md` | Өгөгдөл татах, ratio функц засах (P1-ийнхийг import хийнэ). UI засах. Ялагдсан үр дүнг нуух. |
| **P3** | Globe + Таамаглалын дэлгэц | `/app/src/globe`, `/app/src/harmonize`, `/app/src/forecast`, `/scripts/tle`, `public/data/satellites.json` | Тооцоо хийх (JSON-оос л уншина). Компонент дотор текст hardcode хийх. Calendar, routing. |
| **P4** | App UI + deploy + цаг агаар | `/app` (globe, harmonize, forecast, i18n-ээс бусад), `/app/package.json`, deploy тохиргоо, `/pipeline/weather`, `.env.example`, `docs/research/meteomatics.md` | Тооцоо, model хийх. Компонент дотор текст hardcode хийх. Globe/forecast код засах. |
| **P5** | Story / QA / Lead | `/docs` (дээр нэрлэсэн эзэнтэй файлуудаас бусад), `/app/src/i18n/{mn,en}.json`, `TASKS.md`, `PLAN.md` §9 ба нэрсийг нөхөх | Арга зүй, тоо өөрчлөх. Эх сурвалжгүй статус, сэрэмжлүүлэг бичих. Freeze-ээс өмнө pitch/слайд эхлэх. |

**Сан нэмэх:** Python → P1-д хэл (`requirements.txt`), npm → P4-д хэл (`package.json`).
**Calendar JSON:** P1 эзэмшинэ. P2-ийн `baseline.json`, `forecast.json`-ыг assemble алхамд **зөвхөн уншиж** нэгтгэнэ.

---

## 2. Gate-үүд

| Gate | Хэзээ | Шалгуур |
|---|---|---|
| **G0** | одооноос +1 цаг | Repo + deploy URL ажиллана. Бүх contract + SYNTHETIC fixture бэлэн. FIRMS татаж эхэлсэн. **Meteomatics gate шийдэгдсэн** (P4-W1). |
| **G1** | G0 + ~5 цаг | Монголын **бодит** Raw + Harmonized calendar сайт дээр. `harmonized_monthly.parquet` P2-д бэлэн. |
| **G2** | G1 + ~5 цаг | Бодит `validation.json` (Aqua LOYO) + `model_metrics.json` (ML vs baseline, 3 arm) + `forecast.json`. Таамаглалын дэлгэц бодит өгөгдөл дээр. MVP бүрэн. |
| **G3** | **T − 4 цаг** | **FEATURE FREEZE.** Зөвхөн засвар. Demo, pitch эхэлнэ. |

---

## 3. Task board-ууд

Формат: **ID · Түвшин · Task · Time-box · Хүлээх зүйл (Needs) · Done when**

### P1 — Data + Harmonization

| ID | Түвшин | Task | Box | Needs | Done when |
|---|---|---|---|---|---|
| P1-01 | MVP | MAP_KEY → `.env`, transaction хязгаарыг status-аар шалгах (§9.2). `requirements.txt`: `h3` v4 (тогтоосон), pandas, pyarrow, lightgbm, scikit-learn, requests | 15 мин | — | Status хариу `docs/data_audit.md`-д. P2, P4 сангаа суулгаж чадна |
| P1-02 | MVP | **FIRMS татах** (D6 bbox W85 S37 E127 N56): `MODIS_SP`, `VIIRS_SNPP_SP`, `VIIRS_NOAA20_SP` + `_NRT` сүүл. `DAY_RANGE ≤ 5`, resumable, throttled, cache. **Шууд ажиллуулна.** API гацвал Country Yearly Summary zip | 1 цаг + ~1 цаг ард | P1-01 | Kill → restart үргэлжилнэ. Platform × жилийн мөрийн тоо log-д |
| P1-03 | MVP | **Ratio функцүүд** (D3, D7): r₁(сар) = Σ Aqua / Σ S-NPP + fallback (< 30), r₂, reference chain → harmonized цуваа. Unit test. **Татах ажил явж байх зуур** synthetic дээр бичнэ. Функц нь "аль жилүүдээр калибровк хийх" параметртэй байна (P2-ийн LOYO, rolling-origin үүнийг дуудна) | 2 цаг | P2-01 | Тест ногоон. P2 import хийгээд дуудаж чадна |
| P1-04 | MVP | **Header audit** → `docs/data_audit.md`: багана, огноо, мөр, Aqua-ийн эхний өдөр, VIIRS SP-д `type` бий эсэх | 45 мин | P1-02 | §9.5-ын асуултууд хариулагдсан |
| P1-05 | MVP | **Шүүлт** (§3.3): `type == 0`, байнгын дулааны эх үүсвэрийг **flag** болгох (устгахгүй), NRT-д SP-ийн mask | 1.5 цаг | P1-04 | Flag асаах/унтраахад тоо өөрчлөгдөнө, log-д |
| P1-06 | MVP | **Нэгж + шошго** (D9): MODIS = пиксел, VIIRS = fire unit (H3 res 8 × overpass ±10 мин), түүхий VIIRS пиксел тусад нь. Улс, 22 аймаг, day/night. `regions.json`-д бүс бүрийн **3–5 төлөөлөх цэг** (P4-ийн цаг агаарт) | 2 цаг | P1-05 | `monthly_counts.parquet` contract-д таарна. `regions.json` бэлэн |
| P1-07 | MVP | H3 тест вектор: 20 координат → res 5, res 8 ID → `pipeline/prep/tests/h3_vectors.json` | 15 мин | P1-06 | P3-т хэлсэн |
| P1-08 | MVP | **Бодит harmonization:** `ratios.json` (+ diagnostic: улс, day/night, Aqua drift), r₂ ±15% sanity → `data/interim/harmonized_monthly.parquet` (24 давхардалгүй бүс + bbox) | 1.5 цаг | P1-03, P1-06 | P2 уншиж чадна. Raw vs harmonized график хадгалсан |
| P1-09 | MVP | **Assemble:** `calendar/*.json` (raw + harmonized, P2-ийн baseline/forecast-ыг байвал нэгтгэнэ), `hex_year/{raw,harm}.json` (H3 res 5, raw = **түүхий пиксел**), `pipeline_stats.json` | 1.5 цаг | P1-08 | **G1.** Contract-д таарна. Дахин ажиллуулахад ижил гаралт |
| P1-10 | MVP | Hotspot CSV export: бүс × жилээр `public/data/exports/` | 1 цаг | P1-06 | Excel-д нээгдэнэ |
| P1-11 | MVP | `docs/methods_harmonization.md`: pipeline алхмууд, ratio-ууд, limitation | 45 мин | P1-08 | Тоо бүр скриптээс |
| P1-12 | MVP+ | Case study сонгох скрипт (D14) → `case_study.json` (нэргүй, огноо + бүс) → P5 | 45 мин | P1-08 | P5-д дамжуулсан |
| P1-13 | MVP+ | Aqua давтамжийн heatmap (D11) | 1 цаг | P1-06 | Contract-д таарна |
| P1-14 | MVP+ | Бүсийн галын түүх + он бүрийн хамгийн том галын бүс (камер нисэх) + hotspot дэлгэрэнгүй хэсгүүд | 2 цаг | P1-06 | Файл бүр < ~2 MB |
| P1-15 | Nice | Калифорни (өөр bbox, кодын өөрчлөлтгүй) | 1 цаг | бүгд | Config-оор ажиллана |

### P2 — Validation + ML

| ID | Түвшин | Task | Box | Needs | Done when |
|---|---|---|---|---|---|
| P2-01 | MVP | **Бүх contract + SYNTHETIC fixture:** `monthly_counts`, `harmonized_monthly`, `weather_monthly` (parquet), `regions` (төлөөлөх цэгтэй), `calendar/{region}`, `ratios`, `validation`, `baseline`, `forecast`, `model_metrics`, `hex_year/{raw,harm}`, `matches_summary`, `case_study`, `pipeline_stats`, `satellites`. Fixture бүрт `"synthetic": true` | 1 цаг | — | **G0.** P1, P3, P4 fixture-ээр ажиллаж эхэлсэн |
| P2-02 | MVP | **Harmonization validation** (D10): Aqua LOYO (2012–2021), forward, нэг-ratio baseline, r₂ LOYO. WAPE + correlation → `validation.json` + график. P1-ийн ratio функцийг import хийнэ | 1.5 цаг | P1-03 | Synthetic дээр ажиллана, P1-08-ийн дараа нэг командаар бодитоор |
| P2-03 | MVP | **Түвшин 1 baseline** (D11): медиан + P25–P75, `method="lower"`, log1p → `baseline.json` | 1 цаг | P2-01 | Гараар 3 тоо шалгасан |
| P2-04 | MVP | **Backtest framework:** rolling-origin 2015–2025, Y бүрд r₁-ийг Y-ээс өмнөх жилүүдээр дахин тооцно (P1-03), WAPE, жилүүдээр bootstrap. Ямар ч model-ийг нэг интерфейсээр залгана. **Leakage тест** (m+1-ийн мэдээлэл feature-д орвол унах) | 2 цаг | P1-03 | Түвшин 1-ийг framework-оор ажиллуулж WAPE гарсан |
| P2-05 | MVP | **Түвшин 2** (β, бүс бүрд) framework дотор | 1 цаг | P2-04 | WAPE бүсээр |
| P2-06 | MVP | **ML v1** (D15): feature table (сүүлийн 1–3 сар, өнгөрсөн жилийн ижил сар, baseline, anomaly, сар cyclical, бүс), LightGBM (жижиг мод) + Ridge нөөц | 2.5 цаг | P2-04, P1-08 | v1-ийн WAPE бүсээр, Түвшин 1–2-той нэг хүснэгтэд |
| P2-07 | MVP | **ML v2** = v1 + цаг агаар (`weather_monthly`, зөвхөн m сарын утга). **P4-W1 gate "үгүй" бол алгасаж**, шалтгааныг `docs/methods_model.md`-д бичнэ | 1.5 цаг | P2-06, P4-W2 | v1 vs v2 WAPE зэрэгцэн |
| P2-08 | MVP | **Kill check + нотолгоо:** бүс бүрийн kill criterion (≥ 5% + bootstrap), 3 backtest arm (ижил model), P10–P90 үлдэгдлийн хүрээ, feature importance → `forecast.json`, `model_metrics.json` | 2 цаг | P2-06 (P2-07 байвал) | **G2.** Бүс бүрээр "харуулах / зөвхөн хэвийн хүрээ" шийдэгдсэн. Ялагдсан бол тэр хэвээрээ бичигдсэн |
| P2-09 | MVP | `docs/methods_model.md`: feature, leakage дүрэм, backtest, kill-ийн үр дүн, limitation | 45 мин | P2-08 | Тоо бүр скриптээс |
| P2-10 | MVP+ | Match class (D8), R = 100/300/500 → `matches_summary.json` | 2 цаг | P1-08 | Хоёр чиглэлийн хувь |
| P2-11 | Nice | Бүс бүрийн SHAP, day/night 24 ratio, H3 res 7 sensitivity | 2 цаг | P2-08 | — |

### P3 — Globe + Таамаглалын дэлгэц

| ID | Түвшин | Task | Box | Needs | Done when |
|---|---|---|---|---|---|
| P3-01 | MVP | `scripts/tle`: CelesTrak TLE snapshot (5 platform) + metadata + эх сурвалж → `satellites.json` | 45 мин | P2-01 | Demo-д сүлжээ дуудахгүй |
| P3-02 | MVP | **Нүүрний globe:** хар сансар + одод, 5 platform `satellite.js`-ээр, dotted тойрог зам, ижил sensor-ийг нарийн зураасаар холбох, bbox-оос гадна бүдэг | 2 цаг | P4-01, P3-01 | Утсан дээр гацахгүй |
| P3-03 | MVP | **Hover:** platform, sensor, хөөргөсөн огноо, манай өгөгдөл дэх сүүлийн илрүүлэлт, статус + линк (P5-04). "Одоо ажиллаж байна" гэж гараар бичихгүй | 45 мин | P3-02 | Текст i18n key-ээс |
| P3-04 | MVP | h3-js v4 тест (P1-07-ийн вектор) | 15 мин | P1-07 | Бүх ID таарсан |
| P3-05 | MVP | **Harmonize hero** (D12): хоёр globe (Raw "түүхий пиксел" / Harmonized), камер sync, H3 res 5 hex, 2003→2025 scrubber, шугаман график, "ойролцоолол" тэмдэглэл | 3 цаг | P1-09 (эхлээд fixture) | Scrubber 2012-ыг давахад Raw гэрэлтэж, Harmonized тэгш |
| P3-06 | MVP | WebGL байхгүй / FPS бага → P4-07 руу автоматаар шилжих | 45 мин | P4-07 | WebGL унтраахад fallback гарна |
| P3-07 | MVP | **Таамаглалын дэлгэц** (PLAN §4): аймгуудыг "хэвийнээс зөрөх төлөв"-өөр эрэмбэлсэн жагсаалт. Аймаг бүрт таамаглал + P10–P90 + baseline, "X дахин их/бага байх төлөвтэй", гол 3 feature. Kill-д тэнцээгүй бол зөвхөн "хэвийн хүрээ". **Backtest самбар:** ML vs Түвшин 1–2, harmonized-all vs raw-VIIRS-only, v1 vs v2 (тоо `model_metrics.json`-оос). Disclaimer | 2.5 цаг | P2-01 (fixture) → P2-08 | **G2.** Бүх тоо JSON-оос, хоосон төлөвгүй |
| P3-08 | MVP+ | Globe дээр аймгийг таамаглалаар будах. Бүс дарахад zoom, scroll-оор камер нисэх, reduced-motion | 2.5 цаг | P2-08, P1-14 | Reduced-motion дээр анимацгүй |
| P3-09 | Nice | Uncertainty дүрс `scan × track` | 1 цаг | P1-14 | — |

### P4 — App UI + deploy + цаг агаар

| ID | Түвшин | Task | Box | Needs | Done when |
|---|---|---|---|---|---|
| P4-01 | MVP | **Scaffold:** Vite + React + TS, router (Нүүр / Harmonize / **Таамаглал** / Бүс + Calendar / Method), сан (`react-globe.gl`, `satellite.js`, `h3-js` v4), `MOCK` data client, **static deploy + URL** | 1 цаг | — | **G0.** Бүгд clone хийж ажиллуулна, URL нээгдэнэ |
| P4-W1 | MVP | **Meteomatics gate** (PLAN D15, §9.8): account-ын төрөл (Space Apps / trial / Free Basic), **2003 оноос түүх авч болох эсэх** (нэг жижиг query-ээр шалгах), query хязгаар, параметрийн яг нэр (URL Creator) → `docs/research/meteomatics.md`. Шийдвэрийг P2-д хэлнэ | 30 мин | — | **G0.** "Тийм/үгүй" шийдэгдсэн. Free Basic бол **"үгүй"** (24 цагийн түүх) |
| P4-W2 | MVP | **Цаг агаар татах** (gate "тийм" бол): `regions.json`-ий төлөөлөх цэгүүд, 2002–2026, өдрийн температур, хур тунадас, чийгшил, салхи, цасны зузаан. Нэг query-д олон цэг. Resumable, query тоолуур → сараар нэгтгэсэн `data/interim/weather_monthly.parquet` | 2 цаг | P4-W1, P1-06 (эхлээд fixture-ийн цэг) | Нийт query < хязгаар. Contract-д таарна. Сар бүр 24 бүсэд утгатай |
| P4-02 | MVP | Layout, i18n plumbing, өнгө, монгол фонт (ө, ү) | 1 цаг | P4-01 | MN/EN солигдоно |
| P4-03 | MVP | **Calendar:** сар × он, cividis төст ramp, **Raw toggle**, NOAA-20 хэсэг тасархай, ирэх сарууд тасархай (таамаглал), бүрэн бус сарын тэмдэглэл, tooltip | 2.5 цаг | P2-01 → P1-09 | **G1.** Бодит calendar сайт дээр |
| P4-04 | MVP | AOI (аймаг/улс/bbox), огнооны муж, calendar CSV (browser-т), hotspot CSV (P1-10) | 1.5 цаг | P4-03, P1-10 | CSV татагдана |
| P4-05 | MVP | Anomaly өгүүлбэр ("энэ сард хэвийнээс X дахин"), < 5 fire unit дүрэм, disclaimer | 45 мин | P4-03, P5-02 | Текст i18n-ээс |
| P4-06 | MVP | **Method хэсэг** (D13): зүүн = pipeline, баруун = тестүүд (Aqua LOYO, forward, нэг-ratio, r₂ LOYO, **ML backtest, kill criterion**) + тоо JSON-оос | 1 цаг | P2-02, P2-08 | Тоо бүр JSON-оос |
| P4-07 | MVP | "For scientists" Raw vs Harmonized calendar (P3-06-ийн fallback) | 45 мин | P4-03 | P3 импортлож чадна |
| P4-08 | MVP | Хоосон төлөвгүй (skeleton, "hotspot бүртгэгдээгүй" өгүүлбэр, N/A хэзээ ч үгүй). **Production build-д `synthetic: true` байвал build унана** | 45 мин | P4-01 | Fixture-тэй production build унадаг |
| P4-09 | MVP+ | Satellite хуудас (NASA зураг + credit, "арга хэмжээ" хэсэггүй) | 1.5 цаг | P3-01, P5-03 | — |
| P4-10 | MVP+ | Бүсийн галын түүх + hotspot дэлгэрэнгүй + GIBS зураг | 2 цаг | P1-14 | Чийгшил/уулын зураг харуулахгүй |
| P4-11 | MVP+ | Sticky bar | 1 цаг | P4-02 | Keyboard-оор ажиллана |
| P4-12 | Nice | AOI зурах / lat-lon | 1.5 цаг | P4-04 | — |

### P5 — Story / QA / Lead

| ID | Түвшин | Task | Box | Needs | Done when |
|---|---|---|---|---|---|
| P5-01 | MVP | **T-г тогтоох**, freeze = T − 4 цаг. Lane бүрт нэр бичих. PLAN §9-ийг эзэнд нь хуваарилах. `docs/parking_lot.md`, `docs/claims.md` үүсгэх | 30 мин | — | **G0.** Хүн бүр ID-гаа мэднэ |
| P5-02 | MVP | **MN/EN текст:** UI, calendar, anomaly загвар, **таамаглалын хэллэг** ("... байх төлөвтэй", "хэвийн хүрээ", kill-д тэнцээгүй үеийн өгүүлбэр), disclaimer, Method, D1-ийн өгүүлбэр | 2 цаг | P4-02 | Key бүр хоёр хэлэнд, хүн уншиж шалгасан |
| P5-03 | MVP | Credit/лиценз → `docs/credits.md`: FIRMS, NASA зураг, **Meteomatics**, geoBoundaries (ODbL, © OSM), Natural Earth, CelesTrak, GIBS | 1 цаг | — | Footer/About-ын текст бэлэн |
| P5-04 | MVP | Platform статус → `docs/platform_status.md` (эх сурвалжийн линктэй) | 45 мин | — | P3 hover-т ашиглана |
| P5-05 | MVP | Limitations (PLAN §8 + **model**: богино түүх, сарын түвшин, цаг агаар нь цэгийн дундаж, таамаглал сэрэмжлүүлэг биш) | 45 мин | P2-09 | i18n + `docs/limitations.md` |
| P5-06 | MVP | Claims ledger: demo/pitch-ийн тоо бүр → скрипт + гаралт + commit | үргэлжилнэ | P1-09, P2-08 | Ledger-д ороогүй тоо pitch-д байхгүй |
| P5-07 | MVP | **QA:** 2 утас + laptop, удаан сүлжээ, reduced-motion, keyboard. Bug-ийг эзэнд нь ID-тайгаар | 1 цаг (G2-ийн дараа) | G2 | Blocker байхгүй |
| P5-08 | MVP+ | Case study батлах (P1-12-ийн огноо/бүсээр эх сурвалж олох, олдвол л нэрлэнэ) | 1 цаг | P1-12 | Эх сурвалжтай нэр эсвэл "нэргүй" |
| P5-09 | Freeze-ийн дараа | **Demo script** (PLAN §6), **pitch** ("харьцуулж болохуйц 23 жил = илүү сайн таамаглал", хэт амлахгүй), шүүгчийн хүнд асуултын cheat sheet ("leakage байхгүй гэдгийг яаж мэдэх вэ?", "baseline-аас хэр илүү вэ?", "ratio 30% зөрвөл?") | 2 цаг | P5-06 | Тоо бүр ledger-т |
| P5-10 | Freeze-ийн дараа | Илгээх: README, линкүүд logged-out, бичлэг, форм | 1.5 цаг | P5-09 | Илгээсэн, screenshot |

---

## 4. Хэн хэнийг блоклодог вэ (critical path)

```
P4-01 ─────────────────────► бүгд (repo + URL)
P2-01 (fixture) ───────────► P1-03, P3, P4 (шууд эхэлнэ)
P1-02 → P1-04 → P1-05 → P1-06 → P1-08 ─┬─► P1-09 → P4-03, P3-05   (G1)
                                       └─► P2-06 → P2-07 → P2-08 → P3-07, P4-06   (G2)
P1-03 (ratio функц) ───────► P2-02, P2-04
P4-W1 (Meteomatics gate) → P4-W2 → P2-07
```

**Хамгийн эхний 1 цагт:** P1 FIRMS татаж эхэлнэ, P2 contract/fixture, P4 repo + deploy + **Meteomatics gate**, P3 TLE + globe, P5 T болон нэрсийг тогтооно.
**Хамгийн их ачаалалтай нь P2** (~13 цаг MVP). Ажлаа дуусгасан хүн эхлээд P2-ийн тест, баримт бичиг дээр тусална (P2 зөвшөөрсөн хүрээнд).

## 5. Хоцорвол юуг эхэлж хасах вэ

Доороос дээш: Nice-to-have бүгд → MVP+ бүгд (P4-11 → P3-08 → P4-10 → P2-10 → P4-09 → P1-13/14 → P1-12/P5-08) → **P2-07 ML v2 (цаг агаар)** → P2-05 Түвшин 2.

**Хэзээ ч хасахгүй:** ML v1 + rolling-origin + Түвшин 1-тэй харьцуулалт + kill check, 3 backtest arm, таамаглалын дэлгэц, calendar + Raw toggle, CSV, Aqua LOYO, хоёр globe (эсвэл calendar нөөц), Method хэсэг, хоосон төлөвгүй байдал, demo.
