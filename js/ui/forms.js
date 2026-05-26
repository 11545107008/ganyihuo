/* ============================================
   forms.js — 三套测评问卷表单渲染与交互
   ============================================ */

let currentForm = { model: null, step: 0, data: {} };

// ==================== 模型A: 能力测评 ====================
function renderSkillsForm() {
  currentForm = { model: 'skills', step: 0, data: { skills: [], softSkills: [], certs: [], values: [] } };
  renderSkillsStep();
}

function renderSkillsStep() {
  const container = document.getElementById('skillsForm');
  const s = currentForm.step;

  const steps = [
    { title: '基本情况', desc: '先了解你的基础信息' },
    { title: '技能评估', desc: '选择你掌握的技能' },
    { title: '软技能与证书', desc: '通用能力也很重要' },
    { title: '资源与期望', desc: '你的资源和目标' }
  ];

  let html = `<div class="step-indicator">${steps.map((st,i) =>
    `<div class="step-dot${i===s?' active':''}${i<s?' done':''}" title="${st.title}"></div>`
  ).join('')}</div>`;

  html += `<div class="form-card"><h3>${steps[s].title}</h3><p class="form-desc">${steps[s].desc}</p>`;

  if (s === 0) {
    html += formGroup('姓名', '<input class="form-input" id="sk-name" placeholder="你的名字" value="' + escapeHtml(currentForm.data.name||'') + '" />');
    html += formGroup('年龄', '<input class="form-input" type="number" id="sk-age" min="16" max="80" placeholder="输入年龄" value="' + (currentForm.data.age||'') + '" />');
    html += formGroup('当前状态', `<select class="form-select" id="sk-status">${['','在校学生','待业找工作','在职想转行','自由职业','创业中','已退休'].map(o=>`<option value="${o}"${currentForm.data.status===o?' selected':''}>${o||'请选择'}</option>`).join('')}</select>`);
    html += formGroup('学历', `<select class="form-select" id="sk-edu">${[''].concat(EDUCATION).map(o=>`<option value="${o}"${currentForm.data.edu===o?' selected':''}>${o||'请选择'}</option>`).join('')}</select>`);
    html += formGroup('所在城市', `<select class="form-select" id="sk-city">${[''].concat(CITIES).map(o=>`<option value="${o}"${currentForm.data.city===o?' selected':''}>${o||'请选择'}</option>`).join('')}</select>`);
  }
  else if (s === 1) {
    html += '<p style="font-size:13px;color:var(--text-muted);margin-bottom:12px">选择你掌握的技术技能（可多选）</p>';
    html += '<div class="tag-group">' + HARD_SKILLS.map(sk => {
      const sel = (currentForm.data.skills||[]).includes(sk);
      return `<span class="tag${sel?' selected':''}" onclick="toggleTag(this,'skills')">${sk}</span>`;
    }).join('') + '</div>';

    html += formGroup('工作年限', `<div class="slider-group"><input type="range" min="0" max="15" value="${currentForm.data.experience||0}" id="sk-exp" oninput="document.getElementById('sk-exp-val').textContent=this.value+(this.value==0?' (无经验)':this.value>=10?' (10年+)':' 年')" /><span class="slider-value" id="sk-exp-val">${currentForm.data.experience||0}${(currentForm.data.experience||0)==0?' (无经验)':' 年'}</span></div>`);
  }
  else if (s === 2) {
    html += '<p style="font-size:13px;color:var(--text-muted);margin-bottom:12px">选择你的软技能（可多选）</p>';
    html += '<div class="tag-group">' + SOFT_SKILLS.map(sk => {
      const sel = (currentForm.data.softSkills||[]).includes(sk);
      return `<span class="tag${sel?' selected':''}" onclick="toggleTag(this,'softSkills')">${sk}</span>`;
    }).join('') + '</div>';

    html += '<p style="font-size:13px;color:var(--text-muted);margin:24px 0 12px">持有的证书/资质</p>';
    html += '<div class="tag-group">' + CERT_LIST.map(c => {
      const sel = (currentForm.data.certs||[]).includes(c);
      return `<span class="tag${sel?' selected':''}" onclick="toggleTag(this,'certs')">${c}</span>`;
    }).join('') + '</div>';
  }
  else if (s === 3) {
    html += formGroup('启动资金', `<select class="form-select" id="sk-capital">${[{v:'0',t:'0 - 没有启动资金'},{v:'1-5',t:'1-5万'},{v:'5-20',t:'5-20万'},{v:'20+',t:'20万以上'}].map(o=>`<option value="${o.v}"${currentForm.data.capital===o.v?' selected':''}>${o.t}</option>`).join('')}</select>`);
    html += formGroup('风险偏好', `<select class="form-select" id="sk-risk">${['',{v:'low',t:'保守 - 稳定第一'},{v:'mid',t:'适中 - 能接受一定风险'},{v:'high',t:'激进 - 高风险高回报'}].map(o=>typeof o==='string'?`<option value="">请选择</option>`:`<option value="${o.v}"${currentForm.data.risk===o.v?' selected':''}>${o.t}</option>`).join('')}</select>`);
    html += formGroup('时间投入', `<select class="form-select" id="sk-time">${['',{v:'fulltime',t:'全职投入'},{v:'parttime',t:'兼职（有空就做）'},{v:'fragment',t:'碎片时间'}].map(o=>typeof o==='string'?`<option value="">请选择</option>`:`<option value="${o.v}"${currentForm.data.time===o.v?' selected':''}>${o.t}</option>`).join('')}</select>`);
    html += formGroup('期望月收入', `<div class="slider-group"><input type="range" min="3" max="50" value="${currentForm.data.income||5}" id="sk-income" oninput="document.getElementById('sk-inc-val').textContent=this.value+'K'" /><span class="slider-value" id="sk-inc-val">${currentForm.data.income||5}K</span></div>`);
    html += '<p style="font-size:13px;color:var(--text-muted);margin:24px 0 12px">你更看重什么？（可多选）</p>';
    html += '<div class="tag-group">' + VALUES.map(v => {
      const sel = (currentForm.data.values||[]).includes(v);
      return `<span class="tag${sel?' selected':''}" onclick="toggleTag(this,'values')">${v}</span>`;
    }).join('') + '</div>';
  }

  html += `<div class="form-nav">${s>0?`<button class="btn-secondary" onclick="skillsPrev()">← 上一步</button>`:'<span></span>'}`;
  html += s<3?`<button class="btn-primary" onclick="skillsNext()">下一步 →</button>`:`<button class="btn-primary btn-glow" onclick="skillsSubmit()">生成能力报告 ⚡</button>`;
  html += '</div></div>';

  container.innerHTML = html;
}

