// 干个活儿 V4 — 多模型规则引擎API（Vercel Serverless Function）
// 支持 mode: skills | personality | fortune | ensemble

// ===== SANITIZE =====
function s(str, maxLen) {
  if (!str || typeof str !== 'string') return '';
  return str.replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s\-_,.()（）、。，；：！？【】《》""''·@#+\u2014\u2013\u2026\u00b7]/g, '').trim().substring(0, maxLen || 100);
}
function c(val, min, max, fallback) {
  const n = parseInt(val);
  return isNaN(n) ? fallback : Math.min(Math.max(n, min), max);
}

// ===== TIAN GAN DI ZHI =====
const TG = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
const DZ = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
const WX_TG = ['木','木','火','火','土','土','金','金','水','水'];
const WX_DZ = ['水','土','木','木','土','火','火','土','金','金','土','水'];

// ===== MODEL A: SKILLS =====
function analyzeSkills(data) {
  const inds = [
    { key:'tech',name:'互联网/科技',base:60,wx:'火',skills:['编程开发','数据分析','项目管理','外语翻译'],soft:['学习能力','创意思维','团队协作'] },
    { key:'health',name:'医疗健康',base:58,wx:'木',skills:['数据分析','项目管理','销售谈判','外语翻译'],soft:['细心耐心','情绪稳定','沟通表达'] },
    { key:'edu',name:'教育培训',base:55,wx:'木',skills:['文案写作','外语翻译','视频剪辑','项目管理'],soft:['沟通表达','耐心细心','执行力强'] },
    { key:'media',name:'内容/传媒',base:52,wx:'火',skills:['文案写作','视频剪辑','设计制图','数据分析'],soft:['创意思维','沟通表达','学习能力'] },
    { key:'finance',name:'金融/理财',base:50,wx:'金',skills:['数据分析','会计财务','销售谈判','项目管理'],soft:['细心耐心','执行力强','情绪稳定'] },
    { key:'law',name:'法律/咨询',base:50,wx:'金',skills:['文案写作','数据分析','项目管理','外语翻译'],soft:['沟通表达','细心耐心'] },
    { key:'design',name:'设计/创意',base:50,wx:'火',skills:['设计制图','视频剪辑','文案写作','编程开发'],soft:['创意思维','沟通表达','学习能力'] },
    { key:'ecom',name:'电商/零售',base:48,wx:'水',skills:['销售谈判','数据分析','视频剪辑','文案写作'],soft:['执行力强','沟通表达','团队协作'] },
    { key:'const',name:'建筑/房产',base:45,wx:'土',skills:['项目管理','设计制图','会计财务','驾驶运输'],soft:['执行力强','细心耐心','团队协作'] },
    { key:'logistics',name:'物流/运营',base:44,wx:'水',skills:['驾驶运输','项目管理','数据分析','销售谈判'],soft:['执行力强','沟通表达','团队协作'] },
    { key:'food',name:'餐饮/服务',base:42,wx:'水',skills:['烹饪烘焙','销售谈判','项目管理','视频剪辑'],soft:['执行力强','沟通表达','耐心细心'] },
    { key:'agri',name:'农业/新农村',base:38,wx:'土',skills:['驾驶运输','销售谈判','数据分析','视频剪辑'],soft:['执行力强','耐心细心','学习能力'] }
  ];

  const uSkills = data.skills || [];
  const uSoft = data.softSkills || [];
  const exp = data.experience || 0;
  const capital = data.capital || '0';
  const risk = data.risk || 'mid';
  const income = data.income || 5;
  const time = data.time || 'fulltime';
  const city = data.city || '';
  const vals = data.values || [];
  const status = data.status || '';

  inds.forEach(ind => {
    let sc = ind.base;
    const so = uSkills.filter(sk => (ind.skills||[]).includes(sk)).length;
    sc += so * 8 * 1.5;
    const so2 = uSoft.filter(sk => (ind.soft||[]).includes(sk)).length;
    sc += so2 * 5;
    if (exp >= 10) sc += 12; else if (exp >= 5) sc += 8; else if (exp >= 3) sc += 5; else if (exp >= 1) sc += 3;
    if ((capital === '20+' || capital === '5-20') && ['food','agri','const','ecom'].includes(ind.key)) sc += 8;
    if (capital === '0' && ['tech','edu','media','design','law'].includes(ind.key)) sc += 6;
    const hiR = ['ecom','food','tech','media']; const loR = ['edu','health','law','finance','agri'];
    if (risk === 'high' && hiR.includes(ind.key)) sc += 8;
    if (risk === 'low' && loR.includes(ind.key)) sc += 8;
    if (['tech','finance','law','health'].includes(ind.key) && income > 10) sc += 6;
    if (['food','logistics','agri','edu'].includes(ind.key) && income < 8) sc += 4;
    if (time === 'parttime' && ['logistics','food','edu','media','ecom'].includes(ind.key)) sc += 6;
    if (time === 'fragment' && ['media','design','ecom','edu'].includes(ind.key)) sc += 8;
    if (city === '哈尔滨' && ['food','logistics','agri','edu','ecom','tech'].includes(ind.key)) sc += 3;
    if (vals.includes('薪资高') && ['tech','finance','law'].includes(ind.key)) sc += 5;
    if (vals.includes('时间自由') && ['media','design','ecom'].includes(ind.key)) sc += 5;
    if (vals.includes('稳定安全') && ['edu','health','law','agri'].includes(ind.key)) sc += 4;
    if (status === '在校学生' && ['tech','media','edu','design'].includes(ind.key)) sc += 5;
    if (status === '待业找工作' && ['tech','ecom','logistics','food'].includes(ind.key)) sc += 5;
    if (status === '创业中' && ['ecom','food','media','agri'].includes(ind.key)) sc += 8;
    ind.score = Math.min(99, Math.round(sc));
  });
  inds.sort((a,b) => b.score - a.score);
  return { model:'skills', results: inds };
}

