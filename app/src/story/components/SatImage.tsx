/**
 * A satellite picture. Pictures come from app/src/story/assets/satellites/<id>.(webp|png|jpg|avif) when present
 * (id = terra, aqua, snpp, noaa20, noaa21). Until then a labelled placeholder is shown, never a made-up image.
 */
import { nameKey, SENSOR_OF, type PlatformId } from "../../globe/platforms";
import { useI18n } from "../../i18n";
import { useStoryText } from "../strings";

const files = import.meta.glob("../assets/satellites/*.{webp,png,jpg,jpeg,avif}", { eager: true, query: "?url", import: "default" }) as Record<string, string>;

/** id -> url for every picture found in assets/satellites/. */
export const SATELLITE_URLS: Partial<Record<PlatformId, string>> = Object.fromEntries(
  Object.entries(files).flatMap(([path, url]) => {
    const id = /([^/]+)\.[a-z]+$/.exec(path)?.[1]?.toLowerCase();
    return id ? [[id, url]] : [];
  }),
);

interface Props {
  id: PlatformId;
  /** 0..1: how bright the picture is. Dim = out of service, 1 = lit. */
  light?: number;
  /** Larger picture (the foreground of the two-crews scene). */
  large?: boolean;
}

export function SatImage({ id, light = 1, large = false }: Props) {
  const { t } = useI18n();
  const s = useStoryText();
  const name = t(nameKey(id));
  const url = SATELLITE_URLS[id];
  const sensor = SENSOR_OF[id];
  return (
    <figure className={`story-sat${large ? " is-large" : ""}`} data-sensor={sensor} style={{ opacity: 0.3 + 0.7 * light, filter: `grayscale(${(1 - light) * 0.85})` }}>
      {url ? (
        <img src={url} alt={name} loading="lazy" decoding="async" />
      ) : (
        <div className="story-sat-ph" role="img" aria-label={`${s("sat.placeholder")}: ${name}`}>
          <span>{s("sat.placeholder")}</span>
          <small>{s("sat.hint", { file: `${id}.webp` })}</small>
        </div>
      )}
      <figcaption>
        {name} <span>{sensor}</span>
      </figcaption>
    </figure>
  );
}
