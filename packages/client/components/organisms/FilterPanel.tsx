import { useFilterPanelStore } from 'lib/state/filterPanel';
import {
  Badge,
  Box,
  Checkbox,
  Drawer,
  Flex,
  MediaQuery,
  Stack,
  Title,
  useMantineTheme,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { useRouter } from 'next/router';
import qs from 'qs';
import { Fragment } from 'react';

export function FilterPanel({ filters }: any) {
  const router = useRouter();
  const theme = useMantineTheme();
  const mq = useMediaQuery(`(max-width: ${theme.breakpoints.sm}px)`);
  const state = useFilterPanelStore();

  function getFilters() {
    const formattedFilters = [];
    for (const key in filters) {
      if (filters[key].buckets.length > 0) {
        formattedFilters.push({
          name: key,
          displayName: key
            .split('_')
            .map((el) => el[0].toUpperCase() + el.slice(1))
            .join(' '),
          buckets: filters[key].buckets,
        });
      }
    }

    return formattedFilters;
  }

  const q: any = qs.parse(router.asPath.slice(router.asPath.indexOf('?') + 1));
  const myFilters = getFilters();

  if (myFilters.length === 0) return null;

  return (
    <>
      <MediaQuery smallerThan="md" styles={{ display: 'none' }}>
        <Box maw="250px" w="100%">
          <Stack spacing="md" p="md">
            {getFilters().map((el) => {
              return (
                <div key={el.name}>
                  <Title order={5} mb="sm">
                    {el.displayName}
                  </Title>

                  <Stack>
                    {el.buckets.map((innerEl: any) => {
                      return (
                        <Flex key={innerEl.key} direction="row">
                          <Checkbox
                            sx={{ flex: 1 }}
                            styles={(theme) => ({
                              labelWrapper: { fontSize: theme.fontSizes.xs },
                            })}
                            checked={
                              q.filters?.[el.name]?.includes(innerEl.key) ??
                              false
                            }
                            label={innerEl.key}
                            onChange={(e) => {
                              const q: any = qs.parse(
                                router.asPath.slice(
                                  router.asPath.indexOf('?') + 1
                                )
                              );

                              if (!q.filters) {
                                q.filters = {};
                              }

                              if (!(q.filters[el.name] instanceof Array)) {
                                q.filters[el.name] = [];
                              }

                              if (
                                e.target.checked &&
                                !q.filters[el.name].includes(innerEl.key)
                              ) {
                                q.filters[el.name].push(innerEl.key);
                              } else {
                                const idx = q.filters[el.name].findIndex(
                                  (v: any) => v === innerEl.key
                                );
                                q.filters[el.name].splice(idx, 1);
                              }

                              router.push(`/search?${qs.stringify(q)}`);
                            }}
                          />

                          <Badge color="primary">{innerEl.doc_count}</Badge>
                        </Flex>
                      );
                    })}
                  </Stack>
                </div>
              );
            })}
          </Stack>
        </Box>
      </MediaQuery>

      <MediaQuery largerThan="md" styles={{ display: 'none' }}>
        <Drawer
          opened={state.isOpen}
          position={mq ? 'bottom' : 'left'}
          onClose={state.toggle}
          sx={{
            '.mantine-Paper-root': {
              overflow: 'auto',
              paddingLeft: theme.spacing.lg,
              paddingRight: theme.spacing.lg,
            },
          }}
        >
          {getFilters().map((el) => {
            return (
              <Fragment key={el.name}>
                <Title order={5} mb="sm" mt="sm">
                  {el.displayName}
                </Title>

                <Stack>
                  {el.buckets.map((innerEl: any) => {
                    return (
                      <Flex key={innerEl.key} direction="row">
                        <Checkbox
                          sx={{ flex: 1 }}
                          styles={(theme) => ({
                            labelWrapper: { fontSize: theme.fontSizes.xs },
                          })}
                          checked={
                            q.filters?.[el.name]?.includes(innerEl.key) ?? false
                          }
                          label={innerEl.key}
                          onChange={(e) => {
                            const q: any = qs.parse(
                              router.asPath.slice(
                                router.asPath.indexOf('?') + 1
                              )
                            );

                            if (!q.filters) {
                              q.filters = {};
                            }

                            if (!(q.filters[el.name] instanceof Array)) {
                              q.filters[el.name] = [];
                            }

                            if (
                              e.target.checked &&
                              !q.filters[el.name].includes(innerEl.key)
                            ) {
                              q.filters[el.name].push(innerEl.key);
                            } else {
                              const idx = q.filters[el.name].findIndex(
                                (v: any) => v === innerEl.key
                              );
                              q.filters[el.name].splice(idx, 1);
                            }

                            router.push(`/search?${qs.stringify(q)}`);
                          }}
                        />

                        <Badge color="primary">{innerEl.doc_count}</Badge>
                      </Flex>
                    );
                  })}
                </Stack>
              </Fragment>
            );
          })}
        </Drawer>
      </MediaQuery>
    </>
  );
}
