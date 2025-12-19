// Import the Mongoose library, which is an Object Data Modeling (ODM) library for MongoDB and Node.js.
import mongoose from "mongoose";

// Define an asynchronous function to connect to the database.
const connectDB = async () => {
  try {
    // Attempt to connect to MongoDB using the connection string from environment variables.
    // `mongoose.connect` returns a promise that resolves to the connection object.
    const conn = await mongoose.connect(process.env.MONGO_URI);

    // If the connection is successful, log the host of the connected database.
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    // If an error occurs during connection, log the error message.
    console.error(`Error: ${error.message}`);
    // Exit the Node.js process with a failure code (1).
    process.exit(1);
  }
};

// Export the connectDB function to be used in other parts of the application (like server.js).
export default connectDB;
