export type Privacy = 'PRIVATE' | 'PUBLIC';

// Component Props
export interface FavoritesPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

// Atom Type
export interface FavoriteListState {
  _id: string;
  name: string;
  description: string;
  privacy: Privacy;
  ownerId?: string;
}


// Norse API `/favorite-list` v2 Response Types
export interface CreateFavoriteListDto {
  name: string;
  description: string;
  public: boolean;
}

export interface UpdateFavoriteListDto extends Partial<CreateFavoriteListDto> {}

export interface SearchFavoriteListDto {
  name?: string;
  exclude?: string;
}

interface FavoriteListHitSource {
  id: string;
  name: string;
  description: string;
  privacy: Privacy;
  ownerId: string;
}

interface FavoriteListHit {
  _index: string;
  _id: string;
  _score: number;
  _source: FavoriteListHitSource;
}

interface ShardInfo {
  total: number;
  successful: number;
  skipped: number;
  failed: number;
}

interface TotalHits {
  value: number;
  relation: string;
}

interface FavoriteListHitsContainer {
  total: TotalHits;
  max_score: number | null;
  hits: FavoriteListHit[];
}

interface SearchResponse {
  took: number;
  timed_out: boolean;
  _shards: ShardInfo;
  hits: FavoriteListHitsContainer;
}

export interface FavoriteListV2Response {
  search: SearchResponse;
}

export interface GetFavoriteListsResponse {
  data: FavoriteListState[];
  totalCount: number;
}
