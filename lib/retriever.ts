import fs from "fs";
import path from "path";

const VECTOR_STORE_PATH = path.join(process.cwd(), "lib", "vectorStore.json");
const TOP_K = 8;

interface Chunk {
  id: string;
  text: string;
  source: string;
  embedding: number[];
}

let store: Chunk[] | null = null;

function loadStore(): Chunk[] {
  if (!store) {
    const raw = fs.readFileSync(VECTOR_STORE_PATH, "utf-8");
    store = JSON.parse(raw);
  }
  return store!;
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
    body: JSON.stringify({
      input: [query],
      model: "voyage-3-lite",
    }),
  });

  if (!res.ok) throw new Error(`Voyage embed error: ${res.status}`);
  const json = await res.json();
  return json.data[0].embedding;
}

export async function retrieve(query: string): Promise<Chunk[]> {
  const chunks = loadStore();
  const queryEmbedding = await embedQuery(query);

  const scored = chunks.map((chunk) => ({
    ...chunk,
    score: cosineSimilarity(queryEmbedding, chunk.embedding),
  }));

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, TOP_K);
}
