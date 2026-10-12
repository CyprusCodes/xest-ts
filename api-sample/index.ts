import path from "path";
import dotenv from "dotenv";

// Import the main application logic
import "./src/app/index";

// Initialize dotenv with the specific path
dotenv.config({
  path: path.join(__dirname, ".env")
});
