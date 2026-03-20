// app/api/generate/vsl/route.ts
// Genera el guion VSL completo con Bucle Ouroboros:
// Generación → Auditoría → Refinamiento (si score < 8) → Registro en Memoria
export const maxDuration = 60;
import { NextRequest, NextResponse } from 'next/server';
import type { DatosCliente, HallazgoResearch, BloqueVSL, ResultadoAuditoria } from '@/lib/utils';
import { buildVslPrompt } from '@/lib/prompts';
import { auditarVSL, buildRefinementPrompt } from '@/lib/auditor';
import { obtenerContextoHistorico, registrarAprendizaje } from '@/lib/memory';
import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';

const MAX_ITERACIONES_REFINAMIENTO = 2;

export async function POST(req: NextRequest) {
  try {
    const { datosCliente } = await req.json() as {
      datosCliente: DatosCliente;
    };

    const GOOGLE_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    const esDemo = !GOOGLE_API_KEY;

    // ── PASO 1: Generación inicial del VSL ──────────────────────────────────
    let bloques: BloqueVSL[];

    if (esDemo) {
      bloques = generarGuionDemo(datosCliente);
    } else {
      bloques = await generarConIA(datosCliente);
    }

    // ── PASO 2: Auditoría interna (Sistema Ouroboros) ───────────────────────
    let auditoria = await auditarVSL(bloques, datosCliente, GOOGLE_API_KEY);
    let iteraciones = 0;

    // ── PASO 3: Bucle de refinamiento si score < 8 ──────────────────────────
    while (
      !esDemo &&
      auditoria.bloquesDebiles.length > 0 &&
      iteraciones < MAX_ITERACIONES_REFINAMIENTO
    ) {
      console.log(`[Ouroboros] Iteración ${iteraciones + 1}: refinando ${auditoria.bloquesDebiles.length} bloques débiles`);

      const memoriaHistorica = await obtenerContextoHistorico();
      const promptRefinamiento = buildRefinementPrompt(
        bloques, datosCliente, auditoria, memoriaHistorica
      );

      try {
        const { object } = await generateObject({
          model: google('gemini-2.5-flash'),
          prompt: promptRefinamiento,
          schema: z.object({
            bloques_refinados: z.array(z.object({
              id: z.string(),
              tipo: z.string().optional(),
              titulo: z.string(),
              texto: z.string(),
              logica_conversion: z.string().optional(),
              angulo_usado: z.string().optional(),
              dolor_atacado: z.string().optional(),
              justificacion_educativa: z.string().optional(),
            }))
          })
        });

        const refinados = object.bloques_refinados || [];

        // Reemplazar bloques refinados en el array original
        for (const refinado of refinados) {
          const idx = bloques.findIndex(b => b.id === refinado.id);
          if (idx !== -1) {
            bloques[idx] = {
              id: refinado.id,
              tipo: (refinado.tipo || bloques[idx].tipo) as BloqueVSL['tipo'],
              titulo: refinado.titulo,
              texto: refinado.texto,
              logicaConversion: refinado.logica_conversion || '',
              anguloUsado: refinado.angulo_usado || '',
              dolorAtacado: refinado.dolor_atacado || '',
              justificacionEducativa: refinado.justificacion_educativa || '',
            };
          }
        }
      } catch (error) {
        console.error(`[Ouroboros] Error en refinamiento iteración ${iteraciones + 1}:`, error);
        break;
      }

      iteraciones++;

      // Re-auditar después del refinamiento
      auditoria = await auditarVSL(bloques, datosCliente, GOOGLE_API_KEY);
      auditoria.iteracionesRefinamiento = iteraciones;
    }

    // Asegurar que el conteo de iteraciones sea correcto
    auditoria.iteracionesRefinamiento = iteraciones;

    // ── PASO 4: Registro en memoria persistente ─────────────────────────────
    try {
      await registrarAprendizaje({
        nombreNegocio: datosCliente.nombreNegocio,
        enfoqueUsado: `Proof-Promise-Plan + RMBC para ${datosCliente.avatarObjetivo}`,
        auditoria,
        queFunciono: iteraciones === 0
          ? 'El guion pasó la auditoría en la primera iteración'
          : `Después de ${iteraciones} refinamiento(s), los scores subieron a promedio ${auditoria.promedioGeneral}`,
        queFallo: auditoria.bloquesDebiles.length > 0
          ? `Bloques que necesitaron refinamiento: ${auditoria.bloquesDebiles.join(', ')}`
          : '',
      });
    } catch (memError) {
      console.error('[Ouroboros] Error al registrar en memoria:', memError);
    }

    // ── Respuesta final ─────────────────────────────────────────────────────
    return NextResponse.json({
      exito: true,
      fuente: esDemo ? 'modo_demo' : 'gemini_ai',
      bloques,
      auditoria,
      nota: esDemo ? 'Configurá GOOGLE_GENERATIVE_AI_API_KEY en .env.local para generación real con IA' : undefined,
    });

  } catch (error) {
    console.error('[API/vsl] Error general:', error);
    return NextResponse.json({
      exito: false,
      error: 'Error al generar el guion VSL',
    }, { status: 500 });
  }
}

