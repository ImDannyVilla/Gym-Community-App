import { getToken } from "./tokenStorage";

const SUPABASE_URL = "https://yfkuflkzhegvctsoheju.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlma3VmbGt6aGVndmN0c29oZWp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5ODA3NzUsImV4cCI6MjA4NTU1Njc3NX0.KBYB066r5TAuULES7XELU8zMshghAdp_ME04kDxD7zg";

export async function uploadAvatar(localUri, userId) {
  const token = await getToken();
  const ext = localUri.split('.').pop()?.split('?')[0]?.toLowerCase() || 'jpg';
  const fileName = userId ? `${userId}/avatar.${ext}` : `avatar_${Date.now()}.${ext}`;

  const formData = new FormData();
  formData.append("file", {
    uri: localUri,
    name: `avatar.${ext}`,
    type: `image/${ext}`,
  });

  const response = await fetch(
    `${SUPABASE_URL}/storage/v1/object/avatars/${fileName}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: SUPABASE_ANON_KEY,
        "x-upsert": "true",
      },
      body: formData,
    }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || "Avatar upload failed");
  }

  return `${SUPABASE_URL}/storage/v1/object/public/avatars/${fileName}`;
}
