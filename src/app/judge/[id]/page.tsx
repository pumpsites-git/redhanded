import { redirect } from 'next/navigation';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function OldJudgePage({ params }: Props) {
  const { id } = await params;
  redirect(`/judges/federal`);
}
