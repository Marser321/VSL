'use client';
// app/page.tsx — Página principal del VSL Generator Pro
import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScriptBlock } from '@/components/ScriptBlock';
import { HookVariants } from '@/components/HookVariants';
import { ResearchProgress, ETAPAS_INVESTIGACION } from '@/components/ResearchProgress';
import { AuditBadge } from '@/components/AuditBadge';
import { ThemeToggle } from '@/components/ThemeToggle';
import {
  Sparkles, Settings, Search, FileText, Plus, Trash2, Wand2,
  Download, Copy, PlayCircle, Loader2, ChevronRight, Globe
} from 'lucide-react';
import type { DatosCliente, BloqueVSL, HallazgoResearch, ResultadoAuditoria } from '@/lib/utils';

// ─── Estado inicial ────────────────────────────────────────────────────────────
const DATOS_INICIALES: DatosCliente = {
  nombreNegocio: '',
  avatarObjetivo: '',
  problemasPrincipal: '',
  zonaGeografica: '',
  urlsCompetidores: [''],
  propuestaUnica: '',
  pruebaSocial: '',
};

type EtapaApp = 'configuracion' | 'investigacion' | 'editor';

// ─── Componente principal ──────────────────────────────────────────────────────
export default function VslGeneratorPage() {
  const [pestanaActiva, setPestanaActiva] = useState<EtapaApp>('configuracion');
  const [datosCliente, setDatosCliente] = useState<DatosCliente>(DATOS_INICIALES);
  const [etapasResearch, setEtapasResearch] = useState(
    ETAPAS_INVESTIGACION.map(e => ({ ...e }))
  );
  const [hallazgosResearch, setHallazgosResearch] = useState<{
    competidores: number; quejas: number; dolores: string[];
  }>({ competidores: 0, quejas: 0, dolores: [] });
  const [researchData, setResearchData] = useState<HallazgoResearch[]>([]);
  const [hooks, setHooks] = useState<{
    hookA: { texto: string; angulo: string; dolor_atacado?: string; por_que_funciona: string; justificacion_educativa?: string };
    hookB: { texto: string; angulo: string; dolor_atacado?: string; por_que_funciona: string; justificacion_educativa?: string };
    hookC: { texto: string; angulo: string; dolor_atacado?: string; por_que_funciona: string; justificacion_educativa?: string };
  } | null>(null);
  const [hookSeleccionado, setHookSeleccionado] = useState<'A' | 'B' | 'C'>('A');
  const [bloques, setBloques] = useState<BloqueVSL[]>([]);
  const [isInvestigando, setIsInvestigando] = useState(false);
  const [isGenerandoVSL, setIsGenerandoVSL] = useState(false);
  const [bloqueRegenerando, setBloqueRegenerando] = useState<string | null>(null);
  const [auditoria, setAuditoria] = useState<ResultadoAuditoria | null>(null);

  // ─── Helpers formulario ──────────────────────────────────────────────────────
  const actualizarUrl = (index: number, valor: string) => {
    const urls = [...datosCliente.urlsCompetidores];
    urls[index] = valor;
    setDatosCliente(d => ({ ...d, urlsCompetidores: urls }));
  };

  const agregarUrl = () => {
    if (datosCliente.urlsCompetidores.length < 3) {
      setDatosCliente(d => ({ ...d, urlsCompetidores: [...d.urlsCompetidores, ''] }));
    }
  };

  const eliminarUrl = (index: number) => {
    if (datosCliente.urlsCompetidores.length > 1) {
      const urls = datosCliente.urlsCompetidores.filter((_, i) => i !== index);
      setDatosCliente(d => ({ ...d, urlsCompetidores: urls }));
    }
  };

  // ─── Actualizar estado de etapa ──────────────────────────────────────────────
  const actualizarEtapa = (id: string, estado: 'pendiente' | 'en_progreso' | 'completado' | 'error', resultado?: string) => {
    setEtapasResearch(prev => prev.map(e =>
      e.id === id ? { ...e, estado, resultado } : e
    ));
  };

  // ─── Proceso de investigación ────────────────────────────────────────────────
  const iniciarInvestigacion = useCallback(async () => {
    if (!datosCliente.nombreNegocio) return;

    setIsInvestigando(true);
    setPestanaActiva('investigacion');

    // Reset etapas
    setEtapasResearch(ETAPAS_INVESTIGACION.map(e => ({ ...e, estado: 'pendiente' as const })));
    
    const hallazgosAcumulados: HallazgoResearch[] = [];
    let doloresDetectados: string[] = [];
    let totalQuejas = 0;
    let totalCompetidores = 0;

    try {
      // ── ETAPA 1: Scraping de competidores ──────────────────────────────────
      actualizarEtapa('scrap_competidores', 'en_progreso');
      
      const urlsValidas = datosCliente.urlsCompetidores.filter(u => u.trim().length > 5);

      if (urlsValidas.length > 0) {
        for (const url of urlsValidas) {
          try {
            const res = await fetch('/api/research/competitor', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url }),
            });
            const data = await res.json();
            if (data.exito) {
              totalCompetidores++;
              hallazgosAcumulados.push({
                fuente: 'firecrawl',
                titulo: data.titulo || url,
                contenido: data.contenidoLimpio || '',
                url,
                extraccionEstructurada: data.extraccionEstructurada,
              });
            }
          } catch { /* continuar con siguiente URL */ }
        }

        actualizarEtapa('scrap_competidores', 'completado',
          `${totalCompetidores} página(s) de competidores analizadas`
        );
      } else {
        actualizarEtapa('scrap_competidores', 'completado', 'No se proporcionaron URLs de competidores');
      }

      // ── ETAPA 2: Reseñas Google Maps ───────────────────────────────────────
      actualizarEtapa('reviews_google', 'en_progreso');
      
      const reviewsRes = await fetch('/api/research/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombreNegocio: datosCliente.nombreNegocio,
          zonaGeografica: datosCliente.zonaGeografica,
        }),
      });
      const reviewsData = await reviewsRes.json();

      if (reviewsData.exito) {
        const quejas = reviewsData.hallazgos?.quejas || [];
        const dolores = reviewsData.hallazgos?.dolores || [];
        totalQuejas = quejas.length;
        doloresDetectados = [...doloresDetectados, ...dolores];

        hallazgosAcumulados.push({
          fuente: 'google_maps',
          titulo: 'Reseñas y quejas de Google Maps',
          contenido: quejas.join('\n'),
          doloresPrincipales: dolores,
        });

        actualizarEtapa('reviews_google', 'completado',
          `${totalQuejas} reseña(s) negativa(s) analizadas · ${dolores.length} pain point(s) detectados`
        );
      } else {
        actualizarEtapa('reviews_google', 'error', 'No se pudieron obtener reseñas');
      }

      // ── ETAPA 3: Análisis IA ───────────────────────────────────────────────
      actualizarEtapa('analisis_ia', 'en_progreso');

      // Generar hooks A/B/C
      const hooksRes = await fetch('/api/generate/hooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          datosCliente,
          quejasPrincipales: doloresDetectados,
        }),
      });
      const hooksData = await hooksRes.json();

      if (hooksData.exito) {
        setHooks(hooksData.hooks);
      }

      actualizarEtapa('analisis_ia', 'completado', 'Ángulos de conversión detectados · Hooks A/B/C generados');
      setResearchData(hallazgosAcumulados);
      setHallazgosResearch({
        competidores: totalCompetidores,
        quejas: totalQuejas,
        dolores: [...new Set(doloresDetectados)].slice(0, 4),
      });

      // ── Generar VSL completo ───────────────────────────────────────────────
      await generarGuionVSL(hallazgosAcumulados);

    } catch (error) {
      console.error('Error en investigación:', error);
    } finally {
      setIsInvestigando(false);
    }
  }, [datosCliente]);

  // ─── Generación del guion VSL ────────────────────────────────────────────────
  const generarGuionVSL = async (research: HallazgoResearch[]) => {
    setIsGenerandoVSL(true);
    try {
      const res = await fetch('/api/generate/vsl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          datosCliente,
          researchData: research,
        }),
      });
      const data = await res.json();
      if (data.exito) {
        setBloques(data.bloques);
        if (data.auditoria) {
          setAuditoria(data.auditoria);
        }
        setPestanaActiva('editor');
      }
    } catch (error) {
      console.error('Error generando VSL:', error);
    } finally {
      setIsGenerandoVSL(false);
    }
  };

  const actualizarBloque = (id: string, nuevoTexto: string) => {
    setBloques(prev => prev.map(b => b.id === id ? { ...b, texto: nuevoTexto } : b));
  };

  const regenerarBloque = async (bloque: BloqueVSL) => {
    setBloqueRegenerando(bloque.id);
    try {
      const res = await fetch('/api/generate/regenerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bloqueOriginal: bloque,
          datosCliente,
          researchData,
        }),
      });
      const data = await res.json();
      if (data.exito && data.bloque) {
        setBloques(prev => prev.map(b =>
          b.id === bloque.id ? data.bloque : b
        ));
      }
    } catch (error) {
      console.error('Error al regenerar bloque:', error);
    } finally {
      setBloqueRegenerando(null);
    }
  };

  // ─── Exportar guion completo ─────────────────────────────────────────────────
  const exportarGuion = () => {
    const hookActual = hooks
      ? (hookSeleccionado === 'A' ? hooks.hookA : hookSeleccionado === 'B' ? hooks.hookB : hooks.hookC)
      : null;

    const contenido = [
      `# Guion VSL — ${datosCliente.nombreNegocio}`,
      `Generado con VSL Generator Pro\n`,
      hooks && hookActual ? `## 🎯 HOOK (Variante ${hookSeleccionado})\n\n${hookActual.texto}\n\n---\n` : '',
      ...bloques.map(b => `## ${b.titulo}\n\n${b.texto}\n\n> **Lógica de conversión:** ${b.logicaConversion}\n\n---`),
    ].join('\n');

    const blob = new Blob([contenido], { type: 'text/markdown' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vsl-${datosCliente.nombreNegocio.replace(/\s+/g, '-').toLowerCase()}.md`;
    a.click();
  };

  const copiarTodoElGuion = async () => {
    const hookActual = hooks
      ? (hookSeleccionado === 'A' ? hooks.hookA : hookSeleccionado === 'B' ? hooks.hookB : hooks.hookC)
      : null;

    const texto = [
      hookActual ? `HOOK:\n${hookActual.texto}\n\n---\n` : '',
      ...bloques.map(b => `${b.titulo.toUpperCase()}:\n${b.texto}\n`),
    ].join('\n');

    await navigator.clipboard.writeText(texto);
  };

  const camposCompletos = datosCliente.nombreNegocio && datosCliente.avatarObjetivo
    && datosCliente.problemasPrincipal && datosCliente.zonaGeografica;

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/90 backdrop-blur-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#4A90D9] to-[#1E3A8A] flex items-center justify-center blue-glow">
              <PlayCircle size={14} className="text-foreground" />
            </div>
            <div>
              <span className="text-sm font-bold text-foreground">VSL Generator</span>
              <span className="text-sm font-bold text-[#4A90D9]"> Pro</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-foreground/30 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="hidden sm:inline">SISTEMA ACTIVO</span>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <Tabs value={pestanaActiva} onValueChange={(v) => setPestanaActiva(v as EtapaApp)}>
          
          {/* Tab List */}
          <TabsList className="grid w-full grid-cols-3 h-auto bg-card border border-border rounded-xl p-1 mb-6">
            {[
              { value: 'configuracion', icon: Settings, label: 'Configuración', sub: 'Datos del cliente' },
              { value: 'investigacion', icon: Search, label: 'Investigación', sub: 'Research en tiempo real' },
              { value: 'editor', icon: FileText, label: 'Editor VSL', sub: bloques.length ? `${bloques.length} bloques` : 'Guion final' },
            ].map(({ value, icon: Icono, label, sub }) => (
              <TabsTrigger
                key={value}
                value={value}
                className="flex flex-col items-center gap-0.5 py-2.5 px-3 rounded-lg text-muted-foreground data-[state=active]:bg-muted data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all"
              >
                <div className="flex items-center gap-1.5">
                  <Icono size={13} />
                  <span className="text-xs font-semibold">{label}</span>
                </div>
                <span className="text-[10px] text-foreground/25 hidden sm:block">{sub}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* ── TAB 1: Configuración ─────────────────────────────────────────── */}
          <TabsContent value="configuracion">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-5"
            >
              {/* Hero intro */}
              <div className="rounded-2xl border border-border bg-gradient-to-br from-background to-card p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#4A90D9]/20 to-[#4A90D9]/5 border border-[#4A90D9]/20 flex items-center justify-center flex-shrink-0">
                    <Wand2 size={20} className="text-[#4A90D9]" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-foreground mb-1">
                      Generá tu guion VSL que convierte
                    </h1>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Completá los datos de tu cliente. El sistema va a investigar a tu competencia en internet,
                      detectar sus puntos débiles, y generar un guion con ángulos psicológicos específicos.
                    </p>
                  </div>
                </div>
              </div>

              {/* Formulario de 2 columnas en desktop */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Columna izquierda */}
                <div className="space-y-4">
                  <div className="glass-card rounded-xl p-5 space-y-4">
                    <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                      <span className="w-1 h-3 bg-[#4A90D9] rounded-full" />
                      Datos del negocio
                    </h2>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-foreground/60">Nombre del negocio / producto *</Label>
                      <Input
                        value={datosCliente.nombreNegocio}
                        onChange={e => setDatosCliente(d => ({ ...d, nombreNegocio: e.target.value }))}
                        placeholder="Ej: Taller Mecánico García"
                        className="bg-input border-border text-foreground placeholder:text-muted-foreground/50 focus:border-[#4A90D9]/50 focus:ring-[#4A90D9]/20"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-foreground/60">Zona geográfica *</Label>
                      <Input
                        value={datosCliente.zonaGeografica}
                        onChange={e => setDatosCliente(d => ({ ...d, zonaGeografica: e.target.value }))}
                        placeholder="Ej: Montevideo, Uruguay"
                        className="bg-input border-border text-foreground placeholder:text-muted-foreground/50 focus:border-[#4A90D9]/50"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-foreground/60">Propuesta única de valor</Label>
                      <Textarea
                        value={datosCliente.propuestaUnica}
                        onChange={e => setDatosCliente(d => ({ ...d, propuestaUnica: e.target.value }))}
                        placeholder="¿Qué te hace diferente? Ej: Diagnóstico con video + precio fijo garantizado"
                        className="bg-input border-border text-foreground placeholder:text-muted-foreground/50 focus:border-[#4A90D9]/50 min-h-[80px] resize-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-foreground/60">Prueba social (testimonios, números)</Label>
                      <Textarea
                        value={datosCliente.pruebaSocial || ''}
                        onChange={e => setDatosCliente(d => ({ ...d, pruebaSocial: e.target.value }))}
                        placeholder="Ej: +200 clientes satisfechos, 4.9★ en Google, 10 años en el mercado"
                        className="bg-input border-border text-foreground placeholder:text-muted-foreground/50 focus:border-[#4A90D9]/50 min-h-[70px] resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Columna derecha */}
                <div className="space-y-4">
                  <div className="glass-card rounded-xl p-5 space-y-4">
                    <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                      <span className="w-1 h-3 bg-[#4A90D9] rounded-full" />
                      Avatar y problema
                    </h2>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-foreground/60">Público objetivo (avatar) *</Label>
                      <Textarea
                        value={datosCliente.avatarObjetivo}
                        onChange={e => setDatosCliente(d => ({ ...d, avatarObjetivo: e.target.value }))}
                        placeholder="Ej: Dueños de autos de clase media, 30-55 años, poco tiempo libre, desconfían de los talleres"
                        className="bg-input border-border text-foreground placeholder:text-muted-foreground/50 focus:border-[#4A90D9]/50 min-h-[90px] resize-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-foreground/60">Problema principal que resolvés *</Label>
                      <Textarea
                        value={datosCliente.problemasPrincipal}
                        onChange={e => setDatosCliente(d => ({ ...d, problemasPrincipal: e.target.value }))}
                        placeholder="Ej: Los talleres tradicionales cobran de más, no dan presupuestos claros y tardan semanas"
                        className="bg-input border-border text-foreground placeholder:text-muted-foreground/50 focus:border-[#4A90D9]/50 min-h-[90px] resize-none"
                      />
                    </div>
                  </div>

                  {/* URLs de competidores */}
                  <div className="glass-card rounded-xl p-5 space-y-3">
                    <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                      <span className="w-1 h-3 bg-[#4A90D9] rounded-full" />
                      URLs de competidores
                      <span className="text-[10px] text-foreground/25 font-normal normal-case ml-auto">Hasta 3 URLs</span>
                    </h2>

                    {datosCliente.urlsCompetidores.map((url, i) => (
                      <div key={i} className="flex gap-2">
                        <Input
                          value={url}
                          onChange={e => actualizarUrl(i, e.target.value)}
                          placeholder={`https://competidor${i + 1}.com`}
                          className="bg-input border-border text-foreground placeholder:text-muted-foreground/50 focus:border-[#4A90D9]/50 text-sm flex-1"
                        />
                        {datosCliente.urlsCompetidores.length > 1 && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => eliminarUrl(i)}
                            className="h-9 w-9 p-0 text-foreground/30 hover:text-red-400 hover:bg-red-400/10 flex-shrink-0"
                          >
                            <Trash2 size={13} />
                          </Button>
                        )}
                      </div>
                    ))}

                    {datosCliente.urlsCompetidores.length < 3 && (
                      <button
                        onClick={agregarUrl}
                        className="flex items-center gap-1.5 text-xs text-foreground/30 hover:text-[#4A90D9] transition-colors"
                      >
                        <Plus size={13} />
                        Agregar otra URL
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Botón de acción principal */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <Button
                  onClick={iniciarInvestigacion}
                  disabled={!camposCompletos || isInvestigando}
                  className="w-full sm:w-auto bg-[#4A90D9] hover:bg-[#5BA8F5] text-foreground font-bold px-8 py-3 h-auto rounded-xl text-sm disabled:opacity-40 disabled:cursor-not-allowed blue-glow transition-all duration-200"
                >
                  {isInvestigando ? (
                    <>
                      <Loader2 size={15} className="animate-spin mr-2" />
                      Investigando...
                    </>
                  ) : (
                    <>
                      <Sparkles size={15} className="mr-2" />
                      Iniciar Investigación y Generar VSL
                      <ChevronRight size={14} className="ml-1" />
                    </>
                  )}
                </Button>
                {!camposCompletos && (
                  <p className="text-xs text-foreground/30">Completá los campos obligatorios (*)</p>
                )}
              </div>
            </motion.div>
          </TabsContent>

          {/* ── TAB 2: Investigación ─────────────────────────────────────────── */}
          <TabsContent value="investigacion">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-5"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-foreground">Investigación en progreso</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    El sistema está analizando el mercado y a tu competencia en tiempo real
                  </p>
                </div>
                {isGenerandoVSL && (
                  <div className="flex items-center gap-2 text-xs text-[#4A90D9] font-mono">
                    <Loader2 size={13} className="animate-spin" />
                    Generando guion VSL...
                  </div>
                )}
              </div>

              <ResearchProgress
                etapas={etapasResearch}
                hallazgos={hallazgosResearch}
              />

              {/* Tarjetas de Inteligencia Competitiva */}
              {researchData.filter(r => r.fuente === 'firecrawl').length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-8 space-y-4"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1 h-4 bg-[#4A90D9] rounded-full" />
                    <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <Globe size={15} /> Inteligencia Competitiva
                    </h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {researchData.filter(r => r.fuente === 'firecrawl').map((competidor, i) => (
                      <motion.div
                        key={i}
                        whileHover={{ y: -2 }}
                        className="glass-card rounded-xl p-5 border border-border flex flex-col"
                      >
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <h4 className="text-sm font-semibold text-foreground/90 line-clamp-2">{competidor.titulo}</h4>
                          <span className="text-[10px] text-[#4A90D9] uppercase font-mono tracking-widest bg-[#4A90D9]/10 px-2 py-0.5 rounded-full border border-[#4A90D9]/20 flex-shrink-0 mt-0.5">
                            Competidor
                          </span>
                        </div>
                        
                        <a href={competidor.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:text-blue-300 hover:underline mb-4 truncate w-full block">
                          {competidor.url}
                        </a>
                        
                        <div className="flex-1 rounded-lg bg-background border border-border p-3 overflow-y-auto max-h-[160px] custom-scrollbar">
                          {competidor.extraccionEstructurada && Object.keys(competidor.extraccionEstructurada).length > 0 ? (
                            <div className="space-y-4">
                              {competidor.extraccionEstructurada.propuesta_valor && (
                                <div>
                                  <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono block mb-1">Propuesta de Valor</span>
                                  <p className="text-[13px] text-foreground/85 leading-relaxed">{competidor.extraccionEstructurada.propuesta_valor}</p>
                                </div>
                              )}
                              {competidor.extraccionEstructurada.precios && (
                                <div>
                                  <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono block mb-1">Precios / Ofertas</span>
                                  <p className="text-xs text-emerald-400/90 leading-relaxed font-medium">{competidor.extraccionEstructurada.precios}</p>
                                </div>
                              )}
                              {competidor.extraccionEstructurada.debilidades && competidor.extraccionEstructurada.debilidades.length > 0 && (
                                <div>
                                  <span className="text-[10px] text-red-400/80 uppercase tracking-widest font-mono block mb-1">Debilidades Detectadas</span>
                                  <ul className="list-disc list-inside text-xs text-red-300/80 leading-relaxed marker:text-red-500/50 space-y-1">
                                    {competidor.extraccionEstructurada.debilidades.map((d: string, idx: number) => <li key={idx}>{d}</li>)}
                                  </ul>
                                </div>
                              )}
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
                              {competidor.contenido ? `${competidor.contenido.substring(0, 350)}...` : 'Sin contenido extraíble estructurado.'}
                            </p>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Botón para ir al editor una vez terminado */}
              <AnimatePresence>
                {bloques.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Button
                      onClick={() => setPestanaActiva('editor')}
                      className="w-full bg-[#4A90D9] hover:bg-[#5BA8F5] text-foreground font-bold py-3 h-auto rounded-xl blue-glow"
                    >
                      <FileText size={15} className="mr-2" />
                      Ver Guion VSL Generado
                      <ChevronRight size={14} className="ml-1" />
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </TabsContent>

          {/* ── TAB 3: Editor VSL ────────────────────────────────────────────── */}
          <TabsContent value="editor">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Toolbar del editor */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-foreground">
                    {datosCliente.nombreNegocio ? `VSL: ${datosCliente.nombreNegocio}` : 'Editor de Guion VSL'}
                  </h2>
                  <p className="text-xs text-foreground/35 mt-0.5">
                    Editá cada bloque. El panel rojo muestra la lógica de conversión detrás de cada sección.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {auditoria && <AuditBadge auditoria={auditoria} />}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={copiarTodoElGuion}
                    className="border-foreground/[0.1] bg-input text-foreground/60 hover:text-foreground hover:border-foreground/[20] text-xs"
                  >
                    <Copy size={12} className="mr-1.5" />
                    Copiar todo
                  </Button>
                  <Button
                    size="sm"
                    onClick={exportarGuion}
                    className="bg-[#4A90D9]/20 hover:bg-[#4A90D9]/30 text-[#60A5FA] border border-[#4A90D9]/30 text-xs"
                  >
                    <Download size={12} className="mr-1.5" />
                    Exportar .md
                  </Button>
                </div>
              </div>

              {bloques.length === 0 ? (
                /* Estado vacío */
                <div className="rounded-2xl border border-border bg-card p-12 text-center">
                  <div className="w-14 h-14 rounded-full bg-[#4A90D9]/10 border border-[#4A90D9]/20 flex items-center justify-center mx-auto mb-4">
                    <FileText size={22} className="text-[#4A90D9]/60" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground/60 mb-2">
                    El guion aún no fue generado
                  </h3>
                  <p className="text-sm text-foreground/30 mb-5">
                    Completá la configuración e iniciá la investigación para generar tu VSL
                  </p>
                  <Button
                    onClick={() => setPestanaActiva('configuracion')}
                    variant="outline"
                    className="border-foreground/[0.1] text-muted-foreground hover:text-foreground"
                  >
                    Ir a Configuración
                  </Button>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Selector de Hooks A/B/C */}
                  {hooks && (
                    <div className="glass-card rounded-2xl p-5 border border-border">
                      <HookVariants
                        hookA={hooks.hookA}
                        hookB={hooks.hookB}
                        hookC={hooks.hookC}
                        seleccionado={hookSeleccionado}
                        onSeleccionar={setHookSeleccionado}
                      />
                    </div>
                  )}

                  {/* Separador */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-input" />
                    <span className="text-[10px] text-muted-foreground/50 uppercase tracking-widest font-mono">
                      Guion principal · {bloques.length} bloques
                    </span>
                    <div className="flex-1 h-px bg-input" />
                  </div>

                  {/* Bloques del guion */}
                  <div className="space-y-4">
                    {bloques.map((bloque, index) => (
                      <ScriptBlock
                        key={bloque.id}
                        bloque={bloque}
                        index={index}
                        onActualizar={actualizarBloque}
                        onRegenerarBloque={regenerarBloque}
                        isRegenerando={bloqueRegenerando === bloque.id}
                      />
                    ))}
                  </div>

                  {/* Footer del guion */}
                  <div className="rounded-xl border border-border bg-card p-4 text-center">
                    <p className="text-xs text-foreground/25">
                      Guion generado con VSL Generator Pro · {new Date().toLocaleDateString('es-UY', {
                        day: '2-digit', month: 'long', year: 'numeric',
                      })}
                    </p>
                    <Button
                      size="sm"
                      onClick={iniciarInvestigacion}
                      variant="ghost"
                      className="mt-2 text-xs text-foreground/30 hover:text-[#4A90D9]"
                    >
                      <RefreshCwIcon size={11} className="mr-1.5" />
                      Regenerar guion completo
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          </TabsContent>

        </Tabs>
      </main>
    </div>
  );
}

// Mini icono auxiliar inline
function RefreshCwIcon({ size, className }: { size: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M8 16H3v5" />
    </svg>
  );
}
