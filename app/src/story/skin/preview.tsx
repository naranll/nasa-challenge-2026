import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./skin.css";
import "./preview.css";
import {
  CartoonSatellite, GlyphTile, GradientOrb, GrainOverlay, HairlineFrame, SkinStage, SparkFlare, SpectrumTimeline, TrackedCaption, TwoHands,
  generatedArtIds, useParallax, useSkinMode,
  type SatelliteId, type TimelineEvent,
} from "./index";

/* Years are NOT verified (chapters.json marks them [verify]), so the timeline prints placeholders. */
const EVENTS: TimelineEvent[] = [
  { id: "terra", label: "Terra", sensor: "MODIS", kind: "launch" },
  { id: "aqua", label: "Aqua", sensor: "MODIS", kind: "launch" },
  { id: "snpp", label: "Suomi NPP", sensor: "VIIRS", kind: "launch" },
  { id: "n20", label: "NOAA-20", sensor: "VIIRS", kind: "launch" },
  { id: "n21", label: "NOAA-21", sensor: "VIIRS", kind: "launch" },
  { id: "terra-r", label: "Terra", sensor: "MODIS", kind: "retire" },
];
const SATS: SatelliteId[] = ["terra", "aqua", "snpp", "noaa20", "noaa21"];

function Board({ tone }: { tone: "ink" | "cobalt" }) {
  const par = useParallax<HTMLDivElement>(10);
  return (
    <SkinStage tone={tone} className="pv-board">
      <HairlineFrame grid={72} diagonals={[[0, 100, 100, 0], [0, 60, 62, 0]]} coords={["47.92°N", "106.92°E", "SK-01", "STYLIZED"]} barcode="space-khuushuur" />

      {/* hero orb: one object, a spark, no text */}
      <section className="pv-hero">
        <div ref={par} className="sk-parallax pv-orbwrap">
          <GradientOrb size="min(78vw, 560px)" spark />
        </div>
      </section>

      <section className="pv-row">
        <div className="pv-cell">
          <TrackedCaption tone="dim">Captions</TrackedCaption>
          <TrackedCaption>Tracked mono caption</TrackedCaption>
          <TrackedCaption tone="lime" size="micro">Counter 07 / 11</TrackedCaption>
          <TrackedCaption tone="pink">[ verify ]</TrackedCaption>
          <TrackedCaption>This long caption falls back to sentence case so Mongolian prose is not shouted.</TrackedCaption>
        </div>
        <div className="pv-cell">
          <TrackedCaption tone="dim">Glyph tiles</TrackedCaption>
          <div className="pv-inline">
            <GlyphTile>+</GlyphTile>
            <GlyphTile tone="modis">●</GlyphTile>
            <GlyphTile tone="viirs">▲</GlyphTile>
            <GlyphTile tone="fire">✦</GlyphTile>
            <GlyphTile tone="lime">07</GlyphTile>
            <GlyphTile tone="pink" size={36}>?</GlyphTile>
          </div>
          <TrackedCaption tone="dim">Spark flares</TrackedCaption>
          <div className="pv-inline">
            <SparkFlare size={56} />
            <SparkFlare size={84} color="#ffb07a" angle={8} />
            <SparkFlare size={40} color="#a9a9ff" />
          </div>
        </div>
        <div className="pv-cell pv-orbs">
          <TrackedCaption tone="dim">Orbs (objects)</TrackedCaption>
          <div className="pv-orbrow">
            <div className="pv-orbbox"><GradientOrb size={104} from="#ff5a1f" mid="#ff8a3d" to="#d62b8f" blur={12} drift={0} /></div>
            <div className="pv-orbbox"><GradientOrb size={104} from="#19c3b1" mid="#19c3b1" to="#0d6e66" blur={12} drift={0} /></div>
            <div className="pv-orbbox"><GradientOrb size={104} from="#5b5bf0" mid="#5b5bf0" to="#2b2b99" blur={12} drift={0} /></div>
          </div>
        </div>
      </section>

      <section className="pv-row pv-row--wide">
        <div className="pv-cell">
          <TrackedCaption tone="dim">Spectrum timeline · years unverified</TrackedCaption>
          <SpectrumTimeline events={EVENTS} orientation="vertical" length={420} summary="Order of launches and retirements of the five platforms. Dates are not yet verified." />
        </div>
        <div className="pv-cell pv-grow">
          <div className="pv-hz pv-cell"><TrackedCaption tone="dim">Horizontal variant (wide screens)</TrackedCaption>
          <SpectrumTimeline events={EVENTS.slice(0, 5)} orientation="horizontal" summary="Launch order of five platforms." /></div>
          <TrackedCaption tone="dim">Satellites</TrackedCaption>
          <div className="pv-sats">
            {SATS.map((id, i) => (
              <CartoonSatellite key={id} id={id} size={150} bubble={id === "noaa21" ? "The newest. Still settling in." : undefined} inset={i === 0 ? <SparkFlare size={34} /> : undefined} />
            ))}
          </div>
          <TrackedCaption tone="dim" size="micro">{`Art source: ${generatedArtIds.length ? `generated (${generatedArtIds.join(", ")})` : "SVG fallback"}`}</TrackedCaption>
        </div>
      </section>

      <section className="pv-hands">
        <TwoHands width={640} />
        <TrackedCaption tone="dim" wide>Two sensors, one record</TrackedCaption>
      </section>
      <GrainOverlay opacity={0.16} />
    </SkinStage>
  );
}

function App() {
  const mode = useSkinMode();
  return (
    <>
      <div className="pv-flags">
        <TrackedCaption size="micro" tone="dim">{`reduced=${mode.reduced} lite=${mode.lite}`}</TrackedCaption>
      </div>
      <Board tone="ink" />
      
    </>
  );
}

createRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>);
