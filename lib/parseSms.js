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

  // 2. Extract UTR / Transaction ID (supports 12-digit UPI UTR or Alphanumeric Txn ID)
  let utr = null;
  
  // Try standard 12-digit word-boundary search first
  const utrMatch = text.match(/\b\d{12}\b/);
  if (utrMatch) {
    utr = utrMatch[0];
  } else {
    // Check packed symbols e.g. "UPI/123456789012"
    const upiSlashMatch = text.match(/upi[\/\-:](\d{12})/i);
    if (upiSlashMatch) {
      utr = upiSlashMatch[1];
    } else {
      // Check labels for UTR or Alphanumeric Transaction IDs
      const refMatch = text.match(/(?:ref|ref\.?\s*no|utr|txn|info|reference|transaction|order\s*id|txn\s*id)[:\-\s/]*([a-zA-Z0-9]{10,40})/i);
      if (refMatch) {
        utr = refMatch[1];
      } else {
        // Fallback: look for any standard long alphanumeric transaction identifier
        const specificMatch = text.match(/\b(PTM[a-zA-Z0-9]{15,40}|T\d{15,25})\b/i);
        if (specificMatch) {
          utr = specificMatch[1];
        }
      }
    }
  }

  if (!utr) {
    return null; // A valid UTR/Txn ID is mandatory to match and verify a payment
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

/**
 * Parses general transaction text (emails, push notifications, bank logs) to extract transaction amount and UPI UTR.
 * 
 * @param {string} text The email or push notification text.
 * @returns {{ amount: number, utr: string } | null} The parsed amount and 12-digit UTR, or null if invalid.
 */
export function parseTransactionText(text) {
  if (!text) return null;

  // 1. If this is a threaded/forwarded email conversation, only take the top (newest) message part
  let newestPart = text;
  
  // Split by standard email thread dividers
  const threadDividers = [
    /-{3,}\s*Forwarded\s*message/i,
    /-{3,}\s*Forwarded\s*Message/i,
    /\bOn\s+[A-Za-z]{3},\s+[A-Za-z]{3}\s+\d+,\s+\d{4}/i, // "On Sun, May 31, 2026..."
    /\r?\nFrom:\s+/i,
    /________________________________/
  ];

  for (const divider of threadDividers) {
    const parts = newestPart.split(divider);
    if (parts && parts.length > 0) {
      newestPart = parts[0]; // take the top portion
    }
  }

  // 2. Clean HTML tags and normalize extra whitespace
  let cleanText = newestPart.replace(/<[^>]*>/g, ' ');
  cleanText = cleanText.replace(/\s+/g, ' ');

  const lowercaseText = cleanText.toLowerCase();

  // 3. Credit safety check: verify it represents a credit alert
  const isCredit = 
    lowercaseText.includes('credited') || 
    lowercaseText.includes('credit') || 
    lowercaseText.includes('deposited') || 
    lowercaseText.includes('received') ||
    lowercaseText.includes('added') ||
    lowercaseText.includes('cr.') ||
    lowercaseText.includes('dep to a/c') ||
    lowercaseText.includes('received ₹') ||
    lowercaseText.includes('received rs') ||
    lowercaseText.includes('payment of') ||
    lowercaseText.includes('payment received') ||
    lowercaseText.includes('paid') ||
    lowercaseText.includes('paid at') ||
    lowercaseText.includes('successful') ||
    lowercaseText.includes('settled') ||
    lowercaseText.includes('imps') ||
    lowercaseText.includes('neft') ||
    lowercaseText.includes('rtgs') ||
    lowercaseText.includes('fund transfer') ||
    lowercaseText.includes('inward transfer') ||
    lowercaseText.includes('transfer from') ||
    lowercaseText.includes('inward remittance');

  if (!isCredit) {
    return null;
  }

  // 3. Extract UTR / Reference number (supports UPI, IMPS, and NEFT)
  let utr = null;
  
  // Specific IMPS extraction (SBI, HDFC, ICICI, Axis, Kotak, PNB, etc.)
  // e.g., IMPS/P2A/426123456789, IMPS-426123456789, IMPS Ref no 426123456789, Info: IMPS-426123456789
  const impsMatch = cleanText.match(/imps[\/\-\s:]*(?:p2a[\/\-\s:]*|ref\s*no\.?[\/\-\s:]*)?(\d{10,16})/i);
  if (impsMatch) {
    utr = impsMatch[1];
  }

  // Specific NEFT extraction (e.g. NEFT/N123456789012345, NEFT CR-HDFC-N123456789, NEFT CR-UTIB-N426554433221)
  if (!utr) {
    const neftMatch = cleanText.match(/neft[\/\-\s:]*(?:cr[\/\-\s:]*)?(?:[a-zA-Z0-9]{2,6}[\/\-:])?([a-zA-Z0-9]{10,24})/i) ||
                      cleanText.match(/\b(N\d{11,16})\b/i);
    if (neftMatch) {
      utr = neftMatch[1];
    }
  }

  // Standard word-boundary search (12-digit UPI or IMPS RRN)
  if (!utr) {
    const utrMatch = cleanText.match(/\b\d{12}\b/);
    if (utrMatch) {
      utr = utrMatch[0];
    }
  }

  // Check packed symbols e.g. "UPI/123456789012"
  if (!utr) {
    const upiSlashMatch = cleanText.match(/upi[\/\-:](\d{12})/i);
    if (upiSlashMatch) {
      utr = upiSlashMatch[1];
    }
  }

  // Check explicit labels for UTR / Reference / Txn IDs
  if (!utr) {
    const refMatch = cleanText.match(/(?:ref|ref\.?\s*no|utr|rrn|txn|info|reference|transaction|order\s*id|txn\s*id)[:\-\s/]*([a-zA-Z0-9]{10,40})/i);
    if (refMatch) {
      utr = refMatch[1];
    }
  }

  // Fallback: look for standard alphanumeric transaction identifier (Paytm, etc.)
  if (!utr) {
    const specificMatch = cleanText.match(/\b(PTM[a-zA-Z0-9]{15,40}|T\d{15,25})\b/i);
    if (specificMatch) {
      utr = specificMatch[1];
    }
  }

  // 4. Extract Amount (floating point parsing)
  let amount = null;
  const amountRegexes = [
    // Matches "INR 5,000.00 has been credited" or "Rs 5,000.00 credited"
    /(?:rs\.?|inr\.?|₹)\s*([\d,]+(?:\.\d{1,2})?)\s*(?:has\s+been|is)?\s*credited/i,
    // Matches "credited with INR 5,000.00" or "credited by Rs. 5000"
    /credited\s+(?:with|by|for)?\s*(?:rs\.?|inr\.?|₹|&#8377;)?\s*([\d,]+(?:\.\d{1,2})?)/i, 
    // Matches standard currency prefixes
    /(?:rs\.?|inr\.?|val\.?|₹|&#8377;|inr)\s*([\d,]+(?:\.\d{1,2})?)/i,
    /received\s*(?:rs\.?|inr\.?|₹|&#8377;)?\s*([\d,]+(?:\.\d{1,2})?)/i, 
    /deposited\s*(?:rs\.?|inr\.?|₹|&#8377;)?\s*([\d,]+(?:\.\d{1,2})?)/i, 
    /cr\s*([\d,]+(?:\.\d{1,2})?)/i,
    /payment\s+of\s*(?:rs\.?|inr\.?|₹|&#8377;)?\s*([\d,]+(?:\.\d{1,2})?)/i,
    /(?:amount|amt)[\s:=]*(?:rs\.?|inr\.?|₹|&#8377;)?\s*([\d,]+(?:\.\d{1,2})?)/i
  ];

  for (const regex of amountRegexes) {
    const match = cleanText.match(regex);
    if (match) {
      const rawVal = match[1].replace(/,/g, '');
      const val = parseFloat(rawVal);
      if (!isNaN(val) && val > 0) {
        amount = val;
        break;
      }
    }
  }

  // Fallback: If no amount found, just look for ANY decimal number following a currency word
  if (!amount) {
    const fallbackMatch = cleanText.match(/(?:rs|inr|₹|amount|pay)\s*(\d+\.\d{2})/i);
    if (fallbackMatch) {
      amount = parseFloat(fallbackMatch[1]);
    }
  }

  // Very aggressive fallback: If we found a UTR but no amount, try to find any isolated decimal like "1.00"
  if (!amount && utr) {
    const decimalMatch = cleanText.match(/\b(\d+\.\d{2})\b/);
    if (decimalMatch) {
      amount = parseFloat(decimalMatch[1]);
    }
  }

  if (!amount) {
    return null;
  }

  return { amount, utr: utr || 'UNKNOWN_REF' };
}

