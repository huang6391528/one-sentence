<script setup>
import { ref, computed, onMounted } from 'vue';

// ==========================================
// 1. 雕刻后的文本与数据
// ==========================================
const placeholders = [
  "这里没有围观...",
  "写下它，然后压入地层...",
  "只有时间在听...",
];
const introTexts = [
  '18岁\n你相信努力会改变命运',
  '后来\n你拥有了很多身份',
  '有些话\n不能说给任何人',
  '把它埋在这里',
];

const specimens = [
  { id: '#009', type: '夜行', text: '凌晨三点的街道，没有任何人知道你存在过。城市像一台暂停的机器，只有路灯在运行。' },
  {
    id: '#017',
    type: '异化',
    text: '我们以为自己在向上攀登，后来才发现，那只是把石头推上另一条转速更快的履带。',
  },
  {
    id: '#024',
    type: '荣光',
    text: '曾经跨越山海的勋章，成了一枚枚钉死在标本盒里的蝴蝶。美得窒息，却毫无生机。',
  },
  {
    id: '#042',
    type: '镜像',
    text: '那个曾经热烈过的“旧我”，成了审判此刻最严苛的法官。我们在隔着时间，审视一件陌生而完美的标本。',
  },
  { id: '#103', type: '凋零', text: '所谓怀旧，不是对青春的眷恋，而是对自我丧失的无力凭吊。我们哭泣，是惊觉那个自由意志的自己，早已被囚禁在过去的剪影里。' }
];

const hasSeenIntro = ref(true);
const introStep = ref(0);
const showSplash = ref(false);
const showManifesto = ref(false);
const showAbout = ref(false);

const showRecords = ref(false); // 地质剖面图层
const showLockMessage = ref(false); // 月末未到提示
const crackingPhase = ref(0); // 月末破裂动画阶段: 0关, 1黑屏, 2裂纹, 3透光, 4文字
const isSilenced = ref(false); // 封存后的3秒静默
const isPageShaking = ref(false); // 页面轻微震动
const depthJump = ref(false); // 深度数字跳动
const strataRecords = ref([]); // 地层记录数据

const activeSpecimen = ref(null);

const basePlaceholder = ref(placeholders[0]);
const inputText = ref('');
const isSealed = ref(false);
const maxChars = 140;
const worldDepth = ref(0);
const todayDepth = ref(0); // 模拟今日新增深度

const hasPostedToday = ref(false); // 今日是否已书写

const isLampLit = ref(false);
const toggleLamp = () => {
  isLampLit.value = !isLampLit.value;
};

const todayDate = computed(() => {
  const d = new Date();
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
});

// 动态生成的占位符
const currentPlaceholder = computed(() => {
  if (hasPostedToday.value) return "今日的重量已落入地底。请等待下一个黑夜。";
  return basePlaceholder.value;
});

// ==========================================
// 2. 隐藏细节：纪元系统
// ==========================================
const currentEpoch = computed(() => {
  if (worldDepth.value >= 10000) return '黑曜石纪元';
  if (worldDepth.value >= 1000) return '沉积纪元';
  if (worldDepth.value >= 100) return '第一层地壳已形成';
  return '';
});

// 交互逻辑
const nextIntroStep = () => {
  if (introStep.value < introTexts.length - 1) {
    introStep.value++;
  } else {
    localStorage.setItem('hasSeenMeltingIntro', 'true');
    hasSeenIntro.value = true;
  }
};

const isEndOfMonth = () => {
  const today = new Date();
  const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  return tomorrow.getDate() === 1;
};

