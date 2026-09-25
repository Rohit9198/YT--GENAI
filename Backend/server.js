require("dotenv").config();
const app = require("./src/app");
const connectToDB = require("./src/config/db");

connectToDB();

// Only start the HTTP server when running locally (not on Vercel)
if (process.env.VERCEL !== "1") {
    app.listen(3000, () => {
        console.log("Server is running on port 3000");
    });
}

module.exports = app;