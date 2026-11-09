# Student Complaint and Feedback Management System

A full-stack application for students to submit and track complaints and for
administrators to manage them. The project uses MongoDB, Express, React, and
Node.js (MERN).

## Features

### Students

- Register and log in
- Submit complaints in categories such as Academics, Hostel, Canteen,
  Infrastructure, Transport, and Others
- View and track their complaints
- Update or delete complaints while they are pending
- Read administrator remarks

### Administrators

- View and filter complaints by status and category
- Change complaint status and add remarks
- View complaint statistics

## Requirements

For the Docker setup, install Docker Desktop (Windows/macOS) or Docker Engine
with the Docker Compose plugin (Linux). Start Docker before running the
commands.

For local development, install Node.js 22.12 or newer and npm. MongoDB must be
available locally or as a Docker container.

## Continuous integration

GitHub Actions runs the workflow in `.github/workflows/ci.yml` on pushes to
`main`, pull requests targeting `main`, and manual dispatch. The workflow
installs the frontend dependencies, runs ESLint and the Vite production build,
then builds the API and frontend Docker images. The server currently has no
automated test suite, so API tests and deployment are not part of this
workflow.

## Run the full application with Docker

This is the recommended way to start from a clean checkout. Docker Compose
starts MongoDB, seeds the administrator account, starts the API, and serves the
production frontend.

1. If starting from GitHub, clone the repository and enter its folder:

   ```bash
   git clone https://github.com/2403A51L03/Devops_Project.git
   cd Devops_Project
   ```

   Replace `<repository-url>` with the URL of the repository you are using. If
   you already have the project folder, open a terminal in that folder.

2. (Recommended) Copy `.env.example` to `.env` and edit the values before
   starting the application. In PowerShell:

   ```powershell
   Copy-Item .env.example .env
   ```

   Set `JWT_SECRET` to a long, unique secret and choose an administrator
   password. The example values are for local development only. Do not commit
   `.env` or use the sample credentials in a deployed environment.

3. Build and start the services from the project root:

   ```bash
   docker compose up --build -d
   ```

4. Open the application:

   - Frontend: <http://localhost:8081>
   - API health endpoint: <http://localhost:5000/>

   The initial administrator credentials are the `ADMIN_EMAIL` and
   `ADMIN_PASSWORD` values in `.env` (or `admin@college.com` and `admin123` if
   you did not create `.env`). Register a student account from the application.

Useful Docker commands:

```bash
docker compose ps
docker compose logs -f
docker compose down
```

MongoDB data is stored in the `mongodb_data` Docker volume and is retained when
containers are stopped or removed. To permanently delete the database as well,
run `docker compose down -v`. The admin seeder creates the configured account
only if it does not already exist; changing credentials in `.env` does not
change an existing account's password.

## Run with Docker Desktop Kubernetes

This optional setup deploys the same Docker images to a separate Kubernetes
namespace. It does not change the Compose configuration or reuse its MongoDB
volume. You can keep Compose running while testing Kubernetes; the Kubernetes
app uses its own database storage and a different local port.

1. In Docker Desktop, enable Kubernetes and wait for the cluster to finish
   starting. In PowerShell, verify the Docker Desktop context and cluster:

   ```powershell
   kubectl config use-context docker-desktop
   kubectl get nodes
   ```

2. Build the project images from the repository root:

   ```powershell
   docker build -t student-feedback-api:dev .\server
   docker build -t student-feedback-client:dev .\client
   ```

   Load the images into the Docker Desktop Kubernetes nodes (the Docker image
   store and Kubernetes containerd store are separate):

   ```powershell
   .\k8s\load-images.ps1
   ```

3. If `k8s\secrets.env` does not already exist, create it in a text editor with
   your own values. This file is git-ignored; do not commit it. Preserve an
   existing file unless you intend to change the Kubernetes credentials:

   ```text
   JWT_SECRET=replace-with-a-long-random-secret
   ADMIN_NAME=Admin User
   ADMIN_EMAIL=admin@college.com
   ADMIN_PASSWORD=replace-with-a-strong-password
   ```

4. Create the Kubernetes namespace and secret, then deploy the app:

   ```powershell
   kubectl apply -f .\k8s\namespace.yaml
   kubectl create secret generic student-feedback-secrets `
     --namespace student-feedback-k8s `
     --from-env-file=.\k8s\secrets.env
   kubectl apply -f .\k8s\app.yaml
   ```

