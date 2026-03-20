// lib/memory.ts — Sistema de Memoria Persistente del Ouroboros
// Lee y escribe en .agents/memory/memory_log.md para inyectar contexto histórico
import { promises as fs } from 'fs';
import path from 'path';
import type { ResultadoAuditoria } from '@/lib/utils';

const MEMORY_PATH = path.join(process.cwd(), '.agents', 'memory', 'memory_log.md');

// ─── Leer el archivo de memoria completo ────────────────────────────────────────
export async function leerMemoria(): Promise<string> {
  try {
    const contenido = await fs.readFile(MEMORY_PATH, 'utf-8');
    return contenido;
  } catch {
    // Si no existe, retornar vacío
    return '';
  }
}

// ─── Obtener las últimas N lecciones como contexto para el prompt ────────────────
export async function obtenerContextoHistorico(maxEntradas: number = 10): Promise<string> {
  const contenido = await leerMemoria();

  if (!contenido || contenido.includes('Aún no hay entradas registradas')) {
    return '';
  }

  // Extraer las últimas N entradas (separadas por "## ")
  const entradas = contenido.split(/^## /gm).filter(e => e.trim().length > 20);
  const ultimas = entradas.slice(-maxEntradas);

  if (ultimas.length === 0) return '';

  return `### LECCIONES APRENDIDAS DE GENERACIONES ANTERIORES:\n\n${
    ultimas.map(e => `## ${e.trim()}`).join('\n\n')
  }`;
}

// ─── Registrar un nuevo aprendizaje en el memory_log ────────────────────────────
export async function registrarAprendizaje(entrada: {
  nombreNegocio: string;
  enfoqueUsado: string;
  auditoria: ResultadoAuditoria;
  queFunciono: string;
  queFallo: string;
}): Promise<void> {
  try {
    // Asegurar que el directorio existe
    const dir = path.dirname(MEMORY_PATH);
    await fs.mkdir(dir, { recursive: true });

    const fecha = new Date().toISOString().split('T')[0];
    const hora = new Date().toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' });

    const nuevaEntrada = `

## ${fecha} ${hora} — ${entrada.nombreNegocio}
- **Enfoque usado**: ${entrada.enfoqueUsado}
- **Score auditoría**: Claridad: ${entrada.auditoria.claridad} | Retención: ${entrada.auditoria.retencion} | Congruencia: ${entrada.auditoria.congruencia} | Promedio: ${entrada.auditoria.promedioGeneral}
- **Iteraciones de refinamiento**: ${entrada.auditoria.iteracionesRefinamiento}
- **Qué funcionó**: ${entrada.queFunciono}
- **Qué falló**: ${entrada.queFallo || 'Nada — pasó la auditoría en la primera iteración'}
`;

    // Leer contenido actual y eliminar el placeholder si existe
    let contenidoActual = await leerMemoria();
    if (contenidoActual.includes('Aún no hay entradas registradas')) {
      contenidoActual = contenidoActual.replace(
        /\n_Aún no hay entradas registradas\..*_/g, ''
      );
    }

    await fs.writeFile(MEMORY_PATH, contenidoActual + nuevaEntrada, 'utf-8');
    console.log(`[Memory] Aprendizaje registrado para "${entrada.nombreNegocio}"`);
  } catch (error) {
    console.error('[Memory] Error al registrar aprendizaje:', error);
  }
}
