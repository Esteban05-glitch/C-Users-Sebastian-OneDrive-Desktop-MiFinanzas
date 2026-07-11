module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método no permitido' });
    return;
  }

  const { prompt, expenses = [], budget = 0 } = req.body || {};
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!prompt) {
    res.status(400).json({ error: 'Debes enviar una pregunta.' });
    return;
  }

  if (!apiKey) {
    res.status(500).json({ error: 'La clave de OpenRouter no está configurada.' });
    return;
  }

  const totalSpent = expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  const remaining = Number(budget || 0) - totalSpent;

  const categories = {};
  expenses.forEach((expense) => {
    const category = expense.category || 'General';
    categories[category] = (categories[category] || 0) + Number(expense.amount || 0);
  });

  const categorySummary = Object.entries(categories)
    .map(([name, amount]) => `${name}: $${Number(amount).toFixed(2)}`)
    .join('; ');

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000',
      'X-Title': 'Gestor de Finanzas Personales'
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Eres un asistente financiero útil y claro. Responde en español, de forma breve y práctica. Usa datos del usuario para dar consejos concretos.'
        },
        {
          role: 'user',
          content: `Mi presupuesto es $${Number(budget || 0).toFixed(2)}. He gastado $${totalSpent.toFixed(2)} y me quedan $${remaining.toFixed(2)}. Mis gastos por categoría son: ${categorySummary || 'sin datos'}. Pregunta del usuario: ${prompt}`
        }
      ]
    })
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    res.status(response.status).json({ error: data.error?.message || 'No se pudo contactar con OpenRouter.' });
    return;
  }

  const reply = data.choices?.[0]?.message?.content || 'No pude generar una respuesta.';
  res.status(200).json({ reply });
};
