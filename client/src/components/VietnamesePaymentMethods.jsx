import React from 'react';
import { useTranslation } from 'react-i18next';

const VietnamesePaymentMethods = () => {
  const { t } = useTranslation();

  const paymentMethods = [
    {
      name: "Thanh toán khi nhận hàng",
      description: "Thanh toán bằng tiền mặt khi nhận hàng",
      icon: "💵",
      color: "from-green-400 to-green-600",
      features: ["An toàn", "Tiện lợi", "Không cần thẻ"],
      popular: true
    },
    {
      name: "VNPay",
      description: "Ví điện tử phổ biến tại Việt Nam",
      icon: "📱",
      color: "from-blue-400 to-blue-600",
      features: ["Nhanh chóng", "Bảo mật", "Nhiều ưu đãi"],
      popular: true
    },
    {
      name: "MoMo",
      description: "Ví điện tử được yêu thích",
      icon: "💰",
      color: "from-purple-400 to-purple-600",
      features: ["Dễ sử dụng", "Nhiều tính năng", "Hỗ trợ tốt"],
      popular: true
    },
    {
      name: "ZaloPay",
      description: "Thanh toán qua ứng dụng Zalo",
      icon: "💬",
      color: "from-orange-400 to-orange-600",
      features: ["Tích hợp Zalo", "Nhanh chóng", "Tiện lợi"],
      popular: false
    },
    {
      name: "Banking",
      description: "Chuyển khoản ngân hàng",
      icon: "🏦",
      color: "from-gray-400 to-gray-600",
      features: ["An toàn", "Phí thấp", "Phổ biến"],
      popular: false
    },
    {
      name: "PayPal",
      description: "Thanh toán quốc tế",
      icon: "🌍",
      color: "from-yellow-400 to-yellow-600",
      features: ["Quốc tế", "Bảo mật", "Đa ngôn ngữ"],
      popular: false
    }
  ];

  return (
    <div className="py-16 bg-gradient-to-br from-indigo-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Phương Thức Thanh Toán
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Hỗ trợ đa dạng các phương thức thanh toán phổ biến tại Việt Nam
          </p>
        </div>

        {/* Payment Methods Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {paymentMethods.map((method, index) => (
            <div key={index} className="group">
              <div className={`bg-gradient-to-br ${method.color} rounded-2xl p-6 text-white hover:scale-105 transition-transform duration-300 relative`}>
                {/* Popular Badge */}
                {method.popular && (
                  <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full">
                    Phổ biến
                  </div>
                )}

                {/* Method Header */}
                <div className="text-center mb-6">
                  <div className="text-4xl mb-3">{method.icon}</div>
                  <h3 className="text-xl font-bold mb-2">{method.name}</h3>
                </div>

                {/* Description */}
                <p className="text-sm opacity-90 mb-6 leading-relaxed">
                  {method.description}
                </p>

                {/* Features */}
                <div>
                  <h4 className="text-lg font-semibold mb-3">Ưu điểm:</h4>
                  <div className="space-y-2">
                    {method.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center text-sm">
                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Security Info */}
        <div className="mt-16">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h3 className="text-3xl font-bold text-gray-900 text-center mb-8">
              Bảo Mật Thanh Toán
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🔒</span>
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Mã hóa SSL</h4>
                <p className="text-gray-600">Tất cả giao dịch được mã hóa an toàn</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🛡️</span>
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Bảo vệ dữ liệu</h4>
                <p className="text-gray-600">Thông tin cá nhân được bảo vệ tuyệt đối</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">✅</span>
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Xác thực</h4>
                <p className="text-gray-600">Hệ thống xác thực đa lớp</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VietnamesePaymentMethods;
