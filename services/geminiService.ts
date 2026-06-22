import { GoogleGenAI } from "@google/genai";

// Service to communicate with Gemini AI from the frontend.
// Note: API keys in frontend apps are suitable for demos/hackathons, but use a backend proxy in production.

export interface GenerateImageResponse {
  success: boolean;
  prompt: string;
  analysis: string;
  generated_image_url: string;
  original_image: string;
  error?: string;
}

export interface AnalyzeImageResponse {
  success: boolean;
  prompt: string;
  analysis: string;
  error?: string;
}

export interface GreenCorridorSuggestion {
  success: boolean;
  corridorPath: [number, number][];
  corridorType: string;
  reasoning: string;
  features: string[];
  error?: string;
}

export interface CityGreenCorridor {
  id: string;
  path: [number, number][];
  corridorType: string;
  priority: "High" | "Medium" | "Low";
  reasoning: string;
  zones: string[];
}

export interface CityGreenCorridorResponse {
  success: boolean;
  corridors: CityGreenCorridor[];
  citySummary: string;
  error?: string;
}

export interface RegionMetrics {
  name: string;
  heatScore: number;
  greenScore: number;
  stats: {
    trees: number;
    ev: number;
    solar: number;
    population: number;
    scPopulation: number;
    area: string;
  };
}

export interface PopulationWard {
  wardNo: number;
  ward: string;
  totalPopulation: number;
  scPopulation: number;
}

export interface PopulationOverview {
  totalPopulation: number;
  totalScPopulation: number;
  wardsCount: number;
  topWards: PopulationWard[];
}

export interface PopulationWardMapFeature {
  wardName: string;
  wardNo: string;
  totalPopulation: number;
  densityPerKm2: number;
  centroid: [number, number] | null;
  geometry: {
    type: string;
    coordinates: any;
  };
}

export interface PopulationWardMapData {
  features: PopulationWardMapFeature[];
  minDensity: number;
  maxDensity: number;
  delhiBounds: [number, number, number, number];
}

export type RegionPolygon = [number, number][];

const apiKey =
  import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY;

const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

function ensureClient(): GoogleGenAI {
  if (!ai) {
    throw new Error(
      "Gemini API key missing. Set VITE_GEMINI_API_KEY (or GEMINI_API_KEY) in .env.local.",
    );
  }
  return ai;
}

async function fileToBase64(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;

  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
}

function toDataUrl(mimeType: string, base64Data: string): string {
  return `data:${mimeType};base64,${base64Data}`;
}

type GeoFeature = {
  properties?: Record<string, unknown>;
  geometry?: {
    type?: string;
    coordinates?: any;
  };
};

const REGION_HALF_DELTA = 0.004;
const REGION_AREA_KM2 = (2 * REGION_HALF_DELTA * 111.32) * (2 * REGION_HALF_DELTA * 111.32);

function pointInPolygon(lat: number, lng: number, polygon: RegionPolygon): boolean {
  if (!Array.isArray(polygon) || polygon.length < 3) return false;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const yi = polygon[i][0];
    const xi = polygon[i][1];
    const yj = polygon[j][0];
    const xj = polygon[j][1];

    const intersects =
      yi > lat !== yj > lat &&
      lng < ((xj - xi) * (lat - yi)) / (yj - yi + Number.EPSILON) + xi;

    if (intersects) inside = !inside;
  }

  return inside;
}

function polygonBounds(polygon: RegionPolygon): [number, number, number, number] {
  let minLat = Infinity;
  let minLng = Infinity;
  let maxLat = -Infinity;
  let maxLng = -Infinity;

  for (const [lat, lng] of polygon) {
    minLat = Math.min(minLat, lat);
    minLng = Math.min(minLng, lng);
    maxLat = Math.max(maxLat, lat);
    maxLng = Math.max(maxLng, lng);
  }

  return [minLat, minLng, maxLat, maxLng];
}

function regionCenterFromPolygon(polygon: RegionPolygon): [number, number] {
  if (!polygon.length) return [28.6139, 77.2090];
  const sum = polygon.reduce(
    (acc, p) => [acc[0] + p[0], acc[1] + p[1]],
    [0, 0] as [number, number],
  );
  return [sum[0] / polygon.length, sum[1] / polygon.length];
}

function closestPointOnSegment(
  p: [number, number],
  a: [number, number],
  b: [number, number],
): [number, number] {
  const abLat = b[0] - a[0];
  const abLng = b[1] - a[1];
  const apLat = p[0] - a[0];
  const apLng = p[1] - a[1];
  const ab2 = abLat * abLat + abLng * abLng;

  if (ab2 === 0) return a;
  const t = clamp((apLat * abLat + apLng * abLng) / ab2, 0, 1);
  return [a[0] + abLat * t, a[1] + abLng * t];
}

function snapToPolygonBoundary(point: [number, number], polygon: RegionPolygon): [number, number] {
  let best: [number, number] = polygon[0] || point;
  let bestD2 = Infinity;

  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i];
    const b = polygon[(i + 1) % polygon.length];
    const cand = closestPointOnSegment(point, a, b);
    const dLat = cand[0] - point[0];
    const dLng = cand[1] - point[1];
    const d2 = dLat * dLat + dLng * dLng;

    if (d2 < bestD2) {
      bestD2 = d2;
      best = cand;
    }
  }

  return best;
}

let treeDatasetPromise: Promise<any> | null = null;
let evDatasetPromise: Promise<any> | null = null;
let solarDatasetPromise: Promise<any> | null = null;
let populationDatasetPromise: Promise<PopulationWard[]> | null = null;
let delhiWardsGeoPromise: Promise<any> | null = null;

