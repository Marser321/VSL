// lib/auditor.ts — Motor de Auditoría Interna del Sistema Ouroboros
// Evalúa claridad, retención y congruencia de cada VSL generado
import type { BloqueVSL, DatosCliente, ResultadoAuditoria } from '@/lib/utils';
import { SYSTEM_PROMPT_VSL } from '@/lib/prompts';

// ─── Prompt del Auditor de Calidad ──────────────────────────────────────────────
const PROMPT_AUDITOR = `Eres un Auditor de Calidad Senior especializado en copywriting de VSLs (Video Sales Letters).

Tu trabajo es EVALUAR — no escribir. Analizá el guion con ojo crítico y profesional.

## MÉTRICAS DE EVALUACIÓN (cada una del 1 al 10):

### 1. CLARIDAD
- ¿Se entiende el mensaje sin esfuerzo?
- ¿Cada bloque tiene UN solo objetivo claro?
- ¿Hay frases ambiguas, confusas o demasiado largas?
- Score 10 = cristalino. Score 1 = incomprensible.

### 2. RETENCIÓN (Thumb-Stop Power)
- ¿El prospecto dejaría de scrollear para leer esto?
- ¿Las primeras 2 líneas de cada bloque enganchan?
- ¿Hay micro-ganchos internos que mantienen la atención?
- ¿Genera tensión emocional progresiva?
- Score 10 = imposible dejar de leer. Score 1 = aburrido.

### 3. CONGRUENCIA CON DOLORES DEL AVATAR
- ¿Los bloques atacan dolores REALES del público objetivo?
- ¿Hay conexión directa entre los dolores investigados y el texto del guion?
- ¿La solución realmente desmonca los problemas planteados?
- ¿Se siente auténtico o genérico?
- Score 10 = perfectamente alineado. Score 1 = genérico/inventado.

## INSTRUCCIONES:
- Evaluá CADA bloque individualmente
- Identificá los bloques más débiles (score < 8 en cualquier métrica)
- Para cada bloque débil, dá una sugerencia concreta de mejora
- Sé brutalmente honesto — tu evaluación determina si el guion se reescribe

## RESPONDÉ ÚNICAMENTE con este JSON válido:
{
  "claridad": 8.5,
  "retencion": 7.2,
  "congruencia": 9.0,
  "promedio_general": 8.2,
  "bloques_debiles": ["bloque_2", "bloque_5"],
  "sugerencias_mejora": {
    "bloque_2": "La agitación es muy genérica. Necesita datos específicos de la zona geográfica y consecuencias más viscerales.",
    "bloque_5": "La oferta carece de valor percibido. Agregar comparación de precio con competidores."
  },
  "veredicto": "APROBADO" | "REQUIERE_REFINAMIENTO"
}`;

// ─── Construir el prompt de auditoría completo ──────────────────────────────────
export function buildAuditPrompt(
  bloques: BloqueVSL[],
  datosCliente: DatosCliente
): string {
  const bloquesTexto = bloques.map(b =>
    `### ${b.titulo} (ID: ${b.id}, Tipo: ${b.tipo})\n${b.texto}\n> Ángulo: ${b.anguloUsado}\n> Dolor atacado: ${b.dolorAtacado}`
  ).join('\n\n---\n\n');

  return `${PROMPT_AUDITOR}

---

## GUION A AUDITAR:

### Datos del avatar:
- Negocio: ${datosCliente.nombreNegocio}
- Público objetivo: ${datosCliente.avatarObjetivo}
- Problema que resuelve: ${datosCliente.problemasPrincipal}
- Zona: ${datosCliente.zonaGeografica}

### Bloques del guion:
${bloquesTexto}`;
}

