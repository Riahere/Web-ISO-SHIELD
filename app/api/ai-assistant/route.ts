import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Helper for retrying embedding requests.
 * Handles 503 (Model Loading) and 429 (Rate Limits).
 */
async function fetchWithRetry(url: string, options: any, retries = 3, backoff = 1000) {
  for (let i = 0; i < retries; i++) {
    const res = await fetch(url, options);
    if (res.ok) return res;
    // Don't retry if authentication failed
    if (res.status === 401) return res; 
    if (res.status !== 503 && res.status !== 429) break;
    await new Promise(resolve => setTimeout(resolve, backoff * (i + 1)));
  }
  return fetch(url, options);
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { messages, context: orgContext } = await req.json()

    if (!messages?.length) {
      return NextResponse.json({ error: 'No messages provided' }, { status: 400 })
    }

    const userMessage = messages[messages.length - 1].content

    // 1️⃣ Generate embedding using HuggingFace Router
const embedResponse = await fetchWithRetry(
  'https://router.huggingface.co/hf-inference/models/BAAI/bge-small-en-v1.5',
  {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.HF_TOKEN?.trim()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs: userMessage,
    }),
  }
)

    // Specific error handling for Authentication
    if (embedResponse.status === 401) {
      throw new Error('HuggingFace Authentication Failed: Please check your HF_TOKEN in .env.local');
    }

    if (!embedResponse.ok) {
      const errorData = await embedResponse.json().catch(() => ({}));
      throw new Error(errorData.error || `HuggingFace API Error: ${embedResponse.status}`);
    }

    const embeddingResults = await embedResponse.json()
    
    // Normalize results: the router returns [[number]] for a batch of one
    const rawVector = Array.isArray(embeddingResults[0]) 
      ? embeddingResults[0] 
      : embeddingResults;

    if (!rawVector || typeof rawVector[0] !== 'number') {
      throw new Error('Invalid embedding format received from HuggingFace.');
    }

    // Convert vector to Postgres format string: "[0.1, 0.2, ...]"
    const formattedVector = `[${rawVector.join(',')}]`

    // 2️⃣ Vector search in Supabase (RAG)
    // IMPORTANT: filter_org_id ensures data isolation between different clients
    const { data: docs, error: rpcError } = await supabase.rpc(
      'match_iso_docs',
      {
        query_embedding: formattedVector,
        match_count: 5,
        filter_org_id: orgContext?.orgId 
      }
    )

    if (rpcError) {
      console.error('Supabase RPC Error:', rpcError);
      // If the function is missing, we'll continue with limited context rather than crashing
    }

    const kbContext = docs?.length 
      ? docs.map((d: any) => d.content).join('\n\n') 
      : 'No specific audit documents found for this query.'

    // 3️⃣ Construct the System Prompt with retrieved context
    const systemPrompt = `
You are ISO Shield AI, an expert ISO 27001:2022 lead auditor.
Organization: ${orgContext?.orgName || 'Unknown Client'}
Current Compliance Score: ${orgContext?.complianceScore || 0}%

Knowledge Base Context (Internal Audit Data):
${kbContext}

Rules:
1. Strictly use ISO 27001:2022 terminology.
2. Reference specific Annex A controls when relevant.
3. Provide actionable, step-by-step implementation guidance.
4. If the retrieved context doesn't answer the question, rely on your core ISO knowledge but note that internal data was insufficient.
5. Use Markdown formatting for clarity.
`

    // 4️⃣ GROQ Call (Llama 3.1 70B)
    const groqResponse = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.GROQ_API_KEY?.trim()}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages,
          ],
          temperature: 0.1, // Low temperature for factual audit consistency
        }),
      }
    )

    if (!groqResponse.ok) {
      const groqError = await groqResponse.json().catch(() => ({}));
      throw new Error(groqError.error?.message || 'Groq API inference failed');
    }

    const json = await groqResponse.json()

    return NextResponse.json({
      message: json.choices?.[0]?.message?.content || 'AI response unavailable.',
    })

  } catch (err: any) {
    console.error('RAG_PIPELINE_ERROR:', err)
    return NextResponse.json(
      { error: err.message || 'Internal Server Error' },
      { status: 500 }
    )
  }
}