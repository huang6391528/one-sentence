<script setup>
import { ref, computed, onMounted } from 'vue';

// ==========================================
// 极低频地层轰鸣声
// ==========================================
const playTectonicShift = () => {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  const ctx = new AudioContext();
  const oscBass = ctx.createOscillator();
  const gainBass = ctx.createGain();

  oscBass.type = 'sine';
  oscBass.frequency.setValueAtTime(40, ctx.currentTime);
  oscBass.frequency.exponentialRampToValueAtTime(5, ctx.currentTime + 2.5);

  gainBass.gain.setValueAtTime(0, ctx.currentTime);
  gainBass.gain.linearRampToValueAtTime(0.9, ctx.currentTime + 0.1);
  gainBass.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 2.5);

  oscBass.connect(gainBass);
  gainBass.connect(ctx.destination);
  oscBass.start();
  oscBass.stop(ctx.currentTime + 2.5);
};

// ==========================================
// 真实音效播放 (MP3)
// ==========================================
const playRealSound = () => {
  const audio = new Audio('/boom.mp3');
  audio.volume = 0.6;
  audio.play().catch((e) => console.log('音频播放被浏览器拦截，需要用户先产生交互', e));
};

// ==========================================
// 点一盏灯功能
// ==========================================
const isLampLit = ref(false);

const toggleLamp = () => {
  isLampLit.value = !isLampLit.value;
};

// ==========================================
// 1. 雕刻后的文本与数据
// ==========================================
const introTexts = [
  '18岁\n你相信努力会改变命运',
  '后来\n你拥有了很多身份',
  '有些话\n不能说给任何人',
  '把它埋在这里',
];

const specimens = [
  {
    id: '#009',
    type: '夜行',
    text: '凌晨三点的街道，没有任何人知道你存在过。城市像一台暂停的机器，只有路灯在运行。',
  },
  {
    id: '#017',
    type: '异化',
    text: '我们以为自己在向上攀登。后来才发现，那只是把石头推上另一条转速更快的履带。',
  },
  {
    id: '#024',
    type: '荣光',
    text: '曾经跨越山海的勋章，成了一枚枚钉死在标本盒里的蝴蝶。美得窒息，却早已没有生命。',
  },
  {
    id: '#042',
    type: '镜像',
    text: '那个曾经热烈过的“旧我”，成了审判此刻最严苛的法官。我们隔着时间，审视一具陌生而完美的尸体。',
  },
  {
    id: '#103',
    type: '凋零',
    text: '所谓怀旧，不是对青春的眷恋，而是对自我丧失的无力凭吊。我们哭泣，是忽然发现——那个自由意志的自己，早已被囚禁在过去的剪影里。',
  },
];

const hasSeenIntro = ref(true);
const introStep = ref(0);
const showSplash = ref(false);
const showManifesto = ref(false);
const showAbout = ref(false);
const activeSpecimen = ref(null);

const inputText = ref('');
const isSealed = ref(false);
const maxChars = 140;
const worldDepth = ref(0);

const todayDate = computed(() => {
  const d = new Date();
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
});

// ==========================================
// 2. 隐藏细节：纪元系统
// ==========================================
const currentEpoch = computed(() => {
  if (worldDepth.value >= 10000) return '化石纪元';
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

const toggleSpecimen = (id) => {
  activeSpecimen.value = activeSpecimen.value === id ? null : id;
};

const dynamicSinkStyle = computed(() => {
  if (!isSealed.value) return {};
  return {
    color: 'rgba(58, 41, 29, 0.92)',
    transform: 'translateY(150px) scaleY(0.01) scaleX(0.8)',
    filter: 'blur(3px) grayscale(85%) contrast(1.15)',
    opacity: 0.15,
    transformOrigin: 'center center',
    transition:
      'transform 4s cubic-bezier(0.22, 0.61, 0.36, 1), filter 4s ease, color 4s ease, opacity 4s ease',
  };
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

  try {
    const res = await fetch('http://localhost:3000/status');
    const data = await res.json();
    worldDepth.value = data.glacierLayers || 0;
  } catch (error) {
    console.error('后端未连接');
  }
});

const handleSeal = async () => {
  if (!inputText.value.trim()) return;

  playTectonicShift();
  playRealSound();
  isSealed.value = true;

  try {
    await fetch('http://localhost:3000/write', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: inputText.value }),
    });
  } catch (e) {
    console.log(e);
  }

  setTimeout(() => {
    worldDepth.value += 1;
  }, 3000);

  setTimeout(() => {
    isSealed.value = false;
    inputText.value = '';
  }, 6000);
};

// 后门：点击深度快速增加，方便查看纪元文字
const testAddLayer = () => {
  worldDepth.value += 25;
};
</script>

