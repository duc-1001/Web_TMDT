import { Card, CardContent } from "@/components/ui/card"
import { Truck, Shield, Headphones, Gift } from "lucide-react"

const features = [
  {
    icon: Truck,
    title: "Giao hàng nhanh",
    description: "Cam kết giao hàng nhanh chóng và đúng hẹn",
  },
  {
    icon: Shield,
    title: "Thanh toán an toàn",
    description: "Bảo mật thông tin 100%",
  },
  {
    icon: Headphones,
    title: "Hỗ trợ 24/7",
    description: "Luôn sẵn sàng hỗ trợ bạn",
  },
  {
    icon: Gift,
    title: "Ưu đãi hấp dẫn",
    description: "Khuyến mãi mới mỗi tuần",
  },
]

export function Features() {
  return (
    <section className="py-10">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <Card key={index} className="border-2 hover:border-primary/50 transition-colors">
                <CardContent className="p-6 text-center">
                  <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-orange-600/10 flex items-center justify-center">
                    <Icon className="h-7 w-7 text-orange-500" />
                  </div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground text-pretty">{feature.description}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
