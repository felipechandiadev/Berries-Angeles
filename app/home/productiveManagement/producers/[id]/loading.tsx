import DotProgress from '@/app/baseComponents/DotProgress/DotProgress';

export default function ProducerDetailLoading() {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <DotProgress variant="wave" count={3} />
    </div>
  );
}
