/* ============================================
   personality.js — 模型B: 霍兰德RIASEC性格适配引擎
   ============================================ */

// RIASEC 各类型的典型职业方向映射
const RIASEC_CAREER_MAP = {
  R: ['tech','const','logistics','agri'],
  I: ['tech','health','finance','law'],
  A: ['media','design','edu'],
  S: ['edu','health','law','food'],
  E: ['ecom','media','finance','food'],
  C: ['finance','law','logistics']
};

// 每个行业对应的RIASEC理想向量（6维，每维0-100）
const RIASEC_INDUSTRY_VECTORS = {
  tech: {R:30,I:90,A:40,S:20,E:40,C:35},
  health: {R:45,I:75,A:20,S:85,E:25,C:50},
  edu: {R:20,I:45,A:40,S:90,E:30,C:45},
  media: {R:20,I:30,A:95,S:55,E:60,C:20},
  finance: {R:20,I:60,A:15,S:25,E:70,C:85},
  law: {R:20,I:70,A:15,S:40,E:55,C:75},
  design: {R:40,I:30,A:95,S:25,E:45,C:30},
  ecom: {R:30,I:40,A:40,S:50,E:85,C:45},
  const: {R:80,I:35,A:30,S:20,E:55,C:60},
  logistics: {R:65,I:25,A:15,S:25,E:50,C:55},
  food: {R:55,I:15,A:35,S:60,E:55,C:40},
  agri: {R:75,I:30,A:20,S:35,E:35,C:40}
};

// MBTI-行业修正矩阵
const MBTI_INDUSTRY_BONUS = {
  tech: { bonus: { INTJ: 8, INTP: 8, ISTJ: 5 } },
  health: { bonus: { ISFJ: 8, INFJ: 6, ISTJ: 5 } },
  edu: { bonus: { ENFJ: 8, ESFJ: 8, INFJ: 6 } },
  media: { bonus: { ENFP: 10, ENTP: 8, ESFP: 6 } },
  finance: { bonus: { ISTJ: 8, INTJ: 8, ESTJ: 6 } },
  law: { bonus: { INTJ: 8, ISTJ: 8, ENTJ: 6 } },
  design: { bonus: { INFP: 10, ISFP: 8, ENFP: 6 } },
  ecom: { bonus: { ESTP: 8, ENTP: 8, ENTJ: 6 } },
  const: { bonus: { ISTJ: 8, ESTJ: 8, ISTP: 5 } },
  logistics: { bonus: { ISTJ: 8, ESTJ: 8, ISTP: 6 } },
  food: { bonus: { ESFJ: 8, ISFJ: 6, ESFP: 6 } },
  agri: { bonus: { ISTJ: 6, ISFJ: 6, ISTP: 5 } }
};

function computePersonalityResult(formData) {
  const riasecData = formData.riasec || {};
  const mbtiData = formData.mbti || {};

  // 1. 计算RIASEC各维度得分
  const scores = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
  const questions = typeof RIASEC_QUESTIONS !== 'undefined' ? RIASEC_QUESTIONS : [];
  questions.forEach((q, i) => {
    const val = riasecData[i] || 0;
    scores[q.type] = (scores[q.type] || 0) + val;
  });

  // 归一化到0-100
  const maxPerType = 3 * 5; // 3题 × 最高5分
  for (const k in scores) {
    scores[k] = Math.round((scores[k] / maxPerType) * 100);
  }

  // 2. 计算3字母霍兰德代码
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const hollandCode = sorted.slice(0, 3).map(e => e[0]).join('');

  // 3. 计算MBTI类型
  const mbtiType = [
    mbtiData.EI === 'E' ? 'E' : 'I',
    mbtiData.SN === 'S' ? 'S' : 'N',
    mbtiData.TF === 'T' ? 'T' : 'F',
    mbtiData.JP === 'J' ? 'J' : 'P'
  ].join('');

  // 4. 行业匹配 - 余弦相似度 + MBTI修正
  const results = [];
  for (const [key, vec] of Object.entries(RIASEC_INDUSTRY_VECTORS)) {
    let similarity = cosineSimilarity(scores, vec);

    // MBTI修正
    const mbtiBonuses = MBTI_INDUSTRY_BONUS[key]?.bonus || {};
    similarity += (mbtiBonuses[mbtiType] || 0) * 0.5;

    const industryInfo = INDUSTRY_LIST.find(i => i.key === key) || {};
    const score = Math.min(99, Math.round(similarity));
    results.push({ key, name: industryInfo.name || key, icon: industryInfo.icon || '', wuxing: industryInfo.wuxing || '', score });
  }

  results.sort((a, b) => b.score - a.score);

  // 5. 性格解读
  const interpretation = generateHollandInterpretation(scores, hollandCode);

  return {
    model: 'personality',
    results,
    riasec: scores,
    hollandCode,
    mbtiType,
    interpretation,
    rawScores: sorted
  };
}

function cosineSimilarity(a, b) {
  let dot = 0, magA = 0, magB = 0;
  for (const k in a) {
    dot += (a[k] || 0) * (b[k] || 0);
    magA += (a[k] || 0) * (a[k] || 0);
    magB += (b[k] || 0) * (b[k] || 0);
  }
  if (magA === 0 || magB === 0) return 0;
  return (dot / (Math.sqrt(magA) * Math.sqrt(magB))) * 100;
}

function generateHollandInterpretation(scores, code) {
  const typeNames = {R:'现实型',I:'研究型',A:'艺术型',S:'社会型',E:'企业型',C:'常规型'};
  const typeDescs = {
    R: '动手操作能力强，喜欢具体、实际的任务',
    I: '善于分析和研究，对科学和理论充满好奇',
    A: '富有想象力和创造力，追求美感和表达',
    S: '乐于助人，善于沟通和与人合作',
    E: '具有领导力和说服力，喜欢挑战和成就',
    C: '做事规范细致，追求准确和秩序'
  };
  const topName = typeNames[code[0]] || '';
  const topDesc = typeDescs[code[0]] || '';
  return {
    summary: `你的主导类型是${topName}（${code}），${topDesc}`,
    code
  };
}
