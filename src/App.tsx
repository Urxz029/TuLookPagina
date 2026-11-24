/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import {
  BENTO_FLATLAY_IMAGE,
  HERO_WARDROBE_IMAGE,
  LOOKBOOK_STORIES,
  type OccasionType,
} from './data/tuLookData';
import { ResilientImage } from './components/ResilientImage';
import { AppInteractiveDemo, type AppTab } from './components/AppInteractiveDemo';
import { AccessForm } from './components/AccessForm';

interface PaletteTone {
  id: string;
  name: string;
  hex: string;
  pairing: string;
  targetOccasion: OccasionType;
}

const PALETTE_TONES: PaletteTone[] = [
  {
    id: 'marfil',
    name: 'Marfil',
    hex: '#FAF9F6',
    pairing: 'Combina con lana carbón y lino arena para oficina.',
    targetOccasion: 'oficina',
  },
  {
    id: 'arena',
    name: 'Arena',
    hex: '#D1C4B2',
    pairing: 'Base neutra cálida ideal para entretiempo y camisas blancas.',
    targetOccasion: 'oficina',
  },
  {
    id: 'camel',
    name: 'Camel',
    hex: '#B68F66',
    pairing: 'Protagonista en gabardinas y capas de fin de semana.',
    targetOccasion: 'fin-de-semana',
  },
  {
    id: 'borgona',
    name: 'Borgoña',
    hex: '#7F1D3A',
    pairing: 'Tono de acento profundo para cenas y eventos de galería.',
    targetOccasion: 'cena',
  },
  {
    id: 'carbon',
    name: 'Carbón',
    hex: '#141413',
    pairing: 'Estructura clásica en sastrería y calzado de piel.',
    targetOccasion: 'oficina',
  },
];

const STORY_OCCASION_MAP: Record<string, OccasionType> = {
  'story-1': 'oficina',
  'story-2': 'fin-de-semana',
  'story-3': 'cena',
};

