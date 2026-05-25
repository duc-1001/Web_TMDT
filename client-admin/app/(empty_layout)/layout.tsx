'use client'
import { RootState } from '@/store/store'
import { useRouter } from 'next/navigation'
import { useSelector } from 'react-redux'
import { useEffect } from 'react'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { isAuthenticated } = useSelector((state: RootState) => state.auth)

  useEffect(() => {
    const hasAccessToken = typeof document !== 'undefined' && document.cookie.includes('access_token=')
    if (isAuthenticated && hasAccessToken) {
      router.replace("/")
    }
  }, [isAuthenticated, router])

  return (
    <div className='w-full'>
      {children}
    </div>
  )
}




