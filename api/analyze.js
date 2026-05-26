// 干个活儿 — 规则引擎API（Vercel Serverless Function）
// 核心算法藏到后端，前端不可见，构建技术壁垒

// ===== INPUT SANITIZATION =====
function sanitize(str, maxLen) {
  if (!str || typeof str !== 'string') return '';
  return str.replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s\-_,.()（）、。，；：！？【】《》""''·@#+\u2014\u2013\u2026\u00b7]/g, '').trim().substring(0, maxLen || 100);
}

function clamp(val, min, max, fallback) {
  const n = parseInt(val);
  return isNaN(n) ? fallback : Math.min(Math.max(n, min), max);
}

// ===== WUXING CALCULATION =====
function calcWuxing(year, month) {
  const earthly = (year - 4) % 12;
  const heavenly = (year - 4) % 10;

  const base = { mu: 20, huo: 20, tu: 20, jin: 20, shui: 20 };
  const keys = ['mu', 'huo', 'tu', 'jin', 'shui'];
  const yearMod = heavenly % 5;
  base[keys[yearMod]] += 25;
  base[keys[(yearMod + 2) % 5]] += 10;
  const mMod = Math.round((month || 1) / 3) % 5;
  base[keys[mMod]] += 8;

  const total = Object.values(base).reduce((a, b) => a + b, 0);
  const pct = {};
  keys.forEach(k => { pct[k] = Math.round(base[k] / total * 100); });

  const dominant = keys.reduce((a, b) => pct[a] > pct[b] ? a : b);
  const names = { mu: '木', huo: '火', tu: '土', jin: '金', shui: '水' };

  return {
    mu: pct.mu, huo: pct.huo, tu: pct.tu, jin: pct.jin, shui: pct.shui,
    dominant: names[dominant],
    dominantKey: dominant
  };
}

