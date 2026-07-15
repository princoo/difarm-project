import React, { ChangeEvent, useState } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

interface InputFieldProps {
    type?: string;
    name: string;
    label: string;
    placeholder?: string;
    registration?: any;
    defaultValue?: any;
    value?: string;
    onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
    className?: string;
    required?: boolean;
    focus?: boolean;
    error?: any;
    autoComplete?: string;
}

export const InputField: React.FC<InputFieldProps> = ({
    type = 'text',
    name,
    label,
    placeholder,
    registration,
    value,
    defaultValue,
    onChange,
    className,
    required,
    focus,
    error,
    autoComplete,
}) => {
    const [showPassword, setShowPassword] = useState(false);

    const togglePasswordVisibility = () => {
        setShowPassword((prev) => !prev);
    };

    // When react-hook-form register() is used, do not pass conflicting
    // value/defaultValue/onChange/name — that blocked edits from saving.
    const inputProps = registration
        ? {
              ...registration,
              placeholder,
              required,
              autoComplete,
              autoFocus: focus,
          }
        : {
              name,
              placeholder,
              value,
              defaultValue,
              onChange,
              required,
              autoComplete,
              autoFocus: focus,
          };

    return (
        <div className={` ${className} my-2`}>
            <label className="block text-sm font-bold  ">
                {label}
            </label>
            <div className="relative">
                <input
                    type={type === 'password' && showPassword ? 'text' : type}
                    {...inputProps}
                    className={` block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm pr-10 `}
                />
                {type === 'password' && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5">
                        <button
                            type="button"
                            onClick={togglePasswordVisibility}
                            className="focus:outline-none"
                        >
                            {showPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
                    </div>
                )}
            </div>
            {error && <p className="text-red-500 text-sm ">{error}</p>}
        </div>
    );
};
