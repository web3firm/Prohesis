import { NextRequest, NextResponse } from 'next/server';
import { guildService } from '@/lib/guild/service';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const guildId = parseInt(id);
    const { requestorId, targetUserId, newRole } = await request.json();

    if (!requestorId || !targetUserId || !newRole) {
      return NextResponse.json({ error: 'requestorId, targetUserId and newRole are required' }, { status: 400 });
    }

    if (!['member', 'moderator', 'admin'].includes(newRole)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    await guildService.updateMemberRole(guildId, targetUserId, newRole as 'member' | 'moderator' | 'admin', requestorId);

    return NextResponse.json({ success: true, message: 'Member role updated' });
  } catch (err: any) {
    console.error('Update Member Role Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to update member role' }, { status: 500 });
  }
}
