export type DataProvider = {
  name: string;
  href: string;
  logo: string;
};

export type Alert = {
  text: string;
  buttonText: string;
  href: string;
};

export type Category = {
  image?: string;
  name: string;
  href?: string;
  target?: string;
  subcategories: any[];
};

export type Subcategory = {
  name: string;
  href: string;
  query: string;
  target: string;
  queryType: string;
};

export type Menu = {
  name: string;
  target: string;
  href: string;
};
