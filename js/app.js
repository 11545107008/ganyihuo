/* ============================================
   app.js — 主入口：路由、初始化、导航
   ============================================ */

// --- 页面路由 ---
function showPage(pageName) {
  // 隐藏所有页面
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  // 显示目标页面
  const target = document.getElementById('page-' + pageName);
  if (target) target.classList.add('active');

  // 更新导航高亮
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(l => {
    const href = l.getAttribute('onclick') || '';
    if (href.includes("'" + pageName + "'")) l.classList.add('active');
  });

  AppState.currentPage = pageName;
  window.scrollTo(0, 0);

  // 关闭移动端菜单
  const nav = document.getElementById('navLinks');
  if (nav) nav.classList.remove('open');
}

// --- 开始测评 ---
function startAssessment(model) {
  if (model === 'skills') {
    showPage('assessment-skills');
    if (typeof renderSkillsForm === 'function') renderSkillsForm();
  } else if (model === 'personality') {
    showPage('assessment-personality');
    if (typeof renderPersonalityForm === 'function') renderPersonalityForm();
  } else if (model === 'fortune') {
    showPage('assessment-fortune');
    if (typeof renderFortuneForm === 'function') renderFortuneForm();
  }
}

// --- 导航切换 (移动端) ---
function toggleNav() {
  document.getElementById('navLinks').classList.toggle('open');
}

// --- 保存状态 ---
function saveState() {
  try {
    localStorage.setItem('ganyihuo_state', JSON.stringify({
      completedModels: AppState.completedModels,
      results: AppState.results,
      weights: AppState.weights
    }));
  } catch(e) { /* ignore */ }
}

// --- 模型完成后更新状态 ---
function onModelComplete(model, result) {
  AppState.completedModels[model] = true;
  AppState.results[model] = result;
  saveState();

  // 如果做了2个以上，融合结果
  const completed = Object.values(AppState.completedModels).filter(Boolean).length;
  if (completed >= 2) {
    if (typeof computeEnsemble === 'function') computeEnsemble();
  }

  showPage('result');
  if (typeof renderResult === 'function') renderResult();
}

// --- 初始化 ---
document.addEventListener('DOMContentLoaded', function() {
  // 初始化粒子背景
  if (typeof initParticles === 'function') initParticles();

  // 恢复状态，如果已完成测评则显示结果
  const completed = Object.values(AppState.completedModels).filter(Boolean).length;
  if (completed > 0) {
    // 可选：直接跳转结果页
    // showPage('result');
  }
});
