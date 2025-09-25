import React from 'react';
import { useTranslation } from 'react-i18next';

const VietnameseCulturalEvents = () => {
  const { t } = useTranslation();

  const events = [
    {
      name: "Lễ hội Tết Nguyên Đán",
      period: "Tháng 1-2",
      description: "Lễ hội lớn nhất trong năm với nhiều hoạt động văn hóa và ẩm thực",
      image: "/api/placeholder/400/300",
      activities: [
        "Trưng bày đặc sản Tết",
        "Hướng dẫn làm bánh chưng",
        "Thi nấu ăn truyền thống"
      ],
      specialties: ["Bánh chưng", "Bánh tét", "Thịt kho", "Dưa hành"],
      color: "from-red-400 to-red-600"
    },
    {
      name: "Lễ hội Trung Thu",
      period: "Tháng 8-9",
      description: "Lễ hội dành cho trẻ em với bánh trung thu và đèn lồng",
      image: "/api/placeholder/400/300",
      activities: [
        "Làm bánh trung thu",
        "Thi đèn lồng",
        "Biểu diễn múa lân"
      ],
      specialties: ["Bánh trung thu", "Trà", "Hạt dưa", "Bánh dẻo"],
      color: "from-yellow-400 to-orange-600"
    },
    {
      name: "Lễ hội ẩm thực",
      period: "Tháng 10-11",
      description: "Lễ hội tôn vinh ẩm thực truyền thống Việt Nam",
      image: "/api/placeholder/400/300",
      activities: [
        "Triển lãm ẩm thực",
        "Hội thi nấu ăn",
        "Giao lưu văn hóa"
      ],
      specialties: ["Phở", "Bún bò", "Bánh xèo", "Chả cá"],
      color: "from-green-400 to-green-600"
    },
    {
      name: "Lễ hội cà phê",
      period: "Tháng 12",
      description: "Lễ hội tôn vinh cà phê Tây Nguyên",
      image: "/api/placeholder/400/300",
      activities: [
        "Thưởng thức cà phê",
        "Hướng dẫn pha chế",
        "Triển lãm cà phê"
      ],
      specialties: ["Cà phê đen", "Cà phê sữa", "Cà phê trứng", "Cà phê dừa"],
      color: "from-brown-400 to-brown-600"
    }
  ];

  const culturalActivities = [
    {
      name: "Hướng dẫn nấu ăn",
      description: "Học cách nấu các món ăn truyền thống",
      icon: "👨‍🍳",
      color: "from-orange-400 to-orange-600"
    },
    {
      name: "Tham quan làng nghề",
      description: "Khám phá các làng nghề truyền thống",
      icon: "🏘️",
      color: "from-blue-400 to-blue-600"
    },
    {
      name: "Trải nghiệm văn hóa",
      description: "Tham gia các hoạt động văn hóa địa phương",
      icon: "🎭",
      color: "from-purple-400 to-purple-600"
    },
    {
      name: "Thưởng thức đặc sản",
      description: "Nếm thử các đặc sản địa phương",
      icon: "🍽️",
      color: "from-green-400 to-green-600"
    }
  ];

  return (
    <div className="py-16 bg-gradient-to-br from-indigo-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Sự Kiện & Hoạt Động Văn Hóa
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Tham gia các sự kiện và hoạt động văn hóa đặc sắc
          </p>
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {events.map((event, index) => (
            <div key={index} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
              <div className="aspect-w-16 aspect-h-9">
                <img
                  src={event.image}
                  alt={event.name}
                  className="w-full h-48 object-cover"
                />
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {event.name}
                  </h3>
                  <span className="text-sm text-blue-600 font-medium bg-blue-100 px-2 py-1 rounded-full">
                    {event.period}
                  </span>
                </div>
                <p className="text-gray-600 mb-4 leading-relaxed">
                  {event.description}
                </p>
                
                {/* Activities */}
                <div className="mb-4">
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Hoạt động:</h4>
                  <div className="space-y-1">
                    {event.activities.map((activity, activityIndex) => (
                      <div key={activityIndex} className="flex items-center text-sm text-green-600">
                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        {activity}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Specialties */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Đặc sản:</h4>
                  <div className="flex flex-wrap gap-2">
                    {event.specialties.map((specialty, specialtyIndex) => (
                      <span key={specialtyIndex} className="bg-red-100 text-red-800 text-sm px-3 py-1 rounded-full">
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Cultural Activities */}
        <div className="mb-16">
          <h3 className="text-3xl font-bold text-gray-900 text-center mb-8">
            Hoạt Động Văn Hóa
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {culturalActivities.map((activity, index) => (
              <div key={index} className="group">
                <div className={`bg-gradient-to-br ${activity.color} rounded-2xl p-6 text-white text-center hover:scale-105 transition-transform duration-300`}>
                  <div className="text-4xl mb-4">{activity.icon}</div>
                  <h4 className="text-xl font-bold mb-3">{activity.name}</h4>
                  <p className="text-sm opacity-90 leading-relaxed">{activity.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Event Benefits */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h3 className="text-3xl font-bold text-gray-900 text-center mb-8">
            Lợi Ích Tham Gia
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎓</span>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Học hỏi kinh nghiệm</h4>
              <p className="text-gray-600">Học cách nấu ăn và chế biến đặc sản</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🤝</span>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Giao lưu cộng đồng</h4>
              <p className="text-gray-600">Kết nối với những người yêu ẩm thực</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎉</span>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Trải nghiệm thú vị</h4>
              <p className="text-gray-600">Tham gia các hoạt động vui nhộn</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VietnameseCulturalEvents;
