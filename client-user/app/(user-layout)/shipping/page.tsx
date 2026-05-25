import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Truck, Clock, Package, MapPin, DollarSign, CheckCircle2 } from "lucide-react"

export default function ShippingPage() {
  return (
    <div className="min-h-screen">
      <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-600/10 mb-6">
              <Truck className="h-8 w-8 text-orange-500" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-balance">Chính sách vận chuyển</h1>
            <p className="text-lg text-muted-foreground text-balance leading-relaxed">
              Cam kết giao hàng nhanh chóng, an toàn đến tận tay khách hàng
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-full bg-orange-600/10 flex items-center justify-center mb-4">
                    <Truck className="h-6 w-6 text-orange-500" />
                  </div>
                  <h3 className="font-semibold mb-2">Giao hàng toàn quốc</h3>
                  <p className="text-sm text-muted-foreground text-balance">Phủ sóng 63 tỉnh thành</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-full bg-orange-600/10 flex items-center justify-center mb-4">
                    <Clock className="h-6 w-6 text-orange-500" />
                  </div>
                  <h3 className="font-semibold mb-2">Giao hàng nhanh</h3>
                  <p className="text-sm text-muted-foreground text-balance">2-3 ngày nội thành</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-full bg-orange-600/10 flex items-center justify-center mb-4">
                    <Package className="h-6 w-6 text-orange-500" />
                  </div>
                  <h3 className="font-semibold mb-2">Đóng gói cẩn thận</h3>
                  <p className="text-sm text-muted-foreground text-balance">Đảm bảo hàng nguyên vẹn</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-3 mb-4">
                  <MapPin className="h-6 w-6 text-orange-500 flex-shrink-0 mt-1" />
                  <div>
                    <h2 className="text-2xl font-bold mb-3">Khu vực giao hàng</h2>
                    <div className="space-y-4 text-muted-foreground">
                      <div>
                        <h3 className="font-semibold text-foreground mb-2">Nội thành TP.HCM và Hà Nội</h3>
                        <p className="leading-relaxed">
                          Giao hàng trong vòng 2-3 ngày làm việc. Đối với đơn hàng đặt trước 14h, chúng tôi sẽ cố gắng
                          giao trong ngày hoặc ngày hôm sau.
                        </p>
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground mb-2">Các tỉnh thành khác</h3>
                        <p className="leading-relaxed">
                          Thời gian giao hàng từ 3-5 ngày làm việc tùy theo khoảng cách địa lý. Chúng tôi hợp tác với
                          các đơn vị vận chuyển uy tín để đảm bảo hàng đến nơi an toàn.
                        </p>
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground mb-2">Vùng sâu, vùng xa</h3>
                        <p className="leading-relaxed">
                          Thời gian có thể kéo dài từ 5-7 ngày làm việc. Vui lòng liên hệ với chúng tôi để được tư vấn
                          cụ thể về thời gian giao hàng.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-3 mb-4">
                  <DollarSign className="h-6 w-6 text-orange-500 flex-shrink-0 mt-1" />
                  <div>
                    <h2 className="text-2xl font-bold mb-3">Phí vận chuyển</h2>
                    <div className="space-y-4">
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold">Miễn phí vận chuyển</h3>
                          <span className="text-sm bg-orange-600/10 text-orange-500 px-2 py-1 rounded">Khuyến mãi</span>
                        </div>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                          Áp dụng cho đơn hàng từ 300.000đ trở lên tại nội thành TP.HCM và Hà Nội
                        </p>
                      </div>

                      <div className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold">Nội thành</h3>
                          <span className="font-semibold text-orange-500">25.000đ</span>
                        </div>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                          Phí vận chuyển cố định cho đơn hàng dưới 300.000đ
                        </p>
                      </div>

                      <div className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold">Ngoại thành</h3>
                          <span className="font-semibold text-orange-500">30.000đ - 50.000đ</span>
                        </div>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                          Phí vận chuyển tùy thuộc vào khoảng cách và trọng lượng đơn hàng
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-3 mb-4">
                  <CheckCircle2 className="h-6 w-6 text-orange-500 flex-shrink-0 mt-1" />
                  <div>
                    <h2 className="text-2xl font-bold mb-3">Quy trình giao nhận</h2>
                    <div className="space-y-4 text-muted-foreground">
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-600 text-orange-500-foreground flex items-center justify-center font-semibold text-sm">
                          1
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground mb-1">Xác nhận đơn hàng</h3>
                          <p className="text-sm leading-relaxed">
                            Sau khi đặt hàng, chúng tôi sẽ gọi điện xác nhận trong vòng 24h
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-600 text-orange-500-foreground flex items-center justify-center font-semibold text-sm">
                          2
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground mb-1">Chuẩn bị hàng</h3>
                          <p className="text-sm leading-relaxed">
                            Đóng gói cẩn thận, kiểm tra chất lượng trước khi giao
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-600 text-orange-500-foreground flex items-center justify-center font-semibold text-sm">
                          3
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground mb-1">Vận chuyển</h3>
                          <p className="text-sm leading-relaxed">Gửi mã vận đơn để bạn theo dõi hành trình giao hàng</p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-600 text-orange-500-foreground flex items-center justify-center font-semibold text-sm">
                          4
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground mb-1">Giao hàng & thanh toán</h3>
                          <p className="text-sm leading-relaxed">
                            Kiểm tra hàng trước khi thanh toán. Hỗ trợ COD hoặc chuyển khoản
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-orange-600/5 border-primary/20">
              <CardContent className="pt-6">
                <h2 className="text-xl font-bold mb-3">Lưu ý quan trọng</h2>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex gap-2 leading-relaxed">
                    <span className="text-orange-500">•</span>
                    <span>
                      Vui lòng kiểm tra kỹ sản phẩm trước khi thanh toán. Nếu có vấn đề, từ chối nhận hàng và liên hệ
                      ngay với chúng tôi.
                    </span>
                  </li>
                  <li className="flex gap-2 leading-relaxed">
                    <span className="text-orange-500">•</span>
                    <span>Thời gian giao hàng có thể thay đổi trong các dịp lễ, Tết hoặc thời tiết xấu.</span>
                  </li>
                  <li className="flex gap-2 leading-relaxed">
                    <span className="text-orange-500">•</span>
                    <span>Đảm bảo số điện thoại và địa chỉ chính xác để nhận hàng nhanh chóng.</span>
                  </li>
                  <li className="flex gap-2 leading-relaxed">
                    <span className="text-orange-500">•</span>
                    <span>Mọi thắc mắc vui lòng liên hệ hotline: 1900 1234 để được hỗ trợ.</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="mt-12 text-center">
            <p className="text-muted-foreground mb-4">Cần hỗ trợ thêm về vận chuyển?</p>
            <Button asChild size="lg">
              <Link href="/contact">Liên hệ với chúng tôi</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
