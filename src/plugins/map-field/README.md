# Strapi plugin map-field

A quick description of map-field.

## Configure the plugin

```js
// plugins.js
module.exports = ({ env }) => ({

  ...

  "map-field": {
    enabled: true,
    resolve: './src/plugins/map-field'
  },

  ...

});

```

## Add a json field and enable module

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


## Configure webpack 

You need to configure `webpack` to export the `MAPBOX_ACCESS_TOKEN` variables from the `.env` to the client.

For that, go to `src/admin/webpack.config.js` and add the following config.

```js
//webpack.config.js

module.exports = (config, webpack) => {
    config.plugins.push(
      new webpack.DefinePlugin({
        MAPBOX_VARIABLES: {
          MAPBOX_ACCESS_TOKEN: JSON.stringify(process.env.MAPBOX_ACCESS_TOKEN),
        },
      })
    );
    return config;
};
```

[More details](https://forum.strapi.io/t/use-env-in-local-plugin/992)
