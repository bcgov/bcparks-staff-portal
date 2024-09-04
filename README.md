# BC Parks Staff Portal

Expanding and modernizing the BC Parks Dates of Operation tool.

## Structure

This project consists of a REST API server in `backend/` and a React JS frontend in `frontend/`. For more details, refer to the specific [backend README](./backend/README.md) and [frontend README](./frontend/README.md) files.

## Requirements

This project is intended to be developed in VS Code Dev Containers. You will need VS Code and Docker installed on your host machine.

When you open this workspace, VS Code should prompt you to install the [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) if you don't already have it.

All necessary dependencies are included in the Dev Containers. However, if you plan to edit the configuration files in the project root on your host machine, it's recommended to have Prettier, ESLint, and EditorConfig installed. See `/.vscode/extensions.json` for details.

If you plan to run the project locally, outside of Docker, you'll need Node.js installed. Check the `engines` field in each `package.json` file for the required version.

## Dev Containers

When you open the project's root directory in VS Code, you should be prompted to open the project in a Dev Container. You can choose to open the `frontend` or `backend` container.

The containers are managed by `/docker-compose.dev.yml`, so opening one container will start all of them.

Use the command palette (`F1` or `CTRL+SHIFT+P`) in VS Code to work with the containers. The Dev Containers extension also adds a menu button to the bottom-left corner of the status bar.

### Recommended Dev Containers workflow

The servers do not automatically start in the containers, so you'll need to start them manually.

1. Open the project root locally in VS Code.
2. **Dev Containers: Reopen in Container** - then select `backend`.
3. **New Window** - Open a new VS Code window and reopen the project root.
4. **Dev Containers: Reopen in Container** - then select `frontend`.

Now you'll have two VS Code windows open, each with a Dev Container for a different part of the app. Refer to the [backend README](./backend/README.md) and [frontend README](./frontend/README.md) for details on starting the dev servers (e.g., `npm run dev` in the integrated terminal).

The Dev Containers will not shut down automatically. This is so the containers don't stop when you close one window. You can manually stop them in Docker Desktop by clicking the Stop button in the Actions column.

Alternatively, you can stop the project's containers from the command line with `docker compose`:

```sh
# Stop the dev containers
docker compose -f docker-compose.dev.yml stop
```
