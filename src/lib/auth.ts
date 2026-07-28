import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { users, type User } from "@/db/schema";
import { eq } from "drizzle-orm";

const COOKIE_NAME = "hamrah_session";
const ALG = "HS256";

function secret(): Uint8Array {
  const raw = process.env.AUTH_SECRET || "hamrah-repair-default-secret-change-me";
  return new TextEncoder().encode(raw);
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export type SessionPayload = {
  userId: number;
  role: User["role"];
  username: string;
};

export async function createSession(payload: SessionPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret());
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<User | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const session = await verifySession(token);
  if (!session) return null;
  const rows = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);
  return rows[0] ?? null;
}

export async function setSessionCookie(payload: SessionPayload) {
  const store = await cookies();
  const token = await createSession(payload);
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export function getSessionCookieName() {
  return COOKIE_NAME;
}

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user || !user.active) {
    throw new UnauthenticatedError();
  }
  return user;
}

export async function requireRole(...roles: User["role"][]): Promise<User> {
  const user = await requireUser();
  if (!roles.includes(user.role)) {
    throw new ForbiddenError();
  }
  return user;
}

export class UnauthenticatedError extends Error {}
export class ForbiddenError extends Error {}

/** Idempotent bootstrap: ensures the super admin exists on first run. */
export async function ensureSuperAdmin() {
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.username, "vahid.askari110"))
    .limit(1);
  if (existing.length > 0) return;
  const username = process.env.SUPER_ADMIN_USERNAME || "vahid.askari110";
  const password = process.env.SUPER_ADMIN_PASSWORD || "Arman@0142";
  const hash = await hashPassword(password);
  await db.insert(users).values({
    username,
    passwordHash: hash,
    fullName: "وحید عسکری - مدیر کل",
    role: "super_admin",
    active: true,
  });
}
