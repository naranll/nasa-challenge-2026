/**
 * The stage engine (brief §4). One sticky full-viewport stage holds the persistent globe, the hero map (Mongolia's
 * outline and its hotspots) and the chart; the page's scroll length is the sum of the chapters' lengths. Each chapter
 * gets `progress` 0..1 and only sets targets, so things move between chapters instead of cutting. The page scrolls
 * natively: no scroll-jacking.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useI18n } from "../../i18n";
import { buildSeries } from "../data/series";
import { useCalendar } from "../data/adapters";
import { useHotspots } from "../data/hotspots";
import type { ChapterDef, GlobeTarget } from "../types";
import { ChapterHead } from "../shell/ChapterHead";
import { ChapterNav } from "../shell/ChapterNav";
import { SourcesPanel } from "../shell/SourcesPanel";
import { useStoryText, type StoryKey } from "../strings";
import { loadStoryFonts } from "../theme/fonts";
import { Backdrop } from "./Backdrop";
import { readParam, useLowBandwidth, useStoryMotion, writeChapterParam } from "./env";
import { GlobeLayer } from "./GlobeLayer";
import { heroState, LOOP_SECONDS, type HeroState, type SceneKind } from "./hero";
import { HeroMap } from "./HeroMap";
import { chapterNumber, chapterRanges, locate, presence } from "./layout";
import { StageChart } from "./StageChart";
import { stageAt } from "./stageState";
import { useLoopClock } from "./useLoopClock";
import { useScrolledVh } from "./useScrollProgress";

const PIPE_KEYS: StoryKey[] = ["pipe.1", "pipe.2", "pipe.3", "pipe.4", "pipe.5"];

export function StageEngine({ chapters }: { chapters: ChapterDef[] }) {
  const { lang } = useI18n();
  const s = useStoryText();
  const reduced = useStoryMotion();
  const lowBandwidth = useLowBandwidth();
  const still = reduced || lowBandwidth;
  const calendar = useCalendar();
  const hotspots = useHotspots();

  const root = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const vh = useScrolledVh(root, stage);
  const ranges = useMemo(() => chapterRanges(chapters.map((c) => c.lengthVh)), [chapters]);
  const { index, progress } = locate(ranges, vh);
  const chapter = chapters[index];
  const allOwn = chapters.every((c) => c.own); // nothing needs the 3D globe, the hero map or the chart

  const baseTarget = useMemo(
    () => stageAt(chapters.map((c) => c.keyframes), index, progress, reduced),
    [chapters, index, progress, reduced],
  );

  // Time-driven scene (harmonize loops by itself); the user can pause it.
  const [paused, setPaused] = useState(false);
  const loopsHere = chapter.scene === "harmonize" && !still;
  // Preview helper: ?loop=0.3 freezes the harmonize animation at that phase (for screenshots and design review).
  const frozen = useMemo(() => {
    const v = readParam("loop");
    return v !== null && v !== "" && Number.isFinite(Number(v)) ? Math.min(1, Math.max(0, Number(v))) : null;
  }, []);
  const ticking = useLoopClock(loopsHere && !paused && frozen === null, LOOP_SECONDS, chapter.id);
  const loop = frozen ?? ticking;

  // The hero layer keeps its last scene while a chapter without one is showing, so it fades out instead of vanishing.
  const lastKind = useRef<SceneKind>("crews");
  const lastHero = useRef<HeroState | null>(null);
  if (chapter.scene) lastKind.current = chapter.scene;
  const live = heroState(chapter.scene, progress, loop, still);
  if (chapter.scene) lastHero.current = live;
  const hero = chapter.scene ? live : (lastHero.current ?? live);

  const target = useMemo(
    () => (hero.chartReveal === null ? baseTarget : { ...baseTarget, chart: { ...baseTarget.chart, reveal: hero.chartReveal } }),
    [baseTarget, hero.chartReveal],
  );

  const globeRef = useRef<GlobeTarget>(target.globe);
  const staticRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    globeRef.current = target.globe;
    // The static picture cannot fly; it only dims, through a CSS variable.
    staticRef.current?.style.setProperty("--globe-b", String(0.35 + 0.65 * target.globe.brightness));
    // How much of the 3D globe shows.
    stage.current?.style.setProperty("--globe-presence", presence(target.globe.brightness).toFixed(3));
  }, [target.globe]);

  // Registers font files from assets/fonts/ if there are any (none means the system stack).
  useEffect(() => {
    void loadStoryFonts();
  }, []);

  const series = useMemo(() => (calendar.status === "ok" ? buildSeries(calendar.data) : null), [calendar]);
  const synthetic = calendar.status === "ok" && calendar.data.synthetic === true;

  const goTo = useCallback(
    (i: number, smooth: boolean) => {
      // Use the chapter section's real position, not innerHeight maths: innerHeight can still be settling at mount.
      const section = chapters[i] && document.getElementById(chapters[i].id);
      if (!section) return;
      // +1 px: scrollTo rounds down, which can land a fraction short and show the previous chapter.
      const top = Math.ceil(section.getBoundingClientRect().top + window.scrollY) + 1;
      window.scrollTo({ top, behavior: smooth && !reduced ? "smooth" : "auto" });
    },
    [chapters, reduced],
  );

  // Deep link: ?ch=<chapter id> (inside the hash, because the app uses HashRouter). Applied after the first
  // frame, and once more when the page has finished loading, in case layout moved in between.
  const deepLinked = useRef(false);
  useEffect(() => {
    if (deepLinked.current) return;
    const i = chapters.findIndex((c) => c.id === readParam("ch"));
    if (i <= 0) return;
    const go = () => {
      deepLinked.current = true; // set when it actually scrolls, so a StrictMode remount still applies the link
      goTo(i, false);
    };
    const raf = requestAnimationFrame(go);
    const late = document.readyState === "complete" ? undefined : go;
    if (late) window.addEventListener("load", late, { once: true });
    return () => {
      cancelAnimationFrame(raf);
      if (late) window.removeEventListener("load", late);
    };
  }, [chapters, goTo]);

  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    writeChapterParam(chapter.id);
  }, [chapter.id]);

  const copy = chapter.copy(lang);
  const Stage = chapter.Stage;
  const items = chapters.map((c) => ({ id: c.id, n: chapterNumber(c.id), title: c.copy(lang).headline }));
  const labels = useMemo(() => PIPE_KEYS.map((k) => s(k)), [s]);

  // The badge: marks on the hero map are always illustrative; a chart of fixture data says "synthetic".
  const fixture = hotspots.status === "ok" ? hotspots.data.synthetic : synthetic;
  const badge = chapter.scene ? s(fixture ? "badge.fixture" : "badge.illustrative") : chapter.data.length && synthetic ? s("synthetic.badge") : null;

  return (
    <div ref={root} className="story-scroller">
      <div ref={stage} className="story-stage">
        <Backdrop reduced={reduced} lowBandwidth={lowBandwidth} />
        {!allOwn && (
          <>
          <div ref={staticRef} className="story-globe-wrap">
            <GlobeLayer targetRef={globeRef} lowBandwidth={lowBandwidth} />
          </div>
          <div className="story-hero-wrap" data-on={chapter.scene ? "" : undefined}>
            <HeroMap
              kind={chapter.scene ?? lastKind.current}
              hero={hero}
              hotspots={hotspots.status === "ok" ? hotspots.data : null}
              still={still}
              lowBandwidth={lowBandwidth}
              labels={labels}
            />
          </div>
          </>
        )}

        {chapter.own ? (
          <div className="story-own" data-chapter={chapter.id}>
            <Stage key={chapter.id} progress={progress} reduced={reduced} lang={lang} lowBandwidth={lowBandwidth} />
          </div>
        ) : (
        <div
          className="story-ui"
          data-scene={chapter.scene}
          data-collapsed={chapter.chartHeightDvh === 0 || target.chart.visible < 0.01 ? "" : undefined}
          style={chapter.chartHeightDvh ? ({ "--chart-h": `${chapter.chartHeightDvh}dvh` } as CSSProperties) : undefined}
        >
          <div className="story-left">
            <ChapterHead headline={copy.headline} line={copy.body} badge={badge} />
            {loopsHere && (
              <button type="button" className="story-pause" onClick={() => setPaused((p) => !p)} aria-pressed={paused}>
                <svg width="10" height="12" viewBox="0 0 10 12" aria-hidden="true">
                  {paused ? <path d="M1,1 L9,6 L1,11 Z" fill="currentColor" /> : <path d="M1,1 H3.5 V11 H1 Z M6.5,1 H9 V11 H6.5 Z" fill="currentColor" />}
                </svg>
                {s(paused ? "loop.play" : "loop.pause")}
              </button>
            )}
          </div>

          <div className="story-chapter-stage">
            <Stage key={chapter.id} progress={progress} reduced={reduced} lang={lang} lowBandwidth={lowBandwidth} />
          </div>

          <StageChart series={series} target={target.chart} synthetic={synthetic} bare={chapter.chartStyle === "bare"} cursor={hero.cursor} />
        </div>
        )}

        <ChapterNav items={items} active={index} onGo={(i) => goTo(i, true)} />
        <SourcesPanel caption={copy.caption} data={chapter.data} claims={chapter.claims} synthetic={chapter.data.length ? (chapter.scene ? fixture : synthetic) : null} Notes={chapter.Notes} />
      </div>

      {/* The same story as plain text, in order, for screen readers and for browsers without scroll effects. */}
      {chapters.map((c) => {
        const text = c.copy(lang);
        return (
          <section key={c.id} id={c.id} className="story-section" style={{ height: `${c.lengthVh}dvh` }} aria-labelledby={`${c.id}-h`}>
            <div className="story-sr-only">
              <h2 id={`${c.id}-h`}>{text.headline}</h2>
              <p>{text.body}</p>
              <p>{c.alt(lang)}</p>
            </div>
          </section>
        );
      })}
    </div>
  );
}
