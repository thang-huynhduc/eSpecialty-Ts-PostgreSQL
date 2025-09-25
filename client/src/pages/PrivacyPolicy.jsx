import React from 'react';
import { Shield, Lock, Eye, Users, FileText, Mail, Clock, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const PrivacyPolicy = () => {
  const { t } = useTranslation();

  const sections = [
    {
      id: 'collection',
      title: t('privacy.sections.collection.title'),
      icon: <FileText className="w-6 h-6" />,
      content: t('privacy.sections.collection.items', { returnObjects: true })
    },
    {
      id: 'dataTypes',
      title: t('privacy.sections.dataTypes.title'),
      icon: <Users className="w-6 h-6" />,
      content: t('privacy.sections.dataTypes.items', { returnObjects: true })
    },
    {
      id: 'usage',
      title: t('privacy.sections.usage.title'),
      icon: <Eye className="w-6 h-6" />,
      content: t('privacy.sections.usage.items', { returnObjects: true })
    },
    {
      id: 'storage',
      title: t('privacy.sections.storage.title'),
      icon: <Clock className="w-6 h-6" />,
      content: t('privacy.sections.storage.items', { returnObjects: true })
    },
    {
      id: 'access',
      title: t('privacy.sections.access.title'),
      icon: <AlertTriangle className="w-6 h-6" />,
      content: t('privacy.sections.access.items', { returnObjects: true })
    }
  ];

  const rights = [
    {
      id: 'access',
      title: t('privacy.rights.access.title'),
      content: t('privacy.rights.access.content'),
      color: 'green'
    },
    {
      id: 'recovery',
      title: t('privacy.rights.recovery.title'),
      content: t('privacy.rights.recovery.content'),
      color: 'blue'
    },
    {
      id: 'deletion',
      title: t('privacy.rights.deletion.title'),
      content: t('privacy.rights.deletion.content'),
      color: 'red'
    },
    {
      id: 'processing',
      title: t('privacy.rights.processing.title'),
      content: t('privacy.rights.processing.content'),
      color: 'yellow'
    }
  ];

  const getColorClasses = (color) => {
    const colors = {
      green: {
        bg: 'bg-green-50',
        border: 'border-green-200',
        text: 'text-green-700',
        title: 'text-green-800'
      },
      blue: {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-700',
        title: 'text-blue-800'
      },
      red: {
        bg: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-700',
        title: 'text-red-800'
      },
      yellow: {
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        text: 'text-yellow-700',
        title: 'text-yellow-800'
      }
    };
    return colors[color] || colors.green;
  };

  // Hàm để render HTML content an toàn
  const renderHTML = (htmlString) => {
    return { __html: htmlString };
  };

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
              {t('privacy.title')}
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              {t('privacy.subtitle')}
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
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {t('privacy.introduction.title')}
              </h2>
              <p 
                className="text-gray-700 leading-relaxed"
                dangerouslySetInnerHTML={renderHTML(t('privacy.introduction.content'))}
              />
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
                  {Array.isArray(section.content) && section.content.map((item, itemIndex) => (
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
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                {t('privacy.rights.title')}
              </h3>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {rights.map((right) => {
              const colorClasses = getColorClasses(right.color);
              return (
                <div 
                  key={right.id}
                  className={`${colorClasses.bg} p-6 rounded-lg border ${colorClasses.border}`}
                >
                  <h4 className={`font-semibold ${colorClasses.title} mb-3`}>
                    {right.title}
                  </h4>
                  <p className={`${colorClasses.text} text-sm`}>
                    {right.content}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Company Info */}
        <div className="bg-gradient-to-r from-gray-900 to-blue-900 text-white rounded-2xl shadow-lg p-8 mt-8">
          <div className="flex items-start space-x-4 mb-6">
            <div className="bg-white/20 p-2 rounded-lg flex-shrink-0">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-4">
                {t('privacy.contact.title')}
              </h3>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h4 className="font-semibold mb-3 text-blue-200">
                {t('privacy.contact.company')}
              </h4>
              <div className="space-y-2 text-gray-300">
                <p><strong>{t('privacy.contact.info.businessLicense')}:</strong> 0316713818</p>
                <p><strong>{t('privacy.contact.info.issuedBy')}:</strong> Sở KH&ĐT TP.HCM</p>
                <p><strong>{t('privacy.contact.info.issueDate')}:</strong> 09/02/2021</p>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3 text-blue-200">
                {t('privacy.contact.info.address')}
              </h4>
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
            <h3 className="text-2xl font-bold text-green-800 mb-4">
              {t('privacy.commitment.title')}
            </h3>
            <div className="max-w-3xl mx-auto">
              <p 
                className="text-green-700 leading-relaxed mb-4"
                dangerouslySetInnerHTML={renderHTML(t('privacy.commitment.content'))}
              />
              <p className="text-green-700 leading-relaxed">
                {t('privacy.commitment.additional')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;