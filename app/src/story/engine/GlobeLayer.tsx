/** The persistent globe layer: 3D when possible, the existing static picture on low bandwidth or any failure. */
import { lazy, Suspense, useCallback, useMemo, useState, type RefObject } from "react";
import { ErrorBoundary } from "../../globe/ErrorBoundary";
import "../../globe/globe.css";
import { StaticGlobe } from "../../globe/StaticGlobe";
import { useStoryText } from "../strings";
import type { GlobeTarget } from "../types";

const StoryGlobe = lazy(() => import("./StoryGlobe"));

interface Props {
  targetRef: RefObject<GlobeTarget>;
  lowBandwidth: boolean;
}

export function GlobeLayer({ targetRef, lowBandwidth }: Props) {
  const s = useStoryText();
  const [failed, setFailed] = useState(false);
  const fail = useCallback(() => setFailed(true), []);
  const at = useMemo(() => new Date(), []);
  const picture = (loading = false) => <StaticGlobe orbits={[]} at={at} loading={loading} />;
  const flat = lowBandwidth || failed;

  return (
    <div className="story-globe" role="img" aria-label={s("globe.alt")} data-mode={flat ? "static" : "webgl"}>
      {flat ? (
        <div className="story-globe-static">{picture()}</div>
      ) : (
        <ErrorBoundary fallback={<div className="story-globe-static">{picture()}</div>} onError={fail}>
          <Suspense fallback={<div className="story-globe-static">{picture(true)}</div>}>
            <StoryGlobe targetRef={targetRef} onFallback={fail} />
          </Suspense>
        </ErrorBoundary>
      )}
      {flat && <p className="story-note story-lite-note">{s("lite.note")}</p>}
    </div>
  );
}
