export default {
  async email(message, env, ctx) {

    // 1. Only process IndusInd emails
    if (!message.from.toLowerCase().includes('indusind')) {
      return
    }

    // 2. Read raw email
    const reader = message.raw.getReader()
    let chunks = []
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(value)
    }
    const raw = new TextDecoder().decode(
      Uint8Array.from(chunks.flatMap(c => [...c]))
    )

    // 3. Only process CREDIT transactions
    if (!raw.includes('Credited')) return

    // 4. Extract Amount → "INR 2.00"
    const amount = raw.match(/Credited\s+for\s+INR\s+([\d.]+)/i)?.[1]

    // 5. Extract UTR → "UPI/206754068147/CR/..."
    const utr = raw.match(/UPI\/(\d{12,})\//i)?.[1]
    
    // 6. Extract Order ID from the UPI remarks/note at the end
    // First try to match the custom alphanumeric Order ID (e.g., ORD-A1B2C3D4)
    // Fallback: try to match standard UUID format (36 chars)
    const orderId = raw.match(/(ORD-[a-zA-Z0-9]{8})/i)?.[1] || raw.match(/([a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12})/i)?.[1]

    if (!utr || !amount) {
      console.log('❌ Could not extract UTR or Amount')
      console.log('Raw snippet:', raw.substring(0, 500))
      return
    }

    console.log(`UTR: ${utr} | Amount: ₹${amount} | OrderID: ${orderId || 'Not found'}`)

    // 7. Update Supabase
    let query = `${env.SUPABASE_URL}/rest/v1/orders`;
    if (orderId) {
      // Primary match: Order ID
      query += `?id=eq.${orderId}&status=eq.pending`;
    } else {
      // Fallback match: Amount
      query += `?amount=eq.${amount}&status=eq.pending`;
    }

    const { data, error } = await fetch(
      query,
      {
        method: 'PATCH',
        headers: {
          'apikey': env.SUPABASE_KEY,
          'Authorization': `Bearer ${env.SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          status: 'verified',
          utr: utr,
          verified_at: new Date().toISOString()
        })
      }
    ).then(r => r.json())

    if (error) {
      console.log('❌ Supabase error:', error)
      return
    }

    console.log(`✅ Payment verified: UTR ${utr} ₹${amount}`)
  }
}
