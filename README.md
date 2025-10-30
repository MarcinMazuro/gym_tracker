# Gym Tracker

Gym Tracker is a full-stack web application designed to help users plan, track, and analyze their gym workouts. It features a comprehensive exercise database, a highly customizable workout builder, and a persistent, real-time session tracker.

## Features

*   **User Authentication**: Secure user registration and login system using JWT tokens.
*   **Comprehensive Exercise Database**: Browse a pre-loaded, searchable list of exercises with details. (Source: [yuhonas/free-exercise-db](https://github.com/yuhonas/free-exercise-db)).
*   **Advanced Workout Builder**: Create highly customizable workout plans. Structure workouts into groups, define individual sets with specific target reps, weights, and rest times. You can create complex routines like alternating exercise blocks (e.g., supersets).
*   **Live & Persistent Session Tracking**: An interactive interface guides you through your workout. Log sets, reps, and weights in real-time. The system automatically handles rest timers and moves you to the next exercise. If you close the browser, your active session is saved on the server, allowing you to resume exactly where you left off.
*   **Detailed Workout History**: Review completed workouts, analyze your performance over time, and track your progress.
*   **User Profiles**: Manage your profile and view public workout histories of other users.

## How Workout Tracking Works (Server-Side)

The backend is designed to be robust and stateful, ensuring that a user's workout progress is never lost, even if they close the browser or lose connection.

1.  **The `WorkoutSession` Model**: This is the core of the tracking system. When a user starts a workout from a plan, a `WorkoutSession` object is created in the database with a status of `in-progress`. The backend enforces a rule that a user can only have **one** active (`in-progress`) session at a time. This model stores:
    *   A reference to the `User` and the `WorkoutPlan`.
    *   The `start_time` and `end_time`.
    *   A `status` field (e.g., `in-progress`, `completed`, `cancelled`).
    *   The user's current position within the plan: `current_group_index` and `current_set_index`.

2.  **State Persistence for Resumability**: Every time a user logs a set, the backend not only records the set but also updates the `current_group_index` and `current_set_index` on the `WorkoutSession` model. This is the key to the "resume" feature. When the user opens the tracker page, the frontend first asks the backend for an active session. If one exists, the backend sends back the complete session data, including the exact position where the user left off.

3.  **Logging Performance (`LoggedSet` Model)**: Each time a set is completed (whether from the plan or as a custom exercise), a `LoggedSet` object is created. It records the actual performance (`actual_reps`, `actual_weight`), a timestamp, and is linked to the parent `WorkoutSession`. This provides a detailed record of the workout for the user's history.

4.  **Session Lifecycle via API**:
    *   **Start**: A `POST` request creates a new `WorkoutSession`.
    *   **Log Set**: A `POST` request to a session-specific endpoint creates a `LoggedSet` and updates the session's progress fields.
    *   **Finish/Cancel**: An endpoint updates the session's status to `completed` and records the `end_time`. The session is now considered part of the user's history and is no longer "active".

This server-side state management ensures that workout data is always consistent and safe, providing a reliable and seamless user experience.

## Tech Stack

*   **Backend**: Django, Django REST Framework
*   **Frontend**: React, TypeScript, Vite
*   **Database**: PostgreSQL
*   **Containerization**: Docker, Docker Compose

## Prerequisites

Before you begin, ensure you have the following installed on your system:
*   [Docker](https://docs.docker.com/get-docker/)
*   [Docker Compose](https://docs.docker.com/compose/install/)

## Getting Started

Follow these steps to get the application running locally using Docker.

### 1. Clone the Repository

```bash
git clone <repository-url>
cd gym_tracker
```

### 2. Run the Application

Navigate to the `docker` directory and use Docker Compose to build and start the services.

```bash
cd docker
docker-compose up --build
```

This command will:
1.  Build the Docker images for the frontend and backend services.
2.  Start the PostgreSQL database, backend, and frontend containers.
3.  Automatically apply database migrations.
4.  Load the initial exercise data into the database using a custom management command.

### 3. Access the Application

Once the containers are up and running, you can access the services at the following URLs:

*   **Frontend Application**: [http://localhost:5173](http://localhost:5173)
*   **Backend API**: [http://localhost:8000/api/v1/](http://localhost:8000/api/v1/)

### 4. Stopping the Application

To stop the running containers, press `Ctrl+C` in the terminal where `docker-compose` is running, or run the following command from the `docker` directory:

```bash
docker-compose down
```

To remove the database volume (deleting all data), use:
```bash
docker-compose down -v
```