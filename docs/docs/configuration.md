---
sidebar_position: 2
---

# Configuration

**NORSE** has several important files for configuration. These files allow you to configure pieces of Norse without having to change any of the actual source code.

## app.config.json

We call this `appConfig` when referenced in the application. It holds the majority of configurations that you would need to make in the application. Below I'll cover the individual sections and their values.

**When using absolute URLs you will need to configure next.config.mjs [images section](https://nextjs.org/docs/pages/api-reference/components/image#remotepatterns)**

### brand

| Key            | Value                                                                                            | Info       |
| :------------- | :----------------------------------------------------------------------------------------------- | :--------- |
| `name`         | Company branding/name. This gets displayed in various parts of the application                   | `required` |
| `logoUrl`      | The relative OR absolute URL to your logo. This is displayed in various areas such as the header | `required` |
| `faviconUrl`   | The relative OR absolute URL to your favicon.                                                    | `required` |
| `openGraphUrl` | The absolute URL to your open graph cover image                                                  | `optional` |

### contact

| Key           | Value                                          | Info       |
| :------------ | :--------------------------------------------- | :--------- |
| `email`       | The contact email for your application.        | `optional` |
| `number`      | The contact phone number for your application  | `optional` |
| `feedbackUrl` | The URL for your feedback form IF you have one | `optional` |

### adapters

| Key        | Value                                                          | Info       |
| :--------- | :------------------------------------------------------------- | :--------- |
| `database` | `mongodb` (postgres planned for the near future)               | `required` |
| `search`   | `elasticsearch` (We may add postgres, Algolia, or Meilisearch) | `required` |
| `map`      | `mapbox` or `radar`                                            | `required` |
| `sms`      | `twilio`                                                       | `required` |

### features

#### search

| Key             | Value                                                                    | Info       |
| :-------------- | :----------------------------------------------------------------------- | :--------- |
| `defaultRadius` | `number`                                                                 | `optional` |
| `radiusOptions` | `array` of `{ "value": number }` where the value is your number in miles | `optional` |

#### map

| Key      | Value                                                                                                                  | Info       |
| :------- | :--------------------------------------------------------------------------------------------------------------------- | :--------- |
| `center` | `[longitude, latitude]` following [GeoJSON specification](https://datatracker.ietf.org/doc/html/rfc7946#section-3.1.1) | `optional` |

#### sms

This is a stub for now. There are no configurable options for SMS at this time

### pages

#### default

This is used for page defaults, such as meta tags when none available for other pages

##### - `meta`

| Key           | Value                      | Info       |
| :------------ | :------------------------- | :--------- |
| `title`       | The `meta` title tag       | `optional` |
| `description` | The `meta` description tag | `optional` |

#### home

| Key                 | Value                                                                    | Info                 |
| :------------------ | :----------------------------------------------------------------------- | :------------------- |
| `hideLocationInput` | Toggle whether or not location input should be hidden from the home page | `boolean` `optional` |
| `disableTour`       | Toggle whether or not the tour should be enabled for the home page       | `boolean` `optional` |

##### - `heroSection`

| Key                  | Value                                                                | Info       |
| :------------------- | :------------------------------------------------------------------- | :--------- |
| `backgroundImageUrl` | The relative OR absolute URL for the home page hero background image | `required` |

### resource

| Key               | Value                                                             | Info                 |
| :---------------- | :---------------------------------------------------------------- | :------------------- |
| `hideCategories`  | Whether or not to hide the categories listed on the resource page | `boolean` `optional` |
| `hideLastAssured` | Whether or not to hide the last assured date on the resource page | `boolean` `optional` |

### providers

This accepts an `array` of `data provider` shaped like below

#### data provider

| Key       | Value                                                    | Info       |
| :-------- | :------------------------------------------------------- | :--------- |
| `name`    | The name of the data provider                            | `required` |
| `logoUrl` | The relative or absolute URL of the data provider's logo | `optional` |
| `href`    | The URL for the link                                     | `optional` |

### i18n

Internationalization has the following values

| Key             | Value                                                | Info       |
| :-------------- | :--------------------------------------------------- | :--------- |
| `defaultLocale` | The default locale for your application (ie. en, es) | `required` |
| `locales`       | An array of supported locales in your application    | `required` |

## Suggestions

Suggestions are displayed as the initial list of suggestions a user will see when they focus the `search` input

These can be found in `public/locales/{locale}/suggestions.json`
If you modify these and are using more than 1 language then you will want to update the translations in the other language folders found in `public/locales/{locale}/suggestions.json`

The `JSON` structure for this should have a top level `suggestions` key with an `array` of `suggestion`

#### suggestion

| Key     | Value                                                                           | Info       |
| :------ | :------------------------------------------------------------------------------ | :--------- |
| `value` | This is the display value that is shown to the user in the suggestions dropdown | `required` |
| `term`  | A comma delimited list of taxonomy codes                                        | `required` |

## Categories

Categories are displayed on the home page under the `category` section

These can be found in `public/locales/{locale}/categories.json`
If you modify these and are using more than 1 language then you will want to update the translations in the other language folders found in `public/locales/{locale}/categories.json`

The `JSON` structure for this should have a top level `categories` key with an `array` of `category`

#### category

| Key             | Value                                                                           | Info       |
| :-------------- | :------------------------------------------------------------------------------ | :--------- |
| `name`          | The category name shown to the user                                             | `required` |
| `image`         | A relative or absolute URl to an image/icon for the category                    | `required` |
| `href`          | A URL for where this category should link to when no subcategories are provided | `optional` |
| `subcategories` | An `array` of `subcategory` seen below                                          | `optional` |

#### subcategory

| Key          | Value                                                                                      | Info       |
| :----------- | :----------------------------------------------------------------------------------------- | :--------- |
| `name`       | The subcategory name shown to the user                                                     | `required` |
| `query`      | The query for this link. (Usually a single taxonomy or comma delimited list of taxonomies) | `required` |
| `query_type` | `taxonomy` or `text` (The type of query to be made for this link)                          | `required` |

## Facets

Facets are used for elasticsearch filtering. They show up on the search page in the filter panel (when filter options are available). These need to be set up so that elasticsearch knows what facets to aggregate and use when creating the search queries.

These can be found in `public/locales/{locale}/facets.json`
If you modify these and are using more than 1 language then you will want to update the translations in the other language folders found in `public/locales/{locale}/facets.json`

The `JSON` structure for this should have a top level `facets` key with an `array` of `facet`

#### facet

| Key     | Value                                                                    | Info       |
| :------ | :----------------------------------------------------------------------- | :--------- |
| `name`  | This is the display value that is shown to the user in the filter panel  | `required` |
| `facet` | This is the field key that elasticsearch uses to create its aggregations | `required` |

## Menus

If you want to add customer links to your header or footer, then you'll want modify the `menus.json` files

These can be found in `public/locales/{locale}/menus.json`
If you modify these and are using more than 1 language then you will want to update the translations in the other language folders found in `public/locales/{locale}/menus.json`

The `JSON` structure for this should have a top level `header` or `footer` key with an `array` of `menuItem`

#### - menuItem

| Key    | Value                                                                                                      | Info       |
| :----- | :--------------------------------------------------------------------------------------------------------- | :--------- |
| `name` | The display value for the link                                                                             | `required` |
| `href` | The URL for the link                                                                                       | `required` |
| `icon` | The name of the icon you want to use. See [lucide.dev](https://lucide.dev/icons/) for available icon names | `optional` |