const openRecords = () => {
  if (!isEndOfMonth()) {
    showLockMessage.value = true;
    setTimeout(() => { showLockMessage.value = false; }, 3000);
    return;
  }
  
  // 获取真实的本地历史数据
  const savedRecords = JSON.parse(localStorage.getItem('melting_strata_records') || '[]');
  if (savedRecords.length > 0) {
    strataRecords.value = savedRecords.map((r, i) => ({
      ...r,
      title: `第${savedRecords.length - i}层 · ${r.date}`,
      expanded: false
    }));
  } else {
    strataRecords.value = [{ id: 0, title: '空', text: '地层深处空无一物。', expanded: false }];
  }

  // 开始月末仪式动画
  crackingPhase.value = 1; // 阶段1：黑屏
  setTimeout(() => {
    // 取消延迟，让视觉裂纹和物理音频在同一毫秒绝对同时触发
    crackingPhase.value = 2; // 阶段2：裂开
    
    const crackSound = new Audio('/crack.mp3');
    crackSound.volume = 0.8;
    crackSound.play().catch(e => console.log('音频被拦截', e));
    
    setTimeout(() => { crackingPhase.value = 3; // 阶段3：透光 (裂纹持续1.5秒后)
      setTimeout(() => { crackingPhase.value = 4; }, 1000); // 阶段4：文字与按钮
    }, 1500);
  }, 500);
};

const toggleSpecimen = (id) => {
  activeSpecimen.value = activeSpecimen.value === id ? null : id;
};

const toggleRecord = (index) => {
  strataRecords.value[index].expanded = !strataRecords.value[index].expanded;
};

const dynamicSinkStyle = computed(() => {
  if (!isSealed.value) return {};
  return {
    transform: 'translateY(40px)', // 向下沉40px
    opacity: 0,
    transition: 'all 2.5s ease-in', // 慢慢沉下去
  };
});

const charColorClass = computed(() => {
  const len = inputText.value.length;
  if (len >= maxChars) return 'text-[#8A5A5A]/90';
  if (len > 100) return 'text-[#8A817C]/90';
  return 'text-[#D6D2C4]/40';
});

onMounted(async () => {
  const seen = localStorage.getItem('hasSeenMeltingIntro');
  if (!seen) {
    hasSeenIntro.value = false;
  } else {
    showSplash.value = true;
    setTimeout(() => {
      showSplash.value = false;
    }, 2500);
  }

  basePlaceholder.value = placeholders[Math.floor(Math.random() * placeholders.length)];

  // 检查本地存储，今天是否已经发过
  const lastPostDate = localStorage.getItem('melting_last_post_date');
  if (lastPostDate === new Date().toDateString()) {
    hasPostedToday.value = true;
  }

  // 第一次定稿版：采用“初始常量 + 本地递增”的伪动态机制
  // 赋予产品初始的厚重感。等后续接入真实数据库后，再替换为真实请求。
  worldDepth.value = 8432; 
  todayDepth.value = 124; 
});

const handleSeal = async () => {
  if (!inputText.value.trim()) return;

  // 替换为更克制的石子声
  const stoneSound = new Audio('/stone.mp3');
  stoneSound.volume = 0.6;
  stoneSound.play().catch(e => console.log('音频被拦截', e));

  isSealed.value = true;
  
  // 页面轻微震动 (持续0.2s)
  isPageShaking.value = true;
  setTimeout(() => { isPageShaking.value = false; }, 200);

  // 文本下沉动画结束后再增加深度
  setTimeout(() => {
    worldDepth.value += 1;
    todayDepth.value += 1;
    depthJump.value = true; // 触发深度数字跳动
    setTimeout(() => { depthJump.value = false; }, 300);

    // 将真实数据压入本地地层
    const savedRecords = JSON.parse(localStorage.getItem('melting_strata_records') || '[]');
    const newRecord = { id: Date.now(), date: todayDate.value, text: inputText.value };
    savedRecords.unshift(newRecord);
    if (savedRecords.length > 30) savedRecords.pop(); // 只保留最近30天
    localStorage.setItem('melting_strata_records', JSON.stringify(savedRecords));
  }, 2000);
  
  // 触发屏幕静默
  setTimeout(() => {
    isSilenced.value = true;
  }, 2500);

  // 重置UI，等待下一次黎明
  setTimeout(() => {
    isSilenced.value = false;
    isSealed.value = false;
    inputText.value = '';
    // 锁定今日输入
    hasPostedToday.value = true;
    localStorage.setItem('melting_last_post_date', new Date().toDateString());
  }, 6000);
};
</script>

