/* ============================================
   effects.js — Canvas粒子背景动画
   ============================================ */

let particles = [];
let particleCanvas, ctx;
let animFrame;

function initParticles() {
  particleCanvas = document.getElementById('particleCanvas');
  if (!particleCanvas) return;
  ctx = particleCanvas.getContext('2d');

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  // 初始化粒子
  const count = Math.min(80, Math.floor(window.innerWidth / 15));
  particles = [];
  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * particleCanvas.width,
      y: Math.random() * particleCanvas.height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      radius: Math.random() * 1.5 + 0.5,
      opacity: Math.random() * 0.4 + 0.1
    });
  }

  // 鼠标交互
  let mouse = { x: -100, y: -100 };
  document.addEventListener('mousemove', function(e) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  function animate() {
    ctx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);

    // 更新和绘制粒子
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;

      // 边界回弹
      if (p.x < 0 || p.x > particleCanvas.width) p.vx *= -1;
      if (p.y < 0 || p.y > particleCanvas.height) p.vy *= -1;

      // 绘制粒子
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(108,92,231,' + (p.opacity * 1.5) + ')';
      ctx.fill();

      // 连线：距离近的粒子之间
      for (let j = i + 1; j < particles.length; j++) {
        const p2 = particles[j];
        const dx = p.x - p2.x;
        const dy = p.y - p2.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 120) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p2.x, p2.y);
          const lineAlpha = (1 - dist / 120) * 0.18;
          ctx.strokeStyle = 'rgba(108,92,231,' + lineAlpha + ')';
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }

      // 鼠标附近粒子发光
      const mdx = p.x - mouse.x;
      const mdy = p.y - mouse.y;
      const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
      if (mdist < 150) {
        const glowAlpha = (1 - mdist / 150) * 0.3;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(108,92,231,' + glowAlpha + ')';
        ctx.fill();
      }
    }

    animFrame = requestAnimationFrame(animate);
  }

  animate();
}

function resizeCanvas() {
  if (!particleCanvas) return;
  particleCanvas.width = window.innerWidth;
  particleCanvas.height = window.innerHeight;
}
