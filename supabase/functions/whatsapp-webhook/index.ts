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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const payload = await req.json()
    console.log('Webhook payload received:', JSON.stringify(payload))

    const { event, instance, data } = payload

    // 1. Identify instance in our DB
    const { data: instancia } = await supabaseClient
      .from('whatsapp_instancias')
      .select('id')
      .eq('nome', instance)
      .single()

    if (!instancia) {
      console.warn(`Instância não encontrada: ${instance}`)
      return new Response(JSON.stringify({ error: 'Instance not found' }), { status: 404 })
    }

    // 2. Handle Message Event
    if (event === 'messages.upsert') {
      const message = data.message
      const remoteJid = data.key.remoteJid
      const fromMe = data.key.fromMe
      const text = message?.conversation || message?.extendedTextMessage?.text || ''

      // Save message to DB
      await supabaseClient.from('whatsapp_mensagens').insert({
        instancia_id: instancia.id,
        remote_jid: remoteJid,
        from_me: fromMe,
        content: text,
        external_id: data.key.id,
        message_type: 'text',
        status: 'received'
      })

      // 3. Auto-Responder Logic (Brain)
      if (!fromMe && text) {
        const { data: config } = await supabaseClient
          .from('whatsapp_configuracoes')
          .select('*')
          .eq('instancia_id', instancia.id)
          .single()

        if (config?.auto_responder_enabled && config?.auto_responder_brain) {
          // Call AI to generate response
          // We can call the campaign-ai edge function or call AI Gateway directly here
          const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'google/gemini-2.0-flash',
              messages: [
                { role: 'system', content: config.auto_responder_brain },
                { role: 'user', content: text }
              ],
            }),
          })

          if (aiResponse.ok) {
            const aiData = await aiResponse.json()
            const replyText = aiData.choices?.[0]?.message?.content

            if (replyText) {
              // Send reply via Evolution API
              // Note: You would need the instance URL and token here. 
              // For now, we log that we would send this reply.
              console.log(`Auto-reply generated for ${remoteJid}: ${replyText}`)
            }
          }
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
