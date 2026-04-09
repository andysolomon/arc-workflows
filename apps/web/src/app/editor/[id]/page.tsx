interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditorPage({ params }: Props) {
  const { id } = await params;
  return (
    <main className="container mx-auto py-12 px-4 max-w-6xl">
      <h1 className="text-2xl font-bold">Editor: {id}</h1>
      <p className="text-muted-foreground mt-2">
        Visual editor coming in PR B (ARC-84 + ARC-85 + ARC-86).
      </p>
    </main>
  );
}
