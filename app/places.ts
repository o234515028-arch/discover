export type Place = {
  id: string;
  name: string;
  category: string;
  description: string;
  lat: number;
  lng: number;
  price: string;
  tag: string;
  open: boolean;
  approved: boolean;
};
export const region = {
  center: [10.715676, 103.2473427] as [number, number],
  bounds: [
    [10.6509867, 103.181802],
    [10.780247, 103.3158883],
  ] as [[number, number], [number, number]],
  zoom: 12,
};
export const categories = [
  { id: 'all', name: 'Hepsi', color: '#326953', bg: '#e4f4e8' },
  { id: 'food', name: 'Yeme içme', color: '#b9542a', bg: '#ffeadb' },
  { id: 'party', name: 'Partiler', color: '#8543b1', bg: '#f0e5fc' },
  { id: 'taxi', name: 'Taksiler', color: '#956d05', bg: '#fff2bf' },
  { id: 'walk', name: 'Yürüyüş', color: '#277357', bg: '#dff2df' },
  { id: 'fun', name: 'Eğlence', color: '#bf416d', bg: '#fce1eb' },
];
export const initialPlaces: Place[] = [
  {
    id: '1',
    name: 'Koh Toch Sahil Mutfağı',
    category: 'food',
    lat: 10.6660696,
    lng: 103.272748,
    price: '$$',
    tag: 'ADA LEZZETLERİ',
    description:
      'Koh Toch kıyısında tropik tatlar ve uzun sohbetler için hazırlanmış örnek yeme içme noktası.',
    open: true,
    approved: true,
  },
  {
    id: '2',
    name: 'Koh Toch Beach Sessions',
    category: 'party',
    lat: 10.6671345,
    lng: 103.2737672,
    price: '$$',
    tag: 'BU AKŞAM · 20.00',
    description:
      'White Beach yakınında ada ritimleriyle örnek bir açık hava DJ etkinliği. Program ve konum demo amaçlıdır.',
    open: false,
    approved: true,
  },
  {
    id: '3',
    name: 'Longset Plaj Lokantası',
    category: 'food',
    lat: 10.67973,
    lng: 103.2817709,
    price: '$$',
    tag: 'TROPİK LEZZETLER',
    description:
      'Longset Beach çevresinde Khmer mutfağı ve deniz ürünleri sunacak işletmeler için örnek lokanta etiketi.',
    open: true,
    approved: true,
  },
  {
    id: '4',
    name: 'Koh Toch–Longset Yürüyüşü',
    category: 'walk',
    lat: 10.6748,
    lng: 103.2865,
    price: 'Ücretsiz',
    tag: 'SAHİL · ÖRNEK ROTA',
    description:
      'Koh Toch ile Longset Beach arasında örnek yürüyüş çizgisi. Geçilebilirlik doğrulanmamıştır; navigasyon değildir.',
    open: true,
    approved: true,
  },
  {
    id: '5',
    name: 'Koh Toch Ada Taksi',
    category: 'taxi',
    lat: 10.6657,
    lng: 103.2719,
    price: 'Fiyat sor',
    tag: 'ADA İÇİ ULAŞIM',
    description:
      'Ada içi ulaşım noktalarının nasıl görüneceğini gösteren örnek kayıt. Çağrı hizmeti değildir.',
    open: true,
    approved: true,
  },
  {
    id: '6',
    name: 'Coconut Beach Oyun Gecesi',
    category: 'fun',
    lat: 10.7050845,
    lng: 103.3132485,
    price: '$',
    tag: 'MÜZİK & ARKADAŞLAR',
    description:
      'Coconut Beach çevresinde müzik ve arkadaşlarla keyifli bir akşam için hayalî etkinlik etiketi.',
    open: false,
    approved: true,
  },
  {
    id: '7',
    name: 'Sok San Gün Batımı',
    category: 'fun',
    lat: 10.6908443,
    lng: 103.2536517,
    price: 'Ücretsiz',
    tag: 'GÜN BATIMI BULUŞMASI',
    description:
      'Sok San Beach üzerinde gün batımında bir araya gelmek için örnek açık hava buluşması.',
    open: true,
    approved: true,
  },
  {
    id: '8',
    name: 'Lonely Beach Sakin Köşe',
    category: 'walk',
    lat: 10.7730141,
    lng: 103.2303599,
    price: 'Ücretsiz',
    tag: 'KUZEYDE SAKİN BİR DURAK',
    description:
      'Lonely Beach konumunu gösteren örnek keşif etiketi. Yol ve erişim koşulları doğrulanmamıştır.',
    open: true,
    approved: true,
  },
];
