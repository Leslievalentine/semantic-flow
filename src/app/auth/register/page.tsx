'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signUp } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Mail, Lock, Loader2, AlertCircle } from 'lucide-react'

export default function RegisterPage() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        // 验证密码匹配
        if (password !== confirmPassword) {
            setError('两次输入的密码不一致')
            return
        }

        // 验证密码强度
        if (password.length < 6) {
            setError('密码长度至少需要 6 位')
            return
        }

        setIsLoading(true)

        try {
            await signUp(email, password)
            // 跳转到验证等待页，带上邮箱参数
            router.push(`/auth/verify?email=${encodeURIComponent(email)}`)
        } catch (err) {
            setError(err instanceof Error ? err.message : '注册失败，请重试')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-serif font-bold text-foreground">
                        🌊 Semantic Flow
                    </h1>
                    <p className="text-muted-foreground mt-2 font-content">
                        开启你的地道英语之旅
                    </p>
                </div>

                {/* 注册表单 */}
                <div className="bg-card border border-border rounded-lg p-8 shadow-sm">
                    <h2 className="text-xl font-serif font-semibold text-center mb-6">
                        创建账号
                    </h2>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1.5">
                                邮箱地址
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    type="email"
                                    placeholder="your@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="pl-10"
                                    required
                                />
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                支持 QQ、163、Gmail、Outlook 等所有邮箱
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1.5">
                                密码
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    type="password"
                                    placeholder="至少 6 位字符"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="pl-10"
                                    required
                                    minLength={6}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1.5">
                                确认密码
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    type="password"
                                    placeholder="再次输入密码"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="pl-10"
                                    required
                                    minLength={6}
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    注册中...
                                </>
                            ) : (
                                '创建账号'
                            )}
                        </Button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-muted-foreground">
                            已有账号？{' '}
                            <Link
                                href="/auth/login"
                                className="text-secondary hover:underline font-medium"
                            >
                                立即登录
                            </Link>
                        </p>
                    </div>
                </div>

                {/* 底部版权 */}
                <p className="text-center text-xs text-muted-foreground mt-6">
                    © 2025 Semantic Flow. All rights reserved.
                </p>
            </div>
        </div>
    )
}
