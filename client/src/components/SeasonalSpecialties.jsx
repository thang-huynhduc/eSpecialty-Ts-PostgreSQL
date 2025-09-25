import React from 'react';
import { useTranslation } from 'react-i18next';

const SeasonalSpecialties = () => {
  const { t } = useTranslation();

  const seasons = [
    {
      name: "Mùa Xuân",
      period: "Tháng 1 - 3",
      description: "Mùa của những món ăn thanh đạm và rau củ tươi ngon",
      color: "from-green-400 to-green-600",
      icon: "🌸",
      specialties: [
        { name: "Bánh chưng", description: "Bánh truyền thống dịp Tết" },
        { name: "Nem rán", description: "Nem chiên giòn thơm" },
        { name: "Chả cá", description: "Chả cá thơm ngon" }
      ]
    },
    {
      name: "Mùa Hạ",
      period: "Tháng 4 - 6",
      description: "Mùa của những món ăn mát lạnh và giải nhiệt",
      color: "from-yellow-400 to-orange-600",
      icon: "☀️",
      specialties: [
        { name: "Chè đậu đỏ", description: "Chè ngọt mát giải nhiệt" },
        { name: "Bún chả", description: "Bún với chả nướng thơm" },
        { name: "Gỏi cuốn", description: "Gỏi cuốn tươi mát" }
      ]
    },
    {
      name: "Mùa Thu",
      period: "Tháng 7 - 9",
      description: "Mùa của những món ăn bổ dưỡng và ấm áp",
      color: "from-orange-400 to-red-600",
      icon: "🍂",
      specialties: [
        { name: "Bánh trung thu", description: "Bánh truyền thống dịp Trung Thu" },
        { name: "Cá kho tộ", description: "Cá kho đậm đà" },
        { name: "Canh chua", description: "Canh chua thanh mát" }
      ]
    },
    {
      name: "Mùa Đông",
      period: "Tháng 10 - 12",
      description: "Mùa của những món ăn ấm nóng và bổ dưỡng",
      color: "from-blue-400 to-purple-600",
      icon: "❄️",
      specialties: [
        { name: "Phở bò", description: "Phở bò nóng hổi" },
        { name: "Bún bò Huế", description: "Bún bò cay nồng" },
        { name: "Lẩu", description: "Lẩu nóng ấm" }
      ]
    }
  ];

  return (
    <div className="py-16 bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Đặc Sản Theo Mùa
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Khám phá hương vị đặc trưng của từng mùa trong năm
          </p>
        </div>

        {/* Seasons Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {seasons.map((season, index) => (
            <div key={index} className="group">
              <div className={`bg-gradient-to-br ${season.color} rounded-2xl p-6 text-white hover:scale-105 transition-transform duration-300`}>
                {/* Season Header */}
                <div className="text-center mb-6">
                  <div className="text-4xl mb-3">{season.icon}</div>
                  <h3 className="text-2xl font-bold mb-2">{season.name}</h3>
                  <p className="text-sm opacity-90">{season.period}</p>
                </div>

                {/* Description */}
                <p className="text-sm opacity-90 mb-6 leading-relaxed">
                  {season.description}
                </p>

                {/* Specialties */}
                <div className="space-y-3">
                  <h4 className="text-lg font-semibold">Đặc sản:</h4>
                  {season.specialties.map((specialty, specIndex) => (
                    <div key={specIndex} className="bg-white bg-opacity-20 rounded-lg p-3">
                      <div className="font-medium text-sm">{specialty.name}</div>
                      <div className="text-xs opacity-80 mt-1">{specialty.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Seasonal Tips */}
        <div className="mt-16">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h3 className="text-3xl font-bold text-gray-900 text-center mb-8">
              Mẹo Chọn Đặc Sản Theo Mùa
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🌱</span>
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Mùa Xuân</h4>
                <p className="text-gray-600">Chọn các món ăn thanh đạm, nhiều rau củ tươi</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🌞</span>
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Mùa Hạ</h4>
                <p className="text-gray-600">Ưu tiên các món ăn mát lạnh, giải nhiệt</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🍂</span>
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Mùa Thu</h4>
                <p className="text-gray-600">Chọn các món ăn bổ dưỡng, ấm áp</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeasonalSpecialties;
