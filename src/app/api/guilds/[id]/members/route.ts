// API Route: Guild membership management
import { NextRequest, NextResponse } from 'next/server';
import { guildService } from '@/lib/guild/service';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const guildId = parseInt(id);
    const { userId, action } = await request.json();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    if (action === 'join') {
      await guildService.joinGuild(guildId, userId);
      return NextResponse.json({ success: true, message: 'Joined guild successfully' });
    } else if (action === 'leave') {
      await guildService.leaveGuild(guildId, userId);
      return NextResponse.json({ success: true, message: 'Left guild successfully' });
    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Guild Membership Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update membership' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const guildId = parseInt(id);
    
    const members = await guildService.getGuildMembers(guildId);
    
    return NextResponse.json(members);
  } catch (error: any) {
    console.error('Get Members Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch members' },
      { status: 500 }
    );
  }
}
