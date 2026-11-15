/**
 * Нэг тивийн түүхий hotspot-ууд <canvas> дээр (#34): equirectangular проекц, суурь нь Natural Earth 110m land.
 * Цэгийг fillRect-ээр, platform бүрийг нэг fillStyle-аар багцалж зурна. Hover нь spatial grid index-ээр.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import type { WorldContinent, WorldPointsFile } from "../data/contracts";
import { formatDate, formatNumber } from "../globe/format";
import { rings, type Outline, type Ring } from "../globe/geo";
import { SENSOR_OF, type Sensor } from "../globe/platforms";
import { useI18n, type MessageKey } from "../i18n";
import { borderLines, buildHoverGrid, fitBbox, PLATFORM_COLOR, pointAt, projectPoints, worldCopies } from "./worldData";

const OCEAN = "#0a1020";
const LAND_FILL = "#1b2335";
const LAND_EDGE = "#323d55";
/** Цэгийн хэмжээ ба hover-ийн радиус, CSS px. */
const DOT = 2;
const HOVER_RADIUS = 6;
const PAD = 8;
/** Canvas-ын өндрийн хязгаар, CSS px: Европ шиг өргөн тив хэт нам, Ази шиг өндөр тив хэт өндөр болохгүй. */
const MIN_HEIGHT = 240;
const MAX_HEIGHT = 560;
/** Tooltip-ийн цэгээс зай, мөн захад ойр үед эргүүлэх босго (tooltip-ийн ойролцоо хэмжээ), CSS px. */
const TIP_GAP = 12;
const TIP_W = 280;
const TIP_H = 130;

interface LandShapes {
  rings: Ring[];
  borders: Ring[];
}

/** land.json-ийг (31 KB) StaticGlobe шиг тусад нь ачаална, ингэснээр үндсэн bundle-д орохгүй. */
function useLand(): LandShapes | null {
  const [land, setLand] = useState<LandShapes | null>(null);
  useEffect(() => {
    let live = true;
    import("../globe/assets/land.json").then(
      (m) => {
        const all = rings(m.default as Outline);
        if (live) setLand({ rings: all, borders: all.flatMap(borderLines) });
      },
      () => {},
    );
    return () => {
      live = false;
    };
  }, []);
  return land;
}

interface Props {
  continent: WorldContinent;
  file: WorldPointsFile;
  sensor: Sensor;
  label: string;
}

export function WorldMapCanvas({ continent, file, sensor, label }: Props) {
  const { t, lang } = useI18n();
  const land = useLand();
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [width, setWidth] = useState(0);
  /** row = файл дахь мөр, x/y = canvas дээрх px */
  const [hover, setHover] = useState<{ row: number; x: number; y: number } | null>(null);
  const bbox = continent.bbox;

  // Өргөнийг контейнероос авна. Өндөр нь bbox-ийн харьцаагаар, MIN..MAX хооронд.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const aspect = (bbox[3] - bbox[1]) / (bbox[2] - bbox[0]);
  const height = width > 0 ? Math.round(Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, width * aspect))) : 0;

  const view = useMemo(() => fitBbox(bbox, width, height, PAD), [bbox, width, height]);
  const projected = useMemo(() => projectPoints(file, sensor, bbox, view), [file, sensor, bbox, view]);
  const grid = useMemo(
    () => buildHoverGrid(projected.xs, projected.ys, width, height, HOVER_RADIUS),
    [projected, width, height],
  );

  useEffect(() => setHover(null), [projected]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || width === 0) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = OCEAN;
    ctx.fillRect(0, 0, width, height);

    // Хуурай газар: 180°-ыг дамнадаг тивд дэлхийг +360°-аар дахин зурна. Хилийн шугам ±180°-ын таслалтыг алгасна.
    if (land) {
      const trace = (lines: Ring[], close: boolean) => {
        ctx.beginPath();
        for (const offset of worldCopies(bbox)) {
          for (const line of lines) {
            line.forEach(([lon, lat], j) => {
              const [x, y] = view.project(lon + offset, lat);
              if (j === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            });
            if (close) ctx.closePath();
          }
        }
      };
      trace(land.rings, true);
      ctx.fillStyle = LAND_FILL;
      ctx.fill("evenodd");
      trace(land.borders, false);
      ctx.strokeStyle = LAND_EDGE;
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }

    // Цэгүүд: platform бүрийг нэг fillStyle-аар. Олон platform-ыг эхэлж, цөөнийг сүүлд зурна (дээр нь харагдана).
    const { ids, xs, ys } = projected;
    const platformOfRow = file.columns.platform;
    const order = file.codes.platform
      .map((p, code) => ({ p, code }))
      .filter(({ p }) => SENSOR_OF[p] === sensor)
      .sort((a, b) => continent.n_by_platform[b.p] - continent.n_by_platform[a.p]);
    const half = DOT / 2;
    for (const { p, code } of order) {
      ctx.fillStyle = PLATFORM_COLOR[p];
      for (let j = 0; j < ids.length; j++) {
        if (platformOfRow[ids[j]] === code) ctx.fillRect(xs[j] - half, ys[j] - half, DOT, DOT);
      }
    }
  }, [bbox, continent, file, height, land, projected, sensor, view, width]);

  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const j = grid.nearest(e.clientX - rect.left, e.clientY - rect.top);
    setHover(j < 0 ? null : { row: projected.ids[j], x: projected.xs[j], y: projected.ys[j] });
  };

  const point = hover ? pointAt(file, hover.row) : null;
  // Tooltip-ийг цэгийн баруун доор гаргана. Canvas-ын баруун/доод захад ойр бол зүүн/дээш эргүүлнэ (тайрагдахгүй).
  const tipStyle: React.CSSProperties = hover
    ? {
        ...(hover.x > width - TIP_W ? { right: width - hover.x + TIP_GAP } : { left: hover.x + TIP_GAP }),
        ...(hover.y > height - TIP_H ? { bottom: height - hover.y + TIP_GAP } : { top: hover.y + TIP_GAP }),
      }
    : {};

  return (
    <div className="world-map" ref={wrapRef}>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={label}
        style={{ width: "100%", height }}
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
      />
      {hover && point && (
        <>
          <span className="world-map-ring" style={{ left: hover.x, top: hover.y }} aria-hidden="true" />
          <div className="world-map-tip" style={tipStyle}>
            <strong style={{ color: PLATFORM_COLOR[point.platform] }}>
              {t("world.tip.platform", {
                platform: t(`world.platform.${point.platform}` as MessageKey),
                sensor: t(`world.sensor.${SENSOR_OF[point.platform]}` as MessageKey),
              })}
            </strong>
            <span>{t("world.tip.time", { date: formatDate(point.date, lang), time: point.time })}</span>
            <span>{t("world.tip.frp", { frp: formatNumber(point.frp, lang, { maximumFractionDigits: 2 }) })}</span>
            <span>{t("world.tip.conf", { conf: t(`world.conf.${point.conf}` as MessageKey) })}</span>
            <span>{t(`world.dn.${point.daynight}` as MessageKey)}</span>
            {point.matchClass !== null && (
              <span>{t("world.tip.match", { match: t(`world.match.${point.matchClass}` as MessageKey) })}</span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
