import Home from '@/app/home';
import LandingSeoHead from '@/components/LandingSeoHead';

export default function HomePage() {
  return (
    <>
      <LandingSeoHead path="/home" />
      <Home />
    </>
  );
}
