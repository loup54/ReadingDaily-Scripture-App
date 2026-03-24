/**
 * Rate limiting and admin auth helpers for Cloud Functions.
 * Uses Firestore-backed fixed 1-hour windows.
 */

import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

const WINDOW_MS = 60 * 60 * 1000; // 1 hour

const ADMIN_SECRET = process.env.ADMIN_SECRET || '';

async function incrementCounter(key: string): Promise<{ allowed: boolean }> {
  const db = admin.firestore();
  const docRef = db.collection('rateLimits').doc(key);
  let allowed = true;

  await db.runTransaction(async (tx) => {
    const doc = await tx.get(docRef);
    const now = Date.now();

    if (!doc.exists) {
      tx.set(docRef, { count: 1, resetAt: now + WINDOW_MS });
      return;
    }

    const { count, resetAt } = doc.data() as { count: number; resetAt: number };

    if (now > resetAt) {
      tx.set(docRef, { count: 1, resetAt: now + WINDOW_MS });
      return;
    }

    if (count >= (doc.data() as any).limit) {
      allowed = false;
      return;
    }

    tx.update(docRef, { count: count + 1 });
  });

  return { allowed };
}

async function runRateLimit(key: string, limit: number): Promise<boolean> {
  const db = admin.firestore();
  const docRef = db.collection('rateLimits').doc(key);
  let allowed = true;

  await db.runTransaction(async (tx) => {
    const doc = await tx.get(docRef);
    const now = Date.now();

    if (!doc.exists) {
      tx.set(docRef, { count: 1, limit, resetAt: now + WINDOW_MS });
      return;
    }

    const data = doc.data() as { count: number; limit: number; resetAt: number };

    if (now > data.resetAt) {
      tx.set(docRef, { count: 1, limit, resetAt: now + WINDOW_MS });
      return;
    }

    if (data.count >= limit) {
      allowed = false;
      return;
    }

    tx.update(docRef, { count: data.count + 1 });
  });

  return allowed;
}

/**
 * Rate limit for callable functions — throws HttpsError if exceeded.
 */
export async function checkRateLimit(
  userId: string,
  fnName: string,
  limit: number
): Promise<void> {
  const allowed = await runRateLimit(`${userId}_${fnName}`, limit);
  if (!allowed) {
    throw new functions.https.HttpsError(
      'resource-exhausted',
      'Too many requests. Please try again later.'
    );
  }
}

/**
 * Rate limit for HTTP functions — returns false if exceeded (caller sends 429).
 */
export async function checkRateLimitHttp(
  key: string,
  fnName: string,
  limit: number
): Promise<boolean> {
  return runRateLimit(`${key}_${fnName}`, limit);
}

/**
 * Verify admin secret from Authorization header.
 * Returns false if missing or invalid.
 */
export function verifyAdminToken(authHeader: string | undefined): boolean {
  if (!ADMIN_SECRET) {
    functions.logger.warn('ADMIN_SECRET not configured');
    return false;
  }
  if (!authHeader || !authHeader.startsWith('Bearer ')) return false;
  const token = authHeader.slice(7);
  return token === ADMIN_SECRET;
}
