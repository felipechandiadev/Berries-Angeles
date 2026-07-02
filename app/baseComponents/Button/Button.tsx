import React from "react";

export type ButtonVariant = "primary" | "secondary" | "outlined" | "text";

interface ButtonProps {
  children: React.ReactNode;
  variant?: ButtonVariant;
  className?: string;
  disabled?: boolean;
  [key: string]: any;
}

const variantClasses: Record<string, string> = {
  primary: "btn-contained-primary cursor-pointer",
  secondary: "btn-contained-secondary cursor-pointer",
  outlined: "btn-outlined cursor-pointer",
  text: "btn-text cursor-pointer",
};

const disabledClasses: Record<string, string> = {
  primary: "btn-contained-primary opacity-50 cursor-not-allowed",
  secondary: "btn-contained-secondary opacity-50 cursor-not-allowed",
  outlined: "btn-outlined opacity-50 cursor-not-allowed",
  text: "btn-text opacity-50 cursor-not-allowed",
};

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  className = "",
  disabled = false,
  ...props
}) => {
  const buttonClasses = disabled
    ? `${disabledClasses[variant] || disabledClasses.primary} ${className}`
    : `${variantClasses[variant] || variantClasses.primary} ${className}`;

  return (
    <button
      className={buttonClasses}
      data-test-id="button-root"
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};
