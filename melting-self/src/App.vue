<script setup>
/**
 * ============================================
 * One Sentence - 情感艺术网页装置 v5.0
 * ============================================
 * 
 * 哲学重构：
 * - 韩炳哲《倦怠社会》：绩效社会中的自我剥削
 * - 加缪荒诞主义：在无意义的宇宙中寻找真实的重量
 * - 语言异化：黑话流利却丧失表达痛苦的能力
 */

import { ref, computed, onMounted, watch } from 'vue';
import { playExternalSound } from './utils/audioEngine.js';
import { fetchFossilPoem } from './utils/deepseek.js';
import { saveSentenceToCloud, isSupabaseAvailable, supabase } from './utils/supabase.js';
import { silentResonance } from './utils/llm.js';

// ============================================
// I. 全局常量
// ============================================

const MAX_CHARS = 140;

/**
 * 标本数据
 * 去重与深化：聚焦"绩效社会"、"感知丧失"、"语言异化"三大痛点
 */
const SPECIMENS = [
  { 
    id: '#009', 
    type: '夜行', 
    text: '凌晨三点的街道，没有任何人知道你存在过。城市像一台暂停的机器，只有路灯在运行。' 
  },
  { 
    id: '#017', 
    type: '异化', 
    text: '我们以为自己在向上攀登，后来才发现，那只是把石头推上另一条转速更快的履带。' 
  },
  { 
    id: '#042', 
    type: '镜像', 
    text: '那个曾经热烈过的"旧我"，成了审判此刻最严苛的法官。我们在隔着时间，审视一具陌生而完美的躯壳。' 
  },
  { 
    id: '#103', 
    type: '凋零', 
    text: '所谓怀旧，不是对青春的眷恋，而是对自我丧失的无力凭吊。我们哭泣，是惊觉那个自由意志的自己，早已被囚禁在过去的剪影里。' 
  },
];

/**
 * 开场四幕 - 系统旁白
 * 宏大、冷酷、有窒息感的"系统审判"
 */
const INTRO_TEXTS = [
  '我们习惯用“科研”、“产出”和“最优解”来量化生活，\n却在深夜，找不到一个词来翻译真实的疲惫。',
  '连休息、健身与所谓的“提升自我”，\n有时也变成了另一种形式的系统维护。',
  '社会关系里的标签总是光鲜亮丽，\n但那些未曾声张的脆弱，才是生命真实的底色。',
  '不用完美，无需共鸣。\n把今天最重的那句话交给岩层，然后轻装向前。',
];

const PLACEHOLDERS = [
  '那些无法发声的重量...',
  '让它沉入地质时间...',
  '只有沉默是诚实的...',
];

/**
 * 深渊回声 - 前端 MVP 版本的向量检索模拟
 */
const MOCK_ECHOES = [
  '我们应当想象西西弗斯是幸福的。',
];

// ============================================
// II. 状态
// ============================================

const hasSeenIntro = ref(true);
const introStep = ref(0);
const showSplash = ref(false);

const showManifesto = ref(false);
const showAbout = ref(false);

const showRecords = ref(false);
const showLockMessage = ref(false);
const crackingPhase = ref(0);
const strataRecords = ref([]);
const recentRecords = ref([]);

const inputText = ref('');
const isSealed = ref(false);
const isSilenced = ref(false);
const isPageShaking = ref(false);
const isDeepShaking = ref(false);
const depthJump = ref(false);
const hasPostedToday = ref(false);

const isLampLit = ref(false);
const toggleLamp = () => { isLampLit.value = !isLampLit.value; };

const worldDepth = ref(0);
const todayDepth = ref(0);

const activeSpecimen = ref(null);

const isDrillingFossil = ref(false);
const fossilPoem = ref('');
const fossilRevealed = ref(false);
const fossilError = ref('');

const isExhibitionMode = ref(false);

const resonanceText = ref('');
const resonanceVisible = ref(false);
const isResonating = ref(false);

// 深渊回声
const abyssEchoText = ref('');
const abyssEchoVisible = ref(false);

const isInputFocused = ref(false);

// ============================================
// 拾音器 - Web Audio 地层轰鸣
// ============================================
let audioCtx = null;
let noiseSource = null;
let gainNode = null;
const isListening = ref(false);

// ============================================
// III. 计算属性
// ============================================

const isEndOfMonth = () => {
  const today = new Date();
  const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  return tomorrow.getDate() === 1;
};

const canShowFossilButton = computed(() => {
  return isExhibitionMode.value || isEndOfMonth();
});

const canInput = computed(() => {
  return isExhibitionMode.value || !hasPostedToday.value;
});

const todayDateStr = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const basePlaceholder = ref(PLACEHOLDERS[0]);
const currentPlaceholder = computed(() => {
  if (!canInput.value) return '重量已沉入地质时间。请等待下一个黑夜。';
  return basePlaceholder.value;
});

const todayDate = computed(() => {
  const d = new Date();
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
});

const currentEpoch = computed(() => {
  if (worldDepth.value >= 10000) return '黑曜石纪元';
  if (worldDepth.value >= 1000) return '沉积纪元';
  if (worldDepth.value >= 100) return '地壳形成中';
  return '';
});

const charColorClass = computed(() => {
  const len = inputText.value.length;
  if (len >= MAX_CHARS) return 'text-[#888]';
  if (len > 100) return 'text-[#777]';
  return 'text-[#666]';
});

const dynamicSinkStyle = computed(() => {
  if (!isSealed.value) return {};
  return {
    transform: 'translateY(40px)',
    opacity: 0,
    transition: 'all 2.5s cubic-bezier(0.4, 0, 0.2, 1)',
  };
});

// ============================================
// IV. 交互逻辑
// ============================================

const nextIntroStep = () => {
  if (introStep.value < INTRO_TEXTS.length - 1) {
    introStep.value++;
  } else {
    localStorage.setItem('hasSeenMeltingIntro', 'true');
    hasSeenIntro.value = true;
  }
};


