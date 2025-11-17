import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StripeMarketplaceService } from '../../server/stripe-marketplace';
import { storage } from '../../server/storage';

let mockStripeInstance: any;
const createMockStripe = () => ({
  accounts: {
    create: vi.fn(),
  },
  accountLinks: {
    create: vi.fn(),
  },
  prices: {
    retrieve: vi.fn(),
    create: vi.fn(),
  },
  checkout: {
    sessions: {
      create: vi.fn(),
    },
  },
  webhooks: {
    constructEvent: vi.fn(),
  },
  subscriptions: {
    retrieve: vi.fn(),
  },
  refunds: {
    create: vi.fn(),
  },
});

const StripeConstructor = vi.fn(() => mockStripeInstance);

vi.mock('stripe', () => ({
  default: StripeConstructor,
}));

vi.mock('../../server/storage', () => ({
  storage: {
    getUser: vi.fn(),
    createRevenueEntry: vi.fn(),
    getRomanceRevenue: vi.fn(),
  },
}));

describe('StripeMarketplaceService', () => {
  let service: StripeMarketplaceService;

  beforeEach(() => {
    mockStripeInstance = createMockStripe();
    StripeConstructor.mockReturnValue(mockStripeInstance);
    vi.clearAllMocks();

    process.env.STRIPE_SECRET_KEY = 'sk_test_123';
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
    process.env.CLIENT_URL = 'https://example.com';

    service = new StripeMarketplaceService();
  });

  describe('createConnectedAccount', () => {
    it('creates a connected account and onboarding link', async () => {
      mockStripeInstance.accounts.create.mockResolvedValue({ id: 'acct_123' });
      mockStripeInstance.accountLinks.create.mockResolvedValue({ url: 'https://onboarding' });

      const result = await service.createConnectedAccount('user@example.com', 'company');

      expect(mockStripeInstance.accounts.create).toHaveBeenCalledWith({
        type: 'express',
        email: 'user@example.com',
        business_type: 'company',
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_profile: {
          product_description: 'Romance novels and digital content',
          mcc: '5815',
        },
      });

      expect(mockStripeInstance.accountLinks.create).toHaveBeenCalledWith({
        account: 'acct_123',
        refresh_url: 'https://example.com/marketplace/connect/refresh',
        return_url: 'https://example.com/marketplace/connect/success',
        type: 'account_onboarding',
      });

      expect(result).toEqual({ accountId: 'acct_123', onboardingUrl: 'https://onboarding' });
    });
  });

  describe('createCheckoutSession', () => {
    it('creates a checkout session with calculated fees and metadata', async () => {
      mockStripeInstance.prices.retrieve.mockResolvedValue({ id: 'price_123', unit_amount: 1500, type: 'one_time' });
      mockStripeInstance.checkout.sessions.create.mockResolvedValue({ id: 'cs_test', url: 'https://checkout' });
      (storage.getUser as any).mockResolvedValue({ email: 'buyer@example.com' });

      const result = await service.createCheckoutSession({
        priceId: 'price_123',
        buyerId: 'buyer_1',
        sellerId: 'seller_1',
        sellerAccountId: 'acct_123',
        platformFeePercent: 10,
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
        metadata: { projectId: 'proj_1' },
      });

      expect(mockStripeInstance.checkout.sessions.create).toHaveBeenCalledWith({
        payment_method_types: ['card'],
        line_items: [
          {
            price: 'price_123',
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: 'https://example.com/success',
        cancel_url: 'https://example.com/cancel',
        customer_email: 'buyer@example.com',
        payment_intent_data: {
          application_fee_amount: 150,
          transfer_data: {
            destination: 'acct_123',
          },
        },
        subscription_data: undefined,
        metadata: {
          buyerId: 'buyer_1',
          sellerId: 'seller_1',
          sellerAccountId: 'acct_123',
          platformFeeAmount: '150',
          projectId: 'proj_1',
        },
      });

      expect(result).toEqual({ sessionId: 'cs_test', url: 'https://checkout' });
    });
  });

  describe('handleWebhook', () => {
    it('routes events to the appropriate handlers', async () => {
      const handleSuccessfulPaymentSpy = vi
        .spyOn(service as any, 'handleSuccessfulPayment')
        .mockResolvedValue();
      const handlePaymentSucceededSpy = vi
        .spyOn(service as any, 'handlePaymentSucceeded')
        .mockResolvedValue();
      const handleAccountUpdatedSpy = vi
        .spyOn(service as any, 'handleAccountUpdated')
        .mockResolvedValue();
      const handleSubscriptionPaymentSpy = vi
        .spyOn(service as any, 'handleSubscriptionPayment')
        .mockResolvedValue();

      const sessionObject = { id: 'session' } as any;
      const intentObject = { id: 'intent' } as any;
      const accountObject = { id: 'account' } as any;
      const invoiceObject = { id: 'invoice' } as any;

      mockStripeInstance.webhooks.constructEvent
        .mockReturnValueOnce({ type: 'checkout.session.completed', data: { object: sessionObject } })
        .mockReturnValueOnce({ type: 'payment_intent.succeeded', data: { object: intentObject } })
        .mockReturnValueOnce({ type: 'account.updated', data: { object: accountObject } })
        .mockReturnValueOnce({ type: 'invoice.payment_succeeded', data: { object: invoiceObject } });

      await service.handleWebhook('payload', 'sig');
      await service.handleWebhook('payload', 'sig');
      await service.handleWebhook('payload', 'sig');
      await service.handleWebhook('payload', 'sig');

      expect(handleSuccessfulPaymentSpy).toHaveBeenCalledWith(sessionObject);
      expect(handlePaymentSucceededSpy).toHaveBeenCalledWith(intentObject);
      expect(handleAccountUpdatedSpy).toHaveBeenCalledWith(accountObject);
      expect(handleSubscriptionPaymentSpy).toHaveBeenCalledWith(invoiceObject);
    });

    it('throws when webhook construction fails', async () => {
      mockStripeInstance.webhooks.constructEvent.mockImplementation(() => {
        throw new Error('invalid signature');
      });

      await expect(service.handleWebhook('payload', 'sig')).rejects.toThrow('invalid signature');
    });
  });

  describe('calculateFees', () => {
    it('computes platform, stripe, and net amounts with minimum fee respected', async () => {
      vi.spyOn(service as any, 'getMarketplaceFeeStructure').mockResolvedValue({
        platformFeePercent: 12,
        stripeFeePercent: 2.5,
        minimumFee: 50,
      });

      const result = await service.calculateFees(2000);

      expect(result).toEqual({
        grossAmount: 2000,
        platformFee: 240,
        stripeFee: 50,
        netAmount: 1710,
      });
    });
  });

  describe('saveSaleRecord', () => {
    it('persists revenue entries with sale metadata', async () => {
      const sale = {
        productId: 'prod_1',
        buyerId: 'buyer_1',
        sellerId: 'seller_1',
        amount: 2000,
        platformFee: 200,
        sellerAmount: 1800,
        status: 'completed',
        createdAt: new Date('2024-01-01T00:00:00Z'),
        metadata: { genre: 'romance' },
      };

      await (service as any).saveSaleRecord(sale);

      expect(storage.createRevenueEntry).toHaveBeenCalledWith(
        {
          amount: 1800,
          currency: 'USD',
          source: 'marketplace_sale',
          description: 'Marketplace sale for product prod_1',
          transactionDate: sale.createdAt,
          metadata: {
            productId: 'prod_1',
            buyerId: 'buyer_1',
            platformFee: 200,
            totalAmount: 2000,
            status: 'completed',
          },
        },
        'seller_1'
      );
    });
  });
});