function getDataset(url: string, cache: Promise<any> | null): Promise<any> {
  if (cache) return cache;
  const promise = fetch(url).then((res) => {
    if (!res.ok) {
      throw new Error(`Failed to load ${url}`);
    }
    return res.json();
  });
  return promise;
}

function normalizeName(input: string): string {
  return input
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parsePopulationCsv(csvText: string): PopulationWard[] {
  const lines = csvText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];

  const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const wardNoIdx = header.indexOf("wardno");
  const wardIdx = header.indexOf("ward");
  const totalIdx = header.indexOf("total_population");
  const scIdx = header.indexOf("sc_population");

  if (wardNoIdx === -1 || wardIdx === -1 || totalIdx === -1 || scIdx === -1) {
    return [];
  }

  const parsed: PopulationWard[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim());
    if (cols.length <= Math.max(wardNoIdx, wardIdx, totalIdx, scIdx)) continue;

    const wardNo = Number(cols[wardNoIdx]);
    const ward = cols[wardIdx];
    const totalPopulation = Number(cols[totalIdx]);
    const scPopulation = Number(cols[scIdx]);

    if (!ward || !Number.isFinite(totalPopulation) || totalPopulation < 0) continue;

    parsed.push({
      wardNo: Number.isFinite(wardNo) ? wardNo : parsed.length + 1,
      ward,
      totalPopulation,
      scPopulation: Number.isFinite(scPopulation) ? scPopulation : 0,
    });
  }

  return parsed;
}

async function getPopulationDataset(): Promise<PopulationWard[]> {
  if (populationDatasetPromise) return populationDatasetPromise;

  populationDatasetPromise = fetch("/data/SEC_WW_POP_2022.csv")
    .then((res) => {
      if (!res.ok) throw new Error("Failed to load SEC_WW_POP_2022.csv");
      return res.text();
    })
    .then((csvText) => parsePopulationCsv(csvText))
    .catch(() => []);

  return populationDatasetPromise;
}

function scoreNameMatch(a: string, b: string): number {
  const na = normalizeName(a);
  const nb = normalizeName(b);
  if (!na || !nb) return 0;
  if (na === nb) return 100;
  if (na.includes(nb) || nb.includes(na)) return 80;

  const ta = new Set(na.split(" ").filter(Boolean));
  const tb = new Set(nb.split(" ").filter(Boolean));
  let common = 0;
  ta.forEach((t) => {
    if (tb.has(t)) common += 1;
  });
  const denom = Math.max(1, Math.min(ta.size, tb.size));
  return Math.round((common / denom) * 60);
}

