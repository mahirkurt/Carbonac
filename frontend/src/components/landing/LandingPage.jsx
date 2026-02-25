/**
 * LandingPage - Premium landing page for unauthenticated users
 * Showcases Carbonac features with IBM Carbon Design System aesthetics
 * Uses brand gradient palette, scroll-reveal, and stagger animations
 */

import React, { useState, useCallback } from 'react';
import {
  Button,
  Grid,
  Column,
  Tile,
  Tag,
} from '@carbon/react';

import {
  MagicWand,
  DocumentImport,
  ColorPalette,
  ChartBar,
  CheckmarkOutline,
  Chat,
  ArrowRight,
  Login,
  Upload,
  Settings,
  Edit,
  Download,
} from '@carbon/icons-react';

import { useStaggerAnimation, usePageLoadSequence } from '../../hooks';
import { RippleButton } from '../animations/RippleButton';
import './LandingPage.scss';

const FEATURES = [
  {
    icon: MagicWand,
    title: 'AI Tasarım Sihirbazı',
    description: '8 soruluk akıllı sihirbaz ile dokümanınızın stilini, rengini ve düzenini belirleyin.',
  },
  {
    icon: DocumentImport,
    title: 'Çoklu Format Desteği',
    description: 'PDF, Word, Google Docs ve Markdown dosyalarınızı tek tıkla içe aktarın.',
  },
  {
    icon: ColorPalette,
    title: 'Akıllı Tasarım Profili',
    description: 'Sihirbaz yanıtlarınıza göre sistem en uygun tasarım profilini otomatik uygular.',
  },
  {
    icon: ChartBar,
    title: '22 Grafik Türü',
    description: 'Bar, çizgi, pasta, radar ve daha fazlası — otomatik tema entegrasyonu ile.',
  },
  {
    icon: CheckmarkOutline,
    title: 'Kalite Güvence',
    description: 'Erişilebilirlik, tipografi ve görsel regresyon kontrolü ile hatasız çıktı.',
  },
  {
    icon: Chat,
    title: 'AI Asistan',
    description: 'Bağlam duyarlı sohbet ile tasarım önerileri, hata düzeltme ve içerik analizi.',
  },
];

const WORKFLOW_STEPS = [
  { label: 'Yükle', description: 'PDF, Word veya Markdown dosyanızı sürükleyip bırakın', icon: Upload },
  { label: 'İşle', description: 'AI içeriğinizi analiz eder ve Markdown\'a dönüştürür', icon: Settings },
  { label: 'Tasarla', description: '8 soruluk sihirbaz ile stili belirleyin', icon: MagicWand },
  { label: 'Düzenle', description: 'Canlı önizleme ile içeriği son haline getirin', icon: Edit },
  { label: 'İndir', description: 'Matbaa kalitesinde PDF\'inizi indirin', icon: Download },
];

const TRUST_METRICS = [
  { value: 'Adaptif', label: 'Tasarım Profili' },
  { value: '22', label: 'Grafik Türü' },
  { value: 'WCAG AA', label: 'Erişilebilirlik' },
  { value: 'Paged.js', label: 'Baskı Motoru' },
];

