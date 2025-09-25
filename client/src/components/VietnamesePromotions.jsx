import React from 'react';
import { useTranslation } from 'react-i18next';

const VietnamesePromotions = () => {
  const { t } = useTranslation();

  const promotions = [
    {
      title: "Khuyến mãi Tết Nguyên Đán",
      period: "Tháng 1-2",
      description: "Ưu đãi đặc biệt cho dịp Tết cổ truyền",
      icon: "🧧",
      color: "from-red-400 to-red-600",
      offers: [
        "Giảm giá 20% cho đơn hàng từ 1 triệu",
        "Tặng kèm bánh chưng, bánh tét",
        "Miễn phí vận chuyển toàn quốc"
      ],
      active: true
    },
    {
      title: "Khuyến mãi Trung Thu",
      period: "Tháng 8-9",
      description: "Chương trình đặc biệt cho dịp Trung Thu",
      icon: "🌕",
      color: "from-yellow-400 to-orange-600",
      offers: [
        "Giảm giá 15% cho bánh trung thu",
        "Tặng kèm trà và hạt dưa",
        "Giao hàng miễn phí trong ngày"
      ],
      active: false
    },
    {
      title: "Khuyến mãi mùa hè",
      period: "Tháng 5-7",
      description: "Ưu đãi cho các món ăn giải nhiệt",
      icon: "☀️",
      color: "from-blue-400 to-blue-600",
      offers: [
        "Giảm giá 10% cho chè và đồ uống",
        "Tặng kèm đá viên",
        "Giao hàng nhanh trong 2 giờ"
      ],
      active: false
    },
    {
      title: "Khuyến mãi cuối năm",
      period: "Tháng 11-12",
      description: "Chương trình tri ân khách hàng",
      icon: "🎁",
      color: "from-green-400 to-green-600",
      offers: [
        "Giảm giá 25% cho đơn hàng lớn",
        "Tặng voucher cho đơn hàng tiếp theo",
        "Miễn phí vận chuyển và đóng gói"
      ],
      active: false
    }
  ];

  const loyaltyProgram = [
    {
      level: "Thành viên mới",
      requirement: "Đăng ký tài khoản",
      benefits: ["Giảm 5% cho đơn hàng đầu tiên", "Miễn phí vận chuyển", "Tích điểm 1x"],
      color: "from-gray-400 to-gray-600"
    },
    {
      level: "Thành viên đồng",
      requirement: "Mua hàng từ 500.000đ",
      benefits: ["Giảm 10% cho mọi đơn hàng", "Ưu tiên giao hàng", "Tích điểm 1.5x"],
      color: "from-yellow-400 to-yellow-600"
    },
    {
      level: "Thành viên bạc",
      requirement: "Mua hàng từ 2.000.000đ",
      benefits: ["Giảm 15% cho mọi đơn hàng", "Giao hàng miễn phí", "Tích điểm 2x"],
      color: "from-gray-400 to-gray-600"
    },
    {
      level: "Thành viên vàng",
      requirement: "Mua hàng từ 5.000.000đ",
      benefits: ["Giảm 20% cho mọi đơn hàng", "Giao hàng siêu tốc", "Tích điểm 3x"],
      color: "from-yellow-400 to-yellow-600"
    }
  ];

  return (
    <div className="py-16 bg-gradient-to-br from-pink-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Chương Trình Khuyến Mãi
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Nhiều ưu đãi hấp dẫn và chương trình khuyến mãi đặc biệt
          </p>
        </div>

        {/* Seasonal Promotions */}
        <div className="mb-16">
          <h3 className="text-3xl font-bold text-gray-900 text-center mb-8">
            Khuyến Mãi Theo Mùa
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {promotions.map((promotion, index) => (
              <div key={index} className="group">
                <div className={`bg-gradient-to-br ${promotion.color} rounded-2xl p-6 text-white hover:scale-105 transition-transform duration-300 relative`}>
                  {/* Active Badge */}
                  {promotion.active && (
                    <div className="absolute -top-2 -right-2 bg-green-400 text-green-900 text-xs font-bold px-2 py-1 rounded-full">
                      Đang diễn ra
                    </div>
                  )}

                  {/* Promotion Header */}
                  <div className="text-center mb-6">
                    <div className="text-4xl mb-3">{promotion.icon}</div>
                    <h4 className="text-xl font-bold mb-2">{promotion.title}</h4>
                    <p className="text-sm opacity-90">{promotion.period}</p>
                  </div>

                  {/* Description */}
                  <p className="text-sm opacity-90 mb-6 leading-relaxed">
                    {promotion.description}
                  </p>

                  {/* Offers */}
                  <div>
                    <h5 className="text-lg font-semibold mb-3">Ưu đãi:</h5>
                    <div className="space-y-2">
                      {promotion.offers.map((offer, offerIndex) => (
                        <div key={offerIndex} className="flex items-start text-sm">
                          <svg className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          {offer}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Loyalty Program */}
        <div className="mb-16">
          <h3 className="text-3xl font-bold text-gray-900 text-center mb-8">
            Chương Trình Thành Viên
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {loyaltyProgram.map((level, index) => (
              <div key={index} className="group">
                <div className={`bg-gradient-to-br ${level.color} rounded-2xl p-6 text-white hover:scale-105 transition-transform duration-300`}>
                  {/* Level Header */}
                  <div className="text-center mb-6">
                    <div className="text-3xl mb-3">⭐</div>
                    <h4 className="text-xl font-bold mb-2">{level.level}</h4>
                    <p className="text-sm opacity-90">{level.requirement}</p>
                  </div>

                  {/* Benefits */}
                  <div>
                    <h5 className="text-lg font-semibold mb-3">Quyền lợi:</h5>
                    <div className="space-y-2">
                      {level.benefits.map((benefit, benefitIndex) => (
                        <div key={benefitIndex} className="flex items-start text-sm">
                          <svg className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          {benefit}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Special Offers */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h3 className="text-3xl font-bold text-gray-900 text-center mb-8">
            Ưu Đãi Đặc Biệt
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎁</span>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Quà tặng miễn phí</h4>
              <p className="text-gray-600">Tặng kèm sản phẩm cho đơn hàng từ 1 triệu</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🚚</span>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Giao hàng miễn phí</h4>
              <p className="text-gray-600">Miễn phí vận chuyển cho đơn hàng từ 500k</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💳</span>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Thanh toán linh hoạt</h4>
              <p className="text-gray-600">Hỗ trợ trả góp 0% lãi suất</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VietnamesePromotions;
