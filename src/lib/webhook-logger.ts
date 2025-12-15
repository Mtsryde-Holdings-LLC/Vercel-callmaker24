import { prisma } from '@/lib/prisma';

export type WebhookStatus = 'RECEIVED' | 'PROCESSING' | 'SUCCESS' | 'FAILED';

export interface WebhookLogEntry {
  platform: string;
  topic: string;
  shopDomain?: string | null;
  externalId?: string | null;
  payload?: any;
  headers?: Record<string, string>;
  organizationId?: string | null;
  integrationId?: string | null;
}

export interface WebhookLogResult {
  id: string;
  startTime: number;
}

/**
 * Webhook Logger - Tracks webhook deliveries for debugging and auditing
 */
export class WebhookLogger {
  /**
   * Log webhook received - call at the start of webhook processing
   */
  static async logReceived(entry: WebhookLogEntry): Promise<WebhookLogResult> {
    const startTime = Date.now();

    try {
      const log = await prisma.webhookLog.create({
        data: {
          platform: entry.platform,
          topic: entry.topic,
          shopDomain: entry.shopDomain,
          externalId: entry.externalId,
          payload: entry.payload,
          headers: entry.headers,
          organizationId: entry.organizationId,
          integrationId: entry.integrationId,
          status: 'RECEIVED',
          receivedAt: new Date(),
        },
      });

      return { id: log.id, startTime };
    } catch (error) {
      // Don't fail webhook processing if logging fails
      console.error('[WebhookLogger] Failed to log webhook:', error);
      return { id: `temp-${Date.now()}`, startTime };
    }
  }

  /**
   * Update log to processing status
   */
  static async logProcessing(logId: string): Promise<void> {
    try {
      await prisma.webhookLog.update({
        where: { id: logId },
        data: { status: 'PROCESSING' },
      });
    } catch (error) {
      // Silently ignore logging errors
    }
  }

  /**
   * Mark webhook as successfully processed
   */
  static async logSuccess(
    logId: string,
    startTime: number,
    organizationId?: string | null
  ): Promise<void> {
    const duration = Date.now() - startTime;

    try {
      await prisma.webhookLog.update({
        where: { id: logId },
        data: {
          status: 'SUCCESS',
          processedAt: new Date(),
          duration,
          organizationId: organizationId || undefined,
        },
      });
    } catch (error) {
      console.error('[WebhookLogger] Failed to update log:', error);
    }
  }

  /**
   * Mark webhook as failed
   */
  static async logFailure(
    logId: string,
    startTime: number,
    error: Error | string,
    errorCode?: string
  ): Promise<void> {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : error;

    try {
      await prisma.webhookLog.update({
        where: { id: logId },
        data: {
          status: 'FAILED',
          processedAt: new Date(),
          duration,
          errorMessage: errorMessage.slice(0, 1000), // Truncate long errors
          errorCode,
        },
      });
    } catch (updateError) {
      console.error('[WebhookLogger] Failed to update log:', updateError);
    }
  }

  /**
   * Get recent webhook logs for an organization
   */
  static async getRecentLogs(
    organizationId: string,
    options?: {
      platform?: string;
      status?: WebhookStatus;
      limit?: number;
    }
  ) {
    return prisma.webhookLog.findMany({
      where: {
        organizationId,
        ...(options?.platform && { platform: options.platform }),
        ...(options?.status && { status: options.status }),
      },
      orderBy: { receivedAt: 'desc' },
      take: options?.limit || 50,
    });
  }

  /**
   * Get webhook statistics for an organization
   */
  static async getStats(organizationId: string, days: number = 7) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [total, byStatus, byPlatform] = await Promise.all([
      prisma.webhookLog.count({
        where: { organizationId, receivedAt: { gte: since } },
      }),
      prisma.webhookLog.groupBy({
        by: ['status'],
        where: { organizationId, receivedAt: { gte: since } },
        _count: true,
      }),
      prisma.webhookLog.groupBy({
        by: ['platform', 'topic'],
        where: { organizationId, receivedAt: { gte: since } },
        _count: true,
      }),
    ]);

    return {
      total,
      byStatus: byStatus.reduce(
        (acc, { status, _count }) => ({ ...acc, [status]: _count }),
        {} as Record<string, number>
      ),
      byPlatform: byPlatform.map(({ platform, topic, _count }) => ({
        platform,
        topic,
        count: _count,
      })),
    };
  }

  /**
   * Clean up old webhook logs (call from cron job)
   */
  static async cleanup(daysToKeep: number = 30): Promise<number> {
    const cutoff = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);

    const result = await prisma.webhookLog.deleteMany({
      where: {
        receivedAt: { lt: cutoff },
        status: 'SUCCESS', // Only delete successful logs, keep failed for debugging
      },
    });

    return result.count;
  }
}
