import { useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import {
  ArrowRight,
  Bookmark,
  Check,
  ExternalLink,
  Link2,
  LogIn,
  LogOut,
  MapPin,
  Plus,
  Shield,
  Shirt,
  SlidersHorizontal,
  Sun,
  Trash2,
  Users,
} from 'lucide-react';
import {
  COMMUNITY_LISTINGS,
  COMMUNITY_ZONES,
  CURATED_LOOKS,
  WARDROBE_ITEMS,
  type CommunityListingItem,
  type CommunityZone,
  type ExchangeType,
  type OccasionType,
  type WardrobeCategory,
  type WardrobeItem,
} from '../data/tuLookData';
import {
  auth,
  createSafeDocId,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
  sanitizeInput,
  VALIDATION_LIMITS,
} from '../firebase';
import { ResilientImage } from './ResilientImage';

export type AppTab = 'hoy' | 'armario' | 'comunidad';

interface AdminAccessRequest {
  id: string;
  name: string;
  email: string;
  platform: string;
  note: string;
  status: 'pending' | 'reviewed' | 'archived';
}

const MY_APPS_URL_STORAGE_KEY = 'tu_look_my_apps_url';
const ADMIN_EMAIL = 'cris.mancillam@duocuc.cl';

interface AppInteractiveDemoProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  selectedOccasion: OccasionType;
  onOccasionChange: (occasion: OccasionType) => void;
}

