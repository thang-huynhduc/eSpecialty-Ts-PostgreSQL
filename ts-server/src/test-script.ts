import { prisma } from './config/prisma.js'

async function main() {
  // 1. CREATE USER (có address + contact + otp)
  const user = await prisma.user.create({
    data: {
      name: 'Alice',
      email: 'alice@example.com',
      password: 'hashed-password-123',
      role: 'USER',

      addresses: {
        create: [
          {
            label: 'Home',
            street: '123 Main St',
            city: 'HCM',
            district: '1',
            phone: '0901234567',
            isDefault: true
          }
        ]
      },

      contacts: {
        create: [
          {
            name: 'Alice',
            email: 'alice@example.com',
            subject: 'Test Contact',
            message: 'Hello admin!'
          }
        ]
      },

      otps: {
        create: [
          {
            otpHash: 'hashed-otp-123',
            type: 'register',
            expiresAt: new Date(Date.now() + 1000 * 60 * 5) // +5 phút
          }
        ]
      }
    },
    include: {
      addresses: true,
      contacts: true,
      otps: true
    }
  })

  // eslint-disable-next-line no-console
  console.log('Created user:', JSON.stringify(user, null, 2))

  // 2. GET ALL USERS (kèm quan hệ)
  const allUsers = await prisma.user.findMany({
    include: {
      addresses: true,
      contacts: true,
      otps: true,
      orders: true
    }
  })

  // eslint-disable-next-line no-console
  console.log('All users:', JSON.stringify(allUsers, null, 2))
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    // eslint-disable-next-line no-console
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
