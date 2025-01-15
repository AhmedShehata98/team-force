import { Router } from "express";
import {
  createProject,
  getProjectsByCompanyId,
  getProjectDetails,
  deleteProject,
} from "../controllers/projects.controller";
import { withAuthentication } from "../middleware/with-auth";

const projectsRouter = Router();

projectsRouter.get("/company", withAuthentication, getProjectsByCompanyId);
projectsRouter.get("/details", withAuthentication, getProjectDetails);
projectsRouter.post("/", withAuthentication, createProject);
projectsRouter.delete("/", withAuthentication, deleteProject);

export default projectsRouter;
