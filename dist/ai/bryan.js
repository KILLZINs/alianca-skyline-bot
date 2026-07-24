"use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.askBryan = void 0;

    async function askBryan(userMessage, username) {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
          return '🔑 Chave da OpenAI não configurada. Peça a um admin para adicionar OPENAI_API_KEY nas variáveis de ambiente do Railway!';
      }
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
                      {
                          role: 'system',
                          content: 'Você é Bryan, o assistente inteligente e animado da Aliança Skyline — ' +
                              'uma aliança de servidores do Discord cujo objetivo é unir comunidades para crescerem juntas. ' +
                              'Você ajuda membros com dúvidas sobre a aliança, o bot e o Discord em geral. ' +
                              'Fale sempre em português do Brasil. Use linguagem jovem e descontraída (gírias leves são ok). ' +
                              'Seja conciso: máximo de 400 palavras por resposta. Não use markdown excessivo. ' +
                              `O usuário que está falando com você se chama ${username}.`,
                      },
                      { role: 'user', content: userMessage },
                  ],
                  max_tokens: 500,
                  temperature: 0.8,
              }),
          });
          if (res.status === 429) return '⏳ Estou sobrecarregado agora! Tenta novamente em alguns segundos.';
          if (res.status === 401) return '🔑 Chave da API inválida. Avise um admin do bot!';
          if (!res.ok) { console.error('[Bryan IA] HTTP', res.status); return '❌ Erro ao contactar a IA. Tenta novamente!'; }
          const data = await res.json();
          return data.choices[0]?.message?.content?.trim() ?? 'Eita, não recebi resposta. Tenta de novo!';
      } catch (err) {
          console.error('[Bryan IA] Erro:', err);
          return '❌ Ocorreu um erro ao processar sua mensagem. Tenta novamente!';
      }
    }
    exports.askBryan = askBryan;
    