// ===== MODEL B: PERSONALITY (RIASEC) =====
function analyzePersonality(data) {
  const riasec = data.riasec || {};
  const scores = {R:0,I:0,A:0,S:0,E:0,C:0};
  const questions = data.questions || [];
  questions.forEach(q => {
    const val = riasec[q.idx] || 0;
    scores[q.type] = (scores[q.type] || 0) + val;
  });
  const maxPer = 3 * 5;
  for (const k in scores) scores[k] = Math.round((scores[k]/maxPer)*100);

  const sorted = Object.entries(scores).sort((a,b) => b[1]-a[1]);
  const code = sorted.slice(0,3).map(e=>e[0]).join('');

  const vecs = {
    tech:{R:30,I:90,A:40,S:20,E:40,C:35},health:{R:45,I:75,A:20,S:85,E:25,C:50},
    edu:{R:20,I:45,A:40,S:90,E:30,C:45},media:{R:20,I:30,A:95,S:55,E:60,C:20},
    finance:{R:20,I:60,A:15,S:25,E:70,C:85},law:{R:20,I:70,A:15,S:40,E:55,C:75},
    design:{R:40,I:30,A:95,S:25,E:45,C:30},ecom:{R:30,I:40,A:40,S:50,E:85,C:45},
    const:{R:80,I:35,A:30,S:20,E:55,C:60},logistics:{R:65,I:25,A:15,S:25,E:50,C:55},
    food:{R:55,I:15,A:35,S:60,E:55,C:40},agri:{R:75,I:30,A:20,S:35,E:35,C:40}
  };

  const names = {tech:'互联网/科技',health:'医疗健康',edu:'教育培训',media:'内容/传媒',finance:'金融/理财',
    law:'法律/咨询',design:'设计/创意',ecom:'电商/零售',const:'建筑/房产',logistics:'物流/运营',
    food:'餐饮/服务',agri:'农业/新农村'};

  const results = [];
  for (const [key,vec] of Object.entries(vecs)) {
    let dot=0,mA=0,mB=0;
    for (const k in scores) { dot+=scores[k]*vec[k]; mA+=scores[k]*scores[k]; mB+=vec[k]*vec[k]; }
    const sim = mA&&mB ? dot/(Math.sqrt(mA)*Math.sqrt(mB))*100 : 0;
    results.push({key,name:names[key],score:Math.min(99,Math.round(sim)),wuxing:''});
  }
  results.sort((a,b)=>b.score-a.score);
  return { model:'personality', results, riasec: scores, hollandCode: code };
}

