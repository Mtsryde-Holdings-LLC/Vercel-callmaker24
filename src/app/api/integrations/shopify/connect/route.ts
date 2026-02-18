import { NextRequest } from 'next/server';
import { withApiHandler, ApiContext } from '@/lib/api-handler';
import { apiSuccess } from '@/lib/api-response';
import { RATE_LIMITS } from '@/lib/rate-limit';

export const POST = withApiHandler(
  async (req: NextRequest, { requestId }: ApiContext) => {
    const { store } = await req.json();

    const mockProducts = [
      {
        id: '1',
        title: 'Premium Wireless Headphones',
        description: 'High-quality noise-cancelling headphones with 30-hour battery life',
        price: '299.99',
        imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
        variants: [
          { id: 'v1', title: 'Black', price: '299.99' },
          { id: 'v2', title: 'White', price: '299.99' },
        ],
      },
      {
        id: '2',
        title: 'Smart Watch Pro',
        description: 'Advanced fitness tracking with heart rate monitor and GPS',
        price: '399.99',
        imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
        variants: [
          { id: 'v3', title: 'Silver', price: '399.99' },
          { id: 'v4', title: 'Gold', price: '449.99' },
        ],
      },
      {
        id: '3',
        title: 'Leather Messenger Bag',
        description: 'Handcrafted genuine leather bag with laptop compartment',
        price: '189.99',
        imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400',
      },
      {
        id: '4',
        title: 'Organic Cotton T-Shirt',
        description: 'Soft, breathable, and sustainably made t-shirt',
        price: '29.99',
        imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
        variants: [
          { id: 'v5', title: 'Small', price: '29.99' },
          { id: 'v6', title: 'Medium', price: '29.99' },
          { id: 'v7', title: 'Large', price: '29.99' },
        ],
      },
    ];

    return apiSuccess({ 
      success: true, 
      store,
      products: mockProducts 
    }, { requestId });
  },
  { route: 'POST /api/integrations/shopify/connect', rateLimit: RATE_LIMITS.standard }
);
