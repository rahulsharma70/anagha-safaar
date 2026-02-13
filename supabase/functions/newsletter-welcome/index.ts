import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not configured');
    }

    const { email } = await req.json();
    if (!email) {
      return new Response(JSON.stringify({ error: 'Email is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f8f5f0; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
          .header { background: linear-gradient(135deg, #c2410c, #ea580c); padding: 40px 30px; text-align: center; }
          .header h1 { color: #ffffff; margin: 0; font-size: 28px; letter-spacing: 1px; }
          .header p { color: #fed7aa; margin: 8px 0 0; font-size: 14px; }
          .body { padding: 30px; }
          .body h2 { color: #1a1a1a; font-size: 22px; margin-bottom: 16px; }
          .body p { color: #4a4a4a; line-height: 1.7; font-size: 15px; }
          .trip-card { background: #fef3c7; border-left: 4px solid #ea580c; padding: 16px 20px; border-radius: 8px; margin: 20px 0; }
          .trip-card h3 { color: #c2410c; margin: 0 0 8px; font-size: 16px; }
          .trip-card p { margin: 4px 0; font-size: 14px; color: #555; }
          .deals { display: flex; gap: 12px; margin: 20px 0; }
          .deal { flex: 1; background: #fff7ed; border-radius: 8px; padding: 16px; text-align: center; border: 1px solid #fed7aa; }
          .deal h4 { color: #ea580c; margin: 0 0 4px; font-size: 14px; }
          .deal p { margin: 0; font-size: 12px; color: #666; }
          .cta { display: inline-block; background: linear-gradient(135deg, #c2410c, #ea580c); color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 20px 0; }
          .footer { background: #1a1a1a; padding: 24px 30px; text-align: center; }
          .footer p { color: #999; font-size: 12px; margin: 4px 0; }
          .footer a { color: #ea580c; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🙏 Anagha Safar</h1>
            <p>Your Journey Begins Here</p>
          </div>
          <div class="body">
            <h2>Welcome to Our Travel Family! ✨</h2>
            <p>Thank you for subscribing to <strong>Anagha Safar</strong>! We're thrilled to have you join thousands of travel enthusiasts who explore India's most breathtaking destinations with us.</p>
            
            <div class="trip-card">
              <h3>🏔️ Trending: Himalayan Retreat</h3>
              <p><strong>Duration:</strong> 5 Days / 4 Nights</p>
              <p><strong>Highlights:</strong> Manali, Solang Valley, Rohtang Pass</p>
              <p><strong>Starting from:</strong> ₹12,999/person</p>
            </div>
            
            <div class="trip-card">
              <h3>🌴 Popular: Kerala Backwaters</h3>
              <p><strong>Duration:</strong> 4 Days / 3 Nights</p>
              <p><strong>Highlights:</strong> Alleppey, Munnar, Thekkady</p>
              <p><strong>Starting from:</strong> ₹9,999/person</p>
            </div>

            <div class="trip-card">
              <h3>🏰 Heritage: Royal Rajasthan</h3>
              <p><strong>Duration:</strong> 6 Days / 5 Nights</p>
              <p><strong>Highlights:</strong> Jaipur, Udaipur, Jodhpur, Jaisalmer</p>
              <p><strong>Starting from:</strong> ₹14,999/person</p>
            </div>

            <p style="text-align: center; margin-top: 24px;">
              <a href="https://anagha-safaar.lovable.app/tours" class="cta">Explore All Trips →</a>
            </p>
            
            <p>As a subscriber, you'll receive:</p>
            <ul style="color: #4a4a4a; line-height: 2;">
              <li>🎯 Exclusive flash deals & early bird offers</li>
              <li>📍 New destination announcements</li>
              <li>💡 Travel tips & curated itineraries</li>
              <li>🎁 Special subscriber-only discounts</li>
            </ul>
          </div>
          <div class="footer">
            <p><strong>Anagha Safar</strong> — Discover India, Discover Yourself</p>
            <p>Questions? <a href="https://anagha-safaar.lovable.app/contact">Contact us</a></p>
            <p style="margin-top: 12px;">You received this because you subscribed at anagha-safaar.lovable.app</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Anagha Safar <onboarding@resend.dev>',
        to: [email],
        subject: '🙏 Welcome to Anagha Safar — Your Journey Begins!',
        html: emailHtml,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(`Resend API error: ${JSON.stringify(data)}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Newsletter welcome email error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
