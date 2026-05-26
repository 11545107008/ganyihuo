/* ============================================
   config.js — 全局配置、常量、数据引用
   ============================================ */

// --- API 配置 ---
const apiConfig = {
  endpoint: 'https://ganyihuo-d4e3q4c0s-11545107008.projects.vercel.app/api/analyze',
  useBackend: true
};

// --- AI 引擎配置 ---
const MODEL_CONFIG = {
  deepseek: {
    name: 'DeepSeek',
    endpoint: 'https://api.deepseek.com/chat/completions',
    model: 'deepseek-chat',
    icon: '🐋'
  },
  qwen: {
    name: '通义千问',
    endpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
    model: 'qwen-turbo',
    icon: '☁️'
  },
  ernie: {
    name: '文心一言',
    endpoint: 'https://qianfan.baidubce.com/v2/chat/completions',
    model: 'ernie-speed-128k',
    icon: '📘'
  }
};

// --- AI 当前配置 (localStorage 持久化) ---
let aiConfig = {
  enabled: false,
  provider: 'deepseek',
  apiKey: '',
  temperature: 0.7
};

// --- 12 行业数据 (基础定义，详细数据在 industries.json) ---
const INDUSTRY_LIST = [
  { key: 'tech', name: '互联网/科技', wuxing: '火', icon: '💻', baseScore: 60 },
  { key: 'health', name: '医疗健康', wuxing: '木', icon: '🏥', baseScore: 58 },
  { key: 'edu', name: '教育培训', wuxing: '木', icon: '📚', baseScore: 55 },
  { key: 'media', name: '内容/传媒', wuxing: '火', icon: '📱', baseScore: 52 },
  { key: 'finance', name: '金融/理财', wuxing: '金', icon: '💰', baseScore: 50 },
  { key: 'law', name: '法律/咨询', wuxing: '金', icon: '⚖️', baseScore: 50 },
  { key: 'design', name: '设计/创意', wuxing: '火', icon: '🎨', baseScore: 50 },
  { key: 'ecom', name: '电商/零售', wuxing: '水', icon: '🛒', baseScore: 48 },
  { key: 'const', name: '建筑/房产', wuxing: '土', icon: '🏗️', baseScore: 45 },
  { key: 'logistics', name: '物流/运营', wuxing: '水', icon: '🚚', baseScore: 44 },
  { key: 'food', name: '餐饮/服务', wuxing: '水', icon: '🍽️', baseScore: 42 },
  { key: 'agri', name: '农业/新农村', wuxing: '土', icon: '🌾', baseScore: 38 }
];

// --- 直辖市列表 ---
const CITIES = ['哈尔滨','北京','上海','广州','深圳','成都','杭州','武汉','南京','西安','重庆','长沙','郑州','济南','其他'];

// --- 学历 ---
const EDUCATION = ['高中及以下','大专','本科','硕士','博士'];

// --- 硬技能标签 ---
const HARD_SKILLS = [
  '编程开发','数据分析','设计制图','视频剪辑',
  '文案写作','销售谈判','会计财务','项目管理',
  '外语翻译','驾驶运输','烹饪烘焙','美容美发'
];

// --- 软技能 ---
const SOFT_SKILLS = [
  '沟通表达','团队协作','创意思维','执行力强',
  '学习能力','情绪稳定','领导管理','细心耐心'
];

// --- 证书 ---
const CERT_LIST = [
  '无','计算机等级','英语四六级','会计从业','律师资格证',
  '教师资格证','驾驶证','项目管理PMP','其他专业证书'
];

// --- 价值观 ---
const VALUES = ['薪资高','时间自由','稳定安全','成长空间','社会价值','轻松不累','挑战刺激'];

// --- 加权预设 ---
const WEIGHT_PRESETS = {
  pragmatic: { name: '务实派', skills: 0.60, personality: 0.25, fortune: 0.15 },
  balanced: { name: '平衡派', skills: 0.40, personality: 0.35, fortune: 0.25 },
  spiritual: { name: '随缘派', skills: 0.25, personality: 0.25, fortune: 0.50 }
};

// --- 全局状态 ---
const AppState = {
  currentPage: 'home',
  completedModels: { skills: false, personality: false, fortune: false },
  results: { skills: null, personality: null, fortune: null },
  weights: WEIGHT_PRESETS.balanced,
  formData: {}
};

// --- 从 localStorage 恢复 ---
(function restoreState() {
  try {
    const saved = localStorage.getItem('ganyihuo_state');
    if (saved) {
      const s = JSON.parse(saved);
      AppState.completedModels = s.completedModels || AppState.completedModels;
      AppState.results = s.results || AppState.results;
      AppState.weights = s.weights || AppState.weights;
    }
    const savedAI = localStorage.getItem('ganyihuo_ai_config');
    if (savedAI) {
      aiConfig = { ...aiConfig, ...JSON.parse(savedAI) };
    }
    const savedEndpoint = localStorage.getItem('ganyihuo_api_endpoint');
    if (savedEndpoint) {
      apiConfig.endpoint = savedEndpoint;
      apiConfig.useBackend = localStorage.getItem('ganyihuo_api_use_backend') === 'true';
    }
  } catch(e) { /* ignore */ }
})();
