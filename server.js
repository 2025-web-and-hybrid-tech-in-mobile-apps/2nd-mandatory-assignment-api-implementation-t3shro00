const express = require("express");
const app = express();
const port = process.env.PORT || 3000;

// Middleware for parsing JSON request bodies
app.use(express.json()); // for parsing application/json

// ------ WRITE YOUR SOLUTION HERE BELOW ------//

const jwt = require("jsonwebtoken");

const JWTSecret = "123456"; // Secret key used for signing and verifying JWT tokens

// User data structure to store user credentials
const users = {
  userHandle: "", // User's username or handle
  password: "", // User's password
};

// JWT middleware to authenticate the request
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization; // Extract the authorization header

  if (authHeader) {
    // Extract token from the "Bearer <token>" format
    const token = authHeader.split(" ")[1];

    // Verify the JWT token using the secret key
    jwt.verify(token, JWTSecret, (err, user) => {
      if (err) {
        // If verification fails, return 401 Unauthorized
        return res.sendStatus(401);
      }

      req.user = user; // Store the verified user data in the request
      next(); // Proceed to the next middleware or route handler
    });
  } else {
    // If no authorization header is found, return 401 Unauthorized
    res.sendStatus(401);
  }
};

// Array to store high score records
const highScores = [
  {
    level: "", // Game level
    userHandle: "", // Username of the person who posted the score
    score: "", // Score achieved by the user
    timestamp: "", // Time when the score was posted
  },
];

// Signup route to register a new user
app.post("/signup", (req, res) => {
  const { userHandle, password } = req.body;

  // Validate the request body to ensure required fields are provided
  if (
    !userHandle ||
    !password ||
    userHandle.length < 6 ||
    password.length < 6
  ) {
    // If validation fails, send a 400 Bad Request response
    return res.status(400).json({ error: "Invalid request body" });
  }

  // Save the user information (in a real app, store this in a database)
  users.userHandle = userHandle;
  users.password = password;

  // Respond with a success message after registration
  res.status(201).send("User registered successfully");
});

// Login route for users to authenticate and receive a JWT token
app.post("/login", (req, res) => {
  const accessToken = jwt.sign({ user: users.userHandle }, JWTSecret); // Create a JWT token
  const { userHandle, password } = req.body;

  // Validate login request body
  if (
    !userHandle ||
    !password ||
    Object.keys(req.body).length > 2 ||
    typeof userHandle !== "string" ||
    typeof password !== "string"
  ) {
    return res.status(400).send("Bad request");
  }

  // Check if provided credentials match stored user credentials
  if (userHandle === users.userHandle && password === users.password) {
    // If credentials are correct, return the JWT token
    res.json({ jsonWebToken: accessToken });
  } else {
    // If credentials are incorrect, return 401 Unauthorized
    res
      .status(401)
      .json({ error: "Unauthorized, incorrect username or password" });
  }
});

// High score posting route protected by JWT authentication middleware
app.post("/high-scores", authenticateJWT, (req, res) => {
  const { level, userHandle, score, timestamp } = req.body;

  // Check if the user is authenticated (JWT should be valid)
  if (!req.user) {
    return res.sendStatus(401); // If user is not authenticated, return 401 Unauthorized
  }

  // Validate request body to ensure all necessary fields are present
  if (!level || !userHandle || !score || !timestamp) {
    return res.status(400).json({ error: "Invalid request body" });
  }

  // Create a new high score post and add it to the highScores array
  const newPost = { level, userHandle, score, timestamp };
  highScores.push(newPost);

  // Respond with a success message after posting the high score
  res.status(201).send("High score posted successfully");
});

// Route to retrieve high scores with pagination and filtering by level
app.get("/high-scores", async (req, res) => {
  try {
    const { level, page } = req.query;

    // Ensure that the "level" query parameter is provided
    if (!level) {
      return res.status(400).json({ error: "Level is required" });
    }

    // Filter high scores by the specified level
    const filteredScores = highScores.filter((score) => score.level === level);
    
    // Sort the filtered scores by score in descending order
    const sortedScores = filteredScores.sort((a, b) => b.score - a.score);

    // Pagination logic
    const PAGE_LIMIT = 20; // Number of scores to show per page
    const currentPage = parseInt(page, 10) || 1; // Get the current page or default to page 1
    const startIndex = (currentPage - 1) * PAGE_LIMIT; // Calculate start index for pagination
    const endIndex = currentPage * PAGE_LIMIT; // Calculate end index for pagination
    const paginatedScores = sortedScores.slice(startIndex, endIndex); // Slice the scores array for the current page

    // Respond with the paginated scores
    res.status(200).json(paginatedScores);
  } catch (error) {
    // If an error occurs, return 500 Internal Server Error
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//------ WRITE YOUR SOLUTION ABOVE THIS LINE ------//

let serverInstance = null;
module.exports = {
  start: function () {
    // Start the server and listen on the specified port
    serverInstance = app.listen(port, () => {
      console.log(`Example app listening at http://localhost:${port}`);
    });
  },
  close: function () {
    // Close the server
    serverInstance.close();
  },
};
