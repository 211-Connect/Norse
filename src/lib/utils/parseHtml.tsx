import {
  Anchor,
  Badge,
  Button,
  Divider,
  Flex,
  Grid,
  Group,
  Stack,
  Text,
  Title,
} from '@mantine/core';
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
      return (
        <Title order={1} {...props}>
          {children}
        </Title>
      );
    }

    if (node.name === 'h2') {
      return (
        <Title order={2} {...props}>
          {children}
        </Title>
      );
    }

    if (node.name === 'h3') {
      return (
        <Title order={3} {...props}>
          {children}
        </Title>
      );
    }

    if (node.name === 'h4') {
      return (
        <Title order={4} {...props}>
          {children}
        </Title>
      );
    }

    if (node.name === 'h5') {
      return (
        <Title order={5} {...props}>
          {children}
        </Title>
      );
    }

    if (node.name === 'h6') {
      return (
        <Title order={6} {...props}>
          {children}
        </Title>
      );
    }

    if (node.name === 'a') {
      return <Anchor {...props}>{children}</Anchor>;
    }

    if (node.name === 'p') {
      return <Text {...props}>{children}</Text>;
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
      return <Divider {...props} />;
    }

    if (node.name === 'group') {
      return <Group {...props}>{children}</Group>;
    }

    if (node.name === 'stack') {
      return <Stack {...props}>{children}</Stack>;
    }

    if (node.name === 'flex') {
      return <Flex {...props}>{children}</Flex>;
    }

    if (node.name === 'button') {
      return <Button {...props}>{children}</Button>;
    }

    if (node.name === 'grid') {
      return <Grid {...props}>{children}</Grid>;
    }

    if (node.name === 'grid-col') {
      return <Grid.Col {...props}>{children}</Grid.Col>;
    }
  }
}
