# SPEC — Нүүр хуудас: 3D дэлхий, 5 хиймэл дагуул, infographic

**Issue:** [#10 — 3-Home page: Earth and satellites with infographics](https://github.com/naranll/nasa-challenge-2026/issues/10) (Job 3, P3 lane)
**Бичсэн:** 2026-11-15 · **Эх сурвалж:** [PLAN.md](../../../PLAN.md), [GLOSSARY.md](../../../GLOSSARY.md), issue #10 (мөн хамаарлын хувьд #22, #23).
**Төлөв:** Draft. Код бичээгүй.

**Тэмдэглэгээ:**
- `[#10]` = issue #10-д бичигдсэн шаардлага.
- `[PLAN §x]` = PLAN-д бичигдсэн, батлагдсан.
- `[Хүсэлт]` = энэ spec-ийн анхны хүсэлтэд байсан шаардлага.
- `[A#]` = **ASSUMPTION**. PLAN-д ч, #10-д ч байхгүй эсвэл тодорхойгүй. Баг батлах хүртэл түр шийдвэр. Бүгдийг §14-ийн хүснэгтэд жагсаасан.

---

## 0. Зорилго

Шүүгч сайтыг нээгээд **эхний 5 секундэд** "MODIS ба VIIRS мэдрэгчтэй хиймэл дагуулууд дэлхийг тойрон галын өгөгдөл цуглуулдаг" гэдгийг ойлгоно `[Хүсэлт]`. Demo-гийн 0–10 секундэд "Globe дээр 5 platform эргэлдэнэ" `[PLAN §6]`.

#10-ын дагуу нүүр хуудас гурван хэсэгтэй:
1. **Globe:** хар сансар, 3D дэлхий, Монголоос гадна бүдэг, 5 хиймэл дагуул хөдөлнө, hover card.
2. **Infographic:** манай түүхий өгөгдлөөс хиймэл дагуул бүрийн жилийн hotspot-ийн тоо, зогсож буй sensor-ууд.
3. **Товчнууд:** бусад хуудас руу орох. 3D ажиллахгүй үед ч хэвээр харагдана.

Нэр томьёо GLOSSARY-аар: **Platform** = хиймэл дагуул (Terra, Aqua, …), **Sensor** = мэдрэгч (MODIS, VIIRS), **Hotspot** = FIRMS-ийн галтай гэж тэмдэглэсэн нэг pixel. UI-д "хиймэл дагуул" гэж бичиж болно, кодод `platform` гэж нэрлэнэ.

---

## 1. Хил ба хамаарал

### 1.1 Засах файл, хавтас `[#10]`, `[Хүсэлт]`
| Зам | Агуулга |
|---|---|
| `app/src/globe/` | Globe, hover card, infographic, нүүрний товчнууд, тест, fallback зураг, энэ SPEC |
| `scripts/tle/` | Build үеийн TLE татах скрипт |
| `public/data/satellites.json` | Скриптийн гаралт (snapshot) |

### 1.2 Хийхгүй
- Harmonization тооцоо, ratio, calendar, routing тохиргоо `[Хүсэлт]`.
- Hotspot тоолох. Тоог Job 2-ийн гаралтаас л уншина (§7).
- i18n json-ийг шууд засахгүй. Key-ийн жагсаалтыг P5-д өгнө (§10).

### 1.3 Хамаарал
| Issue | Юу хэрэгтэй | Хүлээх хооронд |
|---|---|---|
| [#22](https://github.com/naranll/nasa-challenge-2026/issues/22) Job 1 | Vite + React + TS scaffold, хуудсууд ба router, өгөгдөл ачаалагч (эхлээд fixture), deploy | `scripts/tle`-ийг бие даан эхэлж болно |
| [#23](https://github.com/naranll/nasa-challenge-2026/issues/23) Job 2 | Platform бүрийн hotspot-ийн тоо, жилээр, эхний/сүүлийн огноо | Fixture-ээр ажиллана. Demo-д fixture хэзээ ч харагдахгүй `[#10]` |

### 1.4 Хилээс гадуур, бусдаас хүсэх
- **[A1]** `react-globe.gl`, `satellite.js`-ийг dependency болгох, `scripts/tle`-ийг build-ийн өмнө ажиллуулах hook (`prebuild`) нэмэх. Энэ нь `app/package.json`-д хамаарах тул #22-ийн scaffold-д оруулж өгөхийг хүснэ.
- **[A2]** `public/data/` нь Vite-ийн `publicDir` гэж ойлгосон. App `app/` дотор байрлах тул Vite-ийн default нь `app/public/`. Repo-ийн root дахь `public/` уу, `app/public/` уу гэдгийг #22-оор тогтооно. Browser-оос `/data/...` URL-аар уншина.
- **[A3]** Өгөгдөл ачаалагч ба i18n-ийн hook-ийн API-г #22 өгнө. Энэ spec `loadData(name)` ба `t(key, params)` хэлбэртэй гэж таамаглав.
- **[A4]** `contracts/` хавтсанд `satellites` ба `pipeline_stats`-ийн schema байж магадгүй. Энэ spec түүнийг шалгаагүй. §5.3 ба §7.1-ийг contract-тай тулгана.

---

## 2. Stack `[PLAN §4]`

- Vite + React + TypeScript.
- `react-globe.gl` (three-globe) нь globe-ийн дүрслэл.
- `satellite.js` нь TLE-ээс байрлал тооцоолно (SGP4).
- CelesTrak-ийн бодит TLE-г **build хийх үед** snapshot болгоно. Demo үед сүлжээ дуудахгүй `[#10]`. Бүх өгөгдөл статик JSON.

Шинэ library сонгохгүй. Infographic-ийг нэмэлт сангүйгээр SVG-ээр зурна **[A5]**. Тест: Vite-тэй хамт ажилладаг Vitest гэж таамаглав **[A6]** (PLAN-д test framework заагаагүй).

---

## 3. Globe

### 3.1 Дүрслэл
- Хар сансар + жижиг одод, 3D дэлхий `[#10]`, `[PLAN §4]`.
- **Монголоос гадна хэсэг бүдэг** `[#10]`, `[PLAN D6]`. Хажууд нь жижиг тайлбар: "Демо зөвхөн Монголыг хамарна".
  - **[A7]** Хэрэгжүүлэлт: дэлхийн texture-ийг бага зэрэг бараан болгож, Монголын хилийн polygon-ийг тод өнгөөр давхарлана. Хилийн өгөгдөл: geoBoundaries `[PLAN §3.5, §8]` (ODbL, credit заавал). Polygon-ийн файлыг аль хавтсанд, ямар нарийвчлалаар (жишээ нь ≤ 50 KB болтол хялбарчилсан) байлгахыг Job 2-ийн өгөгдөлтэй тохирно.
- **[A8]** Одтой арын дэвсгэрийг globe-ийн canvas дотор зурна.
- **[A9]** Дэлхийн texture: нэг day-texture (mobile дээр ≤ 2048×1024, WebP/JPG). Эх сурвалж ба лицензийг Job 13 (credit) баталгаажуулна.
- **[A10]** Atmosphere glow-ийг desktop дээр асаана, FPS бага бол унтраана (§9.3).

### 3.2 Хөдөлгөөн ба удирдлага `[Хүсэлт]`
| Үйлдэл | Desktop | Утас (touch) |
|---|---|---|
| Аажим эргэлт | Автоматаар | Автоматаар |
| Эргүүлэх | Хулганаар чирэх | Нэг хуруугаар чирэх |
| Zoom | Mouse wheel / trackpad | Хоёр хуруугаар pinch |
| Сонгох | Hover (tooltip), click (card түгжих) | Tap (card нээх), хоосон газар tap (хаах) |

- **[A11]** Auto-rotate: нэг бүтэн эргэлт ~120 секунд. Хэрэглэгч хүрэхэд зогсож, 4 секунд идэвхгүй болоход дахин эхэлнэ.
- **[A12]** Zoom-ийн хязгаар: дэлхий дэлгэцийн өндрийн ~40%-аас ~250% хүртэл.
- **[A13] Scroll-ийн зөрчил:** Globe нь wheel ба touch-ийг барьж аваад хуудсыг доош scroll хийх (infographic руу очих) боломжгүй болгож болно.
  - Desktop: globe дээр дарсан эсвэл чирсний дараа л wheel zoom хийнэ. Хулгана globe-оос гарахад унтарна.
  - Утас: globe дэлгэцийн өндрийн ≤ 75%-ийг эзэлнэ. Доор нь дараагийн хэсгийн ирмэг харагдаж, тэр хэсгээс scroll хийнэ.
- `prefers-reduced-motion` үед: auto-rotate байхгүй, цаг хурдасгахгүй (§4.4). PLAN §4-ийн reduced-motion дүрмийг globe-д мөн хэрэглэв **[A14]**.

---

## 4. 5 platform

### 4.1 Жагсаалт, PLAN ба #10-тай тулгасан
| id | Platform | Sensor | PLAN / #10 |
|---|---|---|---|
| `terra` | Terra | MODIS | ✅ #10, PLAN §4. Calendar-т тоологдохгүй ч globe-д харагдана (D4) |
| `aqua` | Aqua | MODIS | ✅ Reference chain-ий 1-р platform (D3) |
| `snpp` | Suomi NPP | VIIRS | ✅ Reference chain-ий 2-р platform. FIRMS өгөгдөл 2026-11-02-нд зогссон (PLAN §1, #10) |
| `noaa20` | NOAA-20 | VIIRS | ✅ Reference chain-ий 3-р platform |
| `noaa21` | NOAA-21 | VIIRS | ✅ Globe-д харагдана, **reference chain-д ашиглахгүй** (D3) |

PLAN, #10, GLOSSARY гурвуулаа таарч байна.

### 4.2 Өнгө
- MODIS ба VIIRS **хоёр өнгө** `[#10]`, `[PLAN §4]`.
- **[A15]** Яг өнгийг заагаагүй. Шаардлага:
  - Харанхуй дэвсгэр дээр 3:1-ээс дээш contrast.
  - Өнгөний хараа сул хүн ялгаж чадна (улаан/ногоон хосыг хэрэглэхгүй).
  - Мэдээллийг зөвхөн өнгөөр биш, legend-ийн текстээр давхар дамжуулна.
  - Нэг constant-д тодорхойлж globe, hover card, infographic гурвуулаа ижил өнгө ашиглана.

### 4.3 Дүрслэх элементүүд
1. **Одоогийн байрлал:** platform бүрд marker, sensor-ийн өнгөтэй.
2. **Тойрог замын шугам:** dotted (тасархай) `[#10]`, sensor-ийн өнгөтэй, бага opacity.
3. **Ижил sensor-ийн холбоос:** ижил sensor-тэй platform-уудыг нарийн зураасаар холбоно `[#10]`. Terra–Aqua (MODIS), S-NPP–NOAA-20–NOAA-21 (VIIRS).
4. **Legend:** "MODIS: Terra, Aqua", "VIIRS: Suomi NPP, NOAA-20, NOAA-21". 5 секундийн зорилгод хамгийн чухал текст. Мөр бүр товч бөгөөд дарахад тухайн platform сонгогдоно, keyboard-оор хүрнэ.
5. **TLE snapshot мөр:** "Тойрог зам: CelesTrak, {огноо}" (§5.5).

**Давхцал** `[PLAN §4]`: Aqua ба 3 VIIRS бараг нэг хавтгайд явдаг тул тойрог замууд нь давхцана.
- **[A16]** Hover/сонгосон platform-ийн тойрог зам тод болж, бусад нь бүдгэрнэ. VIIRS-ийн гурван тойрог замд өөр өөр dash pattern өгнө.

### 4.4 Хөдөлгөөний хурд
Бодит хурдаар (~7.5 км/с) 5 секундэд хиймэл дагуул нүдэнд бараг хөдлөхгүй, гэтэл #10 "5 satellites moving" гэж шаарддаг.
- **[A17]** `timeScale` prop. Эхлэх мөчид байрлал = **одоогийн бодит цаг**, дараа нь `timeScale` дахин хурдан явна. Default-ийг баг сонгоно (санал: 60, нэг тойрог ~100 секунд). `timeScale > 1` үед "Хурдасгасан ×{n}" шошго заавал харагдана.
- `prefers-reduced-motion` үед `timeScale = 1`.

---

## 5. Тойрог замын өгөгдөл

### 5.1 Урсгал
```
[build]  scripts/tle  ──HTTP──▶  CelesTrak (GP, TLE)
              │
              ▼  шалгах (checksum, satellite.js parse, propagate)
         public/data/satellites.json   (git-д commit хийнэ [A18])
              │
[browser]     ▼  #22-ийн өгөгдөл ачаалагч (same-origin, статик)
         satellite.js: twoline2satrec → propagate → eciToGeodetic
              │
              ▼
         react-globe.gl: marker, тойрог зам, холбоос
```
Demo үед гадны API руу нэг ч хүсэлт явахгүй `[#10]`, `[PLAN §4]`.

### 5.2 `scripts/tle` (build үед)
- **[A19]** Хэл: Node (TypeScript эсвэл ESM JS). Browser-той ижил `satellite.js`-ээр шалгана.
- **[A20]** NORAD catalog дугаар (CelesTrak дээр шалгаж батална): Terra 25994, Aqua 27424, Suomi NPP 37849, NOAA-20 43013, NOAA-21 54234. Скриптийн config-д нэг газар.
- **[A21]** Эх сурвалж: CelesTrak GP endpoint, catalog дугаараар, TLE формат (`https://celestrak.org/NORAD/elements/gp.php?CATNR={id}&FORMAT=TLE`). URL-ийг CelesTrak-ийн баримт бичгээр шалгана. API key хэрэггүй. User-Agent нь ерөнхий нэр.
- Алхмууд:
  1. 5 platform-ийн TLE-г дарааллаар татна (CelesTrak-д ачаалал өгөхгүй).
  2. Шалгана: 2 мөр, мөр бүрийн checksum, catalog дугаар таарна, `twoline2satrec` алдаагүй (`satrec.error === 0`), одоогийн цагт `propagate` бодит тоо буцаана.
  3. Epoch-ийг ISO огноо болгон хадгална.
  4. Статик metadata-г нэгтгэнэ (§5.3).
  5. Түр файлд бичээд rename хийнэ. Хагас бичигдсэн файл үлдэхгүй.
- **[A22] Алдааны дүрэм:**
  - Сүлжээ байхгүй эсвэл аль нэг platform амжилтгүй бол: одоо байгаа `satellites.json` хүчинтэй бол хэвээр үлдээж, warning хэвлэж, exit 0. Зарим platform-ийг шинэчилж, заримыг хуучнаар үлдээхгүй (бүгд шинэ эсвэл бүгд хуучин).
  - Хүчинтэй файл огт байхгүй бол exit 1.
  - `--offline` flag: сүлжээнд гарахгүй, одоо байгаа файлыг шалгана.

### 5.3 `satellites.json` schema `[PLAN §3: TLE snapshot + metadata + эх сурвалж]`
**[A23]** (contract-тай тулгана, [A4]):
```jsonc
{
  "schema_version": 1,
  "generated_at": "2026-11-15T08:00:00Z",
  "synthetic": false,
  "tle_source": { "name": "CelesTrak", "url": "https://celestrak.org/..." },
  "platforms": [
    {
      "id": "aqua",
      "norad_id": 27424,
      "sensor": "MODIS",
      "launch_date": "2002-05-04",
      "launch_source_url": "https://...",
      "in_reference_chain": true,
      "tle": { "line1": "1 27424U ...", "line2": "2 27424 ...", "epoch": "2026-11-14T21:33:10Z" },
      "status_source_url": "https://..."
    }
  ]
}
```
- Энэ файлд зөвхөн тойрог зам ба статик metadata. **Hotspot-ийн тоо, огноо энд орохгүй.** Тэдгээрийг Job 2-ийн гаралтаас runtime-д уншина (§7.1). Ингэснээр тоо бүр нэг л эх сурвалжтай.
- Текст (нэр, статусын өгүүлбэр) орохгүй. Текст нь i18n-д байна (§10).
- **[A24]** Хөөргөсөн огноо: PLAN-д зөвхөн Aqua (2002-05-04) бий. Бусад 4-ийнх эх сурвалжийн линктэйгээр баталсны дараа л бичигдэнэ. Баталгаагүй утгыг UI-д гаргахгүй `[#10: never invent data or sources]`.
- Хэмжээ ≤ 5 KB (gzip).

### 5.4 Browser дээрх байрлалын тооцоо
1. Ачаалахад: platform бүрд `satellite.twoline2satrec(line1, line2)` нэг удаа. `satrec.error !== 0` бол тухайн platform "тойрог замгүй" (§6.3).
2. Симуляцийн цаг: `t = t₀ + (performance.now() − p₀) × timeScale`, `t₀` = хуудас нээгдсэн бодит цаг.
3. Байрлал:
   - `pv = satellite.propagate(satrec, t)` → ECI байрлал (км).
   - `gmst = satellite.gstime(t)`.
   - `geo = satellite.eciToGeodetic(pv.position, gmst)` → өргөрөг, уртраг (радиан), өндөр (км).
   - Градус руу хөрвүүлнэ. Globe-ийн altitude = `өндөр_км / 6371`.
   - NaN эсвэл `pv.position` байхгүй бол marker-ийг нууж, legend-д үлдээнэ.
4. **[A25] Тойрог замын шугам:** тойргийн хугацаа `2π / satrec.no` (минут). Одоогоос −½ ба +½ тойрог хүртэл 180 цэг. Earth-fixed координатад зурдаг тул шугам бүрэн битүү цагираг биш байна, энэ бол бодит ground track. Симуляцийн цагаар ¼ тойрог өнгөрөх бүрд шинэчилнэ.
5. **[A26] Render:** marker-ийн байрлалыг React state-ээр биш, frame бүрд three.js объектын `position`-ийг шууд шинэчилнэ. React re-render зөвхөн hover/сонголт өөрчлөгдөхөд.

### 5.5 TLE хуучирвал
TLE-ийн нас ихсэх тусам SGP4-ийн байрлалын алдаа ихэсдэг. Нас = `t − tle.epoch`.
**[A27]** Босго:

| TLE-ийн нас | Зан төлөв |
|---|---|
| ≤ 7 хоног | Хэвийн. Credit мөрөнд snapshot огноо. |
| 7–30 хоног | Хэвийн дүрсэлнэ. Card-д "Тойрог замын өгөгдөл {n} хоногийн настай, байрлал ойролцоо". |
| > 30 хоног эсвэл `propagate` алдаа | Marker ба тойрог замыг харуулахгүй. Legend-д нэр, sensor хэвээр, "Тойрог замын өгөгдөл хуучирсан" тэмдэглэлтэй. |

- Build үед epoch 7 хоногоос хуучин бол warning.
- Demo-гийн өмнө `scripts/tle`-ийг дахин ажиллуулж commit хийнэ (§13).
- **[A28]** S-NPP-ийн FIRMS өгөгдөл зогссон ч CelesTrak шинэ TLE өгсөөр байгаа эсэх тодорхойгүй. Дээрх хүснэгтээр автоматаар зохицно.

---

## 6. Hover ба tap card

### 6.1 Гох
- Desktop: marker дээр hover → tooltip. Click → card түгжигдэнэ. Esc эсвэл хоосон газар click → хаана.
- Утас: tap → card. Хоосон газар tap эсвэл "Хаах" → хаана.
- Keyboard: legend-ийн мөрөнд Tab + Enter → card.
- **[A29]** Утсан дээр tap-ийн хүрээ ≥ 44×44 CSS px.
- Hover/сонгосон үед тухайн тойрог зам тод болж, auto-rotate түр зогсоно.

### 6.2 Card-ийн талбарууд `[#10]`
| Мөр | Утга хаанаас | Эх |
|---|---|---|
| Нэр | i18n `globe.platform.{id}.name` | `[#10]` |
| Мэдрэгч | i18n `globe.sensor.{modis\|viirs}` | `[#10]` |
| Хөөргөсөн огноо | `satellites.json` → `launch_date` (бүтэн огноо) | `[#10]`, `[PLAN §4]` |
| Манай өгөгдөл дэх эхний ба сүүлийн hotspot | Job 2-ийн гаралт (§7.1) | `[#10]` |
| Hotspot-ийн тоо (манай өгөгдөлд, түүхий) | Job 2-ийн гаралт (§7.1) | `[#10]` |
| Албан ёсны статусын мөр + эх сурвалжийн линк | i18n `globe.status.{id}` + `status_source_url` | `[#10]`, `[PLAN §4]` |
| Өндөр | §5.4-аас тооцоолсон, км | `[Хүсэлт]` (#10-д байхгүй, **[A30]**) |
| TLE хуучирсан тэмдэглэл | §5.5 | **[A27]** |

- "Одоо ажиллаж байна" гэх мэт статусыг кодод гараар бичихгүй `[PLAN §4]`. Статусын өгүүлбэрийг эх сурвалжтайгаар P5 бичнэ.
- Hotspot-ийн тоо нь **түүхий** тоо (MODIS = pixel, VIIRS = pixel). VIIRS-ийн pixel жижиг тул тоо нь илүү их гардаг. Card дээр "түүхий pixel" гэсэн шошго заавал байна `[PLAN D12]`. Ингэснээр "VIIRS илүү их гал хардаг" гэсэн буруу ойлголт үүсэхгүй **[A31]**.
- **[A32]** Огноо, тоог `Intl.DateTimeFormat`, `Intl.NumberFormat`-аар locale-оор форматлана.

### 6.3 Утга байхгүй үед
"N/A", хоосон мөр, `undefined` хэзээ ч харагдахгүй `[PLAN §4]`, `[#22: never show N/A]`.
- `launch_date` байхгүй → мөрийг бүхэлд нь нууна.
- Job 2-ийн файл ачаалагдаагүй → огноо ба тооны мөрүүдийг нууна.
- Job 2 тухайн platform-д 0 мөр байна гэж баталсан → "Манай Монголын өгөгдөлд ороогүй" **[A33]** (NOAA-21-ийн өгөгдөл байгаа эсэх тодорхойгүй).
- Өндрийг тооцож чадахгүй → мөрийг нууж, TLE хуучирсан тэмдэглэл харуулна.

### 6.4 Текстийн дүрэм `[Хүсэлт]`
- Хэрэглэгчид харагдах **бүх** текстийг (aria-label, alt, title орно) `app/src/i18n/` доторх `mn`, `en` json-оос key-ээр уншина.
- `app/src/globe/` доторх компонентод текстийн string literal байхгүй. Platform id, sensor-ийн код (`"MODIS"`) нь дотоод утга тул зөвшөөрнө.
- Хэл солиход WebGL scene-ийг дахин үүсгэхгүй, зөвхөн текст шинэчлэгдэнэ.

---

## 7. Infographic `[#10]`

#10: "Infographics from the raw data: hotspots per satellite per year, and the sensors that stop (Suomi NPP stopped on 2026-11-02)."

### 7.1 Өгөгдөл
- Эх сурвалж: Job 2-ийн ([#23](https://github.com/naranll/nasa-challenge-2026/issues/23)) гаралт. PLAN §3.11-ийн `pipeline_stats.json` ("хэдэн мөр, platform, жил → demo-гийн тоонууд") нь хамгийн тохирох файл.
- **[A34]** Хэрэгтэй талбарууд (нэрийг Job 2 / contract-тай тохирно):
  - platform бүрийн жил бүрийн түүхий hotspot-ийн тоо (Монгол),
  - platform бүрийн нийт тоо,
  - platform бүрийн эхний ба сүүлийн hotspot-ийн огноо,
  - `synthetic` flag.
- Hover card (§6.2) ба infographic ижил файлаас уншина. Нэг тоо хоёр газар өөр гарахгүй.
- Fixture-ээс уншсан үед (`synthetic: true`) dev горимд ажиллана. Production build-д fixture орвол build унана `[#10]`, `[PLAN §10]`.

### 7.2 График 1: Хиймэл дагуул бүрийн жилийн hotspot
- **[A35]** Хэлбэр: X = он, Y = түүхий hotspot-ийн тоо, platform бүрд нэг шугам (эсвэл жижиг олон график, platform бүрд нэг). Өнгө = sensor-ийн өнгө (§4.2), шугам бүрийн төгсгөлд platform-ийн нэр бичигдэнэ. Зөвхөн өнгөөр ялгахгүй.
- Тайлбар мөр: "Түүхий pixel-ийн тоо. VIIRS-ийн pixel жижиг тул тоо нь илүү их. Энэ зөрүүг Harmonizing хуудас засна." (i18n, Harmonizing хуудас руу холбоос). Энэ нь baton relay түүхийг нүүрнээс эхлүүлнэ `[PLAN §1]`.
- 2002 бол бүрэн бус жил (Aqua 2002-07-05-наас) `[PLAN D4]`, 2026 нь мөн бүрэн бус. Хоёуланг нь тасархай эсвэл бүдэг цэгээр тэмдэглэнэ.

### 7.3 График 2: Зогсож буй sensor-ууд
- **[A36]** Хэлбэр: timeline. Мөр бүр нэг platform, манай өгөгдөл дэх эхний hotspot-оос сүүлийн hotspot хүртэлх зураас (§7.1).
- Сүүлийн огноо өнөөдрөөс мэдэгдэхүйц хуучин platform (жишээ нь S-NPP, сүүлийн огноо 2026-11-02 `[PLAN §1]`) нь "зогссон" гэж тэмдэглэгдэнэ. Огноог кодод бичихгүй, өгөгдлөөс авна.
- Ирээдүйн зогсолтын огноог (Terra ~2027-01, Aqua ~2026-08 эсвэл ~2027-09) өгөгдөл шиг зурахгүй. Эх сурвалжууд хоорондоо зөрдөг `[PLAN §1]` тул зөвхөн platform-ийн статусын мөрөөр (i18n + эх сурвалжийн линк) харуулна.

### 7.4 Infographic-ийн дүрэм
- Тоо бүр Job 2-ийн файлаас `[#10: All numbers come from data files]`.
- WebGL шаардахгүй (SVG). WebGL ажиллахгүй үед ч бүрэн ажиллана.
- Утсан дээр 360 px өргөнд хэвтээ scroll-гүй багтана.
- Job 2-ийн файл ачаалагдаагүй бол infographic хэсгийг бүхэлд нь нууна. Хоосон график хэзээ ч харагдахгүй.

---

## 8. Нүүр хуудасны бүтэц ба товчнууд

### 8.1 Бүтэц
```
┌──────────────────────────────────────┐
│ [гарчиг, 1 өгүүлбэр]   [A37]         │
│                                      │
│        3D globe (≤ 75% өндөр)        │
│  legend (доод-зүүн)   credit (баруун)│
├──────────────────────────────────────┤
│ [Harmonizing] [Dashboard] [Story]    │
│ [Forecast]           ← товчнууд      │
├──────────────────────────────────────┤
│ Infographic 1: жилийн hotspot        │
│ Infographic 2: зогсож буй sensor     │
└──────────────────────────────────────┘
```
- **[A37]** Гарчиг ба нэг өгүүлбэрийн тайлбар #10-д байхгүй, гэхдээ 5 секундийн зорилгод хэрэгтэй. Нүүрний компонентод i18n key-ээр оруулна.

### 8.2 Товчнууд `[#10]`
- Бусад хуудас руу орох товч: Harmonizing, Dashboard, Story, Forecast (#22-ийн хуудсууд).
- **[A38]** Route-ийн замыг #22-ийн router-оос импортлож авна (жишээ нь `routes` constant). Замыг энд гараар бичихгүй. Routing тохиргоог өөрчлөхгүй.
- Товчнууд canvas-аас гадуур, энгийн HTML link байна. Тиймээс 3D ажиллахгүй, эсвэл статик горимд ч **ижил товчнууд** хэвээр харагдана `[#10]`.
- Товчны текст i18n-ээс.

### 8.3 Export ба props **[A39]**
`app/src/globe/index.ts`-ээс:
- `HomeView`: нүүрний бүх агуулга (гарчиг, globe, товч, infographic). #22-ийн Home хуудас үүнийг л render хийнэ.
- `HomeGlobe`: зөвхөн globe (Harmonize globe-д дахин ашиглахад бэлэн).
- `HomeGlobeSkeleton`: chunk ачаалагдах хооронд харагдах placeholder (§9.3-ын статик зураг).

```ts
type PlatformId = 'terra' | 'aqua' | 'snpp' | 'noaa20' | 'noaa21';
type GlobeMode = 'webgl' | 'webgl-reduced' | 'static';
type FallbackReason = 'no-webgl' | 'context-lost' | 'low-fps' | 'data-error' | 'chunk-error';

interface HomeGlobeProps {
  autoRotate?: boolean;          // default true (reduced-motion үед false)
  timeScale?: number;            // default [A17]; reduced-motion үед 1
  interactive?: boolean;         // default true
  showLegend?: boolean;          // default true
  selectedPlatform?: PlatformId | null;
  className?: string;
  onReady?: (info: { mode: GlobeMode; firstFrameMs: number; platformsVisible: number }) => void;
  onPlatformSelect?: (id: PlatformId | null) => void;
  onFallback?: (reason: FallbackReason) => void;
}
```
- `HomeGlobe` эцэг элементийнхээ 100% өргөн, өндрийг эзэлнэ, `ResizeObserver`-ээр дагаж өөрчлөгдөнө. Layout shift гарахгүй.
- `onPlatformSelect` нь MVP-д зөвхөн мэдээлэл. Satellite хуудас руу navigate хийх нь MVP+.

---

## 9. Гүйцэтгэл `[#10: It runs smoothly on a phone]`

### 9.1 Лавлах төхөөрөмж **[A40]**
"Дунд зэргийн утас" тодорхойлогдоогүй. Санал: 2021–2022 оны дунд түвшний Android (Snapdragon 6-series / 4 GB RAM), Chrome-ийн сүүлийн хувилбар. Бодит төхөөрөмжийн загварыг энд нөхөж бичнэ. Төхөөрөмж байхгүй бол Chrome DevTools: CPU 4× slowdown + "Fast 4G".

### 9.2 Зорилтот тоо **[A41]**
| # | Хэмжүүр | Утас | Desktop | Хэрхэн хэмжих |
|---|---|---|---|---|
| P1 | Хуудас нээгдсэнээс globe-ийн эхний frame хүртэл | ≤ 2.5 с | ≤ 1.5 с | DevTools Performance, `onReady`-ийн timestamp |
| P2 | 5 platform marker харагдах хүртэл | ≤ 3.0 с | ≤ 2.0 с | `onReady`-ийн `platformsVisible` |
| P3 | Auto-rotate үеийн FPS (20 секундийн медиан) | ≥ 30 | ≥ 55 | Dev-only `?debug=fps` тоолуур эсвэл DevTools FPS meter |
| P4 | Drag/pinch үеийн FPS (медиан) | ≥ 30 | ≥ 55 | Мөн адил |
| P5 | Эхний frame-ийн дараах long task (> 50 ms) | 10 с-д ≤ 2 | 0 | DevTools Performance |
| P6 | Globe-ийн JS chunk (three + react-globe.gl + satellite.js + компонент) | ≤ 400 KB gzip | мөн | `vite build` гаралт |
| P7 | Дэлхийн texture | ≤ 400 KB | ≤ 1 MB | Network tab |
| P8 | `satellites.json` + Монголын polygon | ≤ 5 KB + ≤ 50 KB gzip | мөн | Network tab |
| P9 | Hover/tap-аас card харагдах хүртэл | ≤ 100 ms | ≤ 50 ms | DevTools Performance |
| P10 | Infographic scroll хийх үеийн FPS | ≥ 50 | ≥ 55 | DevTools |

### 9.3 Хэрэгжүүлэх дүрэм **[A42]**
- Globe-ийн chunk-ийг `React.lazy`-ээр ачаална. Гарчиг, товч, infographic үүнийг хүлээхгүй.
- Chunk ачаалагдах хооронд §11.1-ийн статик зургийг placeholder болгон харуулна.
- `devicePixelRatio`-г утсан дээр 1.5, desktop дээр 2-оор хязгаарлана.
- Хуудас нуугдсан (`visibilitychange`) эсвэл globe viewport-оос гарсан (`IntersectionObserver`, жишээ нь infographic руу scroll хийсэн) үед render loop зогсоно.
- **Адаптив чанар:** 5 секундийн медиан FPS < 24 бол: atmosphere унтраах → DPR 1 → тойрог замын цэгийг 90 болгох, дарааллаар. Дараа нь ч FPS < 15 бол `onFallback('low-fps')`, статик горим (§11).

---

## 10. P5-д өгөх i18n key **[A43]**

Namespace: `home.` (нүүрний текст), `globe.` (globe ба card). `{x}` = параметр. Монгол/англи утгыг P5 бичнэ. "Утга" багана нь зөвхөн тайлбар.

| Key | Утга (тайлбар) | Параметр |
|---|---|---|
| `home.title` | Нүүрний гарчиг | — |
| `home.subtitle` | Нэг өгүүлбэр: MODIS ба VIIRS хиймэл дагуулууд галыг сансраас хянадаг | — |
| `home.nav.harmonize` | Harmonizing хуудас руу | — |
| `home.nav.dashboard` | Dashboard руу | — |
| `home.nav.story` | Story руу | — |
| `home.nav.forecast` | Forecast руу | — |
| `home.info.per_year.title` | Infographic 1-ийн гарчиг: хиймэл дагуул бүрийн жилийн hotspot | — |
| `home.info.per_year.axis_year` | X тэнхлэг: он | — |
| `home.info.per_year.axis_count` | Y тэнхлэг: түүхий hotspot (pixel) | — |
| `home.info.per_year.note` | Түүхий pixel, VIIRS илүү их тоолдог, Harmonizing хуудас засна | — |
| `home.info.per_year.partial_year` | Бүрэн бус жил | — |
| `home.info.per_year.a11y_summary` | Графикийн текстэн хураангуй (screen reader) | `max_year`, `max_platform` |
| `home.info.timeline.title` | Infographic 2-ийн гарчиг: манай өгөгдөлд хиймэл дагуулууд хэзээ ажилласан | — |
| `home.info.timeline.stopped` | "Зогссон: {date}" | `date` |
| `home.info.timeline.a11y_summary` | Timeline-ийн текстэн хураангуй | — |
| `globe.a11y.canvas_label` | 3D дэлхий ба галын өгөгдөл цуглуулдаг 5 хиймэл дагуул | — |
| `globe.a11y.select_platform` | "{name}-ийн мэдээллийг харах" | `name` |
| `globe.loading` | Skeleton-ий aria/alt текст | — |
| `globe.hint.desktop` | Удирдлагын зөвлөмж (чирэх, zoom) | — |
| `globe.hint.touch` | Утасны зөвлөмж (хуруугаар эргүүлэх, pinch) | — |
| `globe.mongolia_only` | Демо зөвхөн Монголыг хамарна | — |
| `globe.legend.title` | Legend-ийн гарчиг | — |
| `globe.legend.modis` | Legend-ийн MODIS мөр | — |
| `globe.legend.viirs` | Legend-ийн VIIRS мөр | — |
| `globe.sensor.modis` | MODIS | — |
| `globe.sensor.viirs` | VIIRS | — |
| `globe.platform.terra.name` | Terra | — |
| `globe.platform.aqua.name` | Aqua | — |
| `globe.platform.snpp.name` | Suomi NPP | — |
| `globe.platform.noaa20.name` | NOAA-20 | — |
| `globe.platform.noaa21.name` | NOAA-21 | — |
| `globe.card.sensor_label` | "Мэдрэгч" | — |
| `globe.card.launch_label` | "Хөөргөсөн" | — |
| `globe.card.data_range_label` | "Манай өгөгдөлд" | — |
| `globe.card.data_range_value` | "{first} – {last}" | `first`, `last` |
| `globe.card.count_label` | "Hotspot (түүхий pixel)" | — |
| `globe.card.count_value` | "{n}" | `n` |
| `globe.card.not_in_data` | Манай Монголын өгөгдөлд ороогүй | — |
| `globe.card.altitude_label` | "Өндөр" | — |
| `globe.card.altitude_value` | "{km} км" | `km` |
| `globe.card.status_label` | "Статус" | — |
| `globe.card.source_link` | "Эх сурвалж" | — |
| `globe.card.close` | "Хаах" | — |
| `globe.status.terra` | Terra-гийн статусын өгүүлбэр (эх сурвалжтай) | — |
| `globe.status.aqua` | Aqua-ийн статус | — |
| `globe.status.snpp` | Suomi NPP-ийн статус | — |
| `globe.status.noaa20` | NOAA-20-ийн статус | — |
| `globe.status.noaa21` | NOAA-21-ийн статус | — |
| `globe.tle.stale_age` | "Тойрог замын өгөгдөл {days} хоногийн настай, байрлал ойролцоо" | `days` |
| `globe.tle.stale_hidden` | "Тойрог замын өгөгдөл хуучирсан тул байрлалыг харуулаагүй" | — |
| `globe.time.accelerated` | "Хурдасгасан ×{n}" | `n` |
| `globe.credit.tle` | "Тойрог зам: {source}, {date}" | `source`, `date` |
| `globe.credit.texture` | Дэлхийн зургийн credit | `source` |
| `globe.credit.boundaries` | Хилийн credit (geoBoundaries, ODbL, © OpenStreetMap contributors) | — |
| `globe.fallback.static_alt` | Статик зургийн alt: дэлхий ба 5 хиймэл дагуулын тойрог зам | — |
| `globe.fallback.no_webgl_note` | Төхөөрөмж 3D-г дэмжихгүй тул энгийн зургаар харуулж байна | — |
| `globe.fallback.data_note` | Тойрог замын өгөгдөл ачаалагдсангүй, зөвхөн жагсаалт харуулж байна | — |

- Нийт 57 key.
- `globe.status.*` нь баримт агуулдаг тул PLAN §7-ийн дүрмээр (хэт их амлахгүй, эх сурвалжтай) бичнэ.
- Хоёр хэлэнд бүх key заавал байна (§13-ын тест).

---

## 11. Fallback `[#10: The page works when WebGL is off]`

Дүрэм: ямар ч нөхцөлд хоосон эсвэл эвдэрсэн дэлгэц харагдахгүй. Хамгийн муу тохиолдолд ч гарчиг, дэлхийн зураг, 5 platform-ийн нэр, sensor, **бусад хуудас руу орох товчнууд** харагдана.

### 11.1 Статик горим (`mode: 'static'`)
- Урьдчилан render хийсэн дэлхий + 5 тойрог замын зураг (WebP, ≤ 150 KB **[A44]**), `app/src/globe/assets/`-д. Ажилладаг globe-оос screenshot авч үүсгэнэ. Skeleton-д мөн ашиглагдана.
- Доор нь legend + 5 platform-ийн жагсаалт. Мөр бүр дарахад card нээгдэнэ (өндрийг `satellite.js`-ээр тооцно, WebGL шаардахгүй).
- Товчнууд ба infographic хэвийн ажиллана (§8.2, §7.4).

### 11.2 Тохиолдол бүр
| Тохиолдол | Илрүүлэх | Үр дүн |
|---|---|---|
| WebGL дэмжихгүй | Chunk ачаалахаас өмнө `canvas.getContext('webgl2') \|\| getContext('webgl')` | Статик горим, `onFallback('no-webgl')`. Three.js chunk-ийг татахгүй |
| Globe chunk ачаалагдсангүй | `React.lazy`-ийн error | Error boundary → статик горим, `onFallback('chunk-error')` |
| Render үеийн exception | Error boundary | Статик горим |
| WebGL context алдагдсан | `webglcontextlost` | Нэг удаа сэргээх, бүтэхгүй бол статик, `onFallback('context-lost')` |
| FPS бага | §9.3 | `webgl-reduced`, дараа нь статик, `onFallback('low-fps')` |
| `satellites.json` ачаалагдсангүй / эвдэрсэн / production-д `synthetic: true` | Ачаалагчийн алдаа, 1 удаа дахин оролдох, schema шалгалт | Globe эргэлдэнэ, marker/тойрог замгүй. Legend + 5 нэр, sensor. `globe.fallback.data_note`. `onFallback('data-error')` |
| Job 2-ийн файл ачаалагдсангүй | Ачаалагчийн алдаа | Infographic нуугдана, card-ийн тоо/огнооны мөр нуугдана. Globe, товч хэвийн |
| Нэг platform-ийн TLE буруу/хуучирсан | `satrec.error`, NaN, §5.5 | Зөвхөн тэр marker нуугдана |
| Дэлхийн texture ачаалагдсангүй | Texture loader error | Нэг өнгөтэй бөмбөрцөг + Монголын polygon + platform-ууд |
| Монголын polygon ачаалагдсангүй | Ачаалагчийн алдаа | Бүдэглэлтгүй, энгийн globe. `globe.mongolia_only` тайлбар нуугдана |

- **[A45]** 5 platform-ийн id ↔ sensor холбоог кодын constant-д давхар хадгална. `satellites.json` ачаалагдаагүй ч legend харагдана. Энэ нь текст биш тул §6.4-ийг зөрчихгүй.

---

## 12. Scope

### 12.1 MVP (#10)
- Globe: одод, 3D дэлхий, Монголоос гадна бүдэг, эргэлт, чирэх, zoom, touch, reduced-motion.
- 5 platform: одоогийн байрлал, dotted тойрог зам, хоёр өнгө, ижил sensor-ийн холбоос, legend.
- `scripts/tle` → `satellites.json`, browser дээр `satellite.js`, TLE хуучирсан үеийн дүрэм.
- Hover/tap card: нэр, sensor, хөөргөсөн огноо, манай өгөгдөл дэх эхний/сүүлийн hotspot, hotspot-ийн тоо, статус + эх сурвалж, өндөр.
- Infographic: жилийн hotspot, зогсож буй sensor-ийн timeline.
- Бусад хуудас руу орох товчнууд, статик горимд ч.
- §11-ийн бүх fallback, §9-ийн гүйцэтгэлийн зорилт.

### 12.2 MVP+ (одоо хийхгүй) `[Хүсэлт]`, `[PLAN §5]`
- Scroll хийхэд камер нисэх.
- Satellite хуудас.
- Globe дээр hotspot ба таамаглал харуулах, аймгийг таамаглалаар будах.

Одоо зөвхөн хаалга үлдээнэ: `onPlatformSelect` event, өнгө ба platform-ийн constant-ийг тусдаа модульд.

### 12.3 Энэ spec-д хамаарахгүй
- Дэлхийг дарахад Монгол руу zoom хийж бүсийн хуудас нээх. Энэ нь [#19](https://github.com/naranll/nasa-challenge-2026/issues/19) (Polish)-ийн ажил.
- Хоёр globe + scrubber нь [#14](https://github.com/naranll/nasa-challenge-2026/issues/14) (Job 7)-ийн ажил. `HomeGlobe`-ийг тэнд дахин ашиглаж болно.
- Router, хуудсуудыг үүсгэх, deploy нь [#22](https://github.com/naranll/nasa-challenge-2026/issues/22)-ийн ажил.
- TLE-ээр жинхэнэ overpass/үүл тооцох (PLAN §5: Future work).

---

## 13. Done when

**#10-ын шалгуур**
- [ ] Утсан дээр саадгүй ажиллана: §9.2-ын P1–P10-ийг лавлах утас ба desktop дээр хэмжиж, үр дүнг PR-ийн тайлбарт хүснэгтээр бичсэн. Хүрээгүй бол шалтгаан ба дараагийн алхам бичигдсэн.
- [ ] Бүх тоо өгөгдлийн файлаас ирнэ, гараар бичээгүй: `app/src/globe/` дотор огноо, hotspot-ийн тоо, өндөр зэрэг тоон literal байхгүй (шалгах тест эсвэл review).
- [ ] WebGL унтраасан үед хуудас ажиллана (§11-ийн шалгуурыг үз).

**TLE скрипт ба өгөгдөл**
- [ ] `scripts/tle` ажиллуулахад 5 platform-тай `satellites.json` үүснэ, schema-ийн тест давна, TLE мөр бүрийн checksum зөв.
- [ ] Сүлжээгүй ажиллуулахад одоо байгаа файл өөрчлөгдөхгүй, exit 0, warning хэвлэнэ.
- [ ] Нэг platform амжилтгүй болоход файл хагас шинэчлэгдэхгүй.
- [ ] Production build-д `synthetic: true` өгөгдөл орвол build унана.
- [ ] Demo-гийн өмнө: `generated_at` нь demo-гийн өдрөөс ≤ 3 хоногийн өмнөх **[A46]**, бүх TLE-ийн epoch ≤ 7 хоног.

**Байрлалын тооцоо**
- [ ] Unit тест: тогтсон TLE + цагт тооцсон өргөрөг/уртраг/өндөр нь бие даасан SGP4 хэрэгжүүлэлтээс (жишээ нь `etl` орчны Python `sgp4`) ≤ 1 км зөрнө **[A47]**.
- [ ] Unit тест: `satrec.error`-тэй TLE ба 30 хоногоос хуучин TLE нь §5.5-ын дагуу ажиллана.

**Globe ба platform (гараар)**
- [ ] Globe аажим эргэнэ, чирэхэд зогсож, 4 секундийн дараа дахин эхэлнэ.
- [ ] Монголоос гадна хэсэг бүдэг, Монгол тод, "Демо зөвхөн Монголыг хамарна" тайлбар харагдана.
- [ ] Desktop: чирэх, wheel zoom (идэвхжсэний дараа), zoom хязгаартай. Идэвхжээгүй үед wheel хуудсыг scroll хийнэ.
- [ ] Утас: нэг хуруугаар эргүүлэх, pinch zoom, infographic руу scroll хийж чадна.
- [ ] 5 marker, 5 dotted тойрог зам, 2 бүлгийн холбоос. MODIS ба VIIRS өөр өнгөтэй, legend хоёр нэрийг бичсэн.
- [ ] `timeScale > 1` үед "Хурдасгасан ×n" шошго харагдана.
- [ ] `prefers-reduced-motion` үед auto-rotate байхгүй, `timeScale = 1`.

**Hover/tap ба текст**
- [ ] Hover, tap, keyboard (Tab + Enter) гурвуулаа card нээнэ. Card-д §6.2-ын мөрүүд харагдана, hotspot-ийн тоо "түүхий pixel" шошготой.
- [ ] Card-ийн тоо ба infographic-ийн тоо ижил platform-д ижил.
- [ ] mn ↔ en солиход бүх текст солигдоно, globe дахин ачаалагдахгүй.
- [ ] Тест: `app/src/globe/` доторх компонентод JSX текст literal байхгүй (lint дүрэм эсвэл grep тест **[A48]**).
- [ ] Тест: ашигласан бүх key `mn` ба `en` json-д хоёуланд нь байна.
- [ ] "N/A", `undefined`, хоосон мөр, хоосон график хэзээ ч харагдахгүй (§6.3, §7.4-ийн тохиолдол бүр).

**Infographic**
- [ ] Жилийн hotspot-ийн график 5 platform-ийн өгөгдлийг харуулна, 2012 оноос VIIRS эхэлсэн нь харагдана, тайлбар мөр Harmonizing руу холбогдоно.
- [ ] Timeline дээр S-NPP-ийн сүүлийн огноо өгөгдлөөс гарч, "зогссон" гэж тэмдэглэгдэнэ.
- [ ] 360 px өргөнд хэвтээ scroll-гүй.

**Товч ба fallback**
- [ ] Нүүрнээс Harmonizing, Dashboard, Story, Forecast руу товчоор очно.
- [ ] WebGL унтраасан browser (Chrome `--disable-webgl` эсвэл Firefox `webgl.disabled`) → статик зураг + жагсаалт + card + **ижил товчнууд** + infographic.
- [ ] DevTools request blocking-оор `satellites.json`-ийг хаах → globe эргэлдэнэ, legend + нэрс, товчнууд харагдана.
- [ ] Job 2-ийн файлыг хаах → infographic нуугдана, бусад нь хэвийн.
- [ ] `WEBGL_lose_context`-оор context алдагдуулах → сэргэнэ эсвэл статик горим.
- [ ] Texture ба Монголын polygon-ийг хаах → globe хоосон биш.
- [ ] Бүх тохиолдолд `onFallback` зөв `reason`-оор дуудагдана.

**Сүлжээ**
- [ ] DevTools Network: хуудас ачаалахад гадны домэйн (CelesTrak, FIRMS г.м.) руу хүсэлт **0**.

**5 секундийн тест [A49]**
- [ ] Багийн гишүүн биш 3 хүнд нүүрийг 5 секунд үзүүлээд "Энэ юу харуулж байна вэ?" гэж асуухад дор хаяж 2 нь хиймэл дагуул / гал / MODIS эсвэл VIIRS-ийн аль нэгийг дурдана.

**Хил**
- [ ] `git diff --stat`: зөвхөн `app/src/globe/`, `scripts/tle/`, `public/data/satellites.json` өөрчлөгдсөн (§1.4-ийн хүсэлтүүдийг #22-ийн эзэн хийсэн).
- [ ] §10-ын key-ийн жагсаалтыг P5-д өгсөн.

---

## 14. ASSUMPTION-ийн хүснэгт

Баг батлах эсвэл өөрчлөх ёстой. Баталсны дараа энд ✅ тавина.

| # | Сэдэв | Таамаглал | Хэн шийдэх |
|---|---|---|---|
| A1 | Dependency, build hook | `package.json`-ийг #22-ийн scaffold-д оруулна | #22-ийн эзэн |
| A2 | `public/` зам | `app/public` vs root `public` | #22-ийн эзэн |
| A3 | Ачаалагч ба i18n API | `loadData(name)`, `t(key, params)` | #22-ийн эзэн, P5 |
| A4 | `contracts/` | `satellites`, `pipeline_stats` schema-г шалгаагүй | P3 + Job 2 |
| A5 | Infographic | Нэмэлт сангүй, SVG | P3 |
| A6 | Тест | Vitest | Баг |
| A7 | Монголоос гадна бүдэг | Texture бараан + Монголын polygon, geoBoundaries, ≤ 50 KB | P3 + Job 2 |
| A8 | Одтой дэвсгэр | Canvas дотор | P3 |
| A9 | Texture | Нэг day-texture, лицензийг Job 13 шалгана | P3 + Job 13 |
| A10 | Atmosphere | Desktop-д асаана | P3 |
| A11 | Auto-rotate | ~120 с/эргэлт, 4 с идэвхгүй бол дахин эхэлнэ | P3 |
| A12 | Zoom | ~40%–250% | P3 |
| A13 | Scroll зөрчил | Wheel zoom идэвхжсэний дараа, утсан дээр globe ≤ 75% өндөр | P3 |
| A14 | Reduced-motion | PLAN-ийн дүрмийг globe-д мөн хэрэглэнэ | Баг |
| A15 | Өнгө | Contrast ≥ 3:1, өнгөний харалган хүнд ялгарах, текст legend | P3 |
| A16 | Давхцал | Hover-оор тодруулах, dash pattern | P3 |
| A17 | `timeScale` | Одоогийн цагаас эхэлж хурдасгах, default 60 (санал), шошготой | Баг |
| A18 | Snapshot commit | `satellites.json`-ийг git-д commit хийнэ | Баг |
| A19 | Скриптийн хэл | Node (TS/ESM) | P3 |
| A20 | NORAD | 25994, 27424, 37849, 43013, 54234 (батлах) | P3 |
| A21 | CelesTrak URL | GP endpoint, `CATNR`, `FORMAT=TLE` | P3 |
| A22 | Скриптийн алдаа | Бүгд шинэ эсвэл бүгд хуучин, файл байхгүй бол exit 1 | P3 |
| A23 | `satellites.json` schema | §5.3, hotspot-ийн тоо орохгүй | P3 + Job 2 |
| A24 | Хөөргөсөн огноо | Aqua-аас бусдыг эх сурвалжаар батлах хүртэл харуулахгүй | P3 + P5 |
| A25 | Тойрог замын шугам | ±½ тойрог, 180 цэг, Earth-fixed | P3 |
| A26 | Render | Frame бүрд three объект шууд | P3 |
| A27 | TLE-ийн нас | 7 / 30 хоногийн босго | Баг |
| A28 | S-NPP TLE | CelesTrak шинэчилсээр байгаа эсэх | P3 (шалгана) |
| A29 | Tap-ийн хүрээ | ≥ 44×44 px | P3 |
| A30 | Өндрийн мөр | #10-д байхгүй, анхны хүсэлтэд байсан, тооцоолсон утга тул үлдээв | Баг |
| A31 | "Түүхий pixel" шошго | Card ба infographic дээр заавал | Баг |
| A32 | Формат | `Intl` API, locale-оор | P3 + P5 |
| A33 | `not_in_data` | NOAA-21-ийн өгөгдөл байгаа эсэх тодорхойгүй | Job 2 |
| A34 | Job 2-ийн талбарууд | `pipeline_stats.json`: жилийн тоо, нийт, эхний/сүүлийн огноо, `synthetic` | Job 2 |
| A35 | Infographic 1 | Шугаман график, platform бүрд шугам, төгсгөлд нэр | P3 |
| A36 | Infographic 2 | Өгөгдлийн огноон дээрх timeline, ирээдүйн огноо зурахгүй | P3 |
| A37 | Гарчиг | Нүүрний компонентод, i18n | P3 + P5 |
| A38 | Route-ийн зам | #22-ийн router-оос импортлоно | #22-ийн эзэн |
| A39 | Export, props | §8.3 | P3 |
| A40 | Лавлах утас | 2021–22 оны дунд түвшний Android | Баг |
| A41 | Зорилтот тоо | §9.2-ын P1–P10 | Баг |
| A42 | Гүйцэтгэлийн арга | Lazy chunk, DPR cap, viewport-оос гарвал зогсох, адаптив чанар | P3 |
| A43 | Key-ийн namespace | `home.`, `globe.` | P5 |
| A44 | Статик зураг | WebP ≤ 150 KB | P3 |
| A45 | Кодын constant | id ↔ sensor холбоог давхар хадгална | P3 |
| A46 | Snapshot-ийн шинэ байдал | Demo-гоос ≤ 3 хоног | Баг |
| A47 | Байрлалын тест | Python `sgp4`-тэй ≤ 1 км | P3 |
| A48 | Hardcode шалгалт | Lint дүрэм эсвэл grep тест | P3 |
| A49 | 5 секундийн тест | 3 хүнээс 2 нь | Баг |
