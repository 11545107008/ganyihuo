/* ============================================
   api.js — 后端API调用 + AI调用
   ============================================ */

async function callBackendAPI(mode, data) {
  try {
    const resp = await fetch(apiConfig.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode, data: anonymizeData(data) })
    });
    if (!resp.ok) throw new Error('API error: ' + resp.status);
    return await resp.json();
  } catch(e) {
    console.warn('Backend API failed:', e.message);
    return null;
  }
}

async function callAI(provider, prompt) {
  const cfg = MODEL_CONFIG[provider];
  if (!cfg) throw new Error('Unknown AI provider');

  const resp = await fetch(cfg.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + aiConfig.apiKey
    },
    body: JSON.stringify({
      model: cfg.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: aiConfig.temperature,
      max_tokens: 2000
    })
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error('AI API error: ' + resp.status + ' ' + err.slice(0, 200));
  }

  const result = await resp.json();
  return result.choices?.[0]?.message?.content || '';
}

// --- 加载JSON数据 ---
async function loadJSON(path) {
  try {
    const resp = await fetch(path);
    if (!resp.ok) throw new Error('Failed to load: ' + path);
    return await resp.json();
  } catch(e) {
    console.warn('Failed to load JSON:', path, e.message);
    return null;
  }
}
