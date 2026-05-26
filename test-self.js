// 干个活儿 — 自测脚本：用老大的真实数据跑一遍
// Node.js 环境运行

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
  keys.forEach(k => pct[k] = Math.round(base[k] / total * 100));
  const dominant = keys[yearMod];
  const wxNameMap = { mu: '木', huo: '火', tu: '土', jin: '金', shui: '水' };
  return { ...pct, dominant: wxNameMap[dominant], dominantKey: dominant };
}

// ===== RULE ENGINE =====
function runRuleEngine(data) {
  const { age, city, edu, years, salary, status, capital, risk, skills, certs, priorities } = data;

  const industries = [
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

  const scoreLog = []; // 记录每个行业的加分明细

  industries.forEach(ind => {
    let score = ind.base;
    const log = [`基础分: ${score}`];

    // 技能匹配
    if (ind.key === 'tech' && (skills.tech.includes('编程开发') || skills.tech.includes('数据分析'))) { score += 20; log.push('+20 编程/数据技能'); }
    if (ind.key === 'edu' && (skills.tech.includes('教育/培训') || skills.soft.includes('擅长教学'))) { score += 22; log.push('+22 教育/教学技能'); }
    if (ind.key === 'finance' && (skills.tech.includes('财会/审计') || certs.includes('注册会计师CPA'))) { score += 25; log.push('+25 财会/CPA'); }
    if (ind.key === 'health' && (skills.tech.includes('医疗/护理') || certs.includes('医师执照'))) { score += 28; log.push('+28 医疗/医师'); }
    if (ind.key === 'media' && (skills.tech.includes('自媒体运营') || skills.tech.includes('视频剪辑') || skills.soft.includes('善于写作'))) { score += 18; log.push('+18 自媒体/剪辑/写作技能'); }
    if (ind.key === 'law' && (skills.tech.includes('法律/合规') || certs.includes('律师资格证'))) { score += 30; log.push('+30 法律/律师'); }
    if (ind.key === 'design' && skills.tech.includes('设计（UI/平面）')) { score += 22; log.push('+22 设计技能'); }
    if (ind.key === 'ecom' && skills.tech.includes('销售/BD')) { score += 15; log.push('+15 销售技能'); }
    if (ind.key === 'ecom' && skills.tech.includes('市场营销')) { score += 12; log.push('+12 市场营销'); }

    // 工作年限
    if (years >= 5) { score += 10; log.push('+10 5年以上经验'); }
    if (years >= 10) { score += 15; log.push('+15 10年以上经验'); }

    // 资金
    if (capital >= 10 && ['ecom', 'food', 'agri'].includes(ind.key)) { score += 12; log.push('+12 资金充足(创业}'); }
    if (capital === 0 && ['tech', 'edu', 'media', 'design'].includes(ind.key)) { score += 8; log.push('+8 低资金友好'); }

    // 风险偏好
    if (risk === 'high' && ['ecom', 'food', 'media', 'agri'].includes(ind.key)) { score += 10; log.push('+10 高风险偏好'); }
    if (risk === 'low' && ['edu', 'health', 'law', 'finance'].includes(ind.key)) { score += 8; log.push('+8 低风险偏好'); }

    // 身份匹配
    if (status === 'startup' && ['ecom', 'food', 'media', 'agri'].includes(ind.key)) { score += 10; log.push('+10 创业身份匹配'); }
    if (status === 'unemployed' && capital === 0 && ['edu', 'tech', 'media'].includes(ind.key)) { score += 8; log.push('+8 待业转型友好'); }

    // 优先级
    if (priorities.includes('薪资高') && ['tech', 'finance', 'law'].includes(ind.key)) { score += 8; log.push('+8 薪资高偏好'); }
    if (priorities.includes('时间自由') && ['media', 'design', 'edu'].includes(ind.key)) { score += 8; log.push('+8 时间自由偏好'); }
    if (priorities.includes('稳定安全') && ['edu', 'health', 'law'].includes(ind.key)) { score += 8; log.push('+8 稳定偏好'); }

    // 年龄
    if (age > 35 && ['edu', 'health', 'law', 'finance'].includes(ind.key)) { score += 5; log.push('+5 35岁以上经验加成'); }
    if (age < 28 && ['tech', 'media', 'design'].includes(ind.key)) { score += 5; log.push('+5 年轻活力加成'); }

    // 软技能
    if (skills.soft.includes('沟通表达强') && ['edu', 'law', 'media'].includes(ind.key)) { score += 5; log.push('+5 沟通表达'); }
    if (skills.soft.includes('创意思维') && ['media', 'design', 'tech'].includes(ind.key)) { score += 5; log.push('+5 创意思维'); }

    // 城市适配
    if (city === '哈尔滨' && ['food', 'logistics', 'agri', 'edu'].includes(ind.key)) { score += 4; log.push('+4 哈尔滨本地适配'); }

    ind.score = Math.min(score, 99);
    ind.scoreLog = log;
  });

  // 五行加成
  const wx = calcWuxing(data.birthYear, data.birthMonth);
  industries.forEach(ind => {
    if (ind.wuxing === wx.dominant) {
      ind.score = Math.min(ind.score + 6, 99);
      ind.scoreLog.push(`+6 五行${wx.dominant}命加成`);
      ind.wx_match = true;
    }
  });

  industries.sort((a, b) => b.score - a.score);
  industries.forEach(ind => { ind.wx_data = wx; });

  return { industries, wuxing: wx };
}

// ===== 老大的真实数据 =====
const data = {
  name: '老大（东海先生）',
  age: 28,
  city: '哈尔滨',
  edu: '本科',
  years: 5,
  salary: 15,
  status: 'startup',  // 创业探索者
  capital: 3,          // 1-5万
  risk: 'high',        // 高风险偏好
  skills: {
    tech: ['自媒体运营', '视频剪辑', '内容策划'],
    soft: ['善于写作', '创意思维', '独立研究', '执行力强']
  },
  certs: ['暂无证书'],
  priorities: ['时间自由', '兴趣爱好', '成长空间'],
  birthYear: 1998,
  birthMonth: 6
};

// ===== 执行 =====
console.log('═══════════════════════════════════════');
console.log('  干个活儿 — 自测报告');
console.log('  用户: 老大（东海先生）');
console.log('  28岁 · 哈尔滨 · 本科 · 5年经验');
console.log('  身份: 创业探索者 | 资金: 1-5万 | 风险: 高风险');
console.log('  技能: 自媒体运营 / 视频剪辑 / 内容策划');
console.log('  软技能: 善于写作 / 创意思维 / 独立研究 / 执行力强');
console.log('  关心: 时间自由 / 兴趣爱好 / 成长空间');
console.log('═══════════════════════════════════════\n');

const result = runRuleEngine(data);
const { industries, wuxing } = result;

// 五行分析
console.log('☯️ 五行命理分析（1998年6月出生）');
console.log('───────────────────────────────────────');
const wxFullName = { mu: '木', huo: '火', tu: '土', jin: '金', shui: '水' };
const wxBar = { mu: '🟢', huo: '🔴', tu: '🟡', jin: '⬜', shui: '🔵' };
['mu', 'huo', 'tu', 'jin', 'shui'].forEach(k => {
  const bar = '█'.repeat(Math.round(wuxing[k] / 4)) + '░'.repeat(25 - Math.round(wuxing[k] / 4));
  const marker = k === wuxing.dominantKey ? ' ← 主命' : '';
  console.log(`  ${wxBar[k]} ${wxFullName[k]} ${bar} ${wuxing[k]}%${marker}`);
});
console.log(`\n  🎯 主命: ${wuxing.dominant}命 — ${wuxing.dominant === '火' ? '火主礼，适合传媒、科技、创意领域' : wuxing.dominant === '木' ? '木主仁，适合教育、健康、文化领域' : wuxing.dominant === '土' ? '土主信，适合建筑、农业、管理领域' : wuxing.dominant === '金' ? '金主义，适合金融、法律、制造领域' : '水主智，适合物流、贸易、餐饮领域'}`);
console.log('');

// 行业排名
console.log('📊 行业适配度排名');
console.log('──────────────────────────────────────────────────────────────────');
console.log('  排名  行业          得分  趋势       五行   匹配原因');
console.log('──────────────────────────────────────────────────────────────────');

const statusMap = { graduate: '应届求职者', jobless: '在职转型者', unemployed: '转型待业者', startup: '创业探索者' };
const riskMap = { low: '稳健型', mid: '进取型', high: '冒险型' };

industries.forEach((ind, i) => {
  const rank = (i + 1).toString().padEnd(2);
  const name = ind.name.replace(/[^\u4e00-\u9fa5/a-zA-Z]/g, '').padEnd(12);
  const score = ind.score.toString().padEnd(3) + '分';
  const trend = ind.trend.padEnd(10);
  const wxBadge = (ind.wx_match ? '🔥' + ind.wuxing : '  ' + ind.wuxing).padEnd(5);
  
  // 提取关键加分项
  const boosts = ind.scoreLog
    .filter(l => l.startsWith('+'))
    .map(l => l.replace(/^\+\d+\s*/, ''))
    .slice(0, 2)
    .join(', ');
  
  console.log(`  #${rank}  ${name} ${score}  ${trend} ${wxBadge} ${boosts}`);
});

console.log('──────────────────────────────────────────────────────────────────\n');

// 行动建议
const top3 = industries.slice(0, 3);
console.log('🗺️ 行动建议');
console.log('───────────────────────────────────────');
console.log(`  第1选择: ${top3[0].name} (${top3[0].score}分)`);
console.log(`    理由: ${top3[0].desc}`);
console.log(`    做: 搜索"哈尔滨 ${top3[0].name.replace(/[^\u4e00-\u9fa5/a-zA-Z]/g, '')} 机会"看真实需求`);
console.log('');
console.log(`  第2选择: ${top3[1].name} (${top3[1].score}分)`);
console.log(`    理由: ${top3[1].desc}`);
console.log(`    做: 整理你在${top3[1].name.replace(/[^\u4e00-\u9fa5/a-zA-Z]/g, '')}方面的3个成就，优化简历`);
console.log('');
console.log(`  第3选择: ${top3[2].name} (${top3[2].score}分)`);
console.log(`    理由: ${top3[2].desc}`);
console.log(`    做: 加入${top3[2].name.replace(/[^\u4e00-\u9fa5/a-zA-Z]/g, '')}相关社区，先观察再入局`);
console.log('');
console.log('═══════════════════════════════════════');
console.log('  综合结论');
console.log('───────────────────────────────────────');
console.log(`  你的核心优势: 内容创作能力+创意思维+执行力`);
console.log(`  五行${wuxing.dominant}命——${wuxing.dominant === '火' ? '天生适合需要激情和创造力的行业' : wuxing.dominant === '木' ? '适合长线经营、培育型赛道' : wuxing.dominant === '土' ? '稳扎稳打是你的王牌' : wuxing.dominant === '金' ? '规则感和谈判力是你的武器' : '灵活应变、顺势而为'}`);
console.log(`  短期策略: 聚焦${top3[0].name.replace(/[^\u4e00-\u9fa5/a-zA-Z]/g, '')}赛道，用自媒体运营+写作能力做杠杆`);
console.log(`  长期方向: 从内容生产者→内容品牌主→知识付费/IP化`);
console.log('═══════════════════════════════════════');
