/* ============================================
   fortune.js — 模型C: 四柱八字命理适配引擎
   ============================================ */

const TIAN_GAN = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
const DI_ZHI = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
const WUXING_TG = ['木','木','火','火','土','土','金','金','水','水']; // 天干五行
const WUXING_DZ = ['水','土','木','木','土','火','火','土','金','金','土','水']; // 地支五行

// 职业五行扩展映射
const WUXING_CAREER_MAP = {
  '金': ['finance','law','const'],
  '木': ['edu','health','agri'],
  '水': ['logistics','ecom','food','media'],
  '火': ['tech','media','design'],
  '土': ['const','finance','agri','food']
};

function computeFortuneResult({ year, month, day, hour }) {
  // 1. 计算四柱
  const yearGanIdx = (year - 4) % 10;
  const yearZhiIdx = (year - 4) % 12;
  const yearGan = TIAN_GAN[yearGanIdx];
  const yearZhi = DI_ZHI[yearZhiIdx];

  // 月柱 (年上起月法)
  const monthGanIdx = (yearGanIdx * 2 + month) % 10;
  const monthZhiIdx = (month + 1) % 12;
  const monthGan = TIAN_GAN[monthGanIdx];
  const monthZhi = DI_ZHI[monthZhiIdx];

  // 日柱 (简化：以月为基础偏移)
  const dayGanIdx = (monthGanIdx + day - 1) % 10;
  const dayZhiIdx = (monthZhiIdx + day - 1) % 12;
  const dayGan = TIAN_GAN[dayGanIdx];
  const dayZhi = DI_ZHI[dayZhiIdx];

  // 时柱 (日上起时法)
  const hourZhiIdx = Math.floor(hour / 2) % 12;
  const hourGanIdx = (dayGanIdx * 2 + hourZhiIdx) % 10;
  const hourGan = TIAN_GAN[hourGanIdx];
  const hourZhi = DI_ZHI[hourZhiIdx];

  // 2. 计算五行分布
  const wuxingCount = { '金': 0, '木': 0, '水': 0, '火': 0, '土': 0 };
  const pillars = [
    { name: '年柱', gan: yearGan, zhi: yearZhi },
    { name: '月柱', gan: monthGan, zhi: monthZhi },
    { name: '日柱', gan: dayGan, zhi: dayZhi },
    { name: '时柱', gan: hourGan, zhi: hourZhi }
  ];

  pillars.forEach(p => {
    wuxingCount[WUXING_TG[TIAN_GAN.indexOf(p.gan)]] += 1.5; // 天干权重
    wuxingCount[WUXING_DZ[DI_ZHI.indexOf(p.zhi)]] += 1;     // 地支权重
  });

  const total = Object.values(wuxingCount).reduce((a,b)=>a+b,0);
  const percentages = {};
  for (const [k,v] of Object.entries(wuxingCount)) {
    percentages[k] = Math.round((v / total) * 100);
  }

  // 3. 日主五行
  const dayMasterWuxing = WUXING_TG[TIAN_GAN.indexOf(dayGan)];
  const sortedWuxing = Object.entries(percentages).sort((a,b) => b[1]-a[1]);
  const dominantWuxing = sortedWuxing[0][0];

  // 4. 喜用神 (简化：补弱抑强)
  const weakestWuxing = sortedWuxing[sortedWuxing.length-1][0];
  const happyGod = weakestWuxing; // 喜用神取最弱五行

  // 5. 行业评分
  const results = [];
  for (const ind of INDUSTRY_LIST) {
    let score = ind.baseScore;

    // 行业五行 = 日主五行 → 加分
    if (ind.wuxing === dayMasterWuxing) score += 8;
    // 行业五行 = 喜用神 → 加分
    if (ind.wuxing === happyGod) score += 6;
    // 行业五行 = 主导五行 → 加
    if (ind.wuxing === dominantWuxing) score += 4;

    score = Math.min(99, Math.round(score));
    results.push({ key: ind.key, name: ind.name, icon: ind.icon, wuxing: ind.wuxing, score });
  }

  results.sort((a, b) => b.score - a.score);

  // 6. 大运流年 (简化)
  const currentYear = new Date().getFullYear();
  const age = currentYear - year;
  const luckPillar = Math.floor(age / 10) * 10;

  return {
    model: 'fortune',
    results,
    wuxing: percentages,
    dominantWuxing,
    dayMasterWuxing,
    happyGod,
    pillars,
    bazi: `${yearGan}${yearZhi} ${monthGan}${monthZhi} ${dayGan}${dayZhi} ${hourGan}${hourZhi}`,
    interpretation: {
      summary: `日主${dayGan}(${dayMasterWuxing})，八字中${dominantWuxing}最旺，喜用神为${happyGod}`,
      advice: `当前正值${luckPillar}岁大运，宜从事${happyGod}属性行业以补五行不足`
    }
  };
}
