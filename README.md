kaltura-copy
============

CLI tool to for account management and migration

## How to install

Get [Docker](https://store.docker.com/search?type=edition&offering=community) and install it for your platform.

## Steps to Get Started


### Create Environment Variables

```bash
# Create a .env file in the repository root

SOURCE_PARTNER_ID=<Source Account ID>
SOURCE_PARTNER_SECRET=<Source Account Secret Key>
DEST_PARTNER_ID=<Destination Account ID>
DEST_PARTNER_SECRET=<Destination Account Secret Key>
```

### Build the Docker images

After the `.env` file is created in the repository root, we will build the docker container
to be able to run the CLI

```bash
docker-compose build
```

### Install dependencies into Docker container

You must install the dependencies first before you can start using the CLI.  The dependencies
will be saved in the `node_modules` folder in the root of the directory.

```bash
docker-compose run app npm install
```

### Running the CLI in a Docker container

Running the CLI in the Docker container

```bash
docker-compose run app kcopy --help
```

### Tearing down the running Docker containers

```bash
docker-compose down
```
