/**
 * ============================================
 * DeepSeek API 模块
 * ============================================
 * 
 * 功能说明:
 * - 调用 DeepSeek API 生成"情绪化石鉴定诗"
 * - 作为月末"化石占卜"功能的核心
 * 
 * 设计原则:
 * 1. 故障容错：网络断开或 API 异常时返回有意义的错误信息
 * 2. 静默降级：不暴露 API 密钥或内部错误细节给用户
 * 3. 符合角色：AI 作为"冷酷的地质学家与悲悯的诗人"
 * 
 * @module utils/deepseek
 */

// ============================================
// I. 配置常量
// ============================================

/** DeepSeek API 密钥 */
const DEEPSEEK_API_KEY = "sk-6299992468524b968ec24c56d7250b11";

/** DeepSeek API 端点 */
const DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions";

/** AI 角色设定 - 存在主义哲学家 */
const SYSTEM_PROMPT = `你是一个存在主义哲学家，负责鉴定现代人的情绪化石。请阅读用户的碎碎念。要求：

必须结合加缪《西西弗神话》（如推石上山、荒诞、反抗）或现代系统剥削的意象进行点评。

语言要具体、有痛感，不要过度抽象。比如可以类似"你必须想象西西弗斯在格子间里是幸福的"。

严格限制在 25 个汉字以内，一击致命。`;

/** API 请求配置 */
const API_CONFIG = {
  model: "deepseek-chat",
  max_tokens: 80,
  temperature: 0.8,
};

// ============================================
// II. 核心 API 函数
// ============================================

/**
 * 获取情绪化石的鉴定诗
 * 
 * @param {string} texts - 用户历史输入的情绪句子（用换行分隔）
 * @returns {Promise<string>} - 返回 AI 生成的鉴定诗
 * @throws {Error} - API 异常时抛出有意义的错误
 * 
 * @example
 * const poem = await fetchFossilPoem('疲惫...');
 * console.log(poem); // "时间将一切碾成尘埃"
 */
export async function fetchFossilPoem(texts) {
  // 输入校验
  if (!texts || typeof texts !== 'string') {
    throw new Error('无法读取地层记录');
  }

  const trimmedTexts = texts.trim();
  if (trimmedTexts.length === 0) {
    throw new Error('岩层深处空无一物');
  }

  try {
    // 构建请求
    const response = await fetch(DEEPSEEK_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        ...API_CONFIG,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: trimmedTexts },
        ],
      }),
    });

    // HTTP 错误处理
    if (!response.ok) {
      const statusCode = response.status;
      
      if (statusCode === 401) {
        console.error('[DeepSeek] API 密钥无效');
        throw new Error('地层鉴定仪故障');
      }
      
      if (statusCode === 429) {
        console.error('[DeepSeek] 请求过于频繁');
        throw new Error('岩层过热，请稍后再试');
      }
      
      if (statusCode >= 500) {
        console.error('[DeepSeek] 服务器异常:', statusCode);
        throw new Error('地层深处发生震动');
      }

      console.error('[DeepSeek] API 请求失败:', statusCode);
      throw new Error('钻探设备异常');
    }

    // 解析响应
    const data = await response.json();

    // 响应格式校验
    if (!data || !data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('[DeepSeek] 响应格式异常:', data);
      throw new Error('化石无法辨认');
    }

    const poem = data.choices[0].message.content.trim();

    // 空内容校验
    if (!poem) {
      throw new Error('化石无法辨认');
    }

    console.log('[DeepSeek] 化石鉴定完成:', poem.substring(0, 20));
    return poem;

  } catch (error) {
    // 区分网络错误和业务错误
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      console.error('[DeepSeek] 网络连接失败:', error.message);
      throw new Error('地层拒绝回应');
    }

    // 重新抛出已处理的错误
    if (error.message.includes('地层') || error.message.includes('岩层') || error.message.includes('化石') || error.message.includes('钻探')) {
      throw error;
    }

    // 未知错误
    console.error('[DeepSeek] 未知错误:', error);
    throw new Error('钻探失败，地层拒绝回应');
  }
}

/**
 * 检查 DeepSeek API 连接状态
 * 
 * @returns {Promise<boolean>} - API 可用返回 true
 */
export async function checkDeepSeekHealth() {
  try {
    const response = await fetch(DEEPSEEK_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "user", content: "test" }],
        max_tokens: 1,
      }),
    });
    return response.ok;
  } catch {
    return false;
  }
}