// ===== CORE RULE ENGINE =====
function analyze(data) {
  const inds = [
    { name: '🤖 互联网/科技', key: 'tech', base: 60, icon: '🤖', wuxing: '火', trend: '高速增长', desc: 'AI、云计算、软件开发持续扩张' },
    { name: '📚 教育培训', key: 'edu', base: 55, icon: '📚', wuxing: '木', trend: '稳定需求', desc: 'K12到成人教育，需求刚性' },
    { name: '💰 金融/理财', key: 'finance', base: 50, icon: '💰', wuxing: '金', trend: '专业门槛高', desc: '银行、证券、保险理财' },
    { name: '🏥 医疗健康', key: 'health', base: 58, icon: '🏥', wuxing: '木', trend: '长期刚需', desc: '老龄化社会推动持续增长' },
    { name: '📣 内容/传媒', key: 'media', base: 52, icon: '📣', wuxing: '火', trend: '个人品牌机会', desc: '短视频、公众号、直播带货' },
    { name: '🛒 电商/零售', key: 'ecom', base: 48, icon: '🛒', wuxing: '水', trend: '竞争激烈但入门低', desc: '平台电商、社区团购、跨境' },
    { name: '🏗️ 建筑/房产', key: 'const', base: 45, icon: '🏗️', wuxing: '土', trend: '周期性强', desc: '新型城镇化与旧改进展中' },
    { name: '⚖️ 法律/咨询', key: 'law', base: 50, icon: '⚖️', wuxing: '金', trend: '专业高壁垒', desc: '律师、管理咨询、HR顾问' },
    { name: '🍜 餐饮/服务', key: 'food', base: 42, icon: '🍜', wuxing: '水', trend: '低启动成本', desc: '小吃、外卖、社区餐饮' },
    { name: '🚚 物流/运营', key: 'logistics', base: 44, icon: '🚚', wuxing: '水', trend: '稳定但难突破', desc: '快递、供应链、仓储管理' },
    { name: '🎨 设计/创意', key: 'design', base: 50, icon: '🎨', wuxing: '火', trend: '自由职业机会大', desc: 'UI设计、品牌策划、摄影' },
    { name: '🌾 农业/新农村', key: 'agri', base: 38, icon: '🌾', wuxing: '土', trend: '政策红利期', desc: '智慧农业、乡村旅游、特产' },
  ];

  const { skills, certs, priorities, city, age, years, capital, risk, status } = data;

  inds.forEach(ind => {
    let s = ind.base;

    // Skill matching
    if (ind.key === 'tech' && (skills.tech.includes('编程开发') || skills.tech.includes('数据分析'))) s += 20;
    if (ind.key === 'edu' && (skills.tech.includes('教育/培训') || skills.soft.includes('擅长教学'))) s += 22;
    if (ind.key === 'finance' && (skills.tech.includes('财会/审计') || certs.includes('注册会计师CPA'))) s += 25;
    if (ind.key === 'health' && (skills.tech.includes('医疗/护理') || certs.includes('医师执照'))) s += 28;
    if (ind.key === 'media' && (skills.tech.includes('自媒体运营') || skills.tech.includes('视频剪辑') || skills.soft.includes('善于写作'))) s += 18;
    if (ind.key === 'law' && (skills.tech.includes('法律/合规') || certs.includes('律师资格证'))) s += 30;
    if (ind.key === 'design' && skills.tech.includes('设计（UI/平面）')) s += 22;
    if (ind.key === 'ecom' && skills.tech.includes('销售/BD')) s += 15;
    if (ind.key === 'ecom' && skills.tech.includes('市场营销')) s += 12;

    // Experience
    if (years >= 5) s += 10;
    if (years >= 10) s += 15;

    // Capital
    if (capital >= 10 && ['ecom', 'food', 'agri'].includes(ind.key)) s += 12;
    if (capital === 0 && ['tech', 'edu', 'media', 'design'].includes(ind.key)) s += 8;

    // Risk
    if (risk === 'high' && ['ecom', 'food', 'media', 'agri'].includes(ind.key)) s += 10;
    if (risk === 'low' && ['edu', 'health', 'law', 'finance'].includes(ind.key)) s += 8;

    // Status
    if (status === 'startup' && ['ecom', 'food', 'media', 'agri'].includes(ind.key)) s += 10;
    if (status === 'unemployed' && capital === 0 && ['edu', 'tech', 'media'].includes(ind.key)) s += 8;

    // Priorities
    if (priorities.includes('薪资高') && ['tech', 'finance', 'law'].includes(ind.key)) s += 8;
    if (priorities.includes('时间自由') && ['media', 'design', 'edu'].includes(ind.key)) s += 8;
    if (priorities.includes('稳定安全') && ['edu', 'health', 'law'].includes(ind.key)) s += 8;

    // Age bias
    if (age > 35 && ['edu', 'health', 'law', 'finance'].includes(ind.key)) s += 5;
    if (age < 28 && ['tech', 'media', 'design'].includes(ind.key)) s += 5;

    // Soft skills
    if (skills.soft.includes('沟通表达强') && ['edu', 'law', 'media'].includes(ind.key)) s += 5;
    if (skills.soft.includes('创意思维') && ['media', 'design', 'tech'].includes(ind.key)) s += 5;

    // City bonus
    if (city === '哈尔滨' && ['food', 'logistics', 'agri', 'edu'].includes(ind.key)) s += 4;

    ind.score = Math.min(s, 99);
  });

  // Wuxing overlay
  const wx = calcWuxing(data.birthYear, data.birthMonth);
  inds.forEach(ind => {
    if (ind.wuxing === wx.dominant) {
      ind.score = Math.min(ind.score + 6, 99);
      ind.wx_match = true;
    }
  });

  inds.sort((a, b) => b.score - a.score);

  // Generate advice
  const top1 = inds[0].name.replace(/[^\u4e00-\u9fa5/a-zA-Z]/g, '');
  const advice = [
    { icon: '🔎', title: '本周做这1件事', text: `搜索"${city} ${top1} 招聘"，看3-5个真实JD，对照自己的缺口在哪。` },
    { icon: '📄', title: '优化你的简历', text: `针对${top1}方向，把你的经历重新组织，突出与它相关的3个成就。` },
    { icon: '🤝', title: '建立行业连接', text: `加入${top1}相关的群/论坛，先观察再提问，找到1个愿意帮你的人比刷100个岗位有用。` },
    { icon: '📈', title: '补充核心技能', text: `${data.years < 2 ? '工作年限不长，先选一个方向深耕，别什么都学' : '有经验基础，可以补1-2个证书增强竞争力'}。` },
  ];

  const wxAdviceMap = {
    '木': '你的五行偏木，教育、健康、文化行业是你的顺风赛道。耐心培育、长线经营是你的优势。',
    '火': '五行偏火，科技、传媒、创意行业能点燃你的能量。你适合需要激情和创造力的岗位。',
    '土': '五行偏土，建筑、农业、管理类行业能让你稳中求胜。你天生有耐力和执行力。',
    '金': '五行偏金，金融、法律、精密制造是你的强项。规则感强、擅长谈判是你的标签。',
    '水': '五行偏水，物流、餐饮、贸易行业流动性强，符合你灵活应变的特质。',
  };

  return {
    success: true,
    timestamp: Date.now(),
    totalMatchScore: inds[0].score,
    industries: inds.map(ind => ({
      name: ind.name,
      key: ind.key,
      score: ind.score,
      icon: ind.icon,
      wuxing: ind.wuxing,
      trend: ind.trend,
      desc: ind.desc,
      wx_match: ind.wx_match || false
    })),
    wuxing: {
      mu: wx.mu,
      huo: wx.huo,
      tu: wx.tu,
      jin: wx.jin,
      shui: wx.shui,
      dominant: wx.dominant,
      dominantKey: wx.dominantKey,
      advice: wxAdviceMap[wx.dominant] || '五行平衡，适应能力强，多个行业都有发展空间。'
    },
    advice: advice
  };
}

