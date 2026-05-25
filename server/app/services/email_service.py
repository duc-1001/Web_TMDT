import datetime
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from app.core.config import settings
from fastapi import HTTPException

conf = ConnectionConfig(
    MAIL_USERNAME=settings.MAIL_USERNAME,
    MAIL_PASSWORD=settings.MAIL_PASSWORD,
    MAIL_FROM=settings.MAIL_FROM,
    MAIL_SERVER=settings.MAIL_SERVER,
    MAIL_PORT=settings.MAIL_PORT,
    MAIL_STARTTLS=True,   # ✅ BẮT BUỘC
    MAIL_SSL_TLS=False   # ✅ BẮT BUỘC
)

async def send_verify_email(email: str, token: str):
    link = f"{settings.FRONTEND_CLIENT_URL}/verify-email?token={token}"
    message = MessageSchema(
        subject="Xác thực email của bạn",
        recipients=[email],
        body=f"""
        <div style="font-family: Arial, sans-serif; background-color:#f6f6f6; padding:20px;">
        <div style="max-width:600px; margin:auto; background:#ffffff; border-radius:8px; overflow:hidden;">
            
            <div style="background:#ff7a18; padding:20px; text-align:center;">
            <h1 style="color:#ffffff; margin:0;">🍿 Snack Việt</h1>
            </div>

            <div style="padding:30px; color:#333333;">
            <h2 style="margin-top:0;">Xác thực địa chỉ email</h2>

            <p>Xin chào,</p>

            <p>
                Cảm ơn bạn đã đăng ký tài khoản tại <strong>Snack Việt</strong>.
                Vui lòng nhấn vào nút bên dưới để xác thực email của bạn:
            </p>

            <div style="text-align:center; margin:30px 0;">
                <a href="{link}"
                style="
                    background:#ff7a18;
                    color:#ffffff;
                    padding:14px 28px;
                    text-decoration:none;
                    border-radius:6px;
                    font-weight:bold;
                    display:inline-block;
                ">
                Xác thực email
                </a>
            </div>

            <p>
                Liên kết này sẽ <strong>hết hạn sau 30 phút</strong>.
                Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email.
            </p>

            <p style="margin-top:30px;">
                Trân trọng,<br/>
                <strong>Đội ngũ Snack Việt</strong>
            </p>
            </div>

            <div style="background:#f0f0f0; padding:15px; text-align:center; font-size:12px; color:#777;">
            © {datetime.datetime.utcnow().year} Snack Việt. All rights reserved.
            </div>

        </div>
        </div>
        """,
        subtype="html"
    )

    fm = FastMail(conf)
    await fm.send_message(message)

async def send_reset_password_email(email: str, token: str):
    link = f"{settings.FRONTEND_CLIENT_URL}/reset-password?token={token}"
    message = MessageSchema(
        subject="Đặt lại mật khẩu của bạn",
        recipients=[email],
        body=f"""
        <div style="font-family: Arial, sans-serif; background-color:#f6f6f6; padding:20px;">
        <div style="max-width:600px; margin:auto; background:#ffffff; border-radius:8px; overflow:hidden;">
            
            <div style="background:#ff7a18; padding:20px; text-align:center;">
            <h1 style="color:#ffffff; margin:0;">🍿 Snack Việt</h1>
            </div>

            <div style="padding:30px; color:#333333;">
            <h2 style="margin-top:0;">Đặt lại mật khẩu</h2>

            <p>Xin chào,</p>

            <p>
                Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.
                Vui lòng nhấn vào nút bên dưới để đặt lại mật khẩu:
            </p>

            <div style="text-align:center; margin:30px 0;">
                <a href="{link}"
                style="
                    background:#ff7a18;
                    color:#ffffff;
                    padding:14px 28px;
                    text-decoration:none;
                    border-radius:6px;
                    font-weight:bold;
                    display:inline-block;
                ">
                Đặt lại mật khẩu
                </a>
            </div>

            <p>
                Liên kết này sẽ <strong>hết hạn sau 30 phút</strong>.
                Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email.
            </p>

            <p style="margin-top:30px;">
                Trân trọng,<br/>
                <strong>Đội ngũ Snack Việt</strong>
            </p>
            </div>

            <div style="background:#f0f0f0; padding:15px; text-align:center; font-size:12px; color:#777;">
            © {datetime.datetime.utcnow().year} Snack Việt. All rights reserved.
            </div>

        </div>
        </div>
        """,
        subtype="html"
    )

    fm = FastMail(conf)
    await fm.send_message(message)

