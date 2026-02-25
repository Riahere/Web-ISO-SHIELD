const HF_TOKEN = "hf_..."; // PASTE YOUR TOKEN HERE

async function testEmbedding() {
  console.log("🚀 Testing Hugging Face Router...");

  // Basic format validation
  if (!HF_TOKEN.startsWith('hf_')) {
    console.error("❌ Invalid Token Format: Hugging Face tokens should start with 'hf_'");
    return;
  }

  try {
    const response = await fetch(
      'https://router.huggingface.co/hf-inference/models/sentence-transformers/all-MiniLM-L6-v2',
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${HF_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: ["ISO 27001 audit control A.5.1"],
          options: { wait_for_model: true }
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ API Error:", data);
      if (response.status === 401) {
        console.log("👉 Suggestion: Re-generate your token at huggingface.co/settings/tokens");
      }
      return;
    }

    console.log("✅ Success! Vector received.");
    console.log(`Dimension: ${data[0].length}`);
  } catch (err) {
    console.error("💀 Connection Failed:", err.message);
  }
}

testEmbedding();