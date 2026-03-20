// app/api/research/competitor/route.ts
// Lee una URL de competidor usando Firecrawl y extrae su contenido limpio
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: 'URL requerida' }, { status: 400 });
    }

    const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;

    // Modo degradado: si no hay key, extrae metadata básica con fetch
    if (!FIRECRAWL_API_KEY || FIRECRAWL_API_KEY === 'your_firecrawl_api_key_here') {
      return await modoDegradado(url);
    }

    // Llamada a Firecrawl API v1
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
      },
      body: JSON.stringify({
        url,
        formats: ['markdown', 'extract'],
        extract: {
          prompt: 'Extrae: título del negocio, propuesta de valor principal, servicios ofrecidos, precios si están disponibles, garantías, testimonios o reseñas, puntos débiles o limitaciones mencionadas.',
          schema: {
            type: 'object',
            properties: {
              titulo: { type: 'string' },
              propuesta_valor: { type: 'string' },
              servicios: { type: 'array', items: { type: 'string' } },
              precios: { type: 'string' },
              garantias: { type: 'string' },
              debilidades: { type: 'array', items: { type: 'string' } },
            },
          },
        },
      }),
    });

    if (!response.ok) {
      return await modoDegradado(url);
    }

    const data = await response.json();

    return NextResponse.json({
      exito: true,
      fuente: 'firecrawl',
      url,
      contenidoLimpio: data.data?.markdown?.substring(0, 3000) || '',
      extraccionEstructurada: data.data?.extract || {},
      titulo: data.data?.metadata?.title || url,
    });

  } catch (error) {
    console.error('[API/competitor] Error:', error);
    return NextResponse.json({ 
      exito: false, 
      error: 'Error al procesar la URL del competidor' 
    }, { status: 500 });
  }
}

// Modo degradado: extrae metadata básica sin Firecrawl
async function modoDegradado(url: string) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    
    const response = await fetch(url, { 
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; VSLBot/1.0)' }
    });
    clearTimeout(timeoutId);

    const html = await response.text();
    
    // Extraer título y meta description
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
    
    const titulo = titleMatch?.[1]?.trim() || url;
    const descripcion = descMatch?.[1]?.trim() || 'Sin descripción disponible';

    return NextResponse.json({
      exito: true,
      fuente: 'modo_degradado',
      url,
      contenidoLimpio: `Título: ${titulo}\n\nDescripción: ${descripcion}`,
      extraccionEstructurada: { titulo, propuesta_valor: descripcion },
      titulo,
      nota: 'Configurá FIRECRAWL_API_KEY para análisis profundo',
    });
  } catch {
    return NextResponse.json({
      exito: true,
      fuente: 'modo_degradado',
      url,
      contenidoLimpio: `URL analizada: ${url}`,
      extraccionEstructurada: { titulo: url },
      titulo: url,
      nota: 'No se pudo acceder a la URL. Configurá FIRECRAWL_API_KEY.',
    });
  }
}
