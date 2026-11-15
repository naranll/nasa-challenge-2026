/**
 * Нэг тивийн газрын зураг <canvas> дээр: equirectangular проекц, суурь нь Natural Earth 110m land.
 * Түүхий горим (#34): цэгийг fillRect-ээр, platform бүрийг нэг fillStyle-аар багцалж зурна, hover нь spatial grid index-ээр.
 * Harmonize горим (#36): H3 res 5 hexagon-ыг path-аар, нэг ижил log1p шкалаар; hover нь төвийн grid + point-in-polygon.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import type { WorldCell, WorldCellsFile, WorldContinent, WorldPointsFile } from "../data/contracts";
import { formatDate, formatNumber } from "../globe/format";
import { rings, type Outline, type Ring } from "../globe/geo";
import { SENSOR_OF, type Sensor } from "../globe/platforms";
import { useI18n, type MessageKey } from "../i18n";
import { buildCellHover, cellValue, harmColor, NO_RATIO_COLOR, projectCells } from "./cellsData";
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

/** Газрын зураг дээр юу зурах вэ: түүхий цэгүүд эсвэл Harmonize-ийн hexagon-ууд (`max` = хоёр дэлгэцийн нэг max). */
export type WorldLayer = { kind: "points"; file: WorldPointsFile } | { kind: "cells"; file: WorldCellsFile; max: number };

interface Props {
  continent: WorldContinent;
  layer: WorldLayer;
  sensor: Sensor;
  label: string;
}

export function WorldMapCanvas({ continent, layer, sensor, label }: Props) {
  const land = useLand();
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [width, setWidth] = useState(0);
  /** row = файл дахь мөр (цэг эсвэл нүд), x/y = canvas дээрх px */
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
  // Нэг удаад нэг давхаргыг л проекцолно, нөгөө нь null.
  const points = useMemo(
    () => (layer.kind === "points" ? projectPoints(layer.file, sensor, bbox, view) : null),
    [layer, sensor, bbox, view],
  );
  const cells = useMemo(
    () => (layer.kind === "cells" ? projectCells(layer.file, sensor, bbox, view) : null),
    [layer, sensor, bbox, view],
  );
  const shown = points ?? cells;
  /** (x, y) px -> shown-ий индекс, эсвэл -1 */
  const findAt = useMemo(() => {
    if (points) {
      const grid = buildHoverGrid(points.xs, points.ys, width, height, HOVER_RADIUS);
      return (x: number, y: number) => grid.nearest(x, y);
    }
    if (cells) {
      const hex = buildCellHover(cells, width, height, HOVER_RADIUS);
      return (x: number, y: number) => hex.at(x, y);
    }
    return () => -1;
  }, [points, cells, width, height]);

  useEffect(() => setHover(null), [shown]);

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

    if (points && layer.kind === "points") {
      // Цэгүүд: platform бүрийг нэг fillStyle-аар. Олон platform-ыг эхэлж, цөөнийг сүүлд зурна (дээр нь харагдана).
      const { ids, xs, ys } = points;
      const platformOfRow = layer.file.columns.platform;
      const order = layer.file.codes.platform
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
    }

    if (cells && layer.kind === "cells") {
      // Hexagon-ууд: нэг өнгийн бүх нүдийг нэг path болгож нэг fill-ээр зурна (ramp-д ~256 өнгө л бий).
      // Тивийн хэмжээнд res 5 нүд ~1 px тул ижил өнгийн нимгэн хүрээ, төвд нь цэгийн хэмжээтэй дөрвөлжин нэмж,
      // алга болохоос сэргийлнэ (том hexagon-д дөрвөлжин нь дотроо орно).
      const byColor = new Map<string, number[]>();
      cells.values.forEach((v, j) => {
        const color = Number.isNaN(v) ? NO_RATIO_COLOR : harmColor(v, layer.max);
        const list = byColor.get(color);
        if (list) list.push(j);
        else byColor.set(color, [j]);
      });
      ctx.lineWidth = 0.5;
      for (const [color, list] of byColor) {
        ctx.beginPath();
        for (const j of list) tracePoly(ctx, cells.polys[j]);
        ctx.fillStyle = color;
        ctx.strokeStyle = color;
        ctx.fill();
        ctx.stroke();
        for (const j of list) ctx.fillRect(cells.xs[j] - DOT / 2, cells.ys[j] - DOT / 2, DOT, DOT);
      }
    }
  }, [bbox, cells, continent, height, land, layer, points, sensor, view, width]);

  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!shown) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const j = findAt(e.clientX - rect.left, e.clientY - rect.top);
    const row = j < 0 ? -1 : shown.ids[j];
    // Ижил цэг/нүд дээр байвал өмнөх state-ийг буцаана: React дахин render хийхгүй, hover гацахгүй.
    setHover((prev) => ((prev?.row ?? -1) === row ? prev : j < 0 ? null : { row, x: shown.xs[j], y: shown.ys[j] }));
  };

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
      {hover && (
        <>
          <span className="world-map-ring" style={{ left: hover.x, top: hover.y }} aria-hidden="true" />
          <div className="world-map-tip" style={tipStyle}>
            {layer.kind === "points" ? (
              <PointTip file={layer.file} row={hover.row} />
            ) : (
              <CellTip cell={layer.file.cells[hover.row]} sensor={sensor} />
            )}
          </div>
        </>
      )}
    </div>
  );
}

/** Нэг polygon-ыг ([x0, y0, x1, y1, ...]) одоогийн path-д нэмнэ. */
function tracePoly(ctx: CanvasRenderingContext2D, poly: Float32Array) {
  if (poly.length < 6) return;
  ctx.moveTo(poly[0], poly[1]);
  for (let k = 2; k < poly.length; k += 2) ctx.lineTo(poly[k], poly[k + 1]);
  ctx.closePath();
}

/** Түүхий hotspot-ын tooltip (#34). */
function PointTip({ file, row }: { file: WorldPointsFile; row: number }) {
  const { t, lang } = useI18n();
  const point = pointAt(file, row);
  return (
    <>
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
    </>
  );
}

/**
 * Hexagon-ы tooltip (#36): хэрэглэгч тооцоог өөрөө шалгаж болохуйц.
 * VIIRS: NOAA-20 fire unit (өдөр, шөнө) × ашигласан r = Aqua-equivalent. MODIS: Aqua hotspot × 1.
 */
function CellTip({ cell, sensor }: { cell: WorldCell; sensor: Sensor }) {
  const { t, lang } = useI18n();
  const num = (v: number) => formatNumber(v, lang, { maximumFractionDigits: 2 });
  const ratio = (r: number | null) =>
    r === null ? t("world.ratio.unknown") : formatNumber(r, lang, { maximumFractionDigits: 4 });
  const value = cellValue(cell, sensor);
  const units = cell.noaa20_units;
  return (
    <>
      <strong>{value === null ? t("world.tip.harm.unknown") : t("world.tip.harm.value", { v: num(value) })}</strong>
      {sensor === "VIIRS" ? (
        <>
          <span>{t("world.tip.harm.units", { d: num(units.D), n: num(units.N) })}</span>
          <span>{t("world.tip.harm.r", { d: ratio(cell.r.D), n: ratio(cell.r.N) })}</span>
          {value !== null && (
            <span>
              {t("world.tip.harm.sum", {
                ud: num(units.D),
                rd: ratio(cell.r.D),
                un: num(units.N),
                rn: ratio(cell.r.N),
                v: num(value),
              })}
            </span>
          )}
        </>
      ) : (
        <span>{t("world.tip.harm.aqua", { n: num(cell.aqua) })}</span>
      )}
    </>
  );
}
