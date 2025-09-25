import React from 'react';
import { useTranslation } from 'react-i18next';

const VietnameseShippingInfo = () => {
  const { t } = useTranslation();

  const shippingOptions = [
    {
      name: "Giao hàng tiêu chuẩn",
      duration: "2-3 ngày làm việc",
      price: "Miễn phí từ 500.000đ",
      icon: "🚚",
      color: "from-blue-400 to-blue-600",
      features: ["Giao hàng toàn quốc", "Theo dõi đơn hàng", "Đóng gói cẩn thận"],
      popular: true
    },
    {
      name: "Giao hàng nhanh",
      duration: "1-2 ngày làm việc",
      price: "Từ 30.000đ",
      icon: "⚡",
      color: "from-yellow-400 to-orange-600",
      features: ["Giao hàng nhanh", "Ưu tiên cao", "Cập nhật liên tục"],
      popular: false
    },
    {
      name: "Giao hàng siêu tốc",
      duration: "Trong ngày",
      price: "Từ 50.000đ",
      icon: "🏃‍♂️",
      color: "from-red-400 to-red-600",
      features: ["Giao trong ngày", "Dịch vụ cao cấp", "Hỗ trợ 24/7"],
      popular: false
    }
  ];

  const regions = [
    {
      name: "Hà Nội",
      duration: "1-2 ngày",
      icon: "🏛️",
      color: "from-green-400 to-green-600"
    },
    {
      name: "TP. Hồ Chí Minh",
      duration: "1-2 ngày",
      icon: "🏙️",
      color: "from-blue-400 to-blue-600"
    },
    {
      name: "Đà Nẵng",
      duration: "2-3 ngày",
      icon: "🌊",
      color: "from-purple-400 to-purple-600"
    },
    {
      name: "Các tỉnh khác",
      duration: "3-5 ngày",
      icon: "🗺️",
      color: "from-orange-400 to-orange-600"
    }
  ];

  return (
    <div className="py-16 bg-gradient-to-br from-green-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Dịch Vụ Giao Hàng
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Giao hàng nhanh chóng và an toàn đến mọi vùng miền Việt Nam
          </p>
        </div>

        {/* Shipping Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {shippingOptions.map((option, index) => (
            <div key={index} className="group">
              <div className={`bg-gradient-to-br ${option.color} rounded-2xl p-6 text-white hover:scale-105 transition-transform duration-300 relative`}>
                {/* Popular Badge */}
                {option.popular && (
                  <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full">
                    Phổ biến
                  </div>
                )}

                {/* Option Header */}
                <div className="text-center mb-6">
                  <div className="text-4xl mb-3">{option.icon}</div>
                  <h3 className="text-xl font-bold mb-2">{option.name}</h3>
                  <p className="text-sm opacity-90">{option.duration}</p>
                  <p className="text-sm opacity-90 font-semibold">{option.price}</p>
                </div>

                {/* Features */}
                <div>
                  <h4 className="text-lg font-semibold mb-3">Tính năng:</h4>
                  <div className="space-y-2">
                    {option.features.map((feature, featureIndex) => (
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

        {/* Delivery Regions */}
        <div className="mb-16">
          <h3 className="text-3xl font-bold text-gray-900 text-center mb-8">
            Thời Gian Giao Hàng Theo Khu Vực
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {regions.map((region, index) => (
              <div key={index} className="group">
                <div className={`bg-gradient-to-br ${region.color} rounded-2xl p-6 text-white text-center hover:scale-105 transition-transform duration-300`}>
                  <div className="text-4xl mb-3">{region.icon}</div>
                  <h4 className="text-xl font-bold mb-2">{region.name}</h4>
                  <p className="text-sm opacity-90">{region.duration}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Shipping Features */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h3 className="text-3xl font-bold text-gray-900 text-center mb-8">
            Tính Năng Giao Hàng Đặc Biệt
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📦</span>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Đóng gói đặc biệt</h4>
              <p className="text-gray-600">Đóng gói cẩn thận cho thực phẩm</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📱</span>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Theo dõi đơn hàng</h4>
              <p className="text-gray-600">Cập nhật trạng thái realtime</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔄</span>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Đổi trả dễ dàng</h4>
              <p className="text-gray-600">Chính sách đổi trả linh hoạt</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🛡️</span>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Bảo hiểm hàng hóa</h4>
              <p className="text-gray-600">Bảo hiểm cho mọi đơn hàng</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VietnameseShippingInfo;