async def send_order_success_email(
    *,
    email: str,
    order_code: str,
    total_amount: int,
    payment_method: str,
    viewToken: str
):
    # mapping payment label
    payment_label_map = {
        "cod": "Thanh toán khi nhận hàng (COD)",
        "banking": "Chuyển khoản ngân hàng",
        "momo": "Ví MoMo",
    }

    payment_label = payment_label_map.get(payment_method, "Thanh toán online")

    link = f"{settings.FRONTEND_CLIENT_URL}/orders/{order_code}?token={viewToken}"

    html = f"""
    <div style="font-family: Arial, sans-serif; background-color:#f6f6f6; padding:20px;">
      <div style="max-width:600px; margin:auto; background:#ffffff; border-radius:8px; overflow:hidden;">

        <div style="background:#ff7a18; padding:20px; text-align:center;">
          <h1 style="color:#ffffff; margin:0;">🍿 Snack Việt</h1>
        </div>

        <div style="padding:30px; color:#333333;">
          <h2 style="margin-top:0;">🎉 Đặt hàng thành công</h2>

          <p>Xin chào,</p>

          <p>
            Cảm ơn bạn đã mua hàng tại <strong>Snack Việt</strong>.
            Đơn hàng của bạn đã được tạo thành công với thông tin sau:
          </p>

          <ul style="padding-left:18px; line-height:1.8;">
            <li><strong>Mã đơn hàng:</strong> {order_code}</li>
            <li><strong>Tổng tiền:</strong> {total_amount:,} ₫</li>
            <li><strong>Phương thức thanh toán:</strong> {payment_label}</li>
          </ul>

          <div style="text-align:center; margin:30px 0;">
            <a href="{link}"
              style="
                background:#ff7a18;
                color:#ffffff;
                padding:14px 28px;
                text-decoration:none;
                border-radius:6px;
                font-weight:bold;
                display:inline-block;
              ">
              Xem chi tiết đơn hàng
            </a>
          </div>

          <p>
            Nếu bạn đã thanh toán online, hệ thống sẽ tự động xác nhận đơn hàng.
            Trong trường hợp COD, đơn hàng sẽ được xử lý sớm nhất.
          </p>

          <p style="margin-top:30px;">
            Trân trọng,<br/>
            <strong>Đội ngũ Snack Việt</strong>
          </p>
        </div>

        <div style="background:#f0f0f0; padding:15px; text-align:center; font-size:12px; color:#777;">
          © {datetime.datetime.utcnow().year} Snack Việt. All rights reserved.
        </div>

      </div>
    </div>
    """

    message = MessageSchema(
        subject=f"Snack Việt - Xác nhận đơn hàng #{order_code}",
        recipients=[email],
        body=html,
        subtype="html",
    )

    fm = FastMail(conf)
    await fm.send_message(message)

async def send_account_locked_email(
    *,
    email: str,
    username: str,
    reason: str
):
    html = f"""
    <div style="font-family: Arial, sans-serif; background-color:#f6f6f6; padding:20px;">
      <div style="max-width:600px; margin:auto; background:#ffffff; border-radius:8px; overflow:hidden;">

        <div style="background:#ff4d4f; padding:20px; text-align:center;">
          <h1 style="color:#ffffff; margin:0;">🍿 Snack Việt</h1>
        </div>

        <div style="padding:30px; color:#333333;">
          <h2 style="margin-top:0;">⚠️ Tài khoản của bạn đã bị khóa</h2>

          <p>Xin chào <strong>{username}</strong>,</p>

          <p>
            Chúng tôi nhận thấy có vấn đề với tài khoản của bạn, do đó tài khoản đã tạm thời bị khóa.
            Lý do khóa tài khoản: <strong>{reason}</strong>.
          </p>

          <p>
            Nếu bạn nghĩ đây là nhầm lẫn hoặc muốn mở lại tài khoản, vui lòng liên hệ với bộ phận hỗ trợ của chúng tôi.
          </p>

          <p style="margin-top:30px;">
            Trân trọng,<br/>
            <strong>Đội ngũ Snack Việt</strong>
          </p>
        </div>

        <div style="background:#f0f0f0; padding:15px; text-align:center; font-size:12px; color:#777;">
          © {datetime.datetime.utcnow().year} Snack Việt. All rights reserved.
        </div>

      </div>
    </div>
    """

    message = MessageSchema(
        subject="Snack Việt - Thông báo khóa tài khoản",
        recipients=[email],
        body=html,
        subtype="html",
    )

    fm = FastMail(conf)
    await fm.send_message(message)

