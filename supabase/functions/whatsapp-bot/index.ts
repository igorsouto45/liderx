import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const payload = await req.json()
    console.log('WhatsApp Webhook Payload:', payload)

    // open-wa event structure usually has 'event' and 'data'
    // or sometimes it's just the message object if configured as simple webhook
    const message = payload.data || payload
    
    if (message.event !== 'message' && !message.body) {
      return new Response(JSON.stringify({ status: 'ignored' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Find the user config (assuming we identify user by some property or just the first one for now)
    // In a real multi-tenant app, we'd use a session token or id in the URL
    // For now, let's look for any config that is enabled
    const { data: configs } = await supabaseAdmin
      .from('whatsapp_config')
      .select('*')
      .eq('ai_brain_enabled', true)

    if (!configs || configs.length === 0) {
      return new Response(JSON.stringify({ status: 'no_ai_enabled' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    const config = configs[0] // Using the first one found for demonstration

    // Call AI
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: config.ai_prompt || "Você é um assistente útil." },
          { role: 'user', content: message.body }
        ],
      }),
    })

    const aiData = await aiResponse.json()
    const responseText = aiData.choices?.[0]?.message?.content

    if (responseText && config.api_url) {
      // Send message back using open-wa API
      await fetch(`${config.api_url}/sendText`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.api_key}`
        },
        body: JSON.stringify({
          args: {
            to: message.from,
            content: responseText
          }
        })
      })
    }

    return new Response(JSON.stringify({ status: 'success', response: responseText }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Webhook Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
