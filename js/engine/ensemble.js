/* ============================================
   ensemble.js — 综合评分引擎（三模型加权融合）
   ============================================ */

function computeEnsemble() {
  const results = AppState.results;
  const w = AppState.weights;

  const combined = {};

  // 汇总所有行业的各模型分数
  for (const model of ['skills', 'personality', 'fortune']) {
    const modelResult = results[model];
    if (!modelResult) continue;
    for (const item of modelResult.results) {
      if (!combined[item.key]) {
        combined[item.key] = {
          key: item.key,
          name: item.name || INDUSTRY_LIST.find(i=>i.key===item.key)?.name || item.key,
          icon: item.icon || '',
          wuxing: item.wuxing || '',
          skillsScore: 0,
          personalityScore: 0,
          fortuneScore: 0,
          count: 0
        };
      }
      combined[item.key][model + 'Score'] = item.score;
      combined[item.key].count++;
    }
  }

  // 加权计算
  const finalResults = Object.values(combined).map(item => {
    const sCount = results.skills ? 1 : 0;
    const pCount = results.personality ? 1 : 0;
    const fCount = results.fortune ? 1 : 0;
    const totalCount = sCount + pCount + fCount;

    // 动态调整权重（如果某个模型没做，按比例重新分配）
    const ws = sCount ? w.skills / (w.skills * sCount + w.personality * pCount + w.fortune * fCount) : 0;
    const wp = pCount ? w.personality / (w.skills * sCount + w.personality * pCount + w.fortune * fCount) : 0;
    const wf = fCount ? w.fortune / (w.skills * sCount + w.personality * pCount + w.fortune * fCount) : 0;

    const finalScore = Math.round(
      (item.skillsScore * ws + item.personalityScore * wp + item.fortuneScore * wf) * 100
    );

    return { ...item, score: Math.min(99, finalScore) };
  });

  finalResults.sort((a, b) => b.score - a.score);
  AppState._ensemble = { results: finalResults, updated: new Date().toISOString() };
  return AppState._ensemble;
}

function getEnsembleResults() {
  if (!AppState._ensemble) computeEnsemble();
  return AppState._ensemble.results;
}

// 保存用户选择的权重
function setWeightPreset(preset) {
  AppState.weights = WEIGHT_PRESETS[preset];
  saveState();
  computeEnsemble();
  if (typeof renderResult === 'function') renderResult();
}
