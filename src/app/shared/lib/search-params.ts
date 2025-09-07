import { ReadonlyURLSearchParams } from 'next/navigation';

export const getSearchParamsObject = (
  searchParams: ReadonlyURLSearchParams,
) => {
  return searchParams.entries().next().value
    ? Object.fromEntries(searchParams.entries())
    : {};
};
