// Helper function to decode Quoted-Printable email content
function decodeQuotedPrintable(str) {
  return str
    .replace(/=([0-9A-F]{2})/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/=\r?\n/g, '');
}

export default {
  async email(message, env, ctx) {
    try {
      // 1. Extract the Merchant API Key from the "To" address
      // e.g., "123e4567-e89b-12d3@mymob.tech" -> "123e4567-e89b-12d3"
      const toAddress = message.to;
      const apiKey = toAddress.split('@')[0];

      if (!apiKey || apiKey.length < 10) {
        console.log(`ℹ️ Ignored email to non-API key address: ${toAddress}`);
        return;
      }

      // 2. Read the raw email stream body
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

      // 3. Decode and Clean the raw email body
      let cleanBody = decodeQuotedPrintable(rawMime);
      cleanBody = cleanBody.replace(/<[^>]*>/g, ' '); // Strip HTML tags
      cleanBody = cleanBody.replace(/&nbsp;/gi, ' ').replace(/\u00A0/g, ' '); // Replace non-breaking spaces
      cleanBody = cleanBody.replace(/\s+/g, ' '); // Normalize multiple spaces/newlines into a single space

      // 4. Forward to the Next.js Backend
      // Configure NEXTJS_API_URL in your Cloudflare Worker Settings (e.g., https://mymob.tech/api/webhook/email)
      const apiUrl = env.NEXTJS_API_URL || 'https://mymob.tech/api/webhook/email';

      console.log(`🚀 Forwarding email for API Key [${apiKey}] to ${apiUrl}`);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-cloudflare-email-routing': 'true'
        },
        body: JSON.stringify({
          api_key: apiKey,
          from: message.from,
          body: cleanBody
        })
      });

      const responseData = await response.json();
      
      if (!response.ok) {
        console.error('❌ Next.js backend rejected the email:', responseData);
      } else {
        console.log('✅ Email successfully processed by Next.js backend:', responseData);
      }

    } catch (err) {
      console.error('❌ Cloudflare Worker Error:', err.message);
    }
  }
};
