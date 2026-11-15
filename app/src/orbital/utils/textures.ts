import * as THREE from 'three'
import { geoEquirectangular, geoGraticule10, geoPath } from 'd3-geo'
import { feature } from 'topojson-client'
import type { Topology, GeometryCollection } from 'topojson-specification'
import landTopo from 'world-atlas/land-110m.json'

/** Soft radial glow used for hotspots, satellite halos and nebula dust. */
export function makeGlowTexture(inner = 'rgba(255,255,255,1)', size = 128) {
  const c = document.createElement('canvas')
  c.width = c.height = size
  const g = c.getContext('2d')!
  const grd = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  grd.addColorStop(0, inner)
  grd.addColorStop(0.25, 'rgba(255,255,255,0.45)')
  grd.addColorStop(0.6, 'rgba(255,255,255,0.08)')
  grd.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = grd
  g.fillRect(0, 0, size, size)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

/** Solar-panel cell texture tinted with the sensor colour. */
export function makePanelTexture(tint: string) {
  const w = 64
  const h = 192
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const g = c.getContext('2d')!
  g.fillStyle = '#0d1220'
  g.fillRect(0, 0, w, h)
  const cols = 3
  const rows = 10
  const cw = w / cols
  const ch = h / rows
  for (let i = 0; i < cols; i++)
    for (let j = 0; j < rows; j++) {
      g.fillStyle = (i + j) % 2 ? '#16203a' : '#1b2846'
      g.fillRect(i * cw + 1.5, j * ch + 1.5, cw - 3, ch - 3)
    }
  g.strokeStyle = tint
  g.globalAlpha = 0.55
  g.lineWidth = 1
  for (let i = 0; i <= cols; i++) {
    g.beginPath()
    g.moveTo(i * cw, 0)
    g.lineTo(i * cw, h)
    g.stroke()
  }
  for (let j = 0; j <= rows; j++) {
    g.beginPath()
    g.moveTo(0, j * ch)
    g.lineTo(w, j * ch)
    g.stroke()
  }
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

let earthCache: { map: THREE.CanvasTexture; emissive: THREE.CanvasTexture } | null = null

/**
 * Stylised Earth: terracotta continents + glowing outlines on a dark ocean,
 * painted from Natural Earth land polygons (world-atlas, 1:110m).
 * Kept small for a fast first paint: 2048 × 1024 (a quarter of the pixels of 4096 × 2048, painted on the
 * main thread at load), 1:110m land (55 kB instead of 545 kB of JSON in the bundle), and no canvas blur.
 */
export function makeEarthTextures(maxAniso = 8) {
  if (earthCache) return earthCache
  const W = 2048
  const H = 1024
  const px = W / 4096 // line widths and grain were tuned at 4096 px
  const projection = geoEquirectangular()
    .scale(W / (2 * Math.PI))
    .translate([W / 2, H / 2])
  const topo = landTopo as unknown as Topology<{ land: GeometryCollection }>
  const land = feature(topo, topo.objects.land)

  /* ---- colour map ---- */
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const g = c.getContext('2d')!
  const ocean = g.createLinearGradient(0, 0, 0, H)
  ocean.addColorStop(0, '#141824')
  ocean.addColorStop(0.5, '#1A1E29')
  ocean.addColorStop(1, '#141824')
  g.fillStyle = ocean
  g.fillRect(0, 0, W, H)

  const path = geoPath(projection, g)
  // faint graticule
  g.beginPath()
  path(geoGraticule10())
  g.strokeStyle = 'rgba(152,216,232,0.07)'
  g.lineWidth = 1.5 * px
  g.stroke()

  // land fill with a latitude gradient (deeper terracotta toward the poles)
  const landGrad = g.createLinearGradient(0, 0, 0, H)
  landGrad.addColorStop(0, '#B8461A')
  landGrad.addColorStop(0.3, '#E05A1B')
  landGrad.addColorStop(0.5, '#F27D26')
  landGrad.addColorStop(0.7, '#E05A1B')
  landGrad.addColorStop(1, '#C24E1C')
  g.beginPath()
  path(land)
  g.fillStyle = landGrad
  g.fill()

  // grain inside land for a printed, tactile feel
  g.save()
  g.beginPath()
  path(land)
  g.clip()
  // two colours, so the fill style changes twice, not 26 000 times
  for (const [style, count] of [['rgba(255,190,120,0.10)', 3250], ['rgba(90,25,5,0.12)', 3250]] as const) {
    g.fillStyle = style
    for (let i = 0; i < count; i++) {
      g.fillRect(Math.random() * W, Math.random() * H, (2 + Math.random() * 3) * px * 1.4, (2 + Math.random() * 3) * px * 1.4)
    }
  }
  g.restore()

  g.beginPath()
  path(land)
  g.strokeStyle = 'rgba(255,196,140,0.9)'
  g.lineWidth = Math.max(1, 2 * px)
  g.stroke()

  /* ---- emissive (glow) map ---- */
  const e = document.createElement('canvas')
  e.width = W
  e.height = H
  const ge = e.getContext('2d')!
  ge.fillStyle = '#000'
  ge.fillRect(0, 0, W, H)
  const pe = geoPath(projection, ge)
  ge.beginPath()
  pe(land)
  ge.fillStyle = 'rgba(120,40,10,0.55)'
  ge.fill()
  // soft glow: a wide faint stroke under the sharp one (a canvas shadowBlur here took most of the load time)
  ge.beginPath()
  pe(land)
  ge.strokeStyle = 'rgba(255,154,77,0.22)'
  ge.lineWidth = 9 * px * 2
  ge.stroke()
  ge.strokeStyle = '#FFB070'
  ge.lineWidth = 3.5 * px * 1.4
  ge.stroke()

  const map = new THREE.CanvasTexture(c)
  map.colorSpace = THREE.SRGBColorSpace
  map.anisotropy = Math.min(4, maxAniso)
  const emissive = new THREE.CanvasTexture(e)
  emissive.colorSpace = THREE.SRGBColorSpace
  emissive.anisotropy = Math.min(4, maxAniso)
  earthCache = { map, emissive }
  return earthCache
}
