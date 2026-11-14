/**
 * The globe area of the home page: chooses 3D or the static picture (spec §11), and holds everything
 * that is plain HTML (legend, card, notes, credits), so it works the same in every mode.
 */
import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useI18n } from "../i18n";
import { createSimClock, hasWebGL, useCoarsePointer, useReducedMotion } from "./env";
import { ErrorBoundary } from "./ErrorBoundary";
import { formatDate, formatNumber } from "./format";
import type { PipelineStats } from "./homeData";
import type { FallbackReason, GlobeMode, HomeGlobeProps } from "./HomeGlobe";
import { Legend } from "./Legend";
import { PlatformCard } from "./PlatformCard";
import type { PlatformId } from "./platforms";
import { StaticGlobe } from "./StaticGlobe";
import { buildOrbits, type Loaded } from "./useHomeData";
import type { SatellitesFile } from "./tle";

const HomeGlobe = lazy(() => import("./HomeGlobe"));

/** A17: default speed-up; ×1 with prefers-reduced-motion. */
export const DEFAULT_TIME_SCALE = 60;

interface Props {
  satellites: Loaded<SatellitesFile>;
  stats: PipelineStats | null;
  timeScale?: number;
  onReady?: HomeGlobeProps["onReady"];
  onFallback?: (reason: FallbackReason) => void;
}

export function HomeGlobeSection({ satellites, stats, timeScale = DEFAULT_TIME_SCALE, onReady, onFallback }: Props) {
  const { t, lang } = useI18n();
  const reduced = useReducedMotion();
  const coarse = useCoarsePointer();
  const scale = reduced ? 1 : timeScale;

  const [mode, setMode] = useState<GlobeMode>(() => (hasWebGL() ? "webgl" : "static"));
  const [reason, setReason] = useState<FallbackReason | null>(() => (mode === "static" ? "no-webgl" : null));
  const fallback = useCallback(
    (r: FallbackReason) => {
      if (r !== "data-error") setMode("static");
      setReason((old) => old ?? r);
      onFallback?.(r);
    },
    [onFallback],
  );
  useEffect(() => {
    if (reason === "no-webgl") onFallback?.("no-webgl");
  }, [reason, onFallback]);

  // Orbits and the simulated clock are fixed once per page load (t0 = opening time).
  const [openedAt] = useState(() => new Date());
  const clock = useMemo(() => createSimClock(scale, openedAt.getTime()), [scale, openedAt]);
  const file = satellites.status === "ok" ? satellites.data : null;
  const { orbits, source } = useMemo(() => buildOrbits(file, openedAt), [file, openedAt]);
  const dataError = satellites.status === "error";
  useEffect(() => {
    if (dataError) fallback("data-error");
  }, [dataError, fallback]);

  const [hovered, setHovered] = useState<PlatformId | null>(null);
  const [selected, setSelected] = useState<PlatformId | null>(null);
  const shown = selected ?? hovered;
  const shownOrbit = orbits.find((o) => o.id === shown) ?? null;
  const toggle = useCallback((id: PlatformId | null) => setSelected((cur) => (id === null || cur === id ? null : id)), []);
  const close = useCallback(() => {
    setSelected(null);
    setHovered(null);
  }, []);

  const staticPicture = <StaticGlobe orbits={orbits} at={openedAt} highlighted={shown} onSelect={toggle} />;
  const ready = satellites.status !== "loading";

  return (
    <section className="globe-section" data-mode={mode}>
      <div className="globe-stage">
        {mode === "static" ? (
          staticPicture
        ) : !ready ? (
          <StaticGlobe orbits={[]} at={openedAt} loading />
        ) : (
          <ErrorBoundary fallback={staticPicture} onError={() => fallback("chunk-error")}>
            <Suspense fallback={<StaticGlobe orbits={orbits} at={openedAt} loading />}>
              <HomeGlobe
                orbits={orbits}
                clock={clock}
                autoRotate={!reduced}
                coarsePointer={coarse}
                highlighted={shown}
                onHover={setHovered}
                onSelect={toggle}
                onReady={onReady}
                onFallback={fallback}
              />
            </Suspense>
          </ErrorBoundary>
        )}

        <div className="globe-overlay globe-overlay-top">
          <span className="globe-chip">{t("globe.mongolia_only")}</span>
          {mode !== "static" && scale > 1 && file && (
            <span className="globe-chip">{t("globe.time.accelerated", { n: formatNumber(scale, lang) })}</span>
          )}
        </div>
        {shownOrbit && (
          <PlatformCard orbit={shownOrbit} stats={stats} clock={clock} locked={selected !== null} onClose={close} />
        )}
      </div>

      <div className="globe-below">
        <Legend orbits={orbits} selected={selected} onSelect={toggle} onHover={setHovered} />
        <div className="globe-notes">
          {reason === "no-webgl" && <p>{t("globe.fallback.no_webgl_note")}</p>}
          {dataError && <p>{t("globe.fallback.data_note")}</p>}
          {mode !== "static" && <p className="globe-hint">{t(coarse ? "globe.hint.touch" : "globe.hint.desktop")}</p>}
          <p className="globe-credit">
            {source && <span>{t("globe.credit.tle", { source: source.name, date: formatDate(source.date, lang) })}</span>}
            <span>{t("globe.credit.boundaries")}</span>
            {mode === "static" ? <span>{t("globe.credit.land")}</span> : <span>{t("globe.credit.texture")}</span>}
          </p>
        </div>
      </div>
    </section>
  );
}
