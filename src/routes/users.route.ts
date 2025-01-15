import { Router } from "express";
import {
  register,
  deleteUser,
  getMeInfo,
  getUsersByCompanyId,
  loginUser,
  updateUser,
  createUser,
  checkIsValidToken,
  getUserDetails,
  registerInvitedUser,
  logout,
} from "../controllers/users.controller";
import { withAuthentication } from "../middleware/with-auth";

const usersRoute = Router();

usersRoute.get("/info", withAuthentication, getMeInfo);
usersRoute.post("/login", loginUser);
usersRoute.post("/logout", logout);
usersRoute.post("/register", register);
usersRoute.post("/register-invite-user", registerInvitedUser);
usersRoute.get("/check-token", checkIsValidToken);
usersRoute.post("/", withAuthentication, createUser);
usersRoute.get("/company-users", withAuthentication, getUsersByCompanyId);
usersRoute.get("/:userId", withAuthentication, getUserDetails);
usersRoute.patch("/:userId", withAuthentication, updateUser);
usersRoute.delete("/:userId", withAuthentication, deleteUser);

export { usersRoute };
