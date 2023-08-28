import useApp from 'src/lib/useApp';

export default function FilterSection({
  name,
  children,
}: { name: string } & { children: React.ReactNode }) {
  const app = useApp();

  const section = app.getFilter(name);
  if (section) return section;

  return children;
}
