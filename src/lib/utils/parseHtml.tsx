import { Anchor } from '@/components/anchor';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import parse, {
  attributesToProps,
  DOMNode,
  domToReact,
  Element,
} from 'html-react-parser';

export function parseHtml(
  html: string,
  config?: { parseLineBreaks?: boolean }
) {
  if (config?.parseLineBreaks) {
    html = html.replace(/\n/g, '<br />');
  }

  return parse(html, {
    replace: replacer,
  });
}

function parseToReact(children: DOMNode[]) {
  return domToReact(children, {
    replace: replacer,
  });
}

function replacer(node: DOMNode) {
  if (node instanceof Element) {
    const props = attributesToProps(node.attribs);
    const children = parseToReact(node.children);

    if (node.name === 'h1') {
      return <h1 {...props}>{children}</h1>;
    }

    if (node.name === 'h2') {
      return <h2 {...props}>{children}</h2>;
    }

    if (node.name === 'h3') {
      return <h3 {...props}>{children}</h3>;
    }

    if (node.name === 'h4') {
      return <h4 {...props}>{children}</h4>;
    }

    if (node.name === 'h5') {
      return <h5 {...props}>{children}</h5>;
    }

    if (node.name === 'h6') {
      return <h6 {...props}>{children}</h6>;
    }

    if (node.name === 'a') {
      return (
        <Anchor href={props.href} {...props}>
          {children}
        </Anchor>
      );
    }

    if (node.name === 'p') {
      return <p {...props}>{children}</p>;
    }

    if (node.name === 'span') {
      return <span {...props}>{children}</span>;
    }

    if (node.name === 'badge') {
      return <Badge {...props}>{children}</Badge>;
    }

    if (node.name === 'br') {
      return <br />;
    }

    if (node.name === 'hr') {
      return <Separator {...props} />;
    }

    if (node.name === 'group') {
      return (
        <div className="flex gap-2" {...props}>
          {children}
        </div>
      );
    }

    if (node.name === 'stack') {
      return (
        <div className="flex flex-col gap-2" {...props}>
          {children}
        </div>
      );
    }

    if (node.name === 'flex') {
      return (
        <div className="flex" {...props}>
          {children}
        </div>
      );
    }

    if (node.name === 'button') {
      return <Button {...props}>{children}</Button>;
    }

    if (node.name === 'grid') {
      return (
        <div className="grid" {...props}>
          {children}
        </div>
      );
    }
  }
}
