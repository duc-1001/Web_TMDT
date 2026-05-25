import React from 'react'
import CategoryPage from './CategoryPage';
interface pageProps {
    params: Promise<{ slug: string }>
}

const page = async ({ params }: pageProps) => {
    const { slug } = await params;
    return (
        <CategoryPage slug={slug} />
    )
}

export default page
