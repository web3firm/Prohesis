// API Route: Guild details and operations
import { NextRequest, NextResponse } from 'next/server';
import { guildService } from '@/lib/guild/service';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const guildId = parseInt(id);
    
    const guild = await guildService.getGuild(guildId);
    
    if (!guild) {
      return NextResponse.json(
        { error: 'Guild not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(guild);
  } catch (error: any) {
    console.error('Get Guild Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch guild' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const guildId = parseInt(id);
    const body = await request.json();
    
    // TODO: Implement guild update (description, avatarUrl, bannerUrl, etc.)
    // For now, just return success placeholder
    console.log('Guild update requested:', guildId, body);
    
    return NextResponse.json({ success: true, message: 'Guild update not yet implemented' });
  } catch (error: any) {
    console.error('Update Guild Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update guild' },
      { status: 500 }
    );
  }
}
