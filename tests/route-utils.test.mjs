import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  distance,
  totalDistance,
  acceptGPS,
  validRoute,
  toGPX,
} from '../app/route-utils.ts';
const a = { lat: 10.666, lng: 103.2727, t: 1000 },
  b = { lat: 10.6661, lng: 103.2727, t: 11000 };
const route = {
  id: 'test',
  name: 'Koh Rong <rota> & yürüyüş',
  mode: 'gps',
  points: [a, b],
  duration: 10,
  created: '2026-09-05',
};
test('distance uses metres and accumulates a known approximately 11m segment', () => {
  assert.ok(distance(a, b) > 11 && distance(a, b) < 11.2);
  assert.equal(totalDistance([]), 0);
  assert.equal(totalDistance([a]), 0);
  assert.equal(totalDistance([a, b, a]), 2 * distance(a, b));
});
test('GPS admits walking fixes but rejects poor accuracy, jitter, stale timestamps and implausible jumps', () => {
  assert.equal(acceptGPS([], a, 20), true);
  assert.equal(acceptGPS([], a, 100), false);
  assert.equal(acceptGPS([a], b, 20), true);
  assert.equal(acceptGPS([a], { ...a, t: 11000 }, 20), false);
  assert.equal(acceptGPS([a], { ...b, t: 500 }, 20), false);
  assert.equal(acceptGPS([a], { ...b, lat: 41 }, 20), false);
  assert.equal(acceptGPS([], { ...a, lat: NaN }, 20), false);
});
test('persisted route validation rejects malformed coordinate and excessive payloads', () => {
  assert.equal(validRoute(route), true);
  assert.equal(validRoute({ ...route, points: [{ ...a, lat: 100 }] }), false);
  assert.equal(
    validRoute({ ...route, points: [{ ...a, t: Infinity }] }),
    false,
  );
  assert.equal(validRoute({ ...route, duration: -1 }), false);
  assert.equal(validRoute({ ...route, points: Array(10001).fill(a) }), false);
});
test('GPX contains portable coordinates, escapes names and omits invented timestamps for manual plans', () => {
  const xml = toGPX(route);
  assert.ok(xml.includes('Koh Rong &lt;rota&gt; &amp; yürüyüş'));
  assert.ok(xml.includes('lat="10.666" lon="103.2727"'));
  assert.ok(xml.includes('<time>'));
  assert.ok(!toGPX({ ...route, mode: 'manual' }).includes('<time>'));
});
