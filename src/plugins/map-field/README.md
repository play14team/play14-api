# Strapi plugin map-field

A quick description of map-field.

Inspired by
* [Customizing fields in the Strapi admin panel by Cyril Lopez](https://www.youtube.com/watch?v=55KJ2sCX8ws)

## Configure the plugin

```js
// plugins.js
module.exports = ({ env }) => ({

  ...

  "map-field": {
    enabled: true,
  },

  ...

});

```

## Provide a valid Mapbox Access Token

Add a valid [Mapbox Access Token](https://docs.mapbox.com/help/getting-started/access-tokens/) as an environment variable in your `.env` file

```bash
# .env
STRAPI_ADMIN_MAPBOX_ACCESS_TOKEN=pk.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.xxxxxxxxxxxxxxxxx

```


## Add a json field and enable the module

```js
// in your content-type definition
{
  "kind": "collectionType",
  "collectionName": "dummy",

  ...

  "location": {
      "type": "json",
      "pluginOptions": {
        "map-field": {
          "enabled": true
        }
      }
    }
  }
}

```
