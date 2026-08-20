import { createClient } from '@supabase/supabase-js';

interface DocumentRow {
  id: string;
  content: string;
  source: string;
  embedding: number[];
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

async function embedQuery(query: string): Promise<number[]> {
  const apiKey = process.env.VOYAGE_API_KEY;
  if (!apiKey) throw new Error('VOYAGE_API_KEY is not set');

  const res = await fetch('https://api.voyageai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      input: [query],
      model: 'voyage-3-lite'
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Voyage API error: ${err}`);
  }

  const json = await res.json();
  return json.data[0].embedding;
}

export async function retrieve(query: string) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl) throw new Error('SUPABASE_URL is not set');
  if (!supabaseKey) throw new Error('SUPABASE_ANON_KEY is not set');

  const supabase = createClient(supabaseUrl, supabaseKey);

  const queryEmbedding = await embedQuery(query);

  const { data, error } = await supabase
    .from('documents')
    .select('id, content, source, embedding');

  if (error || !data) {
    console.error('Supabase error:', error);
    return [];
  }

  const scored = data.map((chunk: DocumentRow) => ({
    ...chunk,
    text: chunk.content,
    score: cosineSimilarity(queryEmbedding, chunk.embedding),
  }));

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}
