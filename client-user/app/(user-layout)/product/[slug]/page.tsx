import React from 'react'
import ProductPage from './ProductPage'

interface pageProps {
    params: Promise<{ slug: string }>
}
const page = async ({ params }: pageProps) => {
    const {slug} = await params;
  return (
    <ProductPage slug={slug} />
  )
}

export default page
