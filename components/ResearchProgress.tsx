'use client';
// components/ResearchProgress.tsx
// Panel de progreso de investigación en tiempo real
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Loader2, Globe, Star, Brain, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EtapaResearch {
  id: string;
  label: string;
  descripcion: string;
  icono: React.ElementType;
  estado: 'pendiente' | 'en_progreso' | 'completado' | 'error';
  resultado?: string;
}

interface ResearchProgressProps {
  etapas: EtapaResearch[];
  hallazgos?: {
    competidores?: number;
    quejas?: number;
    dolores?: string[];
  };
}

function EtapaItem({ etapa, index }: { etapa: EtapaResearch; index: number }) {
  const Icono = etapa.icono;

  const iconColor = {
    pendiente: 'text-muted-foreground/50',
    en_progreso: 'text-[#4A90D9]',
    completado: 'text-emerald-400',
    error: 'text-red-400',
  }[etapa.estado];

  const barColor = {
    pendiente: 'bg-foreground/[10]',
    en_progreso: 'bg-[#4A90D9]',
    completado: 'bg-emerald-500',
    error: 'bg-red-500',
  }[etapa.estado];

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.15, duration: 0.4 }}
      className={cn(
        'relative flex gap-4 p-4 rounded-xl border transition-all duration-300',
        etapa.estado === 'en_progreso' && 'bg-[#4A90D9]/[0.06] border-[#4A90D9]/25 animate-border-glow',
        etapa.estado === 'completado' && 'bg-emerald-500/[0.04] border-emerald-500/20',
        etapa.estado === 'error' && 'bg-red-500/[0.05] border-red-500/20',
        etapa.estado === 'pendiente' && 'bg-card border-border opacity-50',
      )}
    >
      {/* Línea de conexión */}
      {index > 0 && (
        <div className="absolute -top-3 left-7 w-0.5 h-3 bg-input" />
      )}

      {/* Icono */}
      <div className={cn(
        'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center border',
        etapa.estado === 'en_progreso' ? 'border-[#4A90D9]/40 bg-[#4A90D9]/10' :
        etapa.estado === 'completado' ? 'border-emerald-500/40 bg-emerald-500/10' :
        etapa.estado === 'error' ? 'border-red-500/40 bg-red-500/10' :
        'border-border bg-input'
      )}>
        {etapa.estado === 'en_progreso' ? (
          <Loader2 size={16} className="animate-spin text-[#4A90D9]" />
        ) : etapa.estado === 'completado' ? (
          <CheckCircle2 size={16} className="text-emerald-400" />
        ) : etapa.estado === 'error' ? (
          <AlertCircle size={16} className="text-red-400" />
        ) : (
          <Icono size={16} className={iconColor} />
        )}
      </div>

      {/* Contenido */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <span className={cn(
            'text-sm font-semibold',
            etapa.estado === 'en_progreso' ? 'text-foreground' :
            etapa.estado === 'completado' ? 'text-emerald-400' :
            etapa.estado === 'error' ? 'text-red-400' :
            'text-muted-foreground'
          )}>
            {etapa.label}
          </span>
          {etapa.estado === 'en_progreso' && (
            <span className="text-[10px] text-[#4A90D9] font-mono animate-pulse">
              PROCESANDO...
            </span>
          )}
          {etapa.estado === 'completado' && (
            <span className="text-[10px] text-emerald-400 font-mono">✓ LISTO</span>
          )}
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">{etapa.descripcion}</p>
        
        {/* Resultado si lo hay */}
        <AnimatePresence>
          {etapa.resultado && etapa.estado === 'completado' && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="text-xs text-emerald-400/70 mt-1.5 italic"
            >
              {etapa.resultado}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Barra de progreso */}
        <div className="mt-2 h-0.5 rounded-full bg-input overflow-hidden">
          <motion.div
            className={cn('h-full rounded-full', barColor)}
            initial={{ width: '0%' }}
            animate={{
              width: etapa.estado === 'completado' ? '100%' :
                     etapa.estado === 'en_progreso' ? '60%' :
                     etapa.estado === 'error' ? '100%' : '0%'
            }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        </div>
      </div>
    </motion.div>
  );
}

export function ResearchProgress({ etapas, hallazgos }: ResearchProgressProps) {
  const completadas = etapas.filter(e => e.estado === 'completado').length;
  const progresoPct = Math.round((completadas / etapas.length) * 100);

  return (
    <div className="space-y-4">
      {/* Progreso global */}
      <div className="glass-card rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-foreground/60 uppercase tracking-widest">
            Progreso de investigación
          </span>
          <span className="text-sm font-bold text-foreground font-mono">{progresoPct}%</span>
        </div>
        <div className="h-2 rounded-full bg-input overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-[#4A90D9] to-[#60A5FA]"
            initial={{ width: '0%' }}
            animate={{ width: `${progresoPct}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
        <p className="text-xs text-foreground/30 mt-1.5">
          {completadas} de {etapas.length} etapas completadas
        </p>
      </div>

      {/* Lista de etapas */}
      <div className="space-y-2">
        {etapas.map((etapa, i) => (
          <EtapaItem key={etapa.id} etapa={etapa} index={i} />
        ))}
      </div>

      {/* Hallazgos detectados */}
      <AnimatePresence>
        {hallazgos && hallazgos.dolores && hallazgos.dolores.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-[#4A90D9]/20 bg-[#4A90D9]/[0.06] p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <Brain size={14} className="text-[#4A90D9]" />
              <span className="text-xs font-bold text-[#4A90D9] uppercase tracking-wider">
                Dolores detectados en el mercado
              </span>
            </div>
            <ul className="space-y-1.5">
              {hallazgos.dolores.map((dolor, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="flex items-start gap-2 text-xs text-foreground/65"
                >
                  <span className="text-[#4A90D9] mt-0.5 flex-shrink-0">→</span>
                  {dolor}
                </motion.li>
              ))}
            </ul>
            {hallazgos.quejas !== undefined && (
              <p className="text-[10px] text-foreground/30 mt-3 font-mono">
                {hallazgos.competidores} competidor(es) analizados · {hallazgos.quejas} reseñas negativas procesadas
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export const ETAPAS_INVESTIGACION: EtapaResearch[] = [
  {
    id: 'scrap_competidores',
    label: 'Analizando competidores',
    descripcion: 'Leyendo y extrayendo contenido de las URLs de la competencia',
    icono: Globe,
    estado: 'pendiente',
  },
  {
    id: 'reviews_google',
    label: 'Extrayendo reseñas Google Maps',
    descripcion: 'Buscando quejas y pain points de clientes de negocios similares',
    icono: Star,
    estado: 'pendiente',
  },
  {
    id: 'analisis_ia',
    label: 'Análisis IA de debilidades',
    descripcion: 'Consolidando hallazgos y detectando ángulos de ataque para el VSL',
    icono: Brain,
    estado: 'pendiente',
  },
];
