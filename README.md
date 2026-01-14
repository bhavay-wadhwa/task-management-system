# Task Management System

## Overview

The Task Management System is a full-stack web application that allows users to securely manage their personal tasks. Users can register, log in, and perform operations such as creating, updating, deleting, categorizing, prioritizing, and tracking tasks. Each user can access only their own data using JWT-based authentication. The system also provides real-time task statistics through an interactive dashboard.

## Tech Stack

- Frontend: HTML5, CSS3, JavaScript (ES6+), Bootstrap 5
- Backend: Node.js, Express.js
- Database: MongoDB (Mongoose ODM)

## Setup Instructions

### Backend

1. Clone repository
2. Install dependencies
3. Setup database
4. Run migrations
5. Start server

```bash
git clone https://github.com/bhavay-wadhwa/task-management-system.git
cd task-management-system
npm install
```

### Create .env file
```bash
PORT=5000
MONGO_URI=mongodb://localhost:27017/taskmanager
JWT_SECRET=your-secret-key
```

### Start server
Run the following command to start the backend server
```bash
node server.js
```

### Frontend
Frontend files are present in the public folder.
Open in browser 
```bash
http://localhost:5000
```

## Features Implemented

- User registration and login with JWT authentication  
- Create, read, update, and delete tasks  
- Task categorization, prioritization, and status tracking  
- Task filtering by status, priority, category, and search  
- Real-time task statistics dashboard  
- Secure access using protected routes  
- Responsive UI using Bootstrap  

---

## Challenges and Solutions

### Challenge 1: Secure Authentication and Authorization

One major challenge was implementing secure authentication and ensuring users could access only their own tasks.

**Solution:**  
This was solved by using JWT-based authentication along with a middleware that validates tokens on every protected request and restricts access to user-specific data.

---

### Challenge 2: Efficient Task Filtering and Performance

Another challenge was efficiently filtering and managing large numbers of tasks.

**Solution:**  
This was handled by using optimized MongoDB queries and indexing commonly queried fields such as `userId`, `status`, and `priority`.



