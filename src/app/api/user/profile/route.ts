import { currentUser } from '@clerk/nextjs/server';
import { ensureUserExists, updateUserPreferences, getUserByClerkId } from '@/server/auth/user-sync';
import { userCache } from '@/server/redis';

export async function GET() {
  try {
    // Authenticate user with Clerk
    const clerkUser = await currentUser();
    
    if (!clerkUser) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Try to get user from cache first
    let user = await userCache.getUser(clerkUser.id);
    
    if (!user) {
      // If not in cache, get from database and cache it
      user = await getUserByClerkId(clerkUser.id);
      if (user) {
        await userCache.setUser(clerkUser.id, user);
      }
    }

    if (!user) {
      // If still not found, sync from Clerk
      user = await ensureUserExists(clerkUser);
      await userCache.setUser(clerkUser.id, user);
    }

    return Response.json({ user });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    // Authenticate user with Clerk
    const clerkUser = await currentUser();
    
    if (!clerkUser) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { preferences } = await req.json();

    if (!preferences || typeof preferences !== 'object') {
      return Response.json({ error: 'Invalid preferences data' }, { status: 400 });
    }

    // Update user preferences
    const updatedUser = await updateUserPreferences(clerkUser.id, preferences);
    
    // Update cache
    await userCache.setUser(clerkUser.id, updatedUser);
    
    return Response.json({ user: updatedUser });
  } catch (error) {
    console.error('Error updating user preferences:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

