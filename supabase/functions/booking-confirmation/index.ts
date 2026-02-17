import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BookingConfirmationPayload {
  customerEmail: string;
  customerName: string;
  bookingReference: string;
  itemName: string;
  itemType: string;
  totalAmount: number;
  startDate: string;
  endDate?: string;
  guestsCount: number;
  paymentMethod: string;
  addOns?: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not configured');
    }

    const payload: BookingConfirmationPayload = await req.json();
    console.log('Sending booking confirmation to:', payload.customerEmail);

    if (!payload.customerEmail || !payload.bookingReference) {
      return new Response(JSON.stringify({ error: 'Customer email and booking reference are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const itemTypeLabel = payload.itemType === 'hotel' ? '🏨 Hotel' : payload.itemType === 'flight' ? '✈️ Flight' : '🗺️ Tour';
    const bookingDate = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'long', timeStyle: 'short' });

    const addOnsHtml = payload.addOns && payload.addOns.length > 0
      ? `<div style="margin-top: 16px;">
           <h3 style="color: #c2410c; font-size: 14px; margin: 0 0 8px;">Add-ons Included:</h3>
           <ul style="margin: 0; padding-left: 20px; color: #555; font-size: 14px;">
             ${payload.addOns.map(a => `<li>${a}</li>`).join('')}
           </ul>
         </div>`
      : '';

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f8f5f0; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
          .header { background: linear-gradient(135deg, #16a34a, #22c55e); padding: 40px 30px; text-align: center; }
          .header h1 { color: #ffffff; margin: 0; font-size: 28px; letter-spacing: 1px; }
          .header p { color: #bbf7d0; margin: 8px 0 0; font-size: 14px; }
          .check-icon { font-size: 48px; margin-bottom: 12px; }
          .body { padding: 30px; }
          .body h2 { color: #1a1a1a; font-size: 22px; margin-bottom: 8px; }
          .body p { color: #4a4a4a; line-height: 1.7; font-size: 15px; }
          .booking-card { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 24px; margin: 20px 0; }
          .booking-ref { background: #dcfce7; display: inline-block; padding: 8px 16px; border-radius: 6px; font-family: monospace; font-size: 18px; font-weight: 700; color: #166534; letter-spacing: 2px; margin-bottom: 16px; }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
          .detail-row:last-child { border-bottom: none; }
          .detail-label { color: #6b7280; font-size: 14px; }
          .detail-value { color: #1f2937; font-size: 14px; font-weight: 600; }
          .total-row { background: linear-gradient(135deg, #c2410c, #ea580c); color: #fff; padding: 16px 24px; border-radius: 8px; margin-top: 16px; display: flex; justify-content: space-between; align-items: center; }
          .total-label { font-size: 16px; }
          .total-amount { font-size: 24px; font-weight: 700; }
          .next-steps { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px 20px; border-radius: 0 8px 8px 0; margin: 24px 0; }
          .next-steps h3 { color: #92400e; margin: 0 0 8px; font-size: 15px; }
          .next-steps ul { margin: 0; padding-left: 20px; color: #555; font-size: 14px; line-height: 1.8; }
          .cta { display: inline-block; background: linear-gradient(135deg, #c2410c, #ea580c); color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 20px 0; }
          .footer { background: #1a1a1a; padding: 24px 30px; text-align: center; }
          .footer p { color: #999; font-size: 12px; margin: 4px 0; }
          .footer a { color: #ea580c; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="check-icon">✅</div>
            <h1>Booking Confirmed!</h1>
            <p>Anagha Safar — Your Journey Awaits</p>
          </div>
          <div class="body">
            <h2>Namaste, ${payload.customerName || 'Traveller'}! 🙏</h2>
            <p>Your booking has been confirmed successfully. Here are your booking details:</p>
            
            <div class="booking-card">
              <div style="text-align: center; margin-bottom: 16px;">
                <span class="booking-ref">${payload.bookingReference}</span>
              </div>

              <table style="width: 100%; border-collapse: collapse;">
                <tr style="border-bottom: 1px solid #e5e7eb;">
                  <td style="padding: 10px 0; color: #6b7280; font-size: 14px;">Booking Type</td>
                  <td style="padding: 10px 0; color: #1f2937; font-size: 14px; font-weight: 600; text-align: right;">${itemTypeLabel}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e5e7eb;">
                  <td style="padding: 10px 0; color: #6b7280; font-size: 14px;">${payload.itemType === 'flight' ? 'Flight' : payload.itemType === 'hotel' ? 'Hotel' : 'Tour'}</td>
                  <td style="padding: 10px 0; color: #1f2937; font-size: 14px; font-weight: 600; text-align: right;">${payload.itemName}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e5e7eb;">
                  <td style="padding: 10px 0; color: #6b7280; font-size: 14px;">${payload.itemType === 'flight' ? 'Travel Date' : 'Check-in'}</td>
                  <td style="padding: 10px 0; color: #1f2937; font-size: 14px; font-weight: 600; text-align: right;">${payload.startDate}</td>
                </tr>
                ${payload.endDate ? `
                <tr style="border-bottom: 1px solid #e5e7eb;">
                  <td style="padding: 10px 0; color: #6b7280; font-size: 14px;">Check-out</td>
                  <td style="padding: 10px 0; color: #1f2937; font-size: 14px; font-weight: 600; text-align: right;">${payload.endDate}</td>
                </tr>` : ''}
                <tr style="border-bottom: 1px solid #e5e7eb;">
                  <td style="padding: 10px 0; color: #6b7280; font-size: 14px;">Guests</td>
                  <td style="padding: 10px 0; color: #1f2937; font-size: 14px; font-weight: 600; text-align: right;">${payload.guestsCount}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #6b7280; font-size: 14px;">Payment Method</td>
                  <td style="padding: 10px 0; color: #1f2937; font-size: 14px; font-weight: 600; text-align: right;">${payload.paymentMethod}</td>
                </tr>
              </table>

              ${addOnsHtml}
            </div>

            <div class="total-row">
              <span class="total-label">Total Paid</span>
              <span class="total-amount">₹${payload.totalAmount?.toLocaleString('en-IN')}</span>
            </div>

            <div class="next-steps">
              <h3>📋 What's Next?</h3>
              <ul>
                <li>Save your booking reference: <strong>${payload.bookingReference}</strong></li>
                <li>View and manage your booking from your dashboard</li>
                <li>Contact us for any changes or special requests</li>
              </ul>
            </div>

            <p style="text-align: center; margin-top: 24px;">
              <a href="https://anagha-safaar.lovable.app/dashboard" class="cta">View My Bookings →</a>
            </p>
            
            <p style="color: #888; font-size: 13px; text-align: center; margin-top: 16px;">
              Booked on: ${bookingDate}
            </p>
          </div>
          <div class="footer">
            <p><strong>Anagha Safar</strong> — Discover India, Discover Yourself</p>
            <p>Need help? <a href="https://anagha-safaar.lovable.app/contact">Contact Support</a> | <a href="https://anagha-safaar.lovable.app/cancellation-policy">Cancellation Policy</a></p>
            <p style="margin-top: 12px;">This is an automated confirmation from anagha-safaar.lovable.app</p>
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
        to: [payload.customerEmail],
        subject: `✅ Booking Confirmed — ${payload.bookingReference} | Anagha Safar`,
        html: emailHtml,
      }),
    });

    const data = await res.json();
    console.log('Resend response:', data);

    if (!res.ok) {
      throw new Error(`Resend API error: ${JSON.stringify(data)}`);
    }

    return new Response(JSON.stringify({ success: true, emailId: data.id }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Booking confirmation email error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
