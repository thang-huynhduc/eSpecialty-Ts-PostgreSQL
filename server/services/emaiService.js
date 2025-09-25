import nodemailer from "nodemailer";
import { google } from "googleapis";

// Initialize OAuth2 client
const oAuth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  "https://developers.google.com/oauthplayground" // Redirect URI used to obtain refresh token
);

// Set OAuth2 credentials
oAuth2Client.setCredentials({
  refresh_token: process.env.GMAIL_REFRESH_TOKEN,
});

// Function to get access token
async function getAccessToken() {
  try {
    const accessTokenResponse = await oAuth2Client.getAccessToken();
    const token = accessTokenResponse?.token || accessTokenResponse;
    if (!token) throw new Error("No access token retrieved");
    return token;
  } catch (error) {
    console.error("❌ Error getting access token:", error);
    throw error;
  }
}

// Initialize Nodemailer transporter with OAuth2
async function createTransporter() {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    throw new Error("Failed to retrieve access token.");
  }
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: process.env.GMAIL_EMAIL,
      clientId: process.env.GMAIL_CLIENT_ID,
      clientSecret: process.env.GMAIL_CLIENT_SECRET,
      refreshToken: process.env.GMAIL_REFRESH_TOKEN,
      accessToken,
    },
    // Explicitly disable TLS/SSL fallbacks if needed
    tls: {
      rejectUnauthorized: true,
    },
  });
}