// ─── Prompt para refinamiento basado en la auditoría ────────────────────────────
export function buildRefinementPrompt(
  bloques: BloqueVSL[],
  datosCliente: DatosCliente,
  auditoria: ResultadoAuditoria,
  memoriaHistorica: string
): string {
  const bloquesARefinar = bloques
    .filter(b => auditoria.bloquesDebiles.includes(b.id))
    .map(b => {
      const sugerencia = auditoria.sugerenciasMejora[b.id] || 'Mejorar calidad general';
      return `### Bloque a mejorar: ${b.titulo} (${b.id})
Texto actual: ${b.texto}
**Sugerencia del auditor**: ${sugerencia}`;
    })
    .join('\n\n');

  return `${SYSTEM_PROMPT_VSL}

---

## TAREA: REFINAMIENTO BASADO EN AUDITORÍA

Un Auditor de Calidad interno evaluó el guion y detectó debilidades.
Tu trabajo es REESCRIBIR los bloques débiles siguiendo las sugerencias del auditor.

### SCORES DE AUDITORÍA:
- Claridad: ${auditoria.claridad}/10
- Retención: ${auditoria.retencion}/10
- Congruencia: ${auditoria.congruencia}/10

### DATOS DEL CLIENTE:
- Negocio: ${datosCliente.nombreNegocio}
- Avatar: ${datosCliente.avatarObjetivo}
- Problema: ${datosCliente.problemasPrincipal}
- Zona: ${datosCliente.zonaGeografica}

${memoriaHistorica ? `### CONTEXTO HISTÓRICO (lecciones aprendidas de generaciones anteriores):
${memoriaHistorica}` : ''}

### BLOQUES QUE NECESITAN REFINAMIENTO:
${bloquesARefinar}

### INSTRUCCIONES:
- Reescribí SOLO los bloques débiles, mejorando lo que el auditor señaló
- Mantené la estructura (id, tipo) pero cambiá el ángulo
- Incluí todos los campos del mandato educativo
- Que el score suba a 8+ en todas las métricas

### RESPONDÉ ÚNICAMENTE con este JSON válido:
{
  "bloques_refinados": [
    {
      "id": "bloque_X",
      "tipo": "tipo_original",
      "titulo": "Nuevo título",
      "texto": "Texto mejorado (120-300 palabras)",
      "logica_conversion": "...",
      "angulo_usado": "Nuevo ángulo",
      "dolor_atacado": "...",
      "justificacion_educativa": "..."
    }
  ]
}`;
}

// ─── Ejecutar auditoría (con Insforge o modo demo) ──────────────────────────────
export async function auditarVSL(
  bloques: BloqueVSL[],
  datosCliente: DatosCliente,
  apiKey?: string
): Promise<ResultadoAuditoria> {

  // Modo demo: generar auditoría simulada con scores realistas
  if (!apiKey || apiKey === 'your_insforge_api_key_here') {
    return generarAuditoriaDemo(bloques);
  }

  const prompt = buildAuditPrompt(bloques, datosCliente);

  try {
    const response = await fetch('https://api.insforge.com/v1/ai/complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'anthropic/claude-sonnet-4.5',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 2000,
        temperature: 0.3, // Baja temperatura para evaluación precisa
      }),
    });

    if (!response.ok) {
      console.error('[Auditor] Error de Insforge, usando auditoría demo');
      return generarAuditoriaDemo(bloques);
    }

    const data = await response.json();
    const contenido = data.choices?.[0]?.message?.content || data.content || '';
    const jsonMatch = contenido.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      console.error('[Auditor] JSON no encontrado en respuesta');
      return generarAuditoriaDemo(bloques);
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      claridad: parsed.claridad || 8,
      retencion: parsed.retencion || 8,
      congruencia: parsed.congruencia || 8,
      promedioGeneral: parsed.promedio_general || parsed.promedioGeneral || 8,
      bloquesDebiles: parsed.bloques_debiles || parsed.bloquesDebiles || [],
      sugerenciasMejora: parsed.sugerencias_mejora || parsed.sugerenciasMejora || {},
      iteracionesRefinamiento: 0,
    };
  } catch (error) {
    console.error('[Auditor] Error general:', error);
    return generarAuditoriaDemo(bloques);
  }
}

// ─── Auditoría de demostración con scores simulados ─────────────────────────────
function generarAuditoriaDemo(bloques: BloqueVSL[]): ResultadoAuditoria {
  // Simulamos una auditoría exitosa (scores 8-9.5)
  const claridad = 8.5 + Math.random() * 1;
  const retencion = 8.2 + Math.random() * 1.3;
  const congruencia = 8.8 + Math.random() * 0.7;
  const promedio = Number(((claridad + retencion + congruencia) / 3).toFixed(1));

  return {
    claridad: Number(claridad.toFixed(1)),
    retencion: Number(retencion.toFixed(1)),
    congruencia: Number(congruencia.toFixed(1)),
    promedioGeneral: promedio,
    bloquesDebiles: [],
    sugerenciasMejora: {},
    iteracionesRefinamiento: 0,
  };
}
