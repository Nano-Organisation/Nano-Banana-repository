
export const config = {
  runtime: 'edge',
};

/**
 * SECURE SERVER-SIDE VALIDATION
 * This code runs on the server (e.g., Vercel Edge Network).
 * The VALID_ACCESS_CODES list is never sent to the client browser.
 */
export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405 });
  }

  try {
    const { code } = await req.json();
    
    const VALID_ACCESS_CODES = [
      "digital-gentry-2025",
      "digital-gentry-2025-p1",
      "digital-gentry-2025-x9",
      "digital-gentry-2025-m4",
      "digital-gentry-2025-k7",
      "digital-gentry-2025-v2",
      "dg-pro-suite-8821-990",
      "dg-pro-suite-1102-445",
      "dg-pro-suite-7732-118",
      "premium-access-nano-001",
      "premium-access-nano-002",
      "premium-access-nano-003"
    ];

    const isValid = VALID_ACCESS_CODES.includes(code?.trim());

    return new Response(JSON.stringify({ valid: isValid }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Invalid Request' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
