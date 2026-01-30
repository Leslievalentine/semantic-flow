import { supabase } from '@/lib/supabase'

// 重新导出类型以便兼容
import { type User, type Session } from '@supabase/supabase-js'

// 用户注册
export async function signUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`
        }
    })

    if (error) {
        throw new Error(error.message)
    }

    return data
}

// 用户登录
export async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    })

    if (error) {
        // 检查是否是邮箱未验证
        if (error.message.includes('Email not confirmed')) {
            throw new Error('邮箱尚未验证，请查收验证邮件并点击链接激活账号')
        }
        throw new Error(error.message)
    }

    return data
}

// 用户登出
export async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) {
        throw new Error(error.message)
    }
}

// 获取当前用户
export async function getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) {
        return null
    }
    return user
}

// 获取当前会话
export async function getSession() {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) {
        return null
    }
    return session
}

// 重新发送验证邮件
export async function resendVerificationEmail(email: string) {
    const { error } = await supabase.auth.resend({
        type: 'signup',
        email
    })

    if (error) {
        throw new Error(error.message)
    }
}

// 监听认证状态变化
export function onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback)
}
