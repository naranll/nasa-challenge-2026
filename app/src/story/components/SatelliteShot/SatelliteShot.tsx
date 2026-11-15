import './SatelliteShot.css';
import { SATELLITES, type Lang, type SatelliteId } from './satellites';

export type SatelliteShotProps = {
  id: SatelliteId;
  lang?: Lang;
  /** Load immediately (use for the first satellite on screen); everything else lazy-loads. */
  eager?: boolean;
  className?: string;
};

/**
 * Image-led satellite: one large transparent cut-out with a single caption line beneath it
 * ("Name · nickname"). No table, no numbers, no motion, so it needs no reduced-motion variant.
 */
export function SatelliteShot({ id, lang = 'en', eager = false, className }: SatelliteShotProps) {
  const s = SATELLITES[id];
  const nickname = s.nickname[lang] ?? s.nickname.en;
  const alt = s.alt[lang] ?? s.alt.en;

  return (
    <figure className={className ? `sat-shot ${className}` : 'sat-shot'} data-satellite={id}>
      <img
        className="sat-shot__img"
        src={s.src}
        alt={alt}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        draggable={false}
      />
      <figcaption className="sat-shot__caption">
        <span className="sat-shot__name">{s.name}</span>
        <span className="sat-shot__sep" aria-hidden="true">
          ·
        </span>
        <span className="sat-shot__nick">{nickname}</span>
      </figcaption>
    </figure>
  );
}

export default SatelliteShot;
