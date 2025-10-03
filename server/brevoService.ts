import * as brevo from '@getbrevo/brevo';
import { db } from './db';
import { emails, insertEmailSchema } from '@shared/schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';

let apiInstance: brevo.TransactionalEmailsApi | null = null;

export function getBrevoClient(): brevo.TransactionalEmailsApi {
  if (!process.env.BREVO_API_KEY) {
    throw new Error('BREVO_API_KEY environment variable is not set. Please configure your Brevo API key.');
  }

  if (!apiInstance) {
    apiInstance = new brevo.TransactionalEmailsApi();
    apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);
  }

  return apiInstance;
}

interface SendEmailParams {
  userId: string;
  to: string[];
  subject: string;
  htmlContent: string;
  textContent?: string;
  cc?: string[];
  bcc?: string[];
  templateId?: number;
  templateParams?: Record<string, any>;
}

export async function sendEmail(params: SendEmailParams) {
  const {
    userId,
    to,
    subject,
    htmlContent,
    textContent,
    cc,
    bcc,
    templateId,
    templateParams,
  } = params;

  let brevoMessageId: string | null = null;
  let status: 'sent' | 'failed' = 'sent';
  let error: string | null = null;

  try {
    const client = getBrevoClient();
    
    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.to = to.map(email => ({ email }));
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = htmlContent;
    
    if (textContent) {
      sendSmtpEmail.textContent = textContent;
    }
    
    if (cc && cc.length > 0) {
      sendSmtpEmail.cc = cc.map(email => ({ email }));
    }
    
    if (bcc && bcc.length > 0) {
      sendSmtpEmail.bcc = bcc.map(email => ({ email }));
    }
    
    if (templateId) {
      sendSmtpEmail.templateId = templateId;
    }
    
    if (templateParams) {
      sendSmtpEmail.params = templateParams;
    }

    const response = await client.sendTransacEmail(sendSmtpEmail);
    brevoMessageId = (response.body as any)?.messageId || null;
  } catch (err: any) {
    status = 'failed';
    error = err.message || 'Failed to send email via Brevo';
    console.error('Brevo email send error:', err);
  }

  const emailData = {
    userId,
    to,
    cc: cc || null,
    bcc: bcc || null,
    subject,
    htmlContent,
    textContent: textContent || null,
    templateId: templateId || null,
    templateParams: templateParams || null,
    status,
    brevoMessageId,
    error,
    sentAt: status === 'sent' ? new Date() : null,
  };

  const validatedData = insertEmailSchema.parse(emailData);

  const emailRecord = await db.insert(emails).values(validatedData).returning();

  return emailRecord[0];
}

interface BatchEmailParams {
  userId: string;
  emails: Array<{
    to: string[];
    subject: string;
    htmlContent: string;
    textContent?: string;
    cc?: string[];
    bcc?: string[];
    templateId?: number;
    templateParams?: Record<string, any>;
  }>;
}

export async function sendBatchEmails(params: BatchEmailParams) {
  const { userId, emails: emailList } = params;
  const results = [];

  for (const emailData of emailList) {
    try {
      const emailDataToValidate = {
        userId,
        to: emailData.to,
        cc: emailData.cc || null,
        bcc: emailData.bcc || null,
        subject: emailData.subject,
        htmlContent: emailData.htmlContent,
        textContent: emailData.textContent || null,
        templateId: emailData.templateId || null,
        templateParams: emailData.templateParams || null,
        status: 'draft' as const,
        brevoMessageId: null,
        error: null,
        sentAt: null,
        scheduledAt: null,
      };

      insertEmailSchema.parse(emailDataToValidate);

      const result = await sendEmail({
        userId,
        ...emailData,
      });

      const success = result.status !== 'failed';
      results.push({ success, email: result });
    } catch (err: any) {
      results.push({ 
        success: false, 
        error: err.message || 'Failed to send email',
        emailData 
      });
    }
  }

  return results;
}

interface ScheduleEmailParams extends SendEmailParams {
  scheduledAt: Date;
}

export async function scheduleEmail(params: ScheduleEmailParams) {
  const {
    userId,
    to,
    subject,
    htmlContent,
    textContent,
    cc,
    bcc,
    templateId,
    templateParams,
    scheduledAt,
  } = params;

  if (scheduledAt <= new Date()) {
    throw new Error('scheduledAt must be in the future');
  }

  const emailData = {
    userId,
    to,
    cc: cc || null,
    bcc: bcc || null,
    subject,
    htmlContent,
    textContent: textContent || null,
    templateId: templateId || null,
    templateParams: templateParams || null,
    status: 'scheduled' as const,
    scheduledAt,
    brevoMessageId: null,
    error: null,
    sentAt: null,
  };

  const validatedData = insertEmailSchema.parse(emailData);

  const emailRecord = await db.insert(emails).values(validatedData).returning();

  return emailRecord[0];
}

export async function getEmailStatus(emailId: string, userId: string) {
  const emailRecord = await db.query.emails.findFirst({
    where: and(eq(emails.id, emailId), eq(emails.userId, userId)),
  });

  return emailRecord || null;
}

interface ListEmailsFilters {
  status?: 'draft' | 'scheduled' | 'sent' | 'failed';
  dateRange?: {
    from?: Date;
    to?: Date;
  };
  limit?: number;
  offset?: number;
}

export async function listUserEmails(userId: string, filters?: ListEmailsFilters) {
  const conditions = [eq(emails.userId, userId)];

  if (filters?.status) {
    conditions.push(eq(emails.status, filters.status));
  }

  if (filters?.dateRange?.from) {
    conditions.push(gte(emails.createdAt, filters.dateRange.from));
  }

  if (filters?.dateRange?.to) {
    conditions.push(lte(emails.createdAt, filters.dateRange.to));
  }

  const limit = filters?.limit || 50;
  const offset = filters?.offset || 0;

  const emailRecords = await db.query.emails.findMany({
    where: conditions.length > 1 ? and(...conditions) : conditions[0],
    orderBy: [desc(emails.createdAt)],
    limit,
    offset,
  });

  const totalCount = await db.query.emails.findMany({
    where: conditions.length > 1 ? and(...conditions) : conditions[0],
  });

  return {
    emails: emailRecords,
    total: totalCount.length,
    limit,
    offset,
  };
}
