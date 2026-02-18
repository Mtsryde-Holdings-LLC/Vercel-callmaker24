import { NextRequest } from 'next/server';
import { withApiHandler, ApiContext } from '@/lib/api-handler';
import { apiSuccess } from '@/lib/api-response';
import { RATE_LIMITS } from '@/lib/rate-limit';

export const POST = withApiHandler(
  async (request: NextRequest, { requestId }: ApiContext) => {
    const { store } = await request.json();

    const mockCustomers = [
      {
        id: 'cust_001',
        firstName: 'John',
        lastName: 'Smith',
        email: 'john.smith@example.com',
        phone: '+1-555-0101',
        ordersCount: 5,
        totalSpent: '1,234.50',
        tags: ['VIP', 'Newsletter'],
        createdAt: '2024-01-15',
        acceptsMarketing: true,
      },
      {
        id: 'cust_002',
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: 'sarah.j@example.com',
        phone: '+1-555-0102',
        ordersCount: 3,
        totalSpent: '876.30',
        tags: ['Repeat Customer'],
        createdAt: '2024-02-20',
        acceptsMarketing: true,
      },
      {
        id: 'cust_003',
        firstName: 'Michael',
        lastName: 'Brown',
        email: 'mbrown@example.com',
        phone: '+1-555-0103',
        ordersCount: 8,
        totalSpent: '2,456.75',
        tags: ['VIP', 'Wholesale'],
        createdAt: '2023-11-10',
        acceptsMarketing: false,
      },
      {
        id: 'cust_004',
        firstName: 'Emily',
        lastName: 'Davis',
        email: 'emily.davis@example.com',
        phone: '+1-555-0104',
        ordersCount: 2,
        totalSpent: '345.60',
        tags: ['New Customer'],
        createdAt: '2024-10-05',
        acceptsMarketing: true,
      },
      {
        id: 'cust_005',
        firstName: 'David',
        lastName: 'Wilson',
        email: 'david.w@example.com',
        phone: '+1-555-0105',
        ordersCount: 12,
        totalSpent: '4,567.90',
        tags: ['VIP', 'Monthly Subscriber'],
        createdAt: '2023-08-22',
        acceptsMarketing: true,
      },
    ];

    return apiSuccess({
      success: true,
      customers: mockCustomers,
      total: mockCustomers.length,
      store,
    }, { requestId });
  },
  { route: 'POST /api/integrations/shopify/customers', rateLimit: RATE_LIMITS.standard }
);
