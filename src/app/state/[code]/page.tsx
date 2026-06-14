import { redirect } from 'next/navigation';

interface Props {
  params: Promise<{ code: string }>;
}

export default async function OldStatePage({ params }: Props) {
  const { code } = await params;
  redirect(`/states/${code}`);
}
