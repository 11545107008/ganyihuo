/* ============================================
   security.js — 输入过滤、脱敏
   ============================================ */

function sanitizeInput(str) {
  if (!str) return '';
  return String(str)
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim()
    .slice(0, 200);
}

function validateInput(value, type) {
  if (!value && type !== 'optional') return false;
  const patterns = {
    name: /^[\u4e00-\u9fa5a-zA-Z]{1,20}$/,
    age: /^\d{1,3}$/,
    year: /^(19|20)\d{2}$/,
    month: /^(0?[1-9]|1[0-2])$/,
    optional: /.*/
  };
  return patterns[type] ? patterns[type].test(String(value)) : true;
}

function anonymizeData(data) {
  const a = { ...data };
  if (a.age) {
    const age = parseInt(a.age);
    if (age <= 22) a.ageRange = '22岁以下';
    else if (age <= 27) a.ageRange = '22-27岁';
    else if (age <= 34) a.ageRange = '28-34岁';
    else if (age <= 44) a.ageRange = '35-44岁';
    else a.ageRange = '45岁以上';
    delete a.age;
  }
  if (a.city) a.cityLevel = ['北京','上海','广州','深圳'].includes(a.city) ? '一线' : '二三线';
  if (a.birthYear) {
    a.birthDecade = Math.floor(parseInt(a.birthYear) / 10) * 10 + '年代';
    delete a.birthYear;
  }
  if (a.birthMonth) {
    const m = parseInt(a.birthMonth);
    if (m <= 3) a.birthSeason = '春';
    else if (m <= 6) a.birthSeason = '夏';
    else if (m <= 9) a.birthSeason = '秋';
    else a.birthSeason = '冬';
    delete a.birthMonth;
  }
  delete a.name;
  return a;
}

function escapeHtml(str) {
  if (!str) return '';
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return String(str).replace(/[&<>"']/g, c => map[c] || c);
}
