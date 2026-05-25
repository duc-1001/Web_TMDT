import { Card, CardContent } from "@/components/ui/card"

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <section className="bg-gradient-to-br from-primary/10 via-background to-primary/5 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-balance">Chính sách bảo mật</h1>
            <p className="text-muted-foreground">Cập nhật lần cuối: 15/01/2024</p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <Card className="max-w-4xl mx-auto">
            <CardContent className="p-8 prose prose-gray max-w-none">
              <h2 className="text-2xl font-bold mb-4">1. Giới thiệu</h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Snack Việt cam kết bảo vệ quyền riêng tư của bạn. Chính sách bảo mật này giải thích cách chúng tôi thu
                thập, sử dụng, chia sẻ và bảo vệ thông tin cá nhân của bạn khi bạn sử dụng website và dịch vụ của chúng
                tôi.
              </p>

              <h2 className="text-2xl font-bold mb-4">2. Thông tin chúng tôi thu thập</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Chúng tôi có thể thu thập các loại thông tin sau:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground leading-relaxed mb-6 space-y-2">
                <li>Thông tin cá nhân: Họ tên, địa chỉ email, số điện thoại, địa chỉ giao hàng</li>
                <li>Thông tin đơn hàng: Lịch sử mua hàng, giỏ hàng, sở thích mua sắm</li>
                <li>Thông tin thanh toán: Phương thức thanh toán (không lưu trữ thông tin thẻ)</li>
                <li>Thông tin kỹ thuật: Địa chỉ IP, loại trình duyệt, thời gian truy cập</li>
              </ul>

              <h2 className="text-2xl font-bold mb-4">3. Cách chúng tôi sử dụng thông tin</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">Thông tin của bạn được sử dụng để:</p>
              <ul className="list-disc pl-6 text-muted-foreground leading-relaxed mb-6 space-y-2">
                <li>Xử lý và giao đơn hàng của bạn</li>
                <li>Cung cấp dịch vụ khách hàng và hỗ trợ</li>
                <li>Cải thiện trải nghiệm mua sắm của bạn</li>
                <li>Gửi thông tin khuyến mãi và cập nhật sản phẩm (nếu bạn đồng ý)</li>
                <li>Phân tích và cải thiện dịch vụ của chúng tôi</li>
              </ul>

              <h2 className="text-2xl font-bold mb-4">4. Chia sẻ thông tin</h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Chúng tôi không bán hoặc cho thuê thông tin cá nhân của bạn. Chúng tôi chỉ chia sẻ thông tin với các đối
                tác cần thiết để hoàn thành dịch vụ như đơn vị vận chuyển, xử lý thanh toán, và chỉ trong phạm vi cần
                thiết để thực hiện dịch vụ.
              </p>

              <h2 className="text-2xl font-bold mb-4">5. Bảo mật thông tin</h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Chúng tôi áp dụng các biện pháp bảo mật kỹ thuật và tổ chức phù hợp để bảo vệ thông tin cá nhân của bạn
                khỏi truy cập trái phép, mất mát, hoặc tiết lộ. Tuy nhiên, không có phương thức truyền dữ liệu qua
                internet nào là hoàn toàn an toàn 100%.
              </p>

              <h2 className="text-2xl font-bold mb-4">6. Cookies và công nghệ theo dõi</h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Website của chúng tôi sử dụng cookies để cải thiện trải nghiệm người dùng, phân tích lưu lượng truy cập,
                và cá nhân hóa nội dung. Bạn có thể quản lý cookies thông qua cài đặt trình duyệt của mình.
              </p>

              <h2 className="text-2xl font-bold mb-4">7. Quyền của bạn</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">Bạn có quyền:</p>
              <ul className="list-disc pl-6 text-muted-foreground leading-relaxed mb-6 space-y-2">
                <li>Truy cập và xem thông tin cá nhân của bạn</li>
                <li>Yêu cầu chỉnh sửa thông tin không chính xác</li>
                <li>Yêu cầu xóa thông tin cá nhân của bạn</li>
                <li>Từ chối nhận email marketing</li>
                <li>Rút lại sự đồng ý sử dụng thông tin của bạn</li>
              </ul>

              <h2 className="text-2xl font-bold mb-4">8. Lưu trữ thông tin</h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Chúng tôi lưu trữ thông tin cá nhân của bạn trong thời gian cần thiết để cung cấp dịch vụ và tuân thủ
                các nghĩa vụ pháp lý. Sau đó, thông tin sẽ được xóa hoặc ẩn danh hóa một cách an toàn.
              </p>

              <h2 className="text-2xl font-bold mb-4">9. Thay đổi chính sách</h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Chúng tôi có thể cập nhật Chính sách bảo mật này theo thời gian. Mọi thay đổi sẽ được đăng tải trên
                trang này với ngày cập nhật mới. Chúng tôi khuyến khích bạn xem lại chính sách này định kỳ.
              </p>

              <h2 className="text-2xl font-bold mb-4">10. Liên hệ</h2>
              <p className="text-muted-foreground leading-relaxed">
                Nếu bạn có câu hỏi về Chính sách bảo mật này hoặc muốn thực hiện quyền của mình, vui lòng liên hệ với
                chúng tôi qua email privacy@snackviet.com hoặc hotline 1900-1234.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}