const openRecords = () => {
  if (!isExhibitionMode.value && !isEndOfMonth()) {
    showLockMessage.value = true;
    setTimeout(() => { showLockMessage.value = false; }, 3500);
    return;
  }

  const savedRecords = JSON.parse(localStorage.getItem('melting_strata_records') || '[]');
  if (savedRecords.length > 0) {
    strataRecords.value = savedRecords.map((r, i) => ({
      ...r,
      title: `第${savedRecords.length - i}层 · ${r.date}`,
      expanded: false,
    }));
  } else {
    strataRecords.value = [{ id: 0, title: '空', text: '岩层深处空无一物。', expanded: false }];
  }

  // 月末裂开仪式
  crackingPhase.value = 1;

  // 裂纹动画总时序：
  // 0ms   → crackingPhase=2，裂纹开始划线（dashoffset 从 2000→0，1.8s 线性）
  // 800ms → dash-offset 到达 ~55% 处，裂纹视觉上开始加粗（stroke-width 加过渡）
  // 1300ms→ dash-offset 到达 ~72% 处，视觉撕裂峰值，触发 crack.mp3
  // 1800ms→ dashoffset=0，裂纹完全展开
  // 2300ms→ crackingPhase=3，透光效果
  // 3300ms→ crackingPhase=4，文字按钮出现
  crackingPhase.value = 2;
  playExternalSound('/crack.mp3', 1.0);

  setTimeout(() => {
    crackingPhase.value = 3;
    setTimeout(() => { crackingPhase.value = 4; }, 1000);
  }, 1800);
};

const toggleSpecimen = (id) => {
  activeSpecimen.value = activeSpecimen.value === id ? null : id;
};

const toggleRecord = (index) => {
  strataRecords.value[index].expanded = !strataRecords.value[index].expanded;
};

const closeFossil = () => {
  fossilRevealed.value = false;
  fossilPoem.value = '';
};

const closeFossilError = () => {
  fossilError.value = '';
};

const triggerFossilDivination = async () => {
  isDrillingFossil.value = true;
  fossilError.value = '';

  try {
    const savedRecords = JSON.parse(localStorage.getItem('melting_strata_records') || '[]');
    const texts = savedRecords.map(r => r.text).join('\n——\n');

    if (!texts.trim()) {
      fossilError.value = '岩层深处空无一物。';
      isDrillingFossil.value = false;
      return;
    }

    const poem = await fetchFossilPoem(texts);
    fossilPoem.value = poem;
    fossilRevealed.value = true;
  } catch (err) {
    fossilError.value = err.message || '钻探失败，地层拒绝回应。';
    console.error('[化石占卜]', err);
  } finally {
    isDrillingFossil.value = false;
  }
};

const handleSeal = async () => {
  if (!inputText.value.trim() || !canInput.value) return;

  isSealed.value = true;
  playExternalSound('/boom.mp3', 0.9);

  if (navigator.vibrate) {
    navigator.vibrate([50, 30, 50]);
  }

  isPageShaking.value = true;
  setTimeout(() => { isPageShaking.value = false; }, 200);

  const newRecord = {
    id: Date.now(),
    date: todayDate.value,
    text: inputText.value.trim(),
  };

  const savedRecords = JSON.parse(localStorage.getItem('melting_strata_records') || '[]');
  savedRecords.unshift(newRecord);
  if (savedRecords.length > 30) savedRecords.pop();
  localStorage.setItem('melting_strata_records', JSON.stringify(savedRecords));
  recentRecords.value = savedRecords.slice(0, 3);

  saveSentenceToCloud(inputText.value.trim()).then(success => {
    if (success) console.log('[封存] 云端归档完成');
  });

  if (isExhibitionMode.value) {
    triggerSilentResonance();
  }

  setTimeout(() => {
    worldDepth.value += 1;
    todayDepth.value += 1;
    depthJump.value = true;
    isDeepShaking.value = true;
    setTimeout(() => {
      depthJump.value = false;
      isDeepShaking.value = false;
    }, 300);
  }, 2000);

  setTimeout(() => { isSilenced.value = true; }, 2500);

  // 深渊回声：动画执行到一半时随机抽取
  setTimeout(() => {
    const randomEcho = MOCK_ECHOES[Math.floor(Math.random() * MOCK_ECHOES.length)];
    abyssEchoText.value = randomEcho;
    abyssEchoVisible.value = true;
    setTimeout(() => {
      abyssEchoVisible.value = false;
      setTimeout(() => { abyssEchoText.value = ''; }, 2000);
    }, 10000);
  }, 2500);

  setTimeout(() => {
    isSilenced.value = false;
    isSealed.value = false;
    inputText.value = '';
    isInputFocused.value = false;
    if (!isExhibitionMode.value) {
      hasPostedToday.value = true;
      localStorage.setItem('melting_last_post_date', todayDateStr());
    }
  }, 6000);
};

const triggerSilentResonance = async () => {
  if (!isSupabaseAvailable() || !supabase) {
    console.warn('[无声共鸣] Supabase 不可用');
    return;
  }

  isResonating.value = true;

  try {
    const resonance = await silentResonance(inputText.value.trim(), supabase);
    if (resonance) {
      resonanceText.value = resonance;
      resonanceVisible.value = true;
      setTimeout(() => {
        resonanceVisible.value = false;
        setTimeout(() => { resonanceText.value = ''; }, 3000);
      }, 5000);
    }
  } catch (error) {
    console.error('[无声共鸣]', error.message || error);
  } finally {
    isResonating.value = false;
  }
};

/**
 * 拾音器：纯代码合成布朗噪音
 * - Brown noise: 积分白噪音，等效为极低频的物理轰鸣
 * - BiquadFilterNode (lowpass, ~380Hz): 模拟深地层对高频的吸收
 * - gainNode 平滑淡入/淡出，避免爆音
 */
