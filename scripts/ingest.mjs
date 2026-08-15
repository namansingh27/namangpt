import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

// Load .env.local manually
const envPath = path.join(ROOT, ".env.local");
const envContent = fs.readFileSync(envPath, "utf-8");
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIndex = trimmed.indexOf("=");
  if (eqIndex > 0) {
    const key = trimmed.slice(0, eqIndex).trim();
    const val = trimmed.slice(eqIndex + 1).trim();
    process.env[key] = val;
  }
}

const DOCS_DIR = path.join(ROOT, "docs");
const VECTOR_STORE_PATH = path.join(ROOT, "lib", "vectorStore.json");
const CHUNK_SIZE = 800;
const CHUNK_OVERLAP = 100;

function chunkText(text, source) {
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + CHUNK_SIZE, text.length);
    const chunk = text.slice(start, end).trim();
    if (chunk.length > 50) chunks.push({ text: chunk, source });
    start += CHUNK_SIZE - CHUNK_OVERLAP;
  }
  return chunks;
}

async function embedTexts(texts, apiKey) {
  const res = await fetch("https://api.voyageai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      input: texts,
      model: "voyage-3-lite",
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Voyage API error ${res.status}: ${err}`);
  }

  const json = await res.json();
  return json.data.map((d) => d.embedding);
}

async function ingest() {
  const voyageApiKey = process.env.VOYAGE_API_KEY;
  if (!voyageApiKey) throw new Error("VOYAGE_API_KEY missing from .env.local");

  console.log("Loading docs from /docs folder...");
  const files = fs.readdirSync(DOCS_DIR).filter((f) => f.endsWith(".md"));
  console.log(`Found ${files.length} files:`, files.join(", "));

  const allChunks = [];
  for (const file of files) {
    const content = fs.readFileSync(path.join(DOCS_DIR, file), "utf-8");
    const chunks = chunkText(content, file);
    allChunks.push(...chunks);
    console.log(`  ${file} → ${chunks.length} chunks`);
  }

  console.log(`\nTotal chunks to embed: ${allChunks.length}`);
  console.log("Calling Voyage AI API...");

  const BATCH_SIZE = 128;
  const allEmbeddings = [];
  for (let i = 0; i < allChunks.length; i += BATCH_SIZE) {
    const batch = allChunks.slice(i, i + BATCH_SIZE).map((c) => c.text);
    const embeddings = await embedTexts(batch, voyageApiKey);
    allEmbeddings.push(...embeddings);
    console.log(`  Embedded batch ${Math.floor(i / BATCH_SIZE) + 1} (${batch.length} chunks)`);
  }

  const store = allChunks.map((chunk, i) => ({
    id: `chunk_${i}`,
    text: chunk.text,
    source: chunk.source,
    embedding: allEmbeddings[i],
  }));

  fs.mkdirSync(path.dirname(VECTOR_STORE_PATH), { recursive: true });
  fs.writeFileSync(VECTOR_STORE_PATH, JSON.stringify(store, null, 2));

  console.log(`\nDone! ${store.length} chunks saved to lib/vectorStore.json`);
  console.log("Your NamanGPT knowledge base is ready.");
}

ingest().catch((err) => {
  console.error("Ingestion failed:", err.message);
  process.exit(1);
});