5. Wait for the workloads and check their status:

   ```powershell
   kubectl -n student-feedback-k8s get pods,pvc,jobs
   kubectl -n student-feedback-k8s logs job/admin-seed
   ```

   Once the client and API pods are ready and the `admin-seed` job succeeds,
   forward the frontend to an unused local port:

   ```powershell
   kubectl -n student-feedback-k8s port-forward service/client 18081:80
   ```

   Open <http://localhost:18081>. Keep the port-forward terminal open. The
   Kubernetes administrator credentials are the `ADMIN_EMAIL` and
   `ADMIN_PASSWORD` values in `k8s\secrets.env`.

To rebuild after changing application code, rebuild the corresponding `:dev`
images, load them into the cluster, and restart the deployments:

```powershell
docker build -t student-feedback-api:dev .\server
docker build -t student-feedback-client:dev .\client
.\k8s\load-images.ps1
kubectl -n student-feedback-k8s rollout restart deployment/api deployment/client
```

To stop only this Kubernetes deployment, delete its namespace. Do not delete
the Compose volume or run `docker compose down` as part of Kubernetes cleanup:

```powershell
kubectl delete namespace student-feedback-k8s
```

## Run locally with MongoDB

This option runs the API and frontend with Node.js while MongoDB runs either
as a local installation or in Docker.

### 1. Start MongoDB

Choose one:

- Start your local MongoDB service and use the connection string
  `mongodb://localhost:27017/complaint_system`.
- Or, from the project root, start only the MongoDB service defined in Compose:

  ```bash
  docker compose up -d mongodb
  ```

### 2. Configure and start the API

In PowerShell, create a local server environment file:

```powershell
Copy-Item server\.env.example server\.env
```

Edit `server\.env` before deployment. At minimum, set a unique `JWT_SECRET`.
The default MongoDB URL is appropriate when MongoDB is available on this
computer at the default port.

In a terminal:

```bash
cd server
npm ci
node createAdmin.js
npm start
```

The API listens on <http://localhost:5000>. Keep this terminal running.

### 3. Start the frontend

Open a second terminal in the project folder:

```bash
cd client
npm ci
npm run dev
```

Open the Vite URL printed in the terminal (normally
<http://localhost:5173>). The development server proxies `/api` requests to
`http://localhost:5000`. To use another API address, set `API_PROXY_TARGET` in
the frontend's environment.

## Environment variables

| Variable | Used by | Purpose |
| --- | --- | --- |
| `JWT_SECRET` | API | Secret used to sign and verify login tokens; set a unique value |
| `MONGO_URI` | API and admin seeder | MongoDB connection string |
| `PORT` | API | API listening port; defaults to `5000` |
| `ADMIN_NAME` | Docker admin seeder | Name for the initial administrator |
| `ADMIN_EMAIL` | Docker admin seeder | Email for the initial administrator |
| `ADMIN_PASSWORD` | Docker admin seeder | Password for the initial administrator |
| `API_PROXY_TARGET` | Vite development server | API origin; defaults to `http://localhost:5000` |

The root `.env.example` contains variables for Docker Compose. The
`server/.env.example` file contains the API and seeder variables for local
development.

## API endpoints

### Authentication

- `POST /api/auth/register` — Register a student
- `POST /api/auth/login` — Log in as a student or administrator

### Student complaints

- `POST /api/complaints` — Submit a complaint
- `GET /api/complaints/my` — List the logged-in student's complaints
- `GET /api/complaints/:id` — Get a complaint
- `PUT /api/complaints/:id` — Update a pending complaint
- `DELETE /api/complaints/:id` — Delete a pending complaint

### Administrator

- `GET /api/complaints/admin/all` — List complaints, optionally filtered by
  status and category
- `PUT /api/complaints/admin/:id/status` — Change status or add remarks
- `GET /api/complaints/admin/stats/dashboard` — Get dashboard statistics

## Project structure

```text
client/   React frontend and Vite configuration
server/   Express API, MongoDB models, authentication, and routes
k8s/      Docker Desktop Kubernetes resources, secrets template, and image loader
compose.yaml
          Docker Compose services for MongoDB, API, admin seeding, and frontend
```
