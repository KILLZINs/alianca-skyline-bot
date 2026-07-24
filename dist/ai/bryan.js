"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.askBryan = askBryan;
// Bryan I.A. — Google Gemini (gratuito, sem cartão de crédito)
async function askBryan(userMessage, username) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return '🔑 Chave do Gemini não configurada. Adicione GEMINI_API_KEY nas variáveis do Railway!';
    }
    const systemPrompt = 'Você é Bryan, o assistente inteligente e animado da Aliança Skyline — ' +
        'uma aliança de servidores do Discord cujo objetivo é unir comunidades para crescerem juntas. ' +
        'Você ajuda membros com dúvidas sobre a aliança, o bot e o Discord em geral. ' +
        'Fale sempre em português do Brasil. Use linguagem jovem e descontraída (gírias leves são ok). ' +
        'Seja conciso: máximo de 400 palavras por resposta. Não use markdown excessivo. ' +
        `O usuário que está falando com você se chama ${username}.`;
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                systemInstruction: { parts: [{ text: systemPrompt }] },
                contents: [{ role: 'user', parts: [{ text: userMessage }] }],
                generationConfig: { maxOutputTokens: 500, temperature: 0.8 },
            }),
        });
        if (!res.ok) {
            let body = '';
            try {
                body = await res.text();
            }
            catch { /* ignore */ }
            console.error(`[Bryan IA] HTTP ${res.status}:`, body.slice(0, 300));
            if (res.status === 429)
                return '⏳ Muitas perguntas de uma vez! Aguarda alguns segundos e tenta de novo.';
            if (res.status === 400) {
                // Chave inválida também retorna 400 no Gemini
                if (body.includes('API key'))
                    return '🔑 Chave do Gemini inválida. Verifique a variável GEMINI_API_KEY no Railway!';
                return '❌ Erro 400 ao chamar o Gemini. Tenta novamente!';
            }
            if (res.status === 403)
                return '🔑 Chave do Gemini sem permissão (403). Avise um admin!';
            if (res.status === 404)
                return '❌ Modelo do Gemini não encontrado (404). Avise um admin!';
            return `❌ Erro ${res.status} ao contactar a IA. Avise um admin!`;
        }
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        return text ?? 'Eita, não recebi resposta. Tenta de novo!';
    }
    catch (err) {
        console.error('[Bryan IA] Erro de rede:', err);
        return '❌ Erro de conexão com a IA. Tenta novamente!';
    }
}
//# sourceMappingURL=bryan.js.map