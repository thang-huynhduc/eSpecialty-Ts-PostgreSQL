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

// Initialize Gmail API
const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

// Function to get access token
async function getAccessToken() {
  try {
    const accessTokenResponse = await oAuth2Client.getAccessToken();
    const token = accessTokenResponse?.token || accessTokenResponse;
    if (!token) throw new Error("No access token retrieved");
    return token;
  } catch (error) {
    console.error("Error getting access token:", error);
    throw error;
  }
}

// Function to create email message in RFC 2822 format
function createEmailMessage(from, to, subject, htmlContent) {
  const boundary = '----=_Part_' + Math.random().toString(36).substr(2, 9);
  
  // Encode subject for UTF-8 support
  const encodedSubject = `=?UTF-8?B?${Buffer.from(subject, 'utf8').toString('base64')}?=`;
  
  const message = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${encodedSubject}`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    ``,
    `--${boundary}`,
    `Content-Type: text/html; charset=UTF-8`,
    `Content-Transfer-Encoding: 7bit`,
    ``,
    htmlContent,
    ``,
    `--${boundary}--`
  ].join('\n');
  
  return Buffer.from(message).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Function to send email using Gmail API
async function sendEmailViaGmailAPI(toEmail, subject, htmlContent) {
  try {
    const from = `"E-Specialty" <${process.env.GMAIL_EMAIL}>`;
    const raw = createEmailMessage(from, toEmail, subject, htmlContent);
    
    const result = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: raw
      }
    });
    
    console.log("Email sent via Gmail API:", result.data);
    return true;
  } catch (error) {
    console.error("Error sending email via Gmail API:", {
      message: error.message,
      code: error.code,
      response: error.response,
    });
    return false;
  }
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
    refund_notification: "refund notification",
    payment_failed: "payment failure notification",
  };
  const actionText = actionMap[type] || "your action";

  let htmlContent;

  if (type === "payment_confirmation") {
    const { orderId, items, amount, shippingFee, address, totalAmount } = orderData || {};
    const computedTotal = (typeof totalAmount === 'number' ? totalAmount : (amount + (shippingFee || 0))).toLocaleString('vi-VN');
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
              <p><strong>Tổng tiền:</strong> ${computedTotal} VND</p>
              
              <p>Đơn hàng sẽ được xác nhận và gửi đi sớm. Cảm ơn bạn!</p>
            </div>
            <div class="footer">&copy; ${new Date().getFullYear()} eSpecialty Shopping. Trân trọng!</div>
          </div>
        </body>
      </html>
    `;
  } else if (type === "payment_failed") {
    const { orderId, items, amount, shippingFee, address, retryUrl, totalAmount } = orderData || {};
    const computedTotal = (typeof totalAmount === 'number' ? totalAmount : (amount + (shippingFee || 0))).toLocaleString('vi-VN');
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
            .retry-button { display: inline-block; padding: 10px 20px; background: #dc3545; color: #fff; text-decoration: none; border-radius: 4px; margin: 10px 0; }
            .highlight { background: #fff3cd; padding: 10px; border-radius: 4px; margin: 10px 0; }
            .footer { text-align: center; font-size: 13px; color: #777; border-top: 1px solid #eee; padding-top: 15px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header"><h1>eSpecialty Shopping</h1></div>
            <div class="content">
              <p>Xin chào bạn,</p>
              <p>Thanh toán cho đơn hàng <strong>#${orderId}</strong> của bạn không thành công. Vui lòng thử lại.</p>
              
              <div class="highlight">
                <p><strong>Lưu ý:</strong> Đơn hàng của bạn vẫn đang được giữ. Vui lòng hoàn tất thanh toán sớm để tiếp tục xử lý.</p>
              </div>
              
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
              <p><strong>Tổng tiền:</strong> ${computedTotal} VND</p>
              
              <p>Vui lòng thử thanh toán lại bằng cách nhấn vào nút dưới đây:</p>
              <a href="${retryUrl}" class="retry-button">Thử thanh toán lại</a>
              
              <p>Nếu bạn gặp bất kỳ vấn đề nào, vui lòng liên hệ với chúng tôi.</p>
              <p>Trân trọng,<br>Đội ngũ eSpecialty Shopping</p>
            </div>
            <div class="footer">&copy; ${new Date().getFullYear()} eSpecialty Shopping. Trân trọng!</div>
          </div>
        </body>
      </html>
    `;
  } else if (type.startsWith("order_")) {
    const { orderId, status, items, amount, shippingFee, address, ghnOrderCode, ghnExpectedDeliveryTime, totalAmount } = orderData || {};
    const computedTotal = (typeof totalAmount === 'number' ? totalAmount : (amount + (shippingFee || 0))).toLocaleString('vi-VN');
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
              <p>Đơn hàng của bạn <strong>#${orderId}</strong> đã được ${actionText === "order confirmation" ? "tạo thành công" : actionText === "order cancellation" ? "huỷ" : `đã được vận chuyển đi!`}.</p>
              
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
              <p><strong>Tổng tiền:</strong> ${computedTotal} VND</p>
              
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
  } else if (type === "refund_notification") {
    const { orderId, refundId, refundAmount, exchangeRate, reason, refundedBy } = orderData || {};
    htmlContent = `
      <html>
        <head>
          <meta charset="UTF-8" />
          <style>
            body { font-family: Arial, Helvetica, sans-serif; background: #f4f4f7; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 20px auto; background: #fff; border-radius: 8px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
            .header { text-align: center; border-bottom: 1px solid #eee; padding-bottom: 15px; }
            .header h1 { color: #2a2a2a; }
            .content { padding: 20px 0; line-height: 1.6; }
            .refund-box { background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 6px; padding: 15px; margin: 15px 0; }
            .refund-amount { font-size: 18px; font-weight: bold; color: #28a745; }
            .footer { text-align: center; color: #666; font-size: 12px; border-top: 1px solid #eee; padding-top: 15px; }
            .highlight { background: #fff3cd; padding: 10px; border-radius: 4px; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header"><h1>eSpecialty Shopping</h1></div>
            <div class="content">
              <p>Xin chào bạn,</p>
              <p>Chúng tôi xin thông báo rằng đơn hàng <strong>#${orderId}</strong> đã được hoàn tiền thành công.</p>
              
              <div class="refund-box">
                <h3>Thông tin hoàn tiền:</h3>
                <p><strong>Mã hoàn tiền:</strong> ${refundId}</p>
                <p><strong>Số tiền hoàn:</strong> <span class="refund-amount">${refundAmount?.vnd?.toLocaleString('vi-VN')} VND</span></p>
                ${refundAmount?.usd ? `<p><strong>Số tiền PayPal:</strong> $${refundAmount.usd.toFixed(2)} USD</p>` : ''}
                <p><strong>Lý do hoàn tiền:</strong> ${reason}</p>
                <p><strong>Người thực hiện:</strong> ${refundedBy === 'admin' ? 'Quản trị viên' : 'Khách hàng'}</p>
              </div>
              
              <div class="highlight">
                <p><strong>Lưu ý:</strong> Số tiền sẽ được hoàn về tài khoản PayPal của bạn trong vòng 3-5 ngày làm việc.</p>
              </div>
              
              <p>Nếu bạn có bất kỳ thắc mắc nào, vui lòng liên hệ với chúng tôi.</p>
              <p>Trân trọng,<br>Đội ngũ eSpecialty Shopping</p>
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

  try {
    const result = await sendEmailViaGmailAPI(toEmail, subject, htmlContent);
    return result;
  } catch (error) {
    console.error("Error sending email:", {
      message: error.message,
      code: error.code,
      response: error.response,
    });
    return false;
  }
};
