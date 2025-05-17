type Image = {
  url: string;
  width: number;
  height: number;
};

type Subcategory = {
  name: string;
  href?: string;
  query?: string;
  queryType?: string;
  target?: '_blank' | '_self';
};

export interface Category {
  name: string;
  href?: string;
  target?: '_blank' | '_self';
  image?: Image;
  query?: string;
  subcategories?: Subcategory[];
}
