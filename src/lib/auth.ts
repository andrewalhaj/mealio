import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'crypto'
import { cookies } from 'next/headers'
import { db } from './db'

let _secret: string | null = null
function getSecret(): string {
  if (_secret) return _secret
  const s = process.env.SESSION_SECRET
  if (s) { _secret = s; return s }
  if (process.env.NODE_ENV === 'production') {
    throw new Error('SESSION_SECRET environment variable is required in production')
  }
  _secret = 'mealio-dev-secret-change-me'
  return _secret
}
const COOKIE = 'mealio_session'

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':')
  const candidate = scryptSync(password, salt, 64)
  return timingSafeEqual(Buffer.from(hash, 'hex'), candidate)
}

function sign(value: string): string {
  return createHmac('sha256', getSecret()).update(value).digest('hex')
}

export function createSessionToken(userId: string, mustReset = false): string {
  const flag = mustReset ? '1' : '0'
  const payload = `${userId}.${Date.now()}.${flag}`
  return `${payload}.${sign(payload)}`
}

export function parseSessionToken(token: string): { userId: string; issuedAt: number; mustReset: boolean } | null {
  if (!token) return null
  const parts = token.split('.')
  if (parts.length === 4) {
    const [userId, tsStr, flag, hmac] = parts
    const payload = `${userId}.${tsStr}.${flag}`
    if (sign(payload) !== hmac) return null
    const issuedAt = Number(tsStr)
    if (Date.now() - issuedAt > 30 * 24 * 3600 * 1000) return null
    return { userId, issuedAt, mustReset: flag === '1' }
  }
  if (parts.length === 3) {
    const [userId, tsStr, hmac] = parts
    const payload = `${userId}.${tsStr}`
    if (sign(payload) !== hmac) return null
    const issuedAt = Number(tsStr)
    if (Date.now() - issuedAt > 30 * 24 * 3600 * 1000) return null
    return { userId, issuedAt, mustReset: false }
  }
  return null
}

export function verifySessionToken(token: string | undefined): string | null {
  if (!token) return null
  const parsed = parseSessionToken(token)
  return parsed?.userId ?? null
}

export async function getSessionUserId(): Promise<string | null> {
  const token = cookies().get(COOKIE)?.value
  if (!token) return null
  const parsed = parseSessionToken(token)
  if (!parsed) return null
  try {
    const user = await db.user.findUnique({
      where: { id: parsed.userId },
      select: { sessionsValidFrom: true },
    })
    if (!user) return null
    if (user.sessionsValidFrom && parsed.issuedAt < user.sessionsValidFrom.getTime()) {
      return null
    }
  } catch {
    return null
  }
  return parsed.userId
}

export async function userExists(): Promise<boolean> {
  return (await db.user.count()) > 0
}

export const SESSION_COOKIE = COOKIE
