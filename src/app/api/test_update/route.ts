import { supabase } from '@/shared/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  const agentId = '00000000-0000-0000-0000-000000000008'

  // fetch rude agent to get user_id
  const { data: agents } = await supabase.from('agents').select('*').eq('id', agentId)

  if (!agents || agents.length === 0) {
    return Response.json({ error: 'Rude agent not found' })
  }

  const user_id = agents[0].user_id

  const { data, error } = await supabase
    .from('agents')
    .update({ system_prompt: 'TEST UPDATE' })
    .eq('id', agentId)
    .eq('user_id', user_id)
    .select()

  return Response.json({ user_id, data, error })
}
