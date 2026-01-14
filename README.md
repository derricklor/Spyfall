# SpyFall

## Description
A web-based implementation of the popular social deduction game SpyFall.

## How to Run Locally
- Setup and run the server and client on your localhost machine.

### Prerequisites
- Node.js and npm installed.
- Vite (for client-side development)
- MongoDB Community Edition installed and running as a service.

#### MongoDB Installation (Windows)
1.  Download the MongoDB Community Server installer (.msi) from the [MongoDB Download Center](https://www.mongodb.com/try/download/community).
2.  Run the installer.
3.  Choose the "Complete" setup type.
4.  On the "Service Configuration" screen, make sure "Install MongoDB as a Service" is selected and keep the default settings.
5.  Complete the installation. MongoDB should now be running in the background as a Windows service.

### Backend (Server)
1. Navigate to the `server` directory:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the server:
   ```bash
   npm run dev
   ```

### Frontend (Client)
1. In a separate terminal, navigate to the `client` directory:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the client (Vite development server):
   ```bash
   npm run dev
   ```

The application should now be running and accessible in your web browser at the address provided by Vite (usually `http://localhost:5173`).

## Serving the Client-Side Application for Production

To serve the client-side application using the Node.js server, you need to build the Vite project and then copy the generated static assets to the server's public directory.

1.  **Build the Client Application:**
    Navigate to the `client` directory and run the build command:
    ```bash
    cd client
    npm run build
    ```
    This will create a `dist` directory inside your `client` directory, containing the optimized HTML, CSS, and JavaScript files.

2.  **Copy Built Assets to Server's Public Directory:**
    Navigate back to the project root and copy the contents of `client/dist` to `server/public`.
    ```bash
    # From the project root
    cp -r client/dist/* server/public/
    ```
    Now, when you start the server (either `npm run dev` in the `server` directory or using Docker Compose), it will serve the client-side application from `server/public`.

## Production Setup with Docker Compose

This project is configured to run in a production-like environment using Docker Compose. This setup includes the Node.js server and a MongoDB database. The node and mongo service are setup to run under the same network and be able to connect and exchange information. A volume is created for the mongo service and be able to save persistent information.

### Prerequisites

*   [Docker](https://docs.docker.com/get-docker/)
*   [Docker Compose](https://docs.docker.com/compose/install/)

### Running the Application

1.  **Build and run the services:**
    Open a terminal in the root of the project and run the following command:
    ```bash
    docker-compose up
    ```
    This will build the server's Docker image, start the `server` and `mongo` services, and display the logs in your terminal.

    To run the services in the background (detached mode), use the `-d` flag:
    ```bash
    docker-compose up -d
    ```

2.  **Stopping the services:**
    If the services are running in the foreground, press `Ctrl+C` to stop them. If running in detached mode, use the following command:
    ```bash
    docker-compose down
    ```

### Configuration

The Docker Compose setup uses environment secret variables defined in the `.env` file. These variables are directly linked to `docker-compose.yml` file and are not uploaded for security reason. 

A basic `.env` file contains:

```yaml
NODE_ENV=production
PORT=3000
# MongoDB connection string for local development, change localhost to mongo service name when using docker compose
MONGO_URI=mongodb://localhost:27017/spyfall_db

# CORS origin for the frontend, change this to your frontend's production URL
CORS_ORIGIN=http://localhost:5173
```

For a production deployment, you may need to change the `CORS_ORIGIN` to match your frontend's URL. As well as replace the mongo db uri to match your production environment.
