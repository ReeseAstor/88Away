import * as brevo from '@getbrevo/brevo';
import { db } from './db';
import { sms, insertSmsSchema } from '@shared/schema';
import { eq, and, desc, gte, lte } from 'drizzle-orm';

let smsApiInstance: brevo.TransactionalSMSApi | null = null;

export function getBrevoSmsClient(): brevo.TransactionalSMSApi {
  if (!process.env.BREVO_SMS_API_KEY) {
    throw new Error('BREVO_SMS_API_KEY environment variable is not set. Please configure your Brevo SMS API key.');
  }

  if (!smsApiInstance) {
    smsApiInstance = new brevo.TransactionalSMSApi();
    smsApiInstance.setApiKey(brevo.TransactionalSMSApiApiKeys.apiKey, process.env.BREVO_SMS_API_KEY);
  }

  return smsApiInstance;
}

interface SendSmsParams {
  userId: string;
  to: string;
  message: string;
  sender?: string;
}

export async function sendSms(params: SendSmsParams) {
  const { userId, to, message, sender } = params;

  let brevoMessageId: string | null = null;
  let status: 'sent' | 'failed' = 'sent';
  let error: string | null = null;
  let sentAt: Date | null = null;

  try {
    const client = getBrevoSmsClient();
    
    const sendTransacSms = new brevo.SendTransacSms();
    sendTransacSms.recipient = to;
    sendTransacSms.content = message;
    sendTransacSms.type = 'transactional' as any;
    
    if (sender) {
      sendTransacSms.sender = sender;
    }

    const response = await client.sendTransacSms(sendTransacSms);
    brevoMessageId = (response.body as any)?.messageId || (response.body as any)?.reference || null;
    sentAt = new Date();
  } catch (err: any) {
    status = 'failed';
    error = err.message || 'Failed to send SMS via Brevo';
    console.error('Brevo SMS send error:', err);
  }

  const smsData = {
    userId,
    recipient: to,
    message,
    sender: sender || null,
    status,
    brevoMessageId,
    error,
    sentAt,
  };

  const validatedData = insertSmsSchema.parse(smsData);
  const smsRecord = await db.insert(sms).values(validatedData).returning();

  return smsRecord[0];
}

interface BatchSmsParams {
  userId: string;
  messages: Array<{
    to: string;
    message: string;
    sender?: string;
  }>;
}

export async function sendBatchSms(params: BatchSmsParams) {
  const { userId, messages: messageList } = params;
  const results = [];

  for (const messageData of messageList) {
    try {
      const smsDataToValidate = {
        userId,
        recipient: messageData.to,
        message: messageData.message,
        sender: messageData.sender || null,
        status: 'sent' as const,
        brevoMessageId: null,
        error: null,
        sentAt: null,
      };

      insertSmsSchema.parse(smsDataToValidate);

      const result = await sendSms({
        userId,
        to: messageData.to,
        message: messageData.message,
        sender: messageData.sender,
      });

      const success = result.status !== 'failed';
      results.push({ success, sms: result });
    } catch (err: any) {
      results.push({ 
        success: false, 
        error: err.message || 'Failed to send SMS',
        messageData 
      });
    }
  }

  return results;
}

interface ListSmsFilters {
  status?: 'sent' | 'failed';
  dateRange?: {
    from?: Date;
    to?: Date;
  };
  limit?: number;
  offset?: number;
}

export async function listUserSms(userId: string, filters?: ListSmsFilters) {
  const conditions = [eq(sms.userId, userId)];

  if (filters?.status) {
    conditions.push(eq(sms.status, filters.status));
  }

  if (filters?.dateRange?.from) {
    conditions.push(gte(sms.createdAt, filters.dateRange.from));
  }

  if (filters?.dateRange?.to) {
    conditions.push(lte(sms.createdAt, filters.dateRange.to));
  }

  const limit = filters?.limit || 50;
  const offset = filters?.offset || 0;

  const smsRecords = await db.query.sms.findMany({
    where: conditions.length > 1 ? and(...conditions) : conditions[0],
    orderBy: [desc(sms.createdAt)],
    limit,
    offset,
  });

  const totalCount = await db.query.sms.findMany({
    where: conditions.length > 1 ? and(...conditions) : conditions[0],
  });

  return {
    sms: smsRecords,
    total: totalCount.length,
    limit,
    offset,
  };
}

export async function getSmsById(smsId: number, userId: string) {
  const smsRecord = await db.query.sms.findFirst({
    where: and(eq(sms.id, smsId), eq(sms.userId, userId)),
  });

  return smsRecord || null;
}
