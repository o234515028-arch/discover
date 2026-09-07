'use client';
import { useEffect, useRef, useState } from 'react';
import {
  LocateFixed,
  Footprints,
  PenLine,
  Play,
  Square,
  Undo2,
  Save,
  Share2,
  Download,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import MapView from './map-view';
import type { Place } from './places';
import {
  acceptGPS,
  totalDistance,
  toGPX,
  validRoute,
  type TrackPoint,
  type WalkRoute,
} from './route-utils';
const STORAGE = 'koh-rong-walks-v1';
export default function WalkMap(props: {
  places: Place[];
  onSelect: (p: Place) => void;
}) {
  const [expanded, setExpanded] = useState(false),
    [mode, setMode] = useState<'idle' | 'manual' | 'gps'>('idle'),
    [points, setPoints] = useState<TrackPoint[]>([]),
    [routes, setRoutes] = useState<WalkRoute[]>([]),
    [name, setName] = useState('Yürüyüşüm'),
    [kind, setKind] = useState<'manual' | 'gps'>('manual'),
    [location, setLocation] = useState<{
      lat: number;
      lng: number;
      accuracy: number;
    } | null>(null),
    [tracking, setTracking] = useState(false),
    [status, setStatus] = useState(''),
    [seconds, setSeconds] = useState(0),
    [focus, setFocus] = useState(0),
    [routeFocus, setRouteFocus] = useState(0),
    [ready, setReady] = useState(false),
    [discard, setDiscard] = useState(false),
    [savedId, setSavedId] = useState<string | null>(null);
  const watch = useRef<number | null>(null),
    modeRef = useRef(mode),
    pointsRef = useRef(points),
    started = useRef(0),
    durationBase = useRef(0),
    generation = useRef(0);
  modeRef.current = mode;
  pointsRef.current = points;
  const stopWatch = () => {
    generation.current++;
    if (watch.current !== null) {
      navigator.geolocation.clearWatch(watch.current);
      watch.current = null;
    }
    setTracking(false);
  };
  const stopRecording = (
    message = 'Yürüyüş durduruldu. Rotanı kaydedebilirsin.',
  ) => {
    stopWatch();
    if (modeRef.current === 'gps') {
      const elapsed =
        Math.floor((Date.now() - started.current) / 1000) +
        durationBase.current;
      setSeconds(elapsed);
      modeRef.current = 'idle';
      setMode('idle');
      setStatus(message);
    }
  };
  useEffect(() => {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE) || '{}');
      if (Array.isArray(data.routes)) setRoutes(data.routes.filter(validRoute));
      if (validRoute(data.draft) && data.draft.points.length) {
        setPoints(data.draft.points);
        setRouteFocus(1);
        setName(data.draft.name);
        setKind(data.draft.mode);
        setSeconds(data.draft.duration);
        setExpanded(true);
        setStatus(
          'Önceki rota taslağın geri yüklendi. GPS kaydı otomatik başlamaz.',
        );
      }
    } catch {
      setStatus('Kaydedilen rotalar okunamadı.');
    }
    setReady(true);
    return () => {
      generation.current++;
      if (watch.current !== null)
        navigator.geolocation.clearWatch(watch.current);
    };
  }, []);
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(
        STORAGE,
        JSON.stringify({
          routes,
          draft: {
            id: 'draft',
            name,
            mode: kind,
            points,
            duration: seconds,
            created: new Date().toISOString(),
          },
        }),
      );
    } catch {
      setStatus('Cihazda kayıt alanı yok. Rotanı kaybetmemek için GPX indir.');
    }
  }, [ready, routes, points, name, kind, seconds]);
  useEffect(() => {
    if (mode !== 'gps') return;
    const timer = setInterval(
      () =>
        setSeconds(
          durationBase.current +
            Math.floor((Date.now() - started.current) / 1000),
        ),
      1000,
    );
    const hide = () => {
      if (document.visibilityState === 'hidden')
        stopRecording(
          'Uygulama arka plana geçtiği için kayıt durduruldu. Rotan taslak olarak korundu.',
        );
    };
    const leave = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    document.addEventListener('visibilitychange', hide);
    window.addEventListener('beforeunload', leave);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', hide);
      window.removeEventListener('beforeunload', leave);
    };
  }, [mode]);
  function locate(record: boolean) {
    if (!navigator.geolocation) {
      setStatus('Bu tarayıcı konum özelliğini desteklemiyor.');
      setExpanded(true);
      return;
    }
    stopWatch();
    const token = generation.current;
    let first = true;
    setTracking(true);
    setStatus('Konum bekleniyor…');
    if (record) {
      setMode('gps');
      modeRef.current = 'gps';
      setKind('gps');
      setSavedId(null);
      started.current = Date.now();
      durationBase.current = 0;
      setSeconds(0);
    }
    try {
      watch.current = navigator.geolocation.watchPosition(
        (pos) => {
          if (token !== generation.current) return;
          const { latitude: lat, longitude: lng, accuracy } = pos.coords;
          if (
            !Number.isFinite(lat) ||
            !Number.isFinite(lng) ||
            !Number.isFinite(accuracy)
          )
            return;
          setLocation({ lat, lng, accuracy });
          if (first) {
            setFocus((f) => f + 1);
            first = false;
          }
          setStatus(
            accuracy > 60
              ? 'GPS doğruluğu düşük; daha iyi sinyal bekleniyor.'
              : `Konum doğruluğu: yaklaşık ${Math.round(accuracy)} m`,
          );
          if (modeRef.current === 'gps') {
            const p = { lat, lng, t: pos.timestamp };
            if (pointsRef.current.length >= 10000) {
              stopRecording(
                'Nokta sınırına ulaşıldı. Bu rotayı kaydedip yeni kayıt başlat.',
              );
              return;
            }
            if (acceptGPS(pointsRef.current, p, accuracy)) {
              const next = [...pointsRef.current, p];
              pointsRef.current = next;
              setPoints(next);
            }
          }
        },
        (err) => {
          if (token !== generation.current) return;
          const message =
            err.code === 1
              ? 'Konum izni verilmedi. Tarayıcı ayarlarından konuma izin verip tekrar dene.'
              : err.code === 3
                ? 'GPS yanıt vermedi. Açık alanda tekrar dene.'
                : 'Konum alınamadı. GPS ve internet ayarlarını kontrol et.';
          if (modeRef.current === 'gps') stopRecording(message);
          else {
            stopWatch();
            setStatus(message);
          }
          setExpanded(true);
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 },
      );
    } catch {
      stopRecording(
        'Konum başlatılamadı. Telefonunun tarayıcısında tekrar dene.',
      );
      setTracking(false);
      setExpanded(true);
    }
  }
  function addPoint(lat: number, lng: number) {
    if (modeRef.current !== 'manual') return;
    if (pointsRef.current.length >= 10000) {
      setStatus('Nokta sınırına ulaşıldı. Rotanı kaydet.');
      return;
    }
    setPoints((p) => [...p, { lat, lng, t: Date.now() }]);
    setSavedId(null);
  }
  function route(): WalkRoute {
    return {
      id: savedId || crypto.randomUUID(),
      name: name.trim() || 'Yürüyüşüm',
      mode: kind,
      points,
      duration: seconds,
      created: new Date().toISOString(),
    };
  }
  function save() {
    if (points.length < 2) return;
    const r = route();
    setRoutes((all) => [r, ...all.filter((x) => x.id !== r.id)]);
    setSavedId(r.id);
    setMode('idle');
    modeRef.current = 'idle';
    setStatus('Rota bu cihaza kaydedildi.');
  }
  function download() {
    const r = route();
    const url = URL.createObjectURL(
      new Blob([toGPX(r)], { type: 'application/gpx+xml' }),
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = 'koh-rong-yuruyus.gpx';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setStatus(
      'GPX indirme başlatıldı. Dosyayı dilediğin kişiye gönderebilirsin.',
    );
  }
  async function share() {
    const r = route();
    const file = new File([toGPX(r)], 'koh-rong-yuruyus.gpx', {
      type: 'application/gpx+xml',
    });
    try {
      if (navigator.canShare?.({ files: [file] }) && navigator.share) {
        await navigator.share({ files: [file], title: r.name });
        setStatus('Paylaşım işlemi tamamlandı.');
      } else {
        download();
        setStatus(
          'Bu tarayıcı dosya paylaşımını desteklemiyor. GPX indirildi; dosyayı paylaşabilirsin.',
        );
      }
    } catch (e) {
      setStatus(
        e instanceof Error && e.name === 'AbortError'
          ? 'Paylaşım iptal edildi.'
          : 'Paylaşım açılamadı. GPX indir düğmesini kullanabilirsin.',
      );
    }
  }
  function reset() {
    stopWatch();
    setMode('idle');
    modeRef.current = 'idle';
    setPoints([]);
    setSeconds(0);
    setSavedId(null);
    setName('Yürüyüşüm');
    setStatus('');
    setDiscard(false);
  }
  return (
    <>
      <MapView
        {...props}
        userLocation={location}
        routePoints={points}
        drawing={mode === 'manual'}
        onRoutePoint={addPoint}
        focusLocation={focus}
        focusRoute={routeFocus}
      />
      <button
        className={'my-location ' + (tracking ? 'tracking' : '')}
        aria-label={tracking ? 'Konum takibini kapat' : 'Konumumu göster'}
        onClick={() => {
          if (mode === 'gps') {
            setFocus((f) => f + 1);
            return;
          }
          if (tracking) stopWatch();
          else locate(false);
        }}
      >
        <LocateFixed size={22} />
      </button>
      <section
        className={'walk-console ' + (expanded ? 'expanded' : '')}
        aria-label="Yürüyüş araçları"
      >
        <button
          className="walk-heading"
          aria-expanded={expanded}
          onClick={() => setExpanded(!expanded)}
        >
          <Footprints size={21} />
          <strong>
            {mode === 'gps'
              ? 'Yürüyüş kaydediliyor'
              : mode === 'manual'
                ? 'Rotanı haritada çiz'
                : 'Yürüyüş rotam'}
          </strong>
          {mode === 'gps' && <span className="record-dot" />}
          {expanded ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
        </button>
        {expanded && (
          <div className="walk-content">
            <p className="walk-status" role="status">
              {status || 'Bir rota çiz veya yürüyüşünü GPS ile kaydet.'}
            </p>
            <div className="walk-stats">
              <span>
                <strong>{(totalDistance(points) / 1000).toFixed(2)}</strong> km
              </span>
              <span>
                <strong>
                  {Math.floor(seconds / 60)}:
                  {String(seconds % 60).padStart(2, '0')}
                </strong>{' '}
                süre
              </span>
              <span>{points.length} nokta</span>
            </div>
            {!points.length && mode === 'idle' && (
              <div className="walk-actions">
                <button
                  onClick={() => {
                    setKind('manual');
                    setSeconds(0);
                    setMode('manual');
                    setStatus(
                      'Haritaya dokunarak noktalar ekle. Noktalar düz çizgilerle birleşir; yol uygunluğu kontrol edilmez.',
                    );
                  }}
                >
                  <PenLine size={18} />
                  Elle çiz
                </button>
                <button onClick={() => locate(true)}>
                  <Play size={18} />
                  Yürüyüşü kaydet
                </button>
              </div>
            )}
            {mode === 'manual' && (
              <div className="walk-actions">
                <button
                  disabled={!points.length}
                  onClick={() => setPoints((p) => p.slice(0, -1))}
                >
                  <Undo2 size={18} />
                  Geri al
                </button>
                <button
                  onClick={() => {
                    setMode('idle');
                    modeRef.current = 'idle';
                  }}
                >
                  <CheckIcon />
                  Çizimi bitir
                </button>
              </div>
            )}
            {mode === 'gps' && (
              <button className="stop-record" onClick={() => stopRecording()}>
                <Square size={17} />
                Kaydı durdur
              </button>
            )}
            {mode === 'idle' && points.length > 0 && kind === 'manual' && (
              <button className="route-edit" onClick={() => setMode('manual')}>
                <PenLine size={16} />
                Çizime devam et
              </button>
            )}
            {points.length > 0 && (
              <label className="route-name">
                Rota adı
                <input
                  value={name}
                  maxLength={80}
                  onChange={(e) => {
                    setName(e.target.value);
                    setSavedId(null);
                  }}
                />
              </label>
            )}
            {points.length > 0 && mode !== 'gps' && (
              <div className="walk-actions">
                <button disabled={points.length < 2} onClick={save}>
                  <Save size={17} />
                  {savedId ? 'Kaydedildi' : 'Rotayı kaydet'}
                </button>
                <button disabled={points.length < 2} onClick={share}>
                  <Share2 size={17} />
                  Paylaş
                </button>
                <button disabled={points.length < 2} onClick={download}>
                  <Download size={17} />
                  GPX indir
                </button>
                <button onClick={() => setDiscard(true)}>
                  <X size={17} />
                  Yeni rota
                </button>
              </div>
            )}
            {points.length === 0 && mode !== 'idle' && (
              <button
                className="route-edit"
                onClick={() => {
                  if (mode === 'gps') stopRecording();
                  setMode('idle');
                }}
              >
                İptal
              </button>
            )}
            <p className="walk-help">
              {mode === 'gps'
                ? 'Kayıt sırasında ekranı açık tut. Arka plana geçince kayıt durur.'
                : 'Elle çizimde haritaya dokun; kaydırarak haritayı hareket ettir.'}{' '}
              Konumun otomatik paylaşılmaz. GPX paylaşımı güzergâh
              koordinatlarını içerir.
            </p>
            {routes.length > 0 && (
              <details className="saved-routes">
                <summary>Kaydettiğim rotalar ({routes.length})</summary>
                {routes.map((r) => (
                  <button
                    key={r.id}
                    disabled={mode === 'gps' || (points.length > 0 && !savedId)}
                    onClick={() => {
                      setPoints(r.points);
                      setName(r.name);
                      setKind(r.mode);
                      setSeconds(r.duration);
                      setSavedId(r.id);
                      setMode('idle');
                      setRouteFocus((f) => f + 1);
                      setStatus('Kaydedilen rota açıldı.');
                    }}
                  >
                    <Footprints size={16} />
                    <span>
                      {r.name}
                      <small>
                        {(totalDistance(r.points) / 1000).toFixed(2)} km ·{' '}
                        {r.mode === 'gps' ? 'GPS kaydı' : 'Elle çizim'}
                      </small>
                    </span>
                  </button>
                ))}
                {points.length > 0 && !savedId && (
                  <p>
                    Başka rota açmak için taslağını kaydet veya “Yeni rota” ile
                    temizle.
                  </p>
                )}
              </details>
            )}
          </div>
        )}
      </section>
      <AlertDialog open={discard} onOpenChange={setDiscard}>
        <AlertDialogContent>
          <AlertDialogTitle>Yeni bir rota oluşturulsun mu?</AlertDialogTitle>
          <AlertDialogDescription>
            Haritadaki taslak temizlenecek. Kaydettiğin rotalar cihazında kalır.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>Vazgeç</AlertDialogCancel>
            <AlertDialogAction onClick={reset}>
              Yeni rota oluştur
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
function CheckIcon() {
  return <span aria-hidden="true">✓</span>;
}
