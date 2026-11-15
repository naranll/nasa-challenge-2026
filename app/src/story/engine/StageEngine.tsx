/**
 * The stage engine (brief §4). One sticky full-viewport stage holds the persistent globe and chart; the page's
 * scroll length is the sum of the chapters' lengths. Each chapter gets `progress` 0..1 and only sets target
 * keyframes, so things move between chapters instead of cutting. The page scrolls natively: no scroll-jacking.
 */
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useI18n } from "../../i18n";
import { buildSeries } from "../data/series";
import { useCalendar } from "../data/adapters";
import { useStoryText } from "../strings";
import type { ChapterDef, GlobeTarget } from "../types";
import { ChapterNav } from "../shell/ChapterNav";
import { readParam, useLowBandwidth, useStoryMotion, writeChapterParam } from "./env";
import { GlobeLayer } from "./GlobeLayer";
import { chapterRanges, locate } from "./layout";
import { StageChart } from "./StageChart";
import { stageAt } from "./stageState";
import { useScrolledVh } from "./useScrollProgress";

export function StageEngine({ chapters }: { chapters: ChapterDef[] }) {
  const { lang } = useI18n();
  const s = useStoryText();
  const reduced = useStoryMotion();
  const lowBandwidth = useLowBandwidth();
  const calendar = useCalendar();

  const root = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const vh = useScrolledVh(root, stage);
  const ranges = useMemo(() => chapterRanges(chapters.map((c) => c.lengthVh)), [chapters]);
  const { index, progress } = locate(ranges, vh);
  const chapter = chapters[index];

  const target = useMemo(
    () => stageAt(chapters.map((c) => c.keyframes), index, progress, reduced),
    [chapters, index, progress, reduced],
  );
  const globeRef = useRef<GlobeTarget>(target.globe);
  const staticRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    globeRef.current = target.globe;
    // The static picture cannot fly; it only dims, through a CSS variable.
    staticRef.current?.style.setProperty("--globe-b", String(0.35 + 0.65 * target.globe.brightness));
  }, [target.globe]);

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
  const items = chapters.map((c) => ({ id: c.id, title: c.copy(lang).headline }));

  return (
    <div ref={root} className="story-scroller">
      <div ref={stage} className="story-stage">
        <div ref={staticRef} className="story-globe-wrap">
          <GlobeLayer targetRef={globeRef} lowBandwidth={lowBandwidth} />
        </div>

        <div className="story-ui">
          <section className="story-copy" aria-hidden="true">
            <p className="story-mono">{s("chapter.counter", { n: index + 1, total: chapters.length })}</p>
            <h2>{copy.headline}</h2>
            <p>{copy.body}</p>
            {copy.caption && <p className="story-mono story-caption">{copy.caption}</p>}
          </section>

          <div className="story-chapter-stage">
            <Stage key={chapter.id} progress={progress} reduced={reduced} lang={lang} lowBandwidth={lowBandwidth} />
          </div>

          <StageChart series={series} target={target.chart} synthetic={synthetic} />
        </div>

        <ChapterNav items={items} active={index} onGo={(i) => goTo(i, true)} />
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
