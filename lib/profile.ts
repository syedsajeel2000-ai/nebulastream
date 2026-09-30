import { cookies } from "next/headers";
import { db } from "./db";
import { createProfile, getProfilesForUser, type ProfileRow } from "./users";

export const PROFILE_COOKIE = "nebula_profile";

export const AVATARS = ["🚀", "🎬", "🎭", "👾", "🦊", "🐙", "🌟", "🎧", "🦉", "🐉", "🎨", "🌻", "🍕", "🛸", "🧁", "🐧"];

/**
 * Returns the user's active profile (cookie selection or first profile).
 * Always verified against the session user — a user can never read another
 * user's profiles via this helper.
 */
export async function getActiveProfile(userId: number): Promise<ProfileRow> {
  const jar = await cookies();
  const raw = jar.get(PROFILE_COOKIE)?.value;
  const profiles = getProfilesForUser(userId);

  if (raw) {
    const parsed = Number.parseInt(raw, 10);
    const match = profiles.find((p) => p.id === parsed);
    if (match) return match;
  }
  return profiles[0];
}

export async function setActiveProfileCookie(profileId: number): Promise<void> {
  const jar = await cookies();
  jar.set(PROFILE_COOKIE, String(profileId), {
    httpOnly: false, // readable by client JS to highlight the active avatar
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
  });
}

export { createProfile, getProfilesForUser };
