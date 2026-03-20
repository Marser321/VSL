// app/api/generate/hooks/route.ts
// Genera 3 variantes de Hook A/B/C: Gancho Directo, Gancho de Historia, Gancho de Contraste de Dolor
export const maxDuration = 60;
import { NextRequest, NextResponse } from 'next/server';
import type { DatosCliente } from '@/lib/utils';
import { buildHooksPrompt } from '@/lib/prompts';
import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';

export async function POST(req: NextRequest) {
  try {
    const { datosCliente } = await req.json() as {
      datosCliente: DatosCliente;
    };

    const GOOGLE_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    if (!GOOGLE_API_KEY) {
      return NextResponse.json({
        exito: true,
        fuente: 'modo_demo',
        hooks: generarHooksDemo(datosCliente),
        nota: 'Configurá GOOGLE_GENERATIVE_AI_API_KEY en .env.local para hooks generados por IA real',
      });
    }

    // Construir prompt maestro para hooks
    const prompt = buildHooksPrompt(datosCliente);

    try {
      const HookSchema = z.object({
        texto: z.string(),
        angulo: z.string(),
        dolor_atacado: z.string(),
        por_que_funciona: z.string(),
        justificacion_educativa: z.string()
      });

      const { object } = await generateObject({
        model: google('gemini-2.5-flash'),
        prompt,
        schema: z.object({
          hookA: HookSchema,
          hookB: HookSchema,
          hookC: HookSchema
        })
      });

      return NextResponse.json({
        exito: true,
        fuente: 'gemini_ai',
        hooks: object,
      });
    } catch (aiError) {
      console.error('[API/hooks] AI Error:', aiError);
      return NextResponse.json({
        exito: true,
        fuente: 'modo_demo',
        hooks: generarHooksDemo(datosCliente),
        nota: 'Error con Gemini AI. Usando hooks de demostración.',
      });
    }

  } catch (error) {
    console.error('[API/hooks] Error:', error);
    return NextResponse.json({ exito: false, error: 'Error al generar hooks' }, { status: 500 });
  }
}