function parseWardNo(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function computeGeometryAreaKm2(geometry: { type?: string; coordinates?: any }): number {
  if (!geometry?.type || !geometry?.coordinates) return 0;
  if (geometry.type === "Polygon") {
    return polygonAreaKm2(geometry.coordinates as [number, number][][]);
  }
  if (geometry.type === "MultiPolygon") {
    return (geometry.coordinates as [number, number][][][])
      .reduce((sum, poly) => sum + polygonAreaKm2(poly), 0);
  }
  return 0;
}

function isPointInsideGeoFeature(lat: number, lng: number, feature: GeoFeature): boolean {
  const geom = feature.geometry;
  if (!geom?.type || !geom.coordinates) return false;

  if (geom.type === "Polygon") {
    const outer = (geom.coordinates?.[0] || []).map(([x, y]: [number, number]) => [y, x] as [number, number]);
    return pointInPolygon(lat, lng, outer);
  }

  if (geom.type === "MultiPolygon") {
    const polys = geom.coordinates as [number, number][][][];
    for (const poly of polys) {
      const outer = (poly?.[0] || []).map(([x, y]: [number, number]) => [y, x] as [number, number]);
      if (pointInPolygon(lat, lng, outer)) return true;
    }
  }

  return false;
}

function findPopulationForGeoFeature(feature: GeoFeature, rows: PopulationWard[]): PopulationWard | null {
  const wardNoRaw = feature.properties?.Ward_No;
  const wardName = typeof feature.properties?.Ward_Name === "string" ? feature.properties.Ward_Name : "";

  const wardNo = parseWardNo(wardNoRaw);
  if (wardNo !== null) {
    const byNo = rows.find((r) => r.wardNo === wardNo);
    if (byNo) return byNo;
  }

  if (wardName) {
    return matchWardPopulation(wardName, rows);
  }

  return null;
}

function matchWardPopulation(regionName: string, wards: PopulationWard[]): PopulationWard | null {
  if (!regionName || !wards.length) return null;

  let best: { row: PopulationWard; score: number } | null = null;
  for (const row of wards) {
    const score = scoreNameMatch(regionName, row.ward);
    if (!best || score > best.score) {
      best = { row, score };
    }
  }

  if (!best || best.score < 40) return null;
  return best.row;
}

export async function getPopulationOverview(): Promise<PopulationOverview> {
  const wards = await getPopulationDataset();
  const totalPopulation = wards.reduce((sum, w) => sum + w.totalPopulation, 0);
  const totalScPopulation = wards.reduce((sum, w) => sum + w.scPopulation, 0);
  const topWards = [...wards]
    .sort((a, b) => b.totalPopulation - a.totalPopulation)
    .slice(0, 10);

  return {
    totalPopulation,
    totalScPopulation,
    wardsCount: wards.length,
    topWards,
  };
}

export async function getPopulationWards(): Promise<PopulationWard[]> {
  return getPopulationDataset();
}

export async function getPopulationWardMapData(): Promise<PopulationWardMapData> {
  delhiWardsGeoPromise = getDataset("/data/Delhi_Wards.geojson", delhiWardsGeoPromise);

  const [rows, wardsGeo] = await Promise.all([
    getPopulationDataset(),
    delhiWardsGeoPromise,
  ]);

  const featuresRaw = Array.isArray(wardsGeo?.features) ? wardsGeo.features as GeoFeature[] : [];
  const output: PopulationWardMapFeature[] = [];

  let minDensity = Infinity;
  let maxDensity = 0;
  let minLat = Infinity;
  let minLng = Infinity;
  let maxLat = -Infinity;
  let maxLng = -Infinity;

  for (const feature of featuresRaw) {
    const geom = feature.geometry;
    if (!geom?.type || !geom.coordinates) continue;

    const matched = findPopulationForGeoFeature(feature, rows);
    const totalPopulation = matched?.totalPopulation || 0;
    const areaKm2 = Math.max(0.01, computeGeometryAreaKm2(geom));
    const densityPerKm2 = totalPopulation > 0 ? totalPopulation / areaKm2 : 0;
    const centroid = featureCentroid(feature);

    const bbox = featureBbox(feature);
    if (bbox) {
      minLat = Math.min(minLat, bbox[0]);
      minLng = Math.min(minLng, bbox[1]);
      maxLat = Math.max(maxLat, bbox[2]);
      maxLng = Math.max(maxLng, bbox[3]);
    }

    minDensity = Math.min(minDensity, densityPerKm2);
    maxDensity = Math.max(maxDensity, densityPerKm2);

    output.push({
      wardName: (typeof feature.properties?.Ward_Name === "string" && feature.properties.Ward_Name) || (matched?.ward || "Unknown Ward"),
      wardNo: String(feature.properties?.Ward_No ?? matched?.wardNo ?? "NA"),
      totalPopulation,
      densityPerKm2,
      centroid,
      geometry: {
        type: geom.type,
        coordinates: geom.coordinates,
      },
    });
  }

  return {
    features: output,
    minDensity: Number.isFinite(minDensity) ? minDensity : 0,
    maxDensity,
    delhiBounds: [minLat, minLng, maxLat, maxLng],
  };
}

function estimatePopulationForRegion(
  centerLat: number,
  centerLng: number,
  regionPolygon: RegionPolygon | undefined,
  wardsGeoFeatures: GeoFeature[],
  rows: PopulationWard[],
): number {
  if (!wardsGeoFeatures.length || !rows.length) return 0;

  // Polygon selection: aggregate populations of ward centroids that lie inside selection.
  if (regionPolygon && regionPolygon.length >= 3) {
    let total = 0;
    for (const feature of wardsGeoFeatures) {
      const centroid = featureCentroid(feature);
      if (!centroid) continue;
      if (!pointInPolygon(centroid[0], centroid[1], regionPolygon)) continue;
      const pop = findPopulationForGeoFeature(feature, rows)?.totalPopulation || 0;
      total += pop;
    }
    if (total > 0) return total;
  }

  // Fallback: ward containing the center point.
  for (const feature of wardsGeoFeatures) {
    if (!isPointInsideGeoFeature(centerLat, centerLng, feature)) continue;
    const pop = findPopulationForGeoFeature(feature, rows)?.totalPopulation || 0;
    if (pop > 0) return pop;
  }

  return 0;
}

function isInRegion(
  centerLat: number,
  centerLng: number,
  lat: number,
  lng: number,
  regionPolygon?: RegionPolygon,
): boolean {
  if (regionPolygon && regionPolygon.length >= 3) {
    return pointInPolygon(lat, lng, regionPolygon);
  }
  return (
    lat >= centerLat - REGION_HALF_DELTA &&
    lat <= centerLat + REGION_HALF_DELTA &&
    lng >= centerLng - REGION_HALF_DELTA &&
    lng <= centerLng + REGION_HALF_DELTA
  );
}

function toKmLat(lat: number): number {
  return lat * 111.32;
}

function toKmLng(lng: number, atLat: number): number {
  return lng * 111.32 * Math.cos((atLat * Math.PI) / 180);
}

function bboxAreaKm2(minLat: number, minLng: number, maxLat: number, maxLng: number): number {
  const height = Math.max(0, toKmLat(maxLat) - toKmLat(minLat));
  const width = Math.max(0, toKmLng(maxLng, (minLat + maxLat) / 2) - toKmLng(minLng, (minLat + maxLat) / 2));
  return height * width;
}

function regionBounds(
  centerLat: number,
  centerLng: number,
  regionPolygon?: RegionPolygon,
): [number, number, number, number] {
  if (regionPolygon && regionPolygon.length >= 3) {
    return polygonBounds(regionPolygon);
  }

  return [
    centerLat - REGION_HALF_DELTA,
    centerLng - REGION_HALF_DELTA,
    centerLat + REGION_HALF_DELTA,
    centerLng + REGION_HALF_DELTA,
  ];
}

function ringAreaKm2(ring: [number, number][]): number {
  if (ring.length < 3) return 0;

  let area = 0;
  for (let i = 0; i < ring.length; i++) {
    const [lng1, lat1] = ring[i];
    const [lng2, lat2] = ring[(i + 1) % ring.length];
    const x1 = toKmLng(lng1, lat1);
    const y1 = toKmLat(lat1);
    const x2 = toKmLng(lng2, lat2);
    const y2 = toKmLat(lat2);
    area += x1 * y2 - x2 * y1;
  }

  return Math.abs(area) / 2;
}

function polygonAreaKm2(coords: [number, number][][]): number {
  if (!Array.isArray(coords) || !coords.length) return 0;
  const outer = ringAreaKm2(coords[0] || []);
  const holes = coords.slice(1).reduce((sum, ring) => sum + ringAreaKm2(ring || []), 0);
  return Math.max(0, outer - holes);
}

function featureBbox(feature: GeoFeature): [number, number, number, number] | null {
  const geom = feature.geometry;
  if (!geom || !geom.type || !geom.coordinates) return null;

  let points: [number, number][] = [];

  if (geom.type === "Point") {
    const [lng, lat] = geom.coordinates;
    points = [[lat, lng]];
  } else if (geom.type === "Polygon") {
    points = (geom.coordinates || []).flat().map(([lng, lat]: [number, number]) => [lat, lng]);
  } else if (geom.type === "MultiPolygon") {
    points = (geom.coordinates || []).flat(2).map(([lng, lat]: [number, number]) => [lat, lng]);
  }

  if (!points.length) return null;

  let minLat = Infinity;
  let minLng = Infinity;
  let maxLat = -Infinity;
  let maxLng = -Infinity;

  for (const [lat, lng] of points) {
    minLat = Math.min(minLat, lat);
    minLng = Math.min(minLng, lng);
    maxLat = Math.max(maxLat, lat);
    maxLng = Math.max(maxLng, lng);
  }

  return [minLat, minLng, maxLat, maxLng];
}

function bboxOverlapRatio(
  a: [number, number, number, number],
  b: [number, number, number, number],
): number {
  const minLat = Math.max(a[0], b[0]);
  const minLng = Math.max(a[1], b[1]);
  const maxLat = Math.min(a[2], b[2]);
  const maxLng = Math.min(a[3], b[3]);

  if (minLat >= maxLat || minLng >= maxLng) return 0;

  const overlap = bboxAreaKm2(minLat, minLng, maxLat, maxLng);
  const base = bboxAreaKm2(a[0], a[1], a[2], a[3]);
  if (!base) return 0;
  return clamp(overlap / base, 0, 1);
}

function featureCentroid(feature: GeoFeature): [number, number] | null {
  const geom = feature.geometry;
  if (!geom || !geom.type || !geom.coordinates) return null;

  if (geom.type === "Point") {
    const [lng, lat] = geom.coordinates;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return [lat, lng];
  }

  if (geom.type === "Polygon" && Array.isArray(geom.coordinates?.[0])) {
    const ring = geom.coordinates[0];
    if (!ring.length) return null;
    const sum = ring.reduce(
      (acc: [number, number], [lng, lat]: [number, number]) => [acc[0] + lat, acc[1] + lng],
      [0, 0],
    );
    return [sum[0] / ring.length, sum[1] / ring.length];
  }

  return null;
}

function clampToRegion(
  centerLat: number,
  centerLng: number,
  point: [number, number],
  regionPolygon?: RegionPolygon,
): [number, number] {
  if (regionPolygon && regionPolygon.length >= 3) {
    if (pointInPolygon(point[0], point[1], regionPolygon)) return point;
    return snapToPolygonBoundary(point, regionPolygon);
  }

  const minLat = centerLat - REGION_HALF_DELTA;
  const maxLat = centerLat + REGION_HALF_DELTA;
  const minLng = centerLng - REGION_HALF_DELTA;
  const maxLng = centerLng + REGION_HALF_DELTA;

  return [
    clamp(point[0], minLat, maxLat),
    clamp(point[1], minLng, maxLng),
  ];
}

function dedupePath(path: [number, number][]): [number, number][] {
  const out: [number, number][] = [];
  for (const p of path) {
    const last = out[out.length - 1];
    if (!last) {
      out.push(p);
      continue;
    }
    const dLat = p[0] - last[0];
    const dLng = p[1] - last[1];
    if (Math.sqrt(dLat * dLat + dLng * dLng) > 0.00008) {
      out.push(p);
    }
  }
  return out;
}

function simplifyToMaxPoints(path: [number, number][], maxPoints = 5): [number, number][] {
  if (path.length <= maxPoints) return path;

  const sampled: [number, number][] = [];
  for (let i = 0; i < maxPoints; i++) {
    const idx = Math.round((i * (path.length - 1)) / (maxPoints - 1));
    sampled.push(path[idx]);
  }
  return dedupePath(sampled);
}

function nearestTreePoint(point: [number, number], treePoints: [number, number][]): [number, number] | null {
  let best: [number, number] | null = null;
  let bestD2 = Infinity;

  for (const t of treePoints) {
    const dLat = point[0] - t[0];
    const dLng = point[1] - t[1];
    const d2 = dLat * dLat + dLng * dLng;
    if (d2 < bestD2) {
      bestD2 = d2;
      best = t;
    }
  }

  return best;
}

function pushPointAwayFromTrees(
  centerLat: number,
  centerLng: number,
  point: [number, number],
  obstaclePoints: [number, number][],
  regionPolygon?: RegionPolygon,
): [number, number] {
  let adjusted: [number, number] = point;
  const SAFE_DISTANCE = 0.00030;

  for (let i = 0; i < 3; i++) {
    const nearest = nearestTreePoint(adjusted, obstaclePoints);
    if (!nearest) break;

    const dLat = adjusted[0] - nearest[0];
    const dLng = adjusted[1] - nearest[1];
    const dist = Math.sqrt(dLat * dLat + dLng * dLng);

    if (dist >= SAFE_DISTANCE || dist === 0) {
      if (dist === 0) {
        adjusted = clampToRegion(centerLat, centerLng, [adjusted[0] + 0.00022, adjusted[1] - 0.00022], regionPolygon);
      }
      break;
    }

    const scale = (SAFE_DISTANCE - dist) / SAFE_DISTANCE;
    const nLat = adjusted[0] + (dLat / dist) * 0.00018 * scale;
    const nLng = adjusted[1] + (dLng / dist) * 0.00018 * scale;
    adjusted = clampToRegion(centerLat, centerLng, [nLat, nLng], regionPolygon);
  }

  return adjusted;
}

function buildSimpleRoadLikePath(
  centerLat: number,
  centerLng: number,
  inputPath: [number, number][],
  regionPolygon?: RegionPolygon,
): [number, number][] {
  const base = dedupePath(inputPath.map((p) => clampToRegion(centerLat, centerLng, p, regionPolygon)));

  const fallback: [number, number][] = [
    [centerLat + 0.0028, centerLng - 0.0025],
    [centerLat - 0.0028, centerLng + 0.0025],
  ];

  const start = (base[0] || fallback[0]) as [number, number];
  const end = (base[base.length - 1] || fallback[1]) as [number, number];
  const guide = (base[Math.floor(base.length / 2)] || [centerLat, centerLng]) as [number, number];

  const horizontalFirst = Math.abs(end[1] - start[1]) >= Math.abs(end[0] - start[0]);

  const bend1: [number, number] = horizontalFirst
    ? [start[0], guide[1]]
    : [guide[0], start[1]];

  const bend2: [number, number] = horizontalFirst
    ? [guide[0], end[1]]
    : [end[0], guide[1]];

  return dedupePath([
    clampToRegion(centerLat, centerLng, start, regionPolygon),
    clampToRegion(centerLat, centerLng, bend1, regionPolygon),
    clampToRegion(centerLat, centerLng, guide, regionPolygon),
    clampToRegion(centerLat, centerLng, bend2, regionPolygon),
    clampToRegion(centerLat, centerLng, end, regionPolygon),
  ]);
}

async function getTreePointsInRegion(
  centerLat: number,
  centerLng: number,
  regionPolygon?: RegionPolygon,
): Promise<[number, number][]> {
  try {
    treeDatasetPromise = getDataset("/data/tree_cover_vegetation.geojson", treeDatasetPromise);
    const treeData = await treeDatasetPromise;
    if (!Array.isArray(treeData?.features)) return [];

    return (treeData.features as GeoFeature[])
      .map((feature) => featureCentroid(feature))
      .filter((point): point is [number, number] => Boolean(point))
      .filter((point) => isInRegion(centerLat, centerLng, point[0], point[1], regionPolygon));
  } catch {
    return [];
  }
}

async function getSolarPointsInRegion(
  centerLat: number,
  centerLng: number,
  regionPolygon?: RegionPolygon,
): Promise<[number, number][]> {
  try {
    solarDatasetPromise = getDataset("/data/solarPanelsDATA.geojson", solarDatasetPromise);
    const solarData = await solarDatasetPromise;
    if (!Array.isArray(solarData?.features)) return [];

    return (solarData.features as GeoFeature[])
      .map((feature) => featureCentroid(feature))
      .filter((point): point is [number, number] => Boolean(point))
      .filter((point) => isInRegion(centerLat, centerLng, point[0], point[1], regionPolygon));
  } catch {
    return [];
  }
}

async function buildConstrainedCorridorPath(
  centerLat: number,
  centerLng: number,
  rawPath: [number, number][],
  regionPolygon?: RegionPolygon,
): Promise<[number, number][]> {
  const roadLike = buildSimpleRoadLikePath(centerLat, centerLng, rawPath, regionPolygon);
  const [treePoints, solarPoints] = await Promise.all([
    getTreePointsInRegion(centerLat, centerLng, regionPolygon),
    getSolarPointsInRegion(centerLat, centerLng, regionPolygon),
  ]);

  // Use trees + solar-feature centroids as simple no-go obstacle proxies (parks + rooftops/buildings).
  const obstaclePoints = [...treePoints, ...solarPoints];

  const safe = roadLike.map((point, idx) => {
    if (idx === 0 || idx === roadLike.length - 1) {
      return clampToRegion(centerLat, centerLng, point, regionPolygon);
    }
    return pushPointAwayFromTrees(centerLat, centerLng, point, obstaclePoints, regionPolygon);
  });

  return simplifyToMaxPoints(
    dedupePath(safe.map((p) => clampToRegion(centerLat, centerLng, p, regionPolygon))),
    5,
  );
}

function getBestLocalityName(feature: GeoFeature): string | null {
  const p = feature.properties || {};
  const candidates = [
    p["addr:suburb"],
    p["addr:district"],
    p["addr:city"],
    p["name"],
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }

  return null;
}

function pickRegionName(
  centerLat: number,
  centerLng: number,
  dataSets: any[],
  regionPolygon?: RegionPolygon,
): string {
  const labelsInRegion: string[] = [];

  for (const data of dataSets) {
    if (!Array.isArray(data?.features)) continue;

    for (const feature of data.features as GeoFeature[]) {
      const centroid = featureCentroid(feature);
      if (!centroid) continue;
      if (!isInRegion(centerLat, centerLng, centroid[0], centroid[1], regionPolygon)) continue;

      const label = getBestLocalityName(feature);
      if (label) labelsInRegion.push(label);
    }
  }

  if (labelsInRegion.length) {
    labelsInRegion.sort((a, b) => a.length - b.length);
    return labelsInRegion[0];
  }

  // Fallback to nearest named place if no feature centroid lies inside region.
  let nearest: { name: string; d2: number } | null = null;
  for (const data of dataSets) {
    if (!Array.isArray(data?.features)) continue;
    for (const feature of data.features as GeoFeature[]) {
      const label = getBestLocalityName(feature);
      const centroid = featureCentroid(feature);
      if (!label || !centroid) continue;
      const dLat = centroid[0] - centerLat;
      const dLng = centroid[1] - centerLng;
      const d2 = dLat * dLat + dLng * dLng;
      if (!nearest || d2 < nearest.d2) {
        nearest = { name: label, d2 };
      }
    }
  }

  if (nearest && nearest.d2 < 0.0016) {
    return nearest.name;
  }

  const raw = Math.abs(Math.round((centerLat * 1000 + centerLng * 1000) % 60));
  return `Sector ${raw + 1}`;
}

function countFeaturesInRegion(
  data: any,
  centerLat: number,
  centerLng: number,
  regionPolygon?: RegionPolygon,
): number {
  if (!Array.isArray(data?.features)) return 0;

  return data.features.reduce((count: number, feature: GeoFeature) => {
    const centroid = featureCentroid(feature);
    if (!centroid) return count;
    return isInRegion(centerLat, centerLng, centroid[0], centroid[1], regionPolygon) ? count + 1 : count;
  }, 0);
}

function estimateGreenCoverKm2(
  data: any,
  centerLat: number,
  centerLng: number,
  regionPolygon?: RegionPolygon,
): number {
  if (!Array.isArray(data?.features)) return 0;

  const regionBox = regionBounds(centerLat, centerLng, regionPolygon);
  let total = 0;

  for (const feature of data.features as GeoFeature[]) {
    const geom = feature.geometry;
    if (!geom || !geom.type || !geom.coordinates) continue;

    if (geom.type === "Point") {
      const [lng, lat] = geom.coordinates;
      if (isInRegion(centerLat, centerLng, lat, lng, regionPolygon)) {
        total += 0.00002;
      }
      continue;
    }

    const bbox = featureBbox(feature);
    if (!bbox) continue;
    const overlap = bboxOverlapRatio(bbox, regionBox);
    if (overlap <= 0) continue;

    if (geom.type === "Polygon") {
      total += polygonAreaKm2(geom.coordinates as [number, number][][]) * overlap;
    } else if (geom.type === "MultiPolygon") {
      const polyAreas = (geom.coordinates as [number, number][][][])
        .reduce((sum, poly) => sum + polygonAreaKm2(poly), 0);
      total += polyAreas * overlap;
    }
  }

  return total;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export async function analyzeRegionData(
  centerLat: number,
  centerLng: number,
  regionPolygon?: RegionPolygon,
): Promise<RegionMetrics> {
  try {
    treeDatasetPromise = getDataset("/data/tree_cover_vegetation.geojson", treeDatasetPromise);
    evDatasetPromise = getDataset("/data/ev_charging_stations.geojson", evDatasetPromise);
    solarDatasetPromise = getDataset("/data/solarPanelsDATA.geojson", solarDatasetPromise);
    delhiWardsGeoPromise = getDataset("/data/Delhi_Wards.geojson", delhiWardsGeoPromise);

    const [treeData, evData, solarData, populationRows, wardsGeo] = await Promise.all([
      treeDatasetPromise,
      evDatasetPromise,
      solarDatasetPromise,
      getPopulationDataset(),
      delhiWardsGeoPromise,
    ]);

    const trees = countFeaturesInRegion(treeData, centerLat, centerLng, regionPolygon);
    const ev = countFeaturesInRegion(evData, centerLat, centerLng, regionPolygon);
    const solar = countFeaturesInRegion(solarData, centerLat, centerLng, regionPolygon);

    const regionAreaKm2 = regionPolygon && regionPolygon.length >= 3
      ? Math.max(0.02, ringAreaKm2(regionPolygon.map(([lat, lng]) => [lng, lat])))
      : REGION_AREA_KM2;
    const greenCoverKm2 = estimateGreenCoverKm2(treeData, centerLat, centerLng, regionPolygon);
    const greenCoverPct = clamp((greenCoverKm2 / regionAreaKm2) * 100, 0, 100);
    const treeEquivalent = Math.round(trees + greenCoverKm2 * 300);

    const greenness = greenCoverPct * 0.7 + solar * 2.5 + ev;
    const pressure = Math.max(0, 40 - (greenCoverPct * 0.5 + solar));

    const greenScore = clamp(Math.round(12 + greenness * 1.2), 12, 98);
    const heatScore = clamp(Math.round(90 - greenCoverPct * 0.75 - solar * 1.1 + pressure * 0.25), 24, 96);

    const resolvedName = pickRegionName(centerLat, centerLng, [treeData, evData, solarData], regionPolygon);
    const wardFeatures = Array.isArray(wardsGeo?.features) ? wardsGeo.features as GeoFeature[] : [];
    const population = estimatePopulationForRegion(centerLat, centerLng, regionPolygon, wardFeatures, populationRows);
    const scPopulation = 0;
    const density = population > 0 ? population / Math.max(regionAreaKm2, 0.02) : 0;
    const densityPressure = clamp(Math.round(density / 3000), 0, 12);

    const adjustedHeat = clamp(heatScore + Math.round(densityPressure * 0.5), 24, 98);
    const adjustedGreen = clamp(greenScore - Math.round(densityPressure * 0.2), 10, 98);

    return {
      name: resolvedName,
      heatScore: adjustedHeat,
      greenScore: adjustedGreen,
      stats: {
        trees: treeEquivalent,
        ev,
        solar,
        population,
        scPopulation,
        area: `${regionAreaKm2.toFixed(2)} km2`,
      },
    };
  } catch {
    const raw = Math.abs(Math.round((centerLat * 1000 + centerLng * 1000) % 60));
    return {
      name: `Sector ${raw + 1}`,
      heatScore: 70,
      greenScore: 35,
      stats: {
        trees: 0,
        ev: 0,
        solar: 0,
        population: 0,
        scPopulation: 0,
        area: `${(regionPolygon && regionPolygon.length >= 3 ? Math.max(0.02, ringAreaKm2(regionPolygon.map(([lat, lng]) => [lng, lat]))) : REGION_AREA_KM2).toFixed(2)} km2`,
      },
    };
  }
}

export async function suggestCityGreenCorridors(): Promise<CityGreenCorridorResponse> {
  try {
    treeDatasetPromise = getDataset("/data/tree_cover_vegetation.geojson", treeDatasetPromise);
    evDatasetPromise = getDataset("/data/ev_charging_stations.geojson", evDatasetPromise);
    solarDatasetPromise = getDataset("/data/solarPanelsDATA.geojson", solarDatasetPromise);

    const [treeData, evData, solarData] = await Promise.all([
      treeDatasetPromise,
      evDatasetPromise,
      solarDatasetPromise,
    ]);

    const points: [number, number][] = [];
    [treeData, evData, solarData].forEach((data) => {
      if (!Array.isArray(data?.features)) return;
      (data.features as GeoFeature[]).forEach((feature) => {
        const c = featureCentroid(feature);
        if (c) points.push(c);
      });
    });

    if (points.length < 2) {
      return {
        success: false,
        corridors: [],
        citySummary: "Insufficient data points for city-wide corridor suggestions.",
        error: "Not enough geospatial points.",
      };
    }

    const minLat = Math.min(...points.map((p) => p[0]));
    const maxLat = Math.max(...points.map((p) => p[0]));
    const minLng = Math.min(...points.map((p) => p[1]));
    const maxLng = Math.max(...points.map((p) => p[1]));

    const latStep = (maxLat - minLat) / 5;
    const lngStep = (maxLng - minLng) / 5;

    const corridors: CityGreenCorridor[] = [
      {
        id: "city-corridor-1",
        path: [[minLat + latStep, minLng], [minLat + latStep, maxLng]],
        corridorType: "East-West Green Spine",
        priority: "High",
        reasoning: "Connects dense east-west urban stretch with continuous shade corridor.",
        zones: ["West", "Central", "East"],
      },
      {
        id: "city-corridor-2",
        path: [[minLat + latStep * 3, minLng], [minLat + latStep * 3, maxLng]],
        corridorType: "East-West Green Spine",
        priority: "Medium",
        reasoning: "Secondary east-west link supporting micro-climate continuity.",
        zones: ["West", "Central", "East"],
      },
      {
        id: "city-corridor-3",
        path: [[minLat, minLng + lngStep], [maxLat, minLng + lngStep]],
        corridorType: "North-South Green Spine",
        priority: "High",
        reasoning: "Strong north-south linkage for mobility and ecological flow.",
        zones: ["North", "Central", "South"],
      },
      {
        id: "city-corridor-4",
        path: [[minLat, minLng + lngStep * 3], [maxLat, minLng + lngStep * 3]],
        corridorType: "North-South Green Spine",
        priority: "Medium",
        reasoning: "Secondary north-south support corridor for neighborhood connectivity.",
        zones: ["North", "Central", "South"],
      },
      {
        id: "city-corridor-5",
        path: [[minLat + latStep, minLng + lngStep], [minLat + latStep * 2, minLng + lngStep], [minLat + latStep * 2, minLng + lngStep * 2]],
        corridorType: "Connector Corridor",
        priority: "Low",
        reasoning: "Simple L-shaped connector between major corridor spines.",
        zones: ["Inner Central"],
      },
      {
        id: "city-corridor-6",
        path: [[minLat + latStep * 3, minLng + lngStep * 3], [minLat + latStep * 4, minLng + lngStep * 3], [minLat + latStep * 4, minLng + lngStep * 4]],
        corridorType: "Connector Corridor",
        priority: "Low",
        reasoning: "Local connector to complete city-scale green network continuity.",
        zones: ["Inner South-East"],
      },
    ];

    return {
      success: true,
      corridors,
      citySummary: `Generated ${corridors.length} city-wide corridors from available urban datasets.`,
    };
  } catch (error) {
    return {
      success: false,
      corridors: [],
      citySummary: "Failed to generate city-wide corridors.",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

const IMAGE_GENERATION_MODELS = [
  "gemini-2.5-flash-image",
  "gemini-3.1-flash-image-preview",
  "gemini-3-pro-image-preview",
];

function formatGeminiError(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);

  if (raw.includes("RESOURCE_EXHAUSTED") || raw.includes("Quota exceeded")) {
    return "Image generation quota is exhausted or not enabled for this key. Enable Gemini paid billing/quota for image models in AI Studio and try again.";
  }

  if (raw.includes("NOT_FOUND") || raw.includes("not found for API version")) {
    return "The configured image model is not available for this API key/account.";
  }

  return raw;
}

/**
 * Analyze region and suggest optimal green corridor placement
 */
export async function analyzeRegionForGreenCorridor(
  centerLat: number,
  centerLng: number,
  activeLayers: string[],
  regionData: any,
  regionPolygon?: RegionPolygon,
): Promise<GreenCorridorSuggestion> {
  try {
    const client = ensureClient();

    const [minLat, minLng, maxLat, maxLng] = regionBounds(centerLat, centerLng, regionPolygon);
    const polygonHint = regionPolygon && regionPolygon.length >= 3
      ? `\nSelected polygon vertices (lat,lng): ${JSON.stringify(regionPolygon)}`
      : "";

    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Given urban data, suggest a green corridor plan in strict JSON format.
Center: ${centerLat}, ${centerLng}
Active layers: ${JSON.stringify(activeLayers)}
Region data summary: ${JSON.stringify(regionData).slice(0, 5000)}
${polygonHint}

Constraints:
- Keep every path coordinate strictly within bounds: lat [${minLat}, ${maxLat}], lng [${minLng}, ${maxLng}]
- If polygon vertices are provided, keep all path points inside that polygon boundary
- Avoid dense tree-cover patches and route beside them, not through them
- Avoid built-up footprints/rooftop zones; do not pass through likely buildings
- Prefer simple street-aligned paths with only 3 to 5 total points and clear bends

Return JSON with keys: corridorPath (array of [lat,lng], 4 points), corridorType (string), reasoning (string), features (string[] up to 5).`,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text?.trim();
    if (!text) throw new Error("Empty AI response for corridor analysis.");

    const parsed = JSON.parse(text) as {
      corridorPath?: [number, number][];
      corridorType?: string;
      reasoning?: string;
      features?: string[];
    };

    const fallbackPath: [number, number][] = [
      [centerLat + 0.003, centerLng - 0.003],
      [centerLat + 0.001, centerLng - 0.001],
      [centerLat, centerLng],
      [centerLat - 0.002, centerLng + 0.002],
    ];

    const rawPath =
      parsed.corridorPath && parsed.corridorPath.length >= 2
        ? parsed.corridorPath
        : fallbackPath;

    const safePath = await buildConstrainedCorridorPath(centerLat, centerLng, rawPath, regionPolygon);

    return {
      success: true,
      corridorPath: safePath,
      corridorType: parsed.corridorType || "adaptive green corridor",
      reasoning:
        parsed.reasoning ||
        "AI suggests this route to maximize shade connectivity and ecological continuity.",
      features:
        parsed.features && parsed.features.length > 0
          ? parsed.features
          : [
              "Shade trees",
              "Permeable pathways",
              "Native shrubs",
              "Bike lanes",
              "Solar lighting",
            ],
    };
  } catch (error) {
    const fallbackPath: [number, number][] = [
      [centerLat + 0.003, centerLng - 0.0025],
      [centerLat + 0.001, centerLng - 0.0005],
      [centerLat - 0.001, centerLng + 0.001],
      [centerLat - 0.003, centerLng + 0.0025],
    ];

    const safeFallback = await buildConstrainedCorridorPath(centerLat, centerLng, fallbackPath, regionPolygon);

    return {
      success: true,
      corridorPath: safeFallback,
      corridorType: "resilient fallback corridor",
      reasoning: "Generated a constrained fallback route aligned to region bounds and local canopy constraints.",
      features: ["Bounded path", "Tree-overlap reduction", "Street-like segmented turns"],
      error:
        error instanceof Error
          ? error.message
          : "Failed to analyze green corridor.",
    };
  }
}

/**
 * Generate image and get both the image and analysis text using Gemini
 */
export async function generateImageWithDetails(
  file: File,
  prompt: string
): Promise<GenerateImageResponse> {
  const originalImageUrl = URL.createObjectURL(file);

  try {
    const client = ensureClient();
    const fileBase64 = await fileToBase64(file);
    const mimeType = file.type || "image/jpeg";

    let generatedImagePart:
      | { inlineData?: { data?: string; mimeType?: string } }
      | undefined;
    let textParts: string[] = [];
    let lastError: unknown;

    for (const model of IMAGE_GENERATION_MODELS) {
      try {
        const response = await client.models.generateContent({
          model,
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `Transform this uploaded urban street photo using the instructions below while preserving road perspective and major structures:\n${prompt}\n\nAlso include a concise analysis of key sustainability improvements.`,
                },
                {
                  inlineData: {
                    data: fileBase64,
                    mimeType,
                  },
                },
              ],
            },
          ],
          config: {
            responseModalities: ["TEXT", "IMAGE"],
          },
        });

        const parts = response.candidates?.[0]?.content?.parts || [];
        generatedImagePart = parts.find((part) => part.inlineData?.data) as
          | { inlineData?: { data?: string; mimeType?: string } }
          | undefined;
        textParts = parts
          .map((part) => part.text)
          .filter((t): t is string => Boolean(t));

        if (generatedImagePart?.inlineData?.data) {
          break;
        }
      } catch (error) {
        lastError = error;
      }
    }

    if (!generatedImagePart?.inlineData?.data) {
      throw new Error(
        lastError instanceof Error
          ? lastError.message
          : "Gemini did not return an image. Ensure your key has image-generation access.",
      );
    }

    const generatedMime = generatedImagePart.inlineData.mimeType || "image/png";
    const generatedImageUrl = toDataUrl(
      generatedMime,
      generatedImagePart.inlineData.data,
    );

    const analysis =
      textParts.join("\n").trim() ||
      "AI transformation completed successfully.";

    return {
      success: true,
      prompt,
      analysis,
      generated_image_url: generatedImageUrl,
      original_image: originalImageUrl,
    };
  } catch (error) {
    return {
      success: false,
      prompt,
      analysis: "",
      generated_image_url: originalImageUrl,
      original_image: originalImageUrl,
      error: formatGeminiError(error),
    };
  }
}

/**
 * Analyze an image using Gemini Vision
 */
export async function analyzeImage(
  file: File,
  prompt: string
): Promise<AnalyzeImageResponse> {
  try {
    const client = ensureClient();
    const fileBase64 = await fileToBase64(file);
    const mimeType = file.type || "image/jpeg";

    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                data: fileBase64,
                mimeType,
              },
            },
          ],
        },
      ],
    });

    return {
      success: true,
      prompt,
      analysis:
        response.text?.trim() ||
        "Image analyzed, but no textual analysis was returned.",
    };
  } catch (error) {
    return {
      success: false,
      prompt,
      analysis: "",
      error:
        error instanceof Error ? error.message : "Failed to analyze image.",
    };
  }
}
