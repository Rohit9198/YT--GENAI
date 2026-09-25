const express = require("express")
const cookieParser = require("cookie-parser")
const cors = require("cors")

const app = express()

app.use(express.json())
app.use(cookieParser())
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, postman) or any origin in dev/prod
        callback(null, true)
    },
    credentials: true
}))

/* root & health check */
app.get("/", (req, res) => {
    res.status(200).json({ status: "success", message: "YT-GENAI Backend API is running successfully." })
})
app.get("/api", (req, res) => {
    res.status(200).json({ status: "success", message: "YT-GENAI Backend API is running successfully." })
})

/* require all the routes here */
const authRouter = require("./routes/auth.routes")
const interviewRouter = require("./routes/interview.routes")


/* using all the routes here */
app.use("/api/auth", authRouter)
app.use("/api/interview", interviewRouter)

/* error handling middleware */
app.use((err, req, res, next) => {
    if (err.name === "MulterError") {
        if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({ message: "File size exceeds 5MB limit." })
        }
        return res.status(400).json({ message: err.message })
    }
    if (err) {
        return res.status(err.status || 400).json({ message: err.message || "An unexpected error occurred." })
    }
    next()
})

module.exports = app