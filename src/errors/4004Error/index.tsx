import { ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { Link } from '@/lib/router-compat';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <ExclamationCircleIcon className="w-20 h-20 text-red-500 mb-4" />
      <h1 className="text-4xl font-bold mb-2">404</h1>
      <p className="text-lg mb-6">Oops! The page you&apos;re looking for doesn&apos;t exist.</p>
      <Link to="/" className="btn btn-primary">
        Go back to Home
      </Link>
    </div>
  );
}
