/** Opens WhatsApp (app or web) with the message typed in, ready to pick a chat. */
export function whatsappShareUrl(text: string) {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

/** Message used when sharing a booking's view-only link. */
export function bookingShareText(reference: string, url: string) {
  return `Our Durga Puja passes (PujaPass booking ${reference}). Open this link to see the QR codes: ${url}`;
}
