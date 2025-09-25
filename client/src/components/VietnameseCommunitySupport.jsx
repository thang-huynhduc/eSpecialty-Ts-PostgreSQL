import React from 'react';
import { useTranslation } from 'react-i18next';

const VietnameseCommunitySupport = () => {
  const { t } = useTranslation();

  const supportPrograms = [
    {
      name: "Hỗ trợ nông dân",
      description: "Mua sản phẩm trực tiếp từ nông dân với giá hợp lý",
      icon: "🌾",
      color: "from-green-400 to-green-600",
      benefits: [
        "Tăng thu nhập cho nông dân",
        "Đảm bảo chất lượng sản phẩm",
        "Hỗ trợ phát triển bền vững"
      ],
      impact: "500+ nông dân được hỗ trợ"
    },
    {
      name: "Bảo tồn làng nghề",
      description: "Hỗ trợ các làng nghề truyền thống phát triển",
      icon: "🏘️",
      color: "from-blue-400 to-blue-600",
      benefits: [
        "Bảo tồn nghề truyền thống",
        "Tạo việc làm cho người dân",
        "Phát triển du lịch địa phương"
      ],
      impact: "20+ làng nghề được hỗ trợ"
    },
    {
      name: "Giáo dục trẻ em",
      description: "Hỗ trợ giáo dục và phát triển cho trẻ em vùng sâu vùng xa",
      icon: "👶",
      color: "from-purple-400 to-purple-600",
      benefits: [
        "Hỗ trợ học tập",
        "Cung cấp dụng cụ học tập",
        "Tổ chức hoạt động văn hóa"
      ],
      impact: "1000+ trẻ em được hỗ trợ"
    },
    {
      name: "Bảo vệ môi trường",
      description: "Thúc đẩy sản xuất thân thiện với môi trường",
      icon: "🌱",
      color: "from-teal-400 to-teal-600",
      benefits: [
        "Giảm thiểu ô nhiễm",
        "Sử dụng nguyên liệu tự nhiên",
        "Tái chế và tái sử dụng"
      ],
      impact: "Giảm 30% chất thải"
    }
  ];

  const achievements = [
    {
      number: "10,000+",
      label: "Khách hàng hài lòng",
      icon: "😊"
    },
    {
      number: "500+",
      label: "Nông dân được hỗ trợ",
      icon: "👨‍🌾"
    },
    {
      number: "20+",
      label: "Làng nghề được bảo tồn",
      icon: "🏘️"
    },
    {
      number: "1000+",
      label: "Trẻ em được hỗ trợ",
      icon: "👶"
    }
  ];

  const testimonials = [
    {
      name: "Anh Nguyễn Văn A",
      role: "Nông dân Phú Quốc",
      content: "Nhờ eSpecialty, tôi có thể bán nước mắm với giá tốt hơn và có thu nhập ổn định cho gia đình.",
      avatar: "/api/placeholder/100/100"
    },
    {
      name: "Chị Trần Thị B",
      role: "Chủ làng nghề bánh trung thu",
      content: "eSpecialty giúp chúng tôi bảo tồn nghề truyền thống và tạo việc làm cho nhiều người dân địa phương.",
      avatar: "/api/placeholder/100/100"
    },
    {
      name: "Anh Lê Văn C",
      role: "Khách hàng thân thiết",
      content: "Tôi rất hài lòng với chất lượng sản phẩm và dịch vụ của eSpecialty. Đặc sản luôn tươi ngon và đúng hương vị.",
      avatar: "/api/placeholder/100/100"
    }
  ];

  return (
    <div className="py-16 bg-gradient-to-br from-emerald-50 to-teal-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Hỗ Trợ Cộng Đồng
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Cam kết phát triển bền vững và hỗ trợ cộng đồng địa phương
          </p>
        </div>

        {/* Support Programs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {supportPrograms.map((program, index) => (
            <div key={index} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-start mb-4">
                <div className={`w-16 h-16 bg-gradient-to-br ${program.color} rounded-full flex items-center justify-center text-white text-2xl mr-4`}>
                  {program.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{program.name}</h3>
                  <p className="text-gray-600 mb-3">{program.description}</p>
                  <span className="text-sm text-green-600 font-medium bg-green-100 px-2 py-1 rounded-full">
                    {program.impact}
                  </span>
                </div>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Lợi ích:</h4>
                <div className="space-y-2">
                  {program.benefits.map((benefit, benefitIndex) => (
                    <div key={benefitIndex} className="flex items-center text-sm text-green-600">
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {benefit}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Achievements */}
        <div className="mb-16">
          <h3 className="text-3xl font-bold text-gray-900 text-center mb-8">
            Thành Tựu Đạt Được
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {achievements.map((achievement, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-lg p-6 text-center hover:shadow-xl transition-shadow duration-300">
                <div className="text-4xl mb-4">{achievement.icon}</div>
                <div className="text-3xl font-bold text-gray-900 mb-2">{achievement.number}</div>
                <div className="text-gray-600">{achievement.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonials */}
        <div className="mb-16">
          <h3 className="text-3xl font-bold text-gray-900 text-center mb-8">
            Lời Chia Sẻ Từ Cộng Đồng
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-center mb-4">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full mr-4"
                  />
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">{testimonial.name}</h4>
                    <p className="text-sm text-gray-600">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-gray-600 leading-relaxed">"{testimonial.content}"</p>
              </div>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <h3 className="text-3xl font-bold text-gray-900 mb-4">
            Tham Gia Cùng Chúng Tôi
          </h3>
          <p className="text-xl text-gray-600 mb-8">
            Hãy cùng chúng tôi xây dựng một cộng đồng phát triển bền vững
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-300">
              Tham gia hỗ trợ
            </button>
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-300">
              Tìm hiểu thêm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VietnameseCommunitySupport;
