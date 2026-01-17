import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const ADMIN_EMAIL = "rahulsharma70@gmail.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationPayload {
  type: "signup" | "booking";
  data: {
    userEmail?: string;
    userName?: string;
    bookingReference?: string;
    itemName?: string;
    itemType?: string;
    totalAmount?: number;
    startDate?: string;
    guestsCount?: number;
  };
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: NotificationPayload = await req.json();
    console.log("Received notification request:", payload);

    let subject = "";
    let htmlContent = "";

    if (payload.type === "signup") {
      subject = "🎉 New User Signup - Anagha Safar";
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #1a1a2e; border-bottom: 2px solid #e94560; padding-bottom: 10px;">
            New User Registration
          </h1>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 10px 0;"><strong>Email:</strong> ${payload.data.userEmail || "N/A"}</p>
            <p style="margin: 10px 0;"><strong>Name:</strong> ${payload.data.userName || "Not provided"}</p>
            <p style="margin: 10px 0;"><strong>Signup Time:</strong> ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</p>
          </div>
          <p style="color: #666; font-size: 14px;">
            A new user has registered on Anagha Safar. You can view their details in the admin dashboard.
          </p>
        </div>
      `;
    } else if (payload.type === "booking") {
      subject = "🎫 New Booking - Anagha Safar";
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #1a1a2e; border-bottom: 2px solid #e94560; padding-bottom: 10px;">
            New Booking Received
          </h1>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 10px 0;"><strong>Booking Reference:</strong> ${payload.data.bookingReference || "N/A"}</p>
            <p style="margin: 10px 0;"><strong>Customer Email:</strong> ${payload.data.userEmail || "N/A"}</p>
            <p style="margin: 10px 0;"><strong>Customer Name:</strong> ${payload.data.userName || "Not provided"}</p>
            <p style="margin: 10px 0;"><strong>Item:</strong> ${payload.data.itemName || "N/A"}</p>
            <p style="margin: 10px 0;"><strong>Type:</strong> ${payload.data.itemType || "N/A"}</p>
            <p style="margin: 10px 0;"><strong>Start Date:</strong> ${payload.data.startDate || "N/A"}</p>
            <p style="margin: 10px 0;"><strong>Guests:</strong> ${payload.data.guestsCount || "N/A"}</p>
            <p style="margin: 10px 0; font-size: 18px; color: #e94560;">
              <strong>Total Amount:</strong> ₹${payload.data.totalAmount?.toLocaleString("en-IN") || "N/A"}
            </p>
            <p style="margin: 10px 0;"><strong>Booking Time:</strong> ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</p>
          </div>
          <p style="color: #666; font-size: 14px;">
            A new booking has been made on Anagha Safar. Please review and process this booking.
          </p>
        </div>
      `;
    }

    // Send email using Resend API directly
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Anagha Safar <onboarding@resend.dev>",
        to: [ADMIN_EMAIL],
        subject: subject,
        html: htmlContent,
      }),
    });

    const emailData = await emailResponse.json();
    console.log("Email sent:", emailData);

    if (!emailResponse.ok) {
      throw new Error(emailData.message || "Failed to send email");
    }

    return new Response(JSON.stringify({ success: true, emailData }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in admin-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
