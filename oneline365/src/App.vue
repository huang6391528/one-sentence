<script setup>
import { ref, computed, onMounted, nextTick } from 'vue';
import { playTectonicShift } from './utils/audioEngine'; // 引入独立音效
import StrataEngine from './utils/strataEngine';         // 引入独立地质引擎

// ... 之前的常量定义保持不变 (introTexts, specimens 等) ...
const introTexts = [
  "有些话\n你不能发朋友圈",
  "也不能说给任何人",
  "但你可以\n把它埋在这里",
  "没有人懂得你此刻的感受。\n包括未来的你。"
];

const specimens = [
  { id: '#009', type: '夜行', text: '凌晨三点的街道，没有任何人知道你存在过。城市像一台暂停的机器，只有路灯在运行。' },
  { id: '#017', type: '异化', text: '我们以为自己在向上攀登，后来才发现，那只是把石头推上另一条转速更快的履带。' },
  { id: '#024', type: '荣光', text: '曾经跨越山海的勋章，成了一枚枚钉死在标本盒里的蝴蝶。美得窒息，却毫无生机。' },
  { id: '#042', type: '镜像', text: '那个曾经热烈过的“旧我”，成了审判此刻最严苛的法官。我们在隔着时间，审视一具陌生而完美的尸体。' },
  { id: '#103', type: '凋零', text: '所谓怀旧，不是对青春的眷恋，而是对自我丧失的无力凭吊。我们哭泣，是惊觉那个自由意志的自己，早已被囚禁在过去的剪影里。' }
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
const strataCanvas = ref(null); 
let engine = null; // 声明地质引擎实例

const todayDate = computed(() => {
  const d = new Date();
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
});

const nextIntroStep = () => {
  if (introStep.value < introTexts.length - 1) {
    introStep.value++;
  } else {
    localStorage.setItem('hasSeenMeltingIntro', 'true');
    hasSeenIntro.value = true;
    nextTick(() => { engine.draw(); }); 
  }
};

const toggleSpecimen = (id) => {
  activeSpecimen.value = activeSpecimen.value === id ? null : id;
};

// 动画逻辑
const dynamicSinkStyle = computed(() => {
  if (!isSealed.value) return {};
  return {
    color: 'rgba(138, 129, 124, 0.8)',
    transform: `translateY(150px) scaleY(0.02) scaleX(0.8)`, 
    filter: `blur(1px) grayscale(100%)`, 
    opacity: 0,
    transition: 'all 3s cubic-bezier(0.5, 0, 0.1, 1)' 
  };
});

const charColorClass = computed(() => {
  const len = inputText.value.length;
  if (len >= maxChars) return 'text-[#8A5A5A]/90'; 
  if (len > 100) return 'text-[#8A817C]/90';      
  return 'text-[#D6D2C4]/40';                     
});

onMounted(async () => {
  // 初始化地质引擎
  if (strataCanvas.value) {
    engine = new StrataEngine(strataCanvas.value);
  }

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
    const res = await fetch("http://localhost:3000/status");
    const data = await res.json();
    worldDepth.value = data.glacierLayers || 0; 
    engine.init(worldDepth.value); // 让引擎生成历史地层
  } catch (error) { console.error("后端未连接"); }
});

const handleSeal = async () => {
  if (!inputText.value.trim()) return;
  playTectonicShift(); // 调用独立引擎
  isSealed.value = true;

  try {
    await fetch("http://localhost:3000/write", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: inputText.value })
    });
  } catch (e) { console.log(e); }

  worldDepth.value += 1; 
  
  setTimeout(() => { 
    engine.addLayer(); // 调用引擎，压入新地层
  }, 2800); 
  
  setTimeout(() => {
    isSealed.value = false;
    inputText.value = '';
  }, 6000);
};

const testAddLayer = () => { 
  worldDepth.value += 1; 
  engine.addLayer(); 
};
</script>