import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/middleware";
import db from "@/lib/offchain/services/dbClient";

// Feature flags and platform settings
export interface PlatformSettings {
  // Feature Flags
  maintenanceMode: boolean;
  allowMarketCreation: boolean;
  allowBetting: boolean;
  allowWithdrawals: boolean;
  
  // Financial Settings
  platformFeePercent: number;
  minBetAmount: number;
  maxBetAmount: number;
  minMarketDuration: number; // hours
  maxMarketDuration: number; // days
  
  // API Keys
  openaiApiKey?: string;
  anthropicApiKey?: string;
  web3AuthClientId?: string;
  alchemyApiKey?: string;
  infuraApiKey?: string;
  
  // Email Settings
  sendgridApiKey?: string;
  emailFromAddress?: string;
  emailFromName?: string;
  
  // Social & External
  discordWebhookUrl?: string;
  telegramBotToken?: string;
  twitterApiKey?: string;
  
  // Contract Addresses
  factoryAddress?: string;
  usdcAddress?: string;
  
  // Limits
  maxMarketsPerUser: number;
  maxBetsPerMarket: number;
  
  // Referral Settings
  referralEnabled: boolean;
  referralSignupReward: number;
  referralBetReward: number;
}

const DEFAULT_SETTINGS: PlatformSettings = {
  maintenanceMode: false,
  allowMarketCreation: true,
  allowBetting: true,
  allowWithdrawals: true,
  platformFeePercent: 1.0,
  minBetAmount: 0.001,
  maxBetAmount: 100,
  minMarketDuration: 1,
  maxMarketDuration: 365,
  maxMarketsPerUser: 100,
  maxBetsPerMarket: 10000,
  referralEnabled: true,
  referralSignupReward: 0.001,
  referralBetReward: 0.005,
};

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();

    // Fetch all settings from database
    const settingsRows = await db.setting.findMany();
    const settings: any = { ...DEFAULT_SETTINGS };

    // Merge with database settings
    for (const row of settingsRows) {
      try {
        // Parse JSON values if applicable
        const value = typeof row.value === 'string' && 
          (row.value.startsWith('{') || row.value.startsWith('['))
          ? JSON.parse(row.value)
          : row.value;
        
        // Type conversion
        if (typeof DEFAULT_SETTINGS[row.key as keyof PlatformSettings] === 'number') {
          settings[row.key] = Number(value);
        } else if (typeof DEFAULT_SETTINGS[row.key as keyof PlatformSettings] === 'boolean') {
          settings[row.key] = value === 'true' || value === true;
        } else {
          settings[row.key] = value;
        }
      } catch (e) {
        settings[row.key] = row.value;
      }
    }

    // Mask sensitive keys in response
    const maskedSettings = { ...settings };
    const sensitiveKeys = [
      'openaiApiKey', 'anthropicApiKey', 'web3AuthClientId',
      'alchemyApiKey', 'infuraApiKey', 'sendgridApiKey',
      'discordWebhookUrl', 'telegramBotToken', 'twitterApiKey'
    ];

    for (const key of sensitiveKeys) {
      if (maskedSettings[key]) {
        maskedSettings[key] = '***' + maskedSettings[key].slice(-4);
      }
    }

    return NextResponse.json({
      success: true,
      settings: maskedSettings,
    });
  } catch (error: any) {
    console.error("Admin settings fetch error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch settings" },
      { status: error.message?.includes("Unauthorized") ? 401 : 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();
    const { settings } = body;

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json(
        { success: false, error: "Invalid settings format" },
        { status: 400 }
      );
    }

    // Update settings in database
    const updates: Array<{ key: string; value: any; oldValue?: any }> = [];

    for (const [key, value] of Object.entries(settings)) {
      // Skip if value hasn't changed or is masked
      if (typeof value === 'string' && value.startsWith('***')) {
        continue;
      }

      // Get old value for audit
      const oldSetting = await db.setting.findUnique({ where: { key } });
      const oldValue = oldSetting?.value;

      // Store the setting
      const stringValue = typeof value === 'object' 
        ? JSON.stringify(value)
        : String(value);

      await db.setting.upsert({
        where: { key },
        update: { value: stringValue },
        create: { key, value: stringValue },
      });

      updates.push({ key, value: stringValue, oldValue });
    }

    // Log audit trail
    await db.audit.create({
      data: {
        action: 'SETTINGS_UPDATED',
        actor: admin.email || admin.wallet || 'admin',
        metadata: {
          updates: updates.map(u => ({
            key: u.key,
            oldValue: u.key.toLowerCase().includes('key') || u.key.toLowerCase().includes('token') 
              ? '[REDACTED]' 
              : u.oldValue,
            newValue: u.key.toLowerCase().includes('key') || u.key.toLowerCase().includes('token')
              ? '[REDACTED]'
              : u.value,
          })),
          adminId: admin.adminId,
        }
      }
    });

    return NextResponse.json({ success: true, updatedCount: updates.length });
  } catch (error: any) {
    console.error("Admin settings update error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update settings" },
      { status: error.message?.includes("Unauthorized") ? 401 : 500 }
    );
  }
}

// Get a specific setting value (internal use)
export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json();
    const { key } = body;

    if (!key) {
      return NextResponse.json(
        { success: false, error: "Setting key required" },
        { status: 400 }
      );
    }

    const setting = await db.setting.findUnique({ where: { key } });
    
    return NextResponse.json({
      success: true,
      key,
      value: setting?.value || null,
    });
  } catch (error: any) {
    console.error("Admin setting fetch error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch setting" },
      { status: error.message?.includes("Unauthorized") ? 401 : 500 }
    );
  }
}