const toggleListening = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }

  if (isListening.value) {
    // 淡出
    const now = audioCtx.currentTime;
    gainNode.gain.cancelScheduledValues(now);
    gainNode.gain.setValueAtTime(gainNode.gain.value, now);
    gainNode.gain.linearRampToValueAtTime(0, now + 1.8);
    const src = noiseSource;
    const g = gainNode;
    setTimeout(() => {
      try { src.stop(); } catch {}
      g.disconnect();
    }, 2000);
    noiseSource = null;
    gainNode = null;
    isListening.value = false;
  } else {
    // 重置并启动
    const sampleRate = audioCtx.sampleRate;
    const bufferSize = sampleRate * 6; // 6 秒循环缓冲

    // Brown noise: 在每个采样点加上随机步进并积分
    const buffer = audioCtx.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.5;
    }

    noiseSource = audioCtx.createBufferSource();
    noiseSource.buffer = buffer;
    noiseSource.loop = true;

    // 深地层低通滤波：截掉高频，让轰鸣更加沉闷、厚重
    const lpf = audioCtx.createBiquadFilter();
    lpf.type = 'lowpass';
    lpf.frequency.value = 380;
    lpf.Q.value = 0.8;

    gainNode = audioCtx.createGain();
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.55, audioCtx.currentTime + 2.5);

    noiseSource.connect(lpf);
    lpf.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    noiseSource.start();

    isListening.value = true;
  }
};

// ============================================
// V. 生命周期
// ============================================

onMounted(() => {
  if (window.location.search.includes('mode=exhibition')) {
    isExhibitionMode.value = true;
    console.log('[上帝开关] 展览模式已激活');
  }

  const seen = localStorage.getItem('hasSeenMeltingIntro');
  if (!seen) {
    hasSeenIntro.value = false;
  } else {
    showSplash.value = true;
    setTimeout(() => { showSplash.value = false; }, 2500);
  }

  basePlaceholder.value = PLACEHOLDERS[Math.floor(Math.random() * PLACEHOLDERS.length)];

  if (!isExhibitionMode.value) {
    const lastPostDate = localStorage.getItem('melting_last_post_date');
    if (lastPostDate === todayDateStr()) {
      hasPostedToday.value = true;
    }
  }

  const savedRecords = JSON.parse(localStorage.getItem('melting_strata_records') || '[]');
  recentRecords.value = savedRecords.slice(0, 3);

  worldDepth.value = 8432;
  todayDepth.value = 124;

  console.log('[One Sentence] 初始化完成', {
    mode: isExhibitionMode.value ? 'exhibition' : 'normal',
    supabase: isSupabaseAvailable() ? 'connected' : 'unavailable',
  });
});

watch(isExhibitionMode, (newVal) => {
  if (newVal) hasPostedToday.value = false;
});
</script>

