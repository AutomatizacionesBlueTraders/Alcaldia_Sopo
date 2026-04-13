// Wrapper sobre la API de embeddings de Google Gemini.
// Doc: https://ai.google.dev/gemini-api/docs/embeddings
//
// Modelo: gemini-embedding-001 (3072 dims por default; se puede reducir con outputDimensionality).
// Usamos 768 dims — soportado por el modelo (MRL) y suficiente para un corpus pequeño.

const apiKey = process.env.GEMINI_API_KEY;
const model = process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-001';
const dims = parseInt(process.env.GEMINI_EMBEDDING_DIMS || '768', 10);

// Gemini tiene dos "task types" relevantes para RAG:
//   RETRIEVAL_DOCUMENT  — para embebber textos que se van a indexar
//   RETRIEVAL_QUERY     — para embebber la consulta del usuario
// Usar el correcto mejora la precisión bastante.

async function embedContent(text, taskType) {
  if (!apiKey) throw new Error('GEMINI_API_KEY no configurada');
  if (!text || !text.trim()) throw new Error('Texto vacío');

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:embedContent?key=${apiKey}`;
  const body = {
    content: { parts: [{ text }] },
    taskType,
    outputDimensionality: dims
  };

  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!resp.ok) {
    const errBody = await resp.text().catch(() => '');
    throw new Error(`Gemini embeddings ${resp.status}: ${errBody.substring(0, 300)}`);
  }

  const json = await resp.json();
  const values = json?.embedding?.values;
  if (!Array.isArray(values)) {
    throw new Error(`Respuesta inválida de Gemini: ${JSON.stringify(json).substring(0, 200)}`);
  }
  return values;
}

async function embedDocumento(texto) {
  return embedContent(texto, 'RETRIEVAL_DOCUMENT');
}

async function embedConsulta(texto) {
  return embedContent(texto, 'RETRIEVAL_QUERY');
}

// Helper para convertir array JS a formato literal pgvector: "[0.1,0.2,...]"
function toVectorLiteral(arr) {
  return '[' + arr.join(',') + ']';
}

module.exports = { embedDocumento, embedConsulta, toVectorLiteral, dims };
