import { createClient } from "@supabase/supabase-js";

export const config = {
  runtime: 'edge',
};

/**
 * STRIPE WEBHOOK HANDLER (THE PRO WAY)
 * This endpoint listens for Stripe events. 
 * When a 'checkout.session.completed' event occurs, it sends the 
 * license code to the customer using the Resend Email API.
 */
export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405 });
  }

  // Use the environment variable the user set up in Vercel (Step 5)
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const MASTER_LICENSE_CODE = "digital-gentry-2025";

  if (!RESEND_API_KEY) {
    console.error("Missing RESEND_API_KEY environment variable");
    return new Response(JSON.stringify({ error: 'Server Configuration Error' }), { status: 500 });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_STORAGE_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.STORAGE_SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing Supabase configuration");
    return new Response(JSON.stringify({ error: 'Server Configuration Error' }), { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const payload = await req.json();
    const eventType = payload.type;

    // We only care about successful checkouts
    if (eventType === 'checkout.session.completed') {
      const session = payload.data.object;
      const customerEmail = session.customer_details?.email;

      if (!customerEmail) {
        return new Response(JSON.stringify({ error: 'No customer email found' }), { status: 400 });
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('credit_balance')
        .eq('email', customerEmail)
        .single();

      if (profile) {
        const new_balance = (profile.credit_balance || 0) + 500;
        await supabase
          .from('profiles')
          .update({ credit_balance: new_balance })
          .eq('email', customerEmail);
        console.log("Credits added for:", customerEmail);
      } else {
        console.warn("User not found for credits:", customerEmail);
      }

      // Send the email via Resend
      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Digital Gentry AI <onboarding@resend.dev>',
          to: [customerEmail],
          subject: 'Your AI Suite Access Code',
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
              <h1 style="color: #1e293b; font-size: 24px;">Welcome to the Digital Gentry AI Suite</h1>
              <p style="color: #475569; font-size: 16px; line-height: 1.5;">
                Thank you for your purchase! You now have full access to our suite of over 60 AI-powered tools.
              </p>
              <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; text-align: center; margin: 25px 0;">
                <p style="text-transform: uppercase; font-size: 12px; font-weight: bold; color: #64748b; margin-bottom: 8px;">Your Master Access Code</p>
                <code style="font-size: 20px; font-weight: 900; color: #f59e0b; letter-spacing: 2px;">${MASTER_LICENSE_CODE}</code>
              </div>
              <p style="color: #475569; font-size: 14px;">
                Enter this code at the login screen to unlock all features, including Pro Video (Veo) and Real-time Voice.
              </p>
              <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
              <p style="color: #94a3b8; font-size: 12px; text-align: center;">
                &copy; 2025 Digital Gentry AI. All rights reserved.
              </p>
            </div>
          `,
        }),
      });

      if (!resendResponse.ok) {
        const errorData = await resendResponse.json();
        console.error("Resend API Error:", errorData);
        return new Response(JSON.stringify({ error: 'Failed to send email' }), { status: 500 });
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Webhook Error:", error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}