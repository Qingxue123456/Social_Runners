const express = require('express');
const path = require('path');
const cors = require('cors');
const { MongoClient } = require('mongodb'); // MongoDB database
const Joi = require('joi'); // Import Joi to define validation rules
const jwt = require('jsonwebtoken'); // token
const config = require('../router/config'); // Import the global configuration file
const { expressjwt: expressJWT } = require('express-jwt'); // Middleware for parsing tokens

// Create server
const app = express();

// Cross-origin (resource) sharing (CORS)
app.use(cors());

// Parse form data
app.use(express.json());

// Static files
app.use(express.static('contentUPDATE'));

// MongoDB connection string
const url = 'mongodb://127.0.0.1:27017/';
const client = new MongoClient(url);

// Create JWT authentication middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) return res.sendStatus(401); // Return 401 if no token is present

  jwt.verify(token, config.jwtSecretKey, (err, user) => {
    if (err) return res.sendStatus(403); // Return 403 for invalid or expired token
    req.user = user;
    next();
  });
}

// The first red dot added runs and comments databases.
// The second red dot added the route for comments.js.
// Note: The route in comments.js is not fully completed. Shiwen needs to add social features for joining others' runs. The respective comments and positions are already marked in comments.js and client.js.
// Connect to MongoDB and keep the connection open
client
  .connect()
  .then(() => {
    console.log('Connected successfully to server');
    const database = client.db('user');
    const users = database.collection('users');
    const runs = database.collection('runs');
    const comments = database.collection('comments');

    // Make the database connection available to request handlers
    app.use((req, res, next) => {
      req.db = {
        users,
        runs,
        comments,
      };
      next();
    });

    // Import and use the user router module, and for accessing each route in the userRouter module, prepend "/api" to the path
    const userRouter = require('../router/user.js');
    app.use('/api', userRouter);

    const commnetRouter = require('../router/comment.js');
    app.use('/api', commnetRouter);

    // Define error-level middleware
    app.use((err, req, res, next) => {
      if (err instanceof Joi.ValidationError) {
        return res.send({
          status: 1,
          message: err.message,
        });
      } else {
        res.send({ status: 1, message: err.message });
      }
    });

    // Start the server
    app.listen(3007, () => {
      console.log('Api server running at http://127.0.0.1:3007');
    });
  })
  .catch(console.error);

// Close the database connection when the process ends
process.on('SIGINT', () => {
  client.close().then(() => {
    console.log('MongoDB connection closed');
    process.exit(0);
  });
});
