export type OccasionType = 'oficina' | 'cena' | 'fin-de-semana';
export type WeatherType = 'templado' | 'calido' | 'fresco';
export type WardrobeCategory = 'todas' | 'abrigos' | 'superiores' | 'pantalones' | 'calzado';

export type CommunityZone =
  | 'Providencia'
  | 'Las Condes'
  | 'Santiago Centro'
  | 'Ñuñoa'
  | 'Viña del Mar';

export type ExchangeType = 'Intercambio' | 'Préstamo' | 'Venta local';
export type ListingCondition = 'Como nueva' | 'Excelente estado' | 'Buen estado';

export interface CuratedLook {
  id: string;
  title: string;
  occasion: OccasionType;
  occasionLabel: string;
  weather: WeatherType;
  weatherLabel: string;
  temperature: string;
  image: string;
  imageAlt: string;
  pieces: string[];
  stylingNote: string;
}

export interface WardrobeItem {
  id: string;
  name: string;
  category: Exclude<WardrobeCategory, 'todas'>;
  categoryLabel: string;
  colorName: string;
  swatchHex: string;
  wearCount: number;
  season: string;
}

export interface CommunityListingItem {
  id: string;
  ownerUid: string;
  authorName: string;
  title: string;
  category: Exclude<WardrobeCategory, 'todas'>;
  zone: CommunityZone;
  exchangeType: ExchangeType;
  size: string;
  condition: ListingCondition;
  status: 'available' | 'requested' | 'completed';
  requestedByUid: string;
  isSeed?: boolean;
}

export interface LookbookStory {
  id: string;
  index: string;
  title: string;
  category: string;
  climateNote: string;
  image: string;
  imageAlt: string;
  description: string;
  pieces: string[];
  quote: string;
  authorName: string;
  authorRole: string;
}

export const HERO_WARDROBE_IMAGE = '/src/assets/images/tulook_hero_wardrobe_1795187690777.jpg';
export const BENTO_FLATLAY_IMAGE = '/src/assets/images/tulook_bento_flatlay_1795187692282.jpg';

export const COMMUNITY_ZONES: CommunityZone[] = [
  'Providencia',
  'Las Condes',
  'Santiago Centro',
  'Ñuñoa',
  'Viña del Mar',
];

export const COMMUNITY_LISTINGS: CommunityListingItem[] = [
  {
    id: 'seed-comm-1',
    ownerUid: 'seed-user-1',
    authorName: 'Francisca M.',
    title: 'Blazer lino beige corte sastre',
    category: 'abrigos',
    zone: 'Providencia',
    exchangeType: 'Intercambio',
    size: 'M',
    condition: 'Como nueva',
    status: 'available',
    requestedByUid: '',
    isSeed: true,
  },
  {
    id: 'seed-comm-2',
    ownerUid: 'seed-user-2',
    authorName: 'Sebastián R.',
    title: 'Sobrecamisa algodón azul marino',
    category: 'superiores',
    zone: 'Ñuñoa',
    exchangeType: 'Préstamo',
    size: 'L',
    condition: 'Excelente estado',
    status: 'available',
    requestedByUid: '',
    isSeed: true,
  },
  {
    id: 'seed-comm-3',
    ownerUid: 'seed-user-3',
    authorName: 'Antonia V.',
    title: 'Pantalón pinzas tiro alto arena',
    category: 'pantalones',
    zone: 'Las Condes',
    exchangeType: 'Venta local',
    size: 'S',
    condition: 'Como nueva',
    status: 'available',
    requestedByUid: '',
    isSeed: true,
  },
  {
    id: 'seed-comm-4',
    ownerUid: 'seed-user-4',
    authorName: 'Diego L.',
    title: 'Mocasines cuero negro clásico',
    category: 'calzado',
    zone: 'Santiago Centro',
    exchangeType: 'Intercambio',
    size: '42',
    condition: 'Buen estado',
    status: 'available',
    requestedByUid: '',
    isSeed: true,
  },
  {
    id: 'seed-comm-5',
    ownerUid: 'seed-user-5',
    authorName: 'Javiera C.',
    title: 'Gabardina ligera color piedra',
    category: 'abrigos',
    zone: 'Viña del Mar',
    exchangeType: 'Préstamo',
    size: 'M',
    condition: 'Como nueva',
    status: 'available',
    requestedByUid: '',
    isSeed: true,
  },
];

