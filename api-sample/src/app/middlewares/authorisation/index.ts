import { Request, Response, NextFunction } from "express";
import getUserRole from "./queries/getUserRole";

// Define the shape of our authorized request
interface AuthorizedRequest extends Request {
  user?: {
    userId: string | number;
    [key: string]: any; // Allows for other user properties
  };
}

interface AuthoriseOptions {
  roles: string[];
}

const authorise =
  ({ roles: userRolesAllowed }: AuthoriseOptions) =>
  async (
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void | Response> => {
    // Safety check for req.user existence
    if (!req.user || !req.user.userId) {
      return res.sendStatus(401);
    }

    try {
      const currentUserRole: string = await getUserRole({
        userId: req.user.userId
      });

      if (userRolesAllowed.includes(currentUserRole)) {
        return next();
      }

      return res.sendStatus(403);
    } catch (err) {
      // In middleware, usually best to pass errors to the global error handler
      return res.sendStatus(500);
    }
  };

export default authorise;