function toggleTag(el, field) {
  el.classList.toggle('selected');
  const val = el.textContent;
  const arr = currentForm.data[field] || [];
  if (el.classList.contains('selected')) {
    if (!arr.includes(val)) arr.push(val);
  } else {
    const idx = arr.indexOf(val);
    if (idx >= 0) arr.splice(idx, 1);
  }
  currentForm.data[field] = arr;
}

function skillsNext() {
  collectSkillsStep();
  currentForm.step++;
  renderSkillsStep();
  window.scrollTo({ top: document.getElementById('skillsForm').offsetTop - 80, behavior: 'smooth' });
}
function skillsPrev() {
  collectSkillsStep();
  currentForm.step--;
  renderSkillsStep();
}
function collectSkillsStep() {
  const d = currentForm.data;
  const s = currentForm.step;
  const val = id => { const el = document.getElementById(id); return el ? el.value : ''; };
  if (s === 0) { d.name = sanitizeInput(val('sk-name')); d.age = val('sk-age'); d.status = val('sk-status'); d.edu = val('sk-edu'); d.city = val('sk-city'); }
  if (s === 1) { d.experience = parseInt(val('sk-exp')) || 0; }
  if (s === 3) { d.capital = val('sk-capital'); d.risk = val('sk-risk'); d.time = val('sk-time'); d.income = parseInt(val('sk-income')) || 5; }
}
function skillsSubmit() {
  collectSkillsStep();
  const result = computeSkillsResult(currentForm.data);
  if (typeof onModelComplete === 'function') onModelComplete('skills', result);
}