export const CURATED_LOOKS: CuratedLook[] = [
  {
    id: 'look-urbano',
    title: 'Sastrería en piedra y carbón',
    occasion: 'oficina',
    occasionLabel: 'Oficina',
    weather: 'templado',
    weatherLabel: 'Nublado',
    temperature: '18 °C',
    image: '/src/assets/images/tulook_look_urbano_1795187691462.jpg',
    imageAlt: 'Atuendo de blazer gris carbón con camiseta crema y pantalón amplio beige en patio arquitectónico',
    pieces: [
      'Blazer de lana gris carbón',
      'Top acanalado marfil',
      'Pantalón sastre lino arena',
      'Mocasines de piel espresso',
    ],
    stylingNote: 'Equilibra estructura en hombros con caída fluida para jornadas de oficina y reuniones vespertinas.',
  },
  {
    id: 'look-minimal',
    title: 'Gabardina clásica y cachemir',
    occasion: 'fin-de-semana',
    occasionLabel: 'Fin de semana',
    weather: 'fresco',
    weatherLabel: 'Lluvia ligera',
    temperature: '13 °C',
    image: '/src/assets/images/tulook_look_minimal_1795187691925.jpg',
    imageAlt: 'Conjunto de gabardina camel, suéter de cachemir crema, pantalón marino y mocasines sobre piedra travertino',
    pieces: [
      'Gabardina camel con cinturón',
      'Suéter de cachemir crema',
      'Pantalón recto azul marino',
      'Mocasines de cuero marrón',
    ],
    stylingNote: 'Capas ligeras repelentes al agua con base neutra adaptable de la mañana a la tarde.',
  },
  {
    id: 'look-noche',
    title: 'Terciopelo borgoña de galería',
    occasion: 'cena',
    occasionLabel: 'Cena',
    weather: 'calido',
    weatherLabel: 'Despejado',
    temperature: '22 °C',
    image: '/src/assets/images/tulook_look_noche_1795187692863.jpg',
    imageAlt: 'Traje sastre de terciopelo borgoña en galería minimalista con luz natural lateral',
    pieces: [
      'Blazer de terciopelo borgoña',
      'Top lencero satinado vino',
      'Pantalón sastre de tiro alto',
      'Salones negros de punta fina',
    ],
    stylingNote: 'Monocromía profunda en tono vino para inauguraciones, cenas o eventos nocturnos sin esfuerzo.',
  },
];

