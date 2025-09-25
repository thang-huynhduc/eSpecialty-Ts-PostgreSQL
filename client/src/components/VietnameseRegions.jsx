import React from 'react';
import { useTranslation } from 'react-i18next';

const VietnameseRegions = () => {
  const { t } = useTranslation();

  const regions = [
    {
      id: 1,
      name: "Miền Bắc",
      specialties: ["Bánh cốm", "Chả cá Lã Vọng", "Phở Hà Nội"],
      color: "from-blue-400 to-blue-600",
      icon: "🏔️"
    },
    {
      id: 2,
      name: "Miền Trung",
      specialties: ["Bún bò Huế", "Cao lầu", "Nem lụi"],
      color: "from-green-400 to-green-600",
      icon: "🌊"
    },
    {
      id: 3,
      name: "Miền Nam",
      specialties: ["Bánh xèo", "Cá kho tộ", "Chè ba màu"],
      color: "from-yellow-400 to-orange-600",
      icon: "🌴"
    },
    {
      id: 4,
      name: "Tây Nguyên",
      specialties: ["Cà phê", "Mật ong", "Rượu cần"],
      color: "from-purple-400 to-pink-600",
      icon: "☕"
    }
  ];

  return (
    <div className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Đặc Sản Theo Vùng Miền
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Khám phá hương vị đặc trưng của từng vùng miền Việt Nam
          </p>
        </div>

        {/* Regions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {regions.map((region) => (
            <div key={region.id} className="group">
              <div className={`bg-gradient-to-br ${region.color} rounded-2xl p-8 text-white text-center hover:scale-105 transition-transform duration-300`}>
                <div className="text-4xl mb-4">{region.icon}</div>
                <h3 className="text-2xl font-bold mb-4">{region.name}</h3>
                <div className="space-y-2">
                  {region.specialties.map((specialty, index) => (
                    <div key={index} className="text-sm opacity-90">
                      {specialty}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Info */}
        <div className="mt-16 text-center">
          <div className="bg-gray-50 rounded-2xl p-8 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Tại sao chọn đặc sản Việt Nam?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🌿</span>
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Nguyên liệu tự nhiên</h4>
                <p className="text-gray-600">Sử dụng nguyên liệu tươi ngon từ thiên nhiên</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">👨‍🍳</span>
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Công thức truyền thống</h4>
                <p className="text-gray-600">Được chế biến theo phương pháp cổ truyền</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">⭐</span>
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Chất lượng cao</h4>
                <p className="text-gray-600">Đảm bảo chất lượng và hương vị đặc trưng</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VietnameseRegions;
