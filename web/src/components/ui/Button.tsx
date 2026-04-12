interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
}

export function Button({ variant = "secondary", size = "md", className = "", children, ...props }: ButtonProps) {
  const base = "inline-flex items-center justify-center font-medium rounded-md transition-colors disabled:opacity-50";
  const sizes = { sm: "px-2 py-1 text-xs", md: "px-3 py-1.5 text-sm" };
  const variants = {
    primary: "bg-teal-600 text-white hover:bg-teal-700",
    secondary: "bg-neutral-800 text-neutral-200 hover:bg-neutral-700 border border-neutral-700",
    ghost: "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800",
    danger: "text-red-400 hover:text-red-300 hover:bg-red-950",
  };

  return (
    <button className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}
