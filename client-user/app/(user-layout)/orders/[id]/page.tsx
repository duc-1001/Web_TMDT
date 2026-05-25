import React from 'react'
import OrderDetailPage from './OrderDetailPage'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  console.log(id);
  
  return <OrderDetailPage orderCode={id} />
}
