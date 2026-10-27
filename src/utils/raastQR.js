// ========================================================
// NEOTA — EMVCo Interoperable Raast QR Code Generator
// Compliant with State Bank of Pakistan (SBP) Raast QRCPS Specifications
// ========================================================

/**
 * Format standard EMVCo Tag-Length-Value (TLV)
 * Tag: 2 chars, Length: 2 chars, Value: string
 */
export function formatTLV(tag, value) {
  if (value === undefined || value === null || value === '') return ''
  const valStr = String(value)
  const lenStr = valStr.length.toString().padStart(2, '0')
  return `${tag}${lenStr}${valStr}`
}

/**
 * Compute standard CRC-16/CCITT-FALSE Checksum for EMVCo QR
 * Polynomial: 0x1021, Initial: 0xFFFF
 */
export function computeCRC16(data) {
  let crc = 0xFFFF
  for (let i = 0; i < data.length; i++) {
    crc ^= (data.charCodeAt(i) << 8)
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xFFFF
      } else {
        crc = (crc << 1) & 0xFFFF
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

/**
 * Builds authentic EMVCo QRCPS string recognized by Pakistani banking apps
 * (SadaPay, Nayapay, Meezan, Easypaisa, JazzCash, HBL, Bank Alfalah, etc.)
 *
 * @param {Object} options
 * @param {string} options.raastId - Registered Mobile Number
 * @param {string} options.iban - Pakistani Bank IBAN (PK...)
 * @param {string} options.accountTitle - Beneficiary Title on Bank
 * @param {number} [options.amount] - Optional payment amount
 * @param {boolean} [options.isDynamic=false] - Whether to lock in amount (Static 11 is recommended for P2P)
 */
export function buildRaastEMVCoQR({ raastId = '', iban = '', accountTitle = '', amount = 0, isDynamic = false }) {
  // 00: Payload Format Indicator (Version 01)
  let payload = formatTLV('00', '01')

  // 01: Point of Initiation
  // NOTE: In Pakistan, personal P2P accounts must use Static QR ('11').
  // Dynamic QR ('12') is often rejected by consumer banking apps unless the account is an acquiring P2M merchant!
  payload += formatTLV('01', isDynamic && Number(amount) > 0 ? '12' : '11')

  // 26: SBP Primary Domestic Scheme (Tag 26 is the mandated primary container for SBP Raast)
  // Sub-tag 00: GUID ('pk.raast')
  // Sub-tag 01: IBAN (preferred by 1LINK switch) or Raast Mobile Alias
  // Sub-tag 02: Secondary alias
  let sub26 = formatTLV('00', 'pk.raast')
  const cleanIban = iban ? iban.replace(/[\s-]/g, '').toUpperCase() : ''
  const cleanPhone = raastId ? raastId.replace(/[^\d+]/g, '') : ''

  if (cleanIban) {
    sub26 += formatTLV('01', cleanIban)
    if (cleanPhone) {
      sub26 += formatTLV('02', cleanPhone)
    }
  } else if (cleanPhone) {
    sub26 += formatTLV('01', cleanPhone)
  }

  payload += formatTLV('26', sub26)

  // 52: Merchant Category Code (0000 = Universal Personal / P2P)
  payload += formatTLV('52', '0000')

  // 53: Transaction Currency (586 = PKR - ISO 4217)
  payload += formatTLV('53', '586')

  // 54: Transaction Amount (Included only if dynamic mode explicitly requested)
  if (isDynamic && Number(amount) > 0) {
    payload += formatTLV('54', Number(amount).toFixed(2))
  }

  // 58: Country Code (PK - ISO 3166-1)
  payload += formatTLV('58', 'PK')

  // 59: Merchant Name / Account Title (Max 25 alphanumeric chars)
  const cleanName = (accountTitle || 'Wedding Host')
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .trim()
    .slice(0, 25) || 'Wedding Host'
  payload += formatTLV('59', cleanName)

  // 60: Merchant City
  payload += formatTLV('60', 'Pakistan')

  // 62: Additional Data Field (Reference)
  const sub62 = formatTLV('01', 'NEOTA') + formatTLV('05', 'SALAMII')
  payload += formatTLV('62', sub62)

  // 63: CRC16 (Tag 63, length 04, followed by 4-digit hex checksum)
  payload += '6304'
  const crc = computeCRC16(payload)
  return payload + crc
}

/**
 * Returns crisp, high-resolution QR image URL for any payload string
 */
export function getRaastQRImageUrl(payload, size = 300) {
  if (!payload) return ''
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&ecc=H&margin=12&data=${encodeURIComponent(payload)}`
}

/**
 * Formats full details for WhatsApp or SMS copy
 */
export function formatRaastShareText({ accountTitle, raastId, iban, bankName, amount }) {
  return [
    `*Assalam-o-Alaikum!*`,
    `Official Raast / Bank Account Details for Digital Salamii:`,
    ``,
    `👤 *Title:* ${accountTitle || 'Wedding Host'}`,
    raastId ? `📱 *Raast ID (Mobile):* ${raastId}` : null,
    iban ? `🏦 *IBAN:* ${iban}` : null,
    bankName ? `🏛️ *Bank:* ${bankName}` : null,
    amount > 0 ? `💵 *Amount:* PKR ${Number(amount).toLocaleString()}` : null,
    ``,
    `📌 *How to Pay (2 Seconds):*`,
    `1. Open any Pakistani banking app (SadaPay, Nayapay, Meezan, JazzCash, Easypaisa, HBL).`,
    `2. Select "Raast" or "Send Money" and paste the Raast Mobile Number or IBAN above.`,
    `3. Confirm the recipient title (${accountTitle || 'Wedding Host'}) and tap Send!`,
    ``,
    `— Verified via NEOTA Digital Wedding Ledger`
  ].filter(Boolean).join('\n')
}
