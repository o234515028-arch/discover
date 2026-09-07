'use client';
import { useEffect, useState } from 'react';
import {
  Menu,
  X,
  MapPin,
  Compass,
  MessageCircle,
  Heart,
  Search,
  SlidersHorizontal,
  ArrowUpRight,
  Plus,
  Store,
  User,
  Shield,
  Send,
  Check,
  Music,
  Utensils,
  Coffee,
  Footprints,
  Car,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import MapView from './walk-map';
import { categories, initialPlaces, type Place } from './places';
import { isInsideKohRong } from './koh-rong-boundary';
const icons = [Compass, Utensils, Music, Car, Footprints, Coffee];
export default function Page() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [places, setPlaces] = useState(initialPlaces),
    [category, setCategory] = useState('all'),
    [query, setQuery] = useState(''),
    [selected, setSelected] = useState<Place | null>(null),
    [view, setView] = useState('explore'),
    [filters, setFilters] = useState(false),
    [openOnly, setOpenOnly] = useState(false),
    [freeOnly, setFreeOnly] = useState(false),
    [favorites, setFavorites] = useState<string[]>([]),
    [login, setLogin] = useState(false),
    [role, setRole] = useState('user'),
    [session, setSession] = useState(''),
    [panel, setPanel] = useState(false),
    [room, setRoom] = useState('Koh Rong genel'),
    [draft, setDraft] = useState(''),
    [messages, setMessages] = useState<Record<string, string[]>>({}),
    [ready, setReady] = useState(false),
    [notice, setNotice] = useState('');
  useEffect(() => {
    try {
      const s = JSON.parse(
        localStorage.getItem('discover-koh-rong-v1') || '{}',
      );
      if (
        Array.isArray(s.places) &&
        s.places.every(
          (p: Place) =>
            categories.some((c) => c.id === p.category) &&
            typeof p.name === 'string',
        )
      )
        setPlaces(s.places);
      if (Array.isArray(s.favorites)) setFavorites(s.favorites);
      if (s.messages && typeof s.messages === 'object') setMessages(s.messages);
    } catch {}
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready)
      try {
        localStorage.setItem(
          'discover-koh-rong-v1',
          JSON.stringify({ places, favorites, messages }),
        );
      } catch {
        setNotice(
          'Tarayıcı kayıt alanı kullanılamıyor. Değişiklikler bu oturumda tutuluyor.',
        );
      }
  }, [places, favorites, messages, ready]);
  const filtered = places.filter(
    (p) =>
      p.approved &&
      (category === 'all' || p.category === category) &&
      `${p.name} ${p.description}`
        .toLocaleLowerCase('tr')
        .includes(query.toLocaleLowerCase('tr')) &&
      (!openOnly || p.open) &&
      (!freeOnly || p.price === 'Ücretsiz') &&
      (view !== 'saved' || favorites.includes(p.id)),
  );
  const toggle = (id: string) =>
    setFavorites((f) =>
      f.includes(id) ? f.filter((x) => x !== id) : [...f, id],
    );
  function addPlace(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const lat = Number(f.get('lat')),
      lng = Number(f.get('lng'));
    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      !isInsideKohRong(lat, lng)
    ) {
      setNotice('Konum Koh Rong geliştirme alanı içinde olmalı.');
      return;
    }
    setPlaces((p) => [
      ...p,
      {
        id: crypto.randomUUID(),
        name: String(f.get('name')).trim(),
        category: String(f.get('category')),
        description: String(f.get('description')),
        lat,
        lng,
        open: true,
        price: String(f.get('price')),
        tag: 'YENİ ETİKET',
        approved: false,
      },
    ]);
    setNotice(
      'Etiket admin onayına gönderildi. Admin demo panelinden onaylayabilirsin.',
    );
    e.currentTarget.reset();
  }
  return (
    <main className="app-shell">
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetTrigger
          render={<button className="map-menu-toggle" aria-label="Menüyü aç" />}
        >
          <Menu size={23} />
          <span>Menü</span>
        </SheetTrigger>
        <SheetContent
          side="left"
          className="explorer-drawer"
          showCloseButton={false}
        >
          <SheetTitle className="sr-only">Koh Rong keşif menüsü</SheetTitle>
          <SheetDescription className="sr-only">
            Yerleri keşfet, filtrele, kaydet ve sohbetlere katıl.
          </SheetDescription>
          <header className="topbar">
            <a className="brand" href="/">
              <span className="brand-icon">
                <MapPin size={25} />
              </span>
              discover<span className="brand-tail">.</span>
              <span className="beta">BETA</span>
            </a>
            <SheetClose
              render={
                <button className="drawer-close" aria-label="Menüyü kapat" />
              }
            >
              <X size={22} />
            </SheetClose>
            <div className="top-actions">
              <span className="demo-label">Keşif başlasın.</span>
              <button
                className="outline-btn"
                onClick={() => {
                  setMenuOpen(false);
                  setRole('merchant');
                  session === 'merchant' ? setPanel(true) : setLogin(true);
                }}
              >
                <Plus size={17} />
                İşletmeni ekle
              </button>
              <button
                className="avatar"
                aria-label="Hesap ve giriş"
                onClick={() => {
                  setMenuOpen(false);
                  session ? setPanel(true) : setLogin(true);
                }}
              >
                <User size={20} />
              </button>
            </div>
          </header>
          <div className="workspace">
            <nav className="rail" aria-label="Ana menü">
              {[
                { id: 'explore', name: 'Keşfet', Icon: Compass },
                { id: 'saved', name: 'Kaydet', Icon: Heart },
                { id: 'chat', name: 'Sohbet', Icon: MessageCircle },
              ].map(({ id, name, Icon }) => (
                <button
                  key={id}
                  className={view === id ? 'rail-item active' : 'rail-item'}
                  onClick={() => setView(id)}
                >
                  <Icon size={23} />
                  <span>{name}</span>
                </button>
              ))}
              <div className="rail-bottom">
                <span className="tiny-logo">d.</span>
                <span>
                  Burada,
                  <br />
                  birlikte.
                </span>
              </div>
            </nav>
            <aside
              className={'discovery ' + (view === 'chat' ? 'chat-panel' : '')}
            >
              {view === 'chat' ? (
                <>
                  <div className="eyebrow">KOH RONG KONUŞUYOR</div>
                  <h1>
                    Bir merhaba de<span>.</span>
                  </h1>
                  <p className="muted">Yerler, planlar ve yeni tanışmalar.</p>
                  <Tabs
                    value={room.startsWith('Özel:') ? 'direct' : 'places'}
                    onValueChange={(v) =>
                      setRoom(v === 'direct' ? 'Özel: Deniz' : 'Koh Rong genel')
                    }
                  >
                    <TabsList>
                      <TabsTrigger value="places">Yer sohbetleri</TabsTrigger>
                      <TabsTrigger value="direct">Mesajlar</TabsTrigger>
                    </TabsList>
                  </Tabs>
                  <div className="room-list">
                    {(room.startsWith('Özel:')
                      ? ['Özel: Deniz', 'Özel: Ece']
                      : [
                          'Koh Rong genel',
                          ...places
                            .filter((p) => p.approved)
                            .map((p) => p.name),
                        ]
                    ).map((r) => (
                      <button
                        className={room === r ? 'room active-room' : 'room'}
                        key={r}
                        onClick={() => setRoom(r)}
                      >
                        <MessageCircle size={16} />
                        {r.replace('Özel: ', '')}
                      </button>
                    ))}
                  </div>
                  <div className="chat-heading">
                    <strong>{room.replace('Özel: ', '')}</strong>
                    <small>Demo sohbet · mesajlar bu cihazda</small>
                  </div>
                  <div className="messages">
                    <div className="bubble">
                      <strong>Deniz · örnek mesaj</strong>
                      <p>Akşam sahilde yürüyüşe çıkan var mı? 🌊</p>
                    </div>
                    <div className="bubble">
                      <strong>Ece · örnek mesaj</strong>
                      <p>Gün batımı için güzel bir plan!</p>
                    </div>
                    {(messages[room] || []).map((m, i) => (
                      <div className="bubble mine" key={i}>
                        <strong>Sen</strong>
                        <p>{m}</p>
                      </div>
                    ))}
                  </div>
                  <form
                    className="composer"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (draft.trim()) {
                        setMessages((m) => ({
                          ...m,
                          [room]: [...(m[room] || []), draft.trim()],
                        }));
                        setDraft('');
                      }
                    }}
                  >
                    <input
                      aria-label="Mesajın"
                      placeholder="Sohbete katıl…"
                      value={draft}
                      maxLength={1000}
                      onChange={(e) => setDraft(e.target.value)}
                    />
                    <button aria-label="Mesaj gönder" disabled={!draft.trim()}>
                      <Send size={18} />
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <div className="eyebrow">TROPİK BİR ADA, BİR SÜRÜ HİKÂYE</div>
                  <h1>
                    {view === 'saved' ? 'Aklında kalsın' : 'Bugün ne yapsak'}
                    <span>?</span>
                  </h1>
                  <p className="intro">Koh Rong’un güzel köşelerini keşfet.</p>
                  <label className="search">
                    <Search size={19} />
                    <input
                      placeholder="Bir yer, lezzet veya etkinlik ara"
                      aria-label="Yer ara"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                  </label>
                  <div className="category-grid">
                    {categories.map((c, i) => {
                      const Icon = icons[i];
                      return (
                        <button
                          key={c.id}
                          aria-pressed={category === c.id}
                          className={
                            'category ' + (category === c.id ? 'chosen' : '')
                          }
                          onClick={() => setCategory(c.id)}
                        >
                          <span style={{ background: c.bg, color: c.color }}>
                            <Icon size={21} />
                          </span>
                          {c.name}
                        </button>
                      );
                    })}
                  </div>
                  <div className="section-line">
                    <h2>
                      {view === 'saved'
                        ? 'Kaydettiklerin'
                        : 'Yakınında neler var?'}{' '}
                      <span>{filtered.length}</span>
                    </h2>
                    <button
                      className={
                        'filter-button ' + (filters ? 'filter-active' : '')
                      }
                      onClick={() => setFilters(!filters)}
                    >
                      <SlidersHorizontal size={16} />
                      Filtrele
                    </button>
                  </div>
                  {filters && (
                    <div className="filters">
                      <label>
                        <Switch
                          checked={openOnly}
                          onCheckedChange={setOpenOnly}
                        />
                        Şu an açık
                      </label>
                      <label>
                        <Switch
                          checked={freeOnly}
                          onCheckedChange={setFreeOnly}
                        />
                        Ücretsiz
                      </label>
                      <button
                        onClick={() => {
                          setOpenOnly(false);
                          setFreeOnly(false);
                          setCategory('all');
                          setQuery('');
                        }}
                      >
                        Sıfırla
                      </button>
                    </div>
                  )}
                  <div className="place-list">
                    {filtered.length === 0 ? (
                      <div className="empty">
                        <Search />
                        <h3>Burada henüz bir şey yok.</h3>
                        <p>
                          {view === 'saved'
                            ? 'Beğendiğin yerleri kalbe dokunarak kaydet.'
                            : 'Başka bir kategori veya filtre deneyebilirsin.'}
                        </p>
                      </div>
                    ) : (
                      filtered.map((p) => {
                        const c = categories.find((c) => c.id === p.category)!;
                        const Icon = icons[categories.indexOf(c)];
                        return (
                          <article key={p.id} className="place-card">
                            <button
                              className="place-main"
                              onClick={() => {
                                setMenuOpen(false);
                                setSelected(p);
                              }}
                            >
                              <span
                                className="place-art"
                                style={{ background: c.bg, color: c.color }}
                              >
                                <Icon size={29} />
                              </span>
                              <span className="place-copy">
                                <small style={{ color: c.color }}>
                                  {p.tag}
                                </small>
                                <strong>{p.name}</strong>
                                <span className="muted">
                                  {c.name} · {p.price}
                                </span>
                                <span
                                  className={
                                    'opening ' + (p.open ? '' : 'closed')
                                  }
                                >
                                  {p.open ? '● Şu an açık' : '● Akşam başlıyor'}
                                  <span> · Örnek yer</span>
                                </span>
                              </span>
                            </button>
                            <button
                              aria-label={`${p.name} ${favorites.includes(p.id) ? 'kaydını kaldır' : 'kaydet'}`}
                              aria-pressed={favorites.includes(p.id)}
                              className={
                                'save ' +
                                (favorites.includes(p.id) ? 'saved' : '')
                              }
                              onClick={() => toggle(p.id)}
                            >
                              <Heart
                                size={18}
                                fill={
                                  favorites.includes(p.id)
                                    ? 'currentColor'
                                    : 'none'
                                }
                              />
                            </button>
                          </article>
                        );
                      })
                    )}
                  </div>
                  <div className="local-note">
                    <span>✦</span>
                    <div>
                      <strong>Adayı yeniden keşfet.</strong>
                      <p>Tüm yerler ve etkinlikler örnek veridir.</p>
                    </div>
                  </div>
                </>
              )}
            </aside>
          </div>
          <div className="drawer-footer">
            <button className="primary-btn" onClick={() => setMenuOpen(false)}>
              <MapPin size={17} />
              Haritaya dön · {filtered.length} yer
            </button>
          </div>
        </SheetContent>
      </Sheet>
      <section
        className="map-area full-map"
        aria-label="Koh Rong keşif haritası"
      >
        <MapView places={filtered} onSelect={setSelected} />
      </section>
      <Sheet open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <SheetContent className="detail-sheet">
          {selected && (
            <>
              <div
                className="detail-art"
                style={{
                  background: categories.find((c) => c.id === selected.category)
                    ?.bg,
                }}
              >
                <MapPin size={68} />
                <span>Koh Rong’da keşfet</span>
              </div>
              <div className="detail-body">
                <span className="eyebrow">{selected.tag} · ÖRNEK YER</span>
                <SheetTitle className="detail-title">
                  {selected.name}
                </SheetTitle>
                <SheetDescription>{selected.description}</SheetDescription>
                <div className="detail-info">
                  <p>
                    <MapPin size={17} />
                    Koh Rong, Kamboçya
                  </p>
                  <p>
                    <Check size={17} />
                    {selected.price} ·{' '}
                    {selected.open ? 'Şu an açık' : 'Akşam başlıyor'}
                  </p>
                </div>
                <button
                  className="primary-btn"
                  onClick={() => {
                    setRoom(selected.name);
                    setView('chat');
                    setSelected(null);
                    setMenuOpen(true);
                  }}
                >
                  <MessageCircle size={18} />
                  Bu yer hakkında sohbet et
                </button>
                <button
                  className="outline-btn wide"
                  onClick={() => toggle(selected.id)}
                >
                  <Heart size={18} />
                  {favorites.includes(selected.id)
                    ? 'Kaydedildi · kaldır'
                    : 'Daha sonra keşfetmek için kaydet'}
                </button>
                <p className="fine-print">
                  Bu işletme ve konumu tanıtım amaçlıdır. Gerçek işletme veya
                  etkinlik bilgisi değildir.
                </p>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
      <Dialog open={login} onOpenChange={setLogin}>
        <DialogContent className="login-dialog">
          <span className="brand-icon">
            <MapPin />
          </span>
          <DialogTitle className="dialog-title">
            Koh Rong’da buluşalım.
          </DialogTitle>
          <DialogDescription>
            Şimdilik kayıt olmadan keşfet. Bir rol seçerek demo deneyimini
            açabilirsin.
          </DialogDescription>
          <Tabs value={role} onValueChange={(v) => setRole(String(v))}>
            <TabsList className="role-tabs">
              <TabsTrigger value="user">
                <User size={16} />
                Kullanıcı
              </TabsTrigger>
              <TabsTrigger value="merchant">
                <Store size={16} />
                Esnaf
              </TabsTrigger>
              <TabsTrigger value="admin">
                <Shield size={16} />
                Admin
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="role-explanation">
            {role === 'user'
              ? 'Yerleri kaydet, sohbetlere katıl ve adayı keşfet.'
              : role === 'merchant'
                ? 'İşletme veya etkinlik etiketi oluştur, admin onayına gönder.'
                : 'Etiketleri incele, onayla veya yayından kaldır.'}
          </div>
          <button
            className="primary-btn"
            onClick={() => {
              setSession(role);
              setLogin(false);
              if (role !== 'user') setPanel(true);
            }}
          >
            Demo olarak devam et <ArrowUpRight size={18} />
          </button>
          <p className="fine-print">
            Giriş simülasyonu. Kimlik doğrulama ve ücretli üyelik henüz etkin
            değildir.
          </p>
        </DialogContent>
      </Dialog>
      <Sheet open={panel} onOpenChange={setPanel}>
        <SheetContent className="management">
          <SheetTitle className="dialog-title">
            {session === 'admin'
              ? 'Yönetim paneli'
              : session === 'merchant'
                ? 'İşletme paneli'
                : 'Hesabım'}
          </SheetTitle>
          <SheetDescription>
            Demo oturumu · değişiklikler yalnızca bu tarayıcıda saklanır.
          </SheetDescription>
          <button
            className="outline-btn"
            onClick={() => {
              setPanel(false);
              setLogin(true);
            }}
          >
            Rol değiştir
          </button>
          {session === 'merchant' ? (
            <form className="merchant-form" onSubmit={addPlace}>
              <label>
                İşletme / etkinlik adı
                <input
                  name="name"
                  required
                  maxLength={70}
                  placeholder="Örn. Ada Mutfağı"
                />
              </label>
              <label>
                Kategori
                <select name="category">
                  {categories.slice(1).map((c) => (
                    <option value={c.id} key={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Açıklama
                <textarea
                  name="description"
                  required
                  maxLength={400}
                  placeholder="Burada neler keşfedebiliriz?"
                />
              </label>
              <label>
                Ücret bilgisi
                <input
                  name="price"
                  placeholder="Örn. $$ veya Ücretsiz"
                  required
                />
              </label>
              <div className="coordinates">
                <label>
                  Enlem
                  <input
                    type="number"
                    step="any"
                    name="lat"
                    defaultValue="10.6660696"
                    required
                  />
                </label>
                <label>
                  Boylam
                  <input
                    type="number"
                    step="any"
                    name="lng"
                    defaultValue="103.272748"
                    required
                  />
                </label>
              </div>
              <p className="fine-print">
                Koh Rong üzerindeki konumunu koordinatlarla belirt. Ücretli
                kayıt sonraki aşamada eklenecek.
              </p>
              <button className="primary-btn" type="submit">
                <Plus size={17} />
                Onaya gönder
              </button>
            </form>
          ) : session === 'admin' ? (
            <div className="admin-list">
              {places.map((p) => (
                <div key={p.id}>
                  <strong>{p.name}</strong>
                  <small>{p.approved ? 'Yayında' : 'Onay bekliyor'}</small>
                  <button
                    className="outline-btn"
                    onClick={() =>
                      setPlaces((a) =>
                        a.map((x) =>
                          x.id === p.id ? { ...x, approved: !x.approved } : x,
                        ),
                      )
                    }
                  >
                    {p.approved ? 'Yayından kaldır' : 'Onayla'}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <button
              className="primary-btn"
              onClick={() => {
                setView('saved');
                setPanel(false);
                setMenuOpen(true);
              }}
            >
              Kaydettiğim yerler ({favorites.length})
            </button>
          )}
          {notice && (
            <p className="notice" role="status">
              {notice}
            </p>
          )}
        </SheetContent>
      </Sheet>
    </main>
  );
}
