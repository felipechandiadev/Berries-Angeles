import { notFound } from 'next/navigation';
import { getProducerDetailData } from '@/app/actions/producerDetail';
import ProducerDetailPage from './ui/ProducerDetailPage';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProducerDetailRoutePage({ params }: PageProps) {
  const { id } = await params;
  const result = await getProducerDetailData(id);

  if (!result.success || !result.data) {
    notFound();
  }

  return <ProducerDetailPage data={result.data} />;
}
