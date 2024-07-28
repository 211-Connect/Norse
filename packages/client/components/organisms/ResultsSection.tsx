import {
  Box,
  MediaQuery,
  Group,
  Button,
  Stack,
  Pagination,
  Text,
  useMantineTheme,
} from '@mantine/core';
import { IconAdjustments } from '@tabler/icons-react';
import Color from 'color';
import { NoResultsCard } from '../molecules/NoResultsCard';
import { Result } from '../molecules/Result';
import { useRouter } from 'next/router';
import { Search } from '../molecules/Search';
import { useTranslation } from 'next-i18next';
import { useFilterPanelStore } from '../../lib/state/filterPanel';
import { useSession } from 'next-auth/react';
import { useMemo } from 'react';
import { IResult } from '../../lib/adapters/SearchAdapter';

type Props = {
  results: IResult[];
  currentPage: number;
  noResults: boolean;
  totalResults: number;
  totalFilters: number;
};

export function ResultsSection(props: Props) {
  const { status } = useSession();
  const filterPanel = useFilterPanelStore();
  const router = useRouter();
  const { t } = useTranslation('page-search');
  const theme = useMantineTheme();
  const coordinates = useMemo(() => {
    return ((router.query?.coords as string) ?? '')
      .split(',')
      .slice()
      .reverse()
      .join(',');
  }, [router.query.coords]);

  const changePage = async (newPage: number) => {
    await router.push({
      pathname: router.pathname,
      query: {
        ...router.query,
        page: newPage,
      },
    });

    const resultTotal = document.getElementById('result-total');
    if (resultTotal) resultTotal.scrollIntoView();
  };

  const counterStart = Math.round(
    Math.abs(
      Math.min(Math.max(props.currentPage * 25 - 25 + 1, 0), props.totalResults)
    )
  );

  const counterEnd = Math.round(
    Math.abs(Math.min(Math.max(props.currentPage * 25, 0), props.totalResults))
  );

  return (
    <>
      <Box pl="md" pt="md" pb="sm" pr="md">
        <Search />
      </Box>

      <MediaQuery largerThan="md" styles={{ justifyContent: 'flex-end' }}>
        <Group
          position={props.totalFilters > 0 ? 'apart' : 'right'}
          align="center"
          bg="primary"
          p="sm"
          pl="md"
          pr="md"
        >
          {props.totalFilters > 0 && (
            <MediaQuery largerThan="md" styles={{ display: 'none' }}>
              <Button
                variant="filled"
                leftIcon={<IconAdjustments />}
                size="xs"
                onClick={filterPanel.toggle}
              >
                {t('filter_results')}
              </Button>
            </MediaQuery>
          )}

          <Text
            id="result-total"
            sx={(t) => ({
              color: Color(t.colors.primary).isDark() ? '#fff' : '#000',
            })}
          >
            {counterStart}-{counterEnd}
            {` `}
            {t('of')}
            {` `}
            {props?.totalResults?.toLocaleString()}
          </Text>
        </Group>
      </MediaQuery>

      <Stack spacing="md" pr="md" pl="md">
        {props.noResults && (
          <NoResultsCard
            router={router}
            showAltSubtitle={props.totalResults === 0}
          />
        )}

        {props.results.map((result) => {
          return (
            <Result
              key={result._id}
              id={result.id}
              serviceName={result.serviceName}
              name={result.name}
              description={result.description}
              phone={result.phone}
              website={result.website}
              address={result.address}
              location={result.location}
              sessionStatus={status}
              theme={theme}
              router={router}
              coordinates={coordinates}
            />
          );
        })}

        {Math.ceil(props.totalResults / 25) > 1 && (
          <Pagination
            total={Math.ceil(props.totalResults / 25)}
            m="0 auto"
            mb="md"
            onChange={changePage}
            defaultValue={props.currentPage}
          />
        )}
      </Stack>
    </>
  );
}