async def send_account_unlocked_email(
    *,
    email: str,
    username: str
):
    html = f"""
    <div style="font-family: Arial, sans-serif; background-color:#f6f6f6; padding:20px;">
      <div style="max-width:600px; margin:auto; background:#ffffff; border-radius:8px; overflow:hidden;">

        <div style="background:#28a745; padding:20px; text-align:center;">
          <h1 style="color:#ffffff; margin:0;">🍿 Snack Việt</h1>
        </div>

        <div style="padding:30px; color:#333333;">
          <h2 style="margin-top:0;">✅ Tài khoản của bạn đã được mở lại</h2>

          <p>Xin chào <strong>{username}</strong>,</p>

          <p>
            Chúng tôi vui mừng thông báo rằng tài khoản của bạn đã được mở lại.
            Bạn có thể đăng nhập và tiếp tục sử dụng các dịch vụ của Snack Việt.
          </p>

          <p style="margin-top:30px;">
            Trân trọng,<br/>
            <strong>Đội ngũ Snack Việt</strong>
          </p>
        </div>

        <div style="background:#f0f0f0; padding:15px; text-align:center; font-size:12px; color:#777;">
          © {datetime.datetime.utcnow().year} Snack Việt. All rights reserved.
        </div>

      </div>
    </div>
    """

    message = MessageSchema(
        subject="Snack Việt - Tài khoản của bạn đã được mở lại",
        recipients=[email],
        body=html,
        subtype="html",
    )

    fm = FastMail(conf)
    await fm.send_message(message)

async def send_fancy_email(
    *,
    subject: str,
    recipients: list[str],
    message_body: str,
):
    """
    Gửi email kiểu “sinh động” mà không có CTA, chỉ gồm:
    - Header màu cam + emoji
    - Body nội dung
    - Footer thương hiệu
    """
    # Validate input
    if not subject:
        raise HTTPException(status_code=400, detail="Subject không được để trống")
    if not recipients or not all(recipients):
        raise HTTPException(status_code=400, detail="Recipients list invalid")

    body_html = (message_body or "").replace("\n", "<br/>")

    html = f"""
    <div style="font-family: 'Arial', sans-serif; background-color:#f6f6f6; padding:20px;">
      <div style="max-width:600px; margin:auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.1);">

        <!-- Header -->
        <div style="background:#ff7a18; padding:30px; text-align:center;">
          <h1 style="color:#fff; margin:0; font-size:30px;">🍿 Snack Việt</h1>
          <p style="color:#fff; margin:5px 0 0; font-size:16px;">Thưởng thức món ngon mỗi ngày!</p>
        </div>

        <!-- Body -->
        <div style="padding:30px; color:#333; font-size:16px; line-height:1.6;">
          {body_html}
        </div>

        <!-- Footer -->
        <div style="background:#f0f0f0; padding:20px; text-align:center; font-size:13px; color:#777;">
          Trân trọng,<br/>
          <strong>Đội ngũ Snack Việt</strong><br/>
          © {datetime.datetime.utcnow().year} Snack Việt. All rights reserved.
        </div>

      </div>
    </div>
    """

    message = MessageSchema(
        subject=subject,
        recipients=recipients,
        body=html,
        subtype="html"
    )

    fm = FastMail(conf)
    await fm.send_message(message)

async def send_refund_otp_email(email: str, otp: str, order_code: str):
    html = f"""
    <div style="font-family: Arial, sans-serif; background-color:#f6f6f6; padding:20px;">
      <div style="max-width:600px; margin:auto; background:#ffffff; border-radius:8px; overflow:hidden;">

        <div style="background:#ff7a18; padding:20px; text-align:center;">
          <h1 style="color:#ffffff; margin:0;">🍿 Snack Việt</h1>
        </div>

        <div style="padding:30px; color:#333333;">
          <h2 style="margin-top:0;">🔐 Xác thực yêu cầu hoàn tiền</h2>

          <p>Xin chào,</p>

          <p>
            Chúng tôi nhận được yêu cầu hoàn tiền cho đơn hàng
            <strong>#{order_code}</strong>.
            Vui lòng sử dụng mã OTP dưới đây để xác nhận:
          </p>

          <div style="text-align:center; margin:30px 0;">
            <div style="
              display:inline-block;
              background:#fff8f3;
              border:2px dashed #ff7a18;
              border-radius:12px;
              padding:20px 40px;
            ">
              <span style="
                font-size:42px;
                font-weight:bold;
                letter-spacing:10px;
                color:#ff7a18;
              ">{otp}</span>
            </div>
          </div>

          <p style="text-align:center; color:#e53e3e; font-weight:bold;">
            ⏱ Mã OTP có hiệu lực trong <strong>5 phút</strong>.
          </p>

          <p>
            Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.
            Yêu cầu hoàn tiền sẽ <strong>không</strong> được tạo nếu không có mã OTP.
          </p>

          <p style="margin-top:30px;">
            Trân trọng,<br/>
            <strong>Đội ngũ Snack Việt</strong>
          </p>
        </div>

        <div style="background:#f0f0f0; padding:15px; text-align:center; font-size:12px; color:#777;">
          © {datetime.datetime.utcnow().year} Snack Việt. All rights reserved.
        </div>

      </div>
    </div>
    """

    message = MessageSchema(
        subject=f"Snack Việt - Mã OTP xác thực hoàn tiền đơn #{order_code}",
        recipients=[email],
        body=html,
        subtype="html",
    )

    fm = FastMail(conf)
    await fm.send_message(message)