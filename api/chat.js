export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const API_KEY = process.env.ZHIPU_API_KEY;
  if (!API_KEY) return res.status(500).json({ error: 'API Key not configured' });

  try {
    const { messages, system } = req.body;
    const aiRes = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + API_KEY,
      },
      body: JSON.stringify({
        model: 'glm-4-flash',
        max_tokens: 60,
        temperature: 0.6,
        messages: [{ role: 'system', content: system }, ...messages],
      }),
    });

    const data = await aiRes.json();
    if (data.error) return res.status(500).json({ error: data.error.message });
    res.json({ reply: data.choices?.[0]?.message?.content || '' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
