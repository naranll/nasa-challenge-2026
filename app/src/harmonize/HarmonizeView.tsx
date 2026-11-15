/**
 * The Harmonizing page (#14, PLAN D2, D12, D13): two globes with a year slider, the result line,
 * the monthly chart with the Raw / Harmonized switch, two calendars "For scientists", and the Method.
 * Without WebGL (or when 3D is too slow) the calendars take the globes' place.
 */
import { lazy, Suspense, useCallback, useMemo, useState } from "react";
import { CalendarHeatmap, CalendarLegend } from "../calendar/CalendarHeatmap";
import { calendarGrid, sharedMax, type CalendarRow, type CalendarView } from "../calendar/calendarData";
import { ViewSwitch } from "../calendar/ViewSwitch";
import type { CalendarFile, HexYearHarmFile, HexYearRawFile, ValidationFile } from "../data/contracts";
import { dataOf, useDataFile } from "../data/useDataFile";
import { hasWebGL, useCoarsePointer, useReducedMotion } from "../globe/env";
import { ErrorBoundary } from "../globe/ErrorBoundary";
import { formatNumber } from "../globe/format";
import { useI18n } from "../i18n";
import { MethodSection } from "../method/MethodSection";
import { createCameraSync, type Side } from "./cameraSync";
import "./harmonize.css";
import { chainPlatformByYear, globeYears, handovers, resultLine, type GlobeYears, type Handover } from "./harmonizeData";
import { HARMONIZED_COLOR, MonthlyChart } from "./MonthlyChart";
import { RawView } from "./RawView";
import type { GlobeFallbackReason } from "./SideGlobe";
import { YearScrubber } from "./YearScrubber";
import { YearTotalsChart } from "./YearTotalsChart";

const SideGlobe = lazy(() => import("./SideGlobe"));
const RAW_COLOR = "#f2994a";
/** The country calendar drives the chain, the result line and the page's charts. */
const REGION_FILE = "calendar/mongolia.json";

type Mode = "webgl" | "static";

export function HarmonizeView() {
  const { t } = useI18n();
  const calendar = useDataFile<CalendarFile>(REGION_FILE);
  const hexRaw = useDataFile<HexYearRawFile>("hex_year/raw.json");
  const hexHarm = useDataFile<HexYearHarmFile>("hex_year/harm.json");
  const validation = useDataFile<ValidationFile>("validation.json");

  const cal = dataOf(calendar);
  const chain = useMemo(() => (cal ? chainPlatformByYear(cal) : null), [cal]);
  const raw = dataOf(hexRaw);
  const harm = dataOf(hexHarm);
  const globe = useMemo(() => (raw && harm && chain ? globeYears(raw, harm, chain) : null), [raw, harm, chain]);
  const grids = useMemo(() => (cal ? { raw: calendarGrid(cal, "raw"), harm: calendarGrid(cal, "harmonized") } : null), [cal]);

  const [mode, setMode] = useState<Mode>(() => (hasWebGL() ? "webgl" : "static"));
  const [reason, setReason] = useState<GlobeFallbackReason | "no-webgl" | null>(() => (mode === "static" ? "no-webgl" : null));
  const fallback = useCallback((r: GlobeFallbackReason) => {
    setMode("static");
    setReason((old) => old ?? r);
  }, []);
  const globeFailed = hexRaw.status === "error" || hexHarm.status === "error";
  const showGlobes = mode === "webgl" && !globeFailed;
  const fallbackNote = globeFailed && mode === "webgl" ? "harm.fallback.data" : reason === "no-webgl" ? "harm.fallback.no_webgl" : "harm.fallback.slow";

  const [view, setView] = useState<CalendarView>("raw");
  const scientists = grids && <ForScientists raw={grids.raw} harm={grids.harm} />;

  return (
    <div className="harmonize">
      <header className="harm-header">
        <h1>{t("nav.harmonizing")}</h1>
        <p>{t("page.harmonizing.lead")}</p>
        <p className="harm-why">{t("harm.why_ground")}</p>
      </header>

      <ResultLineText calendar={cal} validation={dataOf(validation)} />

      {calendar.status === "error" ? (
        <p role="alert">{t("data.error")}</p>
      ) : showGlobes ? (
        globe ? (
          <TwinGlobes globe={globe} chainHandovers={chain ? handovers(chain) : []} onFallback={fallback} />
        ) : (
          <p aria-busy="true">{t("data.loading")}</p>
        )
      ) : (
        <>
          <p className="harm-fallback-note">{t(fallbackNote)}</p>
          {scientists ?? <p aria-busy="true">{t("data.loading")}</p>}
        </>
      )}

      {/* Job 4: what data we have, in each satellite's own raw counts. */}
      <RawView />

      {grids && (
        <section className="harm-monthly" aria-labelledby="harm-monthly-title">
          <div className="harm-section-head">
            <h2 id="harm-monthly-title">{t("harm.monthly.title")}</h2>
            <ViewSwitch value={view} onChange={setView} />
          </div>
          <MonthlyChart raw={grids.raw} harmonized={grids.harm} view={view} label={t(view === "raw" ? "harm.monthly.a11y_raw" : "harm.monthly.a11y_harm")} />
          <p className="chart-note">{t(view === "raw" ? "harm.monthly.note_raw" : "harm.monthly.note_harm")}</p>
        </section>
      )}

      {showGlobes && scientists}

      <MethodSection validation={dataOf(validation)} />
    </div>
  );
}

