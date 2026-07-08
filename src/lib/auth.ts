import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'crypto'
import { cookies } from 'next/headers'
import { db } from './db'

const SECRET = (() => {
  const s = process.env.SESSION_SECRET
  if (s) return s
  if (process.env.NODE_ENV === 'production') {
    throw new Error('SESSION_SECRET environment variable is required in production')
  }
  return 'mealio-dev-secret-change-me'
})()
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
  return createHmac('sha256', SECRET).update(value).digest('hex')
}

export function createSessionToken(userId: string): string {
  const payload = `${userId}.${Date.now()}`
  return `${payload}.${sign(payload)}`
}

export function verifySessionToken(token: string | undefined): string | null {
  if (!token) return null
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const payload = `${parts[0]}.${parts[1]}`
  if (sign(payload) !== parts[2]) return null
  // 30-day expiry
  if (Date.now() - Number(parts[1]) > 30 * 24 * 3600 * 1000) return null
  return parts[0]
}

export async function getSessionUserId(): Promise<string | null> {
  const token = cookies().get(COOKIE)?.value
  return verifySessionToken(token)
}

export async function userExists(): Promise<boolean> {
  return (await db.user.count()) > 0
}

export const SESSION_COOKIE = COOKIE
