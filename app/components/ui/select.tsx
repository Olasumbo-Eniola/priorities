import type { SelectHTMLAttributes } from "react";

type SelectOption<T extends string> = {
  label: string;
  value: T;
};

type SelectProps<T extends string> = Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  "children"
> & {
  options: readonly SelectOption<T>[];
};

export function Select<T extends string>({
  options,
  className,
  ...props
}: SelectProps<T>) {
  return (
    <select
      {...props}
      className={["app-select", className].filter(Boolean).join(" ")}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
