module.exports = {
  plugins: [],
  norseConfig: {
    brand: {
      name: 'Norse',
      logoUrl: '/logo.png',
      faviconUrl: '/favicon.ico',
      openGraphUrl: '',
    },
    contact: {
      email: '',
      number: '',
      feedbackUrl: '',
    },
    search: {
      radiusOptions: [],
      defaultRadius: '0',
    },
    features: {
      map: {
        plugin: 'mapbox',
      },
      sms: null,
    },
    plugins: [],
    theme: {
      primaryShade: 4,
      secondaryShade: 4,
      primaryPalette: [
        '#C7EEF9',
        '#92D9F4',
        '#58B1DE',
        '#2F86BD',
        '#005191',
        '#003E7C',
        '#002E68',
        '#002154',
        '#001745',
      ],
      secondaryPalette: [
        '#FFF5DC',
        '#FFE9B9',
        '#FFDA96',
        '#FFCB7C',
        '#FFB351',
        '#DB8E3B',
        '#B76C28',
        '#934E19',
        '#7A380F',
      ],
      borderRadius: '6px',
    },
    pages: {
      home: {
        heroSection: {
          backgroundImageUrl: '/hero.jpg',
        },
        meta: {
          title: 'NORSE - New Open Resource Search Engine',
          description:
            "211 connects callers, at no cost, to critical health and human services in their community. If you're unable to find a service, please dial 211 for assistance.",
        },
        showLocationInput: false,
      },
      resource: {
        hideCategories: false,
        hideLastAssured: false,
      },
    },
    menus: {
      header: [],
      footer: [],
    },
    providers: [
      {
        name: 'Community Resources',
        logo: '/logo.png',
        href: 'https://connect211.com',
      },
    ],
  },
};
