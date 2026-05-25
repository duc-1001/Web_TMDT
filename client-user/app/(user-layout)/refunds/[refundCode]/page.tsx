import React from 'react'
import DetailRefundPage from './DetailRefundPage'

interface RefundDetailPageProps {
  params: Promise<{ refundCode: string }>
}

const page = async (props: RefundDetailPageProps) => {
  const { refundCode } = await props.params
  return (
    <DetailRefundPage refundCode={refundCode} />
  )
}

export default page