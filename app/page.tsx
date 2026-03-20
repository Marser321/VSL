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
import { AuditBadge } from '@/components/AuditBadge';
import { ThemeToggle } from '@/components/ThemeToggle';
import {
  Sparkles, Settings, FileText, Wand2,
  Download, Copy, PlayCircle, Loader2, ChevronRight
} from 'lucide-react';
import type { DatosCliente, BloqueVSL, ResultadoAuditoria } from '@/lib/utils';

// ─── Estado inicial ────────────────────────────────────────────────────────────
const DATOS_INICIALES: DatosCliente = {
  nombreNegocio: '',
  avatarObjetivo: '',
  problemasPrincipal: '',
  zonaGeografica: '',
  competidoresInfo: '',
  quejasComunes: '',
  propuestaUnica: '',
  pruebaSocial: '',
};

type EtapaApp = 'configuracion' | 'editor';

// ─── Componente principal ──────────────────────────────────────────────────────
export default function VslGeneratorPage() {
  const [pestanaActiva, setPestanaActiva] = useState<EtapaApp>('configuracion');
  const [datosCliente, setDatosCliente] = useState<DatosCliente>(DATOS_INICIALES);
  const [hooks, setHooks] = useState<{
    hookA: { texto: string; angulo: string; dolor_atacado?: string; por_que_funciona: string; justificacion_educativa?: string };
    hookB: { texto: string; angulo: string; dolor_atacado?: string; por_que_funciona: string; justificacion_educativa?: string };
    hookC: { texto: string; angulo: string; dolor_atacado?: string; por_que_funciona: string; justificacion_educativa?: string };
  } | null>(null);
  const [hookSeleccionado, setHookSeleccionado] = useState<'A' | 'B' | 'C'>('A');
  const [bloques, setBloques] = useState<BloqueVSL[]>([]);
  const [isGenerandoVSL, setIsGenerandoVSL] = useState(false);
  const [bloqueRegenerando, setBloqueRegenerando] = useState<string | null>(null);
  const [auditoria, setAuditoria] = useState<ResultadoAuditoria | null>(null);

  // ─── Proceso de Generación VSL ────────────────────────────────────────────────
  const generarGuionTotal = useCallback(async () => {
    if (!datosCliente.nombreNegocio) return;
    setIsGenerandoVSL(true);

    try {
      // 1. Generar Hooks
      const hooksRes = fetch('/api/generate/hooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ datosCliente }),
      });
      // 2. Generar VSL
      const vslRes = fetch('/api/generate/vsl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ datosCliente }),
      });

      const [hooksDataJson, vslDataJson] = await Promise.all([hooksRes, vslRes]);
      const hooksData = await hooksDataJson.json();
      const vslData = await vslDataJson.json();

      if (hooksData.exito) {
        setHooks(hooksData.hooks);
      }
      if (vslData.exito) {
        setBloques(vslData.bloques);
        if (vslData.auditoria) setAuditoria(vslData.auditoria);
        setPestanaActiva('editor');
      }
    } catch (error) {
      console.error('Error general generando VSL:', error);
    } finally {
      setIsGenerandoVSL(false);
    }
  }, [datosCliente]);



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
          <TabsList className="grid w-full grid-cols-2 h-auto bg-card border border-border rounded-xl p-1 mb-6">
            {[
              { value: 'configuracion', icon: Settings, label: 'Configuración', sub: 'Datos del mercado' },
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

                  {/* Información manual del mercado */}
                  <div className="glass-card rounded-xl p-5 space-y-3">
                    <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                       <span className="w-1 h-3 bg-[#4A90D9] rounded-full" />
                       Investigación de Mercado
                    </h2>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-foreground/60">¿Qué hace mal tu competencia? (Opcional)</Label>
                      <Textarea
                        value={datosCliente.competidoresInfo || ''}
                        onChange={e => setDatosCliente(d => ({ ...d, competidoresInfo: e.target.value }))}
                        placeholder="Ej: Tardan mucho, no dan presupuestos fijos, atienden mal..."
                        className="bg-input border-border text-foreground placeholder:text-muted-foreground/50 focus:border-[#4A90D9]/50 min-h-[70px] resize-none text-sm"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-foreground/60">Quejas comunes de tu sector (Opcional)</Label>
                      <Textarea
                        value={datosCliente.quejasComunes || ''}
                        onChange={e => setDatosCliente(d => ({ ...d, quejasComunes: e.target.value }))}
                        placeholder="Ej: La gente tiene miedo a que le cobren de más sin saber por qué..."
                        className="bg-input border-border text-foreground placeholder:text-muted-foreground/50 focus:border-[#4A90D9]/50 min-h-[70px] resize-none text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Botón de acción principal */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <Button
                  onClick={generarGuionTotal}
                  disabled={!camposCompletos || isGenerandoVSL}
                  className="w-full sm:w-auto bg-[#4A90D9] hover:bg-[#5BA8F5] text-foreground font-bold px-8 py-3 h-auto rounded-xl text-sm disabled:opacity-40 disabled:cursor-not-allowed blue-glow transition-all duration-200"
                >
                  {isGenerandoVSL ? (
                    <>
                      <Loader2 size={15} className="animate-spin mr-2" />
                      Generando Guion VSL...
                    </>
                  ) : (
                    <>
                      <Sparkles size={15} className="mr-2" />
                      Generar Guion VSL Mágico
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
                      onClick={generarGuionTotal}
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
