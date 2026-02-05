 import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
 
 const corsHeaders = {
   "Access-Control-Allow-Origin": "*",
   "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
 };
 
 const SYSTEM_PROMPT = `You are Anagha, a friendly and knowledgeable AI travel assistant for Anagha Safar, a premium Indian travel booking platform. You help users with:
 
 1. **Flight Bookings**: Search flights, compare prices, suggest best times to travel
 2. **Hotel Reservations**: Find accommodations, compare amenities, recommend locations
 3. **Tour Packages**: Suggest curated tour packages across India
 4. **Trip Planning**: Help plan itineraries, suggest destinations, provide travel tips
 
 Key Guidelines:
 - Be warm, helpful, and conversational
 - Focus on Indian destinations and domestic travel
 - Provide specific recommendations when asked
 - Suggest popular destinations like Goa, Kerala, Rajasthan, Himachal Pradesh, etc.
 - Mention seasonal considerations for travel
 - Keep responses concise but informative (2-3 sentences for simple queries)
 - Use emojis sparingly to add warmth 🌴✈️🏨
 - If users want to book, guide them to the relevant section of the website
 
 Popular destinations to recommend:
 - Beaches: Goa, Kerala, Andaman
 - Mountains: Shimla, Manali, Darjeeling, Ladakh
 - Heritage: Jaipur, Udaipur, Agra, Varanasi
 - Wildlife: Ranthambore, Jim Corbett, Kaziranga
 - Spiritual: Rishikesh, Varanasi, Tirupati`;
 
 serve(async (req) => {
   if (req.method === "OPTIONS") {
     return new Response(null, { headers: corsHeaders });
   }
 
   try {
     const { messages } = await req.json();
     const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
     
     if (!LOVABLE_API_KEY) {
       throw new Error("LOVABLE_API_KEY is not configured");
     }
 
     const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
       method: "POST",
       headers: {
         Authorization: `Bearer ${LOVABLE_API_KEY}`,
         "Content-Type": "application/json",
       },
       body: JSON.stringify({
         model: "google/gemini-3-flash-preview",
         messages: [
           { role: "system", content: SYSTEM_PROMPT },
           ...messages,
         ],
         stream: true,
       }),
     });
 
     if (!response.ok) {
       if (response.status === 429) {
         return new Response(JSON.stringify({ error: "Too many requests. Please try again in a moment." }), {
           status: 429,
           headers: { ...corsHeaders, "Content-Type": "application/json" },
         });
       }
       if (response.status === 402) {
         return new Response(JSON.stringify({ error: "Service temporarily unavailable. Please try again later." }), {
           status: 402,
           headers: { ...corsHeaders, "Content-Type": "application/json" },
         });
       }
       const errorText = await response.text();
       console.error("AI gateway error:", response.status, errorText);
       return new Response(JSON.stringify({ error: "Failed to get response from AI" }), {
         status: 500,
         headers: { ...corsHeaders, "Content-Type": "application/json" },
       });
     }
 
     return new Response(response.body, {
       headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
     });
   } catch (error) {
     console.error("Travel assistant error:", error);
     return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
       status: 500,
       headers: { ...corsHeaders, "Content-Type": "application/json" },
     });
   }
 });