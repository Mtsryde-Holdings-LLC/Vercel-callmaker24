import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { WebhookLogger } from '@/lib/webhook-logger';

/**
 * Webhook Health Check Endpoint
 *
 * Returns statistics about webhook delivery and processing status
 * for monitoring and debugging purposes.
 *
 * GET /api/webhooks/shopify/health
 * GET /api/webhooks/shopify/health?organizationId=xxx
 */

export async function GET(request: NextRequest) {
  try {
    const { getServerSession } = await import('next-auth');
    const { authOptions } = await import('@/lib/auth');

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, organizationId: true, role: true },
    });

    if (!user || !user.organizationId) {
      return NextResponse.json(
        { error: 'Forbidden - No organization' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7');
    const organizationId = user.organizationId;

    // Get webhook statistics
    const stats = await WebhookLogger.getStats(organizationId, days);

    // Get integration status
    const integration = await prisma.integration.findFirst({
      where: {
        platform: 'SHOPIFY',
        organizationId,
      },
      select: {
        id: true,
        status: true,
        credentials: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Get recent failed webhooks for debugging
    const recentFailures = await prisma.webhookLog.findMany({
      where: {
        organizationId,
        platform: 'SHOPIFY',
        status: 'FAILED',
      },
      orderBy: { receivedAt: 'desc' },
      take: 10,
      select: {
        id: true,
        topic: true,
        errorMessage: true,
        errorCode: true,
        receivedAt: true,
      },
    });

    // Get last successful webhook time
    const lastSuccess = await prisma.webhookLog.findFirst({
      where: {
        organizationId,
        platform: 'SHOPIFY',
        status: 'SUCCESS',
      },
      orderBy: { processedAt: 'desc' },
      select: {
        topic: true,
        processedAt: true,
        duration: true,
      },
    });

    // Calculate health score (0-100)
    const successRate = stats.total > 0
      ? ((stats.byStatus['SUCCESS'] || 0) / stats.total) * 100
      : 100;

    const healthScore = Math.round(successRate);

    // Determine health status
    let healthStatus: 'healthy' | 'degraded' | 'unhealthy';
    if (healthScore >= 95) {
      healthStatus = 'healthy';
    } else if (healthScore >= 80) {
      healthStatus = 'degraded';
    } else {
      healthStatus = 'unhealthy';
    }

    return NextResponse.json({
      status: healthStatus,
      healthScore,
      period: `${days} days`,
      integration: integration ? {
        id: integration.id,
        status: integration.status,
        shop: (integration.credentials as any)?.shop,
        connectedAt: integration.createdAt,
        lastUpdated: integration.updatedAt,
      } : null,
      stats: {
        total: stats.total,
        success: stats.byStatus['SUCCESS'] || 0,
        failed: stats.byStatus['FAILED'] || 0,
        processing: stats.byStatus['PROCESSING'] || 0,
        received: stats.byStatus['RECEIVED'] || 0,
        successRate: `${successRate.toFixed(1)}%`,
        byTopic: stats.byPlatform.filter(p => p.platform === 'SHOPIFY'),
      },
      lastSuccess: lastSuccess ? {
        topic: lastSuccess.topic,
        processedAt: lastSuccess.processedAt,
        duration: lastSuccess.duration ? `${lastSuccess.duration}ms` : null,
      } : null,
      recentFailures: recentFailures.map(f => ({
        id: f.id,
        topic: f.topic,
        error: f.errorMessage,
        code: f.errorCode,
        time: f.receivedAt,
      })),
      endpoints: {
        customers: '/api/webhooks/shopify',
        orders: '/api/webhooks/shopify/orders',
        products: '/api/webhooks/shopify/products',
        refunds: '/api/webhooks/shopify/refunds',
        cart: '/api/webhooks/shopify/cart',
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[Webhook Health Check] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Health check failed' },
      { status: 500 }
    );
  }
}
