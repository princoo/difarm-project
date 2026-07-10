import dynamic from 'next/dynamic';

const RegisterFarmPage = dynamic(() => import('@/app/onboarding/RegisterFarmPage'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen grid place-content-center">
      <p className="text-gray-600">Loading registration…</p>
    </div>
  ),
});

export default RegisterFarmPage;
