'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { resendVerificationEmail } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Mail, CheckCircle2, Loader2, RefreshCw, ArrowLeft } from 'lucide-react'

function VerifyContent() {
    const searchParams = useSearchParams()
    const email = searchParams.get('email') || ''
    const [isResending, setIsResending] = useState(false)
    const [resendSuccess, setResendSuccess] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [countdown, setCountdown] = useState(0)

    // 倒计时逻辑
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
            return () => clearTimeout(timer)
        }
    }, [countdown])

    const handleResend = async () => {
        if (!email || countdown > 0) return

        setIsResending(true)
        setError(null)
        setResendSuccess(false)

        try {
            await resendVerificationEmail(email)
            setResendSuccess(true)
            setCountdown(60) // 60秒冷却
        } catch (err) {
            setError(err instanceof Error ? err.message : '发送失败，请重试')
        } finally {
            setIsResending(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="w-full max-w-md">
                {/* 成功图标 */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-100 rounded-full mb-4">
                        <Mail className="w-10 h-10 text-emerald-600" />
                    </div>
                    <h1 className="text-2xl font-serif font-bold text-foreground">
                        验证邮件已发送
                    </h1>
                </div>

                {/* 说明卡片 */}
                <div className="bg-card border border-border rounded-lg p-8 shadow-sm">
                    <div className="text-center space-y-4">
                        <p className="text-foreground font-content">
                            我们已向 <span className="font-medium text-secondary">{email}</span> 发送了一封验证邮件
                        </p>

                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-left">
                            <p className="text-sm text-amber-800">
                                <strong>请注意：</strong>
                            </p>
                            <ul className="text-sm text-amber-700 mt-2 space-y-1 list-disc list-inside">
                                <li>请前往邮箱点击验证链接激活账号</li>
                                <li>如未收到邮件，请检查垃圾箱</li>
                                <li>验证完成后即可登录使用</li>
                            </ul>
                        </div>

                        {resendSuccess && (
                            <div className="flex items-center justify-center gap-2 text-emerald-600">
                                <CheckCircle2 className="w-4 h-4" />
                                <span className="text-sm">验证邮件已重新发送</span>
                            </div>
                        )}

                        {error && (
                            <p className="text-sm text-red-600">{error}</p>
                        )}

                        {/* 操作按钮 */}
                        <div className="pt-4 space-y-3">
                            <Button
                                onClick={handleResend}
                                variant="outline"
                                className="w-full"
                                disabled={isResending || countdown > 0}
                            >
                                {isResending ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        发送中...
                                    </>
                                ) : countdown > 0 ? (
                                    <>
                                        <RefreshCw className="w-4 h-4 mr-2" />
                                        {countdown} 秒后可重新发送
                                    </>
                                ) : (
                                    <>
                                        <RefreshCw className="w-4 h-4 mr-2" />
                                        重新发送验证邮件
                                    </>
                                )}
                            </Button>

                            <Link href="/auth/register" className="block">
                                <Button variant="ghost" className="w-full">
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    返回修改邮箱
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* 登录入口 */}
                <div className="text-center mt-6">
                    <p className="text-sm text-muted-foreground">
                        已完成验证？{' '}
                        <Link
                            href="/auth/login"
                            className="text-secondary hover:underline font-medium"
                        >
                            前往登录
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}

export default function VerifyPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        }>
            <VerifyContent />
        </Suspense>
    )
}
