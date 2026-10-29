import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import fetchUser from "~root/actions/users/fetchUser";

/**
 * Controller to handle user login and JWT issuance.
 */
const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  try {
    const { user } = await fetchUser({ email, password });

    if (user) {
      const secret = process.env.JWT_SECRET;

      if (!secret) {
        console.error("JWT_SECRET is missing from environment variables.");
        res.status(500).json({ message: "Internal server error" });
        return;
      }

      // Generate the token with the user payload
      const accessToken = jwt.sign({ ...user }, secret, {
        expiresIn: "365d" // 1 year
      });

      res.json({
        accessToken
      });
    } else {
      // 401 Unauthorized for failed credentials
      res.status(401).send("Username or password incorrect");
    }
  } catch (error) {
    res.status(500).json({ message: "An error occurred during login" });
  }
};

export default login;
