// lib/utils.ts — Utilidades compartidas del proyecto VSL Generator
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Tipos principales
export interface DatosCliente {
  nombreNegocio: string;
  avatarObjetivo: string;
  problemasPrincipal: string;
  zonaGeografica: string;
  competidoresInfo: string;
  quejasComunes: string;
  propuestaUnica: string;
  pruebaSocial?: string;
}

export interface HallazgoResearch {
  fuente: 'firecrawl' | 'google_maps' | 'ia_analisis';
  titulo: string;
  contenido: string;
  debilidades?: string[];
  doloresPrincipales?: string[];
  url?: string;
  extraccionEstructurada?: any;
}

export interface BloqueVSL {
  id: string;
  tipo: 'hook' | 'problema' | 'agitacion' | 'solucion' | 'prueba_social' | 'credibilidad' | 'oferta' | 'garantia' | 'cta';
  titulo: string;
  texto: string;
  logicaConversion: string;
  anguloUsado: string;
  dolorAtacado: string;
  justificacionEducativa: string;
}

export interface GuionVSL {
  hookA: string;
  hookB: string;
  hookC: string;
  hookSeleccionado: 'A' | 'B' | 'C';
  bloques: BloqueVSL[];
}

export interface ProyectoVSL {
  id?: string;
  datosCliente: DatosCliente;
  guion?: GuionVSL;
  etapaActual: 'configuracion' | 'editor';
}

// Resultado de la auditoría interna Ouroboros
export interface ResultadoAuditoria {
  claridad: number;
  retencion: number;
  congruencia: number;
  promedioGeneral: number;
  bloquesDebiles: string[];
  sugerenciasMejora: Record<string, string>;
  iteracionesRefinamiento: number;
}

// Nombres amigables para los tipos de bloque
export const NOMBRE_BLOQUE: Record<BloqueVSL['tipo'], string> = {
  hook: '🎯 Hook de Apertura',
  problema: '😤 El Problema',
  agitacion: '🔥 Agitación',
  solucion: '✨ La Solución',
  prueba_social: '⭐ Prueba Social',
  credibilidad: '🏆 Credibilidad',
  oferta: '💎 La Oferta',
  garantia: '🛡️ La Garantía',
  cta: '🚀 Llamada a la Acción',
};

// Colores de badge por tipo de bloque
export const COLOR_BLOQUE: Record<BloqueVSL['tipo'], string> = {
  hook: 'bg-[#4A90D9]/20 text-[#60A5FA] border-[#4A90D9]/30',
  problema: 'bg-orange-950/30 text-orange-400 border-orange-800/30',
  agitacion: 'bg-red-950/30 text-red-400 border-red-800/30',
  solucion: 'bg-emerald-950/30 text-emerald-400 border-emerald-800/30',
  prueba_social: 'bg-yellow-950/30 text-yellow-400 border-yellow-800/30',
  credibilidad: 'bg-blue-950/30 text-blue-400 border-blue-800/30',
  oferta: 'bg-purple-950/30 text-purple-400 border-purple-800/30',
  garantia: 'bg-cyan-950/30 text-cyan-400 border-cyan-800/30',
  cta: 'bg-[#4A90D9]/30 text-[#FF6677] border-[#4A90D9]/50',
};
