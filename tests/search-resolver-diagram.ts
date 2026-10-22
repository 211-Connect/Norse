// The search resolver as a Mermaid state diagram, generated from the machine itself so the copy in
// docs/search-intent.md cannot drift: `tests/search-resolver.test.ts` fails when they differ.
// Print it with: node --import tsx tests/search-resolver-diagram.ts
import type { AnyStateNode } from 'xstate';

import { searchResolverMachine } from '../src/app/(app)/features/search/resolver';

const guardName = (guard: unknown) =>
  typeof guard === 'string'
    ? guard
    : ((guard as { type?: string } | undefined)?.type ?? 'guard');

function lines(node: AnyStateNode, indent: string): string[] {
  const out: string[] = [];
  const children = Object.values(node.states) as AnyStateNode[];
  if (node.initial?.target?.length) {
    out.push(`${indent}[*] --> ${node.initial.target[0].key}`);
  }
  for (const child of children) {
    if (Object.keys(child.states).length) {
      out.push(`${indent}state ${child.key} {`);
      out.push(...lines(child, `${indent}  `));
      out.push(`${indent}}`);
    }
    const label = (event: string, guard: unknown) =>
      [event, guard ? `[${guardName(guard)}]` : ''].filter(Boolean).join(' ');
    for (const t of child.always ?? []) {
      for (const target of t.target ?? []) {
        out.push(
          `${indent}${child.key} --> ${target.key}: ${label('always', t.guard)}`,
        );
      }
    }
    for (const [event, list] of child.transitions) {
      for (const t of list) {
        for (const target of t.target ?? []) {
          out.push(
            `${indent}${child.key} --> ${target.key}: ${label(event, t.guard)}`,
          );
        }
      }
    }
    if (child.tags.length) {
      out.push(`${indent}note right of ${child.key}: ${child.tags.join(', ')}`);
    }
  }
  return out;
}

export function resolverDiagram(): string {
  return ['stateDiagram-v2', ...lines(searchResolverMachine.root, '  ')].join(
    '\n',
  );
}

if (process.argv[1]?.endsWith('search-resolver-diagram.ts')) {
  console.log(resolverDiagram());
}