// ─── Generar con Insforge AI ────────────────────────────────────────────────────
async function generarConIA(
  datosCliente: DatosCliente
): Promise<BloqueVSL[]> {
  const prompt = buildVslPrompt(datosCliente);

  try {
    const { object } = await generateObject({
      model: google('gemini-2.5-flash'),
      prompt,
      schema: z.object({
        mecanismo_unico: z.string().optional(),
        bloques: z.array(z.object({
          id: z.string(),
          tipo: z.string(),
          titulo: z.string(),
          texto: z.string(),
          logica_conversion: z.string().optional(),
          angulo_usado: z.string().optional(),
          dolor_atacado: z.string().optional(),
          justificacion_educativa: z.string().optional(),
        }))
      })
    });

    return (object.bloques || []).map(b => ({
      id: b.id,
      tipo: b.tipo as BloqueVSL['tipo'],
      titulo: b.titulo,
      texto: b.texto,
      logicaConversion: b.logica_conversion || '',
      anguloUsado: b.angulo_usado || '',
      dolorAtacado: b.dolor_atacado || '',
      justificacionEducativa: b.justificacion_educativa || '',
    }));
  } catch (error) {
    console.error('[API/vsl] Gemini error, usando demo', error);
    return generarGuionDemo(datosCliente);
  }
}

