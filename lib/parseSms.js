/**
 * Parses Indian bank SMS notifications to extract transaction amount and UPI UTR.
 * Supports IOB, SBI, HDFC, ICICI, Axis Bank, and generic UPI credit formats.
 * 
 * @param {string} text The SMS text message.
 * @returns {{ amount: number, utr: string } | null} The parsed amount and 12-digit UTR, or null if invalid/not a credit alert.
 */
export function parseBankSms(text) {
  if (!text) return null;

  const lowercaseText = text.toLowerCase();

  // 1. Safety check: ensure it represents a credit (incoming deposit)
  const isCredit = 
    lowercaseText.includes('credited') || 
    lowercaseText.includes('credit') || 
    lowercaseText.includes('deposited') || 
    lowercaseText.includes('received') ||
    lowercaseText.includes('added') ||
    lowercaseText.includes('cr.') ||
    lowercaseText.includes('received rs.') ||
    lowercaseText.includes('dep to a/c');
  
  if (!isCredit) {
    return null;
  }

  // 2. Extract UTR (exactly 12-digit number for all UPI transactions)
  let utr = null;
  
  // Try standard 12-digit word-boundary search first
  const utrMatch = text.match(/\b\d{12}\b/);
  if (utrMatch) {
    utr = utrMatch[0];
  } else {
    // Fallback: check if packed in slash/hyphen formats e.g. "UPI/612345678901/..."
    const upiSlashMatch = text.match(/upi[\/\-:](\d{12})/i);
    if (upiSlashMatch) {
      utr = upiSlashMatch[1];
    } else {
      // Look for ref number followed by 12 digits directly
      const refMatch = text.match(/(?:ref|ref\.?\s*no|utr|txn|info)[:\-\s/]*(\d{12})/i);
      if (refMatch) {
        utr = refMatch[1];
      }
    }
  }

  if (!utr) {
    return null; // A valid UTR is mandatory to match and verify a payment
  }

  // 3. Extract Amount
  let amount = null;
  
  // Custom regexes for amount extraction in credits
  const amountRegexes = [
    /(?:rs\.?|inr\.?|val\.?)\s*([\d,]+(?:\.\d{1,2})?)/i, // Rs. 500.00 or INR 500
    /credited\s+(?:with|by)?\s*(?:rs\.?|inr\.?)?\s*([\d,]+(?:\.\d{1,2})?)/i, // credited by Rs. 500
    /received\s*(?:rs\.?|inr\.?)?\s*([\d,]+(?:\.\d{1,2})?)/i, // received Rs. 500
    /deposited\s*(?:rs\.?|inr\.?)?\s*([\d,]+(?:\.\d{1,2})?)/i, // deposited Rs. 500
    /cr\s*([\d,]+(?:\.\d{1,2})?)/i // cr 500.00
  ];

  for (const regex of amountRegexes) {
    const match = text.match(regex);
    if (match) {
      const rawVal = match[1].replace(/,/g, ''); // strip commas if amount is like 1,000.00
      const val = parseFloat(rawVal);
      if (!isNaN(val) && val > 0) {
        amount = val;
        break;
      }
    }
  }

  if (!amount) {
    return null;
  }

  return { amount, utr };
}
