import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { message, history } = await req.json()
    const authHeader = req.headers.get('Authorization')!
    
    // Create Supabase client to fetch context
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    // Get current user to ensure they are authenticated
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      throw new Error('Não autorizado')
    }

    // Get campaign context
    const { data: summary, error: rpcError } = await supabaseClient.rpc('get_campaign_summary')
    if (rpcError) {
      console.error('Erro ao buscar resumo:', rpcError)
    }

    const systemPrompt = `Você é o LiderX AI, um assistente estratégico especializado em campanhas eleitorais no Brasil.
Seu objetivo é ajudar o administrador da campanha a tomar decisões baseadas em dados e otimizar a comunicação.

DADOS ATUAIS DA CAMPANHA:
- Total de Eleitores cadastrados: ${summary?.total_voters || 0}
- Total de Líderes na equipe: ${summary?.total_leaders || 0}
- Top 5 Bairros com mais eleitores: ${JSON.stringify(summary?.top_neighborhoods || [])}

ORIENTAÇÕES:
1. Seja analítico e estratégico. Se perguntarem sobre bairros, sugira ações específicas para os bairros com mais eleitores ou onde há poucos registros.
2. Ajude a criar textos para redes sociais, scripts de vídeos e mensagens para os líderes.
3. Use um tom profissional, motivador e focado em resultados.
4. Responda sempre em Português do Brasil.
5. Se não tiver dados específicos para uma pergunta, diga o que o usuário pode fazer no sistema para obter essa informação.`

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

    if (!apiResponse.ok) {
      const errorData = await apiResponse.json()
      console.error('Erro na AI Gateway:', errorData)
      throw new Error('Erro ao processar resposta da IA')
    }

    const data = await apiResponse.json()
    const aiMessage = data.choices[0].message.content

    return new Response(JSON.stringify({ text: aiMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Erro na função campaign-ai:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
