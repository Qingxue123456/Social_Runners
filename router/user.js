const express = require('express');
const { MongoClient } = require('mongodb'); // MongoDB database
const bcrypt = require('bcryptjs'); // Password encryption package
const Joi = require('joi'); // Import Joi to define validation rules
const expressJoi = require('@escook/express-joi'); // Validation rules
const jwt = require('jsonwebtoken'); // Generate token
const config = require('./config'); // Import the global configuration file
var ObjectId = require('mongodb').ObjectId;
// MongoDB URL and database name
const url = 'mongodb://127.0.0.1:27017/';
const dbName = 'user';

// Create a router object
const router = express.Router();

// Registration validation rules
// Username: Must be a string consisting of letters or numbers only (no other characters), minimum 3 characters, maximum 12 characters
// Password: Must be a string without spaces, minimum 6 characters, maximum 15 characters
// Age must be a non-negative integer less than 100
// Email: Must be in the format of an email address and is required
// Difficulty: Must be an integer
const userSchema = {
  body: {
    username: Joi.string().alphanum().min(3).max(12).required(),
    password: Joi.string()
      .pattern(/^[\S]{6,15}$/)
      .required(),
    age: Joi.number().integer().min(0).max(100),
    email: Joi.string().email().required(),
    difficulty: Joi.number().integer().required(),
  },
};

// Login validation rules
// Username: Must be a string consisting of letters or numbers only (no other characters), minimum 3 characters, maximum 12 characters
// Password: Must be a string without spaces, minimum 6 characters, maximum 15 characters
const loginSchema = {
  body: {
    username: Joi.string().alphanum().min(3).max(12).required(),
    password: Joi.string()
      .pattern(/^[\S]{6,15}$/)
      .required(),
  },
};

// Registering a new user
router.post('/registeruser', expressJoi(userSchema), async (req, res) => {
  // Get the user information submitted from the client to the server.
  const userInfo = req.body;

  // Using the database connection passed from app.js
  const collection = req.db.users;

  try {
    // Check if the username already exists
    const existingUser = await collection.findOne({
      username: userInfo.username,
    });

    if (existingUser) {
      return res.send({ status: 1, message: 'Username already registered' });
    }

    console.log(userInfo);
    // Using bcryptjs for password encryption
    userInfo.password = bcrypt.hashSync(userInfo.password, 10);

    // Inserting a new user, including the encrypted password
    const result = await collection.insertOne({
      username: userInfo.username,
      password: userInfo.password,
      age: userInfo.age,
      email: userInfo.email,
      difficulty: userInfo.difficulty,
    });

    res.send({
      status: 0,
      message: 'User registration successful',
      userId: result.insertedId,
    });
  } catch (error) {
    console.error(error);
    res.send({ status: 1, message: 'Error occurred during registration' });
  }
});

// Login
router.post('/login', expressJoi(loginSchema), async (req, res) => {
  // Get the user information submitted from the client to the server
  const userInfo = req.body;

  // Using the database connection passed from app.js
  const collection = req.db.users;

  try {
    // Check if the username already exists
    const existingUser = await collection.findOne({
      username: userInfo.username,
    });
    if (existingUser) {
      // Check if the input password matches the password stored in the database
      const passwordMatch = bcrypt.compareSync(
        userInfo.password,
        existingUser.password
      );
      if (passwordMatch) {
        // Generate a token string on the server-side and send it to the client
        // Set the password value to empty
        const user = { ...existingUser, password: '' };
        // Encrypt the user's information to generate a token string
        const tokenStr = jwt.sign(user, config.jwtSecretKey, {
          expiresIn: '12h',
        });
        // Username and password are both correct, redirect to the initial interface
        res.send({
          status: 0,
          message: 'Login successful',
          userName: existingUser.username,
          difficulty: existingUser.difficulty,
          token: 'Bearer ' + tokenStr,
        });
      } else {
        // Incorrect password
        return res.send({
          status: 1,
          message: 'Incorrect password, login failed',
        });
      }
    } else {
      //Incorrect username
      return res.send({
        status: 1,
        message: 'Incorrect username or not registered, login failed',
      });
    }
  } catch (error) {
    console.error(error);
    res.send({ status: 1, message: 'Error occurred during login' });
  }
});

/**Shiwen: add new run to database */
router.post('/addNewRun', async (req, res) => {
  try {
    const {
      username,
      startLog,
      startLat,
      destLog,
      destLat,
      rainyChance,
      distance,
      level,
      midpointCoordinates,
      status,
      selectedDate, // 添加日期信息的接收
    } = req.body;

    const result = await req.db.runs.insertOne({
      username,
      startLog,
      startLat,
      destLog,
      destLat,
      rainyChance,
      distance,
      level,
      midpointCoordinates,
      status,
      selectedDate, // 将接收到的日期信息保存到数据库中
    });

    res.status(201).json({
      message: 'New run created successfully',
    });
  } catch (error) {
    console.error('Error creating new run:', error);
    res.status(500).json({ message: 'Failed to create new run' });
  }
});

router.post('/joinRun', async (req, res) => {
  try {
    const {
      username,
      startLog,
      startLat,
      destLog,
      destLat,
      rainyChance,
      level,
      midpointCoordinates,
      status,
    } = req.body;

    const newRun = {
      username: username,
      startLog: startLog,
      startLat: startLat,
      destLog: destLog,
      destLat: destLat,
      rainyChance: rainyChance,
      level: level,
      midpointCoordinates: midpointCoordinates,
      status: status,
    };

    // 向数据库中插入新的运行记录
    const result = await req.db.runs.insertOne(newRun);

    res.status(201).json({
      message: 'Joined the run successfully',
    });
  } catch (error) {
    console.error('Error joining the run:', error);
    res.status(500).json({ message: 'Failed to join the run' });
  }
});

/**Shiwen: get run details by _id, this fucntion will be called when press view button */
router.get('/getOneRun/:id', async (req, res) => {
  try {
    const runId = req.params.id;
    var o_id = new ObjectId(runId);
    const run = await req.db.runs.findOne({
      _id: o_id,
    });

    if (!run) {
      return res.status(404).json({ message: 'Run not found' });
    }

    res.status(200).json({
      run: run,
    });
  } catch (error) {
    console.error('Error loading user data:', error);
    res.status(500).json({ message: 'Failed to load user data' });
  }
});

/**Shiwen: It will change the status of a run to finished */
router.put('/finishRun/:id', async (req, res) => {
  try {
    const runId = req.params.id;
    var o_id = new ObjectId(runId);
    const run = await req.db.runs.findOne({
      _id: o_id,
    });

    if (!run) {
      return res.status(404).json({ message: 'Run not found' });
    }

    // update status
    const result = await req.db.runs.updateOne(
      { _id: o_id },
      { $set: { status: 'finished' } }
    );

    if (result.modifiedCount === 1) {
      res.status(200).json({ message: 'Run finished successfully' });
    } else {
      res.status(500).json({ message: 'Failed to finish the run' });
    }
  } catch (error) {
    console.error('Error finishing the run:', error);
    res.status(500).json({ message: 'Failed to finish the run' });
  }
});

router.get('/loadTopRuns', async (req, res) => {
  try {
    const runs = await req.db.runs.find().toArray();

    res.status(200).json({
      runs: runs,
    });
  } catch (error) {
    console.error('Error loading user data:', error);
    res.status(500).json({ message: 'Failed to load user data' });
  }
});

// Shared route
module.exports = router;
