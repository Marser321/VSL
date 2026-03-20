// components/AuditBadge.tsx — Indicador visual del resultado de auditoría Ouroboros
'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, ChevronDown, RefreshCw, Sparkles } from 'lucide-react';
import type { ResultadoAuditoria } from '@/lib/utils';

interface AuditBadgeProps {
  auditoria: ResultadoAuditoria;
}

// Color según score — con variantes light/dark
function colorScore(score: number): string {
  if (score >= 8) return 'text-emerald-700 dark:text-emerald-400';
  if (score >= 6) return 'text-yellow-700 dark:text-yellow-400';
  return 'text-rose-700 dark:text-rose-400';
}

function bgScore(score: number): string {
  if (score >= 8) return 'bg-emerald-500';
  if (score >= 6) return 'bg-yellow-500';
  return 'bg-rose-500';
}

function borderScore(score: number): string {
  if (score >= 8) return 'border-emerald-300 dark:border-emerald-500/30';
  if (score >= 6) return 'border-yellow-300 dark:border-yellow-500/30';
  return 'border-rose-300 dark:border-rose-500/30';
}

export function AuditBadge({ auditoria }: AuditBadgeProps) {
  const [expandido, setExpandido] = useState(false);
  const aprobado = auditoria.promedioGeneral >= 8;

  const metricas = [
    { label: 'Claridad', score: auditoria.claridad, desc: '¿Se entiende sin esfuerzo?' },
    { label: 'Retención', score: auditoria.retencion, desc: 'Thumb-stop power' },
    { label: 'Congruencia', score: auditoria.congruencia, desc: '¿Ataca dolores reales?' },
  ];

  return (
    <div className="relative">
      {/* Badge compacto */}
      <button
        onClick={() => setExpandido(!expandido)}
        className={`
          flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-200 shadow-sm
          ${aprobado
            ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-500/20 hover:border-emerald-400 dark:hover:border-emerald-400/40'
            : 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-500/20 hover:border-yellow-400 dark:hover:border-yellow-400/40'
          }
        `}
      >
        <ShieldCheck size={13} className={aprobado ? 'text-emerald-600 dark:text-emerald-400' : 'text-yellow-600 dark:text-yellow-400'} />
        <span className={`text-xs font-bold tabular-nums ${aprobado ? 'text-emerald-700 dark:text-emerald-400' : 'text-yellow-700 dark:text-yellow-400'}`}>
          {auditoria.promedioGeneral}/10
        </span>
        <span className="text-[10px] text-muted-foreground hidden sm:inline">Ouroboros</span>

        {auditoria.iteracionesRefinamiento > 0 && (
          <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground/60">
            <RefreshCw size={9} />
            {auditoria.iteracionesRefinamiento}
          </span>
        )}

        <ChevronDown
          size={11}
          className={`text-muted-foreground/60 transition-transform duration-200 ${expandido ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Panel expandido */}
      <AnimatePresence>
        {expandido && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 z-50 w-72 rounded-xl border border-border bg-card shadow-xl p-4 space-y-3"
          >
            {/* Título */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles size={13} className="text-primary" />
                <span className="text-xs font-bold text-foreground/80">Auditoría Ouroboros</span>
              </div>
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                aprobado
                  ? 'bg-emerald-100 dark:bg-emerald-400/10 text-emerald-700 dark:text-emerald-400'
                  : 'bg-yellow-100 dark:bg-yellow-400/10 text-yellow-700 dark:text-yellow-400'
              }`}>
                {aprobado ? 'APROBADO' : 'REFINADO'}
              </span>
            </div>

            {/* Métricas */}
            <div className="space-y-2">
              {metricas.map(({ label, score, desc }) => (
                <div key={label} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground">{label}</span>
                    <span className={`text-xs font-bold tabular-nums ${colorScore(score)}`}>
                      {score}
                    </span>
                  </div>
                  {/* Barra de progreso */}
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${score * 10}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      className={`h-full rounded-full ${bgScore(score)}`}
                      style={{ opacity: 0.75 }}
                    />
                  </div>
                  <p className="text-[9px] text-muted-foreground/60">{desc}</p>
                </div>
              ))}
            </div>

            {/* Score promedio */}
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <span className="text-[11px] text-muted-foreground">Promedio general</span>
              <span className={`text-sm font-bold tabular-nums ${colorScore(auditoria.promedioGeneral)}`}>
                {auditoria.promedioGeneral}/10
              </span>
            </div>

            {/* Info de refinamiento */}
            {auditoria.iteracionesRefinamiento > 0 && (
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60 pt-1">
                <RefreshCw size={10} />
                <span>
                  {auditoria.iteracionesRefinamiento} iteración(es) de refinamiento automático
                </span>
              </div>
            )}

            {/* Bloques débiles */}
            {auditoria.bloquesDebiles.length > 0 && (
              <div className="space-y-1 pt-1">
                <span className="text-[10px] text-yellow-600 dark:text-yellow-400/60 font-mono">BLOQUES REFINADOS:</span>
                <div className="flex flex-wrap gap-1">
                  {auditoria.bloquesDebiles.map(id => (
                    <span key={id} className={`text-[9px] px-1.5 py-0.5 rounded border ${borderScore(6)} text-yellow-700 dark:text-yellow-400/60 bg-yellow-50 dark:bg-yellow-400/5`}>
                      {id}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
