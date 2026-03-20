/**
 * ============================================
 * LLM 模块 - 向量嵌入与大模型调用
 * ============================================
 * 
 * 功能说明:
 * - getEmbedding(): 调用硅基流动 Embedding API，将文本转为 1536 维向量
 * - rewriteWithLLM(): 调用 DeepSeek API，将句子改写为"岩层回响"
 * 
 * 设计原则:
 * 1. 静默失败：所有 API 调用使用 try...catch，失败不影响主流程
 * 2. 不阻塞：异步执行，结果通过回调/Promise 返回
 * 
 * @module utils/llm
 */

// ============================================
// I. 配置常量
// ============================================

/** 硅基流动 Embedding API 端点 */
const EMBEDDING_API_URL = "https://api.sciphi.cn/api/v1/embeddings";

/** Embedding API Key（占位符） */
const EMBEDDING_API_KEY = "YOUR_EMBEDDING_KEY";

/** Embedding 模型名称 */
const EMBEDDING_MODEL = "BAAI/bge-m3";

/** 向量维度（适配 OpenAI/BGE-M3） */
export const EMBEDDING_DIMENSION = 1536;

/** DeepSeek API 端点 */
const DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions";

/** DeepSeek API Key */
const DEEPSEEK_API_KEY = "sk-6299992468524b968ec24c56d7250b11";

/** 岩层回响改写 Prompt */
const RESONANCE_SYSTEM_PROMPT = `你是一个数字深渊的守门人。请将这条真实的痛苦陈述：【{sentence}】，剥离所有人名地点，保留核心痛感，改写成一句仿佛在岩层深处回荡了千年的模糊叹息。严格限制在15个字以内，绝不输出任何多余解释。`;

// ============================================
// II. 核心函数
// ============================================

/**
 * 获取文本的向量嵌入
 * 
 * @param {string} text - 待嵌入的文本
 * @returns {Promise<number[]|null>} - 返回 1536 维向量数组，失败返回 null
 * 
 * @example
 * const embedding = await getEmbedding("今天的疲惫像石头一样沉");
 * if (embedding) console.log("向量维度:", embedding.length); // 1536
 */
export async function getEmbedding(text) {
  // 输入校验
  if (!text || typeof text !== 'string') {
    console.warn('[Embedding] 无效的文本输入');
    return null;
  }

  const trimmedText = text.trim();
  if (trimmedText.length === 0) {
    console.warn('[Embedding] 文本内容为空');
    return null;
  }

  try {
    const response = await fetch(EMBEDDING_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${EMBEDDING_API_KEY}`,
      },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        input: trimmedText,
      }),
    });

    if (!response.ok) {
      const statusCode = response.status;
      
      if (statusCode === 401 || statusCode === 403) {
        console.error('[Embedding] API Key 无效或权限不足');
        return null;
      }
      
      if (statusCode === 429) {
        console.warn('[Embedding] 请求频率超限');
        return null;
      }

      console.error('[Embedding] API 请求失败:', statusCode);
      return null;
    }

    const data = await response.json();

    // 解析响应（硅基流动格式）
    if (!data || !data.data || !data.data[0] || !data.data[0].embedding) {
      console.error('[Embedding] 响应格式异常:', data);
      return null;
    }

    const embedding = data.data[0].embedding;

    // 校验向量维度
    if (embedding.length !== EMBEDDING_DIMENSION) {
      console.warn('[Embedding] 向量维度不匹配:', embedding.length, '!==', EMBEDDING_DIMENSION);
    }

    console.log('[Embedding] 文本嵌入完成');
    return embedding;

  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      console.error('[Embedding] 网络连接失败');
    } else {
      console.error('[Embedding] 异常:', error.message || error);
    }
    return null;
  }
}

/**
 * 将句子改写为"岩层深处的回响"
 * 
 * @param {string} sentence - 待改写的句子
 * @returns {Promise<string|null>} - 返回改写后的句子，失败返回 null
 * 
 * @example
 * const echo = await rewriteWithLLM("今天被老板骂了，很难过");
 * console.log(echo); // "某处的疼痛，在时间里慢慢钙化"
 */
export async function rewriteWithLLM(sentence) {
  // 输入校验
  if (!sentence || typeof sentence !== 'string') {
    return null;
  }

  const trimmedSentence = sentence.trim();
  if (trimmedSentence.length === 0) {
    return null;
  }

  // 构建 Prompt
  const systemPrompt = RESONANCE_SYSTEM_PROMPT.replace('{sentence}', trimmedSentence);

  try {
    const response = await fetch(DEEPSEEK_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: systemPrompt },
        ],
        max_tokens: 50,
        temperature: 0.9,
      }),
    });

    if (!response.ok) {
      const statusCode = response.status;
      console.error('[LLM Rewrite] API 请求失败:', statusCode);
      return null;
    }

    const data = await response.json();

    if (!data || !data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('[LLM Rewrite] 响应格式异常');
      return null;
    }

    const rewritten = data.choices[0].message.content.trim();

    if (!rewritten) {
      return null;
    }

    console.log('[LLM Rewrite] 改写完成:', rewritten);
    return rewritten;

  } catch (error) {
    console.error('[LLM Rewrite] 异常:', error.message || error);
    return null;
  }
}

/**
 * 无声共鸣核心逻辑
 * 串联：Embedding → 向量检索 → LLM 改写
 * 
 * @param {string} currentSentence - 当前输入的句子
 * @param {object} supabaseClient - Supabase 客户端实例
 * @returns {Promise<string|null>} - 返回"岩层回响"，失败返回 null
 * 
 * @example
 * const resonance = await silentResonance("工作压力很大", supabase);
 * if (resonance) showResonance(resonance);
 */
export async function silentResonance(currentSentence, supabaseClient) {
  try {
    // Step 1: 获取当前句子的向量
    console.log('[无声共鸣] 正在嵌入当前句子...');
    const embedding = await getEmbedding(currentSentence);
    
    if (!embedding) {
      console.warn('[无声共鸣] 向量嵌入失败，跳过共鸣');
      return null;
    }

    // Step 2: 调用 match_sentences RPC 检索相似句子
    console.log('[无声共鸣] 正在检索相似句子...');
    const { data: matchResult, error: matchError } = await supabaseClient
      .rpc('match_sentences', {
        query_embedding: embedding,
        match_threshold: 0.7,
        match_count: 1,
      });

    if (matchError) {
      console.error('[无声共鸣] 向量检索失败:', matchError.message);
      return null;
    }

    if (!matchResult || matchResult.length === 0) {
      console.log('[无声共鸣] 未找到相似句子');
      return null;
    }

    const similarSentence = matchResult[0].content;
    console.log('[无声共鸣] 检索到相似句子:', similarSentence.substring(0, 20));

    // Step 3: 调用 LLM 改写
    console.log('[无声共鸣] 正在改写为岩层回响...');
    const resonance = await rewriteWithLLM(similarSentence);

    if (!resonance) {
      console.warn('[无声共鸣] 改写失败');
      return null;
    }

    console.log('[无声共鸣] 成功:', resonance);
    return resonance;

  } catch (error) {
    console.error('[无声共鸣] 异常:', error.message || error);
    return null;
  }
}
