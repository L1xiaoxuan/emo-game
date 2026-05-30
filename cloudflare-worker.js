export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, {
      headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' }
    });
    try {
      const { messages, system } = await request.json();
      const r = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + env.ZHIPU_API_KEY },
        body: JSON.stringify({ model: 'glm-4-flash', max_tokens: 12, temperature: 0.6, messages: [{ role: 'system', content: system }, ...messages] }),
      });
      const d = await r.json();
      return new Response(JSON.stringify({ reply: d.choices?.[0]?.message?.content || '' }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
  }
};
