# Event Scheduler

A modern web application for scheduling and managing events efficiently. Built with Django REST Framework for the backend API and React for the frontend interface.

## Project Overview

Event Scheduler is a full-stack web application that allows users to:

- Create and manage events
- Schedule appointments
- Set reminders
- Manage event participants
- View calendar-based event visualization

### Tech Stack

**Backend:**

- Django
- Django REST Framework
- PostgreSQL
- Celery (for background tasks)

**Frontend:**

- Next
- TypeScript
- Redux for state management

## Setup and Installation

### Option 1: Using Docker (Recommended)

Prerequisites:

- Docker
- Docker Compose

1. Clone the repository:

```bash
git clone https://github.com/esubalew-gosaye/event-scheduler.git
cd event-scheduler
```

2. Create a `.env` file in the root directory with the following variables:

```
POSTGRES_DB=event_scheduler
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password
DJANGO_SECRET_KEY=your_secret_key
DEBUG=True
```

3. Build and run the containers:

```bash
docker-compose up --build
```

The application will be available at:

- Frontend: http://localhost:4000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/api/docs/

### Option 2: Manual Setup

#### Backend Setup

Prerequisites:

- Python 3.8+
- PostgreSQL
- Redis (for Celery)

1. Set up the backend:

```bash
# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate

# Install dependencies
cd backend
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env  # Edit the .env file with your configurations

# Run migrations
python manage.py migrate

# Create superuser (optional)
python manage.py createsuperuser

# Start the development server
python manage.py runserver
```

#### Frontend Setup

Prerequisites:

- Node.js 14+
- npm or yarn

1. Set up the frontend:

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install
# or
yarn install

# Start development server
npm start
# or
yarn start
```

## Development

### Backend Development

- API endpoints are available at `http://localhost:8000/api/`
- Admin interface is at `http://localhost:8000/admin/`
- Run tests: `python manage.py test`

### Frontend Development

- Development server runs at `http://localhost:3000`
- Run tests: `npm test` or `yarn test`
- Build for production: `npm run build` or `yarn build`

## API Documentation

The API documentation is available at `/api/docs/` when running the backend server. It provides detailed information about all available endpoints, request/response formats, and authentication requirements.
