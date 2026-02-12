# SpyFall


## Description
A web-based implementation of the popular social deduction game SpyFall.


## Watch Video Demo
https://youtu.be/FVYtPxbIf5Q

## How to Run Locally
### `Switch branch to prod for docker compose version`
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
3. Start the client:
   ```bash
   npm run dev
   ```

The application should now be running and accessible in your web browser at the address provided by Vite (usually `http://localhost:5173`).
