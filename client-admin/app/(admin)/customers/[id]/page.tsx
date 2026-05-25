import React from 'react'
import CustomerDetailPage from './CustomerDetailPage'

interface CustomerDetailPageProps {
    params:Promise<{ id: string }>
}

const page = async (props: CustomerDetailPageProps) => {
  const { id } = await props.params
  return (
    <CustomerDetailPage id={id} />
  )
}

export default page
