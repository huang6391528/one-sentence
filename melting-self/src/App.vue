<script setup>
/**
 * ============================================
 * One Sentence - 情感艺术网页装置 v2.0
 * ============================================
 * 
 * 设计重构：
 * - 原研哉式极简主义：纯黑背景，无限留白
 * - Awwwards 级视觉张力：残酷的字体层级
 * - 坐标轴式布局：四角锚定，绝对居中
 */

import { ref, computed, onMounted, watch } from 'vue';
import { fetchFossilPoem } from './utils/deepseek.js';
import { playTectonicShift } from './utils/audioEngine.js';
import { saveSentenceToCloud, isSupabaseAvailable, supabase } from './utils/supabase.js';
import { silentResonance } from './utils/llm.js';

// ============================================
// I. 全局常量
// ============================================

const MAX_CHARS = 140;

const SPECIMENS = [
  { id: '#009', type: '夜行', text: '凌晨三点的街道，没有任何人知道你存在过。城市像一台暂停的机器，只有路灯在运行。' },
  { id: '#017', type: '异化', text: '我们以为自己在向上攀登，后来才发现，那只是把石头推上另一条转速更快的履带。' },
  { id: '#024', type: '荣光', text: '曾经跨越山海的勋章，成了一枚枚钉死在标本盒里的蝴蝶。美得窒息，却毫无生机。' },
  { id: '#042', type: '镜像', text: '那个曾经热烈过的"旧我"，成了审判此刻最严苛的法官。我们在隔着时间，审视一具陌生而完美的躯壳。' },
  { id: '#103', type: '凋零', text: '所谓怀旧，不是对青春的眷恋，而是对自我丧失的无力凭吊。我们哭泣，是惊觉那个自由意志的自己，早已被囚禁在过去的剪影里。' },
];

const INTRO_TEXTS = [
  '18岁\n你相信努力会改变命运',
  '后来\n你拥有了很多身份',
  '有些话\n不能说给任何人',
  '把它埋在这里',
];

