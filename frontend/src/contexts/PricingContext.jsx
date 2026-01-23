/**
 * PricingContext - Usage and Pricing Management
 * 
 * Manages user credits, page-based pricing, and usage tracking.
 * Integrates with Stripe for payments.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { buildApiUrl } from '../utils/apiBase';

// Pricing Context
const PricingContext = createContext(null);

// Pricing tiers
export const PRICING_TIERS = {
  free: {
    id: 'free',
    name: 'Ücretsiz',
    pages: 10,
    pricePerPage: 0,
    features: [
      '10 sayfa/ay ücretsiz',
      'Temel şablonlar',
      'Typst motoru',
      'Standart destek',
    ],
  },
  starter: {
    id: 'starter',
    name: 'Starter',
    pages: 100,
    price: 9.99,
    pricePerPage: 0.10,
    stripePriceId: 'price_starter',
    features: [
      '100 sayfa/ay',
      'Tüm şablonlar',
      'Typst + Quarto motorları',
      'Öncelikli destek',
    ],
  },
  professional: {
    id: 'professional',
    name: 'Professional',
    pages: 500,
    price: 29.99,
    pricePerPage: 0.06,
    stripePriceId: 'price_professional',
    features: [
      '500 sayfa/ay',
      'Özel şablonlar',
      'API erişimi',
      'Batch dönüştürme',
      '7/24 destek',
    ],
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    pages: -1, // Unlimited
    price: 99.99,
    pricePerPage: 0,
    stripePriceId: 'price_enterprise',
    features: [
      'Sınırsız sayfa',
      'Beyaz etiket (White-label)',
      'Özel entegrasyonlar',
      'SLA garantisi',
      'Dedicated destek',
    ],
  },
};

// Pay-as-you-go pricing
export const PAYG_PRICING = {
  pricePerPage: 0.15,
  minimumPurchase: 5, // $5 minimum
  bulkDiscounts: [
    { pages: 100, discount: 0.10 },  // 10% off for 100+ pages
    { pages: 500, discount: 0.20 },  // 20% off for 500+ pages
    { pages: 1000, discount: 0.30 }, // 30% off for 1000+ pages
  ],
};

/**
 * Pricing Provider Component
 */
export function PricingProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const [credits, setCredits] = useState(0);
  const [subscription, setSubscription] = useState(null);
  const [usage, setUsage] = useState({ pagesUsed: 0, pagesRemaining: 0 });
  const [isLoading, setIsLoading] = useState(false);

  // Fetch user's pricing data when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchPricingData();
    } else {
      // Reset to free tier for non-authenticated users
      setCredits(0);
      setSubscription(null);
      setUsage({ pagesUsed: 0, pagesRemaining: PRICING_TIERS.free.pages });
    }
  }, [isAuthenticated]);

  // Fetch pricing data from API
  const fetchPricingData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('carbonac_token');
      const response = await fetch(buildApiUrl('/api/billing/status'), {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCredits(data.credits || 0);
        setSubscription(data.subscription);
        setUsage(data.usage || { pagesUsed: 0, pagesRemaining: 0 });
      }
    } catch (err) {
      console.error('Failed to fetch pricing data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Check if user can convert (has credits/subscription)
  const canConvert = useCallback((pageCount = 1) => {
    if (!isAuthenticated) {
      // Non-authenticated users get limited free usage
      return usage.pagesRemaining >= pageCount;
    }

    if (subscription?.tier === 'enterprise') {
      return true; // Unlimited
    }

    return (credits + usage.pagesRemaining) >= pageCount;
  }, [isAuthenticated, credits, usage, subscription]);

  // Use credits for conversion
  const useCredits = useCallback(async (pageCount) => {
    if (!canConvert(pageCount)) {
      return { success: false, error: 'Yetersiz kredi' };
    }

    try {
      const token = localStorage.getItem('carbonac_token');
      const response = await fetch(buildApiUrl('/api/billing/use-credits'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ pageCount }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Kredi kullanımı başarısız');
      }

      const data = await response.json();
      setCredits(data.remainingCredits);
      setUsage(data.usage);
      
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [canConvert]);

  // Create Stripe checkout session
  const createCheckoutSession = useCallback(async (tierId) => {
    const tier = PRICING_TIERS[tierId];
    if (!tier || tierId === 'free') {
      return { success: false, error: 'Geçersiz plan' };
    }

    try {
      const token = localStorage.getItem('carbonac_token');
      const response = await fetch(buildApiUrl('/api/billing/create-checkout'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          tierId,
          priceId: tier.stripePriceId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Ödeme sayfası oluşturulamadı');
      }

      const { checkoutUrl } = await response.json();
      return { success: true, checkoutUrl };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, []);

  // Purchase credits (pay-as-you-go)
  const purchaseCredits = useCallback(async (pageCount) => {
    try {
      const token = localStorage.getItem('carbonac_token');
      
      // Calculate price with discounts
      let pricePerPage = PAYG_PRICING.pricePerPage;
      for (const discount of PAYG_PRICING.bulkDiscounts) {
        if (pageCount >= discount.pages) {
          pricePerPage = PAYG_PRICING.pricePerPage * (1 - discount.discount);
        }
      }
      
      const totalPrice = Math.max(
        pageCount * pricePerPage,
        PAYG_PRICING.minimumPurchase
      );

      const response = await fetch(buildApiUrl('/api/billing/purchase-credits'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ pageCount, totalPrice }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Kredi satın alımı başarısız');
      }

      const { checkoutUrl } = await response.json();
      return { success: true, checkoutUrl };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, []);

  // Cancel subscription
  const cancelSubscription = useCallback(async () => {
    try {
      const token = localStorage.getItem('carbonac_token');
      const response = await fetch(buildApiUrl('/api/billing/cancel-subscription'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Abonelik iptali başarısız');
      }

      await fetchPricingData();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, []);

  // Get current tier info
  const getCurrentTier = useCallback(() => {
    if (!subscription) {
      return PRICING_TIERS.free;
    }
    return PRICING_TIERS[subscription.tier] || PRICING_TIERS.free;
  }, [subscription]);

  const value = {
    credits,
    subscription,
    usage,
    isLoading,
    canConvert,
    useCredits,
    createCheckoutSession,
    purchaseCredits,
    cancelSubscription,
    getCurrentTier,
    refreshPricing: fetchPricingData,
    PRICING_TIERS,
    PAYG_PRICING,
  };

  return (
    <PricingContext.Provider value={value}>
      {children}
    </PricingContext.Provider>
  );
}

/**
 * usePricing Hook
 */
export function usePricing() {
  const context = useContext(PricingContext);
  if (!context) {
    throw new Error('usePricing must be used within a PricingProvider');
  }
  return context;
}

export default PricingContext;
