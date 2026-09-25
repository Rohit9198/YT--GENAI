require("dotenv").config();
const app = require("../src/app");
const connectToDB = require("../src/config/db");

module.exports = async (req, res) => {
    try {
        await connectToDB();
    } catch (err) {
        console.error("DB connection note in serverless:", err.message);
    }
    return app(req, res);
};
