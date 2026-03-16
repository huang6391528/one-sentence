import { createNoise2D } from 'simplex-noise';

class StrataEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.layers = []; // 状态管理：保存每一层的地质数据
    this.noise2D = createNoise2D(); // 初始化柏林噪声生成器
    
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.draw();
  }

  // 初始化：根据后端的深度，一次性生成历史地层
  init(totalLayers) {
    this.layers = [];
    // 限制最多画 100 层，防止浏览器卡死
    const displayLayers = Math.min(totalLayers, 100); 
    for (let i = 0; i < displayLayers; i++) {
      this.addLayer(true);
    }
    this.draw();
  }

  // 沉积系统：添加新的一层
  addLayer(isInit = false) {
    // 为这一层生成一个随机的地质种子 (DNA)
    const seed = Math.random() * 10000; 
    
    // 新地层压在最上面 (push 到数组末尾)
    this.layers.push({ seed }); 
    
    if (this.layers.length > 100) {
      this.layers.shift(); // 超过100层，最底下的被深埋（移出数组）
    }

    if (!isInit) {
      // 如果是用户实时点击沉积，触发重绘动画
      this.draw();
    }
  }

  // 使用柏林噪声渲染真实的岩层
  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    const baseY = this.canvas.height - 30; // 屏幕最下方

    this.layers.forEach((layer, index) => {
      this.ctx.beginPath();
      
      // index 越小（越早的层），压得越深
      const depthRatio = 1 - (index / Math.max(this.layers.length, 1)); 
      const opacity = 0.15 + (depthRatio * 0.4); 
      const lineWidth = 0.5 + (depthRatio * 1.5); 
      
      this.ctx.strokeStyle = `rgba(138, 129, 124, ${opacity})`; 
      this.ctx.lineWidth = lineWidth;
      
      // 越往下压得越紧实
      const yOffset = (index * 5) - (depthRatio * index * 2);
      const currentY = baseY - yOffset; 
      
      this.ctx.moveTo(0, currentY);
      
      // 核心：使用 Perlin Noise 生成丝滑真实的自然岩石纹理
      for (let x = 0; x <= this.canvas.width; x += 10) {
        // frequency (x * 0.003) 决定平缓度，amplitude (12) 决定起伏高度
        const wave1 = this.noise2D(x * 0.003, layer.seed) * (12 + depthRatio * 4);
        const wave2 = this.noise2D(x * 0.015, layer.seed + 100) * 2; // 细节微颤
        this.ctx.lineTo(x, currentY + wave1 + wave2);
      }
      this.ctx.stroke();
    });
  }
}

export default StrataEngine;