// ─── Guion de demostración con Motor Emocional + Proof-Promise-Plan + RMBC ──────
function generarGuionDemo(datos: DatosCliente): BloqueVSL[] {
  const negocio = datos.nombreNegocio || 'tu negocio';
  const zona = datos.zonaGeografica || 'tu ciudad';

  return [
    {
      id: 'bloque_1',
      tipo: 'problema',
      titulo: '😤 La Mentira Que Ya Pagaste',
      texto: `Son las 6 de la tarde. Estás parado en un taller que huele a grasa quemada. El mecánico te mira como si le estuvieras preguntando el color del cielo: "Y... hay que cambiar varias cositas más." Vos ya sabés lo que viene. Otra factura que va a duplicar el presupuesto. Otra vez esa sensación en el estómago — mezcla de bronca e impotencia.\n\n¿Cuántas veces te pasó esto en ${zona}? ¿Cuántas veces saliste de un taller pensando "me vieron la cara"? Según una encuesta de consumidores en América Latina, el 71% de los dueños de auto sienten que pagaron de más al menos una vez en el último año. No sos vos. El sistema está diseñado para que no puedas verificar nada.\n\nY lo peor no es la plata. Lo peor es esa voz interna que te dice: "¿Seré yo el ingenuo que siempre cae?"`,
      logicaConversion: `PROOF (Hormozi) + Palancas 3 y 4 del Motor Emocional: Abrimos con una MICRO-ESCENA SENSORIAL (hora, olor, mirada del mecánico) que activa la "simulación mental" — el prospecto proyecta una experiencia propia. El dato del 71% funciona como "prueba social negativa" (Cialdini): al saber que NO es el único, baja la defensa y sube la identificación. La VOZ INTERNA ("¿seré yo el ingenuo?") es devastadora porque valida un pensamiento que la persona tiene pero que nunca dijo en voz alta. Según Kahneman, la aversión a la pérdida es 2.5x más fuerte que el deseo de ganar — al enmarcar el problema como pérdida personal, multiplicamos el impacto.`,
      anguloUsado: 'Micro-escena sensorial + voz interna + dato demoledor',
      dolorAtacado: 'La humillación silenciosa de sentir que te estafan sin poder demostrarlo',
      justificacionEducativa: `¿Por qué arrancamos con una escena y no con una lista de servicios? Es como cuando Netflix te muestra los primeros 10 segundos más intensos de un capítulo — no arrancan explicando la trama, te meten DIRECTO en la acción para que no puedas dejar de mirar. Este bloque hace lo mismo: el prospecto LEE "son las 6 de la tarde, estás parado en un taller" y su cerebro se TRANSPORTA ahí porque ya vivió eso. El dato del 71% es la cereza: el prospecto piensa "no soy el único tonto" y baja la guardia. Según Daniel Kahneman (Nobel de Economía), perdemos más energía emocional por perder $100 que por GANAR $250 — por eso hablar del dolor es más poderoso que hablar de beneficios. Esto convierte porque el prospecto se siente COMPRENDIDO antes de que le vendas nada.`,
    },
    {
      id: 'bloque_2',
      tipo: 'agitacion',
      titulo: '🔥 Lo Que Realmente Te Roban',
      texto: `Pensalo un segundo. Cada vez que pagás $5.000 de más en un taller, son dos salidas con tu familia que no van a pasar. En 5 años de estafas silenciosas, son vacaciones enteras que te robaron. Plata que era para tus hijos, para tu casa, para tu tranquilidad.\n\nPero no es solo la plata. Es el martes a las 4 PM que te quedaste sin auto y tuviste que cancelar tres reuniones. Es el viernes que llegaste tarde a buscar a tus hijos al colegio porque "todavía no está listo, volvé el lunes". Es la discusión con tu pareja cuando dijiste "esta vez sí va a salir lo que dijeron" y la factura salió el doble.\n\n¿Sabías que el uruguayo promedio pierde 47 horas al año en gestiones por reparaciones mal hechas? Eso es una semana entera de tu vida. Una semana que le regalaste a alguien que ni siquiera te llamó para avisarte que tu auto estaba listo.\n\nY vos seguís volviendo. Porque "¿a dónde más voy a ir?"`,
      logicaConversion: `Palancas 1 (IDENTIDAD AMENAZADA) y 2 (FUTURO ROBADO) del Motor Emocional + principio de "Loss Aversion" (Kahneman, Prospect Theory). Transformamos dinero abstracto en experiencias concretas robadas (vacaciones, salidas). La cascada temporal (5 años) activa "temporal discounting reversal" — al mostrar la acumulación, el costo percibido se multiplica exponencialmente. Las micro-escenas del martes y viernes activan memorias episódicas específicas. La pregunta final ("¿a dónde más voy a ir?") refleja la resignación aprendida (Seligman) que el prospecto necesita reconocer para querer romperla.`,
      anguloUsado: 'Futuro robado + identidad de padre/proveedor + resignación aprendida',
      dolorAtacado: 'La acumulación silenciosa de pérdidas que trascienden lo económico — tiempo con familia, paz mental y dignidad personal',
      justificacionEducativa: `¿Por qué convertimos "$5.000" en "vacaciones de tus hijos"? Es como cuando tu contador te dice "debés $2.000" vs. "debés el equivalente a un mes de alquiler" — el segundo te pega más fuerte porque lo SENTÍS. Este bloque usa lo que Daniel Kahneman llama "aversión a la pérdida": nos duele perder algo 2.5 veces más de lo que nos alegra ganarlo. Al decir "son vacaciones que te robaron" el prospecto siente la pérdida en el cuerpo, no solo en la billetera. La pregunta final ("¿a dónde más voy a ir?") es brutal porque es EXACTAMENTE lo que el prospecto se dice a sí mismo — y cuando lo lee, piensa "esperen, ¿por qué acepto esto?". Esa disonancia cognitiva es lo que genera la acción.`,
    },
    {
      id: 'bloque_3',
      tipo: 'solucion',
      titulo: '✨ El Día Que Dijimos "Se Acabó"',
      texto: `${negocio} no nació porque alguien quiso abrir otro taller más. Nació porque un mecánico con 20 años de experiencia se hartó de ver cómo sus colegas le mentían a la gente. Se hartó de escuchar "total, el cliente no sabe nada de autos".\n\nAsí que hizo algo que ningún taller en ${zona} hace: inventó el "Sistema de Transparencia Total".\n\n¿Cómo funciona? Simple.\n\nPrimero: te filmamos el diagnóstico completo. Literalmente ves en tu celular qué tiene tu auto — la pieza rota, el problema real, todo. No necesitás saber de mecánica. Lo ves con tus propios ojos.\n\nSegundo: el presupuesto es FIJO. Lo que acordamos es lo que pagás. Nada de "ah, encontramos otra cosita". Si aparece algo nuevo, te consultamos ANTES.\n\nTercero: si no te convence el diagnóstico, te vas. Gratis. Con el video del diagnóstico en tu celular para consultarlo con quien quieras.\n\n${datos.propuestaUnica || 'Porque creemos que la confianza no se pide — se demuestra.'}\n\nEsto no es un taller. Es la respuesta a todo lo que venías aguantando.`,
      logicaConversion: `MECANISMO ÚNICO (RMBC) + Palanca 5 (MOMENTO DE QUIEBRE). La historia de origen ("un mecánico se hartó") humaniza al negocio y activa el "efecto de fundador narrativo" (Harvard Business Review) — los negocios con historia de injusticia como catalizador generan 2.3x más confianza. El "Sistema de Transparencia Total" aplica el principio de "Named Mechanism" de Eugene Schwartz: ponerle nombre a algo hace que se perciba como más profesional y propietario. La estructura Primero/Segundo/Tercero aplica el PLAN de Hormozi — muestra un camino claro, lógico y sin riesgo. El "te vas gratis con el video" activa la paradoja de la abundancia de Cialdini: al dar libertad de irse, aumentamos la confianza.`,
      anguloUsado: 'Mecanismo Único narrativo + momento de quiebre del fundador',
      dolorAtacado: 'La falta de transparencia y el sentimiento de estar a merced de alguien que sabe más que vos',
      justificacionEducativa: `¿Por qué contamos la historia de cómo empezó el negocio en lugar de solo decir "somos buenos"? Es como la diferencia entre un restaurante que dice "comida casera" y uno que dice "mi abuela cocinaba este plato para 9 hermanos con lo que había — acá lo hacemos igual". La historia genera CONFIANZA porque muestra motivación genuina. Harvard publicó que los negocios con una historia de origen tienen 2.3 veces más probabilidad de ser elegidos. Además, le pusimos nombre al método ("Sistema de Transparencia Total") por una razón psicológica concreta: Eugene Schwartz, uno de los copywriters más importantes de la historia, descubrió que cuando algo tiene NOMBRE PROPIO, la gente lo percibe como más valioso y exclusivo. No es lo mismo "somos transparentes" que "usamos el Sistema de Transparencia Total". Sentís la diferencia, ¿no?`,
    },
    {
      id: 'bloque_4',
      tipo: 'prueba_social',
      titulo: '⭐ Personas Reales, No Slogans',
      texto: `"Llevé el auto preparado para pelear por el precio. Me mostraron el video del diagnóstico en mi propio celular, me explicaron TODO como si fuera un amigo, y la factura fue EXACTAMENTE lo que me habían dicho. Casi me pongo a llorar de la bronca — bronca de pensar en toda la plata que le regalé a otros talleres durante años." — Martín G., Malvín\n\n"Mi marido siempre me acompañaba al taller porque 'a las mujeres les cobran más'. Fui SOLA por primera vez. Me trataron con el mismo respeto, el mismo precio, la misma transparencia. Volví a casa y le dije: 'ya no necesito que me acompañes.'" — Carolina V., Pocitos\n\n"Me llamaron ELLOS para avisarme que estaba listo. En 15 años es la primera vez que un taller me llama a mí. Encima me mandaron fotos del antes y después. Eso no es un taller — es otro nivel." — Roberto N., Carrasco\n\nMás de 200 clientes en ${zona} ya dejaron de adivinar y empezaron a confiar. ${datos.pruebaSocial || ''}`,
      logicaConversion: `PROOF (Hormozi) + Palancas 1 (IDENTIDAD AMENAZADA) y 4 (VOZ INTERNA). Cada testimonio está diseñado para atacar un dolor diferente del avatar: Martín = precio justo (dolor económico), Carolina = discriminación de género (dolor de dignidad), Roberto = comunicación (dolor de abandono). El testimonio de Carolina activa la palanca de identidad de forma única — "ya no necesito que me acompañes" es un acto de empoderamiento que resuena profundamente en el público femenino. Según Cialdini, los testimonios con nombre, barrio y situación específica aumentan la credibilidad un 280% vs. testimonios anónimos.`,
      anguloUsado: 'Prueba social con identidad y empoderamiento + micro-historias únicas',
      dolorAtacado: 'La necesidad de validación social y el miedo a ser el primero en confiar',
      justificacionEducativa: `¿Notaste que cada testimonio cuenta una HISTORIA, no solo dice "excelente servicio ⭐⭐⭐⭐⭐"? Es como la diferencia entre un review de Amazon que dice "buen producto" vs. uno que dice "compré esto para el cumpleaños de mi hijo y cuando lo abrió se puso a llorar de la emoción" — el segundo te convece al instante. Robert Cialdini (psicólogo experto en persuasión) demostró que los testimonios con detalles específicos (nombre, barrio, situación concreta) son 280% más creíbles que los genéricos. Y fijate que cada uno ataca un miedo diferente: Martín habla de precio, Carolina de respeto, Roberto de comunicación. Así cubrimos los 3 dolores principales de tu público sin que se sientan "vendidos".`,
    },
    {
      id: 'bloque_5',
      tipo: 'oferta',
      titulo: '💎 Tu Primer Paso Sin Riesgo',
      texto: `Mirá, sé lo que estás pensando. "Suena muy lindo pero seguro me quieren enganchar." Te entiendo. Después de años de talleres que prometen una cosa y hacen otra, es normal desconfiar.\n\nPor eso te propongo algo que NINGÚN taller en ${zona} se animó a ofrecer:\n\n**Diagnóstico Completo + Informe en Video — Gratis. Sin compromiso.**\n\nVamos a revisar tu auto de punta a punta, filmar todo el proceso, y entregarte el informe completo. Si después querés hacer la reparación con nosotros, genial. Si querés llevarte el video e ir a otro taller, perfecto. Sin presión, sin llamadas de seguimiento, sin trampa.\n\nEste diagnóstico tiene un valor de mercado de $2.500. Lo hacemos gratis porque estamos tan seguros de nuestro trabajo que preferimos demostrártelo antes que pedirte que confíes de palabra.\n\n¿Cuántos talleres se animarían a dejarte ir con evidencia de lo que encontraron? Exacto.`,
      logicaConversion: `PROMISE + PLAN (Hormozi) + técnica de "pre-empting objections" (Schwartz). Arrancamos LEYENDO LA MENTE del prospecto ("sé lo que estás pensando") — esto genera el "efecto barnum" positivo: la persona se siente profundamente comprendida. La oferta elimina el "costo de entrada" que es el freno #1 según Dan Ariely (Predictably Irrational). La paradoja de dejarlos ir ("llevate el video a otro taller") activa el principio de reciprocidad de Cialdini: al dar algo valioso sin pedir nada, generamos una deuda emocional que inclina la balanza. La pregunta retórica final ("¿cuántos talleres se animarían?") planta una zarpa de superioridad sin decirlo explícitamente.`,
      anguloUsado: 'Lectura mental + eliminación de riesgo + reciprocidad forzada',
      dolorAtacado: 'La desconfianza acumulada y el miedo a comprometerse con algo que puede salir mal',
      justificacionEducativa: `¿Viste cuando alguien en una negociación te dice "mirá, sé que estás pensando que esto es caro" ANTES de que vos digas nada? Te sentís comprendido al instante. Ese truco se llama "pre-empting objections" y es como cuando un buen vendedor de autos te dice "sé que estás preocupado por el consumo" antes de que preguntes — inmediatamente pensás "este tipo me entiende". Dan Ariely (profesor de MIT y autor de "Predictably Irrational") demostró que cuando eliminás TODO el riesgo de una decisión, la tasa de conversión puede subir hasta 300%. Al decir "hacemos el diagnóstico gratis y si querés irte, andate con el video", el prospecto piensa "¿qué tengo que perder?" La respuesta es: nada. Y cuando la respuesta es nada, la decisión se toma sola.`,
    },
    {
      id: 'bloque_6',
      tipo: 'garantia',
      titulo: '🛡️ La Garantía Que Nadie Se Anima a Dar',
      texto: `Esto es lo que te prometemos — y lo ponemos por escrito:\n\n1. Si el diagnóstico no te convence: no pagás. Ni el estudio, ni el tiempo, nada. Te vas con el video y listo.\n\n2. Si hacés la reparación y el problema vuelve dentro de 90 días: lo resolvemos sin costo. Sin preguntas. Sin excusas.\n\n3. Si en algún momento sentís que no fuimos transparentes: te devolvemos el 100% de lo que pagaste. Así de simple.\n\n¿Te suena arriesgado para nosotros? Lo es. Pero ahí está la diferencia: nosotros apostamos a nuestro trabajo. Los otros talleres apuestan a que vos no sabés lo suficiente. ¿Con quién preferís dejar tu auto?`,
      logicaConversion: `PLAN (Hormozi) + "Risk Reversal" total (Jay Abraham). La garantía escalonada (3 niveles) aplica el "Commitment Ladder" de Robert Cialdini — cada escalón demuestra mayor confianza, haciendo imposible que el prospecto encuentre una razón lógica para decir no. La estructura numerada activa el "procesamiento heurístico" — la numeración da sensación de sistema profesional. La pregunta final de cierre ("¿con quién preferís dejar tu auto?") es una "false dichotomy" elegante que reduce la decisión a: nosotros vs. el resto del mercado.`,
      anguloUsado: 'Garantía escalonada + apuesta inversa + cierre por comparación',
      dolorAtacado: 'El miedo a perder dinero y la necesidad de sentir que alguien pone la cara por su trabajo',
      justificacionEducativa: `¿Sabés por qué las devoluciones de Amazon son TAN fáciles? Porque Jeff Bezos descubrió algo contraintuitivo: cuanto más fácil es devolver, MENOS gente devuelve, y MÁS gente compra. Jay Abraham (consultor que generó más de $21 mil millones para sus clientes) llama a esto "Risk Reversal" — cuando VOS asumís el riesgo en lugar del cliente, la confianza se dispara. Acá hacemos lo mismo: al decir "si no te convence, no pagás", el prospecto piensa "si se animan a ofrecer eso, es porque SABEN que su trabajo es bueno". Es la diferencia entre un taller que dice "confiá en nosotros" y uno que dice "acá tenés garantía escrita de que si algo sale mal, YO pierdo — no vos". El segundo cierra la venta.`,
    },
    {
      id: 'bloque_7',
      tipo: 'cta',
      titulo: '🚀 Basta de Ser el Que Siempre Paga de Más',
      texto: `Tenés dos opciones.\n\nPodés cerrar este video, volver al taller de siempre, y seguir pagando de más sin saber por qué. Seguir llegando tarde. Seguir discutiendo con tu pareja por la factura. Seguir con esa sensación de que "así son las cosas".\n\nO podés hacer algo diferente. Por primera vez.\n\nMandá un WhatsApp con la palabra "DIAGNÓSTICO" al [NÚMERO] y en 24 horas te agendamos tu diagnóstico gratuito con video incluido. Son 45 minutos. Sin compromiso. Sin trampa.\n\nPero hay un detalle: esta oferta del diagnóstico gratuito dura hasta el viernes. Después vuelve a $2.500. No es una estrategia de presión — es que cada diagnóstico gratis nos cuesta tiempo y recursos, y no podemos hacerlo ilimitadamente.\n\nEl auto que cuidás hoy es el que te lleva al trabajo mañana. Es el que lleva a tus hijos al colegio. Es el que te da libertad.\n\nDejá de regalar tu plata y tu tranquilidad.\n\nActuá ahora. Una sola palabra: DIAGNÓSTICO.`,
      logicaConversion: `CTA con técnica "Two Roads" (Eugene Schwartz) + triple cierre emocional. Las "dos opciones" activan "inaction framing" — al describir el futuro de NO actuar (seguir pagando de más, discutir con la pareja), la inacción se siente como una DECISIÓN activa de auto-sabotaje. La facilidad extrema (WhatsApp + una palabra) aplica el principio de "BJ Fogg Behavior Model" — para generar acción necesitás motivación + capacidad + trigger, y acá maximizamos los tres. La deadline real y justificada evita el "ad-skepticism" que genera la urgencia falsa. El cierre emocional ("el auto que lleva a tus hijos") conecta con la Palanca 1 (IDENTIDAD) — no es sobre el auto, es sobre ser un buen padre/madre.`,
      anguloUsado: 'Dos caminos + facilidad extrema + cierre de identidad',
      dolorAtacado: 'La procrastinación sostenida por años y el miedo a cambiar un hábito que duele pero es conocido',
      justificacionEducativa: `¿Alguna vez te pasó de estar en un restaurante mirando el menú durante 10 minutos sin decidirte? Y el mozo te dice "el especial de hoy es X" y al instante decís "dame eso". La parálisis se rompe cuando alguien te simplifica la decisión. Este cierre hace exactamente eso: reduce TODO a una sola acción concreta — mandar UNA palabra por WhatsApp. BJ Fogg (Stanford) demostró que la ecuación de la acción es: Motivación + Capacidad + Trigger. Nosotros ya le dimos la motivación (los 6 bloques anteriores), le damos la capacidad máxima (mandar un WhatsApp es el mínimo esfuerzo posible), y le damos el trigger (deadline del viernes). La frase final "el auto que lleva a tus hijos al colegio" es la estocada emocional — porque ya no estás vendiendo un diagnóstico, estás vendiendo la tranquilidad de que tu familia está protegida. Eso no tiene precio.`,
    },
  ];
}