// ==================== 模型B: 性格测评 (RIASEC 18题) ====================
const RIASEC_QUESTIONS = [
  // R - Realistic 现实型
  {type:'R',q:'我喜欢动手操作工具或机器'},
  {type:'R',q:'我擅长修理东西或组装物品'},
  {type:'R',q:'我喜欢在户外工作或与实物打交道'},
  // I - Investigative 研究型
  {type:'I',q:'我喜欢分析和解决复杂问题'},
  {type:'I',q:'我对科学原理和自然规律充满好奇'},
  {type:'I',q:'我喜欢独立研究一个问题直到搞明白'},
  // A - Artistic 艺术型
  {type:'A',q:'我喜欢通过艺术形式表达自己的想法'},
  {type:'A',q:'我的想象力和创造力比较丰富'},
  {type:'A',q:'我喜欢不受约束地创作和发挥'},
  // S - Social 社会型
  {type:'S',q:'我喜欢帮助别人解决问题或困难'},
  {type:'S',q:'我善于倾听和理解他人的感受'},
  {type:'S',q:'我喜欢与人合作而不是独自工作'},
  // E - Enterprising 企业型
  {type:'E',q:'我喜欢领导和组织团队完成任务'},
  {type:'E',q:'我敢于承担风险去争取机会'},
  {type:'E',q:'我喜欢说服别人接受我的观点'},
  // C - Conventional 常规型
  {type:'C',q:'我喜欢按部就班地完成规范化的任务'},
  {type:'C',q:'我做事注重细节和准确性'},
  {type:'C',q:'我习惯把事物整理得井井有条'}
];

function renderPersonalityForm() {
  currentForm = { model: 'personality', step: 0, data: { riasec: {}, mbti: {} } };
  renderPersonalityStep();
}
function renderPersonalityStep() {
  const container = document.getElementById('personalityForm');
  const s = currentForm.step;
  const totalSteps = 3; // 0=intro, 1=RIASEC, 2=MBTI

  if (s === 0) {
    container.innerHTML = `<div class="form-card" style="text-align:center">
      <h3>🧠 霍兰德职业兴趣测评</h3>
      <p class="form-desc">基于60年科学研究验证的RIASEC模型<br>18道题，2分钟完成，找到与你性格最匹配的职业方向</p>
      <p style="font-size:13px;color:var(--text-muted);margin-bottom:24px">请根据你的真实感受作答，没有"对错"之分</p>
      <button class="btn-primary btn-glow" onclick="currentForm.step=1;renderPersonalityStep()">开始答题 →</button>
    </div>`;
    return;
  }

  if (s === 1) {
    let html = '<div class="form-card"><h3>每个描述在多大程度上符合你？</h3><p class="form-desc">1=完全不符合 2=不太符合 3=一般 4=比较符合 5=非常符合</p>';
    RIASEC_QUESTIONS.forEach((q, i) => {
      const sel = currentForm.data.riasec[i] || 0;
      html += `<div class="likert-row"><span class="likert-label">${i+1}. ${q.q}</span><div class="likert-options">`;
      for (let v = 1; v <= 5; v++) {
        html += `<button class="likert-btn${sel===v?' selected':''}" onclick="setRIASEC(${i},${v})">${v}</button>`;
      }
      html += '</div></div>';
    });
    html += `<div class="form-nav"><span></span><button class="btn-primary" onclick="currentForm.step=2;renderPersonalityStep()">下一步 →</button></div></div>`;
    container.innerHTML = html;
    return;
  }

  if (s === 2) {
    const mbtiQuestions = [
      {dim:'EI',q:'社交后我通常感到：',a:{E:'精力充沛',I:'需要独处恢复'}},
      {dim:'SN',q:'我获取信息更依赖：',a:{S:'具体事实和细节',N:'抽象概念和想象'}},
      {dim:'TF',q:'做决定时我更注重：',a:{T:'逻辑和理性分析',F:'情感和人际和谐'}},
      {dim:'JP',q:'我的生活方式偏向：',a:{J:'计划安排，有条不紊',P:'灵活随意，随遇而安'}}
    ];
    let html = '<div class="form-card"><h3>MBTI 快速自评</h3><p class="form-desc">4道题补充你的性格画像</p>';
    mbtiQuestions.forEach(q => {
      const sel = currentForm.data.mbti[q.dim] || '';
      html += `<div class="form-group"><label>${q.q}</label>
        <div style="display:flex;gap:12px">
          <button class="tag${sel===Object.keys(q.a)[0]?' selected':''}" onclick="setMBTI('${q.dim}','${Object.keys(q.a)[0]}')">${q.a[Object.keys(q.a)[0]]}</button>
          <button class="tag${sel===Object.keys(q.a)[1]?' selected':''}" onclick="setMBTI('${q.dim}','${Object.keys(q.a)[1]}')">${q.a[Object.keys(q.a)[1]]}</button>
        </div></div>`;
    });
    html += `<div class="form-nav"><button class="btn-secondary" onclick="currentForm.step=1;renderPersonalityStep()">← 返回修改</button>
    <button class="btn-primary btn-glow" onclick="personalitySubmit()">生成性格报告 ⚡</button></div></div>`;
    container.innerHTML = html;
  }
}
function setRIASEC(idx, val) {
  currentForm.data.riasec[idx] = val;
  // 视觉反馈
  const row = document.querySelectorAll('.likert-row')[idx];
  if (row) {
    row.querySelectorAll('.likert-btn').forEach((b,i) => b.classList.toggle('selected', i+1===val));
  }
}
function setMBTI(dim, val) { currentForm.data.mbti[dim] = val; }
function personalitySubmit() {
  const result = computePersonalityResult(currentForm.data);
  if (typeof onModelComplete === 'function') onModelComplete('personality', result);
}

