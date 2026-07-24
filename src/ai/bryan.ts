import OpenAI from 'openai';

    let openaiClient: OpenAI | null = null;

    function getOpenAI(): OpenAI {
    if (!openaiClient) {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) throw new Error('OPENAI_API_KEY não configurada.');
      openaiClient = new OpenAI({ apiKey });
    }
    return openaiClient;
    }

    /**
    * Pergunta ao Bryan (ChatGPT) e retorna a resposta como string.
    * @param userMessage  Mensagem do usuário (sem o "Bryan, " do início)
    * @param username     Display name do usuário que chamou o Bryan
    */
    export async function askBryan(userMessage: string, username: string): Promise<string> {
    try {
      const openai = getOpenAI();
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              `Você é Bryan, o assistente inteligente e animado da Aliança Skyline — ` +
              `uma aliança de servidores do Discord cujo objetivo é unir comunidades para crescerem juntas. ` +
              `Você ajuda membros com dúvidas sobre a aliança, o bot e o Discord em geral. ` +
              `Fale sempre em português do Brasil. Use linguagem jovem e descontraída (gírias leves são ok). ` +
              `Seja conciso: máximo de 400 palavras por resposta. Não use markdown excessivo. ` +
              `O usuário que está falando com você se chama ${username}.`,
          },
          {
            role: 'user',
            content: userMessage,
          },
        ],
        max_tokens: 500,
        temperature: 0.8,
      });

      return (
        completion.choices[0]?.message?.content?.trim() ??
        'Eita, não consegui processar sua mensagem agora. Tenta de novo!'
      );
    } catch (err: any) {
      if (err?.status === 429)
        return '⏳ Estou sobrecarregado agora! Tenta novamente em alguns segundos.';
      if (err?.status === 401)
        return '🔑 Chave da API não configurada corretamente. Avise um admin do bot!';
      console.error('[Bryan IA] Erro:', err);
      return '❌ Ocorreu um erro ao processar sua mensagem. Tenta novamente!';
    }
    }
    