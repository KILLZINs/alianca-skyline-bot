// Bryan I.A. — OpenAI (gpt-4o-mini)
export async function askBryan(userMessage: string, username: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return '🔑 Chave da OpenAI não configurada. Adicione OPENAI_API_KEY nas variáveis do Railway!';
  }

  const systemPrompt =
    'Você é Bryan, o assistente inteligente e animado da Aliança Skyline — ' +
    'uma aliança de servidores do Discord cujo objetivo é unir comunidades para crescerem juntas. ' +
    'Você ajuda membros com dúvidas sobre a aliança, o bot e o Discord em geral. ' +
    'Fale sempre em português do Brasil. Use linguagem jovem e descontraída (gírias leves são ok). ' +
    'Seja conciso: máximo de 400 palavras por resposta. Não use markdown excessivo. ' +
    `O usuário que está falando com você se chama ${username}.`;

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
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

      if (res.status === 429) return '⏳ Muitas requisições! Tenta novamente em alguns segundos.';
      if (res.status === 401) return '🔑 Chave da OpenAI inválida. Verifique OPENAI_API_KEY no Railway!';
      if (res.status === 402 || (res.status === 429 && body.includes('quota')))
        return '💳 Saldo OpenAI esgotado. Avise um admin para recarregar!';

      return `❌ Erro ${res.status} ao contactar a IA. Avise um admin!`;
    }

    const data = await res.json() as { choices: { message: { content: string } }[] };
    return data.choices[0]?.message?.content?.trim() ?? 'Eita, não recebi resposta. Tenta de novo!';
  } catch (err) {
    console.error('[Bryan IA] Erro de rede:', err);
    return '❌ Erro de conexão com a IA. Tenta novamente!';
  }
}
