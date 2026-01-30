import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// 创建服务端 Supabase 客户端（带用户认证）
export async function createServerSupabaseClient() {
    const cookieStore = await cookies()

    // DEBUG: 打印收到的 cookie 名称
    const cookieNames = cookieStore.getAll().map(c => c.name)
    console.log('[Auth Debug] Available cookies:', cookieNames)

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // 在 Server Component 中可能无法设置 cookie
                        // 可以忽略这个错误
                    }
                },
            },
        }
    )
}

// 获取当前登录用户（服务端）
export async function getServerUser() {
    try {
        const supabase = await createServerSupabaseClient()
        const { data: { user }, error } = await supabase.auth.getUser()

        if (error) {
            console.log('[Auth Debug] getUser error:', error.message)
        }

        if (!user) {
            console.log('[Auth Debug] No user found in session')
            return null
        }

        return user
    } catch (e) {
        console.error('[Auth Debug] Exception in getServerUser:', e)
        return null
    }
}

// 验证用户认证（用于 API 保护）
export async function requireAuth() {
    const user = await getServerUser()

    if (!user) {
        throw new Error('Unauthorized')
    }

    return user
}
