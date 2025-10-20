import Stripe from 'stripe';
import { storage } from './storage';

export interface SubscriptionPlan {
  id: string;
  name: string;
  stripePriceId: string;
  amount: number;
  currency: string;
  interval: 'month' | 'year';
  features: {
    aiSessionsLimit: number;
    projectsLimit: number;
    collaboratorsLimit: number;
    exportFormats: string[];
    prioritySupport: boolean;
    advancedAnalytics: boolean;
    customBranding: boolean;
    apiAccess: boolean;
  };
}

export const SUBSCRIPTION_PLANS: Record<string, SubscriptionPlan> = {
  free: {
    id: 'free',
    name: 'Free',
    stripePriceId: '',
    amount: 0,
    currency: 'USD',
    interval: 'month',
    features: {
      aiSessionsLimit: 10,
      projectsLimit: 1,
      collaboratorsLimit: 0,
      exportFormats: ['txt', 'docx'],
      prioritySupport: false,
      advancedAnalytics: false,
      customBranding: false,
      apiAccess: false,
    },
  },
  starter: {
    id: 'starter',
    name: 'Starter',
    stripePriceId: process.env.STRIPE_STARTER_PRICE_ID || '',
    amount: 1500, // $15.00
    currency: 'USD',
    interval: 'month',
    features: {
      aiSessionsLimit: 50,
      projectsLimit: 3,
      collaboratorsLimit: 3,
      exportFormats: ['txt', 'docx', 'pdf'],
      prioritySupport: false,
      advancedAnalytics: false,
      customBranding: false,
      apiAccess: false,
    },
  },
  professional: {
    id: 'professional',
    name: 'Professional',
    stripePriceId: process.env.STRIPE_PROFESSIONAL_PRICE_ID || '',
    amount: 2900, // $29.00
    currency: 'USD',
    interval: 'month',
    features: {
      aiSessionsLimit: 100,
      projectsLimit: 5,
      collaboratorsLimit: 15,
      exportFormats: ['txt', 'docx', 'pdf', 'epub', 'mobi'],
      prioritySupport: true,
      advancedAnalytics: true,
      customBranding: false,
      apiAccess: false,
    },
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    stripePriceId: process.env.STRIPE_ENTERPRISE_PRICE_ID || '',
    amount: 9900, // $99.00
    currency: 'USD',
    interval: 'month',
    features: {
      aiSessionsLimit: -1, // unlimited
      projectsLimit: -1, // unlimited
      collaboratorsLimit: -1, // unlimited
      exportFormats: ['txt', 'docx', 'pdf', 'epub', 'mobi', 'azw3'],
      prioritySupport: true,
      advancedAnalytics: true,
      customBranding: true,
      apiAccess: true,
    },
  },
};

export class SubscriptionService {
  private stripe: Stripe;

  constructor() {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }

  // Get or create Stripe customer for user
  async getOrCreateCustomer(userId: string): Promise<string> {
    const user = await storage.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Return existing customer ID if available
    if (user.stripeCustomerId) {
      return user.stripeCustomerId;
    }

    // Create new Stripe customer
    const customer = await this.stripe.customers.create({
      email: user.email || undefined,
      name: user.firstName && user.lastName 
        ? `${user.firstName} ${user.lastName}` 
        : undefined,
      metadata: {
        userId: userId,
      },
    });

    // Update user with customer ID
    await storage.updateUser(userId, { stripeCustomerId: customer.id });

    return customer.id;
  }

