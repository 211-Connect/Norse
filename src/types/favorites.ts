export type Privacy = 'PRIVATE' | 'PUBLIC';

// Component Props
export interface FavoritesPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

// Base favorite list interface
interface BaseFavoriteList {
  name: string;
  description: string;
}

// Atom Type - using _id for backward compatibility with existing components
export interface FavoriteListState extends BaseFavoriteList {
  id: string;
  privacy: Privacy;
  ownerId?: string;
}

// Norse API `/favorite-list` v1 Request DTOs
export interface CreateFavoriteListDto extends BaseFavoriteList {
  public: boolean;
}

export interface UpdateFavoriteListDto extends Partial<CreateFavoriteListDto> {}

export interface SearchFavoriteListDto {
  name?: string;
  exclude?: string;
}

// Norse API `/favorite-list` v1 Response DTOs
export interface FavoriteListItemDto extends BaseFavoriteList {
  id: string;
  privacy: string;
  ownerId: string;
}

export interface PaginationResponseDto {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface FavoriteListResponseDto extends PaginationResponseDto {
  items: FavoriteListItemDto[];
}

// Internal response type for getFavoriteLists
export interface GetFavoriteListsResponse {
  data: FavoriteListState[];
  totalCount: number;
}
