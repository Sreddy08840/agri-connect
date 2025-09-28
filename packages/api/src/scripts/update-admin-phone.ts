import { prisma } from '../config/database';
import bcrypt from 'bcryptjs';

async function main() {
  const oldPhoneRaw = process.env.OLD_PHONE || '9606850853';
  const countryDial = process.env.COUNTRY_DIAL || '+91';
  const newPhone = process.env.NEW_PHONE || `${countryDial}9606850853`;
  const ensureRole = (process.env.ENSURE_ROLE || 'ADMIN') as 'ADMIN' | 'FARMER' | 'CUSTOMER';
  const setPassword = process.env.NEW_PASSWORD || '';

  const candidates = [oldPhoneRaw, newPhone];

  console.log(`[UpdateAdminPhone] Looking for user with phone in: ${candidates.join(', ')}`);
  let user = await prisma.user.findFirst({ where: { phone: { in: candidates } } });

  if (!user) {
    console.log('[UpdateAdminPhone] User not found. Creating new admin user...');
    const passwordHash = setPassword ? await bcrypt.hash(setPassword, 10) : undefined;
    user = await prisma.user.create({
      data: {
        name: 'Admin',
        phone: newPhone,
        role: ensureRole,
        ...(passwordHash ? { passwordHash } : {}),
        verified: true,
      },
    });
    console.log('[UpdateAdminPhone] Created user:', { id: user.id, phone: user.phone, role: user.role });
    return;
  }

  const updateData: any = { phone: newPhone };
  if (user.role !== ensureRole) updateData.role = ensureRole;
  if (setPassword) updateData.passwordHash = await bcrypt.hash(setPassword, 10);

  const updated = await prisma.user.update({ where: { id: user.id }, data: updateData });
  console.log('[UpdateAdminPhone] Updated user:', { id: updated.id, phone: updated.phone, role: updated.role });
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
