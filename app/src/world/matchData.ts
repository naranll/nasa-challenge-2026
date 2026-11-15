/**
 * World map Harmonize горимын статистикийн мөр (#38): тивийн NOAA-20 ↔ Aqua match-ийн тоог (#37)
 * i18n мөр болгоно. React-гүй, тестлэгдэхүйц.
 */
import type { WorldContinent, WorldIndexFile } from "../data/contracts";

export type MatchConfig = NonNullable<WorldIndexFile["match"]>;

/**
 * Нэг мөр: i18n key ба түүний параметрүүд, хэлбэрээр нь ангилсан (component форматлана).
 * ratios = аравтын бутархай (IoU), shares = хувь, counts = бүхэл тоо.
 */
export interface MatchLine {
  key:
    | "world.stats.iou"
    | "world.stats.iou.none"
    | "world.stats.pvm"
    | "world.stats.pvm.none"
    | "world.stats.pmv"
    | "world.stats.pmv.none"
    | "world.stats.nc";
  ratios?: Record<string, number>;
  shares?: Record<string, number | null>;
  counts?: Record<string, number>;
}

/** #37-ийн key-үүд бүгд байвал мөрүүд, үгүй бол null (мөр харагдахгүй). */
export function matchLines(continent: WorldContinent, match: MatchConfig | undefined): MatchLine[] | null {
  const { iou, p_v_given_m: pvm, p_m_given_v: pmv, not_comparable_share: nc, match_counts: mc } = continent;
  if (!match || iou === undefined || pvm === undefined || pmv === undefined || !nc || !mc) return null;
  // null = хуваах зүйл алга (0 / 0): тоо биш, учрыг нь хэлсэн өгүүлбэр.
  return [
    iou === null ? { key: "world.stats.iou.none" } : { key: "world.stats.iou", ratios: { v: iou } },
    pvm === null
      ? { key: "world.stats.pvm.none" }
      : { key: "world.stats.pvm", shares: { v: pvm }, counts: { both: mc.aqua.both, n: mc.aqua.both + mc.aqua.modis_only, window: match.window_min } },
    pmv === null
      ? { key: "world.stats.pmv.none" }
      : {
          key: "world.stats.pmv",
          shares: { v: pmv },
          counts: { both: mc.noaa20_units.both, n: mc.noaa20_units.both + mc.noaa20_units.viirs_only, window: match.window_min },
        },
    {
      key: "world.stats.nc",
      shares: { aqua: nc.aqua, units: nc.noaa20_units },
      counts: { km: match.not_comparable_km, window: match.window_min },
    },
  ];
}
