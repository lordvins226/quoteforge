interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Input({ label, className = "", ...props }: InputProps) {
  return (
    <label className="flex flex-col gap-1">
      {label && <span className="text-xs text-neutral-400">{label}</span>}
      <input
        className={`bg-neutral-900 border border-neutral-700 rounded px-2 py-1.5 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-teal-500 ${className}`}
        {...props}
      />
    </label>
  );
}
