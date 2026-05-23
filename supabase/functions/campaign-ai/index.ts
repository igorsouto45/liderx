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
    const { message, history } = await req.json()
    const authHeader = req.headers.get('Authorization')!
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: summary } = await supabaseClient.rpc('get_campaign_summary')

    const systemPrompt = `Você é o LiderX AI, um consultor estratégico de elite para campanhas eleitorais no Brasil.
Seu objetivo é transformar dados em ações vitoriosas. Você deve ser proativo, analítico e usar os dados reais da campanha para dar conselhos precisos.

DADOS ESTRATÉGICOS DA CAMPANHA (Tempo Real):
${JSON.stringify(summary, null, 2)}

SUAS DIRETRIZES DE ATUAÇÃO:
1. ANÁLISE DE DADOS: Sempre que houver dados disponíveis, use-os. Se o usuário perguntar sobre bairros, cite o "neighborhood_stats". Se perguntar sobre engajamento, cite o "growth".
2. PROATIVIDADE: Não espere apenas perguntas. Sugira melhorias. Se o crescimento em 30 dias estiver baixo, sugira uma força-tarefa.
3. COMUNICAÇÃO: Crie roteiros de WhatsApp, scripts de vídeos para Instagram/TikTok, e textos para líderes baseados na realidade da campanha.
4. TOM DE VOZ: Profissional, motivador, estratégico e confidencial. Você é o braço direito do candidato.
5. FOCO: O objetivo final é converter cadastros em votos e aumentar a capilaridade da campanha via líderes.
6. IDIOMA: Responda exclusivamente em Português do Brasil.`

    const apiResponse = await fetch('https://api.lovable.dev/v1/ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          ...history,
          { role: 'user', content: message }
        ],
      }),
    })

    const data = await apiResponse.json()
    const aiMessage = data.choices[0].message.content

    return new Response(JSON.stringify({ text: aiMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
