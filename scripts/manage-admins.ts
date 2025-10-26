#!/usr/bin/env ts-node
/**
 * Admin Management Script
 * 
 * Usage:
 *   npm run admin:add -- email@example.com password123
 *   npm run admin:list
 *   npm run admin:remove -- email@example.com
 *   npm run admin:update-password -- email@example.com newpassword
 */

import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addAdmin(email: string, password: string, name?: string) {
  try {
    // Check if admin already exists
    const existing = await prisma.admin.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existing) {
      console.error(`❌ Admin with email "${email}" already exists.`);
      process.exit(1);
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create admin
    const admin = await prisma.admin.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        name: name || email.split('@')[0],
        isActive: true,
        role: 'admin',
      }
    });

    console.log(`✅ Admin created successfully!`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Name: ${admin.name}`);
    console.log(`   ID: ${admin.id}`);
    console.log(`\n🔐 Login credentials:`);
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`\n⚠️  Please save these credentials securely!`);
  } catch (error) {
    console.error('❌ Error creating admin:', error);
    process.exit(1);
  }
}

async function listAdmins() {
  try {
    const admins = await prisma.admin.findMany({
      select: {
        id: true,
        email: true,
        wallet: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' }
    });

    if (admins.length === 0) {
      console.log('📭 No admins found in database.');
      return;
    }

    console.log(`\n📋 Total Admins: ${admins.length}\n`);
    console.log('─'.repeat(100));
    console.log(
      'ID'.padEnd(6),
      'Email'.padEnd(30),
      'Name'.padEnd(20),
      'Role'.padEnd(15),
      'Status'.padEnd(10),
      'Created'
    );
    console.log('─'.repeat(100));

    admins.forEach(admin => {
      console.log(
        String(admin.id).padEnd(6),
        (admin.email || admin.wallet || 'N/A').padEnd(30),
        (admin.name || 'N/A').padEnd(20),
        admin.role.padEnd(15),
        (admin.isActive ? '✅ Active' : '❌ Inactive').padEnd(10),
        admin.createdAt.toISOString().split('T')[0]
      );
    });
    console.log('─'.repeat(100) + '\n');
  } catch (error) {
    console.error('❌ Error listing admins:', error);
    process.exit(1);
  }
}

async function removeAdmin(email: string) {
  try {
    const admin = await prisma.admin.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!admin) {
      console.error(`❌ Admin with email "${email}" not found.`);
      process.exit(1);
    }

    await prisma.admin.delete({
      where: { email: email.toLowerCase() }
    });

    console.log(`✅ Admin "${email}" removed successfully.`);
  } catch (error) {
    console.error('❌ Error removing admin:', error);
    process.exit(1);
  }
}

async function updatePassword(email: string, newPassword: string) {
  try {
    const admin = await prisma.admin.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!admin) {
      console.error(`❌ Admin with email "${email}" not found.`);
      process.exit(1);
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await prisma.admin.update({
      where: { email: email.toLowerCase() },
      data: { passwordHash }
    });

    console.log(`✅ Password updated successfully for "${email}"`);
    console.log(`\n🔐 New credentials:`);
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${newPassword}`);
  } catch (error) {
    console.error('❌ Error updating password:', error);
    process.exit(1);
  }
}

async function deactivateAdmin(email: string) {
  try {
    await prisma.admin.update({
      where: { email: email.toLowerCase() },
      data: { isActive: false }
    });
    console.log(`✅ Admin "${email}" deactivated (can be reactivated later).`);
  } catch (error) {
    console.error('❌ Error deactivating admin:', error);
    process.exit(1);
  }
}

async function activateAdmin(email: string) {
  try {
    await prisma.admin.update({
      where: { email: email.toLowerCase() },
      data: { isActive: true }
    });
    console.log(`✅ Admin "${email}" activated.`);
  } catch (error) {
    console.error('❌ Error activating admin:', error);
    process.exit(1);
  }
}

// Main CLI handler
async function main() {
  const command = process.argv[2];
  const args = process.argv.slice(3);

  console.log('\n🔧 Prohesis Admin Management Tool\n');

  try {
    switch (command) {
      case 'add':
        if (args.length < 2) {
          console.error('Usage: npm run admin:add <email> <password> [name]');
          process.exit(1);
        }
        await addAdmin(args[0], args[1], args[2]);
        break;

      case 'list':
        await listAdmins();
        break;

      case 'remove':
        if (args.length < 1) {
          console.error('Usage: npm run admin:remove <email>');
          process.exit(1);
        }
        await removeAdmin(args[0]);
        break;

      case 'update-password':
        if (args.length < 2) {
          console.error('Usage: npm run admin:update-password <email> <new-password>');
          process.exit(1);
        }
        await updatePassword(args[0], args[1]);
        break;

      case 'deactivate':
        if (args.length < 1) {
          console.error('Usage: npm run admin:deactivate <email>');
          process.exit(1);
        }
        await deactivateAdmin(args[0]);
        break;

      case 'activate':
        if (args.length < 1) {
          console.error('Usage: npm run admin:activate <email>');
          process.exit(1);
        }
        await activateAdmin(args[0]);
        break;

      default:
        console.log('Available commands:');
        console.log('  add <email> <password> [name]  - Add a new admin');
        console.log('  list                            - List all admins');
        console.log('  remove <email>                  - Remove an admin');
        console.log('  update-password <email> <pass>  - Update admin password');
        console.log('  deactivate <email>              - Deactivate admin (soft delete)');
        console.log('  activate <email>                - Reactivate admin');
        console.log('\nExamples:');
        console.log('  npm run admin:add admin@prohesis.com MySecurePass123 "John Doe"');
        console.log('  npm run admin:list');
        console.log('  npm run admin:update-password admin@prohesis.com NewPass456');
        process.exit(1);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