const PLACEHOLDERS = [
  '这里没有围观...',
  '写下它，然后压入岩层...',
  '只有时间在听...',
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

const basePlaceholder = ref(PLACEHOLDERS[0]);
const currentPlaceholder = computed(() => {
  if (!canInput.value) return '今日的重量已落入地底。请等待下一个黑夜。';
  return basePlaceholder.value;
});

const todayDate = computed(() => {
  const d = new Date();
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
});

const currentEpoch = computed(() => {
  if (worldDepth.value >= 10000) return '黑曜石纪元';
  if (worldDepth.value >= 1000) return '沉积纪元';
  if (worldDepth.value >= 100) return '第一层地壳已形成';
  return '';
});

const charColorClass = computed(() => {
  const len = inputText.value.length;
  if (len >= MAX_CHARS) return 'text-[#555]';
  if (len > 100) return 'text-[#444]';
  return 'text-[#333]';
});

const dynamicSinkStyle = computed(() => {
  if (!isSealed.value) return {};
  return {
    transform: 'translateY(30px)',
    opacity: 0,
    transition: 'all 2.5s ease-in',
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
    setTimeout(() => { showLockMessage.value = false; }, 3000);
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

  crackingPhase.value = 1;
  setTimeout(() => {
    crackingPhase.value = 2;
    playSound('/crack.mp3', 0.8);
    setTimeout(() => {
      crackingPhase.value = 3;
      setTimeout(() => { crackingPhase.value = 4; }, 1000);
    }, 1500);
  }, 500);
};

const playSound = (src, volume = 0.6) => {
  try {
    const sound = new Audio(src);
    sound.volume = volume;
    sound.play().catch(() => {});
  } catch {}
};

const toggleSpecimen = (id) => {
  activeSpecimen.value = activeSpecimen.value === id ? null : id;
};

const toggleRecord = (index) => {
  strataRecords.value[index].expanded = !strataRecords.value[index].expanded;
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

  playSound('/stone.mp3', 0.6);
  setTimeout(() => playTectonicShift(), 200);

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
    if (success) console.log('[封存] 云端归档成功');
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

  setTimeout(() => {
    isSilenced.value = false;
    isSealed.value = false;
    inputText.value = '';
    if (!isExhibitionMode.value) {
      hasPostedToday.value = true;
      localStorage.setItem('melting_last_post_date', new Date().toDateString());
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

// ============================================
// V. 生命周期
// ============================================

onMounted(() => {
  if (window.location.search.includes('mode=exhibition')) {
    isExhibitionMode.value = true;
    console.log('[God Switch] 展览模式已激活');
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
    if (lastPostDate === new Date().toDateString()) {
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
       根容器
       ============================================ -->
  <div class="app-root" :class="{ 'shake-x': isPageShaking, 'shake-y': isDeepShaking }">

    <!-- 噪点纹理 -->
    <div class="noise-layer" aria-hidden="true"></div>

    <!-- 油灯光效 -->
    <div v-if="isLampLit && !isSealed" class="lamp-glow" aria-hidden="true"></div>

    <!-- ============================================
         引导页
         ============================================ -->
    <div v-if="!hasSeenIntro" class="intro-screen" @click="nextIntroStep">
      <transition name="fade" mode="out-in">
        <p :key="introStep" class="intro-text">{{ INTRO_TEXTS[introStep] }}</p>
      </transition>
      <p class="intro-hint">点击继续</p>
    </div>

    <!-- ============================================
         闪屏
         ============================================ -->
    <transition name="fade">
      <div v-if="hasSeenIntro && showSplash" class="splash-screen">
        <p class="splash-text">你今天，存在过吗？</p>
      </div>
    </transition>

    <!-- ============================================
         主界面
         ============================================ -->
    <div v-if="hasSeenIntro && !showSplash" class="main-viewport">

      <!-- ============================================
           顶栏：坐标轴式锚定
           ============================================ -->
      <header class="top-bar" :class="{ 'faded': isSealed }">
        <!-- 左上：总深度 -->
        <div class="corner-marker corner-tl">
          <p class="meta-label">Total Depth</p>
          <p class="meta-value" :class="{ 'jump': depthJump }">
            {{ worldDepth.toLocaleString() }}
            <span class="meta-unit">m</span>
          </p>
          <p v-if="currentEpoch" class="meta-epoch">{{ currentEpoch }}</p>
        </div>

        <!-- 右上：今日新增 -->
        <div class="corner-marker corner-tr">
          <p class="meta-label">Today's Sink</p>
          <p class="meta-value-dim">+{{ todayDepth.toLocaleString() }}</p>
        </div>
      </header>

      <!-- ============================================
           中央输入区：视觉统治力
           ============================================ -->
      <main class="central-input" :class="{ 'faded': isSealed }">
        <!-- 核心标题 -->
        <h1 class="core-title">
          这里没有围观<br />
          写下它，然后压入岩层
        </h1>

        <!-- 输入框容器 -->
        <div class="input-zone" :style="dynamicSinkStyle">
          <textarea
            v-model="inputText"
            :maxlength="MAX_CHARS"
            :placeholder="currentPlaceholder"
            :disabled="isSealed || !canInput"
            class="core-textarea"
          ></textarea>

          <!-- 控制栏 -->
          <div class="input-controls">
            <span class="char-counter" :class="charColorClass">
              {{ inputText.length }} / {{ MAX_CHARS }}
            </span>
            <button
              @click="handleSeal"
              :disabled="!inputText.trim() || !canInput"
              class="seal-btn"
            >埋下</button>
          </div>
        </div>

        <!-- 往日回音（极淡背景） -->
        <div class="echo-ghost">
          <p v-for="(r, i) in recentRecords" :key="i" class="echo-line">{{ r.text }}</p>
        </div>
      </main>

      <!-- ============================================
           底栏：电影字幕式菜单
           ============================================ -->
      <footer class="bottom-bar" :class="{ 'faded': isSealed }">
        <button @click="showManifesto = true" class="menu-item">[ 标本盒 ]</button>
        <button @click="showAbout = true" class="menu-item">[ 溯源 ]</button>
        <button @click="toggleLamp" class="menu-item">
          [ {{ isLampLit ? '熄灭' : '划火柴' }} ]
        </button>
        <button @click="openRecords" class="menu-item">[ 岩层 ]</button>
        <button
          v-if="canShowFossilButton"
          @click="triggerFossilDivination"
          :disabled="isDrillingFossil"
          class="menu-item menu-item--ghost"
        >
          {{ isDrillingFossil ? '钻探中...' : '化石占卜' }}
        </button>
      </footer>
    </div>

    <!-- ============================================
         静默屏
         ============================================ -->
    <transition name="fade-slow">
      <div v-if="isSilenced" class="silence-screen">
        <p class="silence-text">已沉入岩层</p>
      </div>
    </transition>

    <!-- ============================================
         月末锁定提示
         ============================================ -->
    <transition name="fade">
      <div v-if="showLockMessage" class="lock-screen">
        <p class="lock-text">岩层需要时间<br />月末会裂开</p>
      </div>
    </transition>

    <!-- ============================================
         标本盒
         ============================================ -->
    <transition name="slide-up">
      <div v-if="showManifesto" class="panel">
        <button @click="showManifesto = false" class="panel-close">×</button>
        <div class="panel-inner">
          <h2 class="panel-title">情绪标本馆</h2>
          <p class="panel-sub">只保存重量</p>
          <div class="specimen-list">
            <div v-for="item in SPECIMENS" :key="item.id" class="specimen-unit">
              <button @click="toggleSpecimen(item.id)" class="specimen-head">
                <span class="specimen-id">标本 {{ item.id }}</span>
                <span class="specimen-type">{{ item.type }}</span>
              </button>
              <div class="specimen-body" :class="{ 'open': activeSpecimen === item.id }">
                <p class="specimen-text">{{ item.text }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- ============================================
         溯源
         ============================================ -->
    <transition name="fade">
      <div v-if="showAbout" class="panel panel--overlay" @click="showAbout = false">
        <div class="panel-inner" @click.stop>
          <button @click="showAbout = false" class="panel-close">×</button>
          <div class="about-text">
            <p>某个凌晨三点，风穿过空荡的街道。<br />痛苦无声，却真实得无处安放。</p>
            <p>人生犹如一辆夜行列车，<br />我们途经荒原，四周寥落，万物萧索。</p>
            <p>是绝对的孤独？还是灵魂的战栗？<br />在这片言语无法抵达的深渊，<br />悲喜交叠，最终化为巨大的空。</p>
            <p>于是有了这片岩层。<br />不是为了遗忘，<br />而是让所有无法言说的重量，<br />在沉默中，被时间压成化石。</p>
            <p class="about-sig">——一个还在读书的人</p>
          </div>
        </div>
      </div>
    </transition>

    <!-- ============================================
         月末破裂仪式
         ============================================ -->
    <div v-if="crackingPhase > 0" class="crack-screen">
      <div v-if="crackingPhase >= 2" class="crack-visual">
        <div v-if="crackingPhase >= 3" class="crack-beam"></div>
        <svg class="crack-svg" viewBox="0 0 100 1000" preserveAspectRatio="none">
          <path
            class="crack-line"
            :class="{ 'glow': crackingPhase >= 3 }"
            d="M50,0 L38,120 L62,280 L42,450 L58,600 L35,780 L65,880 L45,1000"
          />
        </svg>
      </div>
      <transition name="fade">
        <div v-if="crackingPhase === 4" class="crack-reveal">
          <p class="crack-message">压力形成了岩层</p>
          <button @click="showRecords = true; crackingPhase = 0;" class="crack-action">查看这一月</button>
        </div>
      </transition>
    </div>

    <!-- ============================================
         地质剖面
         ============================================ -->
    <transition name="fade">
      <div v-if="showRecords" class="panel panel--records">
        <button @click="showRecords = false" class="panel-close">×</button>
        <div class="panel-inner">
          <h2 class="panel-title panel-title--small">Stratum Section</h2>
          <div class="records-list">
            <div class="records-axis"></div>
            <div v-for="record in strataRecords" :key="record.id" class="record-unit">
              <button @click="toggleRecord(strataRecords.indexOf(record))" class="record-head">
                <div class="record-mark"></div>
                <span class="record-title">{{ record.title }}</span>
              </button>
              <div class="record-body" :class="{ 'open': record.expanded }">
                <p class="record-text">{{ record.text }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- ============================================
         化石占卜
         ============================================ -->
    <transition name="fossil-reveal">
      <div v-if="fossilRevealed" class="fossil-screen">
        <p class="fossil-text">{{ fossilPoem }}</p>
        <button @click="fossilRevealed = false; fossilPoem = '';" class="fossil-close">关闭</button>
      </div>
    </transition>

    <transition name="fade">
      <div v-if="fossilError" class="fossil-screen">
        <p class="fossil-error">{{ fossilError }}</p>
        <button @click="fossilError = '';" class="fossil-close">[ 返回 ]</button>
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
}

body {
  background-color: #000;
  color: #333;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  -webkit-tap-highlight-color: transparent;
  overflow: hidden;
}

/* 禁止选中 */
* {
  user-select: none;
  -webkit-user-select: none;
}

/* 无阴影无圆角 */
* {
  box-shadow: none !important;
  border-radius: 0 !important;
}
</style>

<style scoped>
/* ============================================
   根容器
   ============================================ */
.app-root {
  width: 100vw;
  height: 100vh;
  height: 100dvh;
  background-color: #000;
  position: relative;
  overflow: hidden;
}

/* 震动动画 */
.shake-x { animation: shake-x 0.2s ease-in-out; }
@keyframes shake-x {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-2px); }
  75% { transform: translateX(2px); }
}

.shake-y { animation: shake-y 0.3s ease-in-out; }
@keyframes shake-y {
  0%, 100% { transform: translateY(0); }
  30% { transform: translateY(-4px); }
  60% { transform: translateY(3px); }
}

/* ============================================
   噪点纹理
   ============================================ */
.noise-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
  opacity: 0.03;
  mix-blend-mode: overlay;
  background-image: url('data:image/svg+xml,%3Csvg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"%3E%3Cfilter id="noise"%3E%3CfeTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" stitchTiles="stitch"/%3E%3C/filter%3E%3Crect width="100%25" height="100%25" filter="url(%23noise)"/%3E%3C/svg%3E');
}

/* ============================================
   油灯光效
   ============================================ */
.lamp-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100vmin;
  height: 100vmin;
  max-width: 800px;
  max-height: 800px;
  background: radial-gradient(circle, rgba(200, 100, 30, 0.15) 0%, rgba(150, 50, 20, 0.08) 40%, transparent 70%);
  filter: blur(60px);
  animation: flicker 4s infinite alternate;
  pointer-events: none;
  z-index: 2;
}

@keyframes flicker {
  0%, 100% { opacity: 0.9; }
  25% { opacity: 0.6; }
  50% { opacity: 1; }
  75% { opacity: 0.7; }
}

/* ============================================
   主视口
   ============================================ */
.main-viewport {
  position: absolute;
  inset: 0;
  display: grid;
  grid-template-rows: auto 1fr auto;
  padding: 40px;
}

/* ============================================
   顶栏：坐标轴式锚定
   ============================================ */
.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  transition: opacity 3s ease-in-out;
}

.top-bar.faded { opacity: 0.15; }

.corner-marker {
  display: flex;
  flex-direction: column;
}

.corner-tl { align-items: flex-start; }
.corner-tr { align-items: flex-end; }

.meta-label {
  font-size: 9px;
  letter-spacing: 5px;
  color: #444;
  text-transform: uppercase;
  font-family: "SF Mono", "Fira Code", monospace;
  margin-bottom: 6px;
}

.meta-value {
  font-size: 13px;
  letter-spacing: 2px;
  color: #555;
  font-family: "SF Mono", "Fira Code", monospace;
  transition: transform 0.2s;
}

.meta-value.jump {
  transform: translateY(-3px) scale(1.05);
}

.meta-unit {
  font-size: 10px;
  color: #444;
  margin-left: 2px;
}

.meta-value-dim {
  font-size: 11px;
  letter-spacing: 2px;
  color: #444;
  font-family: "SF Mono", "Fira Code", monospace;
}

.meta-epoch {
  font-size: 9px;
  letter-spacing: 3px;
  color: #333;
  margin-top: 8px;
  animation: breathe 4s ease-in-out infinite;
}

@keyframes breathe {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.6; }
}

/* ============================================
   中央输入区
   ============================================ */
.central-input {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 48px;
  position: relative;
  transition: opacity 3s ease-in-out;
}

.central-input.faded { opacity: 0; }

.core-title {
  font-size: 16px;
  letter-spacing: 4px;
  color: #444;
  text-align: center;
  line-height: 2.2;
  font-weight: 300;
}

@media (min-width: 640px) {
  .core-title {
    font-size: 18px;
    letter-spacing: 8px;
    line-height: 2;
  }
}

.input-zone {
  width: 100%;
  max-width: 520px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.core-textarea {
  width: 100%;
  height: 120px;
  background: transparent;
  border: none;
  outline: none;
  resize: none;
  font-size: 18px;
  color: #555;
  letter-spacing: 1px;
  line-height: 2;
  padding: 0 0 16px;
  font-family: inherit;
  caret-color: rgba(138, 129, 124, 0.5);
}

.core-textarea::placeholder {
  color: #333;
  opacity: 0.5;
}

.core-textarea:disabled {
  opacity: 0.3;
}

/* 下划线 */
.input-zone::after {
  content: '';
  display: block;
  height: 1px;
  background: #222;
  transition: background 0.5s, opacity 0.5s;
}

.core-textarea:focus ~ .input-zone::after,
.input-zone:focus-within::after {
  background: #333;
}

.input-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
}

.char-counter {
  font-size: 10px;
  letter-spacing: 3px;
  color: #333;
  font-family: "SF Mono", "Fira Code", monospace;
}

.seal-btn {
  font-size: 10px;
  letter-spacing: 4px;
  color: #444;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 8px 0;
  transition: color 0.3s, opacity 0.3s;
  font-family: inherit;
}

.seal-btn:disabled {
  opacity: 0.15;
  cursor: not-allowed;
}

.seal-btn:not(:disabled):hover {
  color: #666;
}

/* 往日回音 */
.echo-ghost {
  position: absolute;
  bottom: -80px;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 400px;
  text-align: center;
  pointer-events: none;
}

.echo-line {
  font-size: 12px;
  color: #333;
  letter-spacing: 1px;
  line-height: 2;
  opacity: 0.15;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  filter: blur(1px);
}

/* ============================================
   底栏
   ============================================ */
.bottom-bar {
  display: flex;
  justify-content: center;
  gap: 32px;
  flex-wrap: wrap;
  padding-top: 16px;
  transition: opacity 2s ease-in-out;
}

.bottom-bar.faded { opacity: 0; }

.menu-item {
  font-size: 9px;
  letter-spacing: 4px;
  color: #333;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 4px 0;
  transition: color 0.3s, opacity 0.3s;
  font-family: inherit;
}

.menu-item:hover {
  color: #555;
}

.menu-item--ghost {
  color: #2a2a2a;
  opacity: 0.5;
}

.menu-item--ghost:hover {
  color: #444;
  opacity: 0.8;
}

.menu-item:disabled {
  opacity: 0.1;
  cursor: not-allowed;
}

/* ============================================
   引导页
   ============================================ */
.intro-screen {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.intro-text {
  font-size: 18px;
  letter-spacing: 3px;
  color: #555;
  text-align: center;
  white-space: pre-line;
  line-height: 2.5;
}

.intro-hint {
  position: absolute;
  bottom: 80px;
  font-size: 9px;
  letter-spacing: 6px;
  color: #333;
  animation: breathe 3s ease-in-out infinite;
}

/* ============================================
   闪屏
   ============================================ */
.splash-screen {
  position: fixed;
  inset: 0;
  z-index: 40;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.splash-text {
  font-size: 11px;
  letter-spacing: 8px;
  color: #333;
  animation: breathe 2s ease-in-out infinite;
}

/* ============================================
   静默屏
   ============================================ */
.silence-screen {
  position: fixed;
  inset: 0;
  z-index: 70;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.silence-text {
  font-size: 10px;
  letter-spacing: 10px;
  color: #333;
}

/* ============================================
   锁定提示
   ============================================ */
.lock-screen {
  position: fixed;
  inset: 0;
  z-index: 80;
  background: rgba(0, 0, 0, 0.98);
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.lock-text {
  font-size: 10px;
  letter-spacing: 6px;
  color: #333;
  text-align: center;
  line-height: 2.5;
}

/* ============================================
   面板通用
   ============================================ */
.panel {
  position: fixed;
  inset: 0;
  z-index: 50;
  background: #000;
  overflow-y: auto;
}

.panel--overlay {
  background: rgba(0, 0, 0, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
}

.panel--records {
  padding-top: 80px;
}

.panel-close {
  position: fixed;
  top: 40px;
  right: 40px;
  font-size: 20px;
  color: #333;
  background: transparent;
  border: none;
  cursor: pointer;
  opacity: 0.4;
  transition: opacity 0.3s;
  z-index: 10;
}

.panel-close:hover { opacity: 0.8; }

.panel-inner {
  max-width: 600px;
  margin: 0 auto;
  padding: 80px 40px 60px;
}

.panel-title {
  font-size: 14px;
  letter-spacing: 8px;
  color: #444;
  text-align: center;
  margin-bottom: 16px;
}

.panel-title--small {
  font-size: 10px;
  letter-spacing: 10px;
}

.panel-sub {
  font-size: 9px;
  letter-spacing: 4px;
  color: #333;
  text-align: center;
  margin-bottom: 48px;
}

/* ============================================
   标本列表
   ============================================ */
.specimen-list {
  display: flex;
  flex-direction: column;
}

.specimen-unit {
  border-top: 1px solid #1a1a1a;
}

.specimen-head {
  width: 100%;
  padding: 24px 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: transparent;
  border: none;
  cursor: pointer;
  text-align: left;
}

.specimen-id {
  font-size: 11px;
  letter-spacing: 2px;
  color: #444;
  font-family: "SF Mono", monospace;
}

.specimen-type {
  font-size: 9px;
  letter-spacing: 3px;
  color: #333;
  text-transform: uppercase;
}

.specimen-body {
  max-height: 0;
  overflow: hidden;
  opacity: 0;
  transition: max-height 0.6s ease, opacity 0.6s ease, padding 0.6s ease;
}

.specimen-body.open {
  max-height: 200px;
  opacity: 1;
  padding-bottom: 24px;
}

.specimen-text {
  font-size: 13px;
  color: #555;
  letter-spacing: 1px;
  line-height: 2.2;
  padding-left: 16px;
  border-left: 1px solid #222;
}

/* ============================================
   关于文本
   ============================================ */
.about-text {
  display: flex;
  flex-direction: column;
  gap: 32px;
  text-align: center;
  font-size: 13px;
  color: #444;
  letter-spacing: 2px;
  line-height: 2.4;
}

.about-sig {
  font-size: 11px;
  color: #333;
  letter-spacing: 3px;
  margin-top: 24px;
}

/* ============================================
   破裂仪式
   ============================================ */
.crack-screen {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.crack-visual {
  position: relative;
  width: 100%;
  height: 100%;
}

.crack-beam {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 1px;
  height: 60%;
  background: #555;
  filter: blur(8px);
  opacity: 0.6;
}

.crack-svg {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 40px;
  height: 80%;
  opacity: 0.5;
}

.crack-line {
  fill: none;
  stroke: #222;
  stroke-width: 1.5;
  stroke-dasharray: 2000;
  stroke-dashoffset: 2000;
  animation: draw 1.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
}

@keyframes draw { to { stroke-dashoffset: 0; } }

.crack-line.glow {
  stroke: #555;
  filter: drop-shadow(0 0 3px rgba(85, 85, 85, 0.5));
}

.crack-reveal {
  position: absolute;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 40px;
}

.crack-message {
  font-size: 11px;
  letter-spacing: 8px;
  color: #444;
}

.crack-action {
  font-size: 9px;
  letter-spacing: 4px;
  color: #333;
  background: transparent;
  border: 1px solid #222;
  padding: 12px 24px;
  cursor: pointer;
  transition: border-color 0.3s, color 0.3s;
}

.crack-action:hover {
  border-color: #444;
  color: #555;
}

/* ============================================
   地质剖面
   ============================================ */
.records-list {
  position: relative;
  padding-left: 48px;
}

.records-axis {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 1px;
  background: #1a1a1a;
}

.record-unit {
  padding: 20px 0;
  border-bottom: 1px solid #1a1a1a;
}

.record-head {
  display: flex;
  align-items: center;
  gap: 16px;
  background: transparent;
  border: none;
  cursor: pointer;
  text-align: left;
  width: 100%;
}

.record-mark {
  width: 48px;
  height: 1px;
  background: #222;
  transform-origin: left;
  transition: background 0.3s, width 0.3s;
}

.record-head:hover .record-mark {
  background: #444;
  width: 64px;
}

.record-title {
  font-size: 10px;
  letter-spacing: 3px;
  color: #333;
  font-family: "SF Mono", monospace;
  transition: color 0.3s;
}

.record-head:hover .record-title {
  color: #555;
}

.record-body {
  max-height: 0;
  overflow: hidden;
  opacity: 0;
  margin-left: 64px;
  transition: max-height 0.5s ease, opacity 0.5s ease;
}

.record-body.open {
  max-height: 150px;
  opacity: 1;
  padding-top: 16px;
}

.record-text {
  font-size: 12px;
  color: #444;
  letter-spacing: 1px;
  line-height: 2;
}

/* ============================================
   化石占卜
   ============================================ */
.fossil-screen {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: #000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.fossil-text {
  font-size: 16px;
  letter-spacing: 6px;
  color: #555;
  text-align: center;
  line-height: 2.5;
  filter: blur(20px);
  opacity: 0;
  animation: fossil-appear 4s ease-out forwards;
}

@keyframes fossil-appear {
  0% { filter: blur(20px); opacity: 0; }
  30% { filter: blur(15px); opacity: 0.2; }
  60% { filter: blur(8px); opacity: 0.5; }
  100% { filter: blur(0); opacity: 1; }
}

.fossil-close {
  position: absolute;
  bottom: 60px;
  font-size: 9px;
  letter-spacing: 5px;
  color: #333;
  background: transparent;
  border: none;
  cursor: pointer;
  opacity: 0.4;
  transition: opacity 0.3s;
}

.fossil-close:hover { opacity: 0.8; }

.fossil-error {
  font-size: 10px;
  letter-spacing: 4px;
  color: #333;
  text-align: center;
  line-height: 2.5;
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
  padding: 60px 40px;
  pointer-events: none;
}

.resonance-text {
  font-size: 12px;
  letter-spacing: 6px;
  color: #444;
  text-align: center;
  line-height: 2;
}

/* 无声共鸣动画 */
.resonance-enter-active { transition: opacity 5s ease-in; }
.resonance-enter-from { opacity: 0; }
.resonance-leave-active { transition: opacity 3s ease-out; }
.resonance-leave-to { opacity: 0; }

/* ============================================
   过渡动画
   ============================================ */
.fade-enter-active, .fade-leave-active { transition: opacity 1.5s ease-in-out; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.fade-slow-enter-active, .fade-slow-leave-active { transition: opacity 2.5s ease-in-out; }
.fade-slow-enter-from, .fade-slow-leave-to { opacity: 0; }

.slide-up-enter-active, .slide-up-leave-active { transition: transform 0.6s cubic-bezier(0.22, 1, 0.36, 1); }
.slide-up-enter-from, .slide-up-leave-to { transform: translateY(100%); }

.fossil-reveal-enter-active { transition: opacity 1s ease-in; }
.fossil-reveal-enter-from { opacity: 0; }
.fossil-reveal-leave-active { transition: opacity 0.8s ease-out; }
.fossil-reveal-leave-to { opacity: 0; }

/* ============================================
   选中样式
   ============================================ */
.app-root ::selection {
  background: rgba(85, 85, 85, 0.2);
  color: #555;
}
</style>
