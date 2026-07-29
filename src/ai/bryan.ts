// Bryan I.A. — Mistral AI
export async function askBryan(userMessage: string, username: string): Promise<string> {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) {
    return '🔑 Chave da Mistral não configurada. Adicione MISTRAL_API_KEY nas variáveis do Railway.';
  }

  const systemPrompt =
    'Você é Bryan, assistente da Aliança Skyline — uma aliança de servidores do Discord focada em unir comunidades para crescerem juntas. ' +
    'Você ajuda membros com dúvidas sobre a aliança, o bot e o Discord em geral.\n\n' +
    'Regras de comunicação:\n' +
    '- Responda sempre em português do Brasil\n' +
    '- Seja direto e claro. Sem enrolação, sem frases de efeito\n' +
    '- Tom natural: sem exclamações excessivas, sem emojis desnecessários\n' +
    '- No dia a dia pode ser informal, mas com classe — como alguém que sabe o que está falando\n' +
    '- Quando o assunto for sério (punições, regras, administração), seja objetivo e profissional\n' +
    '- Máximo de 300 palavras por resposta. Prefira respostas curtas e diretas\n' +
    '- Evite markdown excessivo (negrito em tudo, listas desnecessárias, etc.)\n' +
    '- Se não souber algo, diga claramente em vez de inventar\n\n' +
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
        max_tokens: 450,
        temperature: 0.65,
      }),
    });

    if (!res.ok) {
      let body = '';
      try { body = await res.text(); } catch { /* ignore */ }
      console.error(`[Bryan IA] HTTP ${res.status}:`, body.slice(0, 300));

      if (res.status === 429) return '⏳ Muitas requisições simultâneas. Aguarda alguns segundos e tenta de novo.';
      if (res.status === 401) return '🔑 Chave da Mistral inválida. Verifique MISTRAL_API_KEY no Railway.';
      return `❌ Erro ${res.status} ao contactar a IA. Avise um administrador.`;
    }

    const data = await res.json() as { choices: { message: { content: string } }[] };
    return data.choices[0]?.message?.content?.trim() ?? 'Não recebi resposta. Tenta de novo.';
  } catch (err) {
    console.error('[Bryan IA] Erro de rede:', err);
    return '❌ Erro de conexão com a IA. Tenta novamente.';
  }
}