export default function App() {
  const [activeStoryId, setActiveStoryId] = useState<string>(LOOKBOOK_STORIES[0].id);
  const [simulatorTab, setSimulatorTab] = useState<AppTab>('hoy');
  const [simulatorOccasion, setSimulatorOccasion] = useState<OccasionType>('oficina');
  const [selectedPaletteId, setSelectedPaletteId] = useState<string>('borgona');

  const activePalette =
    PALETTE_TONES.find((tone) => tone.id === selectedPaletteId) ?? PALETTE_TONES[3];

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const openSimulatorAt = (tab: AppTab, occasion?: OccasionType) => {
    setSimulatorTab(tab);
    if (occasion) {
      setSimulatorOccasion(occasion);
    }
    scrollToSection('la-app');
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#141413]">
      {/* Strict 3-Zone Top Bar */}
      <header className="sticky top-0 z-40 h-16 bg-[#FAF9F6]/95 backdrop-blur-sm border-b border-[#E6E2DA]">
        <div className="mx-auto max-w-[1200px] h-full px-6 lg:px-8 flex items-center justify-between gap-8">
          {/* Zone 1: Single text wordmark */}
          <a
            href="#inicio"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection('inicio');
            }}
            className="font-editorial text-2xl font-bold tracking-tight text-[#141413] whitespace-nowrap shrink-0"
          >
            TU LOOK
          </a>

          {/* Zone 2: 4 single-line nav links */}
          <nav
            aria-label="Navegación principal"
            className="hidden md:flex items-center gap-7 text-sm font-medium text-[#524F49]"
          >
            <a
              href="#la-app"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection('la-app');
              }}
              className="hover:text-[#141413] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              La App
            </a>
            <a
              href="#funciones"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection('funciones');
              }}
              className="hover:text-[#141413] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Funciones
            </a>
            <a
              href="#lookbook"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection('lookbook');
              }}
              className="hover:text-[#141413] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Lookbook
            </a>
            <a
              href="#acceso"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection('acceso');
              }}
              className="hover:text-[#141413] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Acceso
            </a>
          </nav>

          {/* Zone 3: Single primary action */}
          <div className="shrink-0">
            <button
              type="button"
              onClick={() => openSimulatorAt('hoy')}
              className="px-4 py-2 text-xs sm:text-sm font-medium text-white bg-[#7F1D3A] rounded-lg hover:bg-[#67162E] transition-colors whitespace-nowrap shrink-0"
            >
              Probar TU LOOK
            </button>
          </div>
        </div>
      </header>

      <main id="inicio">
        {/* Hero Section: Asymmetric Split + Full-Width Proof Strip */}
        <section className="pt-12 pb-16 lg:pt-20 lg:pb-24">
          <div className="mx-auto max-w-[1200px] px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12 lg:items-stretch">
              <div className="lg:col-span-6 flex flex-col justify-between py-2 space-y-8">
                <div className="space-y-6">
                  <p className="text-sm font-medium text-[#7F1D3A]">
                    Aplicación de guardarropa y comunidad local
                  </p>
                  <h1 className="font-editorial text-[clamp(2.25rem,4vw,3.75rem)] font-semibold leading-[1.06] tracking-tight text-[#141413] text-balance">
                    Tu guardarropa, curado con intención cada mañana.
                  </h1>
                  <p className="text-base sm:text-lg leading-relaxed text-[#524F49] max-w-xl">
                    TU LOOK digitaliza las prendas que ya tienes, diseña combinaciones
                    adaptadas al clima y te conecta con tu comunidad cercana para
                    obtener, prestar o intercambiar piezas en tu zona.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-6 pt-2">
                  <button
                    type="button"
                    onClick={() => openSimulatorAt('hoy')}
                    className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-lg bg-[#141413] text-white text-sm font-medium hover:bg-[#2E2D2B] transition-colors whitespace-nowrap shrink-0"
                  >
                    <span>Explorar la app</span>
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </button>
                  <a
                    href="#funciones"
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToSection('funciones');
                    }}
                    className="text-sm font-medium text-[#141413] underline underline-offset-4 hover:text-[#7F1D3A] transition-colors whitespace-nowrap shrink-0"
                  >
                    Ver capacidades completas
                  </a>
                </div>
              </div>

              <div className="lg:col-span-6">
                <div className="h-full min-h-[340px] lg:min-h-[460px] rounded-2xl overflow-hidden border border-[#E2DED5] bg-[#F3F1EC]">
                  <ResilientImage
                    src={HERO_WARDROBE_IMAGE}
                    alt="Vestidor minimalista con abrigos neutros, camisas de lino y calzado de piel organizados"
                    className="w-full h-full object-cover"
                    fallbackLabel="TU LOOK — Vestidor Editorial"
                  />
                </div>
              </div>
            </div>

            {/* Full-Width 4-Column Proof Strip */}
            <div className="mt-14 pt-8 border-t border-[#E6E2DA] grid grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="space-y-1">
                <p className="font-editorial text-3xl sm:text-4xl font-semibold text-[#141413] tabular-nums">
                  4 min
                </p>
                <p className="text-xs sm:text-sm text-[#524F49]">
                  Tiempo promedio para elegir atuendo diario
                </p>
              </div>
              <div className="space-y-1">
                <p className="font-editorial text-3xl sm:text-4xl font-semibold text-[#141413] tabular-nums">
                  +68 %
                </p>
                <p className="text-xs sm:text-sm text-[#524F49]">
                  Mayor rotación de prendas en los primeros 60 días
                </p>
              </div>
              <div className="space-y-1">
                <p className="font-editorial text-3xl sm:text-4xl font-semibold text-[#141413] tabular-nums">
                  3 pasos
                </p>
                <p className="text-xs sm:text-sm text-[#524F49]">
                  Para registrar una prenda o publicarla en tu barrio
                </p>
              </div>
              <div className="space-y-1">
                <p className="font-editorial text-3xl sm:text-4xl font-semibold text-[#141413] tabular-nums">
                  5 zonas
                </p>
                <p className="text-xs sm:text-sm text-[#524F49]">
                  Comunidad activa para intercambio y préstamo local
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Interactive App Showcase Section */}
        <AppInteractiveDemo
          activeTab={simulatorTab}
          onTabChange={setSimulatorTab}
          selectedOccasion={simulatorOccasion}
          onOccasionChange={setSimulatorOccasion}
        />

        {/* Capabilities Asymmetric Bento Grid */}
        <section id="funciones" className="py-20 lg:py-28 bg-[#FAF9F6]">
          <div className="mx-auto max-w-[1200px] px-6 lg:px-8 space-y-12">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
              <div className="space-y-3 max-w-2xl">
                <p className="text-sm font-medium text-[#7F1D3A]">
                  Arquitectura de la aplicación
                </p>
                <h2 className="font-editorial text-3xl sm:text-4xl lg:text-[44px] font-semibold leading-[1.1] tracking-tight text-[#141413] text-balance">
                  Cuatro herramientas diseñadas para vestir mejor y compartir en tu zona.
                </h2>
              </div>
              <p className="text-sm text-[#524F49] max-w-sm leading-relaxed">
                Cada módulo de TU LOOK responde a un momento real: catalogar,
                combinar, vestir según el clima y conseguir piezas en tu comunidad cercana.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Large Marquee Bento Card */}
              <article className="lg:col-span-2 rounded-2xl border border-[#E2DED5] bg-white overflow-hidden flex flex-col">
                <div className="aspect-[16/9] w-full overflow-hidden border-b border-[#E6E2DA]">
                  <ResilientImage
                    src={BENTO_FLATLAY_IMAGE}
                    alt="Prendas básicas dobladas sobre lino claro: camisa blanca, denim, cárdigan gris y zapatillas"
                    className="w-full h-full object-cover"
                    fallbackLabel="01. Digitalización y Cápsulas"
                  />
                </div>
                <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between gap-6">
                  <div className="space-y-3">
                    <h3 className="font-editorial text-2xl sm:text-3xl font-semibold text-[#141413]">
                      01. Digitalización instantánea y maleta inteligente
                    </h3>
                    <p className="text-sm sm:text-base leading-relaxed text-[#524F49] max-w-2xl">
                      Fotografía tus prendas con recorte limpio de fondo, clasifícalas por
                      tela y temporada, y genera listas de viaje de 6 a 10 piezas capaces
                      de armar hasta 15 conjuntos distintos.
                    </p>
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => openSimulatorAt('armario')}
                      className="inline-flex items-center gap-2 text-sm font-medium text-[#7F1D3A] hover:underline underline-offset-4"
                    >
                      <span>Abrir inventario de prendas en el simulador</span>
                      <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </article>

              {/* Stacked Side Cards */}
              <div className="flex flex-col gap-6">
                <article className="flex-1 rounded-2xl border border-[#E2DED5] bg-white p-6 sm:p-7 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <span className="text-xs font-medium text-[#7F1D3A]">
                      Motor climático
                    </span>
                    <h3 className="font-editorial text-2xl font-semibold text-[#141413]">
                      02. Reglas de clima y capas
                    </h3>
                    <p className="text-sm leading-relaxed text-[#524F49]">
                      Cruza temperatura mínima, probabilidad de lluvia y tipo de evento
                      para recomendar abrigos ligeros o calzado impermeable antes de salir.
                    </p>
                  </div>
                  <div className="pt-4 border-t border-[#ECE9E1] flex items-center justify-between gap-2">
                    <span className="text-xs text-[#6E6A61] tabular-nums">
                      07:00 AM
                    </span>
                    <button
                      type="button"
                      onClick={() => openSimulatorAt('hoy', 'fin-de-semana')}
                      className="text-xs font-medium text-[#7F1D3A] hover:underline underline-offset-4 whitespace-nowrap"
                    >
                      Probar look de lluvia
                    </button>
                  </div>
                </article>

                <article className="flex-1 rounded-2xl border border-[#E2DED5] bg-[#F3F1EC] p-6 sm:p-7 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <span className="text-xs font-medium text-[#7F1D3A]">
                      Moda circular local
                    </span>
                    <h3 className="font-editorial text-2xl font-semibold text-[#141413]">
                      03. Comunidad por zona
                    </h3>
                    <p className="text-sm leading-relaxed text-[#524F49]">
                      Encuentra o publica prendas disponibles en tu comuna para
                      intercambio, préstamo puntual o compra local sin envíos largos.
                    </p>
                  </div>
                  <div className="pt-4 border-t border-[#DFDBD2] flex items-center justify-between gap-2">
                    <span className="text-xs text-[#6E6A61]">
                      Entrega en tu barrio
                    </span>
                    <button
                      type="button"
                      onClick={() => openSimulatorAt('comunidad')}
                      className="text-xs font-medium text-[#7F1D3A] hover:underline underline-offset-4 whitespace-nowrap"
                    >
                      Explorar prendas en tu zona
                    </button>
                  </div>
                </article>
              </div>

              {/* Bottom Wide Feature Row with Interactive Color Palette */}
              <article className="lg:col-span-3 rounded-2xl border border-[#E2DED5] bg-white p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2 max-w-2xl">
                  <h3 className="font-editorial text-2xl sm:text-3xl font-semibold text-[#141413]">
                    04. Paleta cromática personal y equilibrio de proporciones
                  </h3>
                  <p className="text-sm sm:text-base leading-relaxed text-[#524F49]">
                    <span className="font-medium text-[#141413]">
                      {activePalette.name} ({activePalette.hex}):
                    </span>{' '}
                    {activePalette.pairing}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-4 shrink-0">
                  <div
                    className="flex items-center gap-2.5"
                    role="group"
                    aria-label="Seleccionar tono de paleta de TU LOOK"
                  >
                    {PALETTE_TONES.map((tone) => {
                      const isSelected = tone.id === activePalette.id;
                      return (
                        <button
                          key={tone.id}
                          type="button"
                          onClick={() => setSelectedPaletteId(tone.id)}
                          aria-label={`Seleccionar tono ${tone.name}`}
                          aria-pressed={isSelected}
                          className={`w-9 h-9 rounded-full border transition-transform ${
                            isSelected
                              ? 'ring-2 ring-offset-2 ring-[#7F1D3A] scale-105 border-[#141413]'
                              : 'border-[#D8D3C8] hover:scale-105'
                          }`}
                          style={{ backgroundColor: tone.hex }}
                        />
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    onClick={() => openSimulatorAt('hoy', activePalette.targetOccasion)}
                    className="px-4 py-2 text-xs font-medium rounded-lg border border-[#D8D3C8] text-[#141413] hover:border-[#7F1D3A] hover:text-[#7F1D3A] transition-colors whitespace-nowrap shrink-0"
                  >
                    Ver look con {activePalette.name}
                  </button>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* Editorial Lookbook & Attributable Proof */}
        <section
          id="lookbook"
          className="border-t border-[#E6E2DA] bg-[#F3F1EC] py-20 lg:py-28"
        >
          <div className="mx-auto max-w-[1200px] px-6 lg:px-8 space-y-12">
            <div className="space-y-3 max-w-2xl">
              <p className="text-sm font-medium text-[#7F1D3A]">
                Casos reales y Lookbook
              </p>
              <h2 className="font-editorial text-3xl sm:text-4xl lg:text-[44px] font-semibold leading-[1.1] tracking-tight text-[#141413] text-balance">
                Conjuntos creados dentro de la aplicación por su comunidad.
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {LOOKBOOK_STORIES.map((story) => {
                const isActive = activeStoryId === story.id;
                const mappedOccasion = STORY_OCCASION_MAP[story.id] ?? 'oficina';
                return (
                  <article
                    key={story.id}
                    className={`rounded-2xl border bg-white overflow-hidden flex flex-col transition-colors ${
                      isActive ? 'border-[#141413]' : 'border-[#E2DED5]'
                    }`}
                  >
                    <div className="aspect-[3/4] w-full overflow-hidden border-b border-[#E6E2DA]">
                      <ResilientImage
                        src={story.image}
                        alt={story.imageAlt}
                        className="w-full h-full object-cover object-top"
                        fallbackLabel={story.title}
                      />
                    </div>

                    <div className="p-6 flex-1 flex flex-col justify-between space-y-6">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-xs text-[#524F49]">
                          <span>{story.index}</span>
                          <span aria-hidden="true">·</span>
                          <span>{story.category}</span>
                          <span aria-hidden="true">·</span>
                          <span>{story.climateNote}</span>
                        </div>
                        <h3 className="font-editorial text-2xl font-semibold text-[#141413]">
                          {story.title}
                        </h3>
                        <p className="text-sm leading-relaxed text-[#524F49]">
                          {story.description}
                        </p>

                        {isActive && (
                          <div className="pt-2 space-y-2">
                            <p className="text-xs font-medium text-[#7F1D3A]">
                              Prendas incluidas en este look
                            </p>
                            <p className="text-xs text-[#141413]">
                              {story.pieces.join(' · ')}
                            </p>
                            <button
                              type="button"
                              onClick={() => openSimulatorAt('hoy', mappedOccasion)}
                              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#7F1D3A] hover:underline underline-offset-4"
                            >
                              <span>Cargar este look en la app</span>
                              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="pt-5 border-t border-[#ECE9E1] space-y-4">
                        <blockquote className="text-sm italic leading-relaxed text-[#2B2A27]">
                          “{story.quote}”
                        </blockquote>
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="text-xs font-semibold text-[#141413]">
                              {story.authorName}
                            </p>
                            <p className="text-xs text-[#6E6A61]">{story.authorRole}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setActiveStoryId(story.id)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 ${
                              isActive
                                ? 'bg-[#141413] border-[#141413] text-white'
                                : 'bg-[#FAF9F6] border-[#DFDBD2] text-[#141413] hover:border-[#141413]'
                            }`}
                          >
                            {isActive ? 'Prendas visibles' : 'Ver prendas'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* Access / Contact Conversion Section */}
        <section id="acceso" className="py-20 lg:py-28 bg-[#FAF9F6]">
          <div className="mx-auto max-w-[1200px] px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:items-start">
              <div className="lg:col-span-5 space-y-4">
                <p className="text-sm font-medium text-[#7F1D3A]">
                  Acceso y contacto
                </p>
                <h2 className="font-editorial text-3xl sm:text-4xl font-semibold leading-[1.1] tracking-tight text-[#141413] text-balance">
                  Empieza a organizar tu guardarropa con TU LOOK.
                </h2>
                <p className="text-sm sm:text-base leading-relaxed text-[#524F49]">
                  Envíanos tu solicitud directamente a{' '}
                  <a
                    href="mailto:tulookoffve@gmail.com"
                    className="font-medium text-[#141413] underline underline-offset-4 hover:text-[#7F1D3A]"
                  >
                    tulookoffve@gmail.com
                  </a>{' '}
                  para recibir tu invitación, o prueba la comunidad por zona en el simulador interactivo.
                </p>
              </div>

              <div className="lg:col-span-7">
                <AccessForm />
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Quiet Editorial Footer */}
      <footer className="border-t border-[#E6E2DA] bg-[#FAF9F6] py-10">
        <div className="mx-auto max-w-[1200px] px-6 lg:px-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-1">
            <span className="font-editorial text-xl font-bold text-[#141413]">
              TU LOOK
            </span>
            <p className="text-xs text-[#6E6A61]">
              © 2026 TU LOOK · Contacto:{' '}
              <a
                href="mailto:tulookoffve@gmail.com"
                className="hover:text-[#141413] underline underline-offset-2"
              >
                tulookoffve@gmail.com
              </a>
            </p>
          </div>

          <nav
            aria-label="Enlaces de pie de página"
            className="flex flex-wrap items-center gap-6 text-xs font-medium text-[#524F49]"
          >
            <a
              href="#la-app"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection('la-app');
              }}
              className="hover:text-[#141413] transition-colors"
            >
              La App
            </a>
            <a
              href="#funciones"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection('funciones');
              }}
              className="hover:text-[#141413] transition-colors"
            >
              Funciones
            </a>
            <a
              href="#lookbook"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection('lookbook');
              }}
              className="hover:text-[#141413] transition-colors"
            >
              Lookbook
            </a>
            <a
              href="#acceso"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection('acceso');
              }}
              className="hover:text-[#141413] transition-colors"
            >
              Acceso
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
