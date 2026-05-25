import React from 'react'
import OrderSuccessPage from './OrderSuccessPage';


export default async function Page({
    params,
}: {
    params: Promise<{ orderCode: string }>
}) {
    const { orderCode } = await params;
    return (
      <OrderSuccessPage orderCode={orderCode} />
    )
}

