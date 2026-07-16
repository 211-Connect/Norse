import { Input } from './input';

type ColorPickerProps = {
  id?: string;
  value: string;
  disabled?: boolean;
  placeholder?: string;
  onChange: (value: string) => void;
};

export function ColorPicker({
  id,
  value,
  disabled,
  placeholder,
  onChange,
}: ColorPickerProps) {
  const normalizedColor = value?.trim() || '#0f172a';

  return (
    <div className="flex items-center gap-2">
      <input
        id={id}
        type="color"
        value={normalizedColor}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="border-control-border h-9 w-12 cursor-pointer rounded-md border bg-transparent p-1 disabled:cursor-not-allowed disabled:opacity-50"
      />
      <Input
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