<template>
  <!-- ============================================
       根容器 - 深渊
       ============================================ -->
  <div class="abyss-root" :class="{ 'shake-x': isPageShaking, 'shake-y': isDeepShaking }">

    <!-- 深渊纹理 -->
    <div class="abyss-texture" aria-hidden="true"></div>
    
    <!-- 深渊呼吸 -->
    <div class="abyss-breath" aria-hidden="true"></div>

    <!-- 火柴光效 -->
    <div v-if="isLampLit && !isSealed" class="flame-glow" aria-hidden="true"></div>

    <!-- 西西弗斯隐形水印 -->
    <div class="sisyphus-watermark" :class="{ 'lit': isLampLit }" aria-hidden="true">
      Il faut imaginer Sisyphe heureux.
    </div>

    <!-- ============================================
         引导页 - 系统旁白
         ============================================ -->
    <div v-if="!hasSeenIntro" class="intro-void" @click="nextIntroStep">
      <div class="intro-content">
        <transition name="fade-philosophy" mode="out-in">
          <p :key="introStep" class="intro-copy">{{ INTRO_TEXTS[introStep] }}</p>
        </transition>
      </div>
      <div class="intro-hint">
        <span class="hint-text">点击继续</span>
      </div>
    </div>

    <!-- ============================================
         闪屏
         ============================================ -->
    <transition name="fade-abyss">
      <div v-if="hasSeenIntro && showSplash" class="splash-void">
        <p class="splash-copy">你今天，存在过吗？</p>
      </div>
    </transition>

    <!-- ============================================
         主界面
         ============================================ -->
    <div v-if="hasSeenIntro && !showSplash" class="main-chamber">

      <!-- 顶栏 - 科研仪器刻度 -->
      <header class="top-bar" :class="{ 'faded': isSealed }">
        <div class="corner corner--tl">
          <span class="corner-label">TOTAL DEPTH</span>
          <span class="corner-value" :class="{ 'pulse': depthJump }">
            {{ worldDepth.toLocaleString() }}<em>m</em>
          </span>
          <span v-if="currentEpoch" class="corner-epoch">{{ currentEpoch }}</span>
        </div>
        <div class="corner corner--tr">
          <span class="corner-label">TODAY'S SINK</span>
          <span class="corner-value corner-value--dim">+{{ todayDepth.toLocaleString() }}m</span>
        </div>
      </header>

      <!-- 中央输入区 - 地心引力 -->
      <main class="center-zone" :class="{ 'faded': isSealed }">
        
        <h1 class="center-title">
          这里没有围观<br />
          <span class="center-sub">写下它。压入岩层。</span>
        </h1>

        <!-- 提交后的冰冷终结语 -->
        <div v-if="hasPostedToday && !isSealed && !isExhibitionMode" class="sealed-done">
          <p class="sealed-title">今日沉积已完成。</p>
          <p class="sealed-sub">地层已封闭。</p>
        </div>

        <!-- 正常输入状态 -->
        <template v-else>
          <div
            class="input-zone"
            :class="{ 'focused': isInputFocused }"
            :style="dynamicSinkStyle"
          >
            <textarea
              v-model="inputText"
              :maxlength="MAX_CHARS"
              :placeholder="currentPlaceholder"
              :disabled="isSealed || !canInput"
              class="input-field"
              @focus="isInputFocused = true"
              @blur="isInputFocused = false"
            ></textarea>
            <div class="input-underline"></div>
          </div>

          <div class="input-controls">
            <span class="char-count" :class="charColorClass">
              {{ inputText.length }} / {{ MAX_CHARS }}
            </span>
            <button
              @click="handleSeal"
              :disabled="!inputText.trim() || !canInput"
              class="seal-btn"
            >封存</button>
          </div>
        </template>

        <!-- 西西弗斯投影 -->
        <div class="sisyphus-shadow" aria-hidden="true"></div>
      </main>

      <!-- 底栏 -->
      <footer class="bottom-bar" :class="{ 'faded': isSealed }">
        <button @click="showManifesto = true" class="menu-btn">[ 标本盒 ]</button>
        <button @click="showAbout = true" class="menu-btn">[ 溯源 ]</button>
        <button @click="toggleLamp" class="menu-btn">
          [ {{ isLampLit ? '熄灭' : '划一根火柴' }} ]
        </button>
        <button @click="openRecords" class="menu-btn">[ 岩层深处 ]</button>
        <button @click="toggleListening" class="menu-btn menu-btn--ghost">
          [ 拾音器 {{ isListening ? '· 运转中' : '' }} ]
        </button>
        <button
          v-if="canShowFossilButton"
          @click="triggerFossilDivination"
          :disabled="isDrillingFossil"
          class="menu-btn menu-btn--ghost"
        >
          {{ isDrillingFossil ? '钻探中...' : '化石占卜' }}
        </button>
      </footer>
    </div>

    <!-- ============================================
         静默屏
         ============================================ -->
    <transition name="fade-abyss">
      <div v-if="isSilenced" class="silence-screen">
        <p class="silence-text">已沉入岩层</p>
      </div>
    </transition>

    <!-- ============================================
         月末锁定提示
         ============================================ -->
    <transition name="fade-philosophy">
      <div v-if="showLockMessage" class="lock-screen">
        <p class="lock-text">岩层需要时间。<br />月末会裂开。</p>
      </div>
    </transition>

    <!-- ============================================
         标本盒
         ============================================ -->
    <transition name="slide-from-depth">
      <div v-if="showManifesto" class="panel" @click.self="showManifesto = false">
        <button @click="showManifesto = false" class="panel-close">×</button>
        <div class="panel-content">
          <h2 class="panel-title">情绪标本馆</h2>
          <p class="panel-sub">只保存重量。</p>
          <div class="specimen-list">
            <div v-for="item in SPECIMENS" :key="item.id" class="specimen-item">
              <button @click="toggleSpecimen(item.id)" class="specimen-head">
                <span class="specimen-id">{{ item.id }}</span>
                <span class="specimen-type">{{ item.type }}</span>
              </button>
              <div class="specimen-body" :class="{ 'open': activeSpecimen === item.id }">
                <p class="specimen-text">{{ item.text }}</p>
              </div>
            </div>
          </div>
          <p class="panel-hint">点击任意处返回</p>
        </div>
      </div>
    </transition>

    <!-- ============================================
         溯源
         ============================================ -->
    <transition name="fade-deep">
      <div v-if="showAbout" class="panel panel--overlay" @click="showAbout = false">
        <div class="panel-box" @click.stop>
          <button @click="showAbout = false" class="panel-close">×</button>
          <div class="about-text">
            <p>某个凌晨三点，风穿过空荡的街道。<br />痛苦无声，却真实得无处安放。</p>
            <p>人生犹如一辆夜行列车，<br />我们途经荒原，四周寥落，万物萧索。</p>
            <p>是绝对的孤独？还是灵魂的战栗？<br />在这片言语无法抵达的深渊，<br />悲喜交叠，最终化为巨大的空。</p>
            <p>于是有了这片岩层。<br />不是为了遗忘，<br />而是让所有无法言说的重量，<br />在沉默中，被时间压成化石。</p>
            <p class="about-sig">——一个还在读书的人</p>
          </div>
          <p class="panel-hint">点击任意处返回</p>
        </div>
      </div>
    </transition>

    <!-- ============================================
         月末破裂仪式
         ============================================ -->
    <div v-if="crackingPhase > 0" class="crack-screen" @click.self="crackingPhase = 0">
      <div v-if="crackingPhase >= 2" class="crack-visual">
        <div v-if="crackingPhase >= 3" class="crack-light"></div>
        <svg class="crack-svg" viewBox="0 0 100 1000" preserveAspectRatio="none">
          <path
            class="crack-path"
            :class="{ 'tear': crackingPhase >= 3 }"
            d="M50,0 L38,120 L62,280 L42,450 L58,600 L35,780 L65,880 L45,1000"
          />
        </svg>
      </div>
      <transition name="fade-philosophy">
        <div v-if="crackingPhase === 4" class="crack-result">
          <p class="crack-text">压力形成了岩层</p>
          <button @click="showRecords = true; crackingPhase = 0;" class="crack-btn">
            查看这一月
          </button>
        </div>
      </transition>
    </div>

    <!-- ============================================
         地质剖面
         ============================================ -->
    <transition name="fade-deep">
      <div v-if="showRecords" class="panel" @click.self="showRecords = false">
        <button @click="showRecords = false" class="panel-close">×</button>
        <div class="panel-content">
          <h2 class="panel-title panel-title--sm">地层横截面</h2>
          <div class="records-list">
            <div class="records-axis"></div>
            <div v-for="record in strataRecords" :key="record.id" class="record-item">
              <button @click="toggleRecord(strataRecords.indexOf(record))" class="record-head">
                <div class="record-line"></div>
                <span class="record-title">{{ record.title }}</span>
              </button>
              <div class="record-body" :class="{ 'open': record.expanded }">
                <p class="record-text">{{ record.text }}</p>
              </div>
            </div>
          </div>
          <p class="panel-hint">点击任意处返回</p>
        </div>
      </div>
    </transition>

    <!-- ============================================
         化石占卜
         ============================================ -->
    <transition name="fossil-emerge">
      <div v-if="fossilRevealed" class="fossil-screen" @click="closeFossil">
        <button @click.stop="closeFossil" class="fossil-close">×</button>
        <p class="fossil-text">{{ fossilPoem }}</p>
        <p class="fossil-hint">点击任意处返回</p>
      </div>
    </transition>

    <transition name="fade-philosophy">
      <div v-if="fossilError" class="fossil-screen" @click="closeFossilError">
        <button @click.stop="closeFossilError" class="fossil-close">×</button>
        <p class="fossil-err">{{ fossilError }}</p>
        <p class="fossil-hint">点击任意处返回</p>
      </div>
    </transition>

    <!-- ============================================
         无声共鸣
         ============================================ -->
    <transition name="resonance">
      <div v-if="resonanceVisible" class="resonance-screen">
        <p class="resonance-text">{{ resonanceText }}</p>
      </div>
    </transition>

    <!-- ============================================
         深渊回声
         ============================================ -->
    <transition name="abyss-echo">
      <div v-if="abyssEchoVisible" class="abyss-echo-screen">
        <p class="abyss-echo-days">342 天前，有人在此埋下类似的痛苦：</p>
        <p class="abyss-echo-text">"{{ abyssEchoText }}"</p>
      </div>
    </transition>
  </div>
