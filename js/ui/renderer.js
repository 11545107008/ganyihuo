/* ============================================
   renderer.js — 结果页渲染（综合排行、雷达图、柱状图、岗位匹配）
   ============================================ */

let currentResultTab = 'combined';
let localJobMatches = [];

async function renderResult() {
  const container = document.getElementById('resultContent');
  if (!container) return;

  const completed = AppState.completedModels;
  const hasAny = completed.skills || completed.personality || completed.fortune;
  const completedCount = Object.values(completed).filter(Boolean).length;

  if (!hasAny) {
    container.innerHTML = `<div class="result-empty"><h2>还没有测评结果</h2><p>完成至少一个测评模型后，这里会展示你的职业分析报告</p>
      <button class="btn-primary" onclick="startAssessment('skills')">开始测评</button></div>`;
    return;
  }

  // 加载行业数据
  await loadIndustries();

  // 综合评分
  if (completedCount >= 2) computeEnsemble();
  const ensemble = AppState._ensemble;

  // 加载本地岗位
  await loadLocalJobs();
  if (localJobsData && typeof matchLocalJobs === 'function') {
    const topResults = ensemble ? ensemble.results : Object.values(AppState.results).find(r=>r)?.results || [];
    localJobMatches = matchLocalJobs(topResults, AppState.formData);
  }

  let html = '';

  // 头部
  html += '<div class="result-header"><h2>你的职业分析报告</h2>';
  html += `<p class="result-sub">已完成 ${completedCount} 个测评模型`;
  if (completedCount < 3) html += '，完成更多测评获得更精准推荐';
  html += '</p></div>';

  // 模型完成状态指示
  html += '<div class="model-cards" style="grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:32px">';
  ['skills','personality','fortune'].forEach(m => {
    const names = {skills:'能力适配',personality:'性格匹配',fortune:'命理指引'};
    const icons = {skills:'💪',personality:'🧠',fortune:'🔮'};
    html += `<div class="model-card" style="padding:16px;text-align:center;opacity:${completed[m]?1:0.5};cursor:pointer" onclick="${completed[m]?`showModelResult('${m}')`:`startAssessment('${m}')`}">
      <div style="font-size:28px">${icons[m]}</div>
      <div style="font-size:13px;font-weight:600;margin-top:4px">${names[m]}</div>
      <div style="font-size:11px;color:var(--text-muted)">${completed[m]?'✅ 已完成':'点击开始'}</div>
    </div>`;
  });
  html += '</div>';

  // 权重选择
  if (completedCount >= 2) {
    html += '<div style="text-align:center;margin-bottom:24px">';
    html += '<span style="font-size:13px;color:var(--text-muted);margin-right:8px">评分偏好：</span>';
    Object.entries(WEIGHT_PRESETS).forEach(([key,preset]) => {
      const active = AppState.weights.name === preset.name;
      html += `<button class="tag${active?' selected':''}" onclick="setWeightPreset('${key}')" style="margin:4px">${preset.name}</button>`;
    });
    html += '</div>';
  }

  // 智能选择默认Tab
  if (completedCount < 2) {
    if (completed.skills) currentResultTab = 'skills';
    else if (completed.personality) currentResultTab = 'personality';
    else if (completed.fortune) currentResultTab = 'fortune';
  } else {
    currentResultTab = 'combined';
  }

  // Tab导航
  html += '<div class="result-tabs">';
  const tabs = [];
  if (completedCount >= 2) tabs.push(['combined','综合排行']);
  if (completed.skills) tabs.push(['skills','能力分析']);
  if (completed.personality) tabs.push(['personality','性格画像']);
  if (completed.fortune) tabs.push(['fortune','命理解读']);
  if (localJobMatches.length > 0) tabs.push(['localjobs','本地岗位']);
  tabs.push(['advice','行动指南']);

  tabs.forEach(([id,label]) => {
    html += `<button class="result-tab${currentResultTab===id?' active':''}" onclick="switchResultTab('${id}')">${label}</button>`;
  });
  html += '</div>';

  // Tab内容区
  html += '<div id="resultTabContent"></div>';
  container.innerHTML = html;

  // 渲染当前Tab
  renderResultTab();
}

function switchResultTab(tab) {
  currentResultTab = tab;
  renderResultTab();
}

function renderResultTab() {
  const content = document.getElementById('resultTabContent');
  if (!content) return;

  // 更新Tab高亮
  document.querySelectorAll('.result-tab').forEach(t => {
    t.classList.toggle('active', t.getAttribute('onclick')?.includes(currentResultTab));
  });

  switch(currentResultTab) {
    case 'combined': renderCombinedTab(content); break;
    case 'skills': renderModelTab(content, 'skills'); break;
    case 'personality': renderModelTab(content, 'personality'); break;
    case 'fortune': renderModelTab(content, 'fortune'); break;
    case 'localjobs': renderLocalJobsTab(content); break;
    case 'advice': renderAdviceTab(content); break;
  }
}

