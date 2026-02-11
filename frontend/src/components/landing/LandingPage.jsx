/**
 * LandingPage - Self-promotion landing page for unauthenticated users
 * Showcases Carbonac features with Carbon Design System aesthetics
 */

import React from 'react';
import {
  Button,
  Grid,
  Column,
  Tile,
  ProgressIndicator,
  ProgressStep,
} from '@carbon/react';

import {
  MagicWand,
  DocumentImport,
  Template,
  ChartBar,
  CheckmarkOutline,
  Chat,
  Upload,
  Settings,
  Edit,
  Download,
  ArrowRight,
  Login,
} from '@carbon/icons-react';

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
    icon: Template,
    title: '16+ Profesyonel Şablon',
    description: 'IBM Carbon Design System uyumlu, matbaa kalitesinde şablon koleksiyonu.',
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
  { label: 'Yükle', description: 'PDF, Word veya Markdown dosyanızı sürükleyip bırakın' },
  { label: 'İşle', description: 'AI içeriğinizi analiz eder ve Markdown\'a dönüştürür' },
  { label: 'Tasarla', description: '8 soruluk sihirbaz ile stili belirleyin' },
  { label: 'Düzenle', description: 'Canlı önizleme ile içeriği son haline getirin' },
  { label: 'İndir', description: 'Matbaa kalitesinde PDF\'inizi indirin' },
];

export default function LandingPage({ onLogin }) {
  const scrollToFeatures = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="landing">
      {/* ─── Hero Section ─── */}
      <section className="landing-hero">
        <div className="landing-hero__bg" aria-hidden="true" />
        <div className="landing-hero__pattern" aria-hidden="true" />
        <div className="landing-hero__content">
          <p className="landing-hero__eyebrow">IBM Carbon Design System ile güçlendirilmiş</p>
          <h1 className="landing-hero__headline">
            Markdown'dan{' '}
            <span className="landing-hero__gradient-text">Profesyonel PDF'ler</span>
          </h1>
          <p className="landing-hero__subheadline">
            AI destekli tasarım sihirbazı, 16+ şablon ve Paged.js baskı motoru ile
            dokümanlarınızı matbaa kalitesinde raporlara dönüştürün.
          </p>
          <div className="landing-hero__actions">
            <Button
              kind="primary"
              size="lg"
              renderIcon={Login}
              onClick={onLogin}
            >
              Ücretsiz Başla
            </Button>
            <Button
              kind="ghost"
              size="lg"
              renderIcon={ArrowRight}
              onClick={scrollToFeatures}
            >
              Nasıl Çalışır?
            </Button>
          </div>
          <p className="landing-hero__note">10 sayfa/ay ücretsiz — kredi kartı gerekmez</p>
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
        <Grid className="landing-features__grid">
          {FEATURES.map((feature) => (
            <Column key={feature.title} lg={5} md={4} sm={4}>
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
        <div className="landing-workflow__steps">
          <ProgressIndicator currentIndex={4} spaceEqually>
            {WORKFLOW_STEPS.map((step) => (
              <ProgressStep
                key={step.label}
                label={step.label}
                description={step.description}
                complete
              />
            ))}
          </ProgressIndicator>
        </div>
        <div className="landing-workflow__details">
          {WORKFLOW_STEPS.map((step, i) => (
            <div key={step.label} className="landing-workflow__detail">
              <div className="landing-workflow__detail-number">{i + 1}</div>
              <div className="landing-workflow__detail-text">
                <strong>{step.label}</strong>
                <span>{step.description}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── CTA Section ─── */}
      <section className="landing-cta">
        <div className="landing-cta__bg" aria-hidden="true" />
        <div className="landing-cta__content">
          <h2 className="landing-cta__title">Dokümanlarınızı Dönüştürmeye Başlayın</h2>
          <p className="landing-cta__subtitle">
            Ücretsiz hesap oluşturun, her ay 10 sayfaya kadar PDF oluşturun.
          </p>
          <Button
            kind="primary"
            size="lg"
            renderIcon={ArrowRight}
            onClick={onLogin}
          >
            Hemen Başla
          </Button>
        </div>
      </section>
    </div>
  );
}
