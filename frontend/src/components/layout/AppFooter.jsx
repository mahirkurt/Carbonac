/**
 * AppFooter Component
 * 
 * Application footer with company info, links, and copyright.
 * Cureonics LLC, Wyoming, USA
 */

import React from 'react';
import {
  Grid,
  Column,
  Link,
} from '@carbon/react';

import {
  LogoGithub,
  LogoTwitter,
  LogoLinkedin,
  Email,
  Document,
  Policy,
  Help,
} from '@carbon/icons-react';

import './AppFooter.scss';

export function AppFooter({ withGradient = false }) {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    product: [
      { label: 'Özellikler', href: '/features' },
      { label: 'Fiyatlandırma', href: '/pricing' },
      { label: 'Şablonlar', href: '/templates' },
      { label: 'API', href: '/api-docs' },
    ],
    resources: [
      { label: 'Dokümantasyon', href: '/docs' },
      { label: 'Blog', href: '/blog' },
      { label: 'Yardım Merkezi', href: '/help' },
      { label: 'Durum', href: 'https://status.carbonac.com' },
    ],
    company: [
      { label: 'Hakkımızda', href: '/about' },
      { label: 'Kariyer', href: '/careers' },
      { label: 'İletişim', href: '/contact' },
      { label: 'Basın', href: '/press' },
    ],
    legal: [
      { label: 'Gizlilik Politikası', href: '/privacy' },
      { label: 'Kullanım Koşulları', href: '/terms' },
      { label: 'KVKK', href: '/kvkk' },
      { label: 'Çerez Politikası', href: '/cookies' },
    ],
  };

  const socialLinks = [
    { icon: LogoGithub, href: 'https://github.com/cureonics', label: 'GitHub' },
    { icon: LogoTwitter, href: 'https://twitter.com/cureonics', label: 'Twitter' },
    { icon: LogoLinkedin, href: 'https://linkedin.com/company/cureonics', label: 'LinkedIn' },
    { icon: Email, href: 'mailto:hello@cureonics.com', label: 'Email' },
  ];

  return (
    <footer className={`app-footer${withGradient ? ' app-footer--gradient' : ''}`}>
      <div className="app-footer__main">
        <Grid>
          {/* Company Info */}
          <Column lg={4} md={4} sm={4} className="app-footer__brand">
            <img
              src="/logos/Carbonac-Color-Wide.png"
              alt="Carbonac"
              className="app-footer__logo"
            />
            <p className="app-footer__description">
              Markdown'dan profesyonel PDF'ler oluşturun. 
              IBM Carbon Design System ile güçlendirilmiş modern doküman dönüştürücü.
            </p>
            <div className="app-footer__company">
              <p><strong>Cureonics LLC</strong></p>
              <p>Wyoming, USA</p>
            </div>
          </Column>

          {/* Product Links */}
          <Column lg={3} md={2} sm={4} className="app-footer__links">
            <h4 className="app-footer__links-title">Ürün</h4>
            <ul className="app-footer__links-list">
              {footerLinks.product.map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </Column>

          {/* Resources Links */}
          <Column lg={3} md={2} sm={4} className="app-footer__links">
            <h4 className="app-footer__links-title">Kaynaklar</h4>
            <ul className="app-footer__links-list">
              {footerLinks.resources.map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </Column>

          {/* Company Links */}
          <Column lg={3} md={2} sm={4} className="app-footer__links">
            <h4 className="app-footer__links-title">Şirket</h4>
            <ul className="app-footer__links-list">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </Column>

          {/* Legal Links */}
          <Column lg={3} md={2} sm={4} className="app-footer__links">
            <h4 className="app-footer__links-title">Yasal</h4>
            <ul className="app-footer__links-list">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </Column>
        </Grid>
      </div>

      {/* Bottom Bar */}
      <div className="app-footer__bottom">
        <Grid>
          <Column lg={8} md={4} sm={4} className="app-footer__copyright">
            <p>© {currentYear} Cureonics LLC. Tüm hakları saklıdır.</p>
            <p className="app-footer__tagline">
              Powered by IBM Carbon Design System
            </p>
          </Column>
          <Column lg={8} md={4} sm={4} className="app-footer__social">
            {socialLinks.map((social) => (
              <Link
                key={social.label}
                href={social.href}
                aria-label={social.label}
                target="_blank"
                rel="noopener noreferrer"
                className="app-footer__social-link"
              >
                <social.icon size={20} />
              </Link>
            ))}
          </Column>
        </Grid>
      </div>
    </footer>
  );
}

export default AppFooter;
