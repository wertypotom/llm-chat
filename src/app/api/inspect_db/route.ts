import { supabase } from '@/shared/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { data, error } = await supabase
    .from('agents')
    .select('id, name, user_id, system_prompt')
    .eq('id', '00000000-0000-0000-0000-000000000008')
  return Response.json({ data, error })
}
