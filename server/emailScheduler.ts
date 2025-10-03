import * as brevo from '@getbrevo/brevo';
import { db } from './db';
import { emails } from '@shared/schema';
import { eq, and, lte } from 'drizzle-orm';
import { getBrevoClient } from './brevoService';

interface ProcessedEmailResult {
  emailId: string;
  status: 'sent' | 'failed';
  error?: string;
}

interface ProcessSummary {
  total: number;
  sent: number;
  failed: number;
  results: ProcessedEmailResult[];
}

let isProcessing = false;

export async function processScheduledEmails(): Promise<ProcessSummary> {
  if (isProcessing) {
    console.log('[Email Scheduler] Another process is already running, skipping this invocation');
    return {
      total: 0,
      sent: 0,
      failed: 0,
      results: [],
    };
  }

  isProcessing = true;

  try {
    const now = new Date();
    
    console.log(`[Email Scheduler] Processing scheduled emails at ${now.toISOString()}`);
    
    const scheduledEmails = await db.query.emails.findMany({
      where: and(
        eq(emails.status, 'scheduled'),
        lte(emails.scheduledAt, now)
      ),
    });

    console.log(`[Email Scheduler] Found ${scheduledEmails.length} scheduled emails to process`);

    const results: ProcessedEmailResult[] = [];
    let sentCount = 0;
    let failedCount = 0;

    for (const email of scheduledEmails) {
      try {
        const client = getBrevoClient();
        
        const sendSmtpEmail = new brevo.SendSmtpEmail();
        sendSmtpEmail.to = email.to.map(addr => ({ email: addr }));
        sendSmtpEmail.subject = email.subject;
        sendSmtpEmail.htmlContent = email.htmlContent;
        
        if (email.textContent) {
          sendSmtpEmail.textContent = email.textContent;
        }
        
        if (email.cc && email.cc.length > 0) {
          sendSmtpEmail.cc = email.cc.map(addr => ({ email: addr }));
        }
        
        if (email.bcc && email.bcc.length > 0) {
          sendSmtpEmail.bcc = email.bcc.map(addr => ({ email: addr }));
        }
        
        if (email.templateId) {
          sendSmtpEmail.templateId = email.templateId;
        }
        
        if (email.templateParams) {
          sendSmtpEmail.params = email.templateParams as Record<string, any>;
        }

        const response = await client.sendTransacEmail(sendSmtpEmail);
        const brevoMessageId = (response.body as any)?.messageId || null;

        await db
          .update(emails)
          .set({
            status: 'sent',
            sentAt: new Date(),
            brevoMessageId,
            error: null,
            updatedAt: new Date(),
          })
          .where(eq(emails.id, email.id));

        results.push({
          emailId: email.id,
          status: 'sent',
        });
        
        sentCount++;
        console.log(`[Email Scheduler] Successfully sent email ${email.id} to ${email.to.join(', ')}`);
      } catch (err: any) {
        const errorMessage = err.message || 'Failed to send email via Brevo';
        
        await db
          .update(emails)
          .set({
            status: 'failed',
            error: errorMessage,
            updatedAt: new Date(),
          })
          .where(eq(emails.id, email.id));

        results.push({
          emailId: email.id,
          status: 'failed',
          error: errorMessage,
        });
        
        failedCount++;
        console.error(`[Email Scheduler] Failed to send email ${email.id}:`, errorMessage);
      }
    }

    const summary: ProcessSummary = {
      total: scheduledEmails.length,
      sent: sentCount,
      failed: failedCount,
      results,
    };

    if (scheduledEmails.length > 0) {
      console.log(`[Email Scheduler] Processing complete: ${sentCount} sent, ${failedCount} failed`);
    }

    return summary;
  } finally {
    isProcessing = false;
  }
}

let schedulerInterval: NodeJS.Timeout | null = null;

export function startEmailScheduler(): void {
  if (process.env.NODE_ENV === 'test') {
    console.log('[Email Scheduler] Skipping scheduler in test environment');
    return;
  }

  if (schedulerInterval) {
    console.log('[Email Scheduler] Scheduler already running');
    return;
  }

  console.log('[Email Scheduler] Starting email scheduler (runs every 1 minute)');
  
  schedulerInterval = setInterval(async () => {
    try {
      await processScheduledEmails();
    } catch (error) {
      console.error('[Email Scheduler] Error in scheduled email processing:', error);
    }
  }, 60000);

  processScheduledEmails().catch(error => {
    console.error('[Email Scheduler] Error in initial email processing:', error);
  });
}

export function stopEmailScheduler(): void {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log('[Email Scheduler] Email scheduler stopped');
  }
}
