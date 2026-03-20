/**
 * ============================================
 * Supabase 客户端配置模块
 * ============================================
 * 
 * 功能说明:
 * - 异步存储用户输入的"情绪句子"到 Supabase 云端数据库
 * - 实现 localStorage 同步 + Supabase 异步的双写策略
 * 
 * 设计原则:
 * 1. 静默失败：所有写入操作使用 try...catch 包装，失败仅打印 console.error
 * 2. 不阻塞 UI：Supabase 写入不影响本地 localStorage 和 CSS 动画
 * 3. 兼容降级：模块加载失败时自动降级，不影响应用运行
 * 
 * @module utils/supabase
 */

import { createClient } from '@supabase/supabase-js';

// ============================================
// I. 配置常量
// ============================================

/** Supabase 数据库 URL */
const SUPABASE_URL = 'https://unttkgymwjymjmxrgwxw.supabase.co';

/** Supabase 公开可发布密钥（仅用于前端，无写入权限限制） */
const SUPABASE_KEY = 'sb_publishable_LYTmASQfcOIke3T4nqXFLg_M_26UG55y';

/** Supabase 客户端实例 */
let supabaseClient = null;

/** 模块是否初始化成功 */
let isInitialized = false;

// ============================================
// II. 客户端初始化
// ============================================

try {
  supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
  isInitialized = true;
  console.log('[Supabase] 客户端初始化成功');
} catch (error) {
  console.error('[Supabase] 客户端初始化失败:', error.message);
  isInitialized = false;
}

// ============================================
// III. 核心 API 函数
// ============================================

/**
 * 将句子异步写入 Supabase 云端数据库
 * 
 * @param {string} content - 用户输入的情绪句子
 * @returns {Promise<boolean>} - 写入成功返回 true，失败返回 false
 * 
 * @example
 * const success = await saveSentenceToCloud('今天的疲惫像石头一样沉');
 * if (success) console.log('已归档至云端');
 */
export async function saveSentenceToCloud(content) {
  // 降级检查：客户端未初始化时静默返回
  if (!isInitialized || !supabaseClient) {
    console.warn('[Supabase] 客户端未初始化，跳过云端写入');
    return false;
  }

  // 输入校验
  if (!content || typeof content !== 'string') {
    console.warn('[Supabase] 无效的句子内容');
    return false;
  }

  const trimmedContent = content.trim();
  if (trimmedContent.length === 0) {
    console.warn('[Supabase] 句子内容为空');
    return false;
  }
  // 此处无代码插入，与需求无关。若你需要自动化提交本文件到 github，请在你的终端手动运行下述命令：
  // git add melting-self/src/utils/supabase.js
  // git commit -m "feat(supabase): 完善 saveSentenceToCloud 的内容校验和注释"
  // git push

  try {
    const { data, error } = await supabaseClient
      .from('sentences')
      .insert([
        {
          content: trimmedContent,
          created_at: new Date().toISOString(),
        },
      ])
      .select();

    if (error) {
      console.error('[Supabase] 数据库写入失败:', error.message);
      return false;
    }

    console.log('[Supabase] 句子已归档至云端地层');
    return true;
  } catch (err) {
    console.error('[Supabase] 网络异常或请求失败:', err.message || err);
    return false;
  }
}

/**
 * 从 Supabase 云端读取所有句子
 * 
 * @returns {Promise<Array>} - 返回句子数组，失败时返回空数组
 */
export async function fetchSentencesFromCloud() {
  if (!isInitialized || !supabaseClient) {
    console.warn('[Supabase] 客户端未初始化，无法读取');
    return [];
  }

  try {
    const { data, error } = await supabaseClient
      .from('sentences')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Supabase] 数据库读取失败:', error.message);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('[Supabase] 读取异常:', err.message || err);
    return [];
  }
}

/**
 * 获取云端句子总数
 * 
 * @returns {Promise<number>} - 云端句子总数
 */
export async function getCloudSentenceCount() {
  if (!isInitialized || !supabaseClient) {
    return 0;
  }

  try {
    const { count, error } = await supabaseClient
      .from('sentences')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('[Supabase] 计数失败:', error.message);
      return 0;
    }

    return count || 0;
  } catch (err) {
    console.error('[Supabase] 计数异常:', err.message || err);
    return 0;
  }
}

/**
 * 检查 Supabase 连接状态
 * 
 * @returns {boolean} - 连接正常返回 true
 */
export function isSupabaseAvailable() {
  return isInitialized && supabaseClient !== null;
}

// ============================================
// IV. 导出客户端实例（供高级用法）
// ============================================

export { supabaseClient as supabase };
