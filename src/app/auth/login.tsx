import React, { useState, ChangeEvent, FormEvent } from 'react';
import { Link, useNavigate } from '@/lib/router-compat';
import { InputField } from '@/components/input';
import Logo from '@/assets/logo.png';
import img2 from '@/assets/istockphoto-2151351987-2048x2048-Photoroom.png';
import { useLogin } from '@/hooks/api/auth';
import { resolvePostLoginDestination } from '@/utils/postLoginRouting';
import { imageSrc } from '@/lib/image-src';

const DEMO_ACCOUNTS = [
  { label: 'Super Admin', email: 'superadmin@difarm.com', hint: 'Full access — activates farms & accounts' },
  { label: 'Farm Admin', email: 'admin@difarm.com', hint: 'Creates farms & managers (farm-scoped)' },
  { label: 'Farm Manager', email: 'manager@difarm.com', hint: 'Works on assigned activated farm' },
];

const DEMO_PASSWORD = 'Difarm123';

const Login: React.FC = () => {
    const navigate = useNavigate();
    const { loadingLogin, login } = useLogin();
    const [credentials, setCredentials] = useState({ username: '', password: '' });

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setCredentials({
            ...credentials,
            [name]: value,
        });
    };

    const fillDemo = (email: string) => {
        setCredentials({ username: email, password: DEMO_PASSWORD });
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const response = await login(credentials);
        if (response) {
            const userFound = response.user?.userFound ?? JSON.parse(localStorage.getItem('Farm_user') || '{}');
            try {
                const { path } = await resolvePostLoginDestination(userFound);
                navigate(path, { replace: true });
            } catch {
                navigate('/choose-farm', { replace: true });
            }
        }
    };

    return (
        <div className="bg-white dark:bg-black min-h-screen grid sm:grid-cols-2 grid-cols-1 font-outfit ">
            <div className="flex justify-center items-center">
                <div className="max-w-md w-full space-y-8 p-2">
                    <div className="text-center">
                        <img src={imageSrc(Logo)} alt="Farm Logo" className="w-32 mx-auto" />
                        <h2 className="mt-6 text-3xl font-extrabold text-primary dark:text-white">
                            Welcome back
                        </h2>
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                            Sign in with your email and password
                        </p>
                    </div>
                    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                        <InputField
                            type="email"
                            name="username"
                            label="Email"
                            placeholder="you@difarm.com"
                            value={credentials.username}
                            onChange={handleChange}
                            className="h-13"
                            required
                            autoComplete="email"
                        />
                        <InputField
                            type="password"
                            name="password"
                            label="Password"
                            placeholder="Enter your password"
                            value={credentials.password}
                            onChange={handleChange}
                            className="h-13"
                            required
                            autoComplete="current-password"
                        />
                        <div className="flex items-center justify-between">
                            <Link to="/reset-password" className="text-sm font-medium text-teal-600 hover:text-teal-500">
                                Forgot your password?
                            </Link>
                        </div>
                        <button
                            type="submit"
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                            disabled={loadingLogin}
                        >
                            {loadingLogin ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>

                    <div className="rounded-lg border border-teal-100 bg-teal-50/80 p-4 text-sm dark:border-teal-900 dark:bg-teal-950/40">
                        <p className="font-semibold text-teal-800 dark:text-teal-200 mb-2">
                            Quick login (password: {DEMO_PASSWORD})
                        </p>
                        <div className="space-y-2">
                            {DEMO_ACCOUNTS.map((account) => (
                                <button
                                    key={account.email}
                                    type="button"
                                    onClick={() => fillDemo(account.email)}
                                    className="flex w-full items-center justify-between rounded-md bg-white px-3 py-2 text-left text-gray-700 shadow-sm hover:bg-teal-100 dark:bg-black dark:text-gray-200 dark:hover:bg-teal-900/50"
                                >
                                    <span className="font-medium">{account.label}</span>
                                    <span className="text-right">
                                      <span className="block text-teal-700 dark:text-teal-300">{account.email}</span>
                                      {'hint' in account && (
                                        <span className="block text-xs text-gray-500 dark:text-gray-400">{account.hint}</span>
                                      )}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            <div className="bg-cover h-full" style={{ backgroundImage: `url(${imageSrc(img2)})` }}>
                <div className="flex h-full items-center bg-gray-900 bg-opacity-40 px-20">
                    <div>
                        <h2 className="text-3xl font-bold text-white sm:text-4xl">
                            Welcome to Farm
                        </h2>
                        <p className="mt-3 max-w-2xl text-2xl text-gray-300">
                            Bringing you closer to nature.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
