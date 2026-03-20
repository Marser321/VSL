'use client';
// components/ScriptBlock.tsx
// Bloque de guion VSL con paneles de análisis — diseño legible para ambos temas
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Copy, RefreshCw, ChevronDown, ChevronUp, Brain,
  CheckCheck, BookOpen, Crosshair
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn, type BloqueVSL, NOMBRE_BLOQUE, COLOR_BLOQUE } from '@/lib/utils';

interface ScriptBlockProps {
  bloque: BloqueVSL;
  index: number;
  onActualizar: (id: string, nuevoTexto: string) => void;
  onRegenerarBloque: (bloque: BloqueVSL) => void;
  isRegenerando?: boolean;
}

export function ScriptBlock({ bloque, index, onActualizar, onRegenerarBloque, isRegenerando }: ScriptBlockProps) {
  const [copiado, setCopiado] = useState(false);
  const [logicaVisible, setLogicaVisible] = useState(true);
  const [educativoVisible, setEducativoVisible] = useState(false);
  const [texto, setTexto] = useState(bloque.texto);

  const copiarTexto = async () => {
    await navigator.clipboard.writeText(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
      className="group"
    >
      {/* Badge del tipo de bloque */}
      <div className="flex items-center gap-2 mb-2">
        <span className={cn(
          'text-xs font-semibold px-2.5 py-1 rounded-full border',
          COLOR_BLOQUE[bloque.tipo]
        )}>
          {NOMBRE_BLOQUE[bloque.tipo]}
        </span>
        <span className="text-xs text-muted-foreground/60 font-mono ml-auto">BLOQUE {index + 1}</span>
      </div>

      {/* Contenedor principal: texto + paneles laterales */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-3">
        
        {/* Panel izquierdo: Texto del guion */}
        <div className="relative rounded-xl overflow-hidden border border-border bg-card shadow-sm hover:shadow-md transition-all">
          {/* Header del bloque */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3 border-b border-border bg-muted/30">
            <span className="text-sm font-bold text-foreground line-clamp-1">{bloque.titulo}</span>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <Button
                size="sm"
                variant="ghost"
                onClick={copiarTexto}
                className="h-7 px-2 text-muted-foreground hover:text-foreground hover:bg-muted text-xs"
              >
                {copiado ? <CheckCheck size={13} className="text-emerald-600 dark:text-emerald-400" /> : <Copy size={13} />}
                <span className="ml-1">{copiado ? 'Copiado' : 'Copiar'}</span>
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onRegenerarBloque(bloque)}
                disabled={isRegenerando}
                className="h-7 px-2 text-muted-foreground hover:text-primary hover:bg-primary/10 text-xs"
              >
                <RefreshCw size={13} className={isRegenerando ? 'animate-spin' : ''} />
                <span className="ml-1">Regenerar</span>
              </Button>
            </div>
          </div>
          
          {/* Área editable del texto */}
          <textarea
            value={texto}
            onChange={(e) => {
              setTexto(e.target.value);
              onActualizar(bloque.id, e.target.value);
            }}
            className="w-full bg-transparent text-foreground text-[13px] leading-[1.75] p-5 resize-none focus:outline-none min-h-[150px] placeholder:text-muted-foreground/50"
            placeholder="Texto del guion..."
            rows={6}
          />

          {/* Dolor atacado + Ángulo */}
          <div className="px-5 pb-4 space-y-2.5">
            {bloque.dolorAtacado && (
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30">
                <Crosshair size={13} className="text-rose-600 dark:text-rose-400 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-[10px] text-rose-600 dark:text-rose-400 uppercase tracking-widest font-semibold block mb-1">
                    Dolor atacado
                  </span>
                  <span className="text-xs text-rose-800 dark:text-rose-300/80 leading-relaxed">
                    {bloque.dolorAtacado}
                  </span>
                </div>
              </div>
            )}
            <span className="text-[10px] text-muted-foreground/60 uppercase tracking-widest font-mono block">
              ÁNGULO: {bloque.anguloUsado}
            </span>
          </div>
        </div>

        {/* Panel derecho: Lógica de Conversión + Justificación Educativa */}
        <div className="space-y-3">
          {/* Lógica de Conversión (técnica) */}
          <div className="rounded-xl border overflow-hidden transition-all duration-300 bg-sky-50 dark:bg-sky-950/10 border-sky-200 dark:border-sky-800/30 shadow-sm">
            <button
              onClick={() => setLogicaVisible(!logicaVisible)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-sky-100/60 dark:hover:bg-sky-900/10 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Brain size={14} className="text-sky-600 dark:text-sky-400" />
                <span className="text-xs font-bold text-sky-700 dark:text-sky-400 uppercase tracking-wider">
                  Lógica de Conversión
                </span>
              </div>
              {logicaVisible 
                ? <ChevronUp size={13} className="text-sky-500/60" /> 
                : <ChevronDown size={13} className="text-sky-500/60" />
              }
            </button>
            
            <AnimatePresence>
              {logicaVisible && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 pt-1">
                    <p className="text-[12px] text-foreground/70 leading-[1.7]">
                      {bloque.logicaConversion}
                    </p>
                    <div className="mt-3 pt-3 border-t border-sky-200 dark:border-sky-800/30">
                      <span className="text-[10px] text-sky-600/60 dark:text-sky-400/50 uppercase tracking-wider font-mono block mb-1">
                        SESGO / ÁNGULO PSICOLÓGICO
                      </span>
                      <span className="text-xs font-semibold text-sky-700 dark:text-sky-300">
                        {bloque.anguloUsado}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Justificación Educativa (para el cliente) */}
          {bloque.justificacionEducativa && (
            <div className="rounded-xl border overflow-hidden transition-all duration-300 bg-amber-50 dark:bg-amber-950/10 border-amber-200 dark:border-amber-800/30 shadow-sm">
              <button
                onClick={() => setEducativoVisible(!educativoVisible)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-amber-100/60 dark:hover:bg-amber-900/10 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <BookOpen size={14} className="text-amber-600 dark:text-amber-400" />
                  <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                    Lógica y Justificación
                  </span>
                </div>
                {educativoVisible
                  ? <ChevronUp size={13} className="text-amber-500/60" />
                  : <ChevronDown size={13} className="text-amber-500/60" />
                }
              </button>

              <AnimatePresence>
                {educativoVisible && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 pt-1">
                      <p className="text-[11px] text-amber-700/60 dark:text-amber-300/50 leading-relaxed italic mb-2">
                        Explicación sencilla para el cliente:
                      </p>
                      <p className="text-[12px] text-foreground/65 leading-[1.7]">
                        {bloque.justificacionEducativa}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
