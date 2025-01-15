import { Router } from "express";
import { sendInvitation } from "../controllers/invitation.controller";
import { withAuthentication } from "../middleware/with-auth";
import { checkIsValidToken } from "../controllers/users.controller";

const invitationRouter = Router();

invitationRouter.post("/send-invitation", withAuthentication, sendInvitation);
invitationRouter.get("/check-invitation", checkIsValidToken);

export default invitationRouter;