export const WARDROBE_ITEMS: WardrobeItem[] = [
  {
    id: 'w1',
    name: 'Blazer lana gris carbón',
    category: 'abrigos',
    categoryLabel: 'Abrigos',
    colorName: 'Carbón',
    swatchHex: '#37393B',
    wearCount: 24,
    season: 'Todo el año',
  },
  {
    id: 'w2',
    name: 'Gabardina clásica camel',
    category: 'abrigos',
    categoryLabel: 'Abrigos',
    colorName: 'Camel',
    swatchHex: '#B68F66',
    wearCount: 19,
    season: 'Otoño / Invierno',
  },
  {
    id: 'w3',
    name: 'Camisa popelín blanco óptico',
    category: 'superiores',
    categoryLabel: 'Partes de arriba',
    colorName: 'Blanco',
    swatchHex: '#F4F3EF',
    wearCount: 38,
    season: 'Todo el año',
  },
  {
    id: 'w4',
    name: 'Suéter cachemir crema',
    category: 'superiores',
    categoryLabel: 'Partes de arriba',
    colorName: 'Marfil',
    swatchHex: '#EAE4D8',
    wearCount: 16,
    season: 'Otoño / Invierno',
  },
  {
    id: 'w5',
    name: 'Pantalón sastre lino arena',
    category: 'pantalones',
    categoryLabel: 'Pantalones',
    colorName: 'Arena',
    swatchHex: '#D1C4B2',
    wearCount: 29,
    season: 'Primavera / Verano',
  },
  {
    id: 'w6',
    name: 'Denim selvedge índigo oscuro',
    category: 'pantalones',
    categoryLabel: 'Pantalones',
    colorName: 'Índigo',
    swatchHex: '#233044',
    wearCount: 41,
    season: 'Todo el año',
  },
  {
    id: 'w7',
    name: 'Mocasines piel espresso',
    category: 'calzado',
    categoryLabel: 'Calzado',
    colorName: 'Espresso',
    swatchHex: '#3B2820',
    wearCount: 33,
    season: 'Todo el año',
  },
  {
    id: 'w8',
    name: 'Zapatillas minimalistas piel',
    category: 'calzado',
    categoryLabel: 'Calzado',
    colorName: 'Tiza',
    swatchHex: '#ECEAE4',
    wearCount: 45,
    season: 'Primavera / Verano',
  },
];

export const LOOKBOOK_STORIES: LookbookStory[] = [
  {
    id: 'story-1',
    index: '01',
    title: 'Sastrería Urbana para Días de Estudio',
    category: 'Oficina',
    climateNote: '18 °C · Entretiempo',
    image: '/src/assets/images/tulook_look_urbano_1795187691462.jpg',
    imageAlt: 'Look de sastrería urbana con blazer carbón y pantalón arena',
    description:
      'Combinación automática generada a partir de cuatro básicos del armario digital, ajustada al pronóstico matinal y complementada con piezas de tu zona.',
    pieces: ['Blazer lana carbón', 'Top marfil', 'Pantalón arena'],
    quote:
      'Antes tardaba veinte minutos frente al clóset cada mañana; ahora reviso la propuesta de TU LOOK mientras tomo café y salgo lista en cinco.',
    authorName: 'Valentina Riquelme',
    authorRole: 'Arquitecta de Interiores, Santiago',
  },
  {
    id: 'story-2',
    index: '02',
    title: 'Cápsula Minimalista para Viajes Cortos',
    category: 'Fin de semana',
    climateNote: '13 °C · Lluvia ligera',
    image: '/src/assets/images/tulook_look_minimal_1795187691925.jpg',
    imageAlt: 'Atuendo cápsula minimalista con gabardina camel sobre travertino',
    description:
      'Lista de equipaje optimizada para tres días con seis prendas intercambiables que cubren traslados, caminata urbana y almuerzo formal.',
    pieces: ['Gabardina camel', 'Cachemir crema', 'Pantalón marino'],
    quote:
      'Conseguí una gabardina en préstamo a dos cuadras de mi casa gracias a la comunidad de TU LOOK sin tener que comprar una nueva para el viaje.',
    authorName: 'Matías Echeverría',
    authorRole: 'Director de Arte, Valparaíso',
  },
  {
    id: 'story-3',
    index: '03',
    title: 'Edición Nocturna en Monocromía Vino',
    category: 'Cena & Eventos',
    climateNote: '22 °C · Noche despejada',
    image: '/src/assets/images/tulook_look_noche_1795187692863.jpg',
    imageAlt: 'Atuendo de noche en terciopelo borgoña dentro de galería',
    description:
      'Rescate de prendas de ocasión poco usadas mediante intercambios cercanos en tu barrio y emparejamiento por textura y temperatura nocturna.',
    pieces: ['Blazer terciopelo', 'Top satinado', 'Pantalón sastre'],
    quote:
      'Intercambié un blazer que no usaba en Providencia por este conjunto de noche el mismo día, sin envíos ni esperas.',
    authorName: 'Camila Valdivieso',
    authorRole: 'Curadora Editorial, Madrid',
  },
];
