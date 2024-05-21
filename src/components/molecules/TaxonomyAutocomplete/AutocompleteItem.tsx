import { SelectItemProps, Text, Badge, Flex } from '@mantine/core';
import { forwardRef } from 'react';

interface ItemProps extends SelectItemProps {
  term: string;
  group?: string;
  group_label?: string;
}

export const AutoCompleteItem = forwardRef<HTMLDivElement, ItemProps>(
  function Item(
    { value, term, group, group_label, ...others }: ItemProps,
    ref
  ) {
    return (
      <div ref={ref} {...others}>
        <Flex
          justify="space-between"
          wrap="nowrap"
          sx={{ wordBreak: 'normal' }}
        >
          <Text>{value}</Text>
          {group_label === 'Taxonomies' && (
            <Badge maw="100px" fullWidth>
              {term}
            </Badge>
          )}
        </Flex>
      </div>
    );
  }
);
