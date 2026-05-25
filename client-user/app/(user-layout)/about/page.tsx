"use client"

import Image from "next/image"
import { useQuery } from "@tanstack/react-query"
import { Award, Heart, Shield, Truck } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { getAboutPublic } from "@/services/about.service"

const DEFAULT_TITLE = "Về Snack Việt"
const DEFAULT_SHORT_DESCRIPTION =
    "Chúng tôi mang đến những món ăn vặt chất lượng cao, an toàn và ngon miệng cho mọi gia đình Việt Nam"
const DEFAULT_HERO_IMAGE = "/vietnamese-snack-store.jpg"

export default function AboutPage() {
    const { data: about, isLoading } = useQuery({
        queryKey: ["public-about-page"],
        queryFn: getAboutPublic,
    })

    const title = about?.title?.trim() || DEFAULT_TITLE
    const shortDescription = about?.content?.trim() || DEFAULT_SHORT_DESCRIPTION
    const sections = about?.sections ?? []

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-16 text-center text-muted-foreground">
                Đang tải dữ liệu About...
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background">
            <section className="bg-linear-to-br from-primary/10 via-background to-primary/5 py-16">
                <div className="container mx-auto px-4">
                    <div className="mx-auto grid max-w-3xl gap-10 text-center items-center">
                        <div>
                            <p className="text-sm font-medium uppercase tracking-[0.3em] text-primary mb-4">About us</p>
                            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-balance">{title}</h1>
                            <p className="text-lg text-muted-foreground text-pretty leading-relaxed">{shortDescription}</p>
                        </div>
                    </div>
                </div>
            </section>

            {sections.length > 0 ? (
                <section className="py-16">
                    <div className="container mx-auto px-4 space-y-20">
                        {sections.map((section, idx) => {
                            const isTextLeft = section.layout === "text-left"
                            const showImageFirst = !isTextLeft

                            return (
                                <div key={`section-${idx}`} className="grid gap-10 items-center lg:grid-cols-2">
                                    {showImageFirst ? (
                                        <>
                                            {section.image ? (
                                                <div className="relative aspect-video rounded-2xl overflow-hidden bg-muted">
                                                    <Image src={section.image} alt={section.title} fill className="object-cover" />
                                                </div>
                                            ) : (
                                                <div className="aspect-video rounded-2xl bg-muted/60 border border-dashed border-border flex items-center justify-center text-sm text-muted-foreground">
                                                    Chưa có ảnh cho phần này
                                                </div>
                                            )}

                                            <div>
                                                <h2 className="text-3xl font-bold mb-4">{section.title}</h2>
                                                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{section.content}</p>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div>
                                                <h2 className="text-3xl font-bold mb-4">{section.title}</h2>
                                                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{section.content}</p>
                                            </div>

                                            {section.image ? (
                                                <div className="relative aspect-video rounded-2xl overflow-hidden bg-muted">
                                                    <Image src={section.image} alt={section.title} fill className="object-cover" />
                                                </div>
                                            ) : (
                                                <div className="aspect-video rounded-2xl bg-muted/60 border border-dashed border-border flex items-center justify-center text-sm text-muted-foreground">
                                                    Chưa có ảnh cho phần này
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </section>
            ) : (
                <section className="py-16">
                    <div className="container mx-auto px-4">
                        <Card className="max-w-3xl mx-auto">
                            <CardContent className="p-8 text-center text-muted-foreground">
                                Hiện chưa có nội dung About nào được xuất bản.
                            </CardContent>
                        </Card>
                    </div>
                </section>
            )}

            <section className="py-16 bg-muted/30">
                <div className="container mx-auto px-4">
                    <div className="max-w-3xl mx-auto text-center mb-12">
                        <h2 className="text-3xl font-bold mb-4">Giá trị cốt lõi</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Những giá trị mà chúng tôi theo đuổi trong mọi hoạt động kinh doanh
                        </p>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <Card>
                            <CardContent className="p-6 text-center">
                                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                                    <Heart className="h-6 w-6 text-primary" />
                                </div>
                                <h3 className="font-semibold mb-2">Tận tâm</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">Phục vụ khách hàng với trái tim và sự chân thành</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6 text-center">
                                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                                    <Award className="h-6 w-6 text-primary" />
                                </div>
                                <h3 className="font-semibold mb-2">Chất lượng</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">Cam kết sản phẩm chất lượng cao, an toàn</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6 text-center">
                                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                                    <Truck className="h-6 w-6 text-primary" />
                                </div>
                                <h3 className="font-semibold mb-2">Nhanh chóng</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">Giao hàng nhanh, đúng hẹn trên toàn quốc</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6 text-center">
                                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                                    <Shield className="h-6 w-6 text-primary" />
                                </div>
                                <h3 className="font-semibold mb-2">Uy tín</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">Xây dựng niềm tin qua từng sản phẩm</p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>
        </div>
    )
}
