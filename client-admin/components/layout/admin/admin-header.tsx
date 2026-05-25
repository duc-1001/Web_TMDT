import { Button } from '@/components/ui/button'
import { SidebarTrigger } from '@/components/ui/sidebar'
import Link from 'next/link'
import React from 'react'

const AdminHeader = () => {
    return (
        <div className='w-full px-2 py-6 border-b sticky top-0 bg-white z-10 flex items-center justify-between'>
            <SidebarTrigger className='w-8 h-8' />
            {/* <Button asChild variant="outline" size="sm" className="bg-transparent">
                <Link href="/">Xem trang web</Link>
            </Button> */}
        </div>
    )
}

export default AdminHeader