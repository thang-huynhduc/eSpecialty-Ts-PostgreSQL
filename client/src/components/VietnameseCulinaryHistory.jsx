import React from 'react';
import { useTranslation } from 'react-i18next';

const VietnameseCulinaryHistory = () => {
  const { t } = useTranslation();

  const historyItems = [
    {
      period: "Thời kỳ cổ đại",
      description: "Ẩm thực Việt Nam bắt đầu với việc sử dụng gạo, cá và rau củ từ thiên nhiên",
      image: "/api/placeholder/400/300",
      specialties: ["Cơm", "Cá kho", "Rau muống"]
    },
    {
      period: "Thời kỳ phong kiến",
      description: "Ảnh hưởng của Trung Hoa và các nước láng giềng làm phong phú thêm ẩm thực",
      image: "/api/placeholder/400/300",
      specialties: ["Bánh chưng", "Nem", "Chả cá"]
    },
    {
      period: "Thời kỳ hiện đại",
      description: "Kết hợp hài hòa giữa truyền thống và hiện đại, tạo nên hương vị độc đáo",
      image: "/api/placeholder/400/300",
      specialties: ["Phở", "Bún bò", "Bánh mì"]
    }
  ];

  return (
    <div className="py-16 bg-gradient-to-r from-orange-50 to-red-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Lịch Sử Ẩm Thực Việt Nam
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Hành trình phát triển của ẩm thực Việt Nam qua các thời kỳ
          </p>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-red-300"></div>
          
          {/* Timeline items */}
          <div className="space-y-16">
            {historyItems.map((item, index) => (
              <div key={index} className={`flex items-center ${index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}>
                {/* Content */}
                <div className={`w-1/2 ${index % 2 === 0 ? 'pr-8 text-right' : 'pl-8 text-left'}`}>
                  <div className="bg-white rounded-2xl shadow-lg p-6">
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">{item.period}</h3>
                    <p className="text-gray-600 mb-4 leading-relaxed">{item.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {item.specialties.map((specialty, specIndex) => (
                        <span key={specIndex} className="bg-red-100 text-red-800 text-sm px-3 py-1 rounded-full">
                          {specialty}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Image */}
                <div className="w-1/2 flex justify-center">
                  <div className="relative">
                    <img
                      src={item.image}
                      alt={item.period}
                      className="w-64 h-48 object-cover rounded-2xl shadow-lg"
                    />
                    <div className="absolute -bottom-4 -right-4 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">{index + 1}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cultural Values */}
        <div className="mt-20">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h3 className="text-3xl font-bold text-gray-900 text-center mb-8">
              Giá Trị Văn Hóa Ẩm Thực
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">👨‍👩‍👧‍👦</span>
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Gia đình</h4>
                <p className="text-gray-600">Ẩm thực gắn kết các thành viên trong gia đình</p>
              </div>
              <div className="text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🌱</span>
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Tự nhiên</h4>
                <p className="text-gray-600">Tôn trọng và sử dụng nguyên liệu từ thiên nhiên</p>
              </div>
              <div className="text-center">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🤝</span>
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Cộng đồng</h4>
                <p className="text-gray-600">Chia sẻ và kết nối cộng đồng qua ẩm thực</p>
              </div>
              <div className="text-center">
                <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🎭</span>
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Truyền thống</h4>
                <p className="text-gray-600">Bảo tồn và phát huy giá trị truyền thống</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VietnameseCulinaryHistory;