function renderCombinedTab(content) {
  const ensemble = AppState._ensemble;
  if (!ensemble) { content.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:40px">请完成至少2个测评模型</p>'; return; }

  let html = '';
  ensemble.results.forEach((item, idx) => {
    const indInfo = INDUSTRY_LIST.find(i => i.key === item.key) || {};
    html += `<div class="industry-rank-item">
      <div class="rank-header">
        <span class="rank-name">${idx+1}. ${indInfo.icon||''} ${item.name}</span>
        <span class="rank-score">${item.score}分</span>
      </div>
      <div class="rank-bar"><div class="rank-bar-fill" style="width:${item.score}%"></div></div>
      <div style="display:flex;gap:16px;font-size:12px;color:var(--text-muted)">
        ${item.skillsScore?'<span>能力: '+item.skillsScore+'</span>':''}
        ${item.personalityScore?'<span>性格: '+item.personalityScore+'</span>':''}
        ${item.fortuneScore?'<span>命理: '+item.fortuneScore+'</span>':''}
      </div>
    </div>`;
  });
  content.innerHTML = html;
}

function renderModelTab(content, model) {
  const result = AppState.results[model];
  if (!result) { content.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:40px">尚未完成此测评</p>'; return; }

  let html = '';

  // 性格模型特殊渲染
  if (model === 'personality' && result.riasec) {
    html += renderRIASECChart(result.riasec);
    html += `<div style="text-align:center;padding:16px;background:var(--glass-bg);border-radius:var(--radius-md);margin-bottom:24px">
      <div style="font-size:11px;color:var(--text-muted)">霍兰德代码</div>
      <div style="font-size:28px;font-weight:800;letter-spacing:4px;margin:4px 0">${result.hollandCode}</div>
      <div style="font-size:13px;color:var(--text-secondary)">MBTI: ${result.mbtiType||'未测'}</div>
      <div style="font-size:12px;color:var(--text-muted);margin-top:8px">${result.interpretation?.summary||''}</div>
    </div>`;
  }

  // 命理模型特殊渲染
  if (model === 'fortune' && result.wuxing) {
    html += renderWuxingChart(result.wuxing);
    html += `<div style="text-align:center;padding:16px;background:var(--glass-bg);border-radius:var(--radius-md);margin-bottom:24px">
      <div style="font-size:11px;color:var(--text-muted)">八字排盘</div>
      <div style="font-size:20px;font-weight:700;letter-spacing:2px;margin:4px 0">${result.bazi||''}</div>
      <div style="font-size:13px;color:var(--text-secondary);margin-top:8px">${result.interpretation?.summary||''}</div>
      <div style="font-size:12px;color:var(--text-muted);margin-top:4px">${result.interpretation?.advice||''}</div>
    </div>`;
  }

  // 行业排名
  result.results.forEach((item, idx) => {
    const indInfo = INDUSTRY_LIST.find(i => i.key === item.key) || {};
    html += `<div class="industry-rank-item">
      <div class="rank-header">
        <span class="rank-name">${idx+1}. ${indInfo.icon||''} ${item.name}</span>
        <span class="rank-score">${item.score}分</span>
      </div>
      <div class="rank-bar"><div class="rank-bar-fill" style="width:${item.score}%"></div></div>`;
    if (item.recommendations) {
      html += '<div class="rank-sub-items">';
      Object.entries(item.recommendations).forEach(([type, roles]) => {
        const labels = {fulltime:'全职',parttime:'兼职',sidehustle:'副业',startup:'创业'};
        if (roles && roles.length > 0) {
          html += `<span class="rank-sub-item">${labels[type]||type}: ${roles.slice(0,2).join('、')}</span>`;
        }
      });
      html += '</div>';
    }
    html += '</div>';
  });

  content.innerHTML = html;
}

function renderRIASECChart(scores) {
  const typeNames = {R:'现实型',I:'研究型',A:'艺术型',S:'社会型',E:'企业型',C:'常规型'};
  const typeColors = {R:'#FF6B6B',I:'#FFB300',A:'#A855F7',S:'#00E676',E:'#00D2FF',C:'#6C5CE7'};
  const centerX = 200, centerY = 200, radius = 140;
  const keys = ['R','I','A','S','E','C'];
  const angleStep = (Math.PI * 2) / 6;
  const startAngle = -Math.PI / 2;

  // 计算数据点
  const points = keys.map((k, i) => {
    const angle = startAngle + i * angleStep;
    const val = (scores[k] || 0) / 100;
    return {
      x: centerX + Math.cos(angle) * radius * val,
      y: centerY + Math.sin(angle) * radius * val,
      labelX: centerX + Math.cos(angle) * (radius + 30),
      labelY: centerY + Math.sin(angle) * (radius + 30),
      label: typeNames[k],
      color: typeColors[k]
    };
  });

  let svg = `<div class="chart-container"><svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">`;

  // 网格
  for (let r = 1; r <= 4; r++) {
    const pts = keys.map((_, i) => {
      const a = startAngle + i * angleStep;
      return `${centerX+Math.cos(a)*radius*(r/4)},${centerY+Math.sin(a)*radius*(r/4)}`;
    }).join(' ');
    svg += `<polygon points="${pts}" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>`;
  }

  // 轴线
  keys.forEach((_, i) => {
    const a = startAngle + i * angleStep;
    svg += `<line x1="${centerX}" y1="${centerY}" x2="${centerX+Math.cos(a)*radius}" y2="${centerY+Math.sin(a)*radius}" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>`;
  });

  // 数据区域
  const dataPts = points.map(p => `${p.x},${p.y}`).join(' ');
  svg += `<polygon points="${dataPts}" fill="rgba(108,92,231,0.2)" stroke="var(--neon-purple)" stroke-width="2"/>`;

  // 数据点
  points.forEach(p => {
    svg += `<circle cx="${p.x}" cy="${p.y}" r="4" fill="${p.color}"/>`;
  });

  // 标签
  points.forEach(p => {
    svg += `<text x="${p.labelX}" y="${p.labelY}" text-anchor="middle" dominant-baseline="middle" font-size="12" fill="${p.color}" font-weight="600">${p.label}</text>`;
  });

  svg += '</svg></div>';
  return svg;
}

function renderWuxingChart(wuxing) {
  const colors = {金:'#FFD700',木:'#00E676',水:'#00D2FF',火:'#FF6B6B',土:'#FFB300'};
  const keys = ['金','木','水','火','土'];
  const maxVal = Math.max(...Object.values(wuxing), 1);

  let html = '<div class="chart-container"><div class="wuxing-bars">';
  keys.forEach(k => {
    const val = wuxing[k] || 0;
    const h = Math.round((val / maxVal) * 140);
    html += `<div class="wuxing-bar">
      <div class="wuxing-bar-value">${val}%</div>
      <div class="wuxing-bar-fill" style="height:${h}px;background:${colors[k]}"></div>
      <div class="wuxing-bar-label">${k}</div>
    </div>`;
  });
  html += '</div></div>';
  return html;
}

function renderLocalJobsTab(content) {
  if (!localJobMatches || localJobMatches.length === 0) {
    content.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:40px">暂无匹配的本地岗位<br>完成测评后自动匹配哈尔滨本地岗位</p>';
    return;
  }

  let html = '<h3 style="margin-bottom:16px">📍 哈尔滨本地岗位推荐</h3>';
  localJobMatches.slice(0, 10).forEach(job => {
    const disp = typeof getJobDisplayData === 'function' ? getJobDisplayData(job) : {typeLabel:'',typeColor:''};
    html += `<div class="local-job-card">
      <div class="job-info">
        <h4>${escapeHtml(job.title)}</h4>
        <div class="job-company">${escapeHtml(job.company)} · ${job.area||''}</div>
      </div>
      <div style="text-align:right">
        <div class="job-salary">${escapeHtml(job.salary)}</div>
        <span class="job-match-badge">匹配 ${job.match}%</span>
        ${disp.typeLabel?`<span style="font-size:11px;color:${disp.typeColor};margin-left:4px">${disp.typeLabel}</span>`:''}
      </div>
    </div>`;
  });
  content.innerHTML = html;
}

function renderAdviceTab(content) {
  const completed = AppState.completedModels;
  let advice = [];

  advice.push({title:'💡 核心建议',text:'根据你的测评结果，优先关注排名前3的行业方向。建议先从兼职或副业切入试水，降低试错成本。'});
  advice.push({title:'📊 数据说话',text:'2026年中国灵活就业规模突破2.3万亿元，62%职场人已有副业。副业不再是"备选"，而是越来越多人的"标配"。'});
  advice.push({title:'🎯 本地机会',text:'哈尔滨的IT、教育、电商行业增速明显。本地生活服务类兼职门槛低、需求大，适合快速起步。'});

  if (!completed.personality) advice.push({title:'🧠 建议完成性格测评',text:'霍兰德RIASEC测评只需2分钟，能帮你从心理学角度找到更适合的职业方向。<a href="#" onclick="startAssessment(\'personality\');return false" style="color:var(--neon-cyan)">立即测评 →</a>'});
  if (!completed.fortune) advice.push({title:'🔮 试试命理测评',text:'八字命理提供的传统视角，可能给你不一样的启发。<a href="#" onclick="startAssessment(\'fortune\');return false" style="color:var(--neon-cyan)">立即测评 →</a>'});

  let html = '<ul class="advice-list">';
  advice.forEach((a, i) => {
    html += `<li class="advice-item"><span class="advice-num">${a.title.charAt(0)}</span><div class="advice-text"><strong>${a.title.slice(2)}</strong><br>${a.text}</div></li>`;
  });
  html += '</ul>';
  content.innerHTML = html;
}

function showModelResult(model) {
  currentResultTab = model;
  renderResult();
}

// 重新初始化 - 加载数据
document.addEventListener('DOMContentLoaded', async function() {
  await loadIndustries();
  await loadLocalJobs();
  if (Object.values(AppState.completedModels).filter(Boolean).length > 0) {
    // 有结果时显示结果页
  }
});
