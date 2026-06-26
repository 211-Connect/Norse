type SearchInputProps = {
  query: string;
  onChange: (value: string) => void;
};

export function SearchInput({ query, onChange }: SearchInputProps) {
  return (
    <input
      value={query}
      onChange={(event) => onChange(event.target.value)}
      placeholder="Search by code or taxonomy name"
      style={{
        width: '100%',
        padding: '10px 12px',
        borderRadius: '6px',
        border: '1px solid var(--theme-elevation-250)',
      }}
    />
  );
}
