import { useEffect } from 'react';
import { useRouter } from 'next/router';
import LandingSeoHead from '@/components/LandingSeoHead';

export default function HomeRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/home');
  }, [router]);

  return (
    <>
      <LandingSeoHead path="/" />
    </>
  );
}
