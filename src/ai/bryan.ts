import OpenAI from 'openai';

    let openaiClient: OpenAI | null = null;

    function getOpenAI(): OpenAI {
    if (!openaiClient) {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) throw new Error('OPENAI_API_KEY nao configurada.');
      openaiClient = new OpenAI({ apiKey });
    }
    return openaiClient;
    }

    /**
    * Pergunta ao Bryan (ChatGPT) e retorna a resposta como string.
    * @param userMessage  Mensagem do usuario (sem o "Bryan, " do inicio)
    * @param username     Display name do usuario que chamou o Bryan
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
              'Voce e Bryan, o assistente inteligente e animado da Alianca Skyline — ' +
              'uma alianca de servidores do Discord cujo objetivo e unir comunidades para crescerem juntas. ' +
              'Voce ajuda membros com duvidas sobre a alianca, o bot e o Discord em geral. ' +
              'Fale sempre em portugues do Brasil. Use linguagem jovem e descontraida (girias leves sao ok). ' +
              'Seja conciso: maximo de 400 palavras por resposta. Nao use markdown excessivo. ' +
              `O usuario que esta falando com voce se chama ${username}.`,
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
        'Eita, nao consegui processar sua mensagem agora. Tenta de novo!'
      );
    } catch (err: unknown) {
      const e = err as { status?: number; message?: string };
      if (e?.status === 429)
        return '⏳ Estou sobrecarregado agora! Tenta novamente em alguns segundos.';
      if (e?.status === 401)
        return '🔑 Chave da API nao configurada corretamente. Avise um admin do bot!';
      console.error('[Bryan IA] Erro:', err);
      return '❌ Ocorreu um erro ao processar sua mensagem. Tenta novamente!';
    }
    }
    