  // Create subscription
  async createSubscription(userId: string, planId: string): Promise<{
    subscriptionId: string;
    clientSecret: string | null;
    status: string;
  }> {
    const plan = SUBSCRIPTION_PLANS[planId];
    if (!plan || planId === 'free') {
      throw new Error('Invalid plan selected');
    }

    const customerId = await this.getOrCreateCustomer(userId);

    // Create subscription
    const subscription = await this.stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: plan.stripePriceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
    });

    // Get client secret for payment
    const invoice = subscription.latest_invoice as Stripe.Invoice;
    const paymentIntent = invoice?.payment_intent as Stripe.PaymentIntent;
    const clientSecret = paymentIntent?.client_secret || null;

    // Update user with subscription info
    await storage.updateUser(userId, {
      stripeSubscriptionId: subscription.id,
      subscriptionStatus: subscription.status,
      subscriptionPlan: planId,
    });

    return {
      subscriptionId: subscription.id,
      clientSecret,
      status: subscription.status,
    };
  }

  // Update subscription (upgrade/downgrade)
  async updateSubscription(userId: string, newPlanId: string): Promise<Stripe.Subscription> {
    const user = await storage.getUser(userId);
    if (!user?.stripeSubscriptionId) {
      throw new Error('No active subscription found');
    }

    const newPlan = SUBSCRIPTION_PLANS[newPlanId];
    if (!newPlan || newPlanId === 'free') {
      throw new Error('Invalid plan selected');
    }

    // Retrieve current subscription
    const subscription = await this.stripe.subscriptions.retrieve(user.stripeSubscriptionId);

    // Update subscription with new price
    const updatedSubscription = await this.stripe.subscriptions.update(
      user.stripeSubscriptionId,
      {
        items: [
          {
            id: subscription.items.data[0].id,
            price: newPlan.stripePriceId,
          },
        ],
        proration_behavior: 'create_prorations',
      }
    );

    // Update user with new plan
    await storage.updateUser(userId, {
      subscriptionPlan: newPlanId,
      subscriptionStatus: updatedSubscription.status,
    });

    return updatedSubscription;
  }

  // Cancel subscription
  async cancelSubscription(userId: string, immediately: boolean = false): Promise<Stripe.Subscription> {
    const user = await storage.getUser(userId);
    if (!user?.stripeSubscriptionId) {
      throw new Error('No active subscription found');
    }

    let subscription: Stripe.Subscription;

    if (immediately) {
      // Cancel immediately
      subscription = await this.stripe.subscriptions.cancel(user.stripeSubscriptionId);
    } else {
      // Cancel at period end
      subscription = await this.stripe.subscriptions.update(user.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });
    }

    // Update user status
    await storage.updateUser(userId, {
      subscriptionStatus: subscription.status,
      ...(immediately && { subscriptionPlan: 'free' }),
    });

    return subscription;
  }

  // Reactivate subscription
  async reactivateSubscription(userId: string): Promise<Stripe.Subscription> {
    const user = await storage.getUser(userId);
    if (!user?.stripeSubscriptionId) {
      throw new Error('No subscription found');
    }

    const subscription = await this.stripe.subscriptions.update(user.stripeSubscriptionId, {
      cancel_at_period_end: false,
    });

    await storage.updateUser(userId, {
      subscriptionStatus: subscription.status,
    });

    return subscription;
  }

  // Get subscription details
  async getSubscription(userId: string): Promise<{
    subscription: Stripe.Subscription | null;
    plan: SubscriptionPlan;
    usage: any;
  }> {
    const user = await storage.getUser(userId);
    
    let subscription: Stripe.Subscription | null = null;
    if (user?.stripeSubscriptionId) {
      try {
        subscription = await this.stripe.subscriptions.retrieve(user.stripeSubscriptionId);
      } catch (error) {
        console.error('Error fetching subscription:', error);
      }
    }

    const currentPlan = user?.subscriptionPlan || 'free';
    const plan = SUBSCRIPTION_PLANS[currentPlan] || SUBSCRIPTION_PLANS.free;

    // Get usage data
    const usage = {
      aiSessions: await storage.getUserAIUsageCount(userId),
      projects: (await storage.getUserProjects(userId)).length,
      // Add more usage metrics as needed
    };

    return {
      subscription,
      plan,
      usage,
    };
  }

  // Create billing portal session
  async createPortalSession(userId: string, returnUrl: string): Promise<string> {
    const user = await storage.getUser(userId);
    if (!user?.stripeCustomerId) {
      throw new Error('No customer found');
    }

    const session = await this.stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: returnUrl,
    });

    return session.url;
  }

  // Handle webhook events
  async handleWebhook(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
        break;
      
      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      
      case 'invoice.paid':
        await this.handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;
      
      case 'invoice.payment_failed':
        await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  }

  private async handleSubscriptionUpdate(subscription: Stripe.Subscription): Promise<void> {
    const customerId = subscription.customer as string;
    
    // Find user by customer ID
    const customer = await this.stripe.customers.retrieve(customerId);
    if (!customer || customer.deleted) return;
    
    const userId = (customer.metadata as any)?.userId;
    if (!userId) return;

    // Determine plan from price ID
    let planId = 'free';
    for (const [id, plan] of Object.entries(SUBSCRIPTION_PLANS)) {
      if (subscription.items.data[0]?.price.id === plan.stripePriceId) {
        planId = id;
        break;
      }
    }

    await storage.updateUser(userId, {
      stripeSubscriptionId: subscription.id,
      subscriptionStatus: subscription.status,
      subscriptionPlan: planId,
    });
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    const customerId = subscription.customer as string;
    const customer = await this.stripe.customers.retrieve(customerId);
    if (!customer || customer.deleted) return;
    
    const userId = (customer.metadata as any)?.userId;
    if (!userId) return;

    await storage.updateUser(userId, {
      subscriptionStatus: 'canceled',
      subscriptionPlan: 'free',
    });
  }

  private async handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
    const customerId = invoice.customer as string;
    const customer = await this.stripe.customers.retrieve(customerId);
    if (!customer || customer.deleted) return;
    
    const userId = (customer.metadata as any)?.userId;
    if (!userId) return;

    // Record revenue
    await storage.createRevenueEntry({
      amount: invoice.amount_paid,
      currency: invoice.currency.toUpperCase(),
      source: 'subscription',
      description: `Subscription payment - Invoice ${invoice.number}`,
      transactionDate: new Date(invoice.created * 1000),
      metadata: {
        invoiceId: invoice.id,
        subscriptionId: invoice.subscription,
      },
    }, userId);
  }

  private async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    const customerId = invoice.customer as string;
    const customer = await this.stripe.customers.retrieve(customerId);
    if (!customer || customer.deleted) return;
    
    const userId = (customer.metadata as any)?.userId;
    if (!userId) return;

    // Update subscription status
    await storage.updateUser(userId, {
      subscriptionStatus: 'past_due',
    });

    // Could send notification to user here
    console.log(`Payment failed for user ${userId}, invoice ${invoice.id}`);
  }

  // Get all available plans
  getPlans(): Record<string, SubscriptionPlan> {
    return SUBSCRIPTION_PLANS;
  }

  // Check if user has access to a feature
  async hasFeatureAccess(userId: string, feature: keyof SubscriptionPlan['features']): Promise<boolean> {
    const user = await storage.getUser(userId);
    const planId = user?.subscriptionPlan || 'free';
    const plan = SUBSCRIPTION_PLANS[planId] || SUBSCRIPTION_PLANS.free;
    
    return Boolean(plan.features[feature]);
  }

  // Check if user is within usage limits
  async checkUsageLimit(userId: string, limitType: 'aiSessions' | 'projects' | 'collaborators'): Promise<{
    withinLimit: boolean;
    current: number;
    limit: number;
  }> {
    const user = await storage.getUser(userId);
    const planId = user?.subscriptionPlan || 'free';
    const plan = SUBSCRIPTION_PLANS[planId] || SUBSCRIPTION_PLANS.free;

    let current = 0;
    let limit = 0;

    switch (limitType) {
      case 'aiSessions':
        current = await storage.getUserAIUsageCount(userId);
        limit = plan.features.aiSessionsLimit;
        break;
      case 'projects':
        current = (await storage.getUserProjects(userId)).length;
        limit = plan.features.projectsLimit;
        break;
      case 'collaborators':
        // Would need to implement collaborator counting
        limit = plan.features.collaboratorsLimit;
        break;
    }

    return {
      withinLimit: limit === -1 || current < limit,
      current,
      limit,
    };
  }
}

export const subscriptionService = new SubscriptionService();
