'use client'
import React, { useEffect } from 'react'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import AdminSidebar from './admin-sidebar'
import AdminHeader from './admin-header'
import { useRouter } from 'next/navigation'
import { useSelector } from 'react-redux'
import { RootState } from '@/store/store'

const AdminLayout = ({ children }: { children: React.ReactNode }) => {

  const router = useRouter()
  const { isAuthenticated } = useSelector((state: RootState) => state.auth)

  useEffect(() => {
    const hasAccessToken = typeof document !== 'undefined' && document.cookie.includes('access_token=')
    if (!isAuthenticated && !hasAccessToken) {
      router.replace("/login")
    }
  }, [isAuthenticated, router])


  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset>
        <AdminHeader />
        <div className='p-4 min-h-full bg-gray-100'>
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default AdminLayout