// ===== VERCEl SERVERLESS HANDLER =====
export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: '仅支持POST请求' });
  }

  try {
    const body = req.body || {};

    // Sanitize and validate
    const data = {
      name: sanitize(body.name, 30) || '你',
      age: clamp(body.age, 16, 80, 25),
      city: sanitize(body.city, 50) || '未知城市',
      edu: sanitize(body.edu, 20) || '本科',
      years: clamp(body.years, 0, 50, 0),
      salary: clamp(body.salary, 1, 200, 10),
      capital: clamp(body.capital, 0, 500, 1),
      birthYear: clamp(body.birthYear, 1940, 2010, 1995),
      birthMonth: clamp(body.birthMonth, 1, 12, 6),
      status: ['graduate', 'jobless', 'unemployed', 'startup'].includes(body.status) ? body.status : 'graduate',
      risk: ['low', 'mid', 'high'].includes(body.risk) ? body.risk : 'mid',
      skills: {
        tech: Array.isArray(body.skills?.tech) ? body.skills.tech.map(s => sanitize(s, 30)).filter(Boolean) : [],
        soft: Array.isArray(body.skills?.soft) ? body.skills.soft.map(s => sanitize(s, 30)).filter(Boolean) : []
      },
      certs: Array.isArray(body.certs) ? body.certs.map(c => sanitize(c, 30)).filter(Boolean) : [],
      priorities: Array.isArray(body.priorities) ? body.priorities.map(p => sanitize(p, 20)).filter(Boolean) : []
    };

    const result = analyze(data);

    // Cache for 10 minutes (immutable analysis for same input)
    res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    return res.status(200).json(result);

  } catch (err) {
    console.error('Analysis error:', err.message);
    return res.status(500).json({
      success: false,
      error: '分析服务暂时不可用，请稍后重试'
    });
  }
}
