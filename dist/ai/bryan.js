"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.askBryan = askBryan;
// Bryan I.A. — Google Gemini (gratuito, sem cartão de crédito)
async function askBryan(userMessage, username) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return '🔑 Chave do Gemini não configurada. Peça a um admin para adicionar GEMINI_API_KEY nas variáveis do Railway!';
    }
    const systemPrompt = 'Você é Bryan, o assistente inteligente e animado da Aliança Skyline — ' +
        'uma aliança de servidores do Discord cujo objetivo é unir comunidades para crescerem juntas. ' +
        'Você ajuda membros com dúvidas sobre a aliança, o bot e o Discord em geral. ' +
        'Fale sempre em português do Brasil. Use linguagem jovem e descontraída (gírias leves são ok). ' +
        'Seja conciso: máximo de 400 palavras por resposta. Não use markdown excessivo. ' +
        `O usuário que está falando com você se chama ${username}.`;
    try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                systemInstruction: { parts: [{ text: systemPrompt }] },
                contents: [{ role: 'user', parts: [{ text: userMessage }] }],
                generationConfig: { maxOutputTokens: 500, temperature: 0.8 },
            }),
        });
        if (res.status === 429)
            return '⏳ Muitas perguntas de uma vez! Aguarda alguns segundos e tenta de novo.';
        if (res.status === 400)
            return '❌ Mensagem inválida. Tenta reformular!';
        if (res.status === 403)
            return '🔑 Chave do Gemini inválida ou sem permissão. Avise um admin!';
        if (!res.ok) {
            console.error('[Bryan IA] HTTP', res.status);
            return '❌ Erro ao contactar a IA. Tenta novamente!';
        }
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        return text ?? 'Eita, não recebi resposta. Tenta de novo!';
    }
    catch (err) {
        console.error('[Bryan IA] Erro:', err);
        return '❌ Ocorreu um erro ao processar sua mensagem. Tenta novamente!';
    }
}
//# sourceMappingURL=bryan.js.map