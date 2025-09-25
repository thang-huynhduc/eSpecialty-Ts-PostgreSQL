import React from 'react';
import { useTranslation } from 'react-i18next';

const VietnameseSpecialtyInfo = () => {
  const { t } = useTranslation();

  const specialties = [
    {
      id: 1,
      name: "Nước Mắm Phú Quốc",
      region: "Phú Quốc, Kiên Giang",
      description: "Được ủ từ cá cơm tươi ngon trong thùng gỗ bạch đàn, có hương vị đậm đà đặc trưng",
      image: "/api/placeholder/300/200",
      features: ["Nguyên liệu tự nhiên", "Quy trình truyền thống", "Hương vị đậm đà"]
    },
    {
      id: 2,
      name: "Mật Ong Tây Nguyên",
      region: "Tây Nguyên",
      description: "Thu hoạch từ các vườn hoa cà phê và hoa rừng tự nhiên, giàu dinh dưỡng",
      image: "/api/placeholder/300/200",
      features: ["100% tự nhiên", "Giàu dinh dưỡng", "Hương vị đặc trưng"]
    },
    {
      id: 3,
      name: "Bánh Trung Thu Truyền Thống",
      region: "Hà Nội, TP.HCM",
      description: "Được làm thủ công theo công thức gia truyền, hương vị đậm đà và ý nghĩa sâu sắc",
      image: "/api/placeholder/300/200",
      features: ["Công thức gia truyền", "Làm thủ công", "Hương vị cổ truyền"]
    }
  ];

  return (
    <div className="py-16 bg-gradient-to-br from-red-50 to-yellow-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            {t('about.videoTitle')}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {t('about.heading')}
          </p>
        </div>

        {/* Specialties Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {specialties.map((specialty) => (
            <div key={specialty.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
              <div className="aspect-w-16 aspect-h-9">
                <img
                  src={specialty.image}
                  alt={specialty.name}
                  className="w-full h-48 object-cover"
                />
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {specialty.name}
                  </h3>
                  <span className="text-sm text-red-600 font-medium bg-red-100 px-2 py-1 rounded-full">
                    {specialty.region}
                  </span>
                </div>
                <p className="text-gray-600 mb-4 leading-relaxed">
                  {specialty.description}
                </p>
                <div className="space-y-2">
                  {specialty.features.map((feature, index) => (
                    <div key={index} className="flex items-center text-sm text-green-600">
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

        {/* Call to Action */}
        <div className="text-center mt-16">
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Khám phá thêm đặc sản Việt Nam
            </h3>
            <p className="text-gray-600 mb-6">
              Hàng trăm đặc sản từ khắp mọi vùng miền đang chờ bạn khám phá
            </p>
            <button className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-300">
              Xem tất cả đặc sản
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VietnameseSpecialtyInfo;
