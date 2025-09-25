import React from 'react';
import { useTranslation } from 'react-i18next';

const VietnamesePartners = () => {
  const { t } = useTranslation();

  const partners = [
    {
      name: "Nhà sản xuất nước mắm Phú Quốc",
      region: "Phú Quốc, Kiên Giang",
      specialty: "Nước mắm truyền thống",
      description: "Hơn 100 năm kinh nghiệm sản xuất nước mắm theo phương pháp cổ truyền",
      image: "/api/placeholder/300/200",
      features: ["Chứng nhận chất lượng", "Nguyên liệu tự nhiên", "Quy trình truyền thống"],
      established: "1920"
    },
    {
      name: "Hợp tác xã mật ong Tây Nguyên",
      region: "Tây Nguyên",
      specialty: "Mật ong nguyên chất",
      description: "Thu hoạch mật ong từ các vườn hoa cà phê và hoa rừng tự nhiên",
      image: "/api/placeholder/300/200",
      features: ["100% tự nhiên", "Không chất bảo quản", "Hương vị đặc trưng"],
      established: "1985"
    },
    {
      name: "Làng nghề bánh trung thu Hà Nội",
      region: "Hà Nội",
      specialty: "Bánh trung thu truyền thống",
      description: "Làng nghề có truyền thống làm bánh trung thu từ thế kỷ 19",
      image: "/api/placeholder/300/200",
      features: ["Công thức gia truyền", "Làm thủ công", "Hương vị cổ truyền"],
      established: "1850"
    },
    {
      name: "Hợp tác xã trà Thái Nguyên",
      region: "Thái Nguyên",
      specialty: "Trà xanh cao cấp",
      description: "Sản xuất trà xanh chất lượng cao từ những đồi chè xanh mướt",
      image: "/api/placeholder/300/200",
      features: ["Trà xanh cao cấp", "Hương vị thơm ngon", "Chất lượng ổn định"],
      established: "1990"
    }
  ];

  const certifications = [
    {
      name: "Chứng nhận ISO 22000",
      description: "Hệ thống quản lý an toàn thực phẩm",
      icon: "🏆"
    },
    {
      name: "Chứng nhận HACCP",
      description: "Phân tích mối nguy và điểm kiểm soát tới hạn",
      icon: "✅"
    },
    {
      name: "Chứng nhận Organic",
      description: "Sản phẩm hữu cơ tự nhiên",
      icon: "🌿"
    },
    {
      name: "Chứng nhận VietGAP",
      description: "Thực hành nông nghiệp tốt Việt Nam",
      icon: "🇻🇳"
    }
  ];

  return (
    <div className="py-16 bg-gradient-to-br from-teal-50 to-green-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Đối Tác & Nhà Cung Cấp
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Hợp tác với các nhà sản xuất uy tín và có truyền thống lâu đời
          </p>
        </div>

        {/* Partners Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {partners.map((partner, index) => (
            <div key={index} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
              <div className="aspect-w-16 aspect-h-9">
                <img
                  src={partner.image}
                  alt={partner.name}
                  className="w-full h-48 object-cover"
                />
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {partner.name}
                  </h3>
                  <span className="text-sm text-green-600 font-medium bg-green-100 px-2 py-1 rounded-full">
                    {partner.established}
                  </span>
                </div>
                <div className="flex items-center mb-3">
                  <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded-full mr-2">
                    {partner.region}
                  </span>
                  <span className="text-sm text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                    {partner.specialty}
                  </span>
                </div>
                <p className="text-gray-600 mb-4 leading-relaxed">
                  {partner.description}
                </p>
                <div className="space-y-2">
                  {partner.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center text-sm text-green-600">
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {feature}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Certifications */}
        <div className="mb-16">
          <h3 className="text-3xl font-bold text-gray-900 text-center mb-8">
            Chứng Nhận Chất Lượng
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {certifications.map((cert, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-lg p-6 text-center hover:shadow-xl transition-shadow duration-300">
                <div className="text-4xl mb-4">{cert.icon}</div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">{cert.name}</h4>
                <p className="text-gray-600 text-sm">{cert.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Partnership Benefits */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h3 className="text-3xl font-bold text-gray-900 text-center mb-8">
            Lợi Ích Hợp Tác
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🤝</span>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Hợp tác lâu dài</h4>
              <p className="text-gray-600">Xây dựng mối quan hệ bền vững với các đối tác</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🌱</span>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Phát triển bền vững</h4>
              <p className="text-gray-600">Hỗ trợ cộng đồng và phát triển bền vững</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⭐</span>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Chất lượng cao</h4>
              <p className="text-gray-600">Đảm bảo chất lượng sản phẩm tốt nhất</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VietnamesePartners;
