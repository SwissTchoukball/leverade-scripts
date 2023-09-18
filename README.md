# Leverade scripts

TypeScript scripts to be run manually in order to accomplish batch operations on Leverade using their API.

## Requirements

- Node.js
- npm
- nvm

## Setup

Set proper Node.js version

```bash
$ nvm install
# based on Node.js version set in .nvmrc
```

Install dependencies

```bash
$ npm install
```

Make a copy of `.env.example` and name it `.env`. Set the environment variables in `.env`.

## Usage

Available scripts are listed in the `scripts` section of `package.json`. Their code is in the `src` directory.

In the code, look at the `USAGE` comments to adjust the parameters to your needs.

Some code is also commented on purpose to prevent accidental changes. `USAGE` comments also point to the code to be uncommented.