</template>

<style>
/* ============================================
   全局重置
   ============================================ */
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  font-size: 16px;
  -webkit-text-size-adjust: 100%;
  text-size-adjust: 100%;
}

body {
  background-color: #030304;
  color: #C8C8C8;
  font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Helvetica Neue", Arial, sans-serif;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  -webkit-tap-highlight-color: transparent;
  overflow: hidden;
}

* {
  user-select: none;
  -webkit-user-select: none;
  box-shadow: none !important;
  border-radius: 0 !important;
}

::-webkit-scrollbar { display: none; }
</style>

<style scoped>
/* ============================================
   根容器 - 深渊质感
   ============================================ */
.abyss-root {
  width: 100vw;
  height: 100vh;
  height: 100dvh;
  background:
    /* 岩石颗粒噪点层 */
    url('data:image/svg+xml,%3Csvg viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg"%3E%3Cfilter id="noise"%3E%3CfeTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" stitchTiles="stitch" seed="66"/%3E%3CfeColorMatrix type="saturate" values="0"/%3E%3C/filter%3E%3Crect width="100%25" height="100%25" filter="url(%23noise)"/%3E%3C/svg%3E'),
    /* 中心微光 */
    radial-gradient(ellipse at 50% 50%, #111 0%, #0a0a0a 40%, #050505 70%, #000 100%);
  background-blend-mode: overlay, normal;
  position: relative;
  overflow: hidden;
}

/* 深渊纹理 - 叠加层 */
.abyss-texture {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  opacity: 0.4;
  background-image: url('data:image/svg+xml,%3Csvg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"%3E%3Cfilter id="noise"%3E%3CfeTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="4" stitchTiles="stitch" seed="24"/%3E%3C/filter%3E%3Crect width="100%25" height="100%25" filter="url(%23noise)" opacity="0.12"/%3E%3C/svg%3E');
  mix-blend-mode: overlay;
}

/* 深渊呼吸 */
.abyss-breath {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  background: 
    radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(0, 0, 0, 0.15) 100%);
  animation: abyss-breathe 8s ease-in-out infinite;
}

@keyframes abyss-breathe {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.7; }
}

/* 震动 */
.shake-x { animation: shake-x 0.2s ease-in-out; }
@keyframes shake-x {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-3px); }
  75% { transform: translateX(3px); }
}

.shake-y { animation: shake-y 0.3s ease-in-out; }
@keyframes shake-y {
  0%, 100% { transform: translateY(0); }
  30% { transform: translateY(-5px); }
  60% { transform: translateY(4px); }
}

/* ============================================
   火柴光效 - 真实物理摇曳
   ============================================ */
.flame-glow {
  position: fixed;
  top: 55%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 120vmin;
  height: 120vmin;
  max-width: 900px;
  max-height: 900px;
  background: radial-gradient(
    ellipse 80% 60% at 50% 45%,
    rgba(214, 110, 24, 0.15) 0%,
    rgba(180, 80, 20, 0.08) 30%,
    rgba(140, 55, 15, 0.04) 55%,
    transparent 75%
  );
  filter: blur(60px);
  animation: flame-waver 0.14s infinite alternate;
  pointer-events: none;
  z-index: 1;
  transition: opacity 1.2s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 真实火焰摇曳：opacity 在 0.6-0.9 间游走，制造随时被风吹灭的物理焦灼感 */
@keyframes flame-waver {
  0% {
    opacity: 0.82;
    transform: translate(-50%, -50%) scale(1) rotate(-0.3deg);
  }
  23% {
    opacity: 0.65;
    transform: translate(-50%, -50%) scale(0.97) rotate(0.5deg) translateY(2px);
  }
  45% {
    opacity: 0.88;
    transform: translate(-50%, -50%) scale(1.02) rotate(-0.2deg) translateY(-1px);
  }
  78% {
    opacity: 0.72;
    transform: translate(-50%, -50%) scale(0.96) rotate(0.7deg) translateY(3px);
  }
  100% {
    opacity: 0.78;
    transform: translate(-50%, -50%) scale(1.01) rotate(-0.4deg) translateY(1px);
  }
}

/* ============================================
   引导页 - 系统旁白
   ============================================ */
.intro-void {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 64px;
  background: radial-gradient(ellipse at center, rgba(5, 5, 7, 0.3) 0%, transparent 70%);
}

.intro-content {
  max-width: 840px;
  text-align: center;
}

.intro-copy {
  font-size: clamp(22px, 4.5vw, 34px);
  font-weight: 300;
  letter-spacing: 0.12em;
  color: #A8A8A8;
  text-align: center;
  white-space: pre-line;
  line-height: 2.2;
  text-shadow: 0 0 60px rgba(255, 255, 255, 0.03);
}

.intro-hint {
  position: absolute;
  bottom: 88px;
  left: 50%;
  transform: translateX(-50%);
}

.hint-text {
  font-size: 11px;
  letter-spacing: 0.5em;
  color: rgba(255, 255, 255, 0.4);
  animation: breathe-hint 4s ease-in-out infinite;
}

@keyframes breathe-hint {
  0%, 100% { opacity: 0.15; }
  50% { opacity: 0.6; }
}

/* ============================================
   闪屏
   ============================================ */
.splash-void {
  position: fixed;
  inset: 0;
  z-index: 90;
  background: #020203;
  display: flex;
  align-items: center;
  justify-content: center;
}

.splash-copy {
  font-size: 12px;
  letter-spacing: 1em;
  color: rgba(255, 255, 255, 0.15);
  animation: breathe-hint 2.5s ease-in-out infinite;
}

/* ============================================
   主视口
   ============================================ */
.main-chamber {
  position: absolute;
  inset: 0;
  display: grid;
  grid-template-rows: auto 1fr auto;
  padding: 60px;
  z-index: 2;
}

/* ============================================
   顶栏 - 科研仪器
   ============================================ */
.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  transition: opacity 3.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.top-bar.faded { opacity: 0.06; }

.corner {
  display: flex;
  flex-direction: column;
}

.corner--tl { align-items: flex-start; }
.corner--tr { align-items: flex-end; }

.corner-label {
  font-size: 12px;
  letter-spacing: 0.25em;
  color: #777777;
  font-family: "SF Mono", "Fira Code", monospace;
  margin-bottom: 14px;
}

.corner-value {
  font-size: 12px;
  letter-spacing: 0.08em;
  color: #777777;
  font-family: "SF Mono", "Fira Code", monospace;
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), color 0.4s;
}