export default function LandingPage({ onLogin }) {
  const [activeStep, setActiveStep] = useState(null);

  const { isTitleVisible, isPrimaryVisible, isSecondaryVisible } = usePageLoadSequence();

  const { containerRef, getItemProps } = useStaggerAnimation({
    itemCount: FEATURES.length,
    baseDelay: 60,
    staggerDelay: 40,
  });

  const scrollToFeatures = useCallback(() => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  return (
    <div className="landing">
      {/* ─── Hero Section ─── */}
      <section className="landing-hero">
        <div className="landing-hero__bg" aria-hidden="true" />
        <div className="landing-hero__pattern" aria-hidden="true" />
        <div className="landing-hero__content">
          <p
            className="landing-hero__eyebrow"
            style={{
              opacity: isTitleVisible ? 1 : 0,
              transform: isTitleVisible ? 'none' : 'translateY(-8px)',
              transition: 'opacity 240ms ease, transform 240ms ease',
            }}
          >
            IBM Carbon Design System ile güçlendirilmiş
          </p>
          <h1
            className="landing-hero__headline"
            style={{
              opacity: isTitleVisible ? 1 : 0,
              transform: isTitleVisible ? 'none' : 'translateY(12px)',
              transition: 'opacity 300ms ease 50ms, transform 300ms ease 50ms',
            }}
          >
            Markdown'dan{' '}
            <span className="landing-hero__gradient-text">Profesyonel PDF'ler</span>
          </h1>
          <p
            className="landing-hero__subheadline"
            style={{
              opacity: isPrimaryVisible ? 1 : 0,
              transform: isPrimaryVisible ? 'none' : 'translateY(8px)',
              transition: 'opacity 240ms ease 100ms, transform 240ms ease 100ms',
            }}
          >
            AI destekli tasarım sihirbazı ve Paged.js baskı motoru ile
            dokümanlarınızı matbaa kalitesinde raporlara dönüştürün.
          </p>
          <div
            className="landing-hero__actions"
            style={{
              opacity: isPrimaryVisible ? 1 : 0,
              transform: isPrimaryVisible ? 'none' : 'translateY(8px)',
              transition: 'opacity 240ms ease 150ms, transform 240ms ease 150ms',
            }}
          >
            <RippleButton
              kind="primary"
              size="lg"
              renderIcon={Login}
              onClick={onLogin}
            >
              Ücretsiz Başla
            </RippleButton>
            <Button
              kind="ghost"
              size="lg"
              renderIcon={ArrowRight}
              onClick={scrollToFeatures}
            >
              Nasıl Çalışır?
            </Button>
          </div>
          <p
            className="landing-hero__note"
            style={{
              opacity: isSecondaryVisible ? 1 : 0,
              transition: 'opacity 240ms ease 200ms',
            }}
          >
            10 sayfa/ay ücretsiz — kredi kartı gerekmez
          </p>
        </div>
      </section>

      {/* ─── Trust Metrics ─── */}
      <section className="landing-trust">
        <div className="landing-trust__row">
          {TRUST_METRICS.map((metric) => (
            <div key={metric.label} className="landing-trust__metric">
              <span className="landing-trust__value">{metric.value}</span>
              <span className="landing-trust__label">{metric.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Features Section ─── */}
      <section className="landing-features" id="features">
        <div className="landing-features__header">
          <h2 className="landing-features__title">Tek Platformda Her Şey</h2>
          <p className="landing-features__subtitle">
            İçe aktarmadan baskıya kadar tüm süreç — yapay zeka desteğiyle.
          </p>
        </div>
        <Grid className="landing-features__grid" ref={containerRef}>
          {FEATURES.map((feature, index) => (
            <Column key={feature.title} lg={5} md={4} sm={4} {...getItemProps(index)}>
              <Tile className="landing-feature-card">
                <div className="landing-feature-card__icon-wrap">
                  <feature.icon size={28} />
                </div>
                <h3 className="landing-feature-card__title">{feature.title}</h3>
                <p className="landing-feature-card__description">{feature.description}</p>
              </Tile>
            </Column>
          ))}
        </Grid>
      </section>

      {/* ─── How It Works Section ─── */}
      <section className="landing-workflow">
        <div className="landing-workflow__header">
          <h2 className="landing-workflow__title">5 Adımda Profesyonel PDF</h2>
          <p className="landing-workflow__subtitle">
            Dosyanızı yükleyin, AI sihirbazı ile tasarlayın, indirin.
          </p>
        </div>
        <div className="landing-workflow__details">
          {WORKFLOW_STEPS.map((step, i) => {
            const StepIcon = step.icon;
            const isActive = activeStep === i;
            return (
              <div
                key={step.label}
                className={`landing-workflow__detail${isActive ? ' landing-workflow__detail--active' : ''}`}
                onMouseEnter={() => setActiveStep(i)}
                onMouseLeave={() => setActiveStep(null)}
              >
                <div className="landing-workflow__detail-number">
                  <StepIcon size={20} />
                </div>
                <div className="landing-workflow__detail-text">
                  <strong>{step.label}</strong>
                  <span>{step.description}</span>
                </div>
                {i < WORKFLOW_STEPS.length - 1 && (
                  <div className="landing-workflow__connector" aria-hidden="true" />
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── CTA Section ─── */}
      <section className="landing-cta">
        <div className="landing-cta__bg" aria-hidden="true" />
        <div className="landing-cta__content">
          <Tag type="blue" size="sm" className="landing-cta__tag">
            <MagicWand size={14} />
            AI Destekli
          </Tag>
          <h2 className="landing-cta__title">Dokümanlarınızı Dönüştürmeye Başlayın</h2>
          <p className="landing-cta__subtitle">
            Ücretsiz hesap oluşturun, her ay 10 sayfaya kadar PDF oluşturun.
          </p>
          <div className="landing-cta__actions">
            <RippleButton
              kind="primary"
              size="lg"
              renderIcon={ArrowRight}
              onClick={onLogin}
            >
              Hemen Başla
            </RippleButton>
          </div>
        </div>
      </section>
    </div>
  );
}
