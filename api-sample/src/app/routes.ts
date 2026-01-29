import express, { Router } from "express";

import { ADMIN } from "~root/constants/userTypes";
import postLogin from "./controllers/users/login";
import postUser from "./controllers/users/register";
import putUserDetails from "./controllers/users/putUserDetails";
import authentication from "./middlewares/authentication";
import authorise from "./middlewares/authorisation";
import getUserTypes from "./controllers/users/userTypes";
import putPassword from "./controllers/password-recovery/putPassword";
import postRecoveryRequest from "./controllers/password-recovery/postRecoveryRequest";
import healthcheck from "./platform/healthcheck";
const router: Router = express.Router();

// USER MANAGEMENT
router.post("/login", postLogin);

router.post(
  "/register",
  authentication,
  authorise({ roles: [ADMIN] }),
  postUser
);

router.put("/edit/user", authentication, putUserDetails);

router.get("/user-types", getUserTypes);

router.post("/recovery-request", postRecoveryRequest);

router.put("/update-password/:shortcode", putPassword);

router.get("/healthcheck", healthcheck);

export default router;
