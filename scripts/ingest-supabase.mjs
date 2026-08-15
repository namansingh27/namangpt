import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const envPath = path.join(ROOT, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
for (const line of envContent.split('\n')) {
  const eqIndex = line.indexOf('=');
  if (eqIndex > 0) {
    process.env[line.slice(0, eqIndex).trim()] =
      line.slice(eqIndex + 1).trim();
  }
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const store = JSON.parse(
  fs.readFileSync(
    path.join(ROOT, 'lib', 'vectorStore.json'),
    'utf-8'
  )
);

const chunks = store.map((chunk) => ({
  id: chunk.id,
  content: chunk.text,
  source: chunk.source,
  embedding: chunk.embedding,
}));

const { error } = await supabase
  .from('documents')
  .upsert(chunks, { onConflict: 'id' });

if (error) {
  console.error('Upload failed:', error);
} else {
  console.log(`Uploaded ${chunks.length} chunks to Supabase`);
}
