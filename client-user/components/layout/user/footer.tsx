import Link from "next/link"
import { Facebook, Instagram, Youtube, Mail, Phone, MapPin, Clock3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { RootState } from "@/store/store";
import { useSelector } from "react-redux";
import { useQuery } from "@tanstack/react-query"

import { getPoliciesPublic } from "@/services/policy.service"

export function Footer() {
  const { generalInfo } = useSelector((state: RootState) => state.generalInfo);
  const { data: policies = [] } = useQuery({
    queryKey: ["public-policies-footer"],
    queryFn: () => getPoliciesPublic(),
  })

  const publishedPolicies = policies.slice(0, 4)

  return (
    <footer className="bg-card border-t mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img src={generalInfo?.logo || "/placeholder.svg"} alt={generalInfo?.shortName || "Snack Việt"} className="h-14 w-14 rounded-full object-cover" />
              <span className="font-bold text-xl hidden sm:inline-block text-balance">{generalInfo?.shortName}</span>
            </div>
            <p className="text-muted-foreground mb-4 text-pretty leading-relaxed">
              {
                generalInfo?.websiteDescription ||
                "Snack Việt - Điểm đến lý tưởng cho những tín đồ yêu thích ẩm thực đường phố. Chúng tôi mang đến những món ăn vặt ngon miệng, đa dạng và chất lượng, được chế biến từ nguyên liệu tươi ngon và công thức độc đáo. Hãy cùng khám phá thế giới ẩm thực phong phú của Snack Việt và thưởng thức những trải nghiệm vị giác tuyệt vời ngay hôm nay!"
              }
            </p>
            <div className="flex gap-2">
              <Button size="icon" variant="outline">
                <Facebook className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="outline">
                <Instagram className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="outline">
                <Youtube className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Liên kết nhanh</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li>
                <Link href="/about" className="hover:text-orange-500 transition-colors">
                  Về chúng tôi
                </Link>
              </li>
              <li>
                <Link href="/products" className="hover:text-orange-500 transition-colors">
                  Sản phẩm
                </Link>
              </li>
              <li>
                <Link href="/discounts" className="hover:text-orange-500 transition-colors">
                  Khuyến mãi
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Hỗ trợ khách hàng</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li>
                <Link href="/faq" className="hover:text-orange-500 transition-colors">
                  Câu hỏi thường gặp
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-orange-500 transition-colors">
                  Liên hệ
                </Link>
              </li>
            </ul>

            <div className="mt-6 border-t pt-4">
              <h4 className="font-medium mb-3 text-foreground">Chính sách</h4>
              <ul className="space-y-2 text-muted-foreground">
                {publishedPolicies.length > 0 ? (
                  publishedPolicies.map((policy) => (
                    <li key={policy._id}>
                      <Link href={`/policies/${policy.slug}`} className="hover:text-orange-500 transition-colors">
                        {policy.title}
                      </Link>
                    </li>
                  ))
                ) : (
                  <li className="text-sm text-muted-foreground">Chưa có chính sách công khai</li>
                )}
                <li>
                  <Link href="/policies" className="hover:text-orange-500 transition-colors font-medium">
                    Xem tất cả chính sách
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Liên hệ</h3>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-start gap-2">
                <MapPin className="h-5 w-5 mt-0.5 shrink-0 text-orange-500" />
                <span className="text-pretty leading-relaxed">
                  {
                    [
                      generalInfo?.contactInfo?.contactAddress,
                      generalInfo?.contactInfo?.ward?.name,
                      generalInfo?.contactInfo?.province?.name
                    ]
                      .filter(Boolean) // Loại bỏ các phần bị undefined hoặc null
                      .join(", ")      // Ghép lại bằng dấu phẩy và khoảng trắng
                    || "123 Nguyễn Huệ, Q.1, TP.HCM" // Giá trị mặc định nếu tất cả đều trống
                  }
                </span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-5 w-5 shrink-0 text-orange-500" />
                <span>{generalInfo?.contactInfo?.contactPhone || "1900 1234"}</span>
              </li>
              <li className="flex items-center gap-2">
                <Clock3 className="h-5 w-5 shrink-0 text-orange-500" />
                <span>{generalInfo?.contactInfo?.workingHours || "08:00 - 22:00 (T2 - CN)"}</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-5 w-5 shrink-0 text-orange-500" />
                <span>{generalInfo?.contactInfo?.contactEmail || "hotro@snackviet.vn"}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* <div className="border-t pt-8 pb-8">
          <div className="max-w-md mx-auto text-center">
            <h3 className="font-semibold mb-2">Đăng ký nhận tin</h3>
            <p className="text-sm text-muted-foreground mb-4">Nhận thông tin khuyến mãi và sản phẩm mới nhất</p>
            <div className="flex gap-2">
              <Input type="email" placeholder="Email của bạn" />
              <Button>Đăng ký</Button>
            </div>
          </div>
        </div> */}

        <div className="border-t pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; 2026 Snack Việt. Tất cả quyền được bảo lưu.</p>
        </div>
      </div>
    </footer>
  )
}
