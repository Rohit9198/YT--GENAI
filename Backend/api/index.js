require("dotenv").config();
const app = require("../src/app");
const connectToDB = require("../src/config/db");

// Connect to DB for serverless execution
connectToDB();

module.exports = app;