// ===== MODEL C: FORTUNE (BAZI) =====
function analyzeFortune(data) {
  const {year,month,day,hour} = data;
  const yGi = (year-4)%10, yZi = (year-4)%12;
  const mGi = (yGi*2+month)%10, mZi = (month+1)%12;
  const dGi = (mGi+day-1)%10, dZi = (mZi+day-1)%12;
  const hZi = Math.floor((hour||12)/2)%12, hGi = (dGi*2+hZi)%10;

  const wx = {金:0,木:0,水:0,火:0,土:0};
  [[yGi,yZi],[mGi,mZi],[dGi,dZi],[hGi,hZi]].forEach(([g,z]) => {
    wx[WX_TG[g]]+=1.5; wx[WX_DZ[z]]+=1;
  });

  const total = Object.values(wx).reduce((a,b)=>a+b,0);
  const pct = {}; for (const k in wx) pct[k]=Math.round(wx[k]/total*100);
  const sorted = Object.entries(pct).sort((a,b)=>b[1]-a[1]);

  const wxMap = {tech:'火',health:'木',edu:'木',media:'火',finance:'金',law:'金',
    design:'火',ecom:'水',const:'土',logistics:'水',food:'水',agri:'土'};
  const names = {tech:'互联网/科技',health:'医疗健康',edu:'教育培训',media:'内容/传媒',finance:'金融/理财',
    law:'法律/咨询',design:'设计/创意',ecom:'电商/零售',const:'建筑/房产',logistics:'物流/运营',
    food:'餐饮/服务',agri:'农业/新农村'};

  const dayWx = WX_TG[dGi];
  const results = [];
  for (const [key,name] of Object.entries(names)) {
    let sc = 50 + (wxMap[key]===dayWx?8:0) + (wxMap[key]===sorted[0][0]?6:0) + (wxMap[key]===sorted[4][0]?4:0);
    results.push({key,name,score:Math.min(99,Math.round(sc)),wuxing:wxMap[key]});
  }
  results.sort((a,b)=>b.score-a.score);

  const bazi = `${TG[yGi]}${DZ[yZi]} ${TG[mGi]}${DZ[mZi]} ${TG[dGi]}${DZ[dZi]} ${TG[hGi]}${DZ[hZi]}`;
  return { model:'fortune', results, wuxing:pct, dominantWuxing:sorted[0][0],
    dayMasterWuxing:dayWx, happyGod:sorted[4][0], bazi,
    interpretation:`日主${TG[dGi]}(${dayWx})，喜用神${sorted[4][0]}` };
}

// ===== MODEL COMBINED: ENSEMBLE =====
function analyzeEnsemble(data) {
  const { skills, personality, fortune, weights } = data;
  const combined = {};
  const w = weights || { skills:0.4, personality:0.35, fortune:0.25 };

  const sr = skills?.results||[], pr = personality?.results||[], fr = fortune?.results||[];
  const hasS = sr.length>0, hasP = pr.length>0, hasF = fr.length>0;

  [...sr,...pr,...fr].forEach(item => {
    if (!combined[item.key]) combined[item.key] = {key:item.key,name:item.name,wuxing:item.wuxing,sS:0,sP:0,sF:0};
  });
  sr.forEach(i => { if(combined[i.key]) combined[i.key].sS=i.score; });
  pr.forEach(i => { if(combined[i.key]) combined[i.key].sP=i.score; });
  fr.forEach(i => { if(combined[i.key]) combined[i.key].sF=i.score; });

  const tw = (hasS?w.skills:0)+(hasP?w.personality:0)+(hasF?w.fortune:0);
  const results = Object.values(combined).map(item => {
    const ws = hasS ? w.skills/tw : 0, wp = hasP ? w.personality/tw : 0, wf = hasF ? w.fortune/tw : 0;
    return {...item, score: Math.min(99, Math.round((item.sS*ws+item.sP*wp+item.sF*wf)*100)) };
  });
  results.sort((a,b)=>b.score-a.score);
  return { model:'ensemble', results };
}

// ===== HANDLER =====
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error:'仅支持POST' });

  try {
    const body = req.body || {};
    const mode = body.mode || 'skills';

    let result;
    switch(mode) {
      case 'skills': result = analyzeSkills(body.data || body); break;
      case 'personality': result = analyzePersonality(body.data || body); break;
      case 'fortune': result = analyzeFortune(body.data || body); break;
      case 'ensemble': result = analyzeEnsemble(body.data || body); break;
      default: result = analyzeSkills(body.data || body);
    }

    res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    return res.status(200).json({ success:true, timestamp:Date.now(), ...result });
  } catch(err) {
    return res.status(500).json({ success:false, error:'分析服务暂不可用' });
  }
}
