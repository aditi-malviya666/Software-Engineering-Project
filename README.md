# Installation Instructions

Ensure you have the following prerequisites:
- [Docker](https://docs.docker.com/engine/install/)
- [NodeJS](https://nodejs.org/en/download)
- [pnpm](https://pnpm.io/installation)

1. Open a terminal on the directory you wish to install this project in
2. Run `git clone https://github.com/aditi-malviya666/Software-Engineering-Project` and wait for the process to complete
3. Open the downloaded project folder in VS Code or the IDE of your choice
4. Create a new file by the name `.env` in the root directory
5. Open the file `example.env` in the root directory and copy the enclosed contents to `.env`
> Changing the default value of `POSTGRES_PASSWORD` and `PGADMIN_DEFAULT_PASSWORD` is recommended but optional
6. Open a terminal in the root directory and run `docker compose -f docker-compose.dev.yaml up -d` and wait for the process to complete
> Downloading and installation of resources is expected to take some time
7. Run `pnpm run update` and wait for the process to complete

# Execution Instructions (Development mode)

## Starting execution

1. Open a terminal and run `docker compose -f docker-compose.dev.yaml up -d`
2. Run `pnpm run dev`

## Stopping execution

1. Kill the terminal running `pnpm run dev` by inputting `Ctrl + C` inside the terminal
2. Run `docker compose -f docker-compose.dev.yaml down`
> To delete all data stored in the docker containers, run `docker compose -f docker-compose.dev.yaml down --volumes`

# Execution Instructions (Production mode)

> Work in progress

# Updating Instructions

1. Ensure execution of the project has been terminated beforehand
2. Open a terminal and run `pnpm run update`