import clsx from "clsx";
import { UseFormRegisterReturn } from "react-hook-form";
import { FieldWrapper, FieldWrapperPassThroughProps } from "../fieldwrapper";
import React from "react";

type InputFieldProps = FieldWrapperPassThroughProps & {
  type?: "text" | "number" | "email" | "date" | "textarea";
  placeholder?: string;
  focus?: boolean;
  onChange?: (value: any) => void;
  loading?: boolean;
  defaultValue?: string;
  value?: string;
  disabled?: boolean;
  className?: string;
  registration: Partial<UseFormRegisterReturn>;
};

export const TextareaField = (props: InputFieldProps) => {
  const {
    type = "text",
    label,
    placeholder,
    defaultValue,
    focus = false,
    loading = false,
    disabled,
    value,
    onChange,
    error,
    registration,
    className,
  } = props;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { value } = e.target;
    onChange && onChange(value);
  };

  if (type === "textarea") {
    return (
      <FieldWrapper label={label} error={error}>
        <textarea
          placeholder={placeholder}
          autoComplete="off"
          autoFocus={focus ?? true}
          value={value}
          disabled={loading || disabled}
          onChange={handleInputChange}
          defaultValue={defaultValue}
          className={clsx(
            "form-input",
            error?.message && "border-danger focus:border-danger focus:ring-danger",
            "h-36", // You can adjust the height as needed
            className
          )}
          {...registration}
        />
      </FieldWrapper>
    );
  }

  return (
    <FieldWrapper label={label} error={error}>
      <div className="relative flex w-full flex-wrap items-center mb-3">
        <textarea
          
          placeholder={placeholder}
          autoComplete="off"
          autoFocus={focus ?? true}
          value={value}
          disabled={loading || disabled}
          onChange={handleInputChange}
          defaultValue={defaultValue}
          className={clsx(
            "form-textarea",
            error?.message && "border-danger focus:border-danger focus:ring-danger",
            className
          )}
          {...registration}
        />
      </div>
    </FieldWrapper>
  );
};
