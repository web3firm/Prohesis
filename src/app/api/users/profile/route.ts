import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const wallet = searchParams.get("wallet");

    if (!wallet) {
      return NextResponse.json({ error: "Wallet address required" }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { wallet: wallet.toLowerCase() },
      select: {
        id: true,
        wallet: true,
        username: true,
        email: true,
        emailNotifications: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ user });
  } catch (error: any) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { wallet, username, email, emailNotifications } = body;

    if (!wallet) {
      return NextResponse.json({ error: "Wallet address required" }, { status: 400 });
    }

    // Validate username if provided
    if (username !== undefined) {
      if (username.length < 3 || username.length > 20) {
        return NextResponse.json(
          { error: "Username must be between 3 and 20 characters" },
          { status: 400 }
        );
      }

      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        return NextResponse.json(
          { error: "Username can only contain letters, numbers, and underscores" },
          { status: 400 }
        );
      }

      // Check if username is taken by another user
      const existingUser = await db.user.findFirst({
        where: {
          username,
          wallet: { not: wallet.toLowerCase() },
        },
      });

      if (existingUser) {
        return NextResponse.json({ error: "Username already taken" }, { status: 409 });
      }
    }

    // Validate email if provided
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    const updateData: any = {};
    if (username !== undefined) updateData.username = username;
    if (email !== undefined) updateData.email = email || null;
    if (emailNotifications !== undefined) updateData.emailNotifications = emailNotifications;

    const user = await db.user.update({
      where: { wallet: wallet.toLowerCase() },
      data: updateData,
      select: {
        id: true,
        wallet: true,
        username: true,
        email: true,
        emailNotifications: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ user });
  } catch (error: any) {
    console.error("Error updating user profile:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update profile" },
      { status: 500 }
    );
  }
}
