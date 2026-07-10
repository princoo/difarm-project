import { ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { Link } from '@/lib/router-compat';

export default function InternalServerErrorPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <ExclamationCircleIcon className="w-20 h-20 text-red-500 mb-4" />
      <h1 className="text-4xl font-bold mb-2">500</h1>
      <p className="text-lg mb-6">Something went wrong on our end. Please try again later.</p>
      <Link to="/" className="btn btn-primary">
        Go back to Home
      </Link>
    </div>
  );
}
