import { Router } from "express";
import { sendInvitation } from "../controllers/invitation.controller";
import { withAuthentication } from "../middleware/with-auth";

const invitationRouter = Router();

invitationRouter.post("/send-invitation", withAuthentication, sendInvitation);

export default invitationRouter;
