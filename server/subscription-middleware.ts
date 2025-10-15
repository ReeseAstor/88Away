import { Request, Response, NextFunction } from 'express';
import { subscriptionService } from './subscription-service';

export interface AuthenticatedRequest extends Request {
  user: {
    claims: {
      sub: string;
    };
    [key: string]: any;
  };
}

/**
 * Middleware to check if user has access to a specific feature
 */
export function requireFeature(feature: 'prioritySupport' | 'advancedAnalytics' | 'customBranding' | 'apiAccess') {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?.claims?.sub;
      
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const hasAccess = await subscriptionService.hasFeatureAccess(userId, feature);
      
      if (!hasAccess) {
        return res.status(403).json({ 
          message: `This feature requires a subscription plan with ${feature}`,
          upgradeRequired: true,
        });
      }

      next();
    } catch (error) {
      console.error('Error checking feature access:', error);
      res.status(500).json({ message: 'Failed to verify feature access' });
    }
  };
}

/**
 * Middleware to check usage limits before allowing action
 */
export function checkUsageLimit(limitType: 'aiSessions' | 'projects' | 'collaborators') {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?.claims?.sub;
      
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const usage = await subscriptionService.checkUsageLimit(userId, limitType);
      
      if (!usage.withinLimit) {
        return res.status(429).json({ 
          message: `You have reached your ${limitType} limit (${usage.limit}). Please upgrade your plan.`,
          current: usage.current,
          limit: usage.limit,
          upgradeRequired: true,
        });
      }

      // Attach usage info to request for potential use in handlers
      (req as any).usage = usage;
      
      next();
    } catch (error) {
      console.error('Error checking usage limit:', error);
      res.status(500).json({ message: 'Failed to verify usage limits' });
    }
  };
}

/**
 * Middleware to enforce export format restrictions based on subscription
 */
export async function checkExportFormat(req: Request, res: Response, next: NextFunction) {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user?.claims?.sub;
    const { format } = req.query;
    
    if (!userId || !format) {
      return next();
    }

    const { plan } = await subscriptionService.getSubscription(userId);
    const allowedFormats = plan.features.exportFormats;

    if (!allowedFormats.includes(format as string)) {
      return res.status(403).json({ 
        message: `Export format '${format}' is not available on your current plan. Available formats: ${allowedFormats.join(', ')}`,
        upgradeRequired: true,
        allowedFormats,
      });
    }

    next();
  } catch (error) {
    console.error('Error checking export format:', error);
    res.status(500).json({ message: 'Failed to verify export format access' });
  }
}

/**
 * Helper to get usage summary for a user
 */
export async function getUserUsageSummary(userId: string) {
  const [aiSessions, projects, collaborators] = await Promise.all([
    subscriptionService.checkUsageLimit(userId, 'aiSessions'),
    subscriptionService.checkUsageLimit(userId, 'projects'),
    subscriptionService.checkUsageLimit(userId, 'collaborators'),
  ]);

  return {
    aiSessions,
    projects,
    collaborators,
  };
}
