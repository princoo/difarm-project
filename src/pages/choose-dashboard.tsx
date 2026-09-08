import dynamic from 'next/dynamic';

const ChooseDashboard = dynamic(() => import('@/app/choose-dashboard'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen grid place-content-center">
      <p className="text-gray-600">Loading…</p>
    </div>
  ),
});

export default ChooseDashboard;
