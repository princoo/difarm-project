import React, { useState, ChangeEvent, FormEvent } from 'react';
import { Link, useNavigate } from '@/lib/router-compat';
import { InputField } from '@/components/input';
import Logo from '@/assets/landing/logo-nav-transparent.png';
import img2 from '@/assets/istockphoto-2151351987-2048x2048-Photoroom.png';
import { useLogin } from '@/hooks/api/auth';
import { resolvePostLoginDestination } from '@/utils/postLoginRouting';
import { imageSrc } from '@/lib/image-src';
import { useSafeT } from '@/hooks/useSafeT';

const Login: React.FC = () => {
    const { t } = useSafeT();
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
                        <img src={imageSrc(Logo)} alt="DiFarm" className="mx-auto h-14 w-auto max-w-[200px] object-contain bg-transparent" />
                        <h2 className="mt-6 text-3xl font-extrabold text-primary dark:text-white">
                            {t('auth.welcomeBack')}
                        </h2>
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                            {t('auth.signInHint')}
                        </p>
                    </div>
                    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                        <InputField
                            type="email"
                            name="username"
                            label={t('auth.email')}
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
                            label={t('auth.password')}
                            placeholder={t('auth.password')}
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
                            {loadingLogin ? t('common.loading') : t('nav.signIn')}
                        </button>
                    </form>
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
