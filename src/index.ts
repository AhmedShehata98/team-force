import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import { PATHS_CONFIG } from "./config/router";
import { usersRoute } from "./routes/users.route";
import formidable from "express-formidable";
import { companyRouter } from "./routes/company.route";
import { PrismaClient } from "@prisma/client";
import cors from "cors";
import { corsOptions } from "./config/cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import projectsRoute from "./routes/projects.route";
import teamsRouter from "./routes/teams.route";
import tasksRouter from "./routes/tasks.route";
import invitationRouter from "./routes/invitation.route";

const prisma = new PrismaClient();
dotenv.config();

const app = express();
const port = process.env.PORT;

app.use(morgan("combined"));
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(PATHS_CONFIG.USERS, usersRoute);
app.use(PATHS_CONFIG.COMPANY, companyRouter);
app.use(PATHS_CONFIG.PROJECTS, projectsRoute);
app.use(PATHS_CONFIG.TEAMS, teamsRouter);
app.use(PATHS_CONFIG.TASKS, tasksRouter);
app.use(PATHS_CONFIG.INVITATION, invitationRouter);

process.on("SIGINT", async () => {
  console.log("⚠️ Disconnecting from Prisma...");
  await prisma.$disconnect();
  process.exit(0);
});
app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
