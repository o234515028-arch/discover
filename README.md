# discover.

**discover.**, Kamboçya'daki Koh Rong adası için hazırlanmış, mobil öncelikli bir harita ve yerel keşif uygulaması prototipidir. Ana ekran tamamen haritadır; açılır menüden yeme içme yerleri, partiler, ada içi ulaşım, yürüyüş rotaları ve eğlence noktaları filtrelenebilir.

## Özellikler

- OpenStreetMap ve Leaflet ile ücretsiz harita altyapısı
- Koh Rong ada sınırlarına uyumlu, ekran boyutuna göre otomatik kadraj
- Konumu haritada gösterme
- Haritaya dokunarak yürüyüş rotası çizme
- GPS ile yürüyüş kaydetme, cihazda saklama ve GPX olarak paylaşma
- Yer arama, kategori ve açık/ücretsiz filtreleri
- Favoriler ile yer sohbetleri için yerel demo veri saklama
- Kullanıcı, esnaf ve admin rolleri için temel demo panelleri
- Esnaf etiketi oluşturma ve admin onayı akışı

Örnek yerler ve etkinlikler tanıtım amaçlıdır; gerçek işletme veya navigasyon bilgisi değildir.

## Yerelde çalıştırma

Node.js 22.13 veya daha yeni bir sürüm gerekir.

```bash
git clone https://github.com/o234515028-arch/discover.git
cd discover
npm ci
npm run dev
```

Ardından [http://localhost:3000](http://localhost:3000) adresini açın. Harita döşemeleri için internet bağlantısı gerekir. Konum izni localhost veya HTTPS üzerinde çalışır.

## Diğer komutlar

```bash
npm run build
npm test
npm run lint
```

Harita sağlayıcısı `app/map-view.tsx` içinde ayrılmıştır; ileride Google Maps API bağlamak için diğer ekranlardaki yer veri modeli değişmeden yeni sağlayıcı eklenebilir.

Harita verileri © [OpenStreetMap katkıcıları](https://www.openstreetmap.org/copyright).
