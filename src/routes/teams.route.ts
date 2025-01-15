import { Router } from "express";
import {
  addNewTeam,
  addTeamMember,
  clearTeamMembers,
  deleteTeam,
  getTeamDetails,
  getTeamsByProjectId,
  removeTeamMember,
  updateTeam,
} from "../controllers/teams.controller";
import { withAuthentication } from "../middleware/with-auth";

const teamsRouter = Router();

teamsRouter.get("/project/:projectId", withAuthentication, getTeamsByProjectId);
teamsRouter.post("/", withAuthentication, addNewTeam);
teamsRouter.get("/:teamId", withAuthentication, getTeamDetails);
teamsRouter.delete("/remove-member", withAuthentication, removeTeamMember);
teamsRouter.delete("/:teamId", withAuthentication, deleteTeam);
teamsRouter.patch("/:teamId", withAuthentication, updateTeam);
teamsRouter.patch("/add-member/:teamId", withAuthentication, addTeamMember);

teamsRouter.delete("/clear/:teamId", withAuthentication, clearTeamMembers);

export default teamsRouter;
