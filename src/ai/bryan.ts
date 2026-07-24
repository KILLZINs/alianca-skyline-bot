// Bryan I.A. — Mistral AI (tier gratuito, sem cartão de crédito)
export async function askBryan(userMessage: string, username: string): Promise<string> {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) {
    return '🔑 Chave da Mistral não configurada. Adicione MISTRAL_API_KEY nas variáveis do Railway!';
  }

  const systemPrompt =
    'Você é Bryan, o assistente inteligente e animado da Aliança Skyline — ' +
    'uma aliança de servidores do Discord cujo objetivo é unir comunidades para crescerem juntas. ' +
    'Você ajuda membros com dúvidas sobre a aliança, o bot e o Discord em geral. ' +
    'Fale sempre em português do Brasil. Use linguagem jovem e descontraída (gírias leves são ok). ' +
    'Seja conciso: máximo de 400 palavras por resposta. Não use markdown excessivo. ' +
    `O usuário que está falando com você se chama ${username}.`;

  try {
    const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mistral-small-latest',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: userMessage },
        ],
        max_tokens: 500,
        temperature: 0.8,
      }),
    });

    if (!res.ok) {
      let body = '';
      try { body = await res.text(); } catch { /* ignore */ }
      console.error(`[Bryan IA] HTTP ${res.status}:`, body.slice(0, 300));

      if (res.status === 429) return '⏳ Muitas requisições! Aguarda alguns segundos e tenta de novo.';
      if (res.status === 401) return '🔑 Chave da Mistral inválida. Verifique MISTRAL_API_KEY no Railway!';
      return `❌ Erro ${res.status} ao contactar a IA. Avise um admin!`;
    }

    const data = await res.json() as { choices: { message: { content: string } }[] };
    return data.choices[0]?.message?.content?.trim() ?? 'Eita, não recebi resposta. Tenta de novo!';
  } catch (err) {
    console.error('[Bryan IA] Erro de rede:', err);
    return '❌ Erro de conexão com a IA. Tenta novamente!';
  }
}
