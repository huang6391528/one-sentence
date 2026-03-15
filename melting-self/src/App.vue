<script setup>
import { ref, onMounted } from 'vue';
import lottie from 'lottie-web';

const inputText = ref('');
const isSealed = ref(false); 
const lottieContainer = ref(null);
let lottieAnimation = null;

onMounted(() => {
  // 初始化 lottie 动画（隐藏状态，仅在触发时显示）
  if (lottieContainer.value) {
    lottieAnimation = lottie.loadAnimation({
      container: lottieContainer.value,
      renderer: 'svg',
      loop: false,
      autoplay: false,
      path: '/ripple.json'
    });
  }
});

const handleSeal = async () => {
  if (!inputText.value.trim()) return;

  // 触发动画
  isSealed.value = true;
  
  // 播放 lottie 动画
  if (lottieAnimation) {
    lottieAnimation.play();
  }
  
  // 调试模式：3.5 秒后自动重置，方便你反复看效果
  setTimeout(() => {
    isSealed.value = false;
    inputText.value = ''; 
    // 重置动画到第一帧
    if (lottieAnimation) {
      lottieAnimation.goToAndStop(0, true);
    }
  }, 3500); 
};
</script>

<template>
  <div class="min-h-screen bg-[#030509] text-[#A5B4FC] flex flex-col items-center justify-between font-sans overflow-hidden relative selection:bg-[#A5B4FC] selection:text-[#030509]">
    
    <div class="ripple-bg" :class="{ 'active': isSealed }"></div>

    <header class="w-full text-center pt-24 pb-8 z-10 transition-opacity duration-1000" :class="{'opacity-10': isSealed}">
      <h1 class="text-xl tracking-[0.5em] font-extralight opacity-80 uppercase text-white">把今天最痛的那句话，沉进冰川</h1>
    </header>

    <main class="flex-1 w-full max-w-md px-6 flex flex-col items-center justify-center relative z-10">
      
      <!-- Lottie 动画容器 -->
      <div 
        ref="lottieContainer" 
        class="absolute inset-0 flex items-center justify-center pointer-events-none"
        :class="{ 'opacity-0': !isSealed }"
      ></div>

      <div 
        class="w-full flex flex-col items-center transition-all duration-[3000ms] ease-in-out"
        :class="{ 'opacity-0 translate-y-32 blur-md scale-75 pointer-events-none': isSealed }"
      >
        <textarea 
          v-model="inputText"
          :maxlength="140"
          placeholder="此刻的荒芜..."
          class="w-full h-40 bg-transparent border-b border-[#A5B4FC]/20 text-xl font-light focus:outline-none focus:border-[#A5B4FC]/50 resize-none placeholder-[#A5B4FC]/20 transition-colors"
        ></textarea>
        
        <div class="w-full flex justify-between items-center mt-6">
          <span class="text-xs opacity-40 font-mono">{{ inputText.length }} / 140</span>
          <button 
            @click="handleSeal"
            :disabled="!inputText.trim()"
            class="px-8 py-2 border border-[#A5B4FC]/30 text-sm tracking-widest hover:bg-[#A5B4FC] hover:text-[#030509] transition-colors duration-300 disabled:opacity-10 disabled:hover:bg-transparent disabled:hover:text-[#A5B4FC]"
          >
            封存
          </button>
        </div>
      </div>

    </main>

    <footer class="w-full max-w-2xl px-8 pb-12 flex flex-col items-center z-10 transition-opacity duration-1000" :class="{'opacity-5': isSealed}">
      <div class="text-[10px] leading-relaxed opacity-30 text-justify max-w-md font-light mb-8 pointer-events-none">
        <p>我们被允诺过一个通过考学和升职就能抵达的终点，却发现那不过是转速更快的履带；做题家的坚韧，只换来在一座更高级的营地里贩卖自我的资格。我们连休息都沦为对生产资料的维修，睡眠与健体带着 KPI 的负罪感，失去了无所事事的正当性。在系统内，我们用精密的话术横向拉扯、对齐赋能，却在深夜丧失了描述真实痛苦的词汇，患上灵魂的失语症。我们在虚拟的主页上维持着数字分身的永生，而这具真实的、会流血的肉身，却在荧光灯下加速枯萎。</p>
        <p class="mt-4 text-center tracking-widest">这里没有围观。写下它，然后让它消失。</p>
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* 强化版深海涟漪动画：加亮、加光晕边缘 */
.ripple-bg {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0vw;
  height: 0vw;
  /* 调亮了中心光晕，透明度提升到 0.25 */
  background: radial-gradient(circle, rgba(165, 180, 252, 0.25) 0%, rgba(3, 5, 9, 0) 70%);
  /* 增加了一道极其微弱的冰蓝色边界线，模拟波纹推开水面的质感 */
  border: 1px solid rgba(165, 180, 252, 0.15);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  z-index: 0;
  pointer-events: none;
  transition: width 3s cubic-bezier(0.1, 0.5, 0.2, 1), height 3s cubic-bezier(0.1, 0.5, 0.2, 1), opacity 3s ease;
  opacity: 0;
}

.ripple-bg.active {
  width: 120vw;
  height: 120vw;
  opacity: 1;
}
</style>