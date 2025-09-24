import React from 'react';
import { Shield, Lock, Eye, Users, FileText, Mail, Clock, AlertTriangle } from 'lucide-react';

const PrivacyPolicy = () => {
  const sections = [
    {
      id: 'collection',
      title: 'Mục đích và phạm vi thu thập',
      icon: <FileText className="w-6 h-6" />,
      content: [
        'Khi bạn đăng ký/truy cập và/hoặc sử dụng Website của chúng tôi',
        'Khi bạn gửi bất kỳ biểu mẫu nào, bao gồm đơn đăng ký hoặc các mẫu đơn khác',
        'Khi bạn ký kết bất kỳ thỏa thuận nào hoặc cung cấp các tài liệu',
        'Khi bạn tương tác với chúng tôi qua điện thoại, email, hoặc mạng xã hội',
        'Khi bạn sử dụng các dịch vụ điện tử hoặc thực hiện giao dịch'
      ]
    },
    {
      id: 'data-types',
      title: 'Dữ liệu cá nhân thu thập',
      icon: <Users className="w-6 h-6" />,
      content: [
        'Họ tên và giới tính',
        'Ngày tháng năm sinh',
        'Địa chỉ thanh toán và giao hàng',
        'Thông tin tài khoản ngân hàng và thanh toán',
        'Số điện thoại và địa chỉ email',
        'Thông tin thiết bị và cách sử dụng dịch vụ'
      ]
    },
    {
      id: 'usage',
      title: 'Phạm vi sử dụng thông tin',
      icon: <Eye className="w-6 h-6" />,
      content: [
        'Cung cấp các dịch vụ đến thành viên',
        'Gửi thông báo về hoạt động trao đổi thông tin',
        'Ngăn ngừa các hoạt động phá hủy tài khoản hoặc giả mạo',
        'Liên lạc và giải quyết trong trường hợp đặc biệt',
        'Xác nhận và liên hệ với các bên liên quan đến giao dịch',
        'Tuân thủ yêu cầu của cơ quan pháp luật khi cần thiết'
      ]
    },
    {
      id: 'storage',
      title: 'Thời gian lưu trữ thông tin',
      icon: <Clock className="w-6 h-6" />,
      content: [
        'Dữ liệu cá nhân sẽ được lưu trữ cho đến khi có yêu cầu hủy bỏ từ thành viên',
        'Thành viên có thể đăng nhập và thực hiện hủy bỏ tài khoản bất kỳ lúc nào',
        'Dữ liệu được lưu trữ và bảo mật trên máy chủ của eSpecialty'
      ]
    },
    {
      id: 'access',
      title: 'Đối tượng được tiếp cận thông tin',
      icon: <AlertTriangle className="w-6 h-6" />,
      content: [
        'Công Ty TNHH eSpecialty',
        'Cơ quan nhà nước khi có yêu cầu phục vụ điều tra'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <Shield className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Chính Sách Bảo Mật Thông Tin Cá Nhân
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Chúng tôi cam kết bảo vệ quyền riêng tư và thông tin cá nhân của bạn. 
              Tài liệu này giải thích cách chúng tôi thu thập, sử dụng và bảo vệ dữ liệu của bạn.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Introduction */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-gray-100">
          <div className="flex items-start space-x-4">
            <div className="bg-green-100 p-2 rounded-lg flex-shrink-0">
              <Lock className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Giới thiệu</h2>
              <p className="text-gray-700 leading-relaxed">
                Chúng tôi, <strong>Công Ty TNHH eSpecialty</strong>, mong muốn đem đến cho thành viên và tất cả 
                người dùng truy cập vào trang thương mại điện tử <strong>eSpecialty.vn</strong> một trải nghiệm 
                thoải mái và tốt nhất. Chính sách này tuân thủ đầy đủ các quy định của pháp luật Việt Nam 
                về bảo vệ dữ liệu cá nhân.
              </p>
            </div>
          </div>
        </div>

        {/* Main Sections */}
        <div className="space-y-8">
          {sections.map((section, index) => (
            <div key={section.id} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    {section.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">{section.title}</h3>
                </div>
              </div>
              <div className="p-6">
                <ul className="space-y-3">
                  {section.content.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-gray-700 leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* User Rights */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mt-8 border border-gray-100">
          <div className="flex items-start space-x-4 mb-6">
            <div className="bg-purple-100 p-2 rounded-lg flex-shrink-0">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Quyền của thành viên</h3>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-green-50 p-6 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-800 mb-3">Quyền truy cập và chỉnh sửa</h4>
              <p className="text-green-700 text-sm">
                Bạn có quyền tự kiểm tra, cập nhật, điều chỉnh thông tin cá nhân bằng cách 
                đăng nhập vào tài khoản và chỉnh sửa thông tin.
              </p>
            </div>
            
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-3">Quyền khôi phục tài khoản</h4>
              <p className="text-blue-700 text-sm">
                Bạn có thể gửi yêu cầu khôi phục tài khoản do quên mật khẩu qua email 
                cskh@especialty.vn.
              </p>
            </div>
            
            <div className="bg-red-50 p-6 rounded-lg border border-red-200">
              <h4 className="font-semibold text-red-800 mb-3">Quyền xóa tài khoản</h4>
              <p className="text-red-700 text-sm">
                Bạn có quyền yêu cầu hủy bỏ thông tin cá nhân bằng nút "Yêu cầu xóa tài khoản" 
                trong trang Tài khoản.
              </p>
            </div>
            
            <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
              <h4 className="font-semibold text-yellow-800 mb-3">Xử lý yêu cầu</h4>
              <p className="text-yellow-700 text-sm">
                Ban quản trị sẽ liên hệ xác nhận và xử lý yêu cầu của bạn trong 24 giờ làm việc.
              </p>
            </div>
          </div>
        </div>

        {/* Company Info */}
        <div className="bg-gradient-to-r from-gray-900 to-blue-900 text-white rounded-2xl shadow-lg p-8 mt-8">
          <div className="flex items-start space-x-4 mb-6">
            <div className="bg-white/20 p-2 rounded-lg flex-shrink-0">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-4">Thông tin liên hệ</h3>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h4 className="font-semibold mb-3 text-blue-200">Công ty TNHH eSpecialty</h4>
              <div className="space-y-2 text-gray-300">
                <p><strong>GPDKKD:</strong> 0316713818</p>
                <p><strong>Cấp bởi:</strong> Sở KH&ĐT TP.HCM</p>
                <p><strong>Ngày cấp:</strong> 09/02/2021</p>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3 text-blue-200">Địa chỉ & Liên hệ</h4>
              <div className="space-y-2 text-gray-300 text-sm">
                <p>G-12A17, tầng 12, The Manor Officetel</p>
                <p>Số 89 Nguyễn Hữu Cảnh, P.22, Q.Bình Thạnh</p>
                <p>TP. Hồ Chí Minh</p>
                <p><strong>Email:</strong> support@especialty.vn</p>
              </div>
            </div>
          </div>
        </div>

        {/* Security Commitment */}
        <div className="bg-green-50 rounded-2xl border-2 border-green-200 p-8 mt-8">
          <div className="text-center">
            <div className="bg-green-100 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Shield className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-green-800 mb-4">Cam kết bảo mật</h3>
            <div className="max-w-3xl mx-auto">
              <p className="text-green-700 leading-relaxed mb-4">
                Thông tin cá nhân của bạn được <strong>cam kết bảo mật tuyệt đối</strong>. 
                Chúng tôi không sử dụng, chuyển giao hay tiết lộ thông tin cho bên thứ ba 
                khi không có sự đồng ý từ bạn.
              </p>
              <p className="text-green-700 leading-relaxed">
                Mọi thông tin giao dịch trực tuyến được bảo mật tại khu vực dữ liệu trung tâm 
                an toàn cấp 1 của eSpecialty.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;