// ==================== 模型C: 命理测评 ====================
function renderFortuneForm() {
  const container = document.getElementById('fortuneForm');
  container.innerHTML = `<div class="form-card">
    <h3>🔮 四柱八字命理分析</h3>
    <p class="form-desc">输入出生时间，我们计算你的八字和五行旺衰，给出职业方向建议</p>
    ${formGroup('出生年份','<input class="form-input" type="number" id="ft-year" min="1940" max="2020" placeholder="如 1995" />')}
    ${formGroup('出生月份','<input class="form-input" type="number" id="ft-month" min="1" max="12" placeholder="1-12" />')}
    ${formGroup('出生日期','<input class="form-input" type="number" id="ft-day" min="1" max="31" placeholder="1-31" />')}
    ${formGroup('出生时辰（可选）','<select class="form-select" id="ft-hour"><option value="">不确定</option><option value="0">子时 23-1点</option><option value="2">丑时 1-3点</option><option value="4">寅时 3-5点</option><option value="6">卯时 5-7点</option><option value="8">辰时 7-9点</option><option value="10">巳时 9-11点</option><option value="12">午时 11-13点(默认)</option><option value="14">未时 13-15点</option><option value="16">申时 15-17点</option><option value="18">酉时 17-19点</option><option value="20">戌时 19-21点</option><option value="22">亥时 21-23点</option></select>`)}
    <label style="display:flex;align-items:center;gap:8px;margin:20px 0;font-size:13px;color:var(--text-muted);cursor:pointer">
      <input type="checkbox" id="ft-privacy" /> 我同意将出生信息用于命理分析，数据仅本地处理
    </label>
    <button class="btn-primary btn-glow" onclick="fortuneSubmit()" style="width:100%">生成命理报告 🔮</button>
  </div>`;
}
function fortuneSubmit() {
  if (!document.getElementById('ft-privacy').checked) {
    alert('请先同意隐私条款');
    return;
  }
  const year = parseInt(document.getElementById('ft-year').value);
  const month = parseInt(document.getElementById('ft-month').value);
  const day = parseInt(document.getElementById('ft-day').value);
  const hour = parseInt(document.getElementById('ft-hour').value) || 12;
  if (!year || !month || !day || year < 1940 || year > 2020 || month < 1 || month > 12 || day < 1 || day > 31) {
    alert('请输入有效的出生日期');
    return;
  }
  const result = computeFortuneResult({ year, month, day, hour });
  if (typeof onModelComplete === 'function') onModelComplete('fortune', result);
}

// ==================== 辅助函数 ====================
function formGroup(label, input) {
  return `<div class="form-group"><label>${label}</label>${input}</div>`;
}