// ─── Hooks de demostración con Motor Emocional reforzado ─────────────────────────
function generarHooksDemo(datos: DatosCliente) {
  const zona = datos.zonaGeografica || 'tu ciudad';

  return {
    hookA: {
      texto: `¿Sos de los que salen del taller con la factura y piensan "seguro me cobraron de más... pero no sé lo suficiente como para reclamar"? Esa vocecita que te dice "me vieron la cara" pero no podés demostrarlo. En ${zona}, 7 de cada 10 personas sienten exactamente lo mismo. No sos vos. El problema es otro. Y este video te lo va a demostrar.`,
      angulo: 'Gancho Directo',
      dolor_atacado: 'El sentimiento de humillación silenciosa por no poder verificar si te estafaron o no',
      por_que_funciona: `PALANCA 4 (VOZ INTERNA) + dato demoledor. Abrimos con la pregunta de identidad "¿sos de los que..." que obliga al prospecto a auto-clasificarse — esto activa el "self-referencing effect" (Rogers, Kuiper & Kirker): la información que refiere al YO se procesa 3x más profundo. La voz interna entrecomillada ("me vieron la cara") valida un pensamiento vergonzoso que la persona TIENE pero nunca dice. El dato 7/10 normaliza el dolor y baja la defensa. Según el "identifiable victim effect" (Slovic), las personas responden más cuando se sienten personalmente implicadas.`,
      justificacion_educativa: `¿Sabés por qué este hook arranca con "¿Sos de los que...?" en lugar de "¿Alguna vez te pasó que...?"? Es como la diferencia entre decir "hay gente que sufre inundaciones" vs. "¿vos sos de los que viven en zona de inundación?". El segundo te pega EN PRIMERA PERSONA. Psicólogos de la Universidad de Toronto demostraron que cuando la información se conecta con el "yo" del lector, se procesa 3 veces más profundo en la memoria. Y esa frase entre comillas ("me vieron la cara") es dinamita — porque es algo que TODOS pensaron pero nadie dice en voz alta. Al leerlo, el prospecto piensa "¡esto me pasa a mí!" y ya no puede dejar de mirar.`,
    },
    hookB: {
      texto: `Viernes, 6:45 PM. Llegás al taller a buscar el auto. El portón está medio cerrado. Golpeás. Nadie sale. Esperás 10 minutos parado en la vereda, con el sol pegándote en la nuca. Finalmente aparece alguien: "Ah, no... tu auto todavía no está. Volvé el lunes." Ni una disculpa. Ni un llamado previo. Vos ahí, con los planes del finde arruinados, pensando: "¿Y ahora cómo vuelvo a casa?"`,
      angulo: 'Gancho de Historia',
      dolor_atacado: 'La impotencia física y emocional de depender de alguien que no te respeta ni tu tiempo ni tu dignidad',
      por_que_funciona: `PALANCA 3 (MICRO-ESCENA SENSORIAL) en máxima potencia. Cada detalle está diseñado para activar "embodied cognition" (Barsalou): la hora exacta (6:45 PM), el sol en la nuca, el portón medio cerrado, los 10 minutos de espera. El cerebro no distingue entre una escena RECORDADA y una LEÍDA con suficiente detalle — por eso el prospecto SIENTE la frustración. La ausencia de disculpa amplifica el sesgo de "expectation violation" (Burgoon): esperamos un mínimo de cortesía, y cuando no llega, la indignación se multiplica. Terminamos con una pregunta interna del avatar para activar la Palanca 4.`,
      justificacion_educativa: `¿Alguna vez leíste algo y se te hizo un nudo en el estómago? Eso es "embodied cognition" — tu cerebro no distingue entre VIVIR una situación y LEERLA con suficiente detalle. Es el mismo truco que usan los directores de cine: no te dicen "estaba nervioso", te muestran cómo le tiembla la mano con el café. Este hook hace lo mismo — en lugar de decir "los talleres no cumplen", te PONE en la escena: el sol, la vereda, el portón cerrado, la espera. Stanford demostró que las historias con detalles sensoriales son 22 veces más memorables que los datos sueltos. Por eso los 10 primeros segundos de una VSL DEBEN ser una historia, no un slogan.`,
    },
    hookC: {
      texto: `Un estudio de ADEPA reveló que el uruguayo promedio gasta $45.000 al año en reparaciones de auto. De esos, un 38% — casi $17.000 — son por trabajos mal hechos que hay que repetir. Son 17.000 pesos que le regalaste a alguien que te miró a la cara y te dijo "ya está perfecto". Con $17.000 pagabas las vacaciones de tus hijos en termas. Con $17.000 pagabas 6 meses de internet en tu casa. Pero se lo diste a un taller que ni siquiera te llamó para avisarte que el auto estaba listo.`,
      angulo: 'Gancho de Contraste de Dolor',
      dolor_atacado: 'La injusticia económica concreta: dinero tirado en trabajos que no sirvieron y que podría haber sido para tu familia',
      por_que_funciona: `PALANCA 2 (FUTURO ROBADO) + anclaje numérico + "mental accounting" (Thaler). Los números específicos ($45.000, 38%, $17.000) activan "processing fluency" — la especificidad se percibe más creíble que redondeos. La conversión de dinero abstracto en experiencias concretas (vacaciones, internet) aplica "mental accounting": el prospecto re-categoriza ese gasto de "mantenimiento del auto" a "vacaciones robadas a mis hijos", lo cual multiplica el dolor emocional. El cierre con el detalle ("ni te llamó") añade la indignación personal. Según Ariely, el "pain of paying" se multiplica 4x cuando el valor percibido es cero.`,
      justificacion_educativa: `¿Notaste que convertimos "$17.000" en "vacaciones de tus hijos" y "6 meses de internet"? Es un truco que usan los mejores vendedores del mundo y tiene un nombre: "mental accounting" (lo descubrió Richard Thaler, Nobel de Economía). Cuando decís "$17.000 perdidos" el cerebro dice "bueno, es plata". Pero cuando decís "$17.000 = vacaciones de tus hijos que no fueron" el cerebro SIENTE la pérdida. Es como cuando tu mamá te decía "¿sabés cuántos niños no tienen para comer?" — de golpe el plato de comida tenía otro peso. Los datos específicos (38%, $45.000) no están al azar: Dan Ariely (MIT) demostró que los números quebrados (no redondos) se perciben 2.5x más creíbles que los redondos.`,
    },
  };
}

