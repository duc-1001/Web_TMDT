import { Card, CardContent } from "@/components/ui/card"

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <section className="bg-gradient-to-br from-primary/10 via-background to-primary/5 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-balance">Điều khoản dịch vụ</h1>
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
                Chào mừng bạn đến với Snack Việt. Bằng việc truy cập và sử dụng website này, bạn đồng ý tuân thủ và bị
                ràng buộc bởi các điều khoản và điều kiện sử dụng sau đây. Nếu bạn không đồng ý với bất kỳ phần nào của
                các điều khoản này, vui lòng không sử dụng website của chúng tôi.
              </p>

              <h2 className="text-2xl font-bold mb-4">2. Tài khoản người dùng</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Khi tạo tài khoản trên Snack Việt, bạn cam kết:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground leading-relaxed mb-6 space-y-2">
                <li>Cung cấp thông tin chính xác, đầy đủ và cập nhật</li>
                <li>Bảo mật thông tin tài khoản và mật khẩu của bạn</li>
                <li>Thông báo ngay cho chúng tôi về bất kỳ việc sử dụng trái phép nào</li>
                <li>Chịu trách nhiệm về tất cả hoạt động diễn ra dưới tài khoản của bạn</li>
              </ul>

              <h2 className="text-2xl font-bold mb-4">3. Đặt hàng và thanh toán</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">Khi đặt hàng trên website, bạn đồng ý rằng:</p>
              <ul className="list-disc pl-6 text-muted-foreground leading-relaxed mb-6 space-y-2">
                <li>Bạn có đủ năng lực pháp lý để thực hiện giao dịch mua bán</li>
                <li>Thông tin đặt hàng của bạn là chính xác và đầy đủ</li>
                <li>Bạn cam kết thanh toán đầy đủ cho đơn hàng</li>
                <li>Chúng tôi có quyền từ chối hoặc hủy đơn hàng trong một số trường hợp nhất định</li>
              </ul>

              <h2 className="text-2xl font-bold mb-4">4. Giá cả và khuyến mãi</h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Giá sản phẩm có thể thay đổi mà không cần thông báo trước. Các chương trình khuyến mãi có thể có điều
                kiện và thời hạn áp dụng riêng. Chúng tôi không chịu trách nhiệm về việc sai sót giá do lỗi kỹ thuật và
                có quyền hủy đơn hàng nếu phát hiện sai sót.
              </p>

              <h2 className="text-2xl font-bold mb-4">5. Giao hàng</h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Chúng tôi sẽ cố gắng giao hàng trong thời gian dự kiến, tuy nhiên thời gian giao hàng có thể bị ảnh
                hưởng bởi các yếu tố khách quan. Chúng tôi không chịu trách nhiệm về sự chậm trễ ngoài tầm kiểm soát.
              </p>

              <h2 className="text-2xl font-bold mb-4">6. Chính sách đổi trả</h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Sản phẩm có thể được đổi trả trong vòng 7 ngày kể từ ngày nhận hàng nếu đáp ứng các điều kiện trong
                chính sách đổi trả của chúng tôi. Sản phẩm phải còn nguyên seal, chưa qua sử dụng và giữ nguyên bao bì.
              </p>

              <h2 className="text-2xl font-bold mb-4">7. Sở hữu trí tuệ</h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Tất cả nội dung trên website này, bao gồm văn bản, hình ảnh, logo, và thiết kế, đều thuộc quyền sở hữu
                của Snack Việt và được bảo vệ bởi luật sở hữu trí tuệ. Việc sao chép, phân phối hoặc sử dụng trái phép
                nội dung của chúng tôi là vi phạm pháp luật.
              </p>

              <h2 className="text-2xl font-bold mb-4">8. Giới hạn trách nhiệm</h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Snack Việt không chịu trách nhiệm về bất kỳ thiệt hại trực tiếp, gián tiếp, ngẫu nhiên hay do hậu quả
                phát sinh từ việc sử dụng hoặc không thể sử dụng website và dịch vụ của chúng tôi.
              </p>

              <h2 className="text-2xl font-bold mb-4">9. Thay đổi điều khoản</h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Chúng tôi có quyền thay đổi các điều khoản này bất cứ lúc nào. Việc tiếp tục sử dụng website sau khi có
                thay đổi đồng nghĩa với việc bạn chấp nhận các điều khoản mới.
              </p>

              <h2 className="text-2xl font-bold mb-4">10. Liên hệ</h2>
              <p className="text-muted-foreground leading-relaxed">
                Nếu bạn có bất kỳ câu hỏi nào về Điều khoản dịch vụ này, vui lòng liên hệ với chúng tôi qua email
                support@snackviet.com hoặc hotline 1900-1234.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}
