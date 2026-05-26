/* ============================================
   skills.js — 模型A: 能力适配引擎
   ============================================ */

const INDUSTRIES_DATA = null; // 将由 industries.json 加载
let industriesLoaded = false;

async function loadIndustries() {
  if (industriesLoaded) return;
  const data = await loadJSON('data/industries.json');
  if (data) {
    window._industriesData = data.industries;
    industriesLoaded = true;
  }
}

function getIndustries() {
  return window._industriesData || {};
}

// --- 核心评分算法 ---
function computeSkillsResult(formData) {
  const industries = getIndustries();
  const results = [];

  for (const [key, ind] of Object.entries(industries)) {
    let score = ind.baseScore;

    // 1. 技能匹配 (权重 × 1.5，最高)
    const skillOverlap = (formData.skills || []).filter(s => (ind.skills||[]).includes(s)).length;
    score += skillOverlap * 8 * 1.5;

    // 2. 软技能匹配
    const softOverlap = (formData.softSkills || []).filter(s => (ind.softSkills||[]).includes(s)).length;
    score += softOverlap * 5;

    // 3. 经验加成
    const exp = formData.experience || 0;
    if (exp >= 10) score += 12;
    else if (exp >= 5) score += 8;
    else if (exp >= 3) score += 5;
    else if (exp >= 1) score += 3;

    // 4. 资金匹配
    const capital = formData.capital || '0';
    if ((capital === '20+' || capital === '5-20') && ['food','agri','const','ecom'].includes(key)) score += 8;
    if (capital === '0' && ['tech','edu','media','design','law'].includes(key)) score += 6;

    // 5. 风险适配
    const risk = formData.risk || 'mid';
    const highRiskInd = ['ecom','food','tech','media'];
    const lowRiskInd = ['edu','health','law','finance','agri'];
    if (risk === 'high' && highRiskInd.includes(key)) score += 8;
    if (risk === 'low' && lowRiskInd.includes(key)) score += 8;

    // 6. 收入期望匹配
    const income = formData.income || 5;
    if (['tech','finance','law','health'].includes(key) && income > 10) score += 6;
    if (['food','logistics','agri','edu'].includes(key) && income < 8) score += 4;

    // 7. 时间投入匹配
    const time = formData.time || 'fulltime';
    if (time === 'parttime' && ['logistics','food','edu','media','ecom'].includes(key)) score += 6;
    if (time === 'fragment' && ['media','design','ecom','edu'].includes(key)) score += 8;

    // 8. 城市加成
    if (formData.city === '哈尔滨' && ['food','logistics','agri','edu','ecom','tech'].includes(key)) score += 3;

    // 9. 价值观
    const vals = formData.values || [];
    if (vals.includes('薪资高') && ['tech','finance','law'].includes(key)) score += 5;
    if (vals.includes('时间自由') && ['media','design','ecom'].includes(key)) score += 5;
    if (vals.includes('稳定安全') && ['edu','health','law','agri'].includes(key)) score += 4;

    // 10. 当前状态
    const status = formData.status || '';
    if (status === '在校学生' && ['tech','media','edu','design'].includes(key)) score += 5;
    if (status === '待业找工作' && ['tech','ecom','logistics','food'].includes(key)) score += 5;
    if (status === '创业中' && ['ecom','food','media','agri'].includes(key)) score += 8;

    score = Math.min(99, Math.round(score));

    // 生成每个类型的推荐
    const recommendations = {
      fulltime: getTopRoles(ind.fulltime?.roles || [], formData, ind),
      parttime: getTopRoles(ind.parttime?.roles || [], formData, ind),
      sidehustle: getTopRoles(ind.sidehustle?.roles || [], formData, ind),
      startup: getTopRoles(ind.startup?.roles || [], formData, ind)
    };

    results.push({ key, name: ind.name, icon: ind.icon, wuxing: ind.wuxing, score,
      fulltime: ind.fulltime, parttime: ind.parttime, sidehustle: ind.sidehustle, startup: ind.startup,
      recommendations
    });
  }

  results.sort((a, b) => b.score - a.score);
  return { model: 'skills', results };
}

function getTopRoles(roles, formData, industry, count = 3) {
  return roles.slice(0, Math.min(count, roles.length));
}
