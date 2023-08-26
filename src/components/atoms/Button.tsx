export default function Button({ children }: { children: React.ReactNode }) {
  return (
    <button className="rounded bg-primary-500 pl-3 pr-3 pt-1 pb-1 text-white text-base hover:bg-primary-400 transition-colors">
      {children}
    </button>
  );
}
