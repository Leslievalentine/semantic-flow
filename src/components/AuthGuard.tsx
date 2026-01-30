'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser, onAuthStateChange } from '@/lib/auth'
import { Loader2 } from 'lucide-react'

interface AuthGuardProps {
    children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(true)
    const [isAuthenticated, setIsAuthenticated] = useState(false)

    useEffect(() => {
        // 检查初始认证状态
        const checkAuth = async () => {
            const user = await getCurrentUser()
            if (!user) {
                router.push('/auth/login')
            } else {
                setIsAuthenticated(true)
            }
            setIsLoading(false)
        }

        checkAuth()

        // 监听认证状态变化
        const { data: { subscription } } = onAuthStateChange((event, session) => {
            if (event === 'SIGNED_OUT' || !session) {
                router.push('/auth/login')
            } else if (event === 'SIGNED_IN') {
                setIsAuthenticated(true)
            }
        })

        return () => {
            subscription.unsubscribe()
        }
    }, [router])

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-secondary mx-auto mb-4" />
                    <p className="text-muted-foreground font-content">加载中...</p>
                </div>
            </div>
        )
    }

    if (!isAuthenticated) {
        return null
    }

    return <>{children}</>
}
