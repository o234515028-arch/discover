export type TrackPoint = { lat: number; lng: number; t: number };
export type WalkRoute = {
  id: string;
  name: string;
  mode: 'manual' | 'gps';
  points: TrackPoint[];
  duration: number;
  created: string;
};
export function distance(a: TrackPoint, b: TrackPoint) {
  const r = Math.PI / 180,
    dlat = (b.lat - a.lat) * r,
    dlng = (b.lng - a.lng) * r;
  const h =
    Math.sin(dlat / 2) ** 2 +
    Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dlng / 2) ** 2;
  return 6371000 * 2 * Math.asin(Math.min(1, Math.sqrt(h)));
}
export function totalDistance(points: TrackPoint[]) {
  return points.reduce(
    (sum, p, i) => sum + (i ? distance(points[i - 1], p) : 0),
    0,
  );
}
export function validRoute(v: unknown): v is WalkRoute {
  if (!v || typeof v !== 'object') return false;
  const r = v as WalkRoute;
  return (
    typeof r.id === 'string' &&
    typeof r.name === 'string' &&
    r.name.length <= 80 &&
    (r.mode === 'manual' || r.mode === 'gps') &&
    Number.isFinite(r.duration) &&
    r.duration >= 0 &&
    typeof r.created === 'string' &&
    Array.isArray(r.points) &&
    r.points.length <= 10000 &&
    r.points.every(
      (p) =>
        Number.isFinite(p.lat) &&
        Math.abs(p.lat) <= 90 &&
        Number.isFinite(p.lng) &&
        Math.abs(p.lng) <= 180 &&
        Number.isFinite(p.t) &&
        p.t >= 0 &&
        p.t <= 8640000000000000,
    )
  );
}
export function acceptGPS(
  points: TrackPoint[],
  point: TrackPoint,
  accuracy: number,
) {
  if (
    !Number.isFinite(point.lat) ||
    Math.abs(point.lat) > 90 ||
    !Number.isFinite(point.lng) ||
    Math.abs(point.lng) > 180 ||
    !Number.isFinite(point.t) ||
    point.t < 0
  )
    return false;
  if (!Number.isFinite(accuracy) || accuracy > 60 || accuracy < 0) return false;
  if (!points.length) return true;
  const prev = points[points.length - 1],
    seconds = (point.t - prev.t) / 1000,
    meters = distance(prev, point);
  return seconds > 0 && meters >= 5 && meters / seconds <= 8;
}
const escapeXML = (s: string) =>
  s.replace(
    /[<>&"']/g,
    (c) =>
      ({
        '<': '&lt;',
        '>': '&gt;',
        '&': '&amp;',
        '"': '&quot;',
        "'": '&apos;',
      })[c]!,
  );
export function toGPX(route: WalkRoute) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<gpx version="1.1" creator="discover." xmlns="http://www.topografix.com/GPX/1/1"><trk><name>${escapeXML(route.name)}</name><trkseg>${route.points.map((p) => `<trkpt lat="${p.lat}" lon="${p.lng}">${route.mode === 'gps' ? `<time>${new Date(p.t).toISOString()}</time>` : ''}</trkpt>`).join('')}</trkseg></trk></gpx>`;
}
