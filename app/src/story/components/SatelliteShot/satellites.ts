// Image-led satellite entries for SatelliteShot.
// Copy is deliberately minimal: a name and a nickname. No specs here (no table, no numbers),
// so there is nothing for the claims ledger. Nicknames come from Story_Page_Build_Brief §2.
// Mongolian is intentionally absent: it goes through the normal mn/en + native-proof path (P5).
// Until it is supplied, SatelliteShot falls back to English.

import terra from '../../assets/satellites/terra.webp';
import aqua from '../../assets/satellites/aqua.webp';
import suomiNpp from '../../assets/satellites/suomi-npp.webp';
import noaa20 from '../../assets/satellites/noaa-20.webp';
import noaa21 from '../../assets/satellites/noaa-21.webp';

export type SatelliteId = 'terra' | 'aqua' | 'suomi-npp' | 'noaa-20' | 'noaa-21';
export type Lang = 'en' | 'mn';

type Localized = { en: string } & Partial<Record<Exclude<Lang, 'en'>, string>>;

export type SatelliteEntry = {
  name: string;
  nickname: Localized;
  alt: Localized;
  src: string;
};

export const SATELLITES: Record<SatelliteId, SatelliteEntry> = {
  terra: {
    name: 'Terra',
    nickname: { en: 'the morning veteran' },
    alt: { en: 'Stylized illustration of the Terra satellite with its solar array extended.' },
    src: terra,
  },
  aqua: {
    name: 'Aqua',
    nickname: { en: 'the afternoon anchor' },
    alt: { en: 'Stylized illustration of the Aqua satellite with its solar array extended.' },
    src: aqua,
  },
  'suomi-npp': {
    name: 'Suomi NPP',
    nickname: { en: 'the pathfinder' },
    alt: { en: 'Stylized illustration of the Suomi NPP satellite with its solar array extended.' },
    src: suomiNpp,
  },
  'noaa-20': {
    name: 'NOAA-20',
    nickname: { en: 'the steady one' },
    alt: { en: 'Stylized illustration of the NOAA-20 satellite with its solar array extended.' },
    src: noaa20,
  },
  'noaa-21': {
    name: 'NOAA-21',
    nickname: { en: 'the newest' },
    alt: { en: 'Stylized illustration of the NOAA-21 satellite with its instrument and solar array.' },
    src: noaa21,
  },
};
