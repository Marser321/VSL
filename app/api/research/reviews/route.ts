// app/api/research/reviews/route.ts
// Busca reseñas negativas de competidores usando Google Maps Places API
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { nombreNegocio, zonaGeografica } = await req.json();

    if (!nombreNegocio) {
      return NextResponse.json({ error: 'Nombre de negocio requerido' }, { status: 400 });
    }

    const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

    if (!GOOGLE_API_KEY || GOOGLE_API_KEY === 'your_google_maps_api_key_here') {
      // Modo demo: devolvemos quejas genéricas simuladas basadas en el tipo de negocio
      return NextResponse.json({
        exito: true,
        fuente: 'modo_demo',
        hallazgos: generarQuejasModo(nombreNegocio),
        nota: 'Configurá GOOGLE_MAPS_API_KEY para obtener reseñas reales',
      });
    }

    // Text Search para encontrar el negocio
    const searchQuery = `${nombreNegocio} ${zonaGeografica}`;
    const searchUrl = `https://places.googleapis.com/v1/places:searchText`;

    const searchResponse = await fetch(searchUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_API_KEY,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.rating,places.userRatingCount,places.reviews',
      },
      body: JSON.stringify({
        textQuery: searchQuery,
        maxResultCount: 3,
        languageCode: 'es',
      }),
    });

    if (!searchResponse.ok) {
      return NextResponse.json({
        exito: true,
        fuente: 'modo_demo',
        hallazgos: generarQuejasModo(nombreNegocio),
        nota: 'Error con Google Maps API. Verificá tu key.',
      });
    }

    const searchData = await searchResponse.json();
    const lugares = searchData.places || [];

    // Extraer reseñas negativas (1-3 estrellas)
    const quejas: string[] = [];
    const dolores: string[] = [];

    for (const lugar of lugares) {
      const reviews = lugar.reviews || [];
      for (const review of reviews) {
        const rating = review.rating || 5;
        const texto = review.text?.text || '';

        if (rating <= 3 && texto.length > 20) {
          quejas.push(`"${texto.substring(0, 200)}"${texto.length > 200 ? '...' : ''}`);
          
          // Detectar dolores comunes
          if (texto.toLowerCase().includes('demor') || texto.toLowerCase().includes('tard')) {
            dolores.push('Tiempos de espera demasiado largos');
          }
          if (texto.toLowerCase().includes('precios') || texto.toLowerCase().includes('caro')) {
            dolores.push('Precios altos sin justificación');
          }
          if (texto.toLowerCase().includes('atenci') || texto.toLowerCase().includes('trato')) {
            dolores.push('Mala atención al cliente');
          }
          if (texto.toLowerCase().includes('presupuest') || texto.toLowerCase().includes('informaci')) {
            dolores.push('Falta de transparencia en presupuestos');
          }
        }
      }
    }

    const doloresUnicos = [...new Set(dolores)];

    return NextResponse.json({
      exito: true,
      fuente: 'google_maps',
      totalLugares: lugares.length,
      quejas: quejas.slice(0, 5),
      doloresPrincipales: doloresUnicos.slice(0, 4),
      hallazgos: {
        quejas,
        dolores: doloresUnicos,
        resumen: `Se analizaron ${lugares.length} negocios similares y se detectaron ${quejas.length} reseñas negativas`,
      },
    });

  } catch (error) {
    console.error('[API/reviews] Error:', error);
    return NextResponse.json({ 
      exito: false, 
      error: 'Error al buscar reseñas' 
    }, { status: 500 });
  }
}

function generarQuejasModo(negocio: string): { quejas: string[]; dolores: string[]; resumen: string } {
  const negLower = negocio.toLowerCase();
  
  const quejas = [
    '"Tuve que esperar más de una semana para que me atendieran. Nada de comunicación."',
    '"El presupuesto final fue 40% más caro que lo que me dijeron al principio."',
    '"No me explicaron qué le hicieron al auto, solo me dieron una factura enorme."',
    '"Llevé el vehículo por un problema y me lo devolvieron con otro problema nuevo."',
    '"Tuve que llamar 5 veces para que me dieran información del estado del trabajo."',
  ];

  const dolores = [
    'Falta de transparencia en precios y presupuestos',
    'Tiempos de espera sin comunicación proactiva',
    'Clientes que sienten que no entienden qué se repara',
    'Desconfianza en el diagnóstico mecánico',
  ];

  return {
    quejas,
    dolores,
    resumen: `Análisis de quejas comunes en negocios similares a "${negocio}" (modo demo sin API)`,
  };
}
