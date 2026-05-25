import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { RotateCcw, Clock, CheckCircle2, XCircle, AlertCircle, Phone } from "lucide-react"

export default function ReturnsPage() {
  return (
    <div className="min-h-screen">
      <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-600/10 mb-6">
              <RotateCcw className="h-8 w-8 text-orange-500" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-balance">Chính sách đổi trả</h1>
            <p className="text-lg text-muted-foreground text-balance leading-relaxed">
              Cam kết hỗ trợ đổi trả nhanh chóng, bảo vệ quyền lợi khách hàng
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
                    <Clock className="h-6 w-6 text-orange-500" />
                  </div>
                  <h3 className="font-semibold mb-2">Đổi trả trong 7 ngày</h3>
                  <p className="text-sm text-muted-foreground text-balance">Kể từ ngày nhận hàng</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-full bg-orange-600/10 flex items-center justify-center mb-4">
                    <CheckCircle2 className="h-6 w-6 text-orange-500" />
                  </div>
                  <h3 className="font-semibold mb-2">Hoàn tiền 100%</h3>
                  <p className="text-sm text-muted-foreground text-balance">Nếu lỗi từ shop</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-full bg-orange-600/10 flex items-center justify-center mb-4">
                    <RotateCcw className="h-6 w-6 text-orange-500" />
                  </div>
                  <h3 className="font-semibold mb-2">Quy trình đơn giản</h3>
                  <p className="text-sm text-muted-foreground text-balance">Chỉ cần liên hệ hotline</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-3 mb-4">
                  <CheckCircle2 className="h-6 w-6 text-orange-500 flex-shrink-0 mt-1" />
                  <div>
                    <h2 className="text-2xl font-bold mb-3">Điều kiện đổi trả</h2>
                    <div className="space-y-4 text-muted-foreground">
                      <p className="leading-relaxed">Chúng tôi chấp nhận đổi trả sản phẩm trong các trường hợp sau:</p>
                      <ul className="space-y-2">
                        <li className="flex gap-2 leading-relaxed">
                          <CheckCircle2 className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                          <span>Sản phẩm bị lỗi do nhà sản xuất: bao bì rách, sản phẩm hư hỏng, hết hạn sử dụng</span>
                        </li>
                        <li className="flex gap-2 leading-relaxed">
                          <CheckCircle2 className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                          <span>Giao sai sản phẩm: không đúng mẫu mã, số lượng hoặc thông tin đặt hàng</span>
                        </li>
                        <li className="flex gap-2 leading-relaxed">
                          <CheckCircle2 className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                          <span>Sản phẩm bị hư hại trong quá trình vận chuyển</span>
                        </li>
                        <li className="flex gap-2 leading-relaxed">
                          <CheckCircle2 className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                          <span>Sản phẩm chưa qua sử dụng, còn nguyên tem mác, bao bì</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-3 mb-4">
                  <XCircle className="h-6 w-6 text-destructive flex-shrink-0 mt-1" />
                  <div>
                    <h2 className="text-2xl font-bold mb-3">Trường hợp không được đổi trả</h2>
                    <div className="space-y-4 text-muted-foreground">
                      <ul className="space-y-2">
                        <li className="flex gap-2 leading-relaxed">
                          <XCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                          <span>Sản phẩm đã qua sử dụng, bị rách bao bì hoặc làm mất tem niêm phong</span>
                        </li>
                        <li className="flex gap-2 leading-relaxed">
                          <XCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                          <span>Quá thời hạn 7 ngày kể từ ngày nhận hàng</span>
                        </li>
                        <li className="flex gap-2 leading-relaxed">
                          <XCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                          <span>Sản phẩm thuộc chương trình khuyến mãi đặc biệt (có ghi chú không đổi trả)</span>
                        </li>
                        <li className="flex gap-2 leading-relaxed">
                          <XCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                          <span>Khách hàng đổi ý nhưng sản phẩm không còn đảm bảo chất lượng ban đầu</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-3 mb-4">
                  <AlertCircle className="h-6 w-6 text-orange-500 flex-shrink-0 mt-1" />
                  <div>
                    <h2 className="text-2xl font-bold mb-3">Quy trình đổi trả</h2>
                    <div className="space-y-4 text-muted-foreground">
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-600 text-orange-500-foreground flex items-center justify-center font-semibold text-sm">
                          1
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground mb-1">Liên hệ với chúng tôi</h3>
                          <p className="text-sm leading-relaxed">
                            Gọi hotline 1900 1234 hoặc nhắn tin qua fanpage trong vòng 7 ngày kể từ khi nhận hàng. Cung
                            cấp mã đơn hàng và hình ảnh sản phẩm lỗi.
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-600 text-orange-500-foreground flex items-center justify-center font-semibold text-sm">
                          2
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground mb-1">Xác nhận yêu cầu</h3>
                          <p className="text-sm leading-relaxed">
                            Bộ phận CSKH sẽ xác nhận và hướng dẫn bạn quy trình đổi trả cụ thể. Thời gian xử lý trong
                            vòng 24h.
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-600 text-orange-500-foreground flex items-center justify-center font-semibold text-sm">
                          3
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground mb-1">Gửi lại sản phẩm</h3>
                          <p className="text-sm leading-relaxed">
                            Đóng gói sản phẩm cẩn thận và gửi về địa chỉ chúng tôi cung cấp. Phí ship sẽ do shop chịu
                            nếu lỗi từ chúng tôi.
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-600 text-orange-500-foreground flex items-center justify-center font-semibold text-sm">
                          4
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground mb-1">Kiểm tra & xử lý</h3>
                          <p className="text-sm leading-relaxed">
                            Sau khi nhận được hàng, chúng tôi sẽ kiểm tra và xử lý đổi sản phẩm mới hoặc hoàn tiền trong
                            vòng 3-5 ngày làm việc.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-3 mb-4">
                  <Phone className="h-6 w-6 text-orange-500 flex-shrink-0 mt-1" />
                  <div>
                    <h2 className="text-2xl font-bold mb-3">Thông tin liên hệ đổi trả</h2>
                    <div className="space-y-4 text-muted-foreground">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="border rounded-lg p-4">
                          <h3 className="font-semibold text-foreground mb-2">Hotline hỗ trợ</h3>
                          <p className="text-2xl font-bold text-orange-500 mb-1">1900 1234</p>
                          <p className="text-sm">Thứ 2 - Chủ nhật: 8:00 - 22:00</p>
                        </div>

                        <div className="border rounded-lg p-4">
                          <h3 className="font-semibold text-foreground mb-2">Email</h3>
                          <p className="text-lg font-semibold text-orange-500 mb-1">doitra@snackviet.vn</p>
                          <p className="text-sm">Phản hồi trong 24h</p>
                        </div>
                      </div>

                      <div className="border rounded-lg p-4">
                        <h3 className="font-semibold text-foreground mb-2">Địa chỉ gửi hàng đổi trả</h3>
                        <p className="leading-relaxed">123 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh</p>
                        <p className="text-sm mt-2">
                          <strong>Người nhận:</strong> Bộ phận CSKH - Snack Việt
                        </p>
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
                    <span>Vui lòng quay video khi mở hàng để làm bằng chứng trong trường hợp sản phẩm có vấn đề.</span>
                  </li>
                  <li className="flex gap-2 leading-relaxed">
                    <span className="text-orange-500">•</span>
                    <span>Không nhận hàng nếu phát hiện bao bì rách, ướt hoặc có dấu hiệu bất thường.</span>
                  </li>
                  <li className="flex gap-2 leading-relaxed">
                    <span className="text-orange-500">•</span>
                    <span>Thời gian hoàn tiền có thể khác nhau tùy theo phương thức thanh toán ban đầu.</span>
                  </li>
                  <li className="flex gap-2 leading-relaxed">
                    <span className="text-orange-500">•</span>
                    <span>Nếu có thắc mắc, vui lòng liên hệ ngay để được hỗ trợ kịp thời.</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="mt-12 text-center">
            <p className="text-muted-foreground mb-4">Cần hỗ trợ về chính sách đổi trả?</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild size="lg">
                <Link href="/contact">Liên hệ ngay</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/faq">Xem câu hỏi thường gặp</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
