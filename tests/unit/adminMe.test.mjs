import 'ts-node/register'
import { expect } from 'chai'
import { mapAdminToUserIdWithDb } from '../../src/lib/auth/mapAdminToUser.ts'

function fakeDb({ admins = [], users = [] }) {
  return {
    admin: {
      async findFirst({ where }) {
        const ors = where.OR?.filter(Boolean) || []
        return admins.find(a => ors.some(c => (c.email && a.email === c.email) || (c.wallet && a.wallet === c.wallet))) || null
      }
    },
    user: {
      async findFirst({ where }) {
        return users.find(u => u.email && (where.where?.email ? u.email === where.where.email : u.email === where.email)) || null
      },
      async findUnique({ where }) {
        return users.find(u => u.id === where.id) || null
      }
    }
  }
}

describe('mapAdminToUserId', () => {
  it('maps by email to user id', async () => {
    const db = fakeDb({ admins: [{ id: 1, email: 'a@example.com' }], users: [{ id: '0xabc', email: 'a@example.com' }] })
    const res = await mapAdminToUserIdWithDb(db, { email: 'a@example.com' })
    expect(res.userId).to.equal('0xabc')
  })

  it('falls back to wallet when user not found', async () => {
    const db = fakeDb({ admins: [{ id: 2, wallet: '0xwallet' }], users: [] })
    const res = await mapAdminToUserIdWithDb(db, { wallet: '0xwallet' })
    expect(res.userId).to.equal('0xwallet')
  })

  it('returns null when not an admin', async () => {
    const db = fakeDb({ admins: [], users: [] })
    const res = await mapAdminToUserIdWithDb(db, { email: 'nope@example.com' })
    expect(res).to.equal(null)
  })
})
