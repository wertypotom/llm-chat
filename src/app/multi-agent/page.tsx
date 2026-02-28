import { MultiAgentPanel } from '@/features/chat/components/MultiAgentPanel'

export const metadata = {
  title: 'Multi-Agent Chat',
  description: 'AI Agents discussing your queries',
}

export default function MultiAgentPage() {
  return (
    <main style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <MultiAgentPanel modelId="default" />
    </main>
  )
}
