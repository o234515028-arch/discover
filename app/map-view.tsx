'use client';
import { useEffect, useRef, useState } from 'react';
import type * as Leaflet from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LocateFixed, Plus, Minus } from 'lucide-react';
import type { TrackPoint } from './route-utils';
import { categories, region, type Place } from './places';
import { isInsideKohRong, kohRongBoundary } from './koh-rong-boundary';

const worldBoundary: [number, number][] = [
  [-85, -180],
  [-85, 180],
  [85, 180],
  [85, -180],
  [-85, -180],
];

function applyIslandLimit(map: Leaflet.Map, reset = false) {
  map.invalidateSize({ animate: false, pan: false });
  map.setMinZoom(0);
  const minimumZoom = Math.max(11, map.getBoundsZoom(region.bounds));
  map.setMaxBounds(region.bounds);
  map.setMinZoom(minimumZoom);
  if (reset || map.getZoom() < minimumZoom) {
    map.setView(region.center, minimumZoom, { animate: false });
  } else {
    map.panInsideBounds(region.bounds, { animate: false });
  }
}

// Provider adapter: other application components use provider-independent Place coordinates.
export default function MapView({
  places,
  onSelect,
  userLocation,
  routePoints = [],
  drawing = false,
  onRoutePoint,
  focusLocation = 0,
  focusRoute = 0,
}: {
  places: Place[];
  onSelect: (p: Place) => void;
  userLocation?: { lat: number; lng: number; accuracy: number } | null;
  routePoints?: TrackPoint[];
  drawing?: boolean;
  onRoutePoint?: (lat: number, lng: number) => void;
  focusLocation?: number;
  focusRoute?: number;
}) {
  const routeLayer = useRef<Leaflet.LayerGroup | null>(null),
    locationLayer = useRef<Leaflet.LayerGroup | null>(null),
    drawRef = useRef(drawing),
    clickRef = useRef(onRoutePoint),
    appliedLocationFocus = useRef(0),
    appliedRouteFocus = useRef(0);
  drawRef.current = drawing;
  clickRef.current = onRoutePoint;
  const container = useRef<HTMLDivElement>(null),
    map = useRef<Leaflet.Map | null>(null),
    lib = useRef<typeof Leaflet | null>(null),
    layer = useRef<Leaflet.LayerGroup | null>(null);
  const [loaded, setLoaded] = useState(false),
    [error, setError] = useState(false);
  useEffect(() => {
    let disposed = false;
    let observer: ResizeObserver | undefined;
    let resizeFrame = 0;
    import('leaflet')
      .then((L) => {
        if (disposed || !container.current) return;
        lib.current = L;
        const m = L.map(container.current, {
          zoomControl: false,
          minZoom: 0,
          maxZoom: 18,
          maxBounds: region.bounds,
          maxBoundsViscosity: 1,
        }).setView(region.center, region.zoom);
        map.current = m;
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        })
          .on('tileerror', () => setError(true))
          .on('tileload', () => setError(false))
          .addTo(m);
        const maskPane = m.createPane('island-mask');
        maskPane.style.zIndex = '350';
        maskPane.style.pointerEvents = 'none';
        L.polygon([worldBoundary, kohRongBoundary], {
          pane: 'island-mask',
          stroke: false,
          fillColor: '#aad3df',
          fillOpacity: 1,
          fillRule: 'evenodd',
          interactive: false,
        }).addTo(m);
        layer.current = L.layerGroup().addTo(m);
        routeLayer.current = L.layerGroup().addTo(m);
        locationLayer.current = L.layerGroup().addTo(m);
        m.on('click', (e: Leaflet.LeafletMouseEvent) => {
          if (drawRef.current && isInsideKohRong(e.latlng.lat, e.latlng.lng))
            clickRef.current?.(e.latlng.lat, e.latlng.lng);
        });
        applyIslandLimit(m, true);
        setLoaded(true);
        observer = new ResizeObserver(() => {
          cancelAnimationFrame(resizeFrame);
          resizeFrame = requestAnimationFrame(() => applyIslandLimit(m));
        });
        observer.observe(container.current);
      })
      .catch(() => setError(true));
    return () => {
      disposed = true;
      cancelAnimationFrame(resizeFrame);
      observer?.disconnect();
      map.current?.remove();
      map.current = null;
    };
  }, []);
  useEffect(() => {
    if (!loaded || !lib.current || !layer.current) return;
    const L = lib.current;
    layer.current.clearLayers();
    for (const p of drawing ? [] : places) {
      if (!isInsideKohRong(p.lat, p.lng)) continue;
      const c = categories.find((c) => c.id === p.category)!;
      const node = document.createElement('div');
      node.className = 'map-pin';
      node.style.setProperty('--pin-color', c.color);
      const symbol = document.createElement('span');
      symbol.className = 'pin-symbol';
      symbol.textContent = (
        { food: '☕', party: '♫', taxi: 'T', walk: '↟', fun: '✦' } as Record<
          string,
          string
        >
      )[p.category];
      const label = document.createElement('strong');
      label.textContent = p.name;
      node.appendChild(symbol);
      node.appendChild(label);
      L.marker([p.lat, p.lng], {
        icon: L.divIcon({
          html: node,
          className: 'custom-marker',
          iconSize: [150, 44],
          iconAnchor: [20, 44],
        }),
        title: p.name,
        keyboard: true,
      })
        .on('click', () => onSelect(p))
        .addTo(layer.current);
      if (p.id === '4')
        L.polyline(
          [
            [10.6660696, 103.272748],
            [10.6693, 103.2758],
            [10.6739, 103.2775],
            [10.67973, 103.2817709],
          ],
          { color: '#33855e', weight: 5, dashArray: '7 8' },
        ).addTo(layer.current);
    }
  }, [loaded, places, onSelect, drawing]);
  useEffect(() => {
    if (!loaded || !lib.current || !locationLayer.current) return;
    const L = lib.current;
    locationLayer.current.clearLayers();
    if (userLocation && isInsideKohRong(userLocation.lat, userLocation.lng)) {
      const pos: [number, number] = [userLocation.lat, userLocation.lng];
      L.circle(pos, {
        radius: userLocation.accuracy,
        color: '#267bf0',
        weight: 1,
        fillOpacity: 0.1,
        interactive: false,
      }).addTo(locationLayer.current);
      L.circleMarker(pos, {
        radius: 9,
        color: '#fff',
        weight: 3,
        fillColor: '#267bf0',
        fillOpacity: 1,
      })
        .bindTooltip('Konumun', { permanent: false })
        .addTo(locationLayer.current);
    }
  }, [loaded, userLocation]);
  useEffect(() => {
    if (!loaded || !lib.current || !routeLayer.current) return;
    const L = lib.current;
    routeLayer.current.clearLayers();
    const visibleRoutePoints = routePoints.filter((p) =>
      isInsideKohRong(p.lat, p.lng),
    );
    if (visibleRoutePoints.length) {
      L.polyline(
        visibleRoutePoints.map((p) => [p.lat, p.lng] as [number, number]),
        { color: '#286ddd', weight: 5, interactive: false },
      ).addTo(routeLayer.current);
      const ends = drawing
        ? visibleRoutePoints
        : [
            visibleRoutePoints[0],
            visibleRoutePoints[visibleRoutePoints.length - 1],
          ];
      for (const p of ends)
        L.circleMarker([p.lat, p.lng], {
          radius: 5,
          color: '#fff',
          weight: 2,
          fillColor: '#286ddd',
          fillOpacity: 1,
          interactive: false,
        }).addTo(routeLayer.current);
    }
    map.current?.getContainer().classList.toggle('route-drawing', drawing);
  }, [loaded, routePoints, drawing]);
  useEffect(() => {
    if (!loaded || !map.current || !userLocation || !focusLocation) return;
    if (appliedLocationFocus.current === focusLocation) return;
    appliedLocationFocus.current = focusLocation;
    if (!isInsideKohRong(userLocation.lat, userLocation.lng)) return;
    applyIslandLimit(map.current);
    map.current.setView(
      [userLocation.lat, userLocation.lng],
      Math.max(16, map.current.getMinZoom()),
    );
  }, [loaded, focusLocation, userLocation]);
  useEffect(() => {
    if (!loaded || !map.current || !routePoints.length || !focusRoute) return;
    if (appliedRouteFocus.current === focusRoute) return;
    appliedRouteFocus.current = focusRoute;
    const visibleRoutePoints = routePoints.filter((p) =>
      isInsideKohRong(p.lat, p.lng),
    );
    if (!visibleRoutePoints.length) return;
    applyIslandLimit(map.current);
    map.current.fitBounds(
      visibleRoutePoints.map((p) => [p.lat, p.lng] as [number, number]),
      { paddingTopLeft: [40, 80], paddingBottomRight: [60, 200], maxZoom: 16 },
    );
  }, [loaded, focusRoute, routePoints]);
  return (
    <>
      <div ref={container} className="leaflet-surface" />
      {error && (
        <div className="map-error" role="status">
          Harita yüklenemedi. Bağlantını kontrol et; yer listesi kullanılabilir.
        </div>
      )}
      <div className="map-controls">
        <button aria-label="Yakınlaştır" onClick={() => map.current?.zoomIn()}>
          <Plus size={20} />
        </button>
        <button aria-label="Uzaklaştır" onClick={() => map.current?.zoomOut()}>
          <Minus size={20} />
        </button>
        <button
          aria-label="Koh Rong adasına dön"
          onClick={() => map.current && applyIslandLimit(map.current, true)}
        >
          <LocateFixed size={20} />
        </button>
      </div>
    </>
  );
}
