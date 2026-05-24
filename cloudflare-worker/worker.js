// Helper function to decode Quoted-Printable email content
function decodeQuotedPrintable(str) {
  return str
    .replace(/=([0-9A-F]{2})/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/=\r?\n/g, '');
}

export default {
  async email(message, env, ctx) {

    // 1. Read the raw email stream body
    const reader = message.raw.getReader();
    let chunks = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }
    const rawMime = new TextDecoder().decode(
      Uint8Array.from(chunks.flatMap(c => [...c]))
    );

    // 2. Decode and Clean the raw email body
    let cleanBody = decodeQuotedPrintable(rawMime);
    cleanBody = cleanBody.replace(/<[^>]*>/g, ' '); // Strip HTML tags
    cleanBody = cleanBody.replace(/&nbsp;/gi, ' ').replace(/\u00A0/g, ' '); // Replace non-breaking spaces
    cleanBody = cleanBody.replace(/\s+/g, ' '); // Normalize multiple spaces/newlines into a single space

    // 3. Only process if sender OR email body contains 'indusind' (allows manual forwarding!)
    const isIndusInd = message.from.toLowerCase().includes('indusind') || cleanBody.toLowerCase().includes('indusind');
    if (!isIndusInd) {
      console.log('ℹ️ Email is not from or about IndusInd Bank.');
      return;
    }

    // 4. Ensure this is a successful CREDIT email (case-insensitive)
    if (!cleanBody.toLowerCase().includes('credited')) {
      console.log('ℹ️ Email is not a credit alert.');
      return;
    }

    // 5. Extract Credited Amount — supports both formats:
    //    Format A (UPI):  "Credited for INR 2.01"
    //    Format B (IMPS): "credited by Rs.1" or "credited by Rs. 1"
    const amount = cleanBody.match(/Credited\s+for\s+INR\s+([\d.]+)/i)?.[1] ||
                   cleanBody.match(/credited\s+by\s+Rs\.\s*([\d.]+)/i)?.[1];

    // 6. Extract unique 12-digit UTR from the UPI reference block or fallback patterns
    let utr = cleanBody.match(/UPI\/(\d{12,})\//i)?.[1] ||
              cleanBody.match(/IMPS\s+Ref\s+no\.?\s*(\d+)/i)?.[1] ||
              cleanBody.match(/Ref(?:\s+No)?\.?\s*[:\s]+(\d{10,})/i)?.[1] ||
              cleanBody.match(/\b(\d{12})\b/)?.[1] ||
              cleanBody.match(/RRN[\s:]+(\d+)/i)?.[1] ||
              cleanBody.match(/Txn(?:\s+ID)?[\s:]+(\w+)/i)?.[1];
    
    // Fallback: If no UTR is found at all, generate a unique reference to prevent database block
    if (!utr) {
      const uniqueSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
      utr = `AUTO_REF_${Date.now()}_${uniqueSuffix}`;
      console.log(`ℹ️ No standard UTR found in email. Generated mock reference: ${utr}`);
    }
    
    // 7. Extract the custom alphanumeric Order ID (e.g. O1B2, ORZ20B, ORD-8F9D3UMP, or UUID)
    const orderId = cleanBody.match(/\b(O[a-zA-Z0-9]{3})\b/i)?.[1] ||
                    cleanBody.match(/\b(OR[a-zA-Z0-9]{4})\b/i)?.[1] ||
                    cleanBody.match(/(ORD-[a-zA-Z0-9]{8})/i)?.[1] || 
                    cleanBody.match(/([a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12})/i)?.[1];

    if (!amount) {
      console.log('❌ Could not extract Amount from body.');
      return;
    }

    console.log(`Parsed successfully: UTR = ${utr} | Amount = ₹${amount} | OrderID = ${orderId || 'Not found'}`);

    // 8. Update Supabase
    let query = `${env.SUPABASE_URL}/rest/v1/orders`;
    if (orderId) {
      // Primary search: Match the custom generated Order ID
      query += `?id=eq.${orderId}&status=eq.pending`;
    } else {
      // Fallback: Match by exact transaction amount
      query += `?amount=eq.${amount}&status=eq.pending`;
    }

    const response = await fetch(
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
    );

    const data = await response.json();
    
    if (!response.ok) {
      console.log('❌ Supabase update error:', data);
      return;
    }

    console.log(`✅ Payment auto-verified successfully! UTR: ${utr} credited.`);
  }
}
