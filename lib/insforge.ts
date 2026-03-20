import { createClient } from '@insforge/sdk';

const baseUrl = process.env.NEXT_PUBLIC_INSFORGE_URL || '';
const anonKey = process.env.INSFORGE_API_KEY || '';

export const insforge = createClient({
  baseUrl,
  anonKey
});