// Hàm gửi email OTP hoặc thông báo đơn hàng
export const sendOtpEmail = async (toEmail, otpCode, subject, type, orderData = null) => {
  const actionMap = {
    register: "registration verification",
    resetPassword: "password reset",
    unlockAccount: "unlocking your account",
    order_confirmation: "order confirmation",
    order_status_update: "order status update",
    order_cancelled: "order cancellation",
    payment_confirmation: "payment confirmation",
  };
  const actionText = actionMap[type] || "your action";

  let htmlContent;

  if (type === "payment_confirmation") {
    const { orderId, items, amount, shippingFee, address } = orderData || {};
    htmlContent = `
      <html>
        <head>
          <meta charset="UTF-8" />
          <style>
            body { font-family: Arial, Helvetica, sans-serif; background: #f4f4f7; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 20px auto; background: #fff; border-radius: 8px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
            .header { text-align: center; border-bottom: 1px solid #eee; padding-bottom: 15px; }
            .header h1 { color: #2a2a2a; }
            .content { font-size: 15px; color: #333; line-height: 1.6; padding: 20px 0; }
            .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .table th, .table td { border: 1px solid #eee; padding: 10px; text-align: left; }
            .footer { text-align: center; font-size: 13px; color: #777; border-top: 1px solid #eee; padding-top: 15px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header"><h1>eSpecialty Shopping</h1></div>
            <div class="content">
              <p>Xin chào bạn,</p>
              <p>Thanh toán cho đơn hàng của bạn <strong>#${orderId}</strong> đã thành công.</p>
              
              <h3>Thông tin địa chỉ giao hàng:</h3>
              <ul>
                <li><strong>Họ tên:</strong> ${address?.firstName && address?.lastName ? `${address.firstName} ${address.lastName}` : address?.name || "N/A"}</li>
                <li><strong>Địa chỉ:</strong> ${address?.street}, ${address?.ward}, ${address?.district}, ${address?.city}, ${address?.country}</li>
                <li><strong>Mã bưu điện:</strong> ${address?.zipcode}</li>
                <li><strong>Số điện thoại:</strong> ${address?.phone}</li>
                <li><strong>Email:</strong> ${address?.email}</li>
              </ul>
              
              <h3>Chi tiết đơn hàng:</h3>
              <table class="table">
                <thead>
                  <tr>
                    <th>Sản phẩm</th>
                    <th>Số lượng</th>
                    <th>Giá</th>
                    <th>Tổng</th>
                  </tr>
                </thead>
                <tbody>
                  ${items?.map(item => `
                    <tr>
                      <td>${item.name}</td>
                      <td>${item.quantity}</td>
                      <td>${item.price.toLocaleString('vi-VN')} VND</td>
                      <td>${(item.price * item.quantity).toLocaleString('vi-VN')} VND</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
              
              <p><strong>Phí ship:</strong> ${shippingFee?.toLocaleString('vi-VN')} VND</p>
              <p><strong>Tổng tiền:</strong> ${amount?.toLocaleString('vi-VN')} VND</p>
              
              <p>Đơn hàng sẽ được xác nhận và gửi đi sớm. Cảm ơn bạn!</p>
            </div>
            <div class="footer">&copy; ${new Date().getFullYear()} eSpecialty Shopping. Trân trọng!</div>
          </div>
        </body>
      </html>
    `;
  } else if (type.startsWith("order_")) {
    const { orderId, status, items, amount, shippingFee, address, ghnOrderCode, ghnExpectedDeliveryTime } = orderData || {};
    htmlContent = `
      <html>
        <head>
          <meta charset="UTF-8" />
          <style>
            body { font-family: Arial, Helvetica, sans-serif; background: #f4f4f7; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 20px auto; background: #fff; border-radius: 8px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
            .header { text-align: center; border-bottom: 1px solid #eee; padding-bottom: 15px; }
            .header h1 { color: #2a2a2a; }
            .content { font-size: 15px; color: #333; line-height: 1.6; padding: 20px 0; }
            .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .table th, .table td { border: 1px solid #eee; padding: 10px; text-align: left; }
            .footer { text-align: center; font-size: 13px; color: #777; border-top: 1px solid #eee; padding-top: 15px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header"><h1>eSpecialty Shopping</h1></div>
            <div class="content">
              <p>Xin chào bạn,</p>
              <p>Đơn hàng của bạn <strong>#${orderId}</strong> đã được ${actionText === "order confirmation" ? "tạo thành công" : actionText === "order cancellation" ? "huỷ" : `cập nhật trạng thái: <strong>${status}</strong>`}.</p>
              
              <h3>Thông tin địa chỉ giao hàng:</h3>
              <ul>
                <li><strong>Họ tên:</strong> ${address?.firstName && address?.lastName ? `${address.firstName} ${address.lastName}` : address?.name || "N/A"}</li>
                <li><strong>Địa chỉ:</strong> ${address?.street}, ${address?.ward}, ${address?.district}, ${address?.city}, ${address?.country}</li>
                <li><strong>Mã bưu điện:</strong> ${address?.zipcode}</li>
                <li><strong>Số điện thoại:</strong> ${address?.phone}</li>
                <li><strong>Email:</strong> ${address?.email}</li>
              </ul>
              
              <h3>Chi tiết đơn hàng:</h3>
              <table class="table">
                <thead>
                  <tr>
                    <th>Sản phẩm</th>
                    <th>Số lượng</th>
                    <th>Giá</th>
                    <th>Tổng</th>
                  </tr>
                </thead>
                <tbody>
                  ${items?.map(item => `
                    <tr>
                      <td>${item.name}</td>
                      <td>${item.quantity}</td>
                      <td>${item.price.toLocaleString('vi-VN')} VND</td>
                      <td>${(item.price * item.quantity).toLocaleString('vi-VN')} VND</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
              
              <p><strong>Phí ship:</strong> ${shippingFee?.toLocaleString('vi-VN')} VND</p>
              <p><strong>Tổng tiền:</strong> ${amount?.toLocaleString('vi-VN')} VND</p>
              
              ${ghnOrderCode ? `
                <h3>Thông tin vận chuyển (GHN):</h3>
                <p><strong>Mã vận đơn GHN:</strong> ${ghnOrderCode}</p>
                <p><strong>Thời gian giao dự kiến:</strong> ${ghnExpectedDeliveryTime ? new Date(ghnExpectedDeliveryTime).toLocaleString('vi-VN') : 'N/A'}</p>
              ` : ''}
              
              <p>Cảm ơn bạn đã mua hàng tại eSpecialty Shopping!</p>
            </div>
            <div class="footer">&copy; ${new Date().getFullYear()} eSpecialty Shopping. Trân trọng!</div>
          </div>
        </body>
      </html>
    `;
  } else {
    htmlContent = `
      <html>
        <head>
          <meta charset="UTF-8" />
          <style>
            body { font-family: Arial, Helvetica, sans-serif; background: #f4f4f7; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 20px auto; background: #fff; border-radius: 8px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
            .header { text-align: center; border-bottom: 1px solid #eee; padding-bottom: 15px; }
            .header h1 { color: #2a2a2a; }
            .content { font-size: 15px; color: #333; line-height: 1.6; padding: 20px 0; }
            .otp-box { font-size: 22px; font-weight: bold; color: #1a73e8; background: #f0f4ff; padding: 12px; border-radius: 6px; text-align: center; margin: 20px 0; letter-spacing: 3px; }
            .footer { text-align: center; font-size: 13px; color: #777; border-top: 1px solid #eee; padding-top: 15px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header"><h1>eSpecialty Shopping</h1></div>
            <div class="content">
              <p>Xin chào bạn,</p>
              <p>Mã OTP để <strong>${actionText}</strong> của bạn là:</p>
              <div class="otp-box">${otpCode}</div>
              <p>Mã này có hiệu lực trong <strong>5 phút</strong>. Vui lòng không chia sẻ cho bất kỳ ai.</p>
              <p>Nếu bạn không yêu cầu, hãy bỏ qua email này nhé.</p>
            </div>
            <div class="footer">&copy; ${new Date().getFullYear()} eSpecialty Shopping. Trân trọng!</div>
          </div>
        </body>
      </html>
    `;
  }

  const mailOptions = {
    from: `"E-Specialty" <${process.env.GMAIL_EMAIL}>`,
    to: toEmail,
    subject,
    html: htmlContent,
  };

  try {
    const transporter = await createTransporter();
    const result = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent:", result);
    return true;
  } catch (error) {
    console.error("❌ Error sending email:", {
      message: error.message,
      code: error.code,
      response: error.response,
    });
    return false;
  }
};