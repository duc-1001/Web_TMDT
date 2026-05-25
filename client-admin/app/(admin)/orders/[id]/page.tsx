import React from 'react'
import OrderDetailPage from './DetailOrderPage'

interface pageProps {
    params: Promise<{ id: string }>
}

const page = async ({ params }: pageProps) => {
    const { id } = await params
    return (
        <OrderDetailPage orderCode={id} />
    )
}

export default page
