import { type User } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { users } from '../db/schema';

export interface SyncedUser {
  id: number;
  clerkId: string;
  name: string;
  email: string;
  profileImageUrl: string | null;
  subscriptionTier: string;
  preferences: {
    theme?: 'light' | 'dark';
    language?: string;
    notifications?: boolean;
  };
  lastActiveAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Ensures a user exists in our database and syncs their data from Clerk
 * Creates a new user if they don't exist, updates existing user data
 */
export async function ensureUserExists(clerkUser: User): Promise<SyncedUser> {
  const email = clerkUser.emailAddresses.find(e => e.id === clerkUser.primaryEmailAddressId)?.emailAddress;
  
  if (!email) {
    throw new Error('User must have a primary email address');
  }

  // Check if user exists
  const existingUsers = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkUser.id))
    .limit(1);

  const userData = {
    clerkId: clerkUser.id,
    name: clerkUser.fullName || clerkUser.firstName || 'User',
    email,
    profileImageUrl: clerkUser.imageUrl || null,
    lastActiveAt: new Date(),
    updatedAt: new Date(),
  };

  if (existingUsers.length === 0) {
    // Create new user
    const newUsers = await db
      .insert(users)
      .values({
        ...userData,
        subscriptionTier: 'free',
        preferences: {},
      })
      .returning();
    
    return newUsers[0] as SyncedUser;
  } else {
    // Update existing user
    const updatedUsers = await db
      .update(users)
      .set(userData)
      .where(eq(users.clerkId, clerkUser.id))
      .returning();
    
    return updatedUsers[0] as SyncedUser;
  }
}

/**
 * Get user by Clerk ID from our database
 */
export async function getUserByClerkId(clerkId: string): Promise<SyncedUser | null> {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);
  
  return result[0] as SyncedUser || null;
}

/**
 * Update user preferences
 */
export async function updateUserPreferences(
  clerkId: string, 
  preferences: Partial<SyncedUser['preferences']>
): Promise<SyncedUser> {
  const updatedUsers = await db
    .update(users)
    .set({ 
      preferences,
      updatedAt: new Date() 
    })
    .where(eq(users.clerkId, clerkId))
    .returning();
  
  if (updatedUsers.length === 0) {
    throw new Error('User not found');
  }
  
  return updatedUsers[0] as SyncedUser;
}

/**
 * Update user subscription tier
 */
export async function updateUserSubscription(
  clerkId: string, 
  subscriptionTier: string
): Promise<SyncedUser> {
  const updatedUsers = await db
    .update(users)
    .set({ 
      subscriptionTier,
      updatedAt: new Date() 
    })
    .where(eq(users.clerkId, clerkId))
    .returning();
  
  if (updatedUsers.length === 0) {
    throw new Error('User not found');
  }
  
  return updatedUsers[0] as SyncedUser;
}
