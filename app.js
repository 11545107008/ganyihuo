/* ========================================
   干个活儿 V6 — 应用主逻辑
   ======================================== */
(function () {
  'use strict';

  // ==================== APP 命名空间 ====================
  const app = window.app = {};

  // ==================== STORAGE ====================
  app.storage = {
    KEYS: {
      PROFILE: 'gyh_profile',
      MEMBER: 'gyh_member',
      REPORTS: 'gyh_reports',
      CURRENT_STEP: 'gyh_step',
      RESUME_UNLOCKED: 'gyh_resumes'
    },
    get(key) {
      try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : null; } catch (e) { return null; }
    },
    set(key, val) {
      try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { console.warn('Storage full:', e); }
    },
    remove(key) { localStorage.removeItem(key); }
  };

  // ==================== STATE ====================
  app.state = {
    user: { profile: null, currentTier: 'free', purchaseHistory: [] },
    assessment: { abilityScores: null, personalityScores: null, destinyScores: null, compositeScores: null, status: 'idle' },
    ui: { currentRoute: '/home', currentStep: 1, modalVisible: false },
    collectData: null,
    _listeners: {},
    on(event, fn) { (this._listeners[event] = this._listeners[event] || []).push(fn); },
    emit(event, data) { (this._listeners[event] || []).forEach(fn => fn(data)); },
    init() {
      const profile = app.storage.get(app.storage.KEYS.PROFILE);
      if (profile) this.user.profile = profile;
      const member = app.storage.get(app.storage.KEYS.MEMBER);
      if (member) { this.user.currentTier = member.tier || 'free'; this.user.purchaseHistory = member.history || []; }
    },
    saveProfile() { app.storage.set(app.storage.KEYS.PROFILE, this.user.profile); },
    saveMember() { app.storage.set(app.storage.KEYS.MEMBER, { tier: this.user.currentTier, history: this.user.purchaseHistory }); }
  };

  // ==================== ROUTER ====================
  app.router = {
    routes: { '/home': 'home', '/collect': 'collect', '/assessing': 'assessing', '/results': 'results', '/pricing': 'pricing', '/member': 'member', '/report': 'report' },
    current: '/home',
    navigate(path) {
      const route = path.replace('#', '') || '/home';
      this.current = route;
      window.location.hash = '#' + route;
      app.state.ui.currentRoute = route;
      this.render(route);
    },
    getRoute() { const h = window.location.hash; return h ? h.substring(1) : '/home'; },
    render(route) {
      document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
      document.querySelectorAll('.nav-link').forEach(l => { l.classList.toggle('active', l.dataset.route === route); });
      const pageId = 'page-' + (this.routes[route] || 'home');
      const page = document.getElementById(pageId);
      if (page) page.classList.add('active');

      switch (route) {
        case '/home': break;
        case '/collect': app.collect.init(); break;
        case '/assessing': app.assessing.run(); break;
        case '/results': app.results.render(); break;
        case '/pricing': app.pricing.render(); break;
        case '/member': app.member.render(); break;
        case '/report': app.report.render(); break;
        default: this.navigate('/home');
      }
    },
    init() {
      window.addEventListener('hashchange', () => { const r = this.getRoute(); this.navigate(r); });
      const initial = this.getRoute();
      if (initial !== '/home') this.navigate(initial);
    }
  };

  // ==================== TOAST ====================
  app.toast = {
    show(msg, type) {
      const container = document.getElementById('toast-container');
      const el = document.createElement('div');
      el.className = 'toast ' + (type || '');
      el.textContent = msg;
      container.appendChild(el);
      setTimeout(() => { el.remove(); }, 2500);
    }
  };

  // ==================== MODAL ====================
  app.modal = {
    show(content) {
      document.getElementById('modal-content').innerHTML = content;
      document.getElementById('modal-overlay').classList.add('show');
    },
    close() { document.getElementById('modal-overlay').classList.remove('show'); }
  };
  document.getElementById('modal-overlay').addEventListener('click', function(e) { if (e.target === this) app.modal.close(); });

  // ==================== PARTICLES ====================
  app.particles = {
    init() {
      const canvas = document.getElementById('particleCanvas');
      const ctx = canvas.getContext('2d');
      let particles = [];
      let animId;

      function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
      resize(); window.addEventListener('resize', resize);

      for (let i = 0; i < 80; i++) {
        particles.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, vx: (Math.random() - 0.5) * 0.5, vy: (Math.random() - 0.5) * 0.5, r: Math.random() * 2 + 1, alpha: Math.random() * 0.5 + 0.2 });
      }

      function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach((p, i) => {
          p.x += p.vx; p.y += p.vy;
          if (p.x < 0) p.x = canvas.width; if (p.x > canvas.width) p.x = 0;
          if (p.y < 0) p.y = canvas.height; if (p.y > canvas.height) p.y = 0;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(124,140,248,' + p.alpha + ')'; ctx.fill();
          // Connect close particles
          for (let j = i + 1; j < particles.length; j++) {
            const dx = p.x - particles[j].x, dy = p.y - particles[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 100) { ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(particles[j].x, particles[j].y); ctx.strokeStyle = 'rgba(124,140,248,' + (0.15 * (1 - dist / 100)) + ')'; ctx.stroke(); }
          }
        });
        animId = requestAnimationFrame(animate);
      }
      animate();
    }
  };

  // ==================== DATA: 行业库 (15大类) ====================
  app.data = {};
  app.data.industries = [
    { id: 'internet', name: '互联网/IT', subs: ['软件开发','云计算','大数据','网络安全','人工智能','物联网'], skills: { tech:35, logic:25, learn:20, creative:10, data:10 }, riasec: ['I','C','R'], wuxing: ['火','水'] },
    { id: 'ai_tech', name: 'AI/新科技', subs: ['大模型','机器学习','计算机视觉','NLP','机器人'], skills: { tech:35, logic:30, learn:15, creative:10, data:10 }, riasec: ['I','A','C'], wuxing: ['火','金'] },
    { id: 'finance', name: '金融/保险', subs: ['银行','证券','基金','保险','风投','金融科技'], skills: { logic:30, data:25, comm:15, exec:15, stress:15 }, riasec: ['C','E','I'], wuxing: ['金','土'] },
    { id: 'education', name: '教育/培训', subs: ['K12教育','高等教育','职业教育','在线教育','素质教育'], skills: { social:45, comm:25, learn:20, creative:10 }, riasec: ['S','A','I'], wuxing: ['木','火'] },
    { id: 'medical', name: '医疗/健康', subs: ['临床医疗','医药研发','医疗器械','健康管理','医美'], skills: { learn:25, stress:20, social:15, exec:10, tech:15, logic:15 }, riasec: ['I','S','R'], wuxing: ['木','水'] },
    { id: 'manufacture', name: '制造/工业', subs: ['汽车制造','电子制造','机械重工','半导体','新材料'], skills: { tech:25, exec:25, logic:20, leader:15, stress:15 }, riasec: ['R','C','I'], wuxing: ['金','土'] },
    { id: 'realestate', name: '房地产/建筑', subs: ['房地产开发','物业管理','建筑设计','装修装饰','商业地产'], skills: { comm:25, social:15, exec:20, stress:25, data:15 }, riasec: ['E','C','R'], wuxing: ['土','金'] },
    { id: 'retail', name: '零售/电商', subs: ['平台电商','直播电商','跨境电商','新零售','供应链'], skills: { data:20, comm:15, exec:20, creative:15, social:15, tech:15 }, riasec: ['E','C','A'], wuxing: ['火','水'] },
    { id: 'catering', name: '餐饮/旅游', subs: ['餐饮连锁','酒店住宿','旅游服务','民宿','会展'], skills: { social:30, exec:25, stress:25, comm:20 }, riasec: ['S','E','A'], wuxing: ['火','木'] },
    { id: 'media', name: '文化/传媒', subs: ['短视频','影视制作','广告营销','出版','演出经纪'], skills: { creative:35, comm:20, social:20, tech:15, data:10 }, riasec: ['A','S','E'], wuxing: ['火','木'] },
    { id: 'self_media', name: '自媒体/内容创业', subs: ['个人IP','知识付费','MCN','内容电商','社区运营'], skills: { creative:35, comm:15, social:15, tech:15, data:20 }, riasec: ['A','E','S'], wuxing: ['火','木'] },
    { id: 'logistics', name: '物流/交通', subs: ['快递物流','货运','航空','海运','城市配送'], skills: { exec:25, logic:20, stress:15, leader:20, tech:15, data:5 }, riasec: ['R','C','E'], wuxing: ['水','金'] },
    { id: 'energy', name: '能源/环保', subs: ['新能源','光伏','电池','环保工程','碳管理'], skills: { tech:30, logic:25, learn:15, exec:15, data:15 }, riasec: ['I','R','C'], wuxing: ['火','木'] },
    { id: 'gov', name: '政府/公共服务', subs: ['公务员','事业单位','国企','NGO','社区服务'], skills: { social:20, comm:20, exec:25, logic:15, leader:10, data:10 }, riasec: ['C','S','E'], wuxing: ['土','水'] },
    { id: 'psychology', name: '心理咨询/社工', subs: ['心理咨询','社会工作','职业咨询','婚姻家庭','儿童发展'], skills: { social:35, comm:35, learn:15, stress:10, logic:5 }, riasec: ['S','I','A'], wuxing: ['水','木'] }
  ];

  // ==================== DATA: 能力维度 ====================
  app.data.skillDims = [
    { id: 'logic', name: '逻辑分析' }, { id: 'comm', name: '沟通表达' }, { id: 'leader', name: '领导管理' },
    { id: 'creative', name: '创意设计' }, { id: 'tech', name: '技术编程' }, { id: 'data', name: '数据敏感' },
    { id: 'exec', name: '执行落地' }, { id: 'learn', name: '学习能力' }, { id: 'stress', name: '抗压适应' }, { id: 'social', name: '人际协作' }
  ];

  // ==================== DATA: 兴趣选项 ====================
  app.data.interestOptions = [
    { id: 'tech', label: '科技/互联网' }, { id: 'finance', label: '金融/投资' }, { id: 'art', label: '艺术/设计' },
    { id: 'education', label: '教育/培训' }, { id: 'health', label: '医疗/健康' }, { id: 'media', label: '传媒/内容' },
    { id: 'business', label: '商业/管理' }, { id: 'social', label: '公益/社工' }, { id: 'nature', label: '农业/环保' },
    { id: 'craft', label: '手工/制造' }, { id: 'service', label: '服务/零售' }, { id: 'law', label: '法律/政务' },
    { id: 'sport', label: '体育/户外' }, { id: 'food', label: '餐饮/美食' }, { id: 'travel', label: '旅游/酒店' }
  ];

  // ==================== DATA: 价值观选项 ====================
  app.data.valueOptions = [
    { id: 'wealth', label: '财富自由' }, { id: 'growth', label: '个人成长' }, { id: 'stability', label: '稳定安逸' },
    { id: 'impact', label: '社会影响力' }, { id: 'balance', label: '工作生活平衡' }, { id: 'autonomy', label: '自主独立' },
    { id: 'creativity', label: '创意表达' }, { id: 'belonging', label: '团队归属' }, { id: 'recognition', label: '认可与尊重' },
    { id: 'challenge', label: '挑战与刺激' }, { id: 'service', label: '助人利他' }, { id: 'innovation', label: '创新突破' }
  ];

  // ==================== DATA: 城市库 (全国主要城市) ====================
  app.data.cities = [
    { province: '北京市', cities: ['北京'] },
    { province: '上海市', cities: ['上海'] },
    { province: '天津市', cities: ['天津'] },
    { province: '重庆市', cities: ['重庆'] },
    { province: '广东省', cities: ['广州','深圳','东莞','佛山','珠海','惠州','中山','汕头','湛江','江门','肇庆','揭阳','茂名','梅州','清远','阳江','韶关','河源','潮州','汕尾'] },
    { province: '浙江省', cities: ['杭州','宁波','温州','嘉兴','金华','绍兴','台州','湖州','丽水','衢州','舟山'] },
    { province: '江苏省', cities: ['南京','苏州','无锡','常州','南通','徐州','扬州','盐城','泰州','镇江','淮安','连云港','宿迁'] },
    { province: '四川省', cities: ['成都','绵阳','德阳','宜宾','南充','泸州','达州','乐山','内江','自贡','眉山','遂宁','广安','攀枝花','广元'] },
    { province: '湖北省', cities: ['武汉','襄阳','宜昌','荆州','黄冈','孝感','十堰','荆门','黄石','咸宁','恩施','鄂州','随州'] },
    { province: '湖南省', cities: ['长沙','株洲','湘潭','衡阳','岳阳','常德','郴州','邵阳','永州','益阳','怀化','娄底','张家界'] },
    { province: '福建省', cities: ['福州','厦门','泉州','漳州','莆田','龙岩','三明','南平','宁德'] },
    { province: '山东省', cities: ['济南','青岛','烟台','潍坊','临沂','济宁','淄博','威海','德州','菏泽','聊城','泰安','东营','日照'] },
    { province: '河南省', cities: ['郑州','洛阳','南阳','许昌','周口','新乡','商丘','信阳','安阳','平顶山','开封','焦作','濮阳','漯河'] },
    { province: '河北省', cities: ['石家庄','唐山','保定','邯郸','廊坊','沧州','邢台','秦皇岛','衡水','张家口','承德'] },
    { province: '辽宁省', cities: ['沈阳','大连','鞍山','锦州','营口','盘锦','抚顺','丹东','朝阳','本溪','辽阳','葫芦岛'] },
    { province: '陕西省', cities: ['西安','咸阳','宝鸡','渭南','榆林','延安','汉中','安康'] },
    { province: '安徽省', cities: ['合肥','芜湖','马鞍山','安庆','蚌埠','滁州','阜阳','宿州','六安','亳州','淮南','宣城'] },
    { province: '江西省', cities: ['南昌','赣州','九江','宜春','上饶','吉安','抚州','景德镇','萍乡'] },
    { province: '山西省', cities: ['太原','大同','运城','临汾','晋中','长治','吕梁','阳泉','朔州','晋城'] },
    { province: '吉林省', cities: ['长春','吉林','延边','四平','通化','松原','白城','辽源','白山'] },
    { province: '黑龙江省', cities: ['哈尔滨','齐齐哈尔','大庆','牡丹江','佳木斯','绥化','鸡西','鹤岗','双鸭山','伊春','七台河','黑河'] },
    { province: '云南省', cities: ['昆明','曲靖','玉溪','大理','红河','昭通','楚雄','保山','文山','普洱'] },
    { province: '贵州省', cities: ['贵阳','遵义','毕节','六盘水','铜仁','黔南','黔东南','安顺','黔西南'] },
    { province: '广西', cities: ['南宁','柳州','桂林','玉林','北海','梧州','钦州','百色','贵港','河池'] },
    { province: '海南省', cities: ['海口','三亚','儋州'] },
    { province: '内蒙古', cities: ['呼和浩特','包头','鄂尔多斯','赤峰','通辽','呼伦贝尔','巴彦淖尔','乌兰察布'] },
    { province: '甘肃省', cities: ['兰州','天水','酒泉','庆阳','白银','武威','张掖','平凉','定西'] },
    { province: '新疆', cities: ['乌鲁木齐','克拉玛依','库尔勒','昌吉','石河子','伊犁','阿克苏','喀什'] },
    { province: '宁夏', cities: ['银川','石嘴山','吴忠','中卫','固原'] },
    { province: '青海省', cities: ['西宁','海东'] },
    { province: '西藏', cities: ['拉萨','日喀则'] }
  ];

  // ==================== DATA: 命理 — 节气表 ====================
  // 大约日期（用于月柱计算），实际需精确到小时
  app.data.solarTerms = [
    { name:'立春', month:2, day:4,  mzIdx:0 },   // 寅月
    { name:'惊蛰', month:3, day:6,  mzIdx:1 },   // 卯月
    { name:'清明', month:4, day:5,  mzIdx:2 },   // 辰月
    { name:'立夏', month:5, day:6,  mzIdx:3 },   // 巳月
    { name:'芒种', month:6, day:6,  mzIdx:4 },   // 午月
    { name:'小暑', month:7, day:7,  mzIdx:5 },   // 未月
    { name:'立秋', month:8, day:8,  mzIdx:6 },   // 申月
    { name:'白露', month:9, day:8,  mzIdx:7 },   // 酉月
    { name:'寒露', month:10,day:8,  mzIdx:8 },   // 戌月
    { name:'立冬', month:11,day:7,  mzIdx:9 },   // 亥月
    { name:'大雪', month:12,day:7,  mzIdx:10 },  // 子月
    { name:'小寒', month:1, day:6,  mzIdx:11 }   // 丑月
  ];

  // ==================== DATA: 命理 — 天干阴阳五行 ====================
  app.data.tgYinYang = [1,0,1,0,1,0,1,0,1,0]; // 甲阳1 乙阴0… 按天干索引
  app.data.tgWuXing  = [0,0,1,1,2,2,3,3,4,4]; // 0木1火2土3金4水

  // ==================== DATA: 命理 — 地支藏干表（每支1-3个藏干，含本气/中气/余气） ====================
  // 格式: [天干索引列表, 藏干强弱权重]
  app.data.zhiCangGan = {
    '子': [{tgIdx:[9],   weight:[1.0]}],
    '丑': [{tgIdx:[5,9,7], weight:[0.6,0.3,0.1]}],
    '寅': [{tgIdx:[0,2,4], weight:[0.6,0.3,0.1]}],
    '卯': [{tgIdx:[1],   weight:[1.0]}],
    '辰': [{tgIdx:[4,1,8], weight:[0.6,0.3,0.1]}],
    '巳': [{tgIdx:[2,4,6], weight:[0.6,0.3,0.1]}],
    '午': [{tgIdx:[3,5],   weight:[0.7,0.3]}],
    '未': [{tgIdx:[5,1,3], weight:[0.6,0.3,0.1]}],
    '申': [{tgIdx:[6,8,4], weight:[0.6,0.3,0.1]}],
    '酉': [{tgIdx:[7],   weight:[1.0]}],
    '戌': [{tgIdx:[4,7,3], weight:[0.6,0.3,0.1]}],
    '亥': [{tgIdx:[8,0],   weight:[0.7,0.3]}]
  };

  // ==================== DATA: 命理 — 纳音表（60甲子纳音，30组） ====================
  // 30组纳音，每组管2年
  app.data.nayin = [
    '海中金','炉中火','大林木','路旁土','剑锋金','山头火',
    '涧下水','城头土','白蜡金','杨柳木','泉中水','屋上土',
    '霹雳火','松柏木','长流水','砂中金','山下火','平地木',
    '壁上土','金箔金','覆灯火','天河水','大驿土','钗钏金',
    '桑柘木','大溪水','沙中土','天上火','石榴木','大海水'
  ];
  // 纳音五行映射: 0木,1火,2土,3金,4水
  app.data.nayinWuXing = [
    3,1,0,2,3,1,  // 海中金 炉中火 大林木 路旁土 剑锋金 山头火
    4,2,3,0,4,2,  // 涧下水 城头土 白蜡金 杨柳木 泉中水 屋上土
    1,0,4,3,1,0,  // 霹雳火 松柏木 长流水 砂中金 山下火 平地木
    2,3,1,4,2,3,  // 壁上土 金箔金 覆灯火 天河水 大驿土 钗钏金
    0,4,2,1,0,4   // 桑柘木 大溪水 沙中土 天上火 石榴木 大海水
  ];

  // ==================== DATA: 命理 — 十神关系表 ====================
  // 格局列表
  app.data.patternNames = ['正官格','七杀格','正印格','偏印格','正财格','偏财格','食神格','伤官格','建禄格','羊刃格','从强格','从弱格','化气格','专旺格'];

  // ==================== DATA: RIASEC 24题 ====================
  app.data.riasecQuestions = [
    { id:'R1', dim:'R', text:'我喜欢动手修理或组装物品'},
    { id:'R2', dim:'R', text:'我喜欢户外工作或体力活动'},
    { id:'R3', dim:'R', text:'我善于操作机器、工具或设备'},
    { id:'R4', dim:'R', text:'我喜欢建造或制作看得见摸得着的东西'},
    { id:'I1', dim:'I', text:'我喜欢研究和解决复杂问题'},
    { id:'I2', dim:'I', text:'我对科学理论和原理感兴趣'},
    { id:'I3', dim:'I', text:'我善于分析数据和发现规律'},
    { id:'I4', dim:'I', text:'我喜欢独立思考和深入学习'},
    { id:'A1', dim:'A', text:'我喜欢创作艺术、音乐或文学作品'},
    { id:'A2', dim:'A', text:'我善于用创新的方式表达想法'},
    { id:'A3', dim:'A', text:'我喜欢在非结构化环境中自由发挥'},
    { id:'A4', dim:'A', text:'我重视美感和独特的设计'},
    { id:'S1', dim:'S', text:'我喜欢帮助别人解决问题'},
    { id:'S2', dim:'S', text:'我善于倾听和理解他人的感受'},
    { id:'S3', dim:'S', text:'我喜欢教学、培训或指导他人'},
    { id:'S4', dim:'S', text:'我在团队合作中感到充满能量'},
    { id:'E1', dim:'E', text:'我喜欢领导团队达成目标'},
    { id:'E2', dim:'E', text:'我善于说服和影响他人'},
    { id:'E3', dim:'E', text:'我对商业和创业充满热情'},
    { id:'E4', dim:'E', text:'我喜欢承担风险和做决策'},
    { id:'C1', dim:'C', text:'我喜欢按规则和流程办事'},
    { id:'C2', dim:'C', text:'我善于组织和管理数据或文件'},
    { id:'C3', dim:'C', text:'我注重细节和准确性'},
    { id:'C4', dim:'C', text:'我喜欢稳定的工作环境和明确的职责'}
  ];

  // ==================== DATA: MBTI 20题 ====================
  app.data.mbtiQuestions = [
    { id:'EI1', dim:'EI', left:'喜欢与人交往，从社交中获得能量', right:'喜欢独处，从独处中获得能量', leftScore:'E', rightScore:'I' },
    { id:'EI2', dim:'EI', left:'喜欢在团队中讨论想法', right:'喜欢独自思考后再分享观点', leftScore:'E', rightScore:'I' },
    { id:'EI3', dim:'EI', left:'认识很多朋友，喜欢广泛社交', right:'有少数深交的朋友，喜欢深度交流', leftScore:'E', rightScore:'I' },
    { id:'EI4', dim:'EI', left:'边说边想，思维过程外显', right:'想好再说，思维过程内隐', leftScore:'E', rightScore:'I' },
    { id:'EI5', dim:'EI', left:'在人群中感到精力充沛', right:'独处时感到精力充沛', leftScore:'E', rightScore:'I' },
    { id:'SN1', dim:'SN', left:'更关注具体的事实和细节', right:'更关注整体模式和大局', leftScore:'S', rightScore:'N' },
    { id:'SN2', dim:'SN', left:'相信实践经验和眼见为实', right:'相信直觉和第六感', leftScore:'S', rightScore:'N' },
    { id:'SN3', dim:'SN', left:'喜欢按部就班地执行计划', right:'喜欢探索新的可能性和创意', leftScore:'S', rightScore:'N' },
    { id:'SN4', dim:'SN', left:'注重当下实际可操作的事', right:'喜欢畅想未来的可能性', leftScore:'S', rightScore:'N' },
    { id:'SN5', dim:'SN', left:'喜欢使用既有的方法解决问题', right:'喜欢发明新的方法解决问题', leftScore:'S', rightScore:'N' },
    { id:'TF1', dim:'TF', left:'做决策时优先考虑逻辑和公平', right:'做决策时优先考虑人情和和谐', leftScore:'T', rightScore:'F' },
    { id:'TF2', dim:'TF', left:'认为真理比感情更重要', right:'认为感情比真理更重要', leftScore:'T', rightScore:'F' },
    { id:'TF3', dim:'TF', left:'能客观冷静地给出批评意见', right:'担心伤害他人感受而犹豫批评', leftScore:'T', rightScore:'F' },
    { id:'TF4', dim:'TF', left:'看重效率和结果', right:'看重过程和人际关系', leftScore:'T', rightScore:'F' },
    { id:'TF5', dim:'TF', left:'喜欢直接指出问题所在', right:'喜欢用委婉的方式表达意见', leftScore:'T', rightScore:'F' },
    { id:'JP1', dim:'JP', left:'喜欢提前做好计划和安排', right:'喜欢随性而为保持灵活', leftScore:'J', rightScore:'P' },
    { id:'JP2', dim:'JP', left:'做决定后感到如释重负', right:'做决定后仍然想保留选择', leftScore:'J', rightScore:'P' },
    { id:'JP3', dim:'JP', left:'喜欢有条理和秩序的生活', right:'喜欢自由和即兴的生活', leftScore:'J', rightScore:'P' },
    { id:'JP4', dim:'JP', left:'喜欢在截止日期前完成任务', right:'喜欢在最后一刻冲刺完成', leftScore:'J', rightScore:'P' },
    { id:'JP5', dim:'JP', left:'喜欢制定详细的日程表', right:'喜欢根据当天心情决定做什么', leftScore:'J', rightScore:'P' }
  ];

  // ==================== DATA: MBTI 类型映射 ====================
  app.data.mbtiProfiles = {
    'INTJ': { name:'建筑师', desc:'战略思考者，善于制定长期计划，独立且有远见。' },
    'INTP': { name:'逻辑学家', desc:'创新思维者，喜欢探索理论和复杂系统。' },
    'ENTJ': { name:'指挥官', desc:'天生的领导者，果断、有魅力，善于组织资源实现目标。' },
    'ENTP': { name:'辩论家', desc:'思维敏捷的创新者，善于挑战现状，喜欢头脑风暴。' },
    'INFJ': { name:'提倡者', desc:'理想主义者，有深刻的洞察力，关心他人的成长。' },
    'INFP': { name:'调停者', desc:'内心丰富的创意者，重视价值观和意义。' },
    'ENFJ': { name:'主人公', desc:'富有魅力的领导者，善于激励和培养他人。' },
    'ENFP': { name:'竞选者', desc:'热情洋溢的社交家，善于发现可能性和连接人。' },
    'ISTJ': { name:'物流师', desc:'务实可靠，注重事实和细节，喜欢有序的环境。' },
    'ISFJ': { name:'守卫者', desc:'忠诚的保护者，细心周到，善于照顾他人。' },
    'ESTJ': { name:'总经理', desc:'高效的管理者，重视规则和传统，善于组织执行。' },
    'ESFJ': { name:'执政官', desc:'热情的服务者，善于社交，重视和谐与合作。' },
    'ISTP': { name:'鉴赏家', desc:'务实的分析者，喜欢动手操作和解决实际问题。' },
    'ISFP': { name:'探险家', desc:'灵活的艺术家，重视审美和个人体验。' },
    'ESTP': { name:'企业家', desc:'充满活力的冒险者，善于即兴发挥和抓住机会。' },
    'ESFP': { name:'表演者', desc:'天生的娱乐家，热爱生活和关注当下。' }
  };

  // ==================== DATA: 职业映射 (RIASEC → 推荐职业) ====================
  app.data.riasecCareerMap = {
    'R': ['机械工程师','电子工程师','建筑工人','电工','汽车维修技师','飞行员','消防员','农艺师','质检员','测绘工程师'],
    'I': ['数据科学家','AI研究员','软件工程师','生物研究员','医生','化学分析师','统计分析师','网络安全专家','药物研究员','算法工程师'],
    'A': ['UI/UX设计师','平面设计师','摄影师','作家','音乐制作人','导演','服装设计师','插画师','室内设计师','视频剪辑师'],
    'S': ['教师','心理咨询师','社会工作师','护士','人力资源','职业顾问','社区工作者','语言治疗师','儿科医生','客服经理'],
    'E': ['CEO/总裁','销售总监','市场经理','创业合伙人','投资经理','产品经理','律师','房地产经纪人','金融顾问','公关经理'],
    'C': ['会计师','审计师','银行柜员','行政经理','数据分析师','图书管理员','物流经理','合规专员','档案管理员','预算分析师']
  };

  // ==================== DATA: 岗位数据库 (300+) ====================
  app.data.jobsList = [];
  (function buildJobs() {
    const jobMap = {
      internet: [
        { title:'前端开发工程师', salary:'12-30K', exp:'1-3年', edu:'本科', skills:['JavaScript','React','Vue','HTML/CSS'] },
        { title:'后端开发工程师', salary:'15-35K', exp:'1-5年', edu:'本科', skills:['Java','Python','Go','微服务'] },
        { title:'全栈开发工程师', salary:'15-40K', exp:'2-5年', edu:'本科', skills:['Node.js','React','数据库','云服务'] },
        { title:'测试工程师', salary:'10-25K', exp:'1-3年', edu:'本科', skills:['自动化测试','性能测试','Selenium'] },
        { title:'运维工程师', salary:'12-28K', exp:'2-5年', edu:'本科', skills:['Linux','Docker','K8s','CI/CD'] },
        { title:'产品经理', salary:'15-35K', exp:'2-5年', edu:'本科', skills:['需求分析','原型设计','数据分析','沟通'] },
        { title:'UI设计师', salary:'10-25K', exp:'1-3年', edu:'本科', skills:['Figma','Sketch','视觉设计','交互设计'] },
        { title:'数据分析师', salary:'12-30K', exp:'1-5年', edu:'本科', skills:['SQL','Python','Tableau','统计学'] },
      ],
      ai_tech: [
        { title:'AI算法工程师', salary:'25-60K', exp:'2-5年', edu:'硕士', skills:['深度学习','PyTorch','TensorFlow','NLP'] },
        { title:'机器学习工程师', salary:'20-50K', exp:'2-5年', edu:'硕士', skills:['ML','Python','特征工程','模型部署'] },
        { title:'NLP工程师', salary:'25-55K', exp:'2-5年', edu:'硕士', skills:['NLP','Transformer','LLM','Prompt工程'] },
        { title:'计算机视觉工程师', salary:'25-55K', exp:'2-5年', edu:'硕士', skills:['CV','CNN','目标检测','图像处理'] },
        { title:'AI产品经理', salary:'20-40K', exp:'3-5年', edu:'本科', skills:['AI知识','产品设计','数据分析'] },
      ],
      finance: [
        { title:'投资分析师', salary:'15-35K', exp:'1-3年', edu:'本科', skills:['财务分析','估值建模','行业研究'] },
        { title:'风险管理师', salary:'15-30K', exp:'2-5年', edu:'本科', skills:['风险评估','量化模型','FRM'] },
        { title:'理财顾问', salary:'10-30K', exp:'1-3年', edu:'本科', skills:['理财规划','保险知识','客户沟通'] },
        { title:'信贷审核员', salary:'8-20K', exp:'1-3年', edu:'本科', skills:['信贷分析','风控','征信'] },
        { title:'保险精算师', salary:'20-50K', exp:'3-5年', edu:'本科', skills:['精算模型','概率统计','SOA'] },
      ],
      education: [
        { title:'中小学教师', salary:'6-15K', exp:'0-3年', edu:'本科', skills:['教学','课堂管理','学科知识'] },
        { title:'培训讲师', salary:'8-20K', exp:'1-5年', edu:'本科', skills:['演讲','课件设计','成人教育'] },
        { title:'在线教育运营', salary:'8-18K', exp:'1-3年', edu:'本科', skills:['用户运营','社群运营','转化'] },
        { title:'课程设计师', salary:'10-25K', exp:'2-5年', edu:'本科', skills:['教学设计','内容开发','学习理论'] },
      ],
      medical: [
        { title:'临床医生', salary:'15-40K', exp:'3-10年', edu:'硕士', skills:['临床诊断','手术技能','医患沟通'] },
        { title:'护士', salary:'6-15K', exp:'0-5年', edu:'大专', skills:['护理操作','患者管理','急救'] },
        { title:'医药代表', salary:'8-20K', exp:'1-3年', edu:'本科', skills:['医药知识','销售技巧','客户管理'] },
        { title:'健康管理师', salary:'7-15K', exp:'1-3年', edu:'大专', skills:['营养学','运动康复','慢病管理'] },
      ],
      manufacture: [
        { title:'机械设计工程师', salary:'10-25K', exp:'2-5年', edu:'本科', skills:['CAD','SolidWorks','机械原理'] },
        { title:'电气工程师', salary:'10-25K', exp:'2-5年', edu:'本科', skills:['PLC','电气设计','自动化'] },
        { title:'质量工程师', salary:'8-18K', exp:'1-5年', edu:'本科', skills:['QC','六西格玛','ISO体系'] },
        { title:'生产主管', salary:'10-20K', exp:'3-8年', edu:'大专', skills:['生产管理','5S','精益生产'] },
      ],
      realestate: [
        { title:'房产经纪人', salary:'6-30K', exp:'0-3年', edu:'大专', skills:['销售','谈判','房产知识'] },
        { title:'建筑设计师', salary:'12-30K', exp:'2-5年', edu:'本科', skills:['CAD','BIM','建筑设计'] },
        { title:'物业经理', salary:'8-18K', exp:'3-8年', edu:'大专', skills:['物业管理','客户服务','设施管理'] },
        { title:'室内设计师', salary:'8-25K', exp:'1-5年', edu:'大专', skills:['室内设计','3DMax','软装搭配'] },
      ],
      retail: [
        { title:'电商运营', salary:'8-20K', exp:'1-3年', edu:'大专', skills:['淘宝/京东运营','数据分析','推广'] },
        { title:'直播运营', salary:'10-30K', exp:'1-3年', edu:'大专', skills:['直播策划','流量投放','数据分析'] },
        { title:'跨境电商运营', salary:'10-25K', exp:'1-3年', edu:'本科', skills:['亚马逊/速卖通','英语','供应链'] },
        { title:'采购经理', salary:'12-25K', exp:'3-5年', edu:'本科', skills:['供应商管理','谈判','成本控制'] },
      ],
      catering: [
        { title:'餐厅经理', salary:'8-18K', exp:'3-5年', edu:'大专', skills:['餐饮管理','成本控制','团队管理'] },
        { title:'酒店大堂经理', salary:'8-20K', exp:'2-5年', edu:'大专', skills:['酒店管理','客户服务','英语'] },
        { title:'旅游产品经理', salary:'8-18K', exp:'1-3年', edu:'本科', skills:['旅游产品设计','OTA运营'] },
        { title:'厨师长', salary:'10-25K', exp:'5-10年', edu:'中专', skills:['烹饪技术','厨房管理','菜品研发'] },
      ],
      media: [
        { title:'新媒体运营', salary:'8-20K', exp:'1-3年', edu:'本科', skills:['内容策划','排版','数据分析'] },
        { title:'短视频编导', salary:'10-25K', exp:'1-3年', edu:'本科', skills:['脚本撰写','拍摄剪辑','热点运营'] },
        { title:'广告策划', salary:'10-25K', exp:'2-5年', edu:'本科', skills:['创意策划','文案撰写','品牌营销'] },
        { title:'影视后期', salary:'8-20K', exp:'1-3年', edu:'大专', skills:['PR','AE','达芬奇','剪辑'] },
      ],
      self_media: [
        { title:'KOL/博主', salary:'5-100K', exp:'0-3年', edu:'不限', skills:['内容创作','个人IP','粉丝运营'] },
        { title:'知识付费运营', salary:'10-25K', exp:'1-3年', edu:'本科', skills:['课程设计','社群运营','转化'] },
        { title:'MCN运营', salary:'8-20K', exp:'1-3年', edu:'大专', skills:['达人管理','商业对接','数据分析'] },
      ],
      logistics: [
        { title:'物流经理', salary:'10-22K', exp:'3-5年', edu:'本科', skills:['物流管理','仓储配送','成本控制'] },
        { title:'供应链分析师', salary:'10-25K', exp:'1-5年', edu:'本科', skills:['供应链','数据分析','ERP'] },
        { title:'快递站长', salary:'7-15K', exp:'1-3年', edu:'大专', skills:['站点管理','人员调度','时效管理'] },
      ],
      energy: [
        { title:'新能源工程师', salary:'12-30K', exp:'2-5年', edu:'本科', skills:['光伏','风电','储能技术'] },
        { title:'碳管理顾问', salary:'15-35K', exp:'3-5年', edu:'本科', skills:['碳核算','碳中和','ESG'] },
        { title:'环保工程师', salary:'10-25K', exp:'2-5年', edu:'本科', skills:['环境工程','环评','污水处理'] },
      ],
      gov: [
        { title:'公务员', salary:'5-15K', exp:'0-5年', edu:'本科', skills:['公文写作','行政能力','政策理解'] },
        { title:'事业编/教师', salary:'5-12K', exp:'0-5年', edu:'本科', skills:['教学','科研','服务意识'] },
        { title:'社工', salary:'4-10K', exp:'0-3年', edu:'大专', skills:['社会服务','沟通协调','同理心'] },
      ],
      psychology: [
        { title:'心理咨询师', salary:'8-25K', exp:'2-5年', edu:'硕士', skills:['心理评估','咨询技术','共情'] },
        { title:'职业规划师', salary:'8-20K', exp:'2-5年', edu:'本科', skills:['职业测评','生涯规划','面试辅导'] },
        { title:'婚姻家庭咨询师', salary:'7-18K', exp:'2-5年', edu:'本科', skills:['婚姻咨询','家庭治疗','沟通'] },
      ]
    };

    // Build full job list with all cities
    const topCities = ['北京','上海','广州','深圳','杭州','成都','武汉','南京','苏州','西安','重庆','天津','长沙','郑州','青岛','合肥','厦门','宁波','大连','沈阳','哈尔滨'];
    Object.keys(jobMap).forEach(indId => {
      jobMap[indId].forEach(j => {
        topCities.forEach(city => {
          app.data.jobsList.push({
            id: indId + '_' + j.title + '_' + city,
            title: j.title,
            industry: indId,
            city: city,
            salary: j.salary,
            experience: j.exp,
            education: j.edu,
            skills: j.skills,
            type: '全职'
          });
        });
      });
    });
  })();

  // ==================== DATA: 简历模板 ====================
  app.data.resumeTemplates = [
    { id:'t1', name:'简约商务风', desc:'干净利落的线条设计，适合金融、互联网、管理岗位', icon:'📄' },
    { id:'t2', name:'创意设计风', desc:'色彩活泼的创意排版，适合设计、传媒、市场营销岗位', icon:'🎨' },
    { id:'t3', name:'经典学术风', desc:'严谨规范的学术排版，适合教育、科研、医疗岗位', icon:'📚' },
    { id:'t4', name:'极简现代风', desc:'极简主义设计，适合科技、创业、咨询岗位', icon:'💼' },
    { id:'t5', name:'双栏精英风', desc:'双栏布局突出技能与成就，适合中高级管理者', icon:'⭐' }
  ];

  // ==================== 八字计算引擎（精确版） ====================
  app.engines = {};
  app.engines.bazi = {
    tianGan: ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'],
    diZhi: ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'],
    wuXingMap: { '甲':'木','乙':'木','丙':'火','丁':'火','戊':'土','己':'土','庚':'金','辛':'金','壬':'水','癸':'水' },
    zhiWuXing: { '子':'水','丑':'土','寅':'木','卯':'木','辰':'土','巳':'火','午':'火','未':'土','申':'金','酉':'金','戌':'土','亥':'水' },
    shengXiaoMap: ['鼠','牛','虎','兔','龙','蛇','马','羊','猴','鸡','狗','猪'],
    wuXingNames: ['木','火','土','金','水'],

    // 儒略日精确计算（公历日期→儒略日）
    _julianDay(y, m, d) {
      if (m <= 2) { y--; m += 12; }
      let A = Math.floor(y / 100);
      let B = 2 - A + Math.floor(A / 4);
      return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5;
    },

    // 获取节气对应的月支索引（0=寅...11=丑）
    _getMonthZhiIdx(y, m, d) {
      // 判断是否在某节气之前，是则用上一个月支
      const terms = app.data.solarTerms;
      for (let i = terms.length - 1; i >= 0; i--) {
        const t = terms[i];
        if (m > t.month || (m === t.month && d >= t.day)) {
          return t.mzIdx;
        }
      }
      return 11; // 小寒之前属丑月
    },

    // 获取出生日到最近节气的天数（用于大运起运年龄）
    _daysToNearestTerm(y, m, d) {
      const jd = this._julianDay(y, m, d);
      const terms = app.data.solarTerms;
      let minDiff = Infinity;
      for (let t of terms) {
        const tj = this._julianDay(y, t.month, t.day);
        const diff = Math.abs(tj - jd);
        if (diff < minDiff) minDiff = diff;
      }
      return minDiff;
    },

    calc(year, month, day, hour, gender) {
      // hour: 0-23, 转为时辰索引 0=子时(23-1) ... 11=亥时(21-23)
      let hIdx = Math.floor((hour + 1) % 24 / 2);

      // 1. 年柱
      let yGIdx = (year - 4) % 10;
      if (yGIdx < 0) yGIdx += 10;
      let yZIdx = (year - 4) % 12;
      if (yZIdx < 0) yZIdx += 12;

      // 2. 月柱（按节气）
      let mZIdx = this._getMonthZhiIdx(year, month, day);
      let mGIdx = (yGIdx * 2 + mZIdx) % 10;

      // 3. 日柱（精确儒略日公式）
      const jd = this._julianDay(year, month, day);
      // 日干支序号 = (儒略日 + 9) % 60，匹配已知基准
      let gzIdx = Math.round(jd + 9) % 60;
      if (gzIdx < 0) gzIdx += 60;
      let dGIdx = gzIdx % 10;
      let dZIdx = gzIdx % 12;

      // 4. 时柱（五鼠遁）
      let hGIdx = (dGIdx * 2 + hIdx) % 10;

      let riGan = this.tianGan[dGIdx];
      let riZhi = this.diZhi[dZIdx];
      let riWuXing = this.wuXingMap[riGan];

      // 干支组合60甲子序号 → 纳音组（每组2个干支）
      let yearGZIdx = (yGIdx % 10) * 12 + yZIdx;
      // 简化：年干支 60甲子序号 = yGIdx*12 + yZIdx（但天干周期10，地支周期12）
      // 更准确：按 (yGIdx + yZIdx) 的模组合
      yearGZIdx = ((yGIdx % 10) * 12 + (yZIdx % 12)) % 60;
      let dayGZIdx = gzIdx % 60;
      let niY = Math.floor(yearGZIdx / 2);
      let niD = Math.floor(dayGZIdx / 2);
      let nayinYear = app.data.nayin[niY] || '未知';
      let nayinDay = app.data.nayin[niD] || '未知';
      let nayinYearWX = app.data.nayinWuXing[niY];
      let nayinDayWX = app.data.nayinWuXing[niD];

      // 藏干
      let cgYear = app.data.zhiCangGan[this.diZhi[yZIdx]];
      let cgMonth = app.data.zhiCangGan[this.diZhi[mZIdx]];
      let cgDay = app.data.zhiCangGan[riZhi];
      let cgHour = app.data.zhiCangGan[this.diZhi[hIdx]];

      return {
        year: year, month: month, day: day, hour: hour, gender: gender,
        pillars: {
          year:  { gan: this.tianGan[yGIdx], zhi: this.diZhi[yZIdx], gIdx: yGIdx, zIdx: yZIdx },
          month: { gan: this.tianGan[mGIdx], zhi: this.diZhi[mZIdx], gIdx: mGIdx, zIdx: mZIdx },
          day:   { gan: riGan, zhi: riZhi, gIdx: dGIdx, zIdx: dZIdx },
          hour:  { gan: this.tianGan[hGIdx], zhi: this.diZhi[hIdx], gIdx: hGIdx, zIdx: hIdx }
        },
        riGan: riGan, riZhi: riZhi, riWuXing: riWuXing,
        riGanIdx: dGIdx, riZhiIdx: dZIdx,
        shengXiao: this.shengXiaoMap[yZIdx],
        baziString: this.tianGan[yGIdx] + this.diZhi[yZIdx] + ' ' + this.tianGan[mGIdx] + this.diZhi[mZIdx] + ' ' + riGan + riZhi + ' ' + this.tianGan[hGIdx] + this.diZhi[hIdx],
        nayin: { year: nayinYear, day: nayinDay, yearWX: nayinYearWX, dayWX: nayinDayWX },
        cangGan: { year: cgYear, month: cgMonth, day: cgDay, hour: cgHour },
        yearGZIdx: yearGZIdx, dayGZIdx: dayGZIdx,
        _getMonthZhiIdx: this._getMonthZhiIdx.bind(this),
        _daysToNearestTerm: this._daysToNearestTerm.bind(this)
      };
    }
  };

  // ==================== 能力适配引擎 ====================
  app.engines.ability = {
    calc(profile) {
      const scores = {};
      app.data.industries.forEach(ind => {
        let total = 0, weightSum = 0;
        Object.keys(ind.skills).forEach(skillId => {
          const w = ind.skills[skillId];
          const userScore = (profile.selfAssessment && profile.selfAssessment.skillScores && profile.selfAssessment.skillScores[skillId]) || 0;
          total += userScore * w;
          weightSum += w;
        });
        let score = weightSum > 0 ? (total / weightSum) * 10 : 50; // Convert to 0-100

        // Experience bonus
        if (profile.experience && profile.experience.history) {
          const hasExperience = profile.experience.history.some(h => {
            const indData = app.data.industries.find(i => i.id === ind.id);
            return indData && indData.subs.some(s => (h.industry || '').includes(s));
          });
          if (hasExperience) score += 10;
          const yrs = profile.experience.totalYears || 0;
          if (yrs > 10) score += 10;
          else if (yrs > 5) score += 8;
          else if (yrs > 2) score += 5;
        }

        scores[ind.id] = Math.min(Math.round(score), 100);
      });
      return scores;
    }
  };

  // ==================== 性格匹配引擎 ====================
  app.engines.personality = {
    calcRIASEC(answers) {
      const dimScores = { R:0, I:0, A:0, S:0, E:0, C:0 };
      app.data.riasecQuestions.forEach(q => {
        dimScores[q.dim] += (answers[q.id] || 0);
      });
      Object.keys(dimScores).forEach(d => { dimScores[d] = Math.round((dimScores[d] / 20) * 100); });
      // Holland Code (top 3)
      const sorted = Object.entries(dimScores).sort((a,b) => b[1] - a[1]);
      const hollandCode = sorted.slice(0,3).map(e => e[0]).join('');
      return { scores: dimScores, hollandCode, topTypes: sorted.slice(0,2).map(e => ({ type: e[0], score: e[1] })) };
    },

    calcMBTI(answers) {
      let EI = 0, SN = 0, TF = 0, JP = 0;
      app.data.mbtiQuestions.forEach(q => {
        const val = answers[q.id];
        if (val === q.leftScore) { if (q.dim === 'EI') EI++; else if (q.dim === 'SN') SN++; else if (q.dim === 'TF') TF++; else if (q.dim === 'JP') JP++; }
      });
      const type = (EI >= 3 ? 'E' : 'I') + (SN >= 3 ? 'S' : 'N') + (TF >= 3 ? 'T' : 'F') + (JP >= 3 ? 'J' : 'P');
      return { type, dimScores: { EI: Math.round((EI/5)*100), SN: Math.round((SN/5)*100), TF: Math.round((TF/5)*100), JP: Math.round((JP/5)*100) }, profile: app.data.mbtiProfiles[type] || { name:'未知', desc:'' } };
    },

    calcIndustryMatch(riasecScores) {
      const scores = {};
      app.data.industries.forEach(ind => {
        let total = 0;
        ind.riasec.forEach(r => { total += (riasecScores[r] || 0); });
        scores[ind.id] = Math.round(total / ind.riasec.length);
      });
      return scores;
    }
  };

  // ==================== 命理引擎（专业版：十神/格局/用神/大运） ====================
  app.engines.destiny = {
    // 十神名称对照
    _shishenNames: ['比肩','劫财','食神','伤官','偏财','正财','七杀','正官','偏印','正印'],
    // 十神简码：0比肩1劫财2食神3伤官4偏财5正财6七杀7正官8偏印9正印

    // 计算两个天干之间的十神关系
    _getShiShen(riGanIdx, otherGanIdx) {
      const tgYinYang = app.data.tgYinYang;
      const tgWX = app.data.tgWuXing;
      const riWX = tgWX[riGanIdx];
      const riYY = tgYinYang[riGanIdx];
      const otWX = tgWX[otherGanIdx];
      const otYY = tgYinYang[otherGanIdx];

      const sameYX = (riYY === otYY); // 同阴阳?

      if (riWX === otWX) {
        // 同五行：比肩（同阴阳）或劫财（异阴阳）
        return sameYX ? 0 : 1;
      }
      // 生克关系：木→火→土→金→水→木
      const shengSeq = [0,1,2,3,4]; // 木火土金水
      const riPos = shengSeq.indexOf(riWX);
      const otPos = shengSeq.indexOf(otWX);

      // other 生 ri → 印星
      if ((otPos + 1) % 5 === riPos) {
        return sameYX ? 9 : 8; // 正印(同阴阳) 偏印(异阴阳) — 实际：生我者，同阴阳为偏印(9)，异阴阳为正印(8)
      }
      // ri 生 other → 食伤
      if ((riPos + 1) % 5 === otPos) {
        return sameYX ? 2 : 3; // 食神(同阴阳) 伤官(异阴阳)
      }
      // other 克 ri → 官杀
      if ((otPos + 2) % 5 === riPos || (otPos + 2) % 5 === riPos) {
        // 克我者：同阴阳为七杀(6)，异阴阳为正官(7)
        return sameYX ? 6 : 7;
      }
      // ri 克 other → 财星
      // 我克者：同阴阳为偏财(4)，异阴阳为正财(5)
      return sameYX ? 4 : 5;
    },

    // 计算完整十神表
    _calcShiShenTable(baziResult) {
      const p = baziResult.pillars;
      const riGanIdx = p.day.gIdx;
      return {
        year: { gan: this._getShiShen(riGanIdx, p.year.gIdx), name: this._shishenNames[this._getShiShen(riGanIdx, p.year.gIdx)] },
        month: { gan: this._getShiShen(riGanIdx, p.month.gIdx), name: this._shishenNames[this._getShiShen(riGanIdx, p.month.gIdx)] },
        day: { gan: 0, name: '日主' },
        hour: { gan: this._getShiShen(riGanIdx, p.hour.gIdx), name: this._shishenNames[this._getShiShen(riGanIdx, p.hour.gIdx)] }
      };
    },

    // 统计八字五行旺衰（天干+地支+藏干加权）
    _calcWuxingStrength(baziResult) {
      const strength = { '木':0, '火':0, '土':0, '金':0, '水':0 };
      const wuXingName = ['木','火','土','金','水'];

      const pillars = ['year','month','day','hour'];
      pillars.forEach(pk => {
        const p = baziResult.pillars[pk];
        // 天干权重 1.0
        const tgWX = app.data.tgWuXing[p.gIdx];
        strength[wuXingName[tgWX]] += 1.0;

        // 地支五行（天干化出的五行）
        const zhiWXName = baziResult.zhiWuXing[p.zhi];
        strength[zhiWXName] += 1.0;

        // 藏干加权
        const cgData = baziResult.cangGan[pk];
        if (cgData && cgData.length > 0) {
          const cg = cgData[0];
          cg.tgIdx.forEach((tgIdx, i) => {
            const wx = app.data.tgWuXing[tgIdx];
            strength[wuXingName[wx]] += (cg.weight[i] || 0.3) * 0.5;
          });
        }
      });

      return strength;
    },

    // 判断日主强弱
    _judgeStrength(baziResult, wxStrength) {
      const wuXingName = ['木','火','土','金','水'];
      const riWX = baziResult.riWuXing;
      const riWXIdx = wuXingName.indexOf(riWX);

      // 月令权重 — 月支五行对日主的影响最大
      const monthZhiWX = baziResult.zhiWuXing[baziResult.pillars.month.zhi];
      const isMonthSupport = (monthZhiWX === riWX); // 月令与日主同五行
      // 生我关系：月令生我
      const shengSeq = [0,1,2,3,4]; // 木火土金水
      const monthWXIdx = shengSeq.indexOf(wuXingName.indexOf(monthZhiWX));
      const riIdx = shengSeq.indexOf(wuXingName.indexOf(riWX));
      // 修正：用正确的索引
      const mWIdx = wuXingName.indexOf(monthZhiWX);
      // 生我：(mWIdx + 1) % 5 === riWXIdx 表示前一个生后一个
      // 木生火(0→1), 火生土(1→2), 土生金(2→3), 金生水(3→4), 水生木(4→0)
      const isMonthShengRi = ((mWIdx + 1) % 5) === riWXIdx;

      const myStrength = wxStrength[riWX] || 0;
      const totalStrength = Object.values(wxStrength).reduce((a,b) => a+b, 0);
      const ratio = totalStrength > 0 ? myStrength / totalStrength : 0.2;

      let label;
      if (ratio >= 0.35 && isMonthSupport) label = '强';
      else if (ratio >= 0.35 && isMonthShengRi) label = '偏强';
      else if (ratio <= 0.15) label = '弱';
      else if (ratio <= 0.22) label = '偏弱';
      else label = '中和';

      return { label, ratio, monthSupport: isMonthSupport, monthShengRi: isMonthShengRi };
    },

    // 计算喜用神
    _calcYongShen(strengthResult, baziResult) {
      const wuXingName = ['木','火','土','金','水'];
      const riWXIdx = wuXingName.indexOf(baziResult.riWuXing);

      // 扶抑法则
      let xiShen = [], yongShen = [], jiShen = [];
      const label = strengthResult.label;

      if (label === '强' || label === '偏强') {
        // 日主强 → 喜克泄耗
        // 克：克日主的五行 (riWXIdx + 2) % 5
        // 泄：日主生的五行 (riWXIdx + 1) % 5
        // 耗：日主克的五行 (riWXIdx + 3) % 5  — 实际：木克土(0→2)，土是木克的
        // 正确的关系链：我克 = (riIdx + 2) % 5，克我 = (riIdx + 4) % 5 或 (riIdx - 1 + 5) % 5
        // 木(0)克土(2): (0+2)%5=2；火(1)克金(3): (1+2)%5=3；土(2)克水(4): (2+2)%5=4；金(3)克木(0): (3+2)%5=0；水(4)克火(1): (4+2)%5=1 ✓
        const keIdx = (riWXIdx + 2) % 5; // 我克的
        const xieIdx = (riWXIdx + 1) % 5; // 我生的
        // 克我者
        const beiKeIdx = (riWXIdx + 3) % 5;
        // 重新确认：克我者应该是 (riIdx -2 +5)%5 即 (riIdx+3)%5
        // 木(0)被金克→金(3):(0+3)%5=3✓；火(1)被水克→水(4):(1+3)%5=4✓；土(2)被木克→木(0):(2+3)%5=0✓
        yongShen = [wuXingName[xieIdx], wuXingName[keIdx]];  // 用神：泄+克
        xiShen = [wuXingName[beiKeIdx]];                       // 喜神：克我
        jiShen = [wuXingName[riWXIdx]];                        // 忌神：比劫（再加印星）
        // 印星 = 生我者
        const shengIdx = (riWXIdx + 4) % 5; // (riIdx-1+5)%5
        jiShen.push(wuXingName[shengIdx]);
      } else if (label === '弱' || label === '偏弱') {
        // 日主弱 → 喜生扶
        const beiKeIdx = (riWXIdx + 3) % 5; // 克我 = 忌
        const xieIdx = (riWXIdx + 1) % 5;   // 我生 = 忌
        const shengIdx = (riWXIdx + 4) % 5;  // 生我 = 喜/用
        yongShen = [wuXingName[riWXIdx]];      // 用神：比劫
        xiShen = [wuXingName[shengIdx]];       // 喜神：印星
        jiShen = [wuXingName[beiKeIdx], wuXingName[xieIdx]]; // 忌神
      } else {
        // 中和 — 以通关为主
        yongShen = [wuXingName[(riWXIdx + 1) % 5]];
        xiShen = [wuXingName[riWXIdx]];
        jiShen = [];
      }

      return { yongShen, xiShen, jiShen, label };
    },

    // 计算格局
    _calcPattern(baziResult) {
      const monthZhi = baziResult.pillars.month.zhi;
      const monthGanIdx = baziResult.pillars.month.gIdx;
      const riGanIdx = baziResult.pillars.day.gIdx;

      const shishen = this._getShiShen(riGanIdx, monthGanIdx);
      const shishenName = this._shishenNames[shishen];

      // 月支是否为日主临官/帝旺
      const riWX = baziResult.riWuXing;
      const zhiToWX = { '子':'水','丑':'土','寅':'木','卯':'木','辰':'土','巳':'火','午':'火','未':'土','申':'金','酉':'金','戌':'土','亥':'水' };
      const monthWX = zhiToWX[monthZhi];
      const isTongWX = (monthWX === riWX);

      // 根据月令十神判断格局
      const patternMap = {
        0: '建禄格',   // 月令比肩 → 建禄格
        1: '羊刃格',   // 月令劫财 → 羊刃格（帝旺）
        2: '食神格',   // 月令食神
        3: '伤官格',   // 月令伤官
        4: '偏财格',   // 月令偏财
        5: '正财格',   // 月令正财
        6: '七杀格',   // 月令七杀
        7: '正官格',   // 月令正官
        8: '偏印格',   // 月令偏印
        9: '正印格'    // 月令正印
      };

      let pattern = patternMap[shishen] || '普通格';
      let patternDesc = '';

      // 特殊格局判断
      const wxStrength = this._calcWuxingStrength(baziResult);
      const wxArr = ['木','火','土','金','水'];
      const riWXVal = wxStrength[riWX] || 0;
      const totalWX = Object.values(wxStrength).reduce((a,b)=>a+b,0);
      const riRatio = totalWX > 0 ? riWXVal / totalWX : 0;

      if (riRatio > 0.5) {
        pattern = '从强格';
        patternDesc = '日主极旺，五行独大，顺势而为，宜从强';
      } else if (riRatio < 0.1 && totalWX > 0) {
        pattern = '从弱格';
        patternDesc = '日主极弱，宜弃命从势，顺势而行';
      } else {
        patternDesc = '以月令取格，' + pattern;
      }

      return { pattern, patternDesc, shishenMonth: shishenName };
    },

    // 计算大运
    _calcDayun(baziResult) {
      const yearGanIdx = baziResult.pillars.year.gIdx;
      const tgYinYang = app.data.tgYinYang;
      const gender = baziResult.gender || 'male';
      const isYangNian = (tgYinYang[yearGanIdx] === 1); // 1=阳年

      // 顺排还是逆排
      const forward = (isYangNian && gender === 'male') || (!isYangNian && gender === 'female');

      // 起运年龄
      const daysToTerm = baziResult._daysToNearestTerm(baziResult.year, baziResult.month, baziResult.day);
      const startAge = Math.round((daysToTerm / 3) * 10) / 10; // 3天=1岁

      // 排大运（前8步），每步10年
      const dayun = [];
      const mGIdx = baziResult.pillars.month.gIdx;
      const mZIdx = baziResult.pillars.month.zIdx;

      for (let i = 0; i < 8; i++) {
        const step = i + 1;
        let gIdx, zIdx;
        if (forward) {
          gIdx = (mGIdx + step) % 10;
          zIdx = (mZIdx + step) % 12;
        } else {
          gIdx = (mGIdx - step + 100) % 10;
          zIdx = (mZIdx - step + 120) % 12;
        }
        dayun.push({
          step,
          ganZhi: app.engines.bazi.tianGan[gIdx] + app.engines.bazi.diZhi[zIdx],
          gIdx, zIdx,
          startAge: Math.round((startAge + (step - 1) * 10) * 10) / 10,
          endAge: Math.round((startAge + step * 10) * 10) / 10
        });
      }

      return { startAge, forward, dayun };
    },

    // 升级后的行业匹配（用神为核心）
    _calcIndustryScores(baziResult, yongShenResult) {
      const scores = {};
      const yongShen = yongShenResult.yongShen || [];
      const xiShen = yongShenResult.xiShen || [];
      const jiShen = yongShenResult.jiShen || [];

      app.data.industries.forEach(ind => {
        let score = 50; // 基础分

        // 用神匹配（权重60%）
        const indWX = ind.wuxing || [];
        let yongMatch = 0;
        indWX.forEach(wx => {
          if (yongShen.includes(wx)) yongMatch += 2;
          else if (xiShen.includes(wx)) yongMatch += 1;
          else if (jiShen.includes(wx)) yongMatch -= 1;
        });
        score += yongMatch * 12;

        // 日主五行匹配（权重25%）
        const riWX = baziResult.riWuXing;
        if (indWX.includes(riWX)) score += 8;

        // 纳音参考（权重15%）
        const nayinWXIdx = baziResult.nayin.dayWX;
        if (nayinWXIdx !== undefined && indWX.includes(['木','火','土','金','水'][nayinWXIdx])) {
          score += 5;
        }

        scores[ind.id] = Math.min(Math.max(Math.round(score), 20), 100);
      });

      return scores;
    },

    calc(profile) {
      if (!profile.bazi || !profile.bazi.birthDate) return null;
      const bd = profile.bazi.birthDate;
      // 性别从个人信息或命理信息取
      const gender = (profile.basic && profile.basic.gender) || (profile.bazi && profile.bazi.gender) || 'male';

      // 1. 精确八字排盘
      const result = app.engines.bazi.calc(bd.year, bd.month, bd.day, bd.hour || 12, gender);

      // 2. 十神计算
      const shishenTable = this._calcShiShenTable(result);

      // 3. 五行旺衰
      const wxStrength = this._calcWuxingStrength(result);

      // 4. 日主强弱
      const strengthResult = this._judgeStrength(result, wxStrength);

      // 5. 喜用神
      const yongShenResult = this._calcYongShen(strengthResult, result);

      // 6. 格局
      const patternResult = this._calcPattern(result);

      // 7. 大运
      const dayunResult = this._calcDayun(result);

      // 8. 行业匹配
      const scores = this._calcIndustryScores(result, yongShenResult);

      return {
        baziResult: result,
        shishenTable,
        wxStrength,
        strengthResult,
        yongShenResult,
        patternResult,
        dayunResult,
        scores
      };
    }
  };

  // ==================== 综合评分引擎 ====================
  app.engines.composite = {
    calc(abilityScores, personalityScores, destinyScores) {
      const WEIGHTS = { ability: 0.40, personality: 0.35, destiny: 0.25 };
      const scores = {};
      const allInds = app.data.industries;
      allInds.forEach(ind => {
        const abs = abilityScores[ind.id] || 50;
        const ps = personalityScores[ind.id] || 50;
        const ds = destinyScores ? (destinyScores[ind.id] || 50) : 50;
        scores[ind.id] = Math.round(abs * WEIGHTS.ability + ps * WEIGHTS.personality + ds * WEIGHTS.destiny);
      });
      const sorted = Object.entries(scores).sort((a,b) => b[1] - a[1]);
      return { scores, top: sorted.slice(0,5) };
    }
  };

  // ==================== 输出生成器 ====================
  app.engines.output = {
    generate(profile, abilityScores, personalityResult, destinyResult, compositeResult, tier) {
      const report = { tier, sections: [] };

      // Section 1: 能力画像 (ALWAYS free)
      const topInds = compositeResult.top;
      report.sections.push({
        id: 'ability', title: '能力画像', access: 'free',
        content: {
          skillScores: profile.selfAssessment ? profile.selfAssessment.skillScores : {},
          abilityScores: abilityScores,
          topIndustries: topInds.map(e => ({ id: e[0], score: e[1], name: (app.data.industries.find(i => i.id === e[0]) || {}).name || e[0] }))
        }
      });

      // Section 2: 性格分析 (tier >= personality ¥9.9)
      if (tier === 'personality' || tier === 'destiny' || tier === 'silver' || tier === 'gold' || tier === 'diamond') {
        report.sections.push({
          id: 'personality', title: '性格分析', access: 'personality',
          content: {
            riasec: personalityResult.riasec,
            mbti: personalityResult.mbti,
            personalityIndustryScores: personalityResult.industryScores
          }
        });
      }

      // Section 3: 命理分析 (tier >= destiny ¥39)
      if (tier === 'destiny' || tier === 'silver' || tier === 'gold' || tier === 'diamond') {
        report.sections.push({
          id: 'destiny', title: '命理指引', access: 'destiny',
          content: {
            bazi: destinyResult ? destinyResult.baziResult : null,
            shishenTable: destinyResult ? destinyResult.shishenTable : null,
            wxStrength: destinyResult ? destinyResult.wxStrength : null,
            strengthResult: destinyResult ? destinyResult.strengthResult : null,
            yongShenResult: destinyResult ? destinyResult.yongShenResult : null,
            patternResult: destinyResult ? destinyResult.patternResult : null,
            dayunResult: destinyResult ? destinyResult.dayunResult : null,
            destinyScores: destinyResult ? destinyResult.scores : null
          }
        });
      }

      // Section 4: 行业详细匹配 (all tiers, but depth varies)
      report.sections.push({
        id: 'industryMatch', title: '行业匹配详细报告', access: 'free',
        content: {
          matches: topInds.map((e, i) => {
            const ind = app.data.industries.find(x => x.id === e[0]);
            return { name: ind ? ind.name : e[0], id: e[0], score: e[1], subs: ind ? ind.subs : [], rank: i + 1 };
          })
        }
      });

      // Section 5: 岗位推荐
      const jobMatches = this._matchJobs(topInds, profile);
      report.sections.push({
        id: 'jobs', title: '岗位推荐', access: 'free',
        content: { jobs: jobMatches.slice(0, tier === 'free' ? 3 : (tier === 'personality' ? 5 : 15)) }
      });

      // Section 6: 简历模板 (tier >= personality)
      if (tier === 'personality' || tier === 'destiny' || tier === 'silver' || tier === 'gold' || tier === 'diamond') {
        const count = tier === 'personality' ? 1 : (tier === 'destiny' ? 3 : 5);
        report.sections.push({
          id: 'resume', title: '简历模板', access: 'personality',
          content: { templates: app.data.resumeTemplates.slice(0, count) }
        });
      }

      // Section 7: 薪资预测 (tier >= destiny)
      if (tier === 'destiny' || tier === 'silver' || tier === 'gold' || tier === 'diamond') {
        report.sections.push({
          id: 'salary', title: '薪资预测', access: 'destiny',
          content: { prediction: this._predictSalary(profile, topInds[0]) }
        });
      }

      // Section 8: 创业评估 (tier >= silver)
      if (tier === 'silver' || tier === 'gold' || tier === 'diamond') {
        report.sections.push({
          id: 'entrepreneurship', title: '创业与副业方案', access: 'silver',
          content: { assessment: this._assessEntrepreneurship(profile, personalityResult) }
        });
      }

      // Section 9: 发展路径 (tier >= silver)
      if (tier === 'silver' || tier === 'gold' || tier === 'diamond') {
        report.sections.push({
          id: 'path', title: '职业发展路径', access: 'silver',
          content: { path: this._genCareerPath(profile, topInds[0]) }
        });
      }

      // Section 10: 工作方案 (tier >= gold)
      if (tier === 'gold' || tier === 'diamond') {
        report.sections.push({
          id: 'workplan', title: '详细工作方案', access: 'gold',
          content: { plan: this._genWorkPlan(profile, topInds, personalityResult) }
        });
      }

      // Section 11: 面试技巧 (tier >= gold)
      if (tier === 'gold' || tier === 'diamond') {
        report.sections.push({
          id: 'interview', title: '面试技巧', access: 'gold',
          content: { tips: this._genInterviewTips(topInds[0]) }
        });
      }

      // Section 12: 商业模式匹配 (tier >= diamond)
      if (tier === 'diamond') {
        report.sections.push({
          id: 'bizmodel', title: '商业模式匹配', access: 'diamond',
          content: { model: this._genBizModel(profile, personalityResult) }
        });
      }

      return report;
    },

    _matchJobs(topInds, profile) {
      const topIndIds = topInds.map(e => e[0]);
      const userCity = profile.basic && profile.basic.location ? profile.basic.location.city : '';
      let matches = app.data.jobsList.filter(j => topIndIds.includes(j.industry));
      if (userCity) {
        const cityMatch = matches.filter(j => j.city === userCity);
        matches = cityMatch.length > 0 ? cityMatch : matches;
      }
      return matches.slice(0, 30);
    },

    _predictSalary(profile, topInd) {
      const ind = app.data.industries.find(x => x.id === (topInd ? topInd[0] : 'internet'));
      const yrs = (profile.experience && profile.experience.totalYears) || 0;
      if (yrs < 1) return '预计月薪 6-12K（应届生水平）';
      if (yrs < 3) return '预计月薪 10-20K（初级工程师/专员水平）';
      if (yrs < 5) return '预计月薪 15-30K（中高级水平）';
      if (yrs < 10) return '预计月薪 25-50K（资深/专家水平）';
      return '预计月薪 40K+（总监/合伙人水平）';
    },

    _assessEntrepreneurship(profile, personality) {
      const mbti = personality.mbti.type;
      const riasecTop = personality.riasec.topTypes.map(t => t.type);
      const suitable = (riasecTop.includes('E') || riasecTop.includes('A')) && (mbti.includes('E') || mbti.includes('N'));
      return {
        suitable,
        directions: suitable ? ['内容创业/自媒体','电商/直播带货','咨询服务','教育培训','软件开发外包'] : ['加盟连锁','网约车/配送','社区服务','手工艺品','知识付费'],
        riskLevel: suitable ? '中等' : '较低',
        sideHustles: ['线上课程/知识付费','闲鱼/转转二手交易','短视频/直播带货','配音/翻译/设计接单','私域社群运营'],
        startupCost: suitable ? '5-50万元（根据方向）' : '5000-5万元（低门槛方向）'
      };
    },

    _genCareerPath(profile, topInd) {
      const yrs = (profile.experience && profile.experience.totalYears) || 0;
      return {
        now: topInd ? (app.data.industries.find(i => i.id === topInd[0]) || {}).name || '推荐行业' : '待定',
        year1: '深耕核心技能，建立行业认知和个人品牌',
        year3: '晋升为核心骨干或Team Lead，拓展管理能力',
        year5: '成为行业专家或转管理线，具备独立带团队能力'
      };
    },

    _genWorkPlan(profile, topInds, personality) {
      const topInd = app.data.industries.find(i => i.id === topInds[0][0]);
      return {
        targetIndustry: topInd ? topInd.name : '推荐行业',
        targetRoles: topInd ? topInd.subs.slice(0,3).join('、') : '根据匹配度推荐',
        actionItems: ['更新简历，突出核心技能和项目经验','针对性投递目标行业Top公司','参加行业会议/社群拓展人脉','考取相关行业证书/资格','每月复盘进展调整策略'],
        companies: '建议优先考虑中型成长型公司（500-2000人规模），成长空间大'
      };
    },

    _genInterviewTips(topInd) {
      const indName = topInd ? (app.data.industries.find(i => i.id === topInd[0]) || {}).name || '' : '';
      return {
        commonQuestions: ['请做自我介绍（控制在2分钟内）','你为什么选择我们公司/行业？','你未来3-5年的职业规划是什么？','你最大的优点和缺点是什么？','描述一个你解决过的复杂问题'],
        industryTips: indName.includes('互联网') ? '准备展示GitHub项目，强调快速学习和解决问题的能力' : indName.includes('金融') ? '准备财务分析案例，强调风险意识和合规思维' : '准备相关工作案例，强调执行力和团队协作',
        negotiationTips: '先了解目标公司薪资结构，在HR报价基础上上浮10-20%，准备好你的价值陈述（为什么值这个价）'
      };
    },

    _genBizModel(profile, personality) {
      const mbti = personality.mbti.type;
      const models = [];
      if (mbti.includes('E') && mbti.includes('N')) models.push({ name:'平台型', desc:'搭建供需双方连接的平台（如垂直领域服务平台、内容社区）', fit:'高度匹配' });
      if (mbti.includes('I') && mbti.includes('T')) models.push({ name:'技术型', desc:'以技术/专利为核心壁垒的商业模式（如SaaS、AI应用）', fit:'高度匹配' });
      if (personality.riasec.topTypes.some(t => t.type === 'S')) models.push({ name:'服务型', desc:'以专业服务为核心的商业模式（如咨询、培训、护理）', fit:'较高匹配' });
      if (personality.riasec.topTypes.some(t => t.type === 'A')) models.push({ name:'内容型', desc:'以内容创作为核心的商业模式（如MCN、IP孵化、出版）', fit:'高度匹配' });
      models.push({ name:'加盟型', desc:'加盟成熟品牌快速启动（餐饮、零售、教育加盟）', fit:'备选方案' });
      return { models: models.slice(0,4), recommendation: '建议优先选择平台型或内容型模式，启动成本可控且增长空间大' };
    }
  };

  // ==================== 信息采集模块 (7步) ====================
  app.collect = {
    totalSteps: 7,
    data: null,
    currentStep: 1,

    init() {
      this.currentStep = app.storage.get(app.storage.KEYS.CURRENT_STEP) || 1;
      if (!this.data) {
        const saved = app.storage.get(app.storage.KEYS.PROFILE);
        this.data = saved || this._emptyProfile();
      }
      document.getElementById('btn-prev').style.display = this.currentStep === 1 ? 'none' : '';
      document.getElementById('btn-next').textContent = this.currentStep === 7 ? '🚀 开始分析' : '下一步 →';
      this._renderStep();
      this._updateProgress();
      document.getElementById('page-collect').scrollIntoView({ behavior: 'smooth' });
    },

    _emptyProfile() {
      return {
        basic: { name:'', gender:'', birthYear:'', birthMonth:'', birthDay:'', location:{province:'',city:''}, education:{degree:'',major:'',school:'',graduationYear:''} },
        experience: { status:'', totalYears:0, history:[], skillTags:[] },
        goals: { desiredIndustries:[], desiredPositions:[], desiredSalary:{min:0,max:0}, locationPreference:{cities:[],remotable:false}, workTypePreferences:[], priority:{salary:3,stability:3,growth:3,balance:3,interest:3,location:3} },
        selfAssessment: { skillScores:{logic:5,comm:5,leader:5,creative:5,tech:5,data:5,exec:5,learn:5,stress:5,social:5}, strengths:[], weaknesses:[], interests:[], values:[] },
        riasecAnswers: {}, mbtiAnswers: {}, bazi:{birthDate:{year:1990,month:1,day:1,hour:6,calendarType:'solar'},gender:'male'}
      };
    },

    _updateProgress() {
      const pct = Math.round((this.currentStep / this.totalSteps) * 100);
      document.getElementById('collect-progress-fill').style.width = pct + '%';
      document.querySelectorAll('.step-dot').forEach((el, i) => {
        el.classList.remove('active', 'done');
        if (i + 1 === this.currentStep) el.classList.add('active');
        else if (i + 1 < this.currentStep) el.classList.add('done');
      });
    },

    _renderStep() {
      const container = document.getElementById('collect-container');
      const step = this.currentStep;
      const titles = ['基本信息','工作经历','职业目标','自我评估','性格测试 (RIASEC)','性格测试 (MBTI)','命理信息'];
      const descs = ['请填写您的基本信息，用于生成精准的职业画像','请填写您的职业经历和技能','告诉我们您的职业期望和目标','请对您的核心能力进行自我评估','请根据您的实际情况选择最符合的选项（1=非常不符合，5=非常符合）','请选择更符合您倾向的选项','请填写出生信息用于命理分析（选填，但建议填写以获得更全面分析）'];

      let html = '<div class="collect-step"><h3 class="collect-step-title">Step ' + step + ': ' + titles[step-1] + '</h3>';
      html += '<p class="collect-step-desc">' + descs[step-1] + '</p>';

      switch(step) {
        case 1: html += this._renderStep1(); break;
        case 2: html += this._renderStep2(); break;
        case 3: html += this._renderStep3(); break;
        case 4: html += this._renderStep4(); break;
        case 5: html += this._renderStep5(); break;
        case 6: html += this._renderStep6(); break;
        case 7: html += this._renderStep7(); break;
      }
      html += '</div>';
      container.innerHTML = html;

      // Bind events
      if (step === 2) this._bindStep2Events();
      if (step === 3) this._bindStep3Events();
      if (step === 4) this._bindStep4Events();
      if (step === 5) this._bindStep5Events();
      if (step === 6) this._bindStep6Events();
    },

    _renderStep1() {
      const d = this.data;
      let h = '<div class="glass-card">';
      h += this._input('text', '姓名', 'basic.name', d.basic.name);
      h += this._select('性别', 'basic.gender', d.basic.gender, [['','请选择'],['male','男'],['female','女']]);
      h += this._input('number', '出生年份', 'basic.birthYear', d.basic.birthYear, '如 1995');
      h += this._input('number', '出生月份', 'basic.birthMonth', d.basic.birthMonth, '1-12');
      h += '<div class="form-group"><label class="form-label">所在地</label>';
      h += this._select('省份', 'basic.location.province', d.basic.location.province, [['','请选择省份']].concat(app.data.cities.map(c => [c.province, c.province])), 'onchange="app.collect.onProvinceChange(this.value)"');
      const cities = d.basic.location.province ? (app.data.cities.find(c => c.province === d.basic.location.province) || {cities:[]}).cities : [];
      h += this._select('城市', 'basic.location.city', d.basic.location.city, [['','请选择城市']].concat(cities.map(c => [c,c])));
      h += '</div>';
      h += this._select('最高学历', 'basic.education.degree', d.basic.education.degree, [['','请选择'],['highschool','高中/中专'],['associate','大专'],['bachelor','本科'],['master','硕士'],['doctor','博士'],['other','其他']]);
      h += this._input('text', '专业', 'basic.education.major', d.basic.education.major);
      h += this._input('text', '毕业院校', 'basic.education.school', d.basic.education.school);
      h += this._input('number', '毕业年份', 'basic.education.graduationYear', d.basic.education.graduationYear, '如 2020');
      h += '</div>';
      return h;
    },

    _renderStep2() {
      const d = this.data;
      let h = '<div class="glass-card">';
      h += this._select('当前状态', 'experience.status', d.experience.status, [['','请选择'],['employed','在职'],['unemployed','待业'],['student','在校学生'],['entrepreneur','创业中'],['freelancer','自由职业']]);
      h += this._input('number', '总工作年限(年)', 'experience.totalYears', d.experience.totalYears, '如 3');

      h += '<div id="exp-history-container">';
      (d.experience.history || []).forEach((exp, i) => {
        h += this._renderExpEntry(exp, i);
      });
      h += '</div>';
      h += '<button class="btn-secondary" onclick="app.collect.addExpEntry()" style="margin-top:12px">+ 添加工作经历</button>';

      // Skill tags
      const skillPresets = ['JavaScript','Python','Java','React','Vue','Node.js','SQL','数据分析','项目管理','团队管理','内容创作','视频剪辑','UI设计','销售','市场推广','客户沟通','财务分析','谈判','演讲','写作','教学','培训','运营','SEO','电商','供应链','HR'];
      h += '<div class="form-group" style="margin-top:16px"><label class="form-label">技能标签（点击选择，最多15个）</label><div class="tag-group" id="skill-tags">';
      skillPresets.forEach(s => {
        const sel = (d.experience.skillTags || []).includes(s);
        h += '<span class="tag' + (sel ? ' selected' : '') + '" data-tag="' + s + '" onclick="app.collect.toggleSkillTag(this)">' + s + '</span>';
      });
      h += '</div></div>';

      h += '</div>';
      return h;
    },

    _renderExpEntry(exp, idx) {
      let h = '<div class="glass-card" style="margin-bottom:12px;position:relative">';
      if (idx > 0) h += '<span style="position:absolute;top:8px;right:8px;cursor:pointer;color:var(--color-danger);font-size:0.85rem" onclick="app.collect.removeExpEntry(' + idx + ')">删除</span>';
      const indOptions = [['','请选择行业']].concat(app.data.industries.map(i => [i.id, i.name]));
      h += this._input('text', '公司名称', 'experience.history.' + idx + '.companyName', exp.companyName || '');
      h += this._input('text', '职位名称', 'experience.history.' + idx + '.position', exp.position || '');
      h += this._select('所属行业', 'experience.history.' + idx + '.industry', exp.industry || '', indOptions);
      h += this._input('text', '开始日期(YYYY-MM)', 'experience.history.' + idx + '.startDate', exp.startDate || '', '如 2020-03');
      h += this._input('text', '结束日期(YYYY-MM 或 "至今")', 'experience.history.' + idx + '.endDate', exp.endDate || '', '如 2023-06 或 至今');
      h += this._select('月薪范围', 'experience.history.' + idx + '.salary.range', (exp.salary && exp.salary.range) || '', [['','请选择'],['0-3k','0-3K'],['3-5k','3-5K'],['5-8k','5-8K'],['8-12k','8-12K'],['12-20k','12-20K'],['20-30k','20-30K'],['30k+','30K+']]);
      h += this._input('text', '主要成就/职责', 'experience.history.' + idx + '.achievements', exp.achievements || '', '简要描述');
      h += '</div>';
      return h;
    },

    _renderStep3() {
      const d = this.data;
      let h = '<div class="glass-card">';
      h += '<div class="form-group"><label class="form-label">期望行业（多选）</label><div class="tag-group">';
      app.data.industries.forEach(ind => {
        const sel = (d.goals.desiredIndustries || []).includes(ind.id);
        h += '<span class="tag' + (sel ? ' selected' : '') + '" data-tag="' + ind.id + '" onclick="app.collect.toggleTag(this, \'goals.desiredIndustries\')">' + ind.name + '</span>';
      });
      h += '</div></div>';
      h += this._input('text', '期望职位（多个用逗号分隔）', 'goals.desiredPositions', (d.goals.desiredPositions || []).join('、'), '如 产品经理、数据分析师');
      h += this._input('number', '期望最低薪资(元/月)', 'goals.desiredSalary.min', d.goals.desiredSalary.min, '如 15000');
      h += this._input('number', '期望最高薪资(元/月)', 'goals.desiredSalary.max', d.goals.desiredSalary.max, '如 30000');
      h += '<div class="form-group"><label class="form-label">偏好工作城市（多选）</label><div class="tag-group" id="city-tags" style="max-height:200px;overflow-y:auto">';
      const topCities = ['北京','上海','广州','深圳','杭州','成都','武汉','南京','苏州','西安','重庆','天津','长沙','郑州','青岛','合肥','厦门','宁波','大连','沈阳','哈尔滨','不限'];
      topCities.forEach(c => {
        const sel = (d.goals.locationPreference.cities || []).includes(c);
        h += '<span class="tag' + (sel ? ' selected' : '') + '" data-tag="' + c + '" onclick="app.collect.toggleTag(this, \'goals.locationPreference.cities\')">' + c + '</span>';
      });
      h += '</div></div>';
      h += '<div class="form-group"><label class="form-label">工作类型偏好（多选）</label><div class="tag-group">';
      ['全职','兼职','副业','创业','远程办公'].forEach(t => {
        const sel = (d.goals.workTypePreferences || []).includes(t);
        h += '<span class="tag' + (sel ? ' selected' : '') + '" data-tag="' + t + '" onclick="app.collect.toggleTag(this, \'goals.workTypePreferences\')">' + t + '</span>';
      });
      h += '</div></div>';
      // Priority sliders
      h += '<div style="margin-top:16px"><label class="form-label">职业优先级（拖动滑块，1=不重要 5=非常重要）</label>';
      const priorities = { salary:'薪资待遇', stability:'工作稳定', growth:'成长空间', balance:'生活平衡', interest:'兴趣匹配', location:'工作地点' };
      const pri = d.goals.priority || {};
      Object.keys(priorities).forEach(k => {
        h += '<div class="slider-container"><div class="slider-label"><span>' + priorities[k] + '</span><span class="slider-value" id="slider-val-' + k + '">' + (pri[k]||3) + '</span></div>';
        h += '<input type="range" min="1" max="5" value="' + (pri[k]||3) + '" oninput="app.collect.updateSlider(\'goals.priority.' + k + '\',this.value)"></div>';
      });
      h += '</div>';
      h += '</div>';
      return h;
    },

    _renderStep4() {
      const d = this.data;
      let h = '<div class="glass-card">';
      h += '<p class="form-label">10维能力自评（1-10分，请诚实评估）</p>';
      app.data.skillDims.forEach(dim => {
        const val = (d.selfAssessment && d.selfAssessment.skillScores && d.selfAssessment.skillScores[dim.id]) || 5;
        h += '<div class="slider-container"><div class="slider-label"><span>' + dim.name + '</span><span class="slider-value" id="slider-val-' + dim.id + '">' + val + '</span></div>';
        h += '<input type="range" min="1" max="10" value="' + val + '" oninput="app.collect.updateSlider(\'selfAssessment.skillScores.' + dim.id + '\',this.value)"></div>';
      });
      h += '<div class="form-group"><label class="form-label">优势能力（选3项）</label><div class="tag-group">';
      app.data.skillDims.forEach(dim => {
        const sel = (d.selfAssessment.strengths || []).includes(dim.id);
        h += '<span class="tag' + (sel ? ' selected' : '') + '" data-tag="' + dim.id + '" onclick="app.collect.toggleLimitTag(this,\'selfAssessment.strengths\',3)">' + dim.name + '</span>';
      });
      h += '</div></div>';
      h += '<div class="form-group"><label class="form-label">短板（选2项）</label><div class="tag-group">';
      app.data.skillDims.forEach(dim => {
        const sel = (d.selfAssessment.weaknesses || []).includes(dim.id);
        h += '<span class="tag' + (sel ? ' selected' : '') + '" data-tag="' + dim.id + '" onclick="app.collect.toggleLimitTag(this,\'selfAssessment.weaknesses\',2)">' + dim.name + '</span>';
      });
      h += '</div></div>';
      h += '<div class="form-group"><label class="form-label">兴趣方向（选3项）</label><div class="tag-group">';
      app.data.interestOptions.forEach(opt => {
        const sel = (d.selfAssessment.interests || []).includes(opt.id);
        h += '<span class="tag' + (sel ? ' selected' : '') + '" data-tag="' + opt.id + '" onclick="app.collect.toggleLimitTag(this,\'selfAssessment.interests\',3)">' + opt.label + '</span>';
      });
      h += '</div></div>';
      h += '<div class="form-group"><label class="form-label">价值观（选3项）</label><div class="tag-group">';
      app.data.valueOptions.forEach(opt => {
        const sel = (d.selfAssessment.values || []).includes(opt.id);
        h += '<span class="tag' + (sel ? ' selected' : '') + '" data-tag="' + opt.id + '" onclick="app.collect.toggleLimitTag(this,\'selfAssessment.values\',3)">' + opt.label + '</span>';
      });
      h += '</div></div>';
      h += '</div>';
      return h;
    },

    _renderStep5() {
      const d = this.data;
      let h = '';
      // Group by dimension
      const dims = ['R','I','A','S','E','C'];
      const dimNames = { R:'现实型 Realistic', I:'研究型 Investigative', A:'艺术型 Artistic', S:'社会型 Social', E:'企业型 Enterprising', C:'常规型 Conventional' };
      dims.forEach(dim => {
        const qs = app.data.riasecQuestions.filter(q => q.dim === dim);
        h += '<div class="glass-card" style="margin-bottom:12px"><h4 style="color:var(--color-primary);margin-bottom:8px">' + dimNames[dim] + '</h4>';
        qs.forEach(q => {
          const val = d.riasecAnswers[q.id] || 0;
          h += '<div class="quiz-question"><div class="quiz-question-text">' + q.text + '</div><div class="quiz-options">';
          [1,2,3,4,5].forEach(v => {
            h += '<div class="quiz-option' + (val === v ? ' selected' : '') + '" onclick="app.collect.setRiasecAnswer(\'' + q.id + '\',' + v + ',this)">' + v + '</div>';
          });
          h += '</div></div>';
        });
        h += '</div>';
      });
      return h;
    },

    _renderStep6() {
      const d = this.data;
      let h = '<div class="glass-card">';
      app.data.mbtiQuestions.forEach(q => {
        const val = d.mbtiAnswers[q.id];
        h += '<div class="mbti-pair">';
        h += '<div class="mbti-option' + (val === q.leftScore ? ' selected' : '') + '" onclick="app.collect.setMbtiAnswer(\'' + q.id + '\',\'' + q.leftScore + '\',this)"><span class="opt-letter">A</span><span class="opt-desc">' + q.left + '</span></div>';
        h += '<div class="mbti-option' + (val === q.rightScore ? ' selected' : '') + '" onclick="app.collect.setMbtiAnswer(\'' + q.id + '\',\'' + q.rightScore + '\',this)"><span class="opt-letter">B</span><span class="opt-desc">' + q.right + '</span></div>';
        h += '</div>';
      });
      h += '</div>';
      return h;
    },

    _renderStep7() {
      const d = this.data;
      const bd = d.bazi.birthDate || {year:1990,month:1,day:1,hour:6,calendarType:'solar'};
      let h = '<div class="glass-card">';
      h += this._select('性别', 'bazi.gender', d.bazi.gender || 'male', [['male','男'],['female','女']]);
      h += this._select('历法', 'bazi.birthDate.calendarType', bd.calendarType || 'solar', [['solar','公历 (阳历)'],['lunar','农历 (阴历)']]);
      h += this._input('number', '出生年份', 'bazi.birthDate.year', bd.year, '如 1995');
      h += this._input('number', '出生月份', 'bazi.birthDate.month', bd.month, '1-12');
      h += this._input('number', '出生日', 'bazi.birthDate.day', bd.day, '1-31');
      h += this._select('出生时辰', 'bazi.birthDate.hour', bd.hour || 6, [
        [0,'子时 (23:00-01:00)'],[1,'丑时 (01:00-03:00)'],[2,'寅时 (03:00-05:00)'],[3,'卯时 (05:00-07:00)'],
        [4,'辰时 (07:00-09:00)'],[5,'巳时 (09:00-11:00)'],[6,'午时 (11:00-13:00)'],[7,'未时 (13:00-15:00)'],
        [8,'申时 (15:00-17:00)'],[9,'酉时 (17:00-19:00)'],[10,'戌时 (19:00-21:00)'],[11,'亥时 (21:00-23:00)']
      ]);
      h += '<p style="color:var(--text-secondary);font-size:0.85rem;margin-top:8px">⚠️ 命理信息为选填项，填写后可获得更精准的五行行业匹配和创业方向指引。</p>';
      h += '</div>';
      return h;
    },

    // Input helpers
    _input(type, label, path, val, placeholder) {
      return '<div class="form-group"><label class="form-label">' + label + '</label><input type="' + type + '" class="input-field" value="' + (val || '') + '" placeholder="' + (placeholder || '') + '" data-path="' + path + '" onchange="app.collect.saveField(this)"></div>';
    },
    _select(label, path, val, options) {
      let h = '<div class="form-group"><label class="form-label">' + label + '</label><select class="input-field" data-path="' + path + '" onchange="app.collect.saveField(this)">';
      options.forEach(o => { h += '<option value="' + o[0] + '"' + (String(val) === String(o[0]) ? ' selected' : '') + '>' + o[1] + '</option>'; });
      h += '</select></div>';
      return h;
    },

    saveField(el) {
      let val = el.value;
      if (el.type === 'number' && val !== '') val = Number(val);
      this._setNestedValue(this.data, el.dataset.path, val);
      app.storage.set(app.storage.KEYS.PROFILE, this.data);
    },

    _setNestedValue(obj, path, val) {
      const keys = path.split('.');
      let cur = obj;
      for (let i = 0; i < keys.length - 1; i++) {
        const k = keys[i];
        if (k.match(/^\d+$/)) { if (!cur[Number(k)]) cur[Number(k)] = {}; cur = cur[Number(k)]; }
        else { if (!cur[k]) cur[k] = {}; cur = cur[k]; }
      }
      const lastKey = keys[keys.length - 1];
      cur[lastKey] = val;
    },

    _getNestedValue(obj, path) {
      const keys = path.split('.');
      let cur = obj;
      for (const k of keys) {
        if (cur === undefined || cur === null) return undefined;
        if (k.match(/^\d+$/)) cur = cur[Number(k)];
        else cur = cur[k];
      }
      return cur;
    },

    toggleSkillTag(el) {
      const tag = el.dataset.tag;
      let tags = this.data.experience.skillTags || [];
      if (el.classList.contains('selected')) { tags = tags.filter(t => t !== tag); el.classList.remove('selected'); }
      else { if (tags.length < 15) { tags.push(tag); el.classList.add('selected'); } else { app.toast.show('最多选择15个技能标签', 'warn'); } }
      this.data.experience.skillTags = tags;
      app.storage.set(app.storage.KEYS.PROFILE, this.data);
    },

    toggleTag(el, path) {
      const tag = el.dataset.tag;
      let arr = this._getNestedValue(this.data, path) || [];
      if (el.classList.contains('selected')) { arr = arr.filter(t => t !== tag); el.classList.remove('selected'); }
      else { arr.push(tag); el.classList.add('selected'); }
      this._setNestedValue(this.data, path, arr);
    },

    toggleLimitTag(el, path, limit) {
      const tag = el.dataset.tag;
      let arr = this._getNestedValue(this.data, path) || [];
      if (el.classList.contains('selected')) { arr = arr.filter(t => t !== tag); el.classList.remove('selected'); }
      else { if (arr.length < limit) { arr.push(tag); el.classList.add('selected'); } else { app.toast.show('最多选择' + limit + '项', 'warn'); return; } }
      this._setNestedValue(this.data, path, arr);
    },

    setRiasecAnswer(qid, val, el) {
      this.data.riasecAnswers[qid] = val;
      el.parentElement.querySelectorAll('.quiz-option').forEach(o => o.classList.remove('selected'));
      el.classList.add('selected');
    },

    setMbtiAnswer(qid, val, el) {
      this.data.mbtiAnswers[qid] = val;
      el.parentElement.querySelectorAll('.mbti-option').forEach(o => o.classList.remove('selected'));
      el.classList.add('selected');
    },

    addExpEntry() {
      const h = this.data.experience.history || [];
      h.push({ companyName:'', position:'', industry:'', startDate:'', endDate:'', salary:{range:''}, achievements:'' });
      this.data.experience.history = h;
      this._renderStep();
    },

    removeExpEntry(idx) {
      this.data.experience.history.splice(idx, 1);
      this._renderStep();
    },

    onProvinceChange(province) {
      this.data.basic.location.province = province;
      this.data.basic.location.city = '';
      this._renderStep();
    },

    updateSlider(path, val) {
      this._setNestedValue(this.data, path, Number(val));
      // Update display
      const dimId = path.split('.').pop();
      const el = document.getElementById('slider-val-' + dimId);
      if (el) el.textContent = val;
    },

    _bindStep2Events() {},
    _bindStep3Events() {},
    _bindStep4Events() {},
    _bindStep5Events() {},
    _bindStep6Events() {},

    prevStep() {
      if (this.currentStep > 1) {
        this.currentStep--;
        this._renderStep();
        this._updateProgress();
        document.getElementById('btn-prev').style.display = this.currentStep === 1 ? 'none' : '';
        document.getElementById('btn-next').textContent = this.currentStep === 7 ? '🚀 开始分析' : '下一步 →';
        app.storage.set(app.storage.KEYS.CURRENT_STEP, this.currentStep);
      }
    },

    nextStep() {
      // Save current data
      app.storage.set(app.storage.KEYS.PROFILE, this.data);

      if (this.currentStep < 7) {
        this.currentStep++;
        this._renderStep();
        this._updateProgress();
        document.getElementById('btn-prev').style.display = '';
        document.getElementById('btn-next').textContent = this.currentStep === 7 ? '🚀 开始分析' : '下一步 →';
        app.storage.set(app.storage.KEYS.CURRENT_STEP, this.currentStep);
      } else {
        // Start assessment
        app.storage.remove(app.storage.KEYS.CURRENT_STEP);
        app.state.user.profile = this.data;
        app.state.saveProfile();
        app.router.navigate('/assessing');
      }
    }
  };

  // ==================== 评测动画模块 ====================
  app.assessing = {
    steps: ['数据预处理','能力维度分析','性格模型匹配','命理推算','综合评分计算','报告生成'],
    async run() {
      document.getElementById('page-assessing').scrollIntoView({ behavior: 'smooth' });
      const checklist = document.querySelectorAll('.check-item');
      checklist.forEach(c => { c.classList.remove('doing', 'done'); });

      const profile = app.state.user.profile || app.collect.data;
      if (!profile) { app.router.navigate('/collect'); return; }

      const fill = document.getElementById('assessing-fill');
      const title = document.getElementById('assessing-title');

      for (let i = 0; i < this.steps.length; i++) {
        checklist[i].classList.add('doing');
        title.textContent = '正在' + this.steps[i] + '...';
        fill.style.width = Math.round(((i + 1) / this.steps.length) * 100) + '%';

        // Run engine step
        if (i === 1) app.state.assessment.abilityScores = app.engines.ability.calc(profile);
        if (i === 2) {
          const riasec = app.engines.personality.calcRIASEC(profile.riasecAnswers || {});
          const mbti = app.engines.personality.calcMBTI(profile.mbtiAnswers || {});
          const indScores = app.engines.personality.calcIndustryMatch(riasec.scores);
          app.state.assessment.personalityResult = { riasec, mbti, industryScores: indScores };
        }
        if (i === 3) app.state.assessment.destinyResult = app.engines.destiny.calc(profile);

        await this._delay(800 + Math.random() * 400);
        checklist[i].classList.remove('doing');
        checklist[i].classList.add('done');
        checklist[i].querySelector('.check-icon').textContent = '✓';
      }

      // Composite
      const composite = app.engines.composite.calc(
        app.state.assessment.abilityScores,
        app.state.assessment.personalityResult.industryScores,
        app.state.assessment.destinyResult ? app.state.assessment.destinyResult.scores : null
      );
      app.state.assessment.compositeResult = composite;

      await this._delay(500);
      app.state.assessment.status = 'complete';
      app.router.navigate('/results');
    },
    _delay(ms) { return new Promise(r => setTimeout(r, ms)); }
  };

  // ==================== 结果页 ====================
  app.results = {
    report: null,

    render() {
      document.getElementById('page-results').scrollIntoView({ behavior: 'smooth' });
      const profile = app.state.user.profile;
      const tier = app.state.user.currentTier;
      const abilityScores = app.state.assessment.abilityScores;
      const personalityResult = app.state.assessment.personalityResult;
      const destinyResult = app.state.assessment.destinyResult;
      const compositeResult = app.state.assessment.compositeResult;

      if (!profile || !compositeResult) { app.router.navigate('/collect'); return; }

      this.report = app.engines.output.generate(profile, abilityScores, personalityResult, destinyResult, compositeResult, tier);

      // Summary
      const topInd = compositeResult.top[0] || ['internet', 50];
      const indData = app.data.industries.find(i => i.id === topInd[0]);
      const riasec = personalityResult ? personalityResult.riasec : { hollandCode: 'N/A' };
      const mbti = personalityResult ? personalityResult.mbti : { type: 'N/A' };
      document.getElementById('results-summary').innerHTML = '<div class="glass-card"><strong>综合评分:</strong> <span style="font-size:2rem;color:var(--color-primary)">' + topInd[1] + '</span><br><strong>推荐行业:</strong> ' + (indData ? indData.name : '待分析') + ' (' + topInd[1] + '%)<br><strong>性格类型:</strong> ' + mbti.type + ' / ' + riasec.hollandCode + '</div>';

      // Render sections
      let contentHtml = '';
      this.report.sections.forEach(sec => {
        contentHtml += this._renderSection(sec, tier);
      });
      document.getElementById('results-content').innerHTML = contentHtml;

      // Save report
      const reports = app.storage.get(app.storage.KEYS.REPORTS) || [];
      reports.push({ date: new Date().toISOString(), tier, topIndustry: indData ? indData.name : '', score: topInd[1], data: this.report });
      app.storage.set(app.storage.KEYS.REPORTS, reports.slice(-20));
    },

    _renderSection(sec, currentTier) {
      const tierLevels = { free:0, personality:1, destiny:2, silver:3, gold:4, diamond:5 };
      const hasAccess = tierLevels[currentTier] >= tierLevels[sec.access];

      let h = '<div class="result-section glass-card" style="position:relative">';
      h += '<h3>' + sec.title + '</h3>';

      if (!hasAccess) {
        h += '<div class="blur-mask">';
        h += this._renderSectionContent(sec);
        h += '</div>';
        h += '<div class="blur-overlay" onclick="app.router.navigate(\'/pricing\')"><div class="lock-icon">🔒</div><div class="unlock-text">付费内容 解锁查看</div>';
        const prices = { personality:'¥9.9', destiny:'¥39', silver:'¥99', gold:'¥199', diamond:'¥999' };
        h += '<div class="unlock-price">立即解锁 ' + (prices[sec.access] || '') + '</div></div>';
      } else {
        h += this._renderSectionContent(sec);
      }

      h += '</div>';
      return h;
    },

    _renderSectionContent(sec) {
      switch(sec.id) {
        case 'ability': return this._renderAbility(sec.content);
        case 'personality': return this._renderPersonality(sec.content);
        case 'destiny': return this._renderDestiny(sec.content);
        case 'industryMatch': return this._renderIndustryMatch(sec.content);
        case 'jobs': return this._renderJobs(sec.content);
        case 'resume': return this._renderResumes(sec.content);
        case 'salary': return this._renderSalary(sec.content);
        case 'entrepreneurship': return this._renderEntrepreneurship(sec.content);
        case 'path': return this._renderPath(sec.content);
        case 'workplan': return this._renderWorkPlan(sec.content);
        case 'interview': return this._renderInterview(sec.content);
        case 'bizmodel': return this._renderBizModel(sec.content);
        default: return '<p>内容加载中...</p>';
      }
    },

    _renderAbility(content) {
      let h = '<div class="skill-bars">';
      const scores = content.skillScores || {};
      app.data.skillDims.forEach(dim => {
        const val = scores[dim.id] || 0;
        const hue = Math.min(val * 12, 260);
        h += '<div class="skill-bar-row"><span class="skill-bar-label">' + dim.name + '</span><div class="skill-bar-track"><div class="skill-bar-fill" style="width:' + (val * 10) + '%;background:hsl(' + hue + ',70%,60%)"></div></div><span class="skill-bar-score">' + val + '</span></div>';
      });
      h += '</div>';
      h += '<div style="margin-top:16px"><strong>Top 3 推荐行业:</strong></div><div class="match-cards">';
      (content.topIndustries || []).slice(0,3).forEach(ind => {
        h += '<div class="match-card glass-card"><div class="match-score">' + ind.score + '%</div><div class="match-name">' + ind.name + '</div></div>';
      });
      h += '</div>';
      return h;
    },

    _renderPersonality(content) {
      if (!content.riasec) return '<p>暂无数据</p>';
      let h = '<div style="display:flex;flex-wrap:wrap;gap:16px">';
      h += '<div style="flex:1;min-width:200px"><strong>RIASEC 霍兰德代码:</strong> <span style="font-size:1.3rem;color:var(--color-primary)">' + content.riasec.hollandCode + '</span><div class="skill-bars" style="margin-top:8px">';
      Object.entries(content.riasec.scores || {}).sort((a,b) => b[1]-a[1]).forEach(([k,v]) => {
        const names = {R:'现实型',I:'研究型',A:'艺术型',S:'社会型',E:'企业型',C:'常规型'};
        h += '<div class="skill-bar-row"><span class="skill-bar-label">' + (names[k]||k) + '</span><div class="skill-bar-track"><div class="skill-bar-fill" style="width:' + v + '%"></div></div><span class="skill-bar-score">' + v + '</span></div>';
      });
      h += '</div></div>';
      h += '<div style="flex:1;min-width:200px"><strong>MBTI 类型:</strong> <span style="font-size:1.3rem;color:var(--color-secondary)">' + (content.mbti ? content.mbti.type : 'N/A') + '</span> ' + (content.mbti && content.mbti.profile ? '(' + content.mbti.profile.name + ')' : '') + '<p style="margin-top:8px;color:var(--text-secondary);font-size:0.9rem">' + (content.mbti && content.mbti.profile ? content.mbti.profile.desc : '') + '</p></div>';
      h += '</div>';
      return h;
    },

    _renderDestiny(content) {
      if (!content.bazi) return '<p>未提供命理信息</p>';
      const b = content.bazi;
      const st = content.shishenTable;
      const wxS = content.wxStrength;
      const sr = content.strengthResult;
      const ysr = content.yongShenResult;
      const pr = content.patternResult;
      const dr = content.dayunResult;
      const ds = content.destinyScores;

      let h = '';

      // 八字排盘表
      h += '<div class="bazi-table"><div class="bazi-title">八字排盘</div><table><thead><tr><th></th><th>年柱</th><th>月柱</th><th>日柱</th><th>时柱</th></tr></thead>';
      h += '<tbody>';
      h += '<tr><td class="bz-label">天干</td><td class="bz-gan">' + b.pillars.year.gan + '</td><td class="bz-gan">' + b.pillars.month.gan + '</td><td class="bz-gan bz-ri">' + b.pillars.day.gan + '</td><td class="bz-gan">' + b.pillars.hour.gan + '</td></tr>';
      h += '<tr><td class="bz-label">地支</td><td>' + b.pillars.year.zhi + '</td><td>' + b.pillars.month.zhi + '</td><td class="bz-ri">' + b.riZhi + '</td><td>' + b.pillars.hour.zhi + '</td></tr>';
      // 藏干
      if (b.cangGan) {
        h += '<tr><td class="bz-label">藏干</td>';
        const pillars = ['year','month','day','hour'];
        pillars.forEach(pk => {
          const cg = b.cangGan[pk];
          const names = cg && cg.length > 0 ? cg[0].tgIdx.map(i => app.engines.bazi.tianGan[i]).join('') : '-';
          h += '<td class="bz-cg">' + names + '</td>';
        });
        h += '</tr>';
      }
      // 十神
      if (st) {
        h += '<tr><td class="bz-label">十神</td>';
        h += '<td>' + st.year.name + '</td><td>' + st.month.name + '</td><td class="bz-ri">日主</td><td>' + st.hour.name + '</td></tr>';
      }
      h += '</tbody></table>';
      h += '<div style="display:flex;gap:24px;margin-top:12px;font-size:0.9rem;color:var(--text-secondary)">';
      h += '<span>纳音年: ' + (b.nayin ? b.nayin.year : 'N/A') + '</span>';
      h += '<span>纳音日: ' + (b.nayin ? b.nayin.day : 'N/A') + '</span>';
      h += '<span>生肖: ' + b.shengXiao + '</span>';
      h += '</div></div>';

      // 五行旺衰 & 日主强弱
      if (wxS && sr) {
        h += '<div class="destiny-card"><strong>五行旺衰</strong><div class="skill-bars" style="margin-top:8px">';
        const wxOrder = ['木','火','土','金','水'];
        const wxColors = { '木':'#4ade80', '火':'#f87171', '土':'#fbbf24', '金':'#e2e8f0', '水':'#60a5fa' };
        const maxVal = Math.max(...Object.values(wxS), 1);
        wxOrder.forEach(wx => {
          const val = wxS[wx] || 0;
          const pct = Math.round((val / maxVal) * 100);
          const isRi = (wx === b.riWuXing);
          h += '<div class="skill-bar-row"><span class="skill-bar-label" style="' + (isRi ? 'font-weight:bold;color:var(--color-accent)' : '') + '">' + wx + (isRi ? ' (日主)' : '') + '</span><div class="skill-bar-track"><div class="skill-bar-fill" style="width:' + pct + '%;background:' + (wxColors[wx]||'#7c8cf8') + '"></div></div><span class="skill-bar-score">' + val.toFixed(1) + '</span></div>';
        });
        h += '</div>';
        h += '<p style="margin-top:8px"><strong>日主强弱:</strong> <span class="tag ' + (sr.label==='强'||sr.label==='偏强'?'tag-success':'tag-warning') + '">' + sr.label + '</span> (占比 ' + Math.round(sr.ratio*100) + '%)</p>';
        h += '</div>';
      }

      // 格局 & 喜用神
      if (pr && ysr) {
        h += '<div class="destiny-card"><strong>格局分析</strong><p style="font-size:1.1rem;margin:4px 0"><span class="tag tag-primary">' + pr.pattern + '</span></p>';
        h += '<p style="color:var(--text-secondary);font-size:0.9rem">' + pr.patternDesc + '</p>';
        h += '<p style="margin-top:8px"><strong>月令十神:</strong> ' + pr.shishenMonth + '</p>';
        h += '<div style="margin-top:12px"><strong>喜用神 & 忌神:</strong>';
        h += '<p style="margin:4px 0">喜神: <span style="color:#4ade80">' + (ysr.xiShen||[]).join('、') + '</span></p>';
        h += '<p style="margin:2px 0">用神: <span style="color:var(--color-primary)">' + (ysr.yongShen||[]).join('、') + '</span></p>';
        h += '<p style="margin:2px 0">忌神: <span style="color:#f87171">' + (ysr.jiShen||[]).join('、') + '</span></p>';
        h += '</div></div>';
      }

      // 大运
      if (dr) {
        h += '<div class="destiny-card"><strong>大运走势</strong><p style="margin:4px 0;color:var(--text-secondary)">起运年龄: ' + dr.startAge + '岁 | ' + (dr.forward ? '顺排' : '逆排') + '</p>';
        h += '<div class="dayun-list" style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px">';
        dr.dayun.slice(0,6).forEach(dy => {
          h += '<div class="dayun-item" style="flex:0 0 calc(33% - 6px);padding:6px 8px;background:var(--glass-bg);border-radius:8px;text-align:center;font-size:0.8rem">';
          h += '<div style="font-weight:bold;font-size:1rem">' + dy.ganZhi + '</div>';
          h += '<div style="color:var(--text-secondary)">' + dy.startAge + '-' + dy.endAge + '岁</div></div>';
        });
        h += '</div></div>';
      }

      // 命理行业推荐
      if (ds) {
        h += '<div class="destiny-card"><strong>命理推荐行业</strong><div class="match-cards" style="margin-top:8px">';
        const sorted = Object.entries(ds).sort((a,b) => b[1]-a[1]).slice(0,5);
        sorted.forEach(([id,score]) => {
          const ind = app.data.industries.find(i => i.id === id);
          h += '<div class="match-card glass-card" style="flex:0 0 calc(33% - 8px)"><div class="match-score">' + score + '%</div><div class="match-name">' + (ind ? ind.name : id) + '</div></div>';
        });
        h += '</div></div>';
      }

      return h;
    },

    _renderIndustryMatch(content) {
      let h = '<div class="match-cards">';
      (content.matches || []).forEach(m => {
        h += '<div class="match-card glass-card"><div class="match-score">' + m.score + '%</div><div class="match-name">#' + m.rank + ' ' + m.name + '</div><div class="match-jobs">' + (m.subs || []).slice(0,3).join(' · ') + '</div></div>';
      });
      h += '</div>';
      return h;
    },

    _renderJobs(content) {
      let h = '<div class="job-list">';
      (content.jobs || []).forEach(j => {
        h += '<div class="job-item glass-card"><div class="job-info"><h4>' + j.title + '</h4><p>' + j.city + ' | ' + j.experience + ' | ' + j.education + '</p><p style="font-size:0.8rem">' + (j.skills || []).join(', ') + '</p></div><div class="job-salary">' + j.salary + '</div></div>';
      });
      if (!content.jobs || content.jobs.length === 0) h += '<p style="text-align:center;color:var(--text-tertiary)">暂无匹配岗位</p>';
      h += '</div>';
      return h;
    },

    _renderResumes(content) {
      let h = '<div class="template-grid">';
      (content.templates || []).forEach(t => {
        h += '<div class="template-card glass-card"><span class="template-icon">' + t.icon + '</span><div class="template-name">' + t.name + '</div><p style="font-size:0.8rem;color:var(--text-secondary)">' + t.desc + '</p><button class="btn-secondary" style="margin-top:8px" onclick="app.toast.show(\'模板功能即将上线\')">下载模板</button></div>';
      });
      h += '</div>';
      return h;
    },

    _renderSalary(content) {
      return '<p style="font-size:1.1rem">' + (content.prediction || '暂无预测') + '</p><p style="color:var(--text-secondary);font-size:0.85rem">*基于行业平均水平和您的能力画像估算</p>';
    },

    _renderEntrepreneurship(content) {
      const a = content.assessment;
      let h = '<p><strong>创业适配度:</strong> <span style="color:' + (a.suitable ? 'var(--color-success)' : 'var(--color-warning)') + '">' + (a.suitable ? '较高' : '一般') + '</span></p>';
      h += '<p><strong>推荐方向:</strong> ' + (a.directions || []).join('、') + '</p>';
      h += '<p><strong>风险等级:</strong> ' + a.riskLevel + '</p>';
      h += '<p><strong>适合副业:</strong> ' + (a.sideHustles || []).join('、') + '</p>';
      h += '<p><strong>预估启动成本:</strong> ' + a.startupCost + '</p>';
      return h;
    },

    _renderPath(content) {
      const p = content.path;
      return '<div style="display:flex;flex-direction:column;gap:12px"><div class="glass-card"><strong>当前方向:</strong> ' + p.now + '</div><div class="glass-card"><strong>1年计划:</strong> ' + p.year1 + '</div><div class="glass-card"><strong>3年计划:</strong> ' + p.year3 + '</div><div class="glass-card"><strong>5年计划:</strong> ' + p.year5 + '</div></div>';
    },

    _renderWorkPlan(content) {
      const p = content.plan;
      return '<p><strong>目标行业:</strong> ' + p.targetIndustry + '</p><p><strong>目标方向:</strong> ' + p.targetRoles + '</p><p><strong>行动清单:</strong></p><ul style="padding-left:20px">' + (p.actionItems || []).map(a => '<li>' + a + '</li>').join('') + '</ul><p style="margin-top:8px"><strong>公司建议:</strong> ' + p.companies + '</p>';
    },

    _renderInterview(content) {
      const t = content.tips;
      return '<div class="glass-card"><strong>常见面试问题:</strong><ul style="padding-left:20px;margin-top:8px">' + (t.commonQuestions || []).map(q => '<li>' + q + '</li>').join('') + '</ul></div><div class="glass-card" style="margin-top:12px"><strong>行业针对性建议:</strong> ' + t.industryTips + '</div><div class="glass-card" style="margin-top:12px"><strong>薪资谈判策略:</strong> ' + t.negotiationTips + '</div>';
    },

    _renderBizModel(content) {
      let h = '<p><strong>推荐商业模式:</strong></p>';
      (content.model.models || []).forEach(m => {
        h += '<div class="glass-card" style="margin-bottom:8px"><strong>' + m.name + '</strong> <span style="color:var(--color-primary);font-size:0.8rem">[' + m.fit + ']</span><p style="font-size:0.85rem;color:var(--text-secondary)">' + m.desc + '</p></div>';
      });
      h += '<p style="margin-top:8px;color:var(--color-warning)">' + content.model.recommendation + '</p>';
      return h;
    }
  };

  // ==================== 付费引导页 ====================
  app.pricing = {
    plans: [
      { id:'free', name:'基础版', price:'免费', features:['能力画像与行业分析','Top 3 推荐行业','简要分析报告','基础岗位匹配(3条)'], accessTier:'free' },
      { id:'personality', name:'性格匹配', price:'9.9', per:'一次性', features:['基础版全部内容','RIASEC + MBTI 深度分析','性格-行业精准匹配','1套精选简历模板','个性发展建议'], accessTier:'personality' },
      { id:'destiny', name:'命理分析', price:'39', per:'一次性', features:['性格匹配全部内容','八字排盘与五行分析','命理职业方向指引','精确岗位匹配(15+条)','3套简历模板','薪资预测','深度行业报告'], featured:true, accessTier:'destiny' },
      { id:'silver', name:'银卡会员', price:'99', per:'/年', features:['命理分析全部内容','创业可行性评估','副业建议方案(3-5个)','竞争力分析报告','发展路径规划(1/3/5年)','不限次数重新评测'], accessTier:'silver' },
      { id:'gold', name:'金卡会员', price:'199', per:'/年', features:['银卡全部内容 + 6次分享','详细工作方案(城市/公司)','面试技巧与薪资谈判','创业方案框架','季度跟踪评估'], accessTier:'gold' },
      { id:'diamond', name:'钻卡会员', price:'999', per:'/年', features:['金卡全部内容(不限次)','全年创业定制方案','商业模式匹配分析','AI专属顾问','月度跟踪报告','行业人脉方向建议'], accessTier:'diamond' }
    ],

    render() {
      document.getElementById('page-pricing').scrollIntoView({ behavior: 'smooth' });
      const currentTier = app.state.user.currentTier;
      const grid = document.getElementById('pricing-grid');
      let html = '';
      this.plans.forEach(plan => {
        const isCurrent = currentTier === plan.accessTier;
        html += '<div class="pricing-card glass-card' + (plan.featured ? ' featured' : '') + '">';
        if (plan.featured) html += '<div class="plan-badge">推荐</div>';
        html += '<div class="plan-name">' + plan.name + '</div>';
        html += '<div class="plan-price">' + (plan.id === 'free' ? '免费' : '¥' + plan.price) + '<small>' + (plan.per ? ' ' + plan.per : '') + '</small></div>';
        html += '<ul class="plan-features">';
        plan.features.forEach(f => { html += '<li>' + f + '</li>'; });
        html += '</ul>';
        if (isCurrent) html += '<div class="plan-current">当前方案</div>';
        else if (plan.id === 'free') html += '<button class="btn-primary" onclick="app.router.navigate(\'/collect\')">开始使用</button>';
        else html += '<button class="btn-buy" onclick="app.pricing.purchase(\'' + plan.id + '\')">立即购买</button>';
        html += '</div>';
      });
      grid.innerHTML = html;
    },

    purchase(planId) {
      const plan = this.plans.find(p => p.id === planId);
      const tierMap = { free:'free', personality:'personality', destiny:'destiny', silver:'silver', gold:'gold', diamond:'diamond' };
      const tier = tierMap[planId];
      if (!tier) return;

      app.state.user.currentTier = tier;
      app.state.user.purchaseHistory.push({ plan: planId, price: plan.price, date: new Date().toISOString() });
      app.state.saveMember();
      app.toast.show('购买成功！当前等级: ' + plan.name, '');
      app.modal.close();
      this.render();
      // Refresh results if available
      if (app.state.assessment.status === 'complete') app.router.navigate('/results');
    }
  };

  // ==================== 会员中心 ====================
  app.member = {
    render() {
      document.getElementById('page-member').scrollIntoView({ behavior: 'smooth' });
      const tier = app.state.user.currentTier;
      const tierNames = { free:'基础版(免费)', personality:'性格匹配版', destiny:'命理分析版', silver:'银卡会员', gold:'金卡会员', diamond:'钻卡会员' };
      const badgeClass = { free:'free', silver:'silver', gold:'gold', diamond:'diamond' };

      let html = '<div class="member-card glass-card">';
      html += '<div><div class="member-tier">当前方案 <span class="tier-badge ' + (badgeClass[tier] || 'free') + '">' + (tierNames[tier] || '基础版') + '</span></div>';
      html += '<div class="member-expire">到期时间: ' + (tier === 'free' ? '永久有效' : '一年') + '</div></div>';
      if (tier !== 'diamond') html += '<button class="btn-primary" onclick="app.router.navigate(\'/pricing\')">升级会员 →</button>';
      html += '</div>';

      // Reports
      const reports = app.storage.get(app.storage.KEYS.REPORTS) || [];
      html += '<div class="glass-card"><h3>我的报告</h3><div class="report-list">';
      if (reports.length === 0) {
        html += '<div class="report-empty">暂无报告，<a href="#/collect">开始评测</a></div>';
      } else {
        reports.reverse().slice(0,10).forEach((r, i) => {
          const d = new Date(r.date);
          html += '<div class="report-item" onclick="app.report.show(' + (reports.length - 1 - i) + ')"><span><strong>' + (r.topIndustry || '报告') + '</strong><br><span class="report-date">' + d.toLocaleDateString() + '</span></span><span class="report-score">' + r.score + '%</span></div>';
        });
      }
      html += '</div></div>';

      // Templates
      html += '<div class="glass-card"><h3>已解锁简历模板</h3><div class="template-grid">';
      const unlockedCount = tier === 'free' ? 0 : (tier === 'personality' ? 1 : (tier === 'destiny' ? 3 : 5));
      app.data.resumeTemplates.forEach((t, i) => {
        if (i < unlockedCount) {
          html += '<div class="template-card glass-card"><span class="template-icon">' + t.icon + '</span><div class="template-name">' + t.name + '</div><p style="font-size:0.8rem;color:var(--text-secondary)">' + t.desc + '</p><button class="btn-secondary" onclick="app.toast.show(\'下载功能即将上线\')">下载</button></div>';
        } else {
          html += '<div class="template-card glass-card" style="opacity:0.5"><span class="template-icon">🔒</span><div class="template-name">' + t.name + '</div><div class="template-lock">需升级解锁</div></div>';
        }
      });
      html += '</div></div>';

      document.getElementById('member-container').innerHTML = html;
    }
  };

  // ==================== 报告详情 ====================
  app.report = {
    show(index) {
      const reports = app.storage.get(app.storage.KEYS.REPORTS) || [];
      if (!reports[index]) { app.router.navigate('/member'); return; }
      app.router.navigate('/report');
      this._index = index;
      this.render();
    },

    render() {
      const reports = app.storage.get(app.storage.KEYS.REPORTS) || [];
      const report = reports[this._index];
      if (!report) { app.router.navigate('/member'); return; }

      document.getElementById('report-container').innerHTML = '<button class="btn-secondary report-back" onclick="app.router.navigate(\'/member\')">← 返回报告列表</button><div class="glass-card report-section"><h3>报告概要</h3><p>日期: ' + new Date(report.date).toLocaleString() + '</p><p>等级: ' + report.tier + '</p><p>推荐行业: ' + report.topIndustry + '</p><p>综合评分: ' + report.score + '%</p></div>' + (report.data ? '<div class="report-section"><p class="analysis-text">详细报告内容请通过结果页查看</p></div>' : '<div class="report-section"><p>暂无详细数据</p></div>');
    }
  };

  // ==================== 初始化 ====================
  app.init = function () {
    app.state.init();
    app.particles.init();
    app.router.init();
    app.router.render(app.router.getRoute());

    // Navbar click handling
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        app.router.navigate(this.dataset.route);
      });
    });
  };

  // Start when DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', app.init);
  } else {
    app.init();
  }
})();
