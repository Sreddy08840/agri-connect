import { Mail, MapPin, Globe, Facebook, MessageCircle, Phone } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t } = useTranslation();
  
  return (
    <footer className="bg-[#111] text-gray-300 mt-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-8 w-8 rounded bg-green-600 flex items-center justify-center text-white font-bold">AC</div>
              <span className="text-lg font-semibold text-white">Agri Connect</span>
            </div>
            <p className="text-sm text-gray-400 leading-6">
              {t('footer.tagline')}
            </p>
            <div className="flex items-center gap-3 mt-4">
              <a href="#" className="p-2 bg-[#1c1c1c] rounded hover:bg-[#222]"><Facebook className="h-4 w-4"/></a>
              <a href="#" className="p-2 bg-[#1c1c1c] rounded hover:bg-[#222]"><MessageCircle className="h-4 w-4"/></a>
              <a href="#" className="p-2 bg-[#1c1c1c] rounded hover:bg-[#222]"><Phone className="h-4 w-4"/></a>
            </div>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-3">{t('footer.support')}</h3>
            <ul className="space-y-2 text-sm">
              <li><a className="hover:text-white" href="/support/help-center">{t('footer.helpCenter')}</a></li>
              <li><a className="hover:text-white" href="/support/privacy-policy">{t('footer.privacyPolicy')}</a></li>
              <li><a className="hover:text-white" href="/support/terms-conditions">{t('footer.termsConditions')}</a></li>
              <li><a className="hover:text-white" href="/support/faq">{t('footer.faq')}</a></li>
              <li><a className="hover:text-white" href="/support/contact">{t('footer.contactSupport')}</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-3">{t('footer.contactInfo')}</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2"><Mail className="h-4 w-4"/> tech.agriconnect@gmail.com</li>
              <li className="flex items-center gap-2"><MapPin className="h-4 w-4"/> {t('footer.location')}</li>
              <li className="flex items-center gap-2"><Globe className="h-4 w-4"/> हिंदी / ಕನ್ನಡ / English</li>
            </ul>
          </div>
        </div>

        <hr className="my-6 border-gray-800" />
        <div className="flex flex-col md:flex-row items-center justify-between text-xs text-gray-500">
          <span>{t('footer.copyright')}</span>
          <span className="mt-2 md:mt-0">{t('footer.empoweringFarmers')}</span>
        </div>
      </div>
    </footer>
  );
}
