import Stripe from 'stripe';
import { storage } from './storage';

export interface MarketplaceProduct {
  id: string;
  name: string;
  description: string;
  images: string[];
  metadata: {
    genre: string;
    subgenre?: string;
    tropes: string[];
    heatLevel: string;
    authorId: string;
    projectId: string;
    seriesId?: string;
  };
}

export interface MarketplacePrice {
  id: string;
  productId: string;
  unitAmount: number; // in cents
  currency: string;
  type: 'one_time' | 'recurring';
  interval?: 'month' | 'year';
}

export interface MarketplaceSale {
  id: string;
  productId: string;
  buyerId: string;
  sellerId: string;
  amount: number;
  platformFee: number;
  sellerAmount: number;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  createdAt: Date;
  metadata?: any;
}

export class StripeMarketplaceService {
  private stripe: Stripe;
  private webhookSecret: string;

  constructor() {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }
    
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    this.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
  }

  async createConnectedAccount(email: string, businessType: 'individual' | 'company' = 'individual'): Promise<{accountId: string, onboardingUrl: string}> {
    try {
      // Create connected account
      const account = await this.stripe.accounts.create({
        type: 'express',
        email,
        business_type: businessType,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_profile: {
          product_description: 'Romance novels and digital content',
          mcc: '5815', // Digital Goods – Media, Books, Movies, Music
        },
      });

      // Create account link for onboarding
      const accountLink = await this.stripe.accountLinks.create({
        account: account.id,
        refresh_url: `${process.env.CLIENT_URL}/marketplace/connect/refresh`,
        return_url: `${process.env.CLIENT_URL}/marketplace/connect/success`,
        type: 'account_onboarding',
      });

      return {
        accountId: account.id,
        onboardingUrl: accountLink.url,
      };
    } catch (error) {
      console.error('Error creating connected account:', error);
      throw error;
    }
  }

  async createProduct(productData: Omit<MarketplaceProduct, 'id'>): Promise<MarketplaceProduct> {
    try {
      const product = await this.stripe.products.create({
        name: productData.name,
        description: productData.description,
        images: productData.images,
        metadata: {
          genre: productData.metadata.genre,
          subgenre: productData.metadata.subgenre || '',
          tropes: JSON.stringify(productData.metadata.tropes),
          heatLevel: productData.metadata.heatLevel,
          authorId: productData.metadata.authorId,
          projectId: productData.metadata.projectId,
          seriesId: productData.metadata.seriesId || '',
        },
      });

      return {
        id: product.id,
        ...productData,
      };
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  }

  async createPrice(priceData: Omit<MarketplacePrice, 'id'>): Promise<MarketplacePrice> {
    try {
      const stripePrice = await this.stripe.prices.create({
        product: priceData.productId,
        unit_amount: priceData.unitAmount,
        currency: priceData.currency,
        ...(priceData.type === 'recurring' ? {
          recurring: {
            interval: priceData.interval!,
          },
        } : {}),
      });

      return {
        id: stripePrice.id,
        ...priceData,
      };
    } catch (error) {
      console.error('Error creating price:', error);
      throw error;
    }
  }

  async createCheckoutSession(params: {
    priceId: string;
    buyerId: string;
    sellerId: string;
    sellerAccountId: string;
    platformFeePercent: number;
    successUrl: string;
    cancelUrl: string;
    metadata?: any;
  }): Promise<{sessionId: string, url: string}> {
    try {
      const price = await this.stripe.prices.retrieve(params.priceId);
      const platformFeeAmount = Math.round((price.unit_amount! * params.platformFeePercent) / 100);

      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price: params.priceId,
            quantity: 1,
          },
        ],
        mode: price.type === 'recurring' ? 'subscription' : 'payment',
        success_url: params.successUrl,
        cancel_url: params.cancelUrl,
        customer_email: await this.getUserEmail(params.buyerId),
        payment_intent_data: price.type !== 'recurring' ? {
          application_fee_amount: platformFeeAmount,
          transfer_data: {
            destination: params.sellerAccountId,
          },
        } : undefined,
        subscription_data: price.type === 'recurring' ? {
          application_fee_percent: params.platformFeePercent,
          transfer_data: {
            destination: params.sellerAccountId,
          },
        } : undefined,
        metadata: {
          buyerId: params.buyerId,
          sellerId: params.sellerId,
          sellerAccountId: params.sellerAccountId,
          platformFeeAmount: platformFeeAmount.toString(),
          ...params.metadata,
        },
      });

      return {
        sessionId: session.id,
        url: session.url!,
      };
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw error;
    }
  }

  async handleWebhook(payload: string, signature: string): Promise<void> {
    try {
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        this.webhookSecret
      );

      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleSuccessfulPayment(event.data.object as Stripe.Checkout.Session);
          break;
        
        case 'payment_intent.succeeded':
          await this.handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
          break;
        
        case 'account.updated':
          await this.handleAccountUpdated(event.data.object as Stripe.Account);
          break;
        
        case 'invoice.payment_succeeded':
          await this.handleSubscriptionPayment(event.data.object as Stripe.Invoice);
          break;
        
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }
    } catch (error) {
      console.error('Error handling webhook:', error);
      throw error;
    }
  }

  private async handleSuccessfulPayment(session: Stripe.Checkout.Session): Promise<void> {
    try {
      const metadata = session.metadata;
      if (!metadata) return;

      const sale: Omit<MarketplaceSale, 'id'> = {
        productId: '', // Will be retrieved from line items
        buyerId: metadata.buyerId,
        sellerId: metadata.sellerId,
        amount: session.amount_total || 0,
        platformFee: parseInt(metadata.platformFeeAmount),
        sellerAmount: (session.amount_total || 0) - parseInt(metadata.platformFeeAmount),
        status: 'completed',
        createdAt: new Date(),
        metadata: metadata,
      };

      // Save sale record to database
      await this.saveSaleRecord(sale);
      
      // Update author revenue analytics
      await this.updateAuthorRevenue(metadata.sellerId, sale.sellerAmount);
      
      // Send notification to seller
      await this.notifySeller(metadata.sellerId, sale);
      
    } catch (error) {
      console.error('Error handling successful payment:', error);
    }
  }

  private async handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    try {
      // Additional payment processing logic
      console.log('Payment succeeded:', paymentIntent.id);
    } catch (error) {
      console.error('Error handling payment succeeded:', error);
    }
  }

  private async handleAccountUpdated(account: Stripe.Account): Promise<void> {
    try {
      // Update account status in our database
      await this.updateConnectedAccountStatus(account.id, {
        detailsSubmitted: account.details_submitted,
        payoutsEnabled: account.payouts_enabled,
        chargesEnabled: account.charges_enabled,
      });
    } catch (error) {
      console.error('Error handling account update:', error);
    }
  }

  private async handleSubscriptionPayment(invoice: Stripe.Invoice): Promise<void> {
    try {
      // Handle recurring subscription payments
      if (invoice.subscription) {
        const subscription = await this.stripe.subscriptions.retrieve(invoice.subscription as string);
        // Process recurring payment logic
      }
    } catch (error) {
      console.error('Error handling subscription payment:', error);
    }
  }

  async getSellerAnalytics(sellerId: string, period: 'week' | 'month' | 'year' = 'month'): Promise<{
    totalSales: number;
    totalRevenue: number;
    platformFees: number;
    netRevenue: number;
    salesByProduct: any[];
    topGenres: any[];
  }> {
    try {
      const sales = await this.getSellerSales(sellerId, period);
      
      const analytics = {
        totalSales: sales.length,
        totalRevenue: sales.reduce((sum, sale) => sum + sale.amount, 0),
        platformFees: sales.reduce((sum, sale) => sum + sale.platformFee, 0),
        netRevenue: sales.reduce((sum, sale) => sum + sale.sellerAmount, 0),
        salesByProduct: this.groupSalesByProduct(sales),
        topGenres: this.getTopGenres(sales),
      };

      return analytics;
    } catch (error) {
      console.error('Error getting seller analytics:', error);
      throw error;
    }
  }

  async createRefund(paymentIntentId: string, amount?: number): Promise<Stripe.Refund> {
    try {
      return await this.stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount,
      });
    } catch (error) {
      console.error('Error creating refund:', error);
      throw error;
    }
  }

  async updateConnectedAccountStatus(accountId: string, status: {
    detailsSubmitted: boolean;
    payoutsEnabled: boolean;
    chargesEnabled: boolean;
  }): Promise<void> {
    // Update database with account status
    const metadata = {
      detailsSubmitted: status.detailsSubmitted,
      payoutsEnabled: status.payoutsEnabled,
      chargesEnabled: status.chargesEnabled,
      updatedAt: new Date().toISOString(),
    };
    
    // Store in user metadata or separate table as needed
    // This could be implemented with a specific user field for Stripe account status
  }

  private async saveSaleRecord(sale: Omit<MarketplaceSale, 'id'>): Promise<void> {
    // Save to revenue entries table
    await storage.createRevenueEntry({
      amount: sale.sellerAmount,
      currency: 'USD',
      source: 'marketplace_sale',
      description: `Marketplace sale for product ${sale.productId}`,
      transactionDate: sale.createdAt,
      metadata: {
        productId: sale.productId,
        buyerId: sale.buyerId,
        platformFee: sale.platformFee,
        totalAmount: sale.amount,
        status: sale.status,
      },
    }, sale.sellerId);
  }

  private async updateAuthorRevenue(authorId: string, amount: number): Promise<void> {
    // Create revenue entry for analytics
    await storage.createRevenueEntry({
      amount,
      currency: 'USD',
      source: 'author_revenue',
      description: 'Revenue from marketplace sale',
      transactionDate: new Date(),
      metadata: {
        type: 'marketplace',
      },
    }, authorId);
  }

  private async notifySeller(sellerId: string, sale: Omit<MarketplaceSale, 'id'>): Promise<void> {
    // Send notification to seller about new sale
    // This would integrate with the notifications system
    console.log(`New sale notification for seller ${sellerId}:`, {
      amount: sale.sellerAmount,
      productId: sale.productId,
    });
  }

  private async getUserEmail(userId: string): Promise<string> {
    const user = await storage.getUser(userId);
    return user?.email || '';
  }

  private async getSellerSales(sellerId: string, period: string): Promise<MarketplaceSale[]> {
    // Retrieve sales data from database
    const revenueData = await storage.getRomanceRevenue(sellerId, period);
    
    // Transform revenue entries into MarketplaceSale format
    const sales: MarketplaceSale[] = revenueData.entries
      .filter((entry: any) => entry.source === 'marketplace_sale')
      .map((entry: any) => ({
        id: entry.id,
        productId: entry.metadata?.productId || '',
        buyerId: entry.metadata?.buyerId || '',
        sellerId: sellerId,
        amount: entry.metadata?.totalAmount || entry.amount,
        platformFee: entry.metadata?.platformFee || 0,
        sellerAmount: entry.amount,
        status: entry.metadata?.status || 'completed',
        createdAt: entry.transactionDate,
        metadata: entry.metadata,
      }));
    
    return sales;
  }

  private groupSalesByProduct(sales: MarketplaceSale[]): any[] {
    // Group and aggregate sales by product
    const grouped = sales.reduce((acc, sale) => {
      const productId = sale.productId;
      if (!acc[productId]) {
        acc[productId] = {
          productId,
          sales: 0,
          revenue: 0,
        };
      }
      acc[productId].sales += 1;
      acc[productId].revenue += sale.sellerAmount;
      return acc;
    }, {} as any);

    return Object.values(grouped);
  }

  private getTopGenres(sales: MarketplaceSale[]): any[] {
    // Analyze top-performing genres
    const genres = sales.reduce((acc, sale) => {
      const genre = sale.metadata?.genre || 'Unknown';
      if (!acc[genre]) {
        acc[genre] = {
          genre,
          sales: 0,
          revenue: 0,
        };
      }
      acc[genre].sales += 1;
      acc[genre].revenue += sale.sellerAmount;
      return acc;
    }, {} as any);

    return Object.values(genres).sort((a: any, b: any) => b.revenue - a.revenue);
  }

  async getMarketplaceFeeStructure(): Promise<{
    platformFeePercent: number;
    stripeFeePercent: number;
    minimumFee: number;
  }> {
    return {
      platformFeePercent: 10, // 10% platform fee
      stripeFeePercent: 2.9, // Stripe's fee
      minimumFee: 30, // 30 cents minimum
    };
  }

  async calculateFees(amount: number): Promise<{
    grossAmount: number;
    platformFee: number;
    stripeFee: number;
    netAmount: number;
  }> {
    const feeStructure = await this.getMarketplaceFeeStructure();
    
    const platformFee = Math.round((amount * feeStructure.platformFeePercent) / 100);
    const stripeFee = Math.max(
      Math.round((amount * feeStructure.stripeFeePercent) / 100),
      feeStructure.minimumFee
    );
    const netAmount = amount - platformFee - stripeFee;

    return {
      grossAmount: amount,
      platformFee,
      stripeFee,
      netAmount,
    };
  }
}

let stripeMarketplaceSingleton: StripeMarketplaceService | null = null;

/**
 * Lazily instantiate Stripe so missing Stripe config doesn't prevent the server
 * from starting (non-marketplace endpoints should still work).
 */
export function getStripeMarketplace(): StripeMarketplaceService {
  if (stripeMarketplaceSingleton) return stripeMarketplaceSingleton;
  stripeMarketplaceSingleton = new StripeMarketplaceService();
  return stripeMarketplaceSingleton;
}