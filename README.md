# 🚀 Getting started with #play14 api

Strapi comes with a full featured [Command Line Interface](https://docs.strapi.io/developer-docs/latest/developer-resources/cli/CLI.html) (CLI) which lets you scaffold and manage your project in seconds.

### `develop`

Start your Strapi application with autoReload enabled. [Learn more](https://docs.strapi.io/developer-docs/latest/developer-resources/cli/CLI.html#strapi-develop)

```
npm run develop
# or
yarn develop
```

### `start`

Start your Strapi application with autoReload disabled. [Learn more](https://docs.strapi.io/developer-docs/latest/developer-resources/cli/CLI.html#strapi-start)

```
npm run start
# or
yarn start
```

### `build`

Build your admin panel. [Learn more](https://docs.strapi.io/developer-docs/latest/developer-resources/cli/CLI.html#strapi-build)

```
npm run build
# or
yarn build
```

### Build docker image

```
docker build -t play14-api .
```

Pay attention to the . at the end of the line

### Run docker container

```
docker run -p 1337:1337 -it --env-file=./.env --name play14-api play14-api
```

This command uses the `.env` file content to provide environement variables to the container. This is mostly useful for database configuration. Alternatively, you can use the `-e` option.

For more information, refer to the [docker run](https://docs.docker.com/engine/reference/commandline/run/) documentation

### Configure upload provider

Use [Strapi Provider Upload Azure Storage](https://github.com/jakeFeldman/strapi-provider-upload-azure-storage)

## Do not update dependencies

- react-router-dom
- strapi-blurhash
- styled-components
