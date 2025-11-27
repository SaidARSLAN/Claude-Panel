import { NextRequest, NextResponse } from 'next/server';
import { getSessions } from '@/lib/claude-reader';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const options = {
    project: searchParams.get('project') || undefined,
    startDate: searchParams.get('startDate') || undefined,
    endDate: searchParams.get('endDate') || undefined,
    search: searchParams.get('search') || undefined,
    page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : undefined,
    limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
  };

  try {
    const { sessions, total } = await getSessions(options);

    const page = options.page || 1;
    const limit = options.limit || total;
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      sessions,
      total,
      page,
      totalPages
    });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}
