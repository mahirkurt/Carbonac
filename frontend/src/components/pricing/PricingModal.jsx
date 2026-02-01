/**
 * PricingModal Component
 * 
 * Displays pricing tiers and handles subscription checkout.
 */

import React, { useState } from 'react';
import {
  Modal,
  Grid,
  Column,
  Button,
  Tag,
  Loading,
  InlineNotification,
  NumberInput,
  Tile,
} from '@carbon/react';

import {
  Checkmark,
  ArrowRight,
  Purchase,
  Renew,
} from '@carbon/icons-react';

import { useAuth } from '../../contexts/AuthContext';
import { usePricing, PRICING_TIERS, PAYG_PRICING } from '../../contexts/PricingContext';

import './PricingModal.scss';

export function PricingModal({ isOpen, onClose, onLoginRequired }) {
  const { isAuthenticated } = useAuth();
  const { 
    subscription, 
    createCheckoutSession, 
    purchaseCredits,
    isLoading 
  } = usePricing();

  const [selectedTier, setSelectedTier] = useState(null);
  const [customPages, setCustomPages] = useState(50);
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Calculate pay-as-you-go price
  const calculatePaygPrice = (pages) => {
    let pricePerPage = PAYG_PRICING.pricePerPage;
    for (const discount of PAYG_PRICING.bulkDiscounts) {
      if (pages >= discount.pages) {
        pricePerPage = PAYG_PRICING.pricePerPage * (1 - discount.discount);
      }
    }
    return Math.max(pages * pricePerPage, PAYG_PRICING.minimumPurchase);
  };

  // Handle subscription checkout
  const handleSubscribe = async (tierId) => {
    if (!isAuthenticated) {
      onClose();
      onLoginRequired?.();
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const result = await createCheckoutSession(tierId);
      if (result.success) {
        window.location.href = result.checkoutUrl;
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle credit purchase
  const handlePurchaseCredits = async () => {
    if (!isAuthenticated) {
      onClose();
      onLoginRequired?.();
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const result = await purchaseCredits(customPages);
      if (result.success) {
        window.location.href = result.checkoutUrl;
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsProcessing(false);
    }
  };

  const tiers = Object.values(PRICING_TIERS);

  return (
    <Modal
      open={isOpen}
      onRequestClose={onClose}
      passiveModal
      size="lg"
      modalHeading="Fiyatlandırma"
      className="pricing-modal"
    >
      {(isLoading || isProcessing) && <Loading withOverlay />}

      {error && (
        <InlineNotification
          kind="error"
          title="Hata"
          subtitle={error}
          lowContrast
          onCloseButtonClick={() => setError(null)}
          className="pricing-modal__notification"
        />
      )}

      <p className="pricing-modal__description">
        İhtiyacınıza uygun planı seçin. Tüm planlar 14 gün ücretsiz deneme içerir.
      </p>

      {/* Pricing Tiers */}
      <div className="pricing-modal__tiers">
        {tiers.map((tier) => {
          const isCurrentPlan = subscription?.tier === tier.id;
          const isPopular = tier.id === 'professional';

          return (
            <div 
              key={tier.id} 
              className={`pricing-card ${isPopular ? 'pricing-card--popular' : ''} ${isCurrentPlan ? 'pricing-card--current' : ''}`}
            >
              {isPopular && (
                <Tag type="blue" className="pricing-card__badge">En Popüler</Tag>
              )}
              
              {isCurrentPlan && (
                <Tag type="green" className="pricing-card__badge">Mevcut Plan</Tag>
              )}

              <h3 className="pricing-card__name">{tier.name}</h3>
              
              <div className="pricing-card__price">
                {tier.price ? (
                  <>
                    <span className="pricing-card__amount">${tier.price}</span>
                    <span className="pricing-card__period">/ay</span>
                  </>
                ) : (
                  <span className="pricing-card__amount">Ücretsiz</span>
                )}
              </div>

              <p className="pricing-card__pages">
                {tier.pages === -1 ? 'Sınırsız sayfa' : `${tier.pages} sayfa/ay`}
              </p>

              <ul className="pricing-card__features">
                {tier.features.map((feature, index) => (
                  <li key={index}>
                    <Checkmark size={16} />
                    {feature}
                  </li>
                ))}
              </ul>

              <Button
                kind={isPopular ? 'primary' : 'tertiary'}
                size="lg"
                renderIcon={ArrowRight}
                onClick={() => handleSubscribe(tier.id)}
                disabled={isCurrentPlan || tier.id === 'free'}
                className="pricing-card__button"
              >
                {isCurrentPlan ? 'Mevcut Plan' : tier.id === 'free' ? 'Aktif' : 'Seç'}
              </Button>
            </div>
          );
        })}
      </div>

      {/* Pay-as-you-go Section */}
      <div className="pricing-modal__payg">
        <Tile className="pricing-modal__payg-tile">
          <div className="pricing-modal__payg-header">
            <h4>Kullandıkça Öde</h4>
            <p>Abonelik istemiyorsanız, sadece kullandığınız kadar ödeyin.</p>
          </div>

          <div className="pricing-modal__payg-content">
            <div className="pricing-modal__payg-input">
              <NumberInput
                id="custom-pages"
                label="Sayfa Adedi"
                value={customPages}
                onChange={(e, { value }) => setCustomPages(value)}
                min={10}
                max={10000}
                step={10}
              />
            </div>

            <div className="pricing-modal__payg-price">
              <span className="pricing-modal__payg-label">Toplam:</span>
              <span className="pricing-modal__payg-amount">
                ${calculatePaygPrice(customPages).toFixed(2)}
              </span>
              <span className="pricing-modal__payg-per-page">
                (${(calculatePaygPrice(customPages) / customPages).toFixed(3)}/sayfa)
              </span>
            </div>

            <Button
              kind="secondary"
              size="lg"
              renderIcon={Purchase}
              onClick={handlePurchaseCredits}
              className="pricing-modal__payg-button"
            >
              Kredi Satın Al
            </Button>
          </div>

          <div className="pricing-modal__payg-discounts">
            <p><strong>Toplu İndirimler:</strong></p>
            <ul>
              {PAYG_PRICING.bulkDiscounts.map((discount) => (
                <li key={discount.pages}>
                  {discount.pages}+ sayfa: %{discount.discount * 100} indirim
                </li>
              ))}
            </ul>
          </div>
        </Tile>
      </div>

      {/* Enterprise CTA */}
      <div className="pricing-modal__enterprise">
        <p>
          Kurumsal ihtiyaçlarınız için özel çözümler sunuyoruz.{' '}
          <a href="mailto:enterprise@cureonics.com">Bizimle iletişime geçin</a>
        </p>
      </div>
    </Modal>
  );
}

export default PricingModal;
