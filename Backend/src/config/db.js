const mongoose = require("mongoose");

let isConnected = false;

async function connectDB() {
    if (isConnected || mongoose.connection.readyState >= 1) {
        return;
    }
    if (!process.env.MONGO_URI) {
        console.warn("⚠️ [DB] Warning: MONGO_URI environment variable is not defined in this Vercel project.");
        return;
    }
    try {
        await mongoose.connect(process.env.MONGO_URI);
        isConnected = true;
        console.log("Connected to Database");

        // Clean up any stale indexes (like old 'name_1' unique index) from the users collection
        try {
            const usersCollection = mongoose.connection.db.collection("users");
            const indexes = await usersCollection.indexes();
            for (const idx of indexes) {
                if (idx.name === "name_1" || (idx.key && idx.key.name)) {
                    await usersCollection.dropIndex(idx.name);
                    console.log(`Dropped stale index: ${idx.name}`);
                }
            }
        } catch (indexErr) {
            console.log("Index cleanup note:", indexErr.message);
        }
    } catch (err) {
        console.log(err);
    }
}

module.exports = connectDB;