.corner-value.pulse {
  transform: translateY(-5px) scale(1.1);
  color: #aaaaaa;
}

.corner-value em {
  font-style: normal;
  font-size: 11px;
  color: #555555;
  margin-left: 5px;
}

.corner-value--dim {
  font-size: 12px;
  color: #666666;
  letter-spacing: 0.12em;
}

.corner-epoch {
  font-size: 11px;
  letter-spacing: 0.4em;
  color: #444444;
  margin-top: 18px;
  animation: breathe-hint 7s ease-in-out infinite;
}

/* ============================================
   中央输入区 - 地心引力
   ============================================ */
.center-zone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 52px;
  position: relative;
  transition: opacity 3.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.center-zone.faded { opacity: 0; }

.center-title {
  font-size: clamp(26px, 4vw, 40px);
  font-weight: 200;
  letter-spacing: 0.15em;
  color: #989898;
  text-align: center;
  line-height: 2;
}

.center-sub {
  font-weight: 300;
  color: #666;
  font-size: 0.65em;
}

.input-zone {
  width: 100%;
  max-width: 680px;
  position: relative;
}

.input-field {
  width: 100%;
  height: 168px;
  background: transparent;
  border: none;
  outline: none;
  resize: none;
  font-size: 18px;
  font-weight: 300;
  color: #CCCCCC;
  letter-spacing: 0.05em;
  line-height: 2.4;
  padding: 0 0 28px;
  font-family: inherit;
  caret-color: rgba(200, 200, 200, 0.35);
}

.input-field::placeholder {
  color: rgba(255, 255, 255, 0.25);
  font-weight: 300;
}

.input-field:disabled {
  opacity: 0.2;
}

.input-underline {
  height: 1px;
  background: #121212;
  position: relative;
}

