import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const platform = searchParams.get('platform');

    const integration = await prisma.integration.findFirst({
      where: {
        organizationId: session.user.organizationId,
        ...(platform && { platform }),
      },
    });

    return NextResponse.json({ integration });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
