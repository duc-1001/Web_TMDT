'use client'
import { RootState } from '@/store/store'
import { useRouter } from 'next/navigation'
import { useSelector } from 'react-redux'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { isAuthenticated } = useSelector((state: RootState) => state.auth)
  if (isAuthenticated) {
    router.push("/")
    return null
  }
  return (
    <div className='w-full'>
      {children}
    </div>
  )
}




