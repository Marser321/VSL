'use client';
// components/HookVariants.tsx
// Selector A/B/C de hooks — diseño legible para ambos temas
import { motion } from 'framer-motion';
import { Check, Zap, Crosshair, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HookData {
  texto: string;
  angulo: string;
  dolor_atacado?: string;
  por_que_funciona: string;
  justificacion_educativa?: string;
}

interface HookVariantsProps {
  hookA: HookData;
  hookB: HookData;
  hookC: HookData;
  seleccionado: 'A' | 'B' | 'C';
  onSeleccionar: (variante: 'A' | 'B' | 'C') => void;
}

const VARIANTE_STYLES = {
  A: {
    badge: 'bg-muted text-foreground/70 border-border',
    border: 'border-border/50',
    borderSelected: 'border-primary shadow-primary/20 premium-border',
    dot: 'bg-primary',
    label: 'VARIANTE A',
  },
  B: {
    badge: 'bg-muted text-foreground/70 border-border',
    border: 'border-border/50',
    borderSelected: 'border-primary shadow-primary/20 premium-border',
    dot: 'bg-primary',
    label: 'VARIANTE B',
  },
  C: {
    badge: 'bg-muted text-foreground/70 border-border',
    border: 'border-border/50',
    borderSelected: 'border-primary shadow-primary/20 premium-border',
    dot: 'bg-primary',
    label: 'VARIANTE C',
  },
};

function HookCard({
  variante,
  data,
  seleccionado,
  onSeleccionar,
  index,
}: {
  variante: 'A' | 'B' | 'C';
  data: HookData;
  seleccionado: boolean;
  onSeleccionar: () => void;
  index: number;
}) {
  const styles = VARIANTE_STYLES[variante];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -2 }}
      transition={{ delay: index * 0.1, duration: 0.35 }}
      onClick={onSeleccionar}
      className={cn(
        'relative rounded-xl border-2 bg-card cursor-pointer transition-all duration-200',
        'hover:bg-muted/50',
        'shadow-sm hover:shadow-md',
        seleccionado
          ? `${styles.borderSelected} shadow-md`
          : `${styles.border} hover:border-foreground/[0.15]`
      )}
    >
      {/* Badge + indicador seleccionado */}
      <div className="flex items-center justify-between p-3 pb-0">
        <span className={cn(
          'text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-widest',
          styles.badge
        )}>
          {styles.label}
        </span>
        {seleccionado && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-1 text-primary"
          >
            <Check size={12} strokeWidth={3} />
            <span className="text-[10px] font-bold">ACTIVO</span>
          </motion.div>
        )}
      </div>

      {/* Ángulo */}
      <div className="px-3 pt-2 pb-1">
        <div className="flex items-center gap-1.5">
          <div className={cn('w-1.5 h-1.5 rounded-full', styles.dot)} />
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">
            {data.angulo}
          </span>
        </div>
      </div>

      {/* Texto del hook */}
      <div className="px-3 pb-3">
        <p className="text-[13px] text-foreground/85 leading-[1.7]">
          {data.texto}
        </p>
      </div>

      {/* Dolor atacado */}
      {data.dolor_atacado && (
        <div className="mx-3 mb-2 p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/25">
          <div className="flex items-center gap-1.5 mb-1">
            <Crosshair size={10} className="text-rose-600 dark:text-rose-400" />
            <span className="text-[9px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-widest">
              Dolor atacado
            </span>
          </div>
          <p className="text-[11px] text-rose-700 dark:text-rose-300/70 leading-relaxed">
            {data.dolor_atacado}
          </p>
        </div>
      )}

      {/* Por qué funciona (técnico) */}
      <div className="mx-3 mb-2 p-2.5 rounded-lg bg-muted/20 border border-border/50">
        <div className="flex items-center gap-1.5 mb-1">
          <Zap size={10} className="text-foreground/70" />
          <span className="text-[9px] font-bold text-foreground/70 uppercase tracking-widest">
            Por qué funciona
          </span>
        </div>
        <p className="text-[11px] text-foreground/60 leading-[1.65]">
          {data.por_que_funciona}
        </p>
      </div>

      {/* Justificación Educativa */}
      {data.justificacion_educativa && (
        <div className="mx-3 mb-3 p-2.5 rounded-lg bg-muted/20 border border-border/50">
          <div className="flex items-center gap-1.5 mb-1">
            <BookOpen size={10} className="text-foreground/70" />
            <span className="text-[9px] font-bold text-foreground/70 uppercase tracking-widest">
              Lógica y Justificación
            </span>
          </div>
          <p className="text-[11px] text-foreground/55 leading-[1.65]">
            {data.justificacion_educativa}
          </p>
        </div>
      )}

      {/* Botón de selección */}
      <div className="px-3 pb-3">
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={(e) => { e.stopPropagation(); onSeleccionar(); }}
          className={cn(
            'w-full py-2.5 rounded-lg text-xs font-semibold transition-all duration-200',
            seleccionado
              ? 'bg-primary/10 text-primary border border-primary/30'
              : 'bg-muted text-muted-foreground border border-border hover:bg-primary/10 hover:text-primary hover:border-primary/30'
          )}
        >
          {seleccionado ? '✓ Variante Seleccionada' : 'Usar este Hook'}
        </motion.button>
      </div>
    </motion.div>
  );
}

export function HookVariants({ hookA, hookB, hookC, seleccionado, onSeleccionar }: HookVariantsProps) {
  const hooks = [
    { variante: 'A' as const, data: hookA },
    { variante: 'B' as const, data: hookB },
    { variante: 'C' as const, data: hookC },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-1 h-4 bg-primary rounded-full" />
        <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
          Testing A/B/C — Hooks de Apertura
        </h3>
        <span className="text-xs text-muted-foreground ml-auto">Seleccioná el que mejor resuena</span>
      </div>

      {/* Grid de hooks: 1 col en mobile, 3 en desktop */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {hooks.map(({ variante, data }, i) => (
          <HookCard
            key={variante}
            variante={variante}
            data={data}
            seleccionado={seleccionado === variante}
            onSeleccionar={() => onSeleccionar(variante)}
            index={i}
          />
        ))}
      </div>
    </div>
  );
}
