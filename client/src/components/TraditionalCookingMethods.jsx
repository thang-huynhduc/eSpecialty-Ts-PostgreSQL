import React from 'react';
import { useTranslation } from 'react-i18next';

const TraditionalCookingMethods = () => {
  const { t } = useTranslation();

  const methods = [
    {
      name: "Kho",
      description: "Phương pháp nấu chậm với nước mắm và gia vị",
      icon: "🍲",
      color: "from-red-400 to-red-600",
      examples: ["Cá kho tộ", "Thịt kho", "Cà kho"],
      benefits: ["Hương vị đậm đà", "Thịt mềm", "Nước kho thơm"]
    },
    {
      name: "Nướng",
      description: "Nướng trên than hoặc lò nướng truyền thống",
      icon: "🔥",
      color: "from-orange-400 to-orange-600",
      examples: ["Chả cá nướng", "Thịt nướng", "Bánh tráng nướng"],
      benefits: ["Hương vị thơm", "Giòn bên ngoài", "Mềm bên trong"]
    },
    {
      name: "Luộc",
      description: "Luộc trong nước sôi với gia vị",
      icon: "🥘",
      color: "from-blue-400 to-blue-600",
      examples: ["Thịt luộc", "Cá luộc", "Rau luộc"],
      benefits: ["Giữ nguyên hương vị", "Tươi ngon", "Dễ tiêu hóa"]
    },
    {
      name: "Xào",
      description: "Xào nhanh với dầu và gia vị",
      icon: "🍳",
      color: "from-green-400 to-green-600",
      examples: ["Rau muống xào", "Thịt xào", "Mì xào"],
      benefits: ["Nhanh chóng", "Giòn", "Thơm ngon"]
    }
  ];

  return (
    <div className="py-16 bg-gradient-to-r from-yellow-50 to-orange-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Phương Pháp Chế Biến Truyền Thống
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Khám phá các phương pháp nấu ăn truyền thống của Việt Nam
          </p>
        </div>

        {/* Methods Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {methods.map((method, index) => (
            <div key={index} className="group">
              <div className={`bg-gradient-to-br ${method.color} rounded-2xl p-6 text-white hover:scale-105 transition-transform duration-300`}>
                {/* Method Header */}
                <div className="text-center mb-6">
                  <div className="text-4xl mb-3">{method.icon}</div>
                  <h3 className="text-2xl font-bold mb-2">{method.name}</h3>
                </div>

                {/* Description */}
                <p className="text-sm opacity-90 mb-6 leading-relaxed">
                  {method.description}
                </p>

                {/* Examples */}
                <div className="mb-6">
                  <h4 className="text-lg font-semibold mb-3">Ví dụ:</h4>
                  <div className="space-y-2">
                    {method.examples.map((example, exampleIndex) => (
                      <div key={exampleIndex} className="bg-white bg-opacity-20 rounded-lg p-2 text-sm">
                        {example}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Benefits */}
                <div>
                  <h4 className="text-lg font-semibold mb-3">Ưu điểm:</h4>
                  <div className="space-y-2">
                    {method.benefits.map((benefit, benefitIndex) => (
                      <div key={benefitIndex} className="flex items-center text-sm">
                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
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

        {/* Traditional Tips */}
        <div className="mt-16">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h3 className="text-3xl font-bold text-gray-900 text-center mb-8">
              Bí Quyết Nấu Ăn Truyền Thống
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">👨‍🍳</span>
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Kinh nghiệm</h4>
                <p className="text-gray-600">Truyền từ đời này sang đời khác</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🌿</span>
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Nguyên liệu</h4>
                <p className="text-gray-600">Sử dụng nguyên liệu tươi ngon nhất</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">⏰</span>
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Thời gian</h4>
                <p className="text-gray-600">Nấu chậm để hương vị thấm đều</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TraditionalCookingMethods;
