import { Request, Response, NextFunction } from "express";
import jwt, { VerifyErrors } from "jsonwebtoken";

/**
 * Extending the Express Request type to include the user object
 * that the JWT verification attaches.
 */
interface AuthenticatedRequest extends Request {
  user?: any;
}

const authenticateJWT = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    // Format: "Bearer <token>"
    const token = authHeader.split(" ")[1];
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      console.error("JWT_SECRET is not defined in environment variables");
      res.sendStatus(500);
      return;
    }

    jwt.verify(token, secret, (err: VerifyErrors | null, user: any) => {
      if (err) {
        // Forbidden: Token is invalid or expired
        return res.sendStatus(403);
      }

      // Attach the decoded user payload to the request object
      req.user = user;
      return next();
    });
  } else {
    // Unauthorized: No header provided
    res.sendStatus(401);
  }
};

export default authenticateJWT;
