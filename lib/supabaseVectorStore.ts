import { createClient } from "@supabase/supabase-js";

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
  const res = await fetch("https://api.voyageai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.VOYAGE_API_KEY}`,
    },
    body: JSON.stringify({ input: [query], model: "voyage-3-lite" }),
  });
  const json = await res.json();
  return json.data[0].embedding;
}

export async function retrieve(query: string) {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!
  );

  const queryEmbedding = await embedQuery(query);

  const { data, error } = await supabase
    .from("documents")
    .select("id, content, source, embedding");

  if (error || !data) return [];

  const scored = (data as DocumentRow[]).map((chunk) => ({
    ...chunk,
    text: chunk.content,
    score: cosineSimilarity(queryEmbedding, chunk.embedding),
  }));

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}
