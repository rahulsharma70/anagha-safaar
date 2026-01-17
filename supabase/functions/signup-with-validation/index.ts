import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PasswordValidation {
  isValid: boolean;
  errors: string[];
}

const validatePassword = (password: string): PasswordValidation => {
  const errors: string[] = [];
  
  // At least 8 characters long
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  // One uppercase letter
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter (A-Z)');
  }
  
  // One lowercase letter
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter (a-z)');
  }
  
  // One number
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number (0-9)');
  }
  
  // One special character
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^&*)');
  }
  
  // Check for commonly used passwords
  const commonPasswords = [
    'password', 'password123', '12345678', 'qwerty', 'abc123', 
    'monkey', '1234567', 'letmein', 'trustno1', 'dragon',
    'baseball', 'iloveyou', 'master', 'sunshine', 'ashley',
    'bailey', 'passw0rd', 'shadow', '123123', '654321'
  ];
  
  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('This password is too common. Please choose a more unique password');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Function to send admin notification
const sendAdminNotification = async (email: string, fullName?: string) => {
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  const ADMIN_EMAIL = "rahulsharma70@gmail.com";
  
  if (!RESEND_API_KEY) {
    console.log("RESEND_API_KEY not configured, skipping admin notification");
    return;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Anagha Safar <onboarding@resend.dev>",
        to: [ADMIN_EMAIL],
        subject: "🎉 New User Signup - Anagha Safar",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #1a1a2e; border-bottom: 2px solid #e94560; padding-bottom: 10px;">
              New User Registration
            </h1>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 10px 0;"><strong>Email:</strong> ${email}</p>
              <p style="margin: 10px 0;"><strong>Name:</strong> ${fullName || "Not provided"}</p>
              <p style="margin: 10px 0;"><strong>Signup Time:</strong> ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</p>
            </div>
            <p style="color: #666; font-size: 14px;">
              A new user has registered on Anagha Safar. You can view their details in the admin dashboard.
            </p>
          </div>
        `,
      }),
    });

    const data = await response.json();
    console.log("Admin notification sent:", data);
  } catch (error) {
    console.error("Failed to send admin notification:", error);
    // Don't throw - we don't want to fail signup if notification fails
  }
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, password, fullName } = await req.json();

    // Validate email format
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid email address format' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate password complexity
    const validation = validatePassword(password);
    if (!validation.isValid) {
      console.error('Password validation failed:', validation.errors);
      return new Response(
        JSON.stringify({ 
          error: 'Password does not meet security requirements',
          details: validation.errors
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Create Supabase client with service role for signup
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Proceed with signup after validation
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm for non-production
      user_metadata: fullName ? { full_name: fullName } : undefined
    });

    if (error) {
      console.error('Signup error:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('User created successfully:', data.user?.email);

    // Send admin notification email (async, don't wait)
    sendAdminNotification(email, fullName);

    return new Response(
      JSON.stringify({ 
        user: data.user,
        message: 'Account created successfully'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'An unexpected error occurred. Please try again.' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
