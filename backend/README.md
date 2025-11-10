# Coordinet Backend

This is the unified backend for the Coordinet application, a college event management system. It combines the functionality of multiple microservices into a single monolithic backend.

## Features

- User authentication and authorization
- Event management
- Announcements and notifications
- Leaderboard and scoring system
- Real-time updates via Socket.IO

## Tech Stack

- Node.js
- Express.js
- MongoDB with Mongoose
- JWT for authentication
- Socket.IO for real-time communication
- Nodemailer for email functionality

## Project Structure

```
├── controllers/       # Route controllers
├── middleware/        # Custom middleware
├── models/            # Mongoose models
├── routes/            # Express routes
├── utils/             # Utility functions
├── server.js          # Entry point
└── package.json       # Dependencies
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file in the root directory with the following variables:
   ```
   PORT=8000
   MONGODB_URI=mongodb://localhost:27017/coordinet
   JWT_SECRET=your_jwt_secret
   JWT_REFRESH_SECRET=your_refresh_secret
   EMAIL_SERVICE=your_email_service
   EMAIL_USER=your_email_user
   EMAIL_PASS=your_email_password
   EMAIL_SECURE=true
   NODE_ENV=development
   ```

### Running the Server

Development mode:
```
npm run dev
```

Production mode:
```
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh-token` - Refresh JWT token
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password/:token` - Reset password

### Events
- `GET /api/events` - Get all events
- `POST /api/events` - Create a new event
- `GET /api/events/:id` - Get event by ID
- `PUT /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event
- `POST /api/events/:id/register` - Register for event
- `DELETE /api/events/:id/register` - Cancel registration

### Notifications
- `GET /api/notifications` - Get all announcements
- `POST /api/notifications` - Create a new announcement
- `GET /api/notifications/:id` - Get announcement by ID
- `PUT /api/notifications/:id` - Update announcement
- `DELETE /api/notifications/:id` - Delete announcement

### Leaderboard
- `GET /api/leaderboard/event/:eventId` - Get event leaderboard
- `GET /api/leaderboard/top` - Get top performers
- `GET /api/leaderboard/colleges` - Get college leaderboard
- `GET /api/leaderboard/event/:eventId/user/:userId` - Get participant score
- `PUT /api/leaderboard/event/:eventId/user/:userId` - Update participant score

### Admin
- `GET /api/admin/users` - Get all users
- `GET /api/admin/users/:id` - Get user by ID
- `PUT /api/admin/users/:id/role` - Update user role