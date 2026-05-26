/* ============================================
   localjobs.js — 哈尔滨本地岗位匹配
   ============================================ */

let localJobsData = null;

async function loadLocalJobs() {
  if (localJobsData) return localJobsData;
  const data = await loadJSON('data/jobs-hrb.json');
  if (data) localJobsData = data.jobs;
  return localJobsData;
}

function matchLocalJobs(userResults, formData) {
  if (!localJobsData) return [];

  const topIndustries = (userResults || []).slice(0, 5).map(r => r.key);
  const userSkills = (formData?.skills || []).concat(formData?.softSkills || []);

  const scored = localJobsData.map(job => {
    let score = 0;

    // 行业匹配 (40%)
    if (topIndustries.includes(job.industry)) score += 40;

    // 技能匹配 (30%)
    const jobSkills = job.skills || [];
    const overlap = userSkills.filter(s => jobSkills.includes(s)).length;
    const skillScore = jobSkills.length > 0 ? Math.min(30, (overlap / jobSkills.length) * 30) : 0;
    score += skillScore;

    // 学历匹配 (15%)
    if (formData?.edu) {
      const eduLevels = ['高中及以下','大专','本科','硕士','博士'];
      const userEduIdx = eduLevels.indexOf(formData.edu);
      const jobMinEdu = job.education || '不限';
      if (jobMinEdu === '不限') score += 15;
      else {
        const jobEduIdx = eduLevels.findIndex(e => jobMinEdu.includes(e));
        if (jobEduIdx >= 0 && userEduIdx >= jobEduIdx) score += 15;
        else score += 5;
      }
    }

    // 薪资匹配 (15%)
    score += 10 + Math.random() * 5; // 简化：默认给一定的薪资匹配分

    score = Math.min(99, Math.round(score));
    return { ...job, match: score };
  });

  scored.sort((a, b) => b.match - a.match);
  return scored.slice(0, 15);
}

function getJobDisplayData(job) {
  let typeLabel = '';
  let typeColor = '';
  switch(job.type) {
    case 'fulltime': typeLabel='全职'; typeColor='var(--neon-cyan)'; break;
    case 'parttime': typeLabel='兼职'; typeColor='var(--accent-amber)'; break;
    case 'sidehustle': typeLabel='副业'; typeColor='var(--accent-green)'; break;
    case 'startup': typeLabel='创业'; typeColor='var(--accent-coral)'; break;
  }
  return { typeLabel, typeColor };
}
