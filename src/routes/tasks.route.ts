import { Router } from "express";
import {
  assignTaskToUser,
  deleteTask,
  getTasksByTeamId,
  updateTask,
} from "../controllers/tasks.controller";
import { withAuthentication } from "../middleware/with-auth";

const tasksRouter = Router();

tasksRouter.get("/team", withAuthentication, getTasksByTeamId);
tasksRouter.post("/assign-task", withAuthentication, assignTaskToUser);
tasksRouter.put("/:taskId", withAuthentication, updateTask);
tasksRouter.patch("/update-status/:taskId", withAuthentication, updateTask);
tasksRouter.delete("/:taskId", withAuthentication, deleteTask);
export default tasksRouter;
