// API Route: Create a new guild
import { NextRequest, NextResponse } from 'next/server';
import { guildService } from '@/lib/guild/service';

export async function POST(request: NextRequest) {
  try {
    const { name, description, founderId } = await request.json();
    
    if (!name || !founderId) {
      return NextResponse.json(
        { error: 'Name and founder ID are required' },
        { status: 400 }
      );
    }
    
    if (name.length < 3 || name.length > 50) {
      return NextResponse.json(
        { error: 'Guild name must be between 3 and 50 characters' },
        { status: 400 }
      );
    }
    
    const guild = await guildService.createGuild({
      name,
      description,
      founderId,
    });
    
    return NextResponse.json(guild);
  } catch (error: any) {
    console.error('Create Guild Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create guild' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const sortBy = (searchParams.get('sortBy') || 'recent') as 'members' | 'volume' | 'recent';
    
    const guilds = await guildService.getGuilds({
      limit,
      offset,
      sortBy,
    });
    
    return NextResponse.json(guilds);
  } catch (error: any) {
    console.error('Get Guilds Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch guilds' },
      { status: 500 }
    );
  }
}