export function AppInteractiveDemo({
  activeTab,
  onTabChange,
  selectedOccasion,
  onOccasionChange,
}: AppInteractiveDemoProps) {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [savedLookIds, setSavedLookIds] = useState<string[]>(['look-urbano']);
  const [wardrobeItems, setWardrobeItems] = useState<WardrobeItem[]>(WARDROBE_ITEMS);
  const [wardrobeFilter, setWardrobeFilter] = useState<WardrobeCategory>('todas');
  const [pinnedItemIds, setPinnedItemIds] = useState<string[]>(['w1', 'w3', 'w5', 'w7']);

  // Community state
  const [communityListings, setCommunityListings] =
    useState<CommunityListingItem[]>(COMMUNITY_LISTINGS);
  const [selectedZone, setSelectedZone] = useState<'Todas' | CommunityZone>('Todas');
  const [selectedExchange, setSelectedExchange] = useState<'Todos' | ExchangeType>('Todos');
  const [requestedLocalIds, setRequestedLocalIds] = useState<string[]>([]);
  const [communityFeedback, setCommunityFeedback] = useState<string | null>(null);

  const [showPublishForm, setShowPublishForm] = useState(false);
  const [pubTitle, setPubTitle] = useState('');
  const [pubCategory, setPubCategory] =
    useState<Exclude<WardrobeCategory, 'todas'>>('superiores');
  const [pubZone, setPubZone] = useState<CommunityZone>('Providencia');
  const [pubExchange, setPubExchange] = useState<ExchangeType>('Intercambio');
  const [pubSize, setPubSize] = useState('M');

  const [showAddGarment, setShowAddGarment] = useState(false);
  const [newGarmentName, setNewGarmentName] = useState('');
  const [newGarmentCategory, setNewGarmentCategory] =
    useState<Exclude<WardrobeCategory, 'todas'>>('superiores');

  const [showUrlConnector, setShowUrlConnector] = useState(false);
  const [myAppsUrlInput, setMyAppsUrlInput] = useState('');
  const [savedMyAppsUrl, setSavedMyAppsUrl] = useState<string>('');
  const [urlError, setUrlError] = useState<string | null>(null);

  const [showAdminInbox, setShowAdminInbox] = useState(false);
  const [adminRequests, setAdminRequests] = useState<AdminAccessRequest[]>([]);

  const isVerifiedAdmin = Boolean(
    user && user.emailVerified && user.email === ADMIN_EMAIL
  );

  useEffect(() => {
    try {
      const stored = localStorage.getItem(MY_APPS_URL_STORAGE_KEY);
      if (stored) {
        setSavedMyAppsUrl(stored);
        setMyAppsUrlInput(stored);
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  // Auth listener + owner profile bootstrap
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      setAuthReady(true);
      if (nextUser && nextUser.emailVerified && nextUser.email) {
        const userPath = `users/${nextUser.uid}`;
        try {
          const userRef = doc(db, 'users', nextUser.uid);
          const snap = await getDoc(userRef);
          const safeName = sanitizeInput(
            nextUser.displayName || 'Usuario TU LOOK',
            VALIDATION_LIMITS.NAME_MAX
          );
          const safeEmail = sanitizeInput(
            nextUser.email,
            VALIDATION_LIMITS.EMAIL_MAX
          );

          if (!snap.exists()) {
            await setDoc(userRef, {
              uid: nextUser.uid,
              displayName: safeName,
              email: safeEmail,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          } else {
            await updateDoc(userRef, {
              displayName: safeName,
              email: safeEmail,
              updatedAt: serverTimestamp(),
            });
          }
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, userPath);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Sync authenticated user's Firestore wardrobe
  useEffect(() => {
    if (!authReady || !user || !user.emailVerified) {
      return;
    }

    const wardrobePath = `users/${user.uid}/wardrobe`;
    const wardrobeQuery = query(
      collection(db, 'users', user.uid, 'wardrobe'),
      where('ownerUid', '==', user.uid)
    );

    const unsubWardrobe = onSnapshot(
      wardrobeQuery,
      (snapshot) => {
        if (snapshot.empty) {
          setWardrobeItems(WARDROBE_ITEMS);
          return;
        }
        const categoryLabels: Record<Exclude<WardrobeCategory, 'todas'>, string> = {
          abrigos: 'Abrigos',
          superiores: 'Partes de arriba',
          pantalones: 'Pantalones',
          calzado: 'Calzado',
        };
        const cloudItems: WardrobeItem[] = snapshot.docs.map((d) => {
          const data = d.data();
          const cat = data.category as Exclude<WardrobeCategory, 'todas'>;
          return {
            id: d.id,
            name: String(data.name || ''),
            category: cat,
            categoryLabel: categoryLabels[cat] || 'Prenda',
            colorName: String(data.colorName || 'Personal'),
            swatchHex: String(data.swatchHex || '#7F1D3A'),
            wearCount: Number(data.wearCount || 1),
            season: 'Nube TU LOOK',
          };
        });
        setWardrobeItems([...cloudItems, ...WARDROBE_ITEMS]);
        const cloudPinned = snapshot.docs
          .filter((d) => Boolean(d.data().pinned))
          .map((d) => d.id);
        setPinnedItemIds((prev) => Array.from(new Set([...cloudPinned, ...prev])));
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, wardrobePath);
      }
    );

    return () => {
      unsubWardrobe();
    };
  }, [authReady, user]);

  // Sync available community listings from Firestore
  useEffect(() => {
    const listingsPath = 'communityListings';
    const listingsQuery = query(
      collection(db, listingsPath),
      where('status', '==', 'available')
    );

    const unsubListings = onSnapshot(
      listingsQuery,
      (snapshot) => {
        const cloudListings: CommunityListingItem[] = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            ownerUid: String(data.ownerUid || ''),
            authorName: String(data.authorName || 'Vecino TU LOOK'),
            title: String(data.title || ''),
            category: (data.category as Exclude<WardrobeCategory, 'todas'>) || 'superiores',
            zone: (data.zone as CommunityZone) || 'Providencia',
            exchangeType: (data.exchangeType as ExchangeType) || 'Intercambio',
            size: String(data.size || 'M'),
            condition: (data.condition as CommunityListingItem['condition']) || 'Como nueva',
            status: (data.status as CommunityListingItem['status']) || 'available',
            requestedByUid: String(data.requestedByUid || ''),
          };
        });
        setCommunityListings([...cloudListings, ...COMMUNITY_LISTINGS]);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, listingsPath);
      }
    );

    return () => unsubListings();
  }, []);

  // Sync admin inbox when verified admin opens it
  useEffect(() => {
    if (!authReady || !isVerifiedAdmin || !showAdminInbox) {
      return;
    }

    const reqPath = 'accessRequests';
    const reqQuery = query(
      collection(db, reqPath),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(
      reqQuery,
      (snapshot) => {
        const items: AdminAccessRequest[] = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            name: String(data.name || ''),
            email: String(data.email || ''),
            platform: String(data.platform || 'Web'),
            note: String(data.note || ''),
            status: (data.status as AdminAccessRequest['status']) || 'pending',
          };
        });
        setAdminRequests(items);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, reqPath);
      }
    );

    return () => unsub();
  }, [authReady, isVerifiedAdmin, showAdminInbox]);

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch {
      setAuthError('No se pudo iniciar sesión con Google. Verifica las ventanas emergentes.');
    }
  };

  const handleSignOut = async () => {
    setShowAdminInbox(false);
    await signOut(auth);
  };

  const currentLook =
    CURATED_LOOKS.find((look) => look.occasion === selectedOccasion) ?? CURATED_LOOKS[0];

  const isSaved = savedLookIds.includes(currentLook.id);

  const filteredWardrobe =
    wardrobeFilter === 'todas'
      ? wardrobeItems
      : wardrobeItems.filter((item) => item.category === wardrobeFilter);

  const filteredCommunity = communityListings.filter((item) => {
    const zoneMatch = selectedZone === 'Todas' || item.zone === selectedZone;
    const exchangeMatch =
      selectedExchange === 'Todos' || item.exchangeType === selectedExchange;
    return zoneMatch && exchangeMatch;
  });

  const toggleSaveLook = (id: string) => {
    setSavedLookIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const togglePinItem = async (id: string) => {
    const nextPinned = !pinnedItemIds.includes(id);
    setPinnedItemIds((prev) =>
      nextPinned ? [...prev, id] : prev.filter((item) => item !== id)
    );

    if (user && user.emailVerified && !id.startsWith('w')) {
      const itemPath = `users/${user.uid}/wardrobe/${id}`;
      try {
        await updateDoc(doc(db, 'users', user.uid, 'wardrobe', id), {
          pinned: nextPinned,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, itemPath);
      }
    }
  };

  const handleRequestCommunityItem = async (item: CommunityListingItem) => {
    if (!item.isSeed && user && user.emailVerified && item.ownerUid !== user.uid) {
      const listingPath = `communityListings/${item.id}`;
      try {
        await updateDoc(doc(db, 'communityListings', item.id), {
          status: 'requested',
          requestedByUid: user.uid,
          updatedAt: serverTimestamp(),
        });
        setCommunityFeedback(`Solicitud enviada en ${item.zone}`);
        window.setTimeout(() => setCommunityFeedback(null), 2600);
        return;
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, listingPath);
      }
    }

    setRequestedLocalIds((prev) =>
      prev.includes(item.id) ? prev.filter((x) => x !== item.id) : [...prev, item.id]
    );
    setCommunityFeedback(
      requestedLocalIds.includes(item.id)
        ? 'Solicitud cancelada'
        : `Solicitud enviada a ${item.authorName} (${item.zone})`
    );
    window.setTimeout(() => setCommunityFeedback(null), 2600);
  };

  const handlePublishListing = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = sanitizeInput(pubTitle, VALIDATION_LIMITS.NAME_MAX);
    const cleanSize = sanitizeInput(pubSize, 12) || 'M';
    if (cleanTitle.length < VALIDATION_LIMITS.NAME_MIN) return;

    const listingId = createSafeDocId('lst');

    if (user && user.emailVerified) {
      const listingPath = `communityListings/${listingId}`;
      const authorName = sanitizeInput(
        user.displayName || 'Miembro TU LOOK',
        80
      );
      try {
        await setDoc(doc(db, 'communityListings', listingId), {
          ownerUid: user.uid,
          authorName,
          title: cleanTitle,
          category: pubCategory,
          zone: pubZone,
          exchangeType: pubExchange,
          size: cleanSize,
          condition: 'Como nueva',
          status: 'available',
          requestedByUid: '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, listingPath);
      }
    } else {
      const newLocal: CommunityListingItem = {
        id: listingId,
        ownerUid: 'local-guest',
        authorName: 'Tú (vista previa)',
        title: cleanTitle,
        category: pubCategory,
        zone: pubZone,
        exchangeType: pubExchange,
        size: cleanSize,
        condition: 'Como nueva',
        status: 'available',
        requestedByUid: '',
        isSeed: true,
      };
      setCommunityListings((prev) => [newLocal, ...prev]);
    }

    setPubTitle('');
    setShowPublishForm(false);
    setSelectedZone(pubZone);
    setCommunityFeedback(`Publicada en ${pubZone}`);
    window.setTimeout(() => setCommunityFeedback(null), 2600);
  };

  const handleAddGarment = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = sanitizeInput(newGarmentName, VALIDATION_LIMITS.NAME_MAX);
    if (trimmed.length < VALIDATION_LIMITS.NAME_MIN) return;

    const categoryLabels: Record<Exclude<WardrobeCategory, 'todas'>, string> = {
      abrigos: 'Abrigos',
      superiores: 'Partes de arriba',
      pantalones: 'Pantalones',
      calzado: 'Calzado',
    };

    const newId = createSafeDocId('item');

    if (user && user.emailVerified) {
      const itemPath = `users/${user.uid}/wardrobe/${newId}`;
      try {
        await setDoc(doc(db, 'users', user.uid, 'wardrobe', newId), {
          ownerUid: user.uid,
          name: trimmed,
          category: newGarmentCategory,
          colorName: 'Personal',
          swatchHex: '#7F1D3A',
          wearCount: 1,
          pinned: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, itemPath);
      }
    } else {
      const newItem: WardrobeItem = {
        id: newId,
        name: trimmed,
        category: newGarmentCategory,
        categoryLabel: categoryLabels[newGarmentCategory],
        colorName: 'Personal',
        swatchHex: '#7F1D3A',
        wearCount: 1,
        season: 'Todo el año',
      };
      setWardrobeItems((prev) => [newItem, ...prev]);
      setPinnedItemIds((prev) => [newItem.id, ...prev]);
    }

    setNewGarmentName('');
    setShowAddGarment(false);
    setWardrobeFilter('todas');
  };

  const handleUpdateRequestStatus = async (
    requestId: string,
    nextStatus: 'reviewed' | 'archived'
  ) => {
    const reqPath = `accessRequests/${requestId}`;
    try {
      await updateDoc(doc(db, 'accessRequests', requestId), {
        status: nextStatus,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, reqPath);
    }
  };

  const handleSaveMyAppsUrl = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = myAppsUrlInput.trim();
    if (!trimmed) {
      handleClearMyAppsUrl();
      return;
    }

    try {
      const parsed = new URL(trimmed);
      if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
        setUrlError('Ingresa una dirección válida que comience con https:// o http://');
        return;
      }
      setSavedMyAppsUrl(parsed.toString());
      setUrlError(null);
      try {
        localStorage.setItem(MY_APPS_URL_STORAGE_KEY, parsed.toString());
      } catch {
        // Ignore
      }
      setShowUrlConnector(false);
    } catch {
      setUrlError('El formato de la URL no es válido. Ejemplo: https://tu-look.run.app');
    }
  };

  const handleClearMyAppsUrl = () => {
    setSavedMyAppsUrl('');
    setMyAppsUrlInput('');
    setUrlError(null);
    setShowUrlConnector(false);
    try {
      localStorage.removeItem(MY_APPS_URL_STORAGE_KEY);
    } catch {
      // Ignore
    }
  };

  return (
    <section
      id="la-app"
      className="border-t border-[#E6E2DA] bg-[#F3F1EC] py-20 lg:py-28"
    >
      <div className="mx-auto max-w-[1200px] px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-center">
          {/* Left column: Guided Interactive Controls & My Apps Connector */}
          <div className="lg:col-span-6 space-y-8">
            <div className="space-y-4">
              <p className="text-sm font-medium text-[#7F1D3A]">
                Vista interactiva de la aplicación
              </p>
              <h2 className="font-editorial text-3xl sm:text-4xl lg:text-[44px] font-semibold leading-[1.1] tracking-tight text-[#141413] text-balance">
                Recorre las tres vistas principales de TU LOOK en tiempo real.
              </h2>
              <p className="text-base leading-relaxed text-[#524F49] max-w-xl">
                Cambia entre la sugerencia diaria por ocasión, el inventario de prendas
                y la comunidad local de intercambio en tu zona directamente en el simulador.
              </p>
            </div>

            {/* Interactive Module Switcher */}
            <div className="space-y-3" role="tablist" aria-label="Pantallas de la app TU LOOK">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'hoy'}
                onClick={() => onTabChange('hoy')}
                className={`w-full text-left p-5 rounded-xl border transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7F1D3A] ${
                  activeTab === 'hoy'
                    ? 'bg-white border-[#141413] shadow-sm'
                    : 'bg-[#FAF9F6]/70 border-[#DFDBD2] hover:bg-white'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-[#7F1D3A]">01. Curador diario</span>
                    <h3 className="font-editorial text-xl font-semibold text-[#141413]">
                      Sugerencia de atuendo según clima y ocasión
                    </h3>
                    <p className="text-sm text-[#524F49]">
                      Selecciona ocasión y guarda tus combinaciones favoritas en un toque.
                    </p>
                  </div>
                  <Sun className="w-5 h-5 text-[#141413] shrink-0 mt-1" aria-hidden="true" />
                </div>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'armario'}
                onClick={() => onTabChange('armario')}
                className={`w-full text-left p-5 rounded-xl border transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7F1D3A] ${
                  activeTab === 'armario'
                    ? 'bg-white border-[#141413] shadow-sm'
                    : 'bg-[#FAF9F6]/70 border-[#DFDBD2] hover:bg-white'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-[#7F1D3A]">02. Inventario personal</span>
                    <h3 className="font-editorial text-xl font-semibold text-[#141413]">
                      Armario digital por categoría y frecuencia de uso
                    </h3>
                    <p className="text-sm text-[#524F49]">
                      Filtra abrigos, prendas superiores, pantalones o calzado y añade nuevas piezas.
                    </p>
                  </div>
                  <Shirt className="w-5 h-5 text-[#141413] shrink-0 mt-1" aria-hidden="true" />
                </div>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'comunidad'}
                onClick={() => onTabChange('comunidad')}
                className={`w-full text-left p-5 rounded-xl border transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7F1D3A] ${
                  activeTab === 'comunidad'
                    ? 'bg-white border-[#141413] shadow-sm'
                    : 'bg-[#FAF9F6]/70 border-[#DFDBD2] hover:bg-white'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-[#7F1D3A]">03. Comunidad por zona</span>
                    <h3 className="font-editorial text-xl font-semibold text-[#141413]">
                      Obtén e intercambia prendas cerca de tu ubicación
                    </h3>
                    <p className="text-sm text-[#524F49]">
                      Filtra por comuna o barrio, solicita prendas disponibles y publica piezas para tu zona.
                    </p>
                  </div>
                  <Users className="w-5 h-5 text-[#141413] shrink-0 mt-1" aria-hidden="true" />
                </div>
              </button>
            </div>

            {/* Cloud Sync + My Apps URL Connector */}
            <div className="pt-3 border-t border-[#DFDBD2] space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                {user ? (
                  <>
                    <span className="text-xs text-[#524F49]">
                      Conectado como{' '}
                      <strong className="text-[#141413] font-medium">
                        {user.displayName || user.email}
                      </strong>
                    </span>
                    {isVerifiedAdmin && (
                      <button
                        type="button"
                        onClick={() => setShowAdminInbox((prev) => !prev)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#141413] bg-white text-xs font-medium text-[#141413] hover:bg-[#FAF9F6] transition-colors whitespace-nowrap"
                      >
                        <Shield className="w-3.5 h-3.5 text-[#7F1D3A]" aria-hidden="true" />
                        <span>
                          {showAdminInbox ? 'Ocultar solicitudes' : 'Solicitudes recibidas'}
                        </span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-[#6E6A61] hover:text-[#141413] transition-colors whitespace-nowrap"
                    >
                      <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Cerrar sesión</span>
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#141413] bg-white text-xs font-medium text-[#141413] hover:bg-[#FAF9F6] transition-colors whitespace-nowrap shrink-0"
                  >
                    <LogIn className="w-3.5 h-3.5 text-[#7F1D3A]" aria-hidden="true" />
                    <span>Conectar cuenta Google (Armario y Comunidad)</span>
                  </button>
                )}
              </div>

              {authError && (
                <p className="text-xs text-[#991B1B]" role="alert">
                  {authError}
                </p>
              )}

              {showAdminInbox && isVerifiedAdmin && (
                <div className="p-4 bg-white rounded-xl border border-[#DFDBD2] space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-[#141413]">
                      Solicitudes de acceso guardadas en Firestore
                    </p>
                    <span className="text-xs text-[#6E6A61] tabular-nums">
                      {adminRequests.length} registros
                    </span>
                  </div>
                  {adminRequests.length === 0 ? (
                    <p className="text-xs text-[#6E6A61]">
                      Aún no hay solicitudes registradas en la base de datos.
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto">
                      {adminRequests.map((req) => (
                        <div
                          key={req.id}
                          className="p-3 rounded-lg bg-[#FAF9F6] border border-[#E6E2DA] flex items-center justify-between gap-3"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-[#141413] truncate">
                              {req.name} · {req.platform}
                            </p>
                            <p className="text-[11px] text-[#524F49] truncate">
                              {req.email} · Estado: {req.status}
                            </p>
                          </div>
                          {req.status === 'pending' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateRequestStatus(req.id, 'reviewed')}
                              className="px-2.5 py-1 text-[11px] font-medium bg-[#141413] text-white rounded-md hover:bg-[#2E2D2B] whitespace-nowrap shrink-0"
                            >
                              Marcar revisada
                            </button>
                          )}
                          {req.status === 'reviewed' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateRequestStatus(req.id, 'archived')}
                              className="px-2.5 py-1 text-[11px] font-medium border border-[#D8D3C8] text-[#141413] rounded-md hover:border-[#141413] whitespace-nowrap shrink-0"
                            >
                              Archivar
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-4">
                {savedMyAppsUrl ? (
                  <a
                    href={savedMyAppsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#7F1D3A] text-white text-sm font-medium hover:bg-[#67162E] transition-colors whitespace-nowrap shrink-0"
                  >
                    <span>Abrir tu app en My Apps</span>
                    <ExternalLink className="w-4 h-4" aria-hidden="true" />
                  </a>
                ) : null}

                <button
                  type="button"
                  onClick={() => setShowUrlConnector((prev) => !prev)}
                  className="inline-flex items-center gap-2 text-sm font-medium text-[#141413] underline underline-offset-4 hover:text-[#7F1D3A] transition-colors whitespace-nowrap shrink-0"
                >
                  <Link2 className="w-4 h-4" aria-hidden="true" />
                  <span>
                    {savedMyAppsUrl
                      ? 'Editar enlace de My Apps'
                      : 'Vincular URL de tu app en My Apps'}
                  </span>
                </button>

                {savedMyAppsUrl && (
                  <button
                    type="button"
                    onClick={handleClearMyAppsUrl}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-[#6E6A61] hover:text-[#991B1B] transition-colors whitespace-nowrap shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Quitar enlace</span>
                  </button>
                )}
              </div>

              {showUrlConnector && (
                <form
                  onSubmit={handleSaveMyAppsUrl}
                  className="p-4 bg-white rounded-xl border border-[#DFDBD2] space-y-3"
                >
                  <label
                    htmlFor="my-apps-url"
                    className="block text-xs font-medium text-[#524F49]"
                  >
                    Pega aquí la URL compartida de tu proyecto TU LOOK desde My Apps
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      id="my-apps-url"
                      type="url"
                      value={myAppsUrlInput}
                      onChange={(e) => setMyAppsUrlInput(e.target.value)}
                      placeholder="https://ais-pre-...run.app"
                      className="flex-1 min-w-0 px-3.5 py-2 text-sm bg-[#FAF9F6] border border-[#D8D3C8] rounded-lg text-[#141413] placeholder:text-[#8E8980] focus:outline-none focus:border-[#7F1D3A]"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm font-medium bg-[#141413] text-white rounded-lg hover:bg-[#2E2D2B] transition-colors whitespace-nowrap shrink-0"
                    >
                      Guardar enlace
                    </button>
                  </div>
                  {urlError && (
                    <p className="text-xs text-[#991B1B]" role="alert">
                      {urlError}
                    </p>
                  )}
                </form>
              )}
            </div>
          </div>

          {/* Right column: Realistic Mobile Device Frame Running TU LOOK */}
          <div className="lg:col-span-6 flex justify-center">
            <div className="w-full max-w-[390px] rounded-[34px] border border-[#2C2B29] bg-[#141413] p-3 shadow-xl">
              <div className="rounded-[26px] bg-[#FAF9F6] overflow-hidden flex flex-col min-h-[640px]">
                {/* App Top Bar */}
                <div className="px-5 pt-5 pb-3 border-b border-[#E6E2DA] flex items-center justify-between bg-white">
                  <span className="font-editorial text-xl font-bold tracking-tight text-[#141413]">
                    TU LOOK
                  </span>
                  <div className="flex items-center gap-2 text-xs text-[#524F49] tabular-nums">
                    <span>
                      {selectedZone === 'Todas' ? 'Santiago' : selectedZone}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{currentLook.temperature}</span>
                  </div>
                </div>

                {/* App Segmented Navigation */}
                <div className="px-4 py-2.5 bg-white border-b border-[#E6E2DA]">
                  <div className="grid grid-cols-3 gap-1 p-1 bg-[#F3F1EC] rounded-lg">
                    <button
                      type="button"
                      onClick={() => onTabChange('hoy')}
                      className={`py-1.5 px-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                        activeTab === 'hoy'
                          ? 'bg-white text-[#141413] shadow-sm'
                          : 'text-[#524F49] hover:text-[#141413]'
                      }`}
                    >
                      Hoy
                    </button>
                    <button
                      type="button"
                      onClick={() => onTabChange('armario')}
                      className={`py-1.5 px-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                        activeTab === 'armario'
                          ? 'bg-white text-[#141413] shadow-sm'
                          : 'text-[#524F49] hover:text-[#141413]'
                      }`}
                    >
                      Armario
                    </button>
                    <button
                      type="button"
                      onClick={() => onTabChange('comunidad')}
                      className={`py-1.5 px-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                        activeTab === 'comunidad'
                          ? 'bg-white text-[#141413] shadow-sm'
                          : 'text-[#524F49] hover:text-[#141413]'
                      }`}
                    >
                      Comunidad
                    </button>
                  </div>
                </div>

                {/* Screen Body */}
                <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                  {activeTab === 'hoy' && (
                    <div className="space-y-4">
                      {/* Occasion Filter Buttons */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-[#524F49]">Ocasión</span>
                        <div className="flex items-center gap-1">
                          {(['oficina', 'cena', 'fin-de-semana'] as OccasionType[]).map(
                            (occ) => (
                              <button
                                key={occ}
                                type="button"
                                onClick={() => onOccasionChange(occ)}
                                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                                  selectedOccasion === occ
                                    ? 'bg-[#7F1D3A] text-white'
                                    : 'bg-[#ECE9E1] text-[#3F3D38] hover:bg-[#E2DFD6]'
                                }`}
                              >
                                {occ === 'oficina'
                                  ? 'Oficina'
                                  : occ === 'cena'
                                  ? 'Cena'
                                  : 'Descanso'}
                              </button>
                            )
                          )}
                        </div>
                      </div>

                      {/* Look Photo */}
                      <div className="relative rounded-2xl overflow-hidden border border-[#E6E2DA] bg-white">
                        <div className="aspect-[4/3] w-full overflow-hidden">
                          <ResilientImage
                            src={currentLook.image}
                            alt={currentLook.imageAlt}
                            className="w-full h-full object-cover object-top"
                            fallbackLabel={currentLook.title}
                          />
                        </div>
                        <div className="p-3.5 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-xs text-[#524F49]">
                                {currentLook.occasionLabel} · {currentLook.weatherLabel}
                              </p>
                              <h4 className="font-editorial text-xl font-semibold text-[#141413]">
                                {currentLook.title}
                              </h4>
                            </div>
                            <button
                              type="button"
                              onClick={() => toggleSaveLook(currentLook.id)}
                              aria-label={isSaved ? 'Quitar de guardados' : 'Guardar look'}
                              className={`p-2 rounded-lg border transition-colors shrink-0 ${
                                isSaved
                                  ? 'bg-[#7F1D3A] border-[#7F1D3A] text-white'
                                  : 'bg-white border-[#DFDBD2] text-[#141413] hover:border-[#141413]'
                              }`}
                            >
                              <Bookmark className="w-4 h-4" aria-hidden="true" />
                            </button>
                          </div>

                          <p className="text-xs leading-relaxed text-[#524F49]">
                            {currentLook.stylingNote}
                          </p>

                          <ul className="pt-2 border-t border-[#ECE9E1] space-y-1">
                            {currentLook.pieces.map((piece) => (
                              <li
                                key={piece}
                                className="text-xs text-[#2B2A27] flex items-center justify-between"
                              >
                                <span>{piece}</span>
                                <span className="text-[#7F1D3A]">En armario</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Direct Shortcut to Community */}
                      <button
                        type="button"
                        onClick={() => onTabChange('comunidad')}
                        className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white border border-[#DFDBD2] text-xs font-medium text-[#141413] hover:border-[#7F1D3A] transition-colors"
                      >
                        <span className="inline-flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-[#7F1D3A]" aria-hidden="true" />
                          <span>Buscar piezas similares en tu zona</span>
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-[#7F1D3A]" aria-hidden="true" />
                      </button>
                    </div>
                  )}

                  {activeTab === 'armario' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-[#524F49]">
                          <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>{pinnedItemIds.length} elegidas hoy</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowAddGarment((prev) => !prev)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-[#7F1D3A] text-white hover:bg-[#67162E] transition-colors whitespace-nowrap"
                        >
                          <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>{showAddGarment ? 'Cerrar' : 'Nueva prenda'}</span>
                        </button>
                      </div>

                      {showAddGarment && (
                        <form
                          onSubmit={handleAddGarment}
                          className="p-3 bg-white rounded-xl border border-[#DFDBD2] space-y-2"
                        >
                          <input
                            type="text"
                            maxLength={VALIDATION_LIMITS.NAME_MAX}
                            value={newGarmentName}
                            onChange={(e) => setNewGarmentName(e.target.value)}
                            placeholder="Ej. Chaqueta de lino beige"
                            className="w-full px-3 py-1.5 text-xs bg-[#FAF9F6] border border-[#D8D3C8] rounded-md text-[#141413] focus:outline-none focus:border-[#7F1D3A]"
                          />
                          <div className="flex items-center gap-2">
                            <select
                              value={newGarmentCategory}
                              onChange={(e) =>
                                setNewGarmentCategory(
                                  e.target.value as Exclude<WardrobeCategory, 'todas'>
                                )
                              }
                              aria-label="Categoría de prenda"
                              className="flex-1 px-2.5 py-1.5 text-xs bg-[#FAF9F6] border border-[#D8D3C8] rounded-md text-[#141413] focus:outline-none focus:border-[#7F1D3A]"
                            >
                              <option value="abrigos">Abrigos</option>
                              <option value="superiores">Partes de arriba</option>
                              <option value="pantalones">Pantalones</option>
                              <option value="calzado">Calzado</option>
                            </select>
                            <button
                              type="submit"
                              className="px-3 py-1.5 text-xs font-medium bg-[#141413] text-white rounded-md hover:bg-[#2E2D2B] transition-colors whitespace-nowrap"
                            >
                              Guardar
                            </button>
                          </div>
                        </form>
                      )}

                      <div className="flex flex-wrap gap-1.5">
                        {(
                          [
                            ['todas', 'Todas'],
                            ['abrigos', 'Abrigos'],
                            ['superiores', 'Arriba'],
                            ['pantalones', 'Pantalones'],
                            ['calzado', 'Calzado'],
                          ] as [WardrobeCategory, string][]
                        ).map(([key, label]) => (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setWardrobeFilter(key)}
                            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                              wardrobeFilter === key
                                ? 'bg-[#141413] text-white'
                                : 'bg-[#ECE9E1] text-[#3F3D38] hover:bg-[#E2DFD6]'
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>

                      <div className="space-y-2 pt-1">
                        {filteredWardrobe.map((item) => {
                          const isPinned = pinnedItemIds.includes(item.id);
                          return (
                            <div
                              key={item.id}
                              className="flex items-center justify-between gap-3 p-3 bg-white rounded-xl border border-[#E6E2DA]"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <span
                                  className="w-6 h-6 rounded-md border border-[#D8D3C8] shrink-0"
                                  style={{ backgroundColor: item.swatchHex }}
                                  aria-hidden="true"
                                />
                                <div className="min-w-0">
                                  <p className="text-xs font-semibold text-[#141413] truncate">
                                    {item.name}
                                  </p>
                                  <p className="text-[11px] text-[#524F49] tabular-nums">
                                    {item.categoryLabel} · {item.wearCount} usos
                                  </p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => togglePinItem(item.id)}
                                className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 ${
                                  isPinned
                                    ? 'bg-[#7F1D3A] border-[#7F1D3A] text-white'
                                    : 'bg-[#FAF9F6] border-[#DFDBD2] text-[#141413] hover:border-[#141413]'
                                }`}
                              >
                                {isPinned ? 'Elegida' : 'Añadir'}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {activeTab === 'comunidad' && (
                    <div className="space-y-3">
                      {/* Zone Selector & Publish Button */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                          <MapPin
                            className="w-3.5 h-3.5 text-[#7F1D3A] shrink-0"
                            aria-hidden="true"
                          />
                          <select
                            aria-label="Filtrar por zona"
                            value={selectedZone}
                            onChange={(e) =>
                              setSelectedZone(e.target.value as 'Todas' | CommunityZone)
                            }
                            className="w-full px-2.5 py-1.5 text-xs font-medium bg-white border border-[#D8D3C8] rounded-md text-[#141413] focus:outline-none focus:border-[#7F1D3A]"
                          >
                            <option value="Todas">Todas las zonas</option>
                            {COMMUNITY_ZONES.map((zone) => (
                              <option key={zone} value={zone}>
                                {zone}
                              </option>
                            ))}
                          </select>
                        </div>

                        <button
                          type="button"
                          onClick={() => setShowPublishForm((prev) => !prev)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md bg-[#7F1D3A] text-white hover:bg-[#67162E] transition-colors whitespace-nowrap shrink-0"
                        >
                          <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>{showPublishForm ? 'Cerrar' : 'Publicar'}</span>
                        </button>
                      </div>

                      {/* Publish Garment to Community Form */}
                      {showPublishForm && (
                        <form
                          onSubmit={handlePublishListing}
                          className="p-3 bg-white rounded-xl border border-[#DFDBD2] space-y-2"
                        >
                          <input
                            type="text"
                            maxLength={VALIDATION_LIMITS.NAME_MAX}
                            value={pubTitle}
                            onChange={(e) => setPubTitle(e.target.value)}
                            placeholder="Ej. Chaqueta denim clásica"
                            className="w-full px-3 py-1.5 text-xs bg-[#FAF9F6] border border-[#D8D3C8] rounded-md text-[#141413] focus:outline-none focus:border-[#7F1D3A]"
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <select
                              aria-label="Zona de publicación"
                              value={pubZone}
                              onChange={(e) => setPubZone(e.target.value as CommunityZone)}
                              className="px-2 py-1.5 text-xs bg-[#FAF9F6] border border-[#D8D3C8] rounded-md text-[#141413]"
                            >
                              {COMMUNITY_ZONES.map((zone) => (
                                <option key={zone} value={zone}>
                                  {zone}
                                </option>
                              ))}
                            </select>
                            <select
                              aria-label="Modalidad"
                              value={pubExchange}
                              onChange={(e) =>
                                setPubExchange(e.target.value as ExchangeType)
                              }
                              className="px-2 py-1.5 text-xs bg-[#FAF9F6] border border-[#D8D3C8] rounded-md text-[#141413]"
                            >
                              <option value="Intercambio">Intercambio</option>
                              <option value="Préstamo">Préstamo</option>
                              <option value="Venta local">Venta local</option>
                            </select>
                          </div>
                          <div className="flex items-center gap-2">
                            <select
                              aria-label="Categoría"
                              value={pubCategory}
                              onChange={(e) =>
                                setPubCategory(
                                  e.target.value as Exclude<WardrobeCategory, 'todas'>
                                )
                              }
                              className="flex-1 px-2 py-1.5 text-xs bg-[#FAF9F6] border border-[#D8D3C8] rounded-md text-[#141413]"
                            >
                              <option value="abrigos">Abrigos</option>
                              <option value="superiores">Partes de arriba</option>
                              <option value="pantalones">Pantalones</option>
                              <option value="calzado">Calzado</option>
                            </select>
                            <input
                              type="text"
                              maxLength={12}
                              value={pubSize}
                              onChange={(e) => setPubSize(e.target.value)}
                              placeholder="Talla"
                              aria-label="Talla"
                              className="w-16 px-2 py-1.5 text-xs bg-[#FAF9F6] border border-[#D8D3C8] rounded-md text-[#141413]"
                            />
                            <button
                              type="submit"
                              className="px-3 py-1.5 text-xs font-medium bg-[#141413] text-white rounded-md hover:bg-[#2E2D2B] whitespace-nowrap"
                            >
                              Subir
                            </button>
                          </div>
                        </form>
                      )}

                      {/* Exchange Type Filter Buttons */}
                      <div className="flex flex-wrap gap-1.5">
                        {(['Todos', 'Intercambio', 'Préstamo', 'Venta local'] as const).map(
                          (type) => (
                            <button
                              key={type}
                              type="button"
                              onClick={() => setSelectedExchange(type)}
                              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                                selectedExchange === type
                                  ? 'bg-[#141413] text-white'
                                  : 'bg-[#ECE9E1] text-[#3F3D38] hover:bg-[#E2DFD6]'
                              }`}
                            >
                              {type}
                            </button>
                          )
                        )}
                      </div>

                      {communityFeedback && (
                        <div className="px-3 py-2 rounded-lg bg-white border border-[#7F1D3A] text-xs font-medium text-[#7F1D3A] flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                          <span>{communityFeedback}</span>
                        </div>
                      )}

                      {/* Listings List */}
                      <div className="space-y-2">
                        {filteredCommunity.length === 0 ? (
                          <div className="p-4 bg-white rounded-xl border border-[#E6E2DA] text-xs text-[#524F49] text-center">
                            No hay prendas con ese filtro en esta zona todavía.
                          </div>
                        ) : (
                          filteredCommunity.map((item) => {
                            const isRequested =
                              item.status === 'requested' ||
                              requestedLocalIds.includes(item.id);
                            return (
                              <div
                                key={item.id}
                                className="p-3 bg-white rounded-xl border border-[#E6E2DA] space-y-2"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0">
                                    <p className="text-[11px] font-medium text-[#7F1D3A]">
                                      {item.zone} · {item.exchangeType} · Talla {item.size}
                                    </p>
                                    <p className="text-xs font-semibold text-[#141413] truncate">
                                      {item.title}
                                    </p>
                                    <p className="text-[11px] text-[#6E6A61]">
                                      {item.authorName} · {item.condition}
                                    </p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleRequestCommunityItem(item)}
                                    className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 ${
                                      isRequested
                                        ? 'bg-[#7F1D3A] border-[#7F1D3A] text-white'
                                        : 'bg-[#FAF9F6] border-[#DFDBD2] text-[#141413] hover:border-[#7F1D3A]'
                                    }`}
                                  >
                                    {isRequested ? 'Solicitada' : 'Solicitar'}
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