<template>
  <div
    class="min-h-screen bg-[#0A0A09] flex flex-col items-center justify-center font-serif overflow-hidden relative selection:bg-[#8A817C]/30 selection:text-[#D6D2C4]"
  >
    <video
      class="absolute inset-0 w-full h-full object-cover opacity-30 pointer-events-none z-0"
      autoplay
      muted
      loop
      playsinline
    >
      <!-- <source src="/placeholder-depth.mp4" type="video/mp4" /> -->
    </video>

    <div
      class="absolute inset-0 pointer-events-none z-0"
      style="
        background:
          radial-gradient(circle at center, rgba(22, 18, 15, 0.18) 0%, rgba(7, 7, 7, 0.74) 42%, rgba(3, 3, 3, 0.96) 100%),
          radial-gradient(circle at top, rgba(214, 210, 196, 0.035) 0%, transparent 34%, rgba(0, 0, 0, 0.78) 100%);
      "
    ></div>

    <div v-if="!hasSeenIntro" class="z-50 w-full max-w-2xl px-8 flex flex-col items-center justify-center min-h-screen cursor-pointer" @click="nextIntroStep">
      <transition name="fade" mode="out-in">
        <p :key="introStep" class="text-[#D6D2C4]/70 text-lg leading-[2.5] tracking-[0.2em] text-center whitespace-pre-line">
          {{ introTexts[introStep] }}
        </p>
      </transition>
    </div>

    <transition name="fade">
      <div v-if="hasSeenIntro && showSplash" class="absolute inset-0 z-40 flex items-center justify-center bg-[#0A0A09]">
        <p class="text-[#D6D2C4]/40 text-sm tracking-[0.5em] font-light animate-pulse">你今天，存在过吗？</p>
      </div>
    </transition>

    <template v-if="hasSeenIntro && !showSplash">
      <div
        class="absolute inset-0 pointer-events-none z-[1]"
        style="
          background:
            linear-gradient(to bottom, rgba(0, 0, 0, 0.4), transparent 28%, rgba(0, 0, 0, 0.82) 100%),
            radial-gradient(ellipse at bottom, rgba(73, 53, 38, 0.18) 0%, rgba(0, 0, 0, 0) 55%);
        "
      ></div>

      <div v-if="isLampLit" class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30">
        <div class="w-8 h-8 bg-yellow-400 rounded-full shadow-lg animate-pulse" style="box-shadow: 0 0 40px 20px rgba(255, 165, 0, 0.3)"></div>
        <div class="absolute top-8 left-1/2 transform -translate-x-1/2 w-1 h-16 bg-yellow-700 rounded-sm"></div>
      </div>

      <div class="absolute top-8 left-8 z-20 transition-opacity duration-1000" :class="{ 'opacity-0': isSealed }">
        <div class="mb-4">
          <p class="text-[#8A817C]/40 text-[9px] tracking-[0.3em] font-sans mb-1 uppercase">World Depth</p>
          <p class="text-[#D6D2C4]/70 text-sm tracking-widest font-mono cursor-crosshair" @click="testAddLayer">{{ worldDepth.toLocaleString() }}</p>
          <p v-if="currentEpoch" class="text-[#8A817C]/60 text-[10px] tracking-widest mt-1 animate-pulse">{{ currentEpoch }}</p>
        </div>
        <div>
          <p class="text-[#8A817C]/30 text-[8px] tracking-[0.2em] font-sans mb-1 uppercase">Today</p>
          <p class="text-[#D6D2C4]/40 text-xs tracking-widest font-mono">{{ todayDate }}</p>
        </div>
      </div>

      <header class="w-full text-center pt-24 pb-8 z-10 transition-opacity duration-[3000ms] absolute top-0" :class="{ 'opacity-0': isSealed }">
        <h1 class="text-[clamp(14px,2vw,18px)] tracking-[0.6em] font-light opacity-50 text-[#D6D2C4]">
          把今天最痛的一句话，埋进时间的地层
        </h1>
      </header>

      <main class="flex-1 w-full max-w-lg px-8 flex flex-col items-center justify-center relative z-10 mt-16">
        <div class="absolute top-[-40px] w-full text-center pointer-events-none transition-opacity duration-1000" :class="{ 'opacity-0': isSealed }">
          <p class="text-[10px] text-[#D6D2C4]/30 tracking-[0.3em] font-light italic">
            除了你，没有人会懂你此刻的感受。<br /><span class="opacity-50 mt-1 block">包括未来的你。</span>
          </p>
        </div>

        <div class="w-full flex flex-col items-center" :class="{ 'pointer-events-none': isSealed }" :style="dynamicSinkStyle">
          <div class="w-full relative group">
            <textarea
              v-model="inputText"
              :maxlength="maxChars"
              placeholder=""
              class="w-full h-32 bg-transparent text-[#D6D2C4]/90 text-lg focus:outline-none resize-none transition-colors peer leading-relaxed tracking-[0.1em]"
              style="caret-color: rgba(138, 129, 124, 0.6)"
            ></textarea>
            <div class="absolute bottom-0 left-0 w-full h-[1px] bg-[#8A817C]/40 transition-all duration-700 peer-focus:bg-[#8A817C]/80"></div>
          </div>

          <div class="w-full flex justify-between items-end mt-6">
            <div class="flex flex-col gap-2">
              <span class="text-[10px] font-sans transition-colors duration-300 tracking-widest" :class="inputText.length >= maxChars ? 'text-[#8A5A5A]/80' : 'text-[#D6D2C4]/30'">
                重量: {{ inputText.length }} / {{ maxChars }}
              </span>
              <span class="text-[10px] text-[#D6D2C4]/20 font-mono tracking-widest">{{ todayDate }}</span>
            </div>

            <button
              @click="handleSeal"
              :disabled="!inputText.trim()"
              class="group relative w-24 h-9 border border-[#8A817C]/50 bg-transparent text-xs tracking-[0.4em] text-[#D6D2C4]/70 overflow-hidden transition-all duration-500 disabled:opacity-10 disabled:border-transparent hover:border-[#D6D2C4]/60"
            >
              <span class="relative z-10 group-hover:opacity-0 transition-opacity duration-500">埋下</span>
              <span class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500 text-[#0A0A09] bg-[#D6D2C4]/80 font-medium">
                封存
              </span>
            </button>
          </div>
        </div>
      </main>

      <footer class="w-full absolute bottom-8 text-center z-10 flex flex-col items-center gap-4">
        <div class="flex gap-8">
          <button v-if="!isSealed" @click="showManifesto = true" class="text-[9px] tracking-[0.2em] text-[#8A817C]/50 hover:text-[#D6D2C4]/80 transition-colors pb-1">
            [ 标本盒 ]
          </button>
          <button v-if="!isSealed" @click="showAbout = true" class="text-[9px] tracking-[0.2em] text-[#8A817C]/40 hover:text-[#D6D2C4]/70 transition-colors pb-1">
            [ 溯源 ]
          </button>
          <button v-if="!isSealed" @click="toggleLamp" class="text-[9px] tracking-[0.2em] text-[#8A817C]/40 hover:text-[#D6D2C4]/70 transition-colors pb-1">
            [ 点一盏灯 ]
          </button>
          <button
            v-if="!isSealed"
            class="text-[9px] tracking-[0.2em] text-[#8A817C]/30 hover:text-[#D6D2C4]/60 transition-colors pb-1 opacity-50 cursor-not-allowed"
            title="暂未开放"
          >
            [ 地层记录 ]
          </button>
        </div>

        <p v-if="!isSealed" class="text-[10px] tracking-[0.4em] text-[#D6D2C4]/20 transition-opacity duration-[3000ms]">
          每个月末，它会结成化石。
        </p>
        <p v-else class="text-[10px] tracking-[0.4em] text-[#8A817C]/80 animate-pulse">
          已压入地层，无人知晓。
        </p>
      </footer>
    </template>

    <transition name="fade">
      <div
        v-if="showManifesto"
        class="absolute inset-0 z-50 bg-[#0A0A09]/98 backdrop-blur-md overflow-y-auto custom-scrollbar flex flex-col items-center py-24 px-6 sm:px-12"
      >
        <button @click="showManifesto = false" class="absolute top-8 right-8 text-[#D6D2C4]/30 hover:text-[#D6D2C4] text-3xl font-light">×</button>
        <div class="max-w-2xl w-full flex flex-col gap-8">
          <div class="text-center mb-12">
            <h2 class="text-lg md:text-xl tracking-[0.6em] font-light text-[#D6D2C4] opacity-80 mb-4">情绪标本馆</h2>
            <p class="text-[#8A817C]/50 text-xs tracking-[0.2em]">只保存重量。</p>
          </div>
          <div class="flex flex-col w-full border-t border-[#8A817C]/10">
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

    <transition name="fade">
      <div v-if="showAbout" class="absolute inset-0 z-50 bg-[#0A0A09]/98 backdrop-blur-md flex flex-col items-center justify-center py-24 px-6 sm:px-12">
        <button @click="showAbout = false" class="absolute top-8 right-8 text-[#D6D2C4]/30 hover:text-[#D6D2C4] text-3xl font-light">×</button>
        <div class="max-w-md w-full text-[#D6D2C4]/50 font-serif leading-[2.5] tracking-widest text-sm flex flex-col gap-8 text-center">
          <p>
            某个凌晨三点，风穿过空荡的街道。

            那一刻的痛楚如此真实，却无处安放。

            德令哈的夜风，和八个月后的此刻，在时间的褶皱里悄然重叠。

            于是有了这片地层——

            不是为了遗忘，而是让所有无法言说的重量，在沉默中被压成化石。

            ——一个还在上学的人
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
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 1.2s ease-in-out;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

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
