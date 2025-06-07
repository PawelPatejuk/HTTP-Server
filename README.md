# HTTP-Server API Documentation

## Introduction

Welcome to the HTTP-Server API documentation! This project is a RESTful API built using Express.js and TypeScript, designed to handle user authentication, chirp (microblog) management, and administrative tasks. The server is structured to support secure and efficient operations, including JWT-based authentication, user role management, and dynamic content delivery.

---

## Table of Contents

* [Health Check](#health-check)
* [User Endpoints](#user-endpoints)
* [Authentication Endpoints](#authentication-endpoints)
* [Chirp Endpoints](#chirp-endpoints)
* [Admin Endpoints](#admin-endpoints)
* [Webhook Endpoints](#webhook-endpoints)
* [Error Handling](#error-handling)
* [Running the Server Locally](#running-the-server-locally)
* [License](#license)

---

## Health Check

* `GET /api/healthz`

  Returns a simple "OK" message to indicate the server is running.

  **Response:**

  * `200 OK`: Server is healthy.

---

## User Endpoints

* `POST /api/users`

  Creates a new user.

  **Request Body:**

  ```json
  {
    "email": "user@example.com",
    "password": "securepassword"
  }
  ```

  **Response:**

  * `201 Created`: User created successfully.

* `PUT /api/users`

  Updates the current user's email and password.

  **Request Body:**

  ```json
  {
    "email": "newemail@example.com",
    "password": "newpassword"
  }
  ```

  **Response:**

  * `200 OK`: User updated successfully.

---

## Authentication Endpoints

* `POST /api/login`

  Logs in a user and returns a JWT and refresh token.

  **Request Body:**

  ```json
  {
    "email": "user@example.com",
    "password": "securepassword"
  }
  ```

  **Response:**

  * `200 OK`: Authentication successful.
  * `401 Unauthorized`: Invalid credentials.

* `POST /api/refresh`

  Refreshes the JWT using a valid refresh token.

  **Request Body:**

  ```json
  {
    "refreshToken": "your-refresh-token"
  }
  ```

  **Response:**

  * `200 OK`: New JWT issued.
  * `401 Unauthorized`: Invalid or expired refresh token.

* `POST /api/revoke`

  Revokes the current refresh token.

  **Request Body:**

  ```json
  {
    "refreshToken": "your-refresh-token"
  }
  ```

  **Response:**

  * `204 No Content`: Token revoked successfully.
  * `401 Unauthorized`: Invalid or expired refresh token.

---

## Chirp Endpoints

* `POST /api/chirps`

  Creates a new chirp.

  **Request Body:**

  ```json
  {
    "body": "This is a chirp message."
  }
  ```

  **Response:**

  * `201 Created`: Chirp created successfully.
  * `401 Unauthorized`: Invalid or missing JWT.

* `GET /api/chirps`

  Retrieves all chirps, optionally filtered by author or sorted.

  **Query Parameters:**

  * `authorId`: Filter chirps by author ID.
  * `sort`: Sort chirps (e.g., by date).

  **Response:**

  * `200 OK`: List of chirps.

* `GET /api/chirps/:chirpID`

  Retrieves a specific chirp by ID.

  **Response:**

  * `200 OK`: Chirp found.
  * `404 Not Found`: Chirp not found.

* `DELETE /api/chirps/:chirpID`

  Deletes a specific chirp by ID.

  **Response:**

  * `204 No Content`: Chirp deleted successfully.
  * `401 Unauthorized`: Invalid or missing JWT.
  * `403 Forbidden`: User is not the author of the chirp.
  * `404 Not Found`: Chirp not found.

---

## Admin Endpoints

* `GET /admin/metrics`

  Displays the number of times the server has been accessed.

  **Response:**

  * `200 OK`: Metrics displayed.

* `POST /admin/reset`

  Resets the user database (only available in development environment).

  **Response:**

  * `200 OK`: Database reset successfully.
  * `403 Forbidden`: Access denied.

---

## Webhook Endpoints

* `POST /api/polka/webhooks`

  Receives webhook events, such as user upgrades.

  **Request Body:**

  ```json
  {
    "event": "user.upgraded",
    "data": {
      "userId": "user-id"
    }
  }
  ```

  **Response:**

  * `204 No Content`: Event processed successfully.
  * `401 Unauthorized`: Invalid or missing API key.
  * `404 Not Found`: User not found.

---

## Error Handling

The server uses custom error classes to handle different HTTP errors:

* `Error400`: Bad Request
* `Error401`: Unauthorized
* `Error403`: Forbidden
* `Error404`: Not Found

Each error class returns a JSON response with an `"error"` field describing the issue.

---

## Running the Server Locally

1. Clone the repository:

   ```bash
   git clone https://github.com/PawelPatejuk/HTTP-Server.git
   cd HTTP-Server
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the server:

   ```bash
   npm start
   ```

   The server will run on `http://localhost:8080`.

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---