.input-underline::after {
  content: '';
  position: absolute;
  left: 0;
  right: 100%;
  top: 0;
  height: 1px;
  background: linear-gradient(90deg, #555 0%, #333 100%);
  transition: right 1s cubic-bezier(0.4, 0, 0.2, 1);
}

.input-zone.focused .input-underline::after {
  right: 0;
}

.input-controls {
  width: 100%;
  max-width: 680px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.char-count {
  font-size: 11px;
  letter-spacing: 0.2em;
  font-family: "SF Mono", "Fira Code", monospace;
  color: rgba(255, 255, 255, 0.3);
}

.seal-btn {
  font-size: 12px;
  letter-spacing: 0.35em;
  color: rgba(255, 255, 255, 0.45);
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 12px 0;
  transition: color 0.6s cubic-bezier(0.4, 0, 0.2, 1), letter-spacing 0.6s;
  font-family: inherit;
}

.seal-btn:disabled {
  opacity: 0.15;
  cursor: not-allowed;
}

.seal-btn:not(:disabled):hover {
  color: rgba(255, 255, 255, 0.85);
  letter-spacing: 0.5em;
}

.fossil-echo {
  display: none; /* 隐入背景，不干扰主视觉 */
}

/* ============================================
   西西弗斯投影 - 荒诞命运感
   ============================================ */
.sisyphus-shadow {
  position: fixed;
  top: -40%;
  left: -20%;
  width: 140vw;
  height: 140vh;
  pointer-events: none;
  z-index: 0;
  opacity: 0.025;
  background: radial-gradient(ellipse at 60% 70%, rgba(60, 50, 40, 0.8) 0%, transparent 50%);
  filter: blur(80px);
  animation: sisyphus-drift 60s linear infinite;
}

@keyframes sisyphus-drift {
  0% { transform: translate(0, 0) rotate(0deg); }
  25% { transform: translate(3vw, 2vh) rotate(1deg); }
  50% { transform: translate(1vw, 4vh) rotate(-0.5deg); }
  75% { transform: translate(-2vw, 1vh) rotate(0.5deg); }
  100% { transform: translate(0, 0) rotate(0deg); }
}

/* 西西弗斯隐形水印 - 火柴点亮时浮现 */
.sisyphus-watermark {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 0;
  font-size: 11px;
  letter-spacing: 0.18em;
  color: rgba(255, 255, 255, 0.06);
  font-style: italic;
  opacity: 0;
  transition: opacity 3s cubic-bezier(0.4, 0, 0.2, 1);
  pointer-events: none;
  white-space: nowrap;
}

.sisyphus-watermark.lit {
  opacity: 0.28;
  text-shadow: 0 0 10px rgba(214, 110, 24, 0.5);
}

/* ============================================
   底栏
   ============================================ */

.bottom-bar.faded { opacity: 0; }

.menu-btn {
  font-size: 12px;
  letter-spacing: 0.25em;
  color: rgba(255, 255, 255, 0.4);
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 10px 0;
  transition: color 0.6s;
  font-family: inherit;
}

.menu-btn:hover { color: rgba(255, 255, 255, 0.85); }

.menu-btn--ghost {
  opacity: 0.6;
}

.menu-btn--ghost:hover { opacity: 0.95; }

.menu-btn:disabled { opacity: 0.15; cursor: not-allowed; }

/* ============================================
   静默屏
   ============================================ */
.silence-screen {
  position: fixed;
  inset: 0;
  z-index: 80;
  background: #010102;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.silence-text {
  font-size: 12px;
  letter-spacing: 1em;
  color: rgba(255, 255, 255, 0.15);
}

/* ============================================
   锁定提示
   ============================================ */
.lock-screen {
  position: fixed;
  inset: 0;
  z-index: 85;
  background: rgba(1, 1, 2, 0.99);
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.lock-text {
  font-size: 12px;
  letter-spacing: 0.35em;
  color: rgba(255, 255, 255, 0.2);
  text-align: center;
  line-height: 3;
}

/* ============================================
   面板
   ============================================ */
.panel {
  position: fixed;
  inset: 0;
  z-index: 50;
  background: #030304;
  overflow-y: auto;
  cursor: pointer;
}

.panel--overlay {
  background: rgba(3, 3, 4, 0.98);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.panel-close {
  position: fixed;
  top: 52px;
  right: 60px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
  background: transparent;
  border: none;
  cursor: pointer;
  opacity: 0.35;
  transition: opacity 0.6s;
  z-index: 10;
}

.panel-close:hover { opacity: 0.85; }

.panel-content {
  max-width: 720px;
  margin: 0 auto;
  padding: 100px 60px 80px;
  cursor: default;
}

.panel-box {
  max-width: 640px;
  padding: 60px;
  cursor: default;
}

.panel-title {
  font-size: 20px;
  letter-spacing: 0.4em;
  color: rgba(255, 255, 255, 0.75);
  text-align: center;
  margin-bottom: 20px;
  font-weight: 300;
}

.panel-title--sm {
  font-size: 16px;
  letter-spacing: 0.5em;
}

.panel-sub {
  font-size: 12px;
  letter-spacing: 0.3em;
  color: rgba(255, 255, 255, 0.35);
  text-align: center;
  margin-bottom: 80px;
}

.panel-hint {
  text-align: center;
  margin-top: 72px;
  font-size: 11px;
  letter-spacing: 0.35em;
  color: rgba(255, 255, 255, 0.25);
  animation: breathe-hint 4s ease-in-out infinite;
}

/* 标本列表 */
.specimen-list {
  display: flex;
  flex-direction: column;
}

.specimen-item {
  border-top: 1px solid #0d0d0d;
}

.specimen-head {
  width: 100%;
  padding: 36px 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: transparent;
  border: none;
  cursor: pointer;
}

.specimen-id {
  font-size: 12px;
  letter-spacing: 0.12em;
  color: rgba(255, 255, 255, 0.5);
  font-family: "SF Mono", monospace;
}

.specimen-type {
  font-size: 11px;
  letter-spacing: 0.25em;
  color: rgba(255, 255, 255, 0.3);
}

.specimen-body {
  max-height: 0;
  overflow: hidden;
  opacity: 0;
  transition: max-height 1s cubic-bezier(0.4, 0, 0.2, 1), opacity 1s cubic-bezier(0.4, 0, 0.2, 1);
}

.specimen-body.open {
  max-height: 240px;
  opacity: 1;
  padding-bottom: 36px;
}

.specimen-text {
  font-size: 14px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.45);
  letter-spacing: 0.02em;
  line-height: 2.6;
  padding-left: 28px;
  border-left: 1px solid #141414;
}

/* 溯源 */
.about-text {
  font-size: 14px;
  display: flex;
  flex-direction: column;
  gap: 44px;
  text-align: center;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
  letter-spacing: 0.04em;
  line-height: 2.8;
}

.about-sig {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.3);
  letter-spacing: 0.18em;
  margin-top: 36px;
}

/* 地质剖面 */
.records-list {
  position: relative;
  padding-left: 72px;
}

.records-axis {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 1px;
  background: #0a0a0a;
}

.record-item {
  padding: 32px 0;
  border-bottom: 1px solid #0a0a0a;
}

.record-head {
  display: flex;
  align-items: center;
  gap: 28px;
  background: transparent;
  border: none;
  cursor: pointer;
  text-align: left;
  width: 100%;
}

.record-line {
  width: 72px;
  height: 1px;
  background: #141414;
  transform-origin: left;
  transition: background 0.5s, width 0.5s;
}

.record-head:hover .record-line {
  background: #2a2a2a;
  width: 90px;
}

.record-title {
  font-size: 11px; letter-spacing: 0.2em;
  color: rgba(255, 255, 255, 0.3);
  font-family: "SF Mono", monospace;
  transition: color 0.5s;
}

.record-head:hover .record-title { color: rgba(255, 255, 255, 0.6); }

.record-body {
  max-height: 0;
  overflow: hidden;
  opacity: 0;
  margin-left: 100px;
  transition: max-height 0.7s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.7s;
}

.record-body.open {
  max-height: 180px;
  opacity: 1;
  padding-top: 24px;
}

.record-text {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.35);
  letter-spacing: 0.02em;
  line-height: 2.4;
}

/* ============================================
   破裂仪式
   ============================================ */
.crack-screen {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: #010102;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  cursor: pointer;
}

.crack-visual {
  position: relative;
  width: 100%;
  height: 100%;
}

.crack-light {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 2px;
  height: 45%;
  background: linear-gradient(180deg, transparent 0%, #444 30%, #555 50%, #444 70%, transparent 100%);
  filter: blur(3px);
  opacity: 0.7;
}

.crack-svg {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 28px;
  height: 65%;
  opacity: 0.8;
}

.crack-path {
  fill: none;
  stroke: #101010;
  stroke-width: 1;
  stroke-dasharray: 2000;
  stroke-dashoffset: 2000;
  animation: crack-grow 1.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
}

@keyframes crack-grow { to { stroke-dashoffset: 0; } }

.crack-path.tear {
  stroke: #404040;
  stroke-width: 2;
  filter: drop-shadow(0 0 6px rgba(100, 100, 100, 0.6));
  transition: stroke 0.6s cubic-bezier(0.4, 0, 0.2, 1), stroke-width 0.4s, filter 0.6s;
}

.crack-result {
  position: absolute;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 64px;
}

.crack-text {
  font-size: 11px;
  letter-spacing: 1em;
  color: rgba(255, 255, 255, 0.25);
}

.crack-btn {
  font-size: 12px;
  letter-spacing: 0.4em;
  color: rgba(255, 255, 255, 0.35);
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 18px 36px;
  cursor: pointer;
  transition: border-color 0.5s, color 0.5s;
}

.crack-btn:hover {
  border-color: rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.6);
}

/* ============================================
   化石占卜
   ============================================ */
.fossil-screen {
  position: fixed;
  inset: 0;
  z-index: 300;
  background: #010102;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  cursor: pointer;
}

.fossil-close {
  position: fixed;
  top: 52px;
  right: 60px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  background: transparent;
  border: none;
  cursor: pointer;
  opacity: 0.3;
  transition: opacity 0.6s;
  z-index: 10;
}

.fossil-close:hover { opacity: 0.8; }

.fossil-text {
  font-size: 17px;
  letter-spacing: 0.3em;
  color: rgba(255, 255, 255, 0.5);
  text-align: center;
  line-height: 3;
  filter: blur(10px);
  opacity: 0;
  animation: fossil-uncover 6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  max-width: 760px;
  padding: 0 56px;
}

@keyframes fossil-uncover {
  0% { filter: blur(10px); opacity: 0; }
  40% { filter: blur(8px); opacity: 0.08; }
  70% { filter: blur(3px); opacity: 0.25; }
  100% { filter: blur(0); opacity: 1; }
}

.fossil-err {
  font-size: 12px;
  letter-spacing: 0.4em;
  color: rgba(255, 255, 255, 0.25);
  text-align: center;
  line-height: 3;
}

.fossil-hint {
  position: absolute;
  bottom: 88px;
  font-size: 11px;
  letter-spacing: 0.4em;
  color: rgba(255, 255, 255, 0.2);
  animation: breathe-hint 4s ease-in-out infinite;
}

/* ============================================
   无声共鸣
   ============================================ */
.resonance-screen {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 60;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 88px 60px;
  pointer-events: none;
}

.resonance-text {
  font-size: 10px;
  letter-spacing: 0.7em;
  color: rgba(255, 255, 255, 0.35);
  text-align: center;
  line-height: 2.4;
}

.resonance-enter-active { transition: opacity 7s cubic-bezier(0.4, 0, 0.2, 1); }
.resonance-enter-from { opacity: 0; }
.resonance-leave-active { transition: opacity 5s cubic-bezier(0.4, 0, 0.2, 1); }
.resonance-leave-to { opacity: 0; }

/* ============================================
   深渊回声
   ============================================ */
.abyss-echo-screen {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 60;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  padding: 100px 60px 120px;
  pointer-events: none;
}

.abyss-echo-days {
  font-size: 10px;
  letter-spacing: 0.25em;
  color: rgba(255, 255, 255, 0.25);
  margin-bottom: 12px;
}

.abyss-echo-text {
  font-size: 12px;
  letter-spacing: 0.15em;
  color: rgba(255, 255, 255, 0.4);
  text-align: center;
  font-style: italic;
  max-width: 600px;
}

.abyss-echo-enter-active { transition: opacity 5s cubic-bezier(0.4, 0, 0.2, 1); }
.abyss-echo-enter-from { opacity: 0; }
.abyss-echo-leave-active { transition: opacity 3s cubic-bezier(0.4, 0, 0.2, 1); }
.abyss-echo-leave-to { opacity: 0; }

/* ============================================
   密封完成
   ============================================ */
.sealed-done {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.sealed-title {
  font-size: 13px;
  letter-spacing: 0.3em;
  color: rgba(255, 255, 255, 0.4);
  font-weight: 300;
}

.sealed-sub {
  font-size: 11px;
  letter-spacing: 0.35em;
  color: rgba(255, 255, 255, 0.25);
}

/* ============================================
   过渡动画
   ============================================ */
.fade-philosophy-enter-active, .fade-philosophy-leave-active { transition: opacity 2.5s cubic-bezier(0.4, 0, 0.2, 1); }
.fade-philosophy-enter-from, .fade-philosophy-leave-to { opacity: 0; }

.fade-deep-enter-active, .fade-deep-leave-active { transition: opacity 3s cubic-bezier(0.4, 0, 0.2, 1); }
.fade-deep-enter-from, .fade-deep-leave-to { opacity: 0; }

.fade-abyss-enter-active, .fade-abyss-leave-active { transition: opacity 3.5s cubic-bezier(0.4, 0, 0.2, 1); }
.fade-abyss-enter-from, .fade-abyss-leave-to { opacity: 0; }

.slide-from-depth-enter-active, .slide-from-depth-leave-active { transition: transform 1s cubic-bezier(0.22, 1, 0.36, 1), opacity 1s; }
.slide-from-depth-enter-from, .slide-from-depth-leave-to { transform: translateY(100%); opacity: 0; }

.fossil-emerge-enter-active { transition: opacity 2s cubic-bezier(0.4, 0, 0.2, 1); }
.fossil-emerge-enter-from { opacity: 0; }
.fossil-emerge-leave-active { transition: opacity 1.5s cubic-bezier(0.4, 0, 0.2, 1); }
.fossil-emerge-leave-to { opacity: 0; }

/* ============================================
   选中
   ============================================ */
.abyss-root ::selection {
  background: rgba(70, 70, 70, 0.1);
  color: #666;
}
</style>
