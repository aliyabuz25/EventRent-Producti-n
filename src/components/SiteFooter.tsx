import { Link } from 'react-router-dom';
import { Instagram, Linkedin, Mail, Phone, MapPin } from 'lucide-react';
import { useSiteContent } from '../content.context';
import { t } from '../content';

export default function SiteFooter() {
  const { content, locale } = useSiteContent();
  const s = content.footer;

  return (
    <footer className="bg-brand-bg text-white py-20 md:py-24 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-12">
          <div className="md:col-span-6 space-y-7 md:space-y-8">
            <div className="space-y-4">
              <Link to="/" className="flex items-center gap-3 group">
                <div className="flex flex-col">
                  <span className="text-[28px] font-black leading-none tracking-[-0.04em]">
                    <span className="text-white">event</span><span className="text-premium-orange">rent</span>
                  </span>
                  <span className="text-premium-orange text-[10px] font-black tracking-[0.3em] uppercase leading-none">Azerbaijan</span>
                </div>
              </Link>
              <p className="text-xl text-gray-500 font-medium max-w-md leading-relaxed">
                {t(locale, s.tagline)}
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex gap-4">
                <a
                  href={s.instagramHref || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="w-12 h-12 rounded-xl glass flex items-center justify-center hover:bg-premium-orange hover:border-premium-orange transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-premium-orange focus-visible:ring-offset-2 focus-visible:ring-offset-brand-bg"
                >
                  <Instagram aria-hidden="true" className="w-5 h-5 text-gray-400 group-hover:text-white" />
                </a>
                <a
                  href={s.linkedinHref || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                  className="w-12 h-12 rounded-xl glass flex items-center justify-center hover:bg-premium-orange hover:border-premium-orange transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-premium-orange focus-visible:ring-offset-2 focus-visible:ring-offset-brand-bg"
                >
                  <Linkedin aria-hidden="true" className="w-5 h-5 text-gray-400 group-hover:text-white" />
                </a>
              </div>

              <a
                href={s.whatsappHref || 'https://wa.me/994502251515'}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t(locale, s.whatsappCta)}
                className="group block max-w-sm rounded-2xl border border-premium-orange/35 bg-white/[0.03] px-5 py-4 text-white shadow-[0_8px_24px_rgba(0,0,0,0.28)] transition-all hover:border-premium-orange/60 hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-premium-orange focus-visible:ring-offset-2 focus-visible:ring-offset-brand-bg"
              >
                <div className="flex items-center gap-3">
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="w-5 h-5 fill-[#25D366] shrink-0" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.25em] text-premium-orange/80">{t(locale, s.whatsappLine)}</p>
                    <p className="text-sm font-black tracking-wide uppercase">{t(locale, s.whatsappCta)}</p>
                  </div>
                  <span className="ml-auto text-[10px] font-black uppercase tracking-[0.2em] bg-premium-orange text-white px-2.5 py-0.5 rounded-full">{t(locale, s.whatsappBadge)}</span>
                </div>
              </a>
            </div>
          </div>

          <div className="md:col-span-3 space-y-6">
            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500">{t(locale, s.navHeading)}</h4>
            <ul className="space-y-3">
              {s.navLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-gray-400 hover:text-premium-orange transition-all font-bold text-lg rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-premium-orange focus-visible:ring-offset-2 focus-visible:ring-offset-brand-bg"
                  >
                    {t(locale, link.label)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-3 space-y-6">
            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500">{t(locale, s.contactHeading)}</h4>
            <div className="space-y-4">
              <div className="flex items-start gap-4 group">
                <MapPin className="w-6 h-6 text-premium-orange shrink-0" />
                <p className="text-gray-400 font-bold leading-relaxed">
                  {t(locale, content.contact.cta.channelAddressValue)}
                </p>
              </div>
              <div className="flex items-center gap-4 group">
                <Mail className="w-6 h-6 text-premium-orange shrink-0" />
                <p className="text-gray-400 font-bold">{t(locale, content.contact.cta.channelEmailValue)}</p>
              </div>
              <div className="flex items-center gap-4 group">
                <Phone className="w-6 h-6 text-premium-orange shrink-0" />
                <p className="text-gray-400 font-bold">{t(locale, content.contact.cta.channelPhoneValue)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/5 mt-16 md:mt-20 pt-8 md:pt-10 flex flex-col md:flex-row justify-between items-center gap-4 md:gap-6">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-600">{t(locale, s.copyright)}</p>
          <div className="flex gap-6">
            <a href="#" className="text-[10px] font-black uppercase tracking-widest text-gray-600 hover:text-white transition-colors rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-premium-orange focus-visible:ring-offset-2 focus-visible:ring-offset-brand-bg">{t(locale, s.privacyPolicy)}</a>
            <a href="#" className="text-[10px] font-black uppercase tracking-widest text-gray-600 hover:text-white transition-colors rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-premium-orange focus-visible:ring-offset-2 focus-visible:ring-offset-brand-bg">{t(locale, s.termsOfService)}</a>
          </div>
        </div>
      </div>
    </footer>
  );
}