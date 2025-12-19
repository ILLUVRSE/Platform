import crypto from 'crypto';
import { cookies } from 'next/headers';
import { addUser, findUserByEmail, findUserById, removeSession, upsertSession, readDB, deleteUser, writeDB } from './db';
import { Session, User } from '../types';

const SESSION_COOKIE = 'mk_session';

export function hashPassword(password: string) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export async function registerUser(email: string, password: string) {
  const existing = await findUserByEmail(email);
  if (existing) {
    throw new Error('Email already registered');
  }

  const user: User = {
    id: crypto.randomUUID(),
    email,
    createdAt: new Date().toISOString(),
  };

  await addUser({ ...user, passwordHash: hashPassword(password) });
  await createSession(user.id);
  return user;
}

export async function loginUser(email: string, password: string) {
  const db = await readDB();
  const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user) throw new Error('Invalid credentials');
  const valid = user.passwordHash === hashPassword(password);
  if (!valid) throw new Error('Invalid credentials');
  await createSession(user.id);
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

export async function createSession(userId: string) {
  const token = crypto.randomUUID();
  const session: Session = {
    token,
    userId,
    createdAt: new Date().toISOString(),
  };
  await upsertSession(session);

  const cookieStore = cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

export async function getSessionUser() {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const db = await readDB();
  const session = db.sessions.find((s) => s.token === token);
  if (!session) return null;
  const user = db.users.find((u) => u.id === session.userId);
  if (!user) return null;
  const { passwordHash, ...safeUser } = user;
  return safeUser as User;
}

export async function clearSession() {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await removeSession(token);
  }
  cookieStore.delete(SESSION_COOKIE);
}

export async function changePassword(userId: string, oldPassword: string, newPassword: string) {
  const db = await readDB();
  const user = await findUserById(userId);
  if (!user) throw new Error('User not found');
  if (user.passwordHash !== hashPassword(oldPassword)) throw new Error('Old password incorrect');
  if (!newPassword || newPassword.length < 8) throw new Error('Password must be at least 8 characters.');
  const target = db.users.find((u) => u.id === userId);
  if (target) target.passwordHash = hashPassword(newPassword);
  db.sessions = db.sessions.filter((s) => s.userId === userId);
  const session: Session = { token: crypto.randomUUID(), userId, createdAt: new Date().toISOString() };
  db.sessions.push(session);
  await writeDB(db);
  const cookieStore = cookies();
  if (session.token) {
    cookieStore.set(SESSION_COOKIE, session.token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });
  }
  return true;
}

export async function deleteAccount(userId: string) {
  await deleteUser(userId);
  await clearSession();
}
