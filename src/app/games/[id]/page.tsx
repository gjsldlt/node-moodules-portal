interface GameSessionPageProps {
  params: Promise<{ id: string }>
}

export default async function GameSessionPage({ params }: GameSessionPageProps) {
  const { id } = await params
  return (
    <main className="flex-1 p-6">
      <h1 className="font-display text-3xl font-bold text-tx">Game Session: {id}</h1>
    </main>
  )
}
