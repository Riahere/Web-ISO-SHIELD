import { pipeline } from '@xenova/transformers'
import fs from 'fs'
import { createClient } from '@supabase/supabase-js'

async function main() {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE!
  )

  const embedder = await pipeline(
    'feature-extraction',
    'Xenova/all-MiniLM-L6-v2'
  )

  const text = fs.readFileSync('./rag-data/iso27001-controls.txt', 'utf-8')
  const chunks = text.split('\n\n')

  for (const chunk of chunks) {
    const embedding = await embedder(chunk, {
      pooling: 'mean',
      normalize: true,
    })

    await supabase.from('iso_knowledge').insert({
      content: chunk,
      embedding: embedding.data,
    })
  }

  console.log('✅ RAG ingest complete')
}

main()