function ResultLineText(props: { calendar: CalendarFile | null; validation: ValidationFile | null }) {
  const { t, lang } = useI18n();
  const r = resultLine(props.calendar, props.validation);
  const series = r.satellites !== null && r.years !== null && r.hotspots !== null;
  if (!series && r.wape === null) return null;
  return (
    <p className="harm-result">
      {series && (
        <span>
          {t("harm.result.series", {
            satellites: formatNumber(r.satellites!, lang),
            years: formatNumber(r.years!, lang),
            hotspots: formatNumber(r.hotspots!, lang),
          })}
        </span>
      )}
      {r.wape !== null && (
        <span>{t("harm.result.wape", { wape: formatNumber(r.wape, lang, { style: "percent", maximumFractionDigits: 1 }) })}</span>
      )}
    </p>
  );
}

interface TwinProps {
  globe: GlobeYears;
  chainHandovers: Handover[];
  onFallback: (r: GlobeFallbackReason) => void;
}

function TwinGlobes({ globe, chainHandovers, onFallback }: TwinProps) {
  const { t } = useI18n();
  const reduced = useReducedMotion();
  const coarse = useCoarsePointer();
  const [sync] = useState(createCameraSync);
  const [index, setIndex] = useState(0);
  const totalsMax = Math.max(0, ...[...globe.totals.raw, ...globe.totals.harm].map((v) => v ?? 0));
  const marks = chainHandovers.map((h) => h.year);
  const year = globe.years[index];

  const panel = (side: Side) => (
    <figure className="side-globe" data-side={side}>
      <figcaption>
        <strong>{t(side === "raw" ? "harm.globe.raw.title" : "harm.globe.harm.title")}</strong>
        <span>{t(side === "raw" ? "harm.globe.raw.unit" : "harm.globe.harm.unit")}</span>
      </figcaption>
      <div className="side-globe-stage">
        <ErrorBoundary fallback={null} onError={() => onFallback("chunk-error")}>
          <Suspense fallback={<div className="side-globe-canvas" aria-busy="true" />}>
            <SideGlobe
              side={side}
              cells={globe.cells}
              yearIndex={index}
              max={globe.max}
              sync={sync}
              coarsePointer={coarse}
              reducedMotion={reduced}
              onFallback={onFallback}
            />
          </Suspense>
        </ErrorBoundary>
        <span className="side-globe-year">{year}</span>
      </div>
      <YearTotalsChart
        years={globe.years}
        values={side === "raw" ? globe.totals.raw : globe.totals.harm}
        max={totalsMax}
        index={index}
        color={side === "raw" ? RAW_COLOR : HARMONIZED_COLOR}
        marks={marks}
        label={t(side === "raw" ? "harm.totals.a11y_raw" : "harm.totals.a11y_harm")}
      />
    </figure>
  );

  return (
    <section className="twin-globes" aria-label={t("harm.globes.label")}>
      <div className="twin-globes-row">
        {panel("raw")}
        {panel("harm")}
      </div>
      <YearScrubber years={globe.years} index={index} onChange={setIndex} handovers={chainHandovers} />
      <p className="harm-note">{t("harm.note.estimate")}</p>
      <p className="harm-hint">{t(coarse ? "harm.hint.touch" : "harm.hint.desktop")}</p>
    </section>
  );
}

function ForScientists({ raw, harm }: { raw: CalendarRow[]; harm: CalendarRow[] }) {
  const { t } = useI18n();
  const max = sharedMax([raw, harm]);
  return (
    <section className="for-scientists" aria-labelledby="scientists-title">
      <h2 id="scientists-title">{t("harm.scientists.title")}</h2>
      <p>{t("harm.scientists.lead")}</p>
      <div className="calendar-pair">
        <CalendarHeatmap rows={raw} view="raw" max={max} title={t("harm.scientists.raw")} />
        <CalendarHeatmap rows={harm} view="harmonized" max={max} title={t("harm.scientists.harm")} />
      </div>
      <CalendarLegend max={max} />
    </section>
  );
}
