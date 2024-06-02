import { Anchor } from '@/components/anchor';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import parse from 'html-parser-lite';

type Node = {
  tagName: string;
  nodeType?: number;
  publicId?: string;
  systemId?: string;
  name?: string;
  childNodes?: Node[];
};

export function parseHtml(html: string) {
  const nodes: Node[] = parse(html);
  for (const node of nodes) {
  }
}