<template>
  <!-- 根容器：根据 isSealed 状态切换“冷/暖”色调 -->
  <div
    class="min-h-screen bg-[#0A0A09] flex flex-col items-center justify-center font-serif overflow-hidden relative selection:bg-[#8A817C]/30 selection:text-[#D6D2C4] transition-all duration-[3000ms] ease-in-out page-scale-base"
    :class="{ 'warm-bg': !isSealed && isLampLit, 'cold-bg': isSealed || !isLampLit, 'page-scale-shake': isPageShaking }"
  >
    <!-- 噪点质感层 (解决“太素”的问题) -->
    <div class="absolute inset-0 pointer-events-none z-[1] opacity-[0.04] mix-blend-overlay" style="background-image: url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E');"></div>

    <!-- 划一根火柴：带有摇曳动画的火光 -->
    <div v-if="isLampLit && !isSealed" class="absolute top-1/2 left-1/2 z-[2] pointer-events-none transition-opacity duration-1000 animate-flicker">
      <div class="w-[70vw] h-[70vw] max-w-[600px] max-h-[600px] rounded-full opacity-80" style="background: radial-gradient(circle, rgba(230, 130, 40, 0.25) 0%, rgba(180, 60, 40, 0.12) 35%, transparent 70%); filter: blur(50px);"></div>
    </div>

    <!-- 介绍引导 -->
    <div v-if="!hasSeenIntro" class="z-50 w-full max-w-2xl px-8 flex flex-col items-center justify-center min-h-screen cursor-pointer" @click="nextIntroStep">
      <transition name="fade" mode="out-in">
        <p :key="introStep" class="text-[#D6D2C4]/70 text-lg leading-[2.5] tracking-[0.2em] text-center whitespace-pre-line">
          {{ introTexts[introStep] }}
        </p>
      </transition>
      <p class="absolute bottom-16 text-[#D6D2C4]/20 text-[10px] tracking-[0.4em] animate-pulse">点击屏幕继续</p>
    </div>

    <!-- 闪屏 -->
    <transition name="fade">
      <div v-if="hasSeenIntro && showSplash" class="absolute inset-0 z-40 flex items-center justify-center bg-[#0A0A09]">
        <p class="text-[#D6D2C4]/40 text-sm tracking-[0.5em] font-light animate-pulse">你今天，存在过吗？</p>
      </div>
    </transition>

    <!-- 主界面 -->
    <template v-if="hasSeenIntro && !showSplash">
      <!-- 采用全屏滚动容器，彻底解决手机端软键盘弹出和绝对定位导致的重叠挤盖问题 -->
      <div class="absolute inset-0 flex flex-col overflow-y-auto overflow-x-hidden custom-scrollbar">
        
        <!-- 顶栏：数据仪表盘 (回归文档流，避免遮挡标题) -->
        <div class="w-full px-6 pt-8 sm:px-8 sm:pt-8 flex-shrink-0 z-20 transition-opacity duration-[3000ms]" :class="{ 'opacity-20': isSealed }">
          <div class="flex flex-row sm:flex-col justify-between sm:justify-start items-start">
            <div class="mb-0 sm:mb-5">
              <p class="text-[#8A817C]/40 text-[10px] tracking-[0.4em] font-mono mb-1 sm:mb-1.5 uppercase">Total Depth</p>
              <p class="text-[#D6D2C4]/70 text-xs sm:text-base tracking-widest font-mono inline-block transition-transform duration-200" :class="{'number-jump': depthJump}">深度: {{ worldDepth.toLocaleString() }} 米</p>
              <p v-if="currentEpoch" class="text-[#8A817C]/50 text-[10px] sm:text-[11px] tracking-widest mt-1 sm:mt-1.5 animate-pulse">{{ currentEpoch }}</p>
            </div>
            <div class="text-right sm:text-left">
              <p class="text-[#8A817C]/30 text-[10px] tracking-[0.4em] font-mono mb-1 sm:mb-1.5 uppercase">Today's Sink</p>
              <p class="text-[#D6D2C4]/40 text-xs sm:text-sm tracking-widest font-mono">新增: {{ todayDepth.toLocaleString() }} 米</p>
            </div>
          </div>
        </div>

        <!-- 顶部标题 -->
        <header class="w-full text-center pt-10 sm:pt-[8vh] flex-shrink-0 z-10 transition-opacity duration-[3000ms]" :class="{ 'opacity-0 pointer-events-none': isSealed }">
          <h1 class="text-sm sm:text-lg tracking-[0.3em] sm:tracking-[0.6em] font-light opacity-60 text-[#D6D2C4] px-6 leading-[2] sm:leading-relaxed break-words">
            这里没有围观，<br class="sm:hidden" />写下它，然后压入地层。
          </h1>
        </header>

        <!-- 主输入区 (加入沉降震颤动画) -->
        <main class="flex-1 w-full max-w-xl mx-auto px-6 sm:px-8 flex flex-col items-center justify-center relative z-10 my-10 sm:my-16 min-h-[250px]">
          <div class="absolute top-[-30px] sm:top-[-40px] w-full text-center pointer-events-none transition-opacity duration-1000" :class="{ 'opacity-0': isSealed || inputText }">
            <p class="text-[10px] sm:text-xs text-[#D6D2C4]/30 tracking-[0.2em] sm:tracking-[0.3em] font-light italic leading-[1.8]">
              除了你，没有人会懂你此刻的感受。<br /><span class="opacity-50 mt-1 block">包括未来的你。</span>
            </p>
          </div>

          <!-- 雕刻感输入框容器 -->
          <div class="w-full flex flex-col items-center" :class="{ 'pointer-events-none': isSealed }" :style="dynamicSinkStyle">
            <div class="w-full relative group p-5 rounded-sm" style="box-shadow: inset 0 1px 6px rgba(0,0,0,0.5);">
              <textarea
                v-model="inputText"
                :maxlength="maxChars"
                :placeholder="currentPlaceholder"
                :disabled="isSealed || hasPostedToday"
                class="w-full h-36 bg-transparent text-[#D6D2C4]/90 text-lg sm:text-xl focus:outline-none resize-none transition-colors peer leading-[1.8] tracking-[0.1em] disabled:opacity-40 disabled:cursor-not-allowed"
                style="caret-color: rgba(138, 129, 124, 0.6)"
              ></textarea>
              <div class="absolute bottom-5 left-5 w-[calc(100%-2.5rem)] h-[1px] bg-[#8A817C]/20 transition-all duration-700 peer-focus:bg-[#8A817C]/60" :class="{'opacity-20': hasPostedToday}"></div>
            </div>

            <div class="w-full flex justify-between items-end mt-6">
              <div class="flex flex-col gap-2">
                <span class="text-xs font-mono transition-colors duration-300 tracking-widest" :class="charColorClass">
                  重量: {{ inputText.length }} / {{ maxChars }}
                </span>
              </div>

              <button
                @click="handleSeal"
                :disabled="!inputText.trim() || hasPostedToday"
                class="group relative w-28 h-10 border border-[#8A817C]/50 bg-transparent text-sm tracking-[0.4em] text-[#D6D2C4]/70 overflow-hidden transition-all duration-500 disabled:opacity-10 disabled:border-[#8A817C]/20 hover:border-[#D6D2C4]/80"
              >
                <span class="relative z-20 group-hover:opacity-0 transition-opacity duration-300">埋下</span>
                <span class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500 text-[#0A0A09] font-medium z-20">
                  封存
                </span>
                <div class="absolute inset-0 bg-[#D6D2C4] scale-y-0 group-hover:scale-y-100 transition-transform duration-500 ease-in-out origin-bottom z-10"></div>
              </button>
            </div>
          </div>
        </main>

        <!-- 底部导航与状态 -->
        <footer class="w-full text-center z-10 flex flex-col items-center gap-4 transition-opacity duration-[2000ms] pb-10 sm:pb-12 flex-shrink-0 mt-auto" :class="{'opacity-0 pointer-events-none': isSealed}">
          <div class="flex flex-wrap justify-center gap-x-6 gap-y-4 px-4 w-full">
            <button @click="showManifesto = true" class="text-[10px] sm:text-xs tracking-[0.3em] text-[#8A817C]/50 hover:text-[#D6D2C4]/80 transition-colors pb-1">
              [ 标本盒 ]
            </button>
            <button @click="showAbout = true" class="text-[10px] sm:text-xs tracking-[0.3em] text-[#8A817C]/40 hover:text-[#D6D2C4]/70 transition-colors pb-1">
              [ 溯源 ]
            </button>
            <button @click="toggleLamp" class="text-[10px] sm:text-xs tracking-[0.3em] text-[#8A817C]/40 hover:text-[#D6D2C4]/70 transition-colors pb-1">
              [ {{ isLampLit ? '熄灭火柴' : '划一根火柴' }} ]
            </button>
            <button
              @click="openRecords"
              class="text-[10px] sm:text-xs tracking-[0.3em] text-[#8A817C]/50 hover:text-[#D6D2C4]/80 transition-colors pb-1"
            >
              [ 地层记录 ]
            </button>
          </div>
        </footer>
      </div>
    </template>

    <!-- 沉降后的3秒绝对静默屏 -->
    <transition name="fade-slow">
      <div v-if="isSilenced" class="absolute inset-0 z-[70] bg-[#0A0A09] flex items-center justify-center pointer-events-none">
        <p class="text-[#8A817C]/50 text-xs sm:text-sm tracking-[0.8em] font-light mix-blend-screen pl-3">
          已沉入地层。
        </p>
      </div>
    </transition>

    <!-- 未到月末的克制提示 -->
    <transition name="fade">
      <div v-if="showLockMessage" class="absolute inset-0 z-[80] bg-[#0A0A09]/95 backdrop-blur-md flex items-center justify-center pointer-events-none">
        <p class="text-[#D6D2C4]/40 text-xs tracking-[0.6em] font-light text-center leading-[3]">
          地层需要时间。<br>月末会打开。
        </p>
      </div>
    </transition>

    <!-- 标本盒：抽屉式动画 -->
    <transition name="drawer">
      <div
        v-if="showManifesto"
        class="absolute inset-x-0 bottom-0 z-50 bg-[#0f0e0d]/90 backdrop-blur-md overflow-y-auto custom-scrollbar flex flex-col items-center pt-24 pb-12 px-6 sm:px-12 rounded-t-lg border-t border-t-[#8A817C]/10"
        style="max-height: 80vh;"
      >
        <button @click="showManifesto = false" class="absolute top-6 right-8 text-[#D6D2C4]/30 hover:text-[#D6D2C4] text-3xl font-light">×</button>
        <div class="max-w-2xl w-full flex flex-col gap-8">
          <div class="text-center mb-12">
            <h2 class="text-lg md:text-xl tracking-[0.6em] font-light text-[#D6D2C4] opacity-80 mb-4">情绪标本馆</h2>
            <p class="text-[#8A817C]/50 text-xs tracking-[0.2em]">只保存重量。</p>
          </div>
          <div class="flex flex-col w-full">
            <div v-for="item in specimens" :key="item.id" class="border-b border-[#8A817C]/10">
              <button @click="toggleSpecimen(item.id)" class="w-full py-6 flex justify-between items-center text-[#D6D2C4]/50 hover:text-[#D6D2C4] transition-colors focus:outline-none">
                <span class="font-mono text-sm tracking-widest">标本 {{ item.id }}</span>
                <span class="text-[10px] tracking-[0.3em] opacity-40 uppercase">{{ item.type }}</span>
              </button>
              <div class="overflow-hidden transition-all duration-500 ease-in-out" :class="activeSpecimen === item.id ? 'max-h-40 opacity-100 pb-8' : 'max-h-0 opacity-0 pb-0'">
                <p class="text-[#D6D2C4]/70 text-sm leading-[2.2] tracking-wide text-justify pl-4 border-l border-[#8A817C]/20">{{ item.text }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- 溯源：羊皮纸质感 -->
    <transition name="fade">
      <div v-if="showAbout" class="absolute inset-0 z-50 bg-[#0A0A09]/80 backdrop-blur-sm flex items-center justify-center" @click="showAbout = false">
        <button @click="showAbout = false" class="absolute top-8 right-8 text-[#D6D2C4]/30 hover:text-[#D6D2C4] text-3xl font-light">×</button>
        <div
          @click.stop
          class="max-w-lg w-full max-h-[85vh] overflow-y-auto text-[#d1c8b3] font-serif leading-[2] sm:leading-[2.6] tracking-widest text-xs sm:text-sm flex flex-col gap-4 sm:gap-6 text-center p-8 sm:p-14 bg-transparent relative custom-scrollbar mx-4"
          id="parchment"
        >
          <p>某个凌晨三点，风穿过空荡的街道。<br/>痛苦无声，却真实得无处安放。</p>
          <p>人生犹如一辆夜行列车，<br/>我们途经荒原，四周寥落，万物萧索。</p>
          <p>是绝对的孤独？还是灵魂的战栗？<br/>在这片言语无法抵达的深渊，<br/>悲喜交叠，最终化为巨大的空。</p>
          <p>于是有了这片地层。<br/>不是为了遗忘，<br/>而是让所有无法言说的重量，<br/>在沉默中，被时间压成化石。</p>
          <p class="text-right mt-4 opacity-70 font-mono text-xs tracking-widest">——一个还在读书的人</p>
          <p class="text-center mt-8 opacity-40 text-[10px] tracking-[0.4em]">
            这里没有围观。写下它，然后压入地层。
          </p>
          <a
            href="mailto:your-mailbox@example.com"
            class="text-[10px] text-[#8A817C]/18 hover:text-[#8A817C]/45 transition-colors tracking-[0.28em] mt-2"
          >
            [ 信箱 ]
          </a>
        </div>
      </div>
    </transition>

    <!-- 月末破裂仪式与光 -->
    <div v-if="crackingPhase > 0" class="absolute inset-0 z-[100] bg-[#050505] flex flex-col items-center justify-center overflow-hidden">
      <div v-if="crackingPhase >= 2" class="relative w-full h-full flex items-center justify-center">
        <!-- 透光特效 -->
        <div v-if="crackingPhase >= 3" class="absolute w-[2px] h-[70%] bg-[#D6D2C4] blur-[12px] opacity-80 animate-pulse"></div>
        <!-- 裂痕线条 -->
        <svg class="absolute w-16 h-[120%] z-10 opacity-70" viewBox="0 0 100 1000" preserveAspectRatio="none">
           <path class="crack-path" :class="{'crack-glow': crackingPhase >= 3}"
              d="M50,0 L38,120 L62,280 L42,450 L58,600 L35,780 L65,880 L45,1000"
              fill="none" stroke="#2A2A2A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
            />
        </svg>
      </div>
      <!-- 仪式文字 -->
      <transition name="fade">
        <div v-if="crackingPhase === 4" class="absolute z-20 flex flex-col items-center gap-12">
          <p class="text-[#D6D2C4]/70 text-sm sm:text-base tracking-[0.8em] font-light shadow-text">压力形成了地层。</p>
          <button @click="showRecords = true; crackingPhase = 0;" class="text-[10px] sm:text-xs tracking-[0.4em] text-[#8A817C] hover:text-[#D6D2C4] transition-all border border-[#8A817C]/20 hover:border-[#8A817C]/60 px-8 py-3 bg-[#0A0A09]/50 backdrop-blur-sm">
            [ 查看这一月 ]
          </button>
        </div>
      </transition>
    </div>

    <!-- 月末地质剖面图 (回看界面) -->
    <transition name="fade">
      <div v-if="showRecords" class="absolute inset-0 z-[90] bg-[#0A0A09] flex flex-col items-center pt-24 pb-12 px-6 overflow-y-auto custom-scrollbar">
        <button @click="showRecords = false" class="absolute top-8 right-8 text-[#D6D2C4]/30 hover:text-[#D6D2C4] text-3xl font-light fixed z-50">×</button>
        
        <div class="text-center mb-16 relative z-10">
          <h2 class="text-xs sm:text-sm tracking-[1em] font-light text-[#8A817C] opacity-50 uppercase ml-2">Stratum Section</h2>
        </div>

        <!-- 剖面图容器 -->
        <div class="w-full max-w-lg flex flex-col relative z-10">
          <!-- 贯穿地层的纵向刻度线 -->
          <div class="absolute left-[40px] top-0 bottom-0 w-[1px] bg-[#8A817C]/10"></div>
          
          <div v-for="(record, index) in strataRecords" :key="record.id" class="w-full flex flex-col">
            <!-- 地层横截面线 -->
            <button @click="toggleRecord(index)" class="group w-full py-5 flex items-center gap-6 text-left focus:outline-none relative">
              <div class="w-[80px] h-[1px] bg-[#8A817C]/20 group-hover:bg-[#D6D2C4]/60 transition-colors z-10 origin-left scale-x-75 group-hover:scale-x-100"></div>
              <span class="text-[#8A817C]/40 group-hover:text-[#D6D2C4]/70 text-[10px] sm:text-xs tracking-[0.3em] font-mono transition-colors">
                {{ record.title }}
              </span>
            </button>
            <!-- 挖出的文字 -->
            <div class="overflow-hidden transition-all duration-700 ease-in-out pl-[104px]" :class="record.expanded ? 'max-h-40 opacity-100 pb-8' : 'max-h-0 opacity-0 pb-0'">
              <p class="text-[#D6D2C4]/50 text-xs sm:text-sm leading-loose tracking-widest">{{ record.text }}</p>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
/* 仪式感翻转：冷暖背景切换 */
.warm-bg {
  background: radial-gradient(ellipse at bottom, rgba(73, 53, 38, 0.28) 0%, rgba(10, 10, 9, 1) 65%);
}
.cold-bg {
  background-color: #0A0A09;
}

/* 溯源：羊皮纸效果 */
#parchment {
  background-color: #f3eacb;
  color: #4a3f35;
  box-shadow: 0 0 120px rgba(0,0,0,0.6), inset 0 0 40px rgba(0,0,0,0.2);
  border: 1px solid #e0d6b3;
  filter: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"><filter id="a" x="0" y="0" width="100%" height="100%"><feTurbulence baseFrequency=".05" numOctaves="5" seed="3" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(#a)" opacity=".1"/></svg>#a');
}

/* 火光摇曳动画 */
@keyframes flicker {
  0%, 100% { opacity: 0.85; transform: translate(-50%, -50%) scale(1); }
  20% { opacity: 0.6; transform: translate(-50%, -50%) scale(0.98); }
  40% { opacity: 0.9; transform: translate(-50%, -50%) scale(1.03); }
  60% { opacity: 0.7; transform: translate(-50%, -50%) scale(1.01); }
  80% { opacity: 0.5; transform: translate(-50%, -50%) scale(0.96); }
}
.animate-flicker {
  animation: flicker 3s infinite alternate cubic-bezier(0.4, 0, 0.2, 1);
}

/* 页面极轻微震动 */
.page-scale-base {
  transition: transform 0.2s ease-in-out;
}
.page-scale-shake {
  transform: scale(1.002);
}

/* 数字跳动 */
.number-jump {
  transform: translateY(-4px) scale(1.1);
  color: #D6D2C4 !important;
  text-shadow: 0 0 8px rgba(214, 210, 196, 0.4);
}

/* 裂纹蔓延动画 */
.crack-path {
  stroke-dasharray: 2000;
  stroke-dashoffset: 2000;
  animation: draw-crack 1.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
}
@keyframes draw-crack {
  to { stroke-dashoffset: 0; }
}
.crack-glow {
  stroke: #D6D2C4;
  filter: drop-shadow(0 0 4px rgba(214,210,196,0.6));
  transition: all 1s ease;
}

.shadow-text {
  text-shadow: 0 2px 10px rgba(0,0,0,0.8);
}

/* 慢速淡入淡出 (用于静默屏) */
.fade-slow-enter-active,
.fade-slow-leave-active {
  transition: opacity 2s ease-in-out;
}
.fade-slow-enter-from,
.fade-slow-leave-to {
  opacity: 0;
}
/* 动画过渡 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 1.2s ease-in-out;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.drawer-enter-active,
.drawer-leave-active {
  transition: transform 0.6s cubic-bezier(0.22, 1, 0.36, 1);
}

.drawer-enter-from,
.drawer-leave-to {
  transform: translateY(100%);
}

/* 自定义滚动条 */
.custom-scrollbar::-webkit-scrollbar {
  width: 2px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(138, 129, 124, 0.2);
}
</style>
