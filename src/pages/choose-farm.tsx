import dynamic from 'next/dynamic';

const ChooseFarm = dynamic(() => import('@/app/choosefarm'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen grid place-content-center">
      <p className="text-gray-600">Loading farms…</p>
    </div>
  ),
});

export default ChooseFarm;
