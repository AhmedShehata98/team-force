import { Request, Response } from "express";
import { responseAdapter } from "../utils/adaptors/response";
import { RESPONSE_ERROR } from "../types/response";
import { PrismaClient, TaskStatus, Team, TeamRole } from "@prisma/client";
import { TokenPayloadType } from "../types/users";
import { paginatedResponseAdapter } from "../utils/adaptors/paginated-response";
import {
  calcRemainingPages,
  calcTotalPages,
} from "../utils/results-pagination";

const prisma = new PrismaClient();

export const getTasksByTeamId = async (req: Request, res: Response) => {
  try {
    const { user } = res.locals.user as { user: TokenPayloadType };
    const { memberId, teamId, page = 1, limit = 5, status } = req.query;
    console.log("****************");
    console.log("status : ", status);
    console.log("****************");
    if (!teamId) {
      res.status(400).json(
        responseAdapter({
          data: [],
          error: RESPONSE_ERROR.BAD_REQUEST,
          errorDetails: "Please provide a team ID",
          isError: true,
        })
      );
      return;
    }
    if (!memberId) {
      res.status(400).json(
        responseAdapter({
          data: [],
          error: RESPONSE_ERROR.BAD_REQUEST,
          errorDetails: "Please provide a member ID",
          isError: true,
        })
      );
      return;
    }
    const TASKS_CONDITIONS = {
      AND: [
        {
          assignedTo: Number(memberId),
        },
        {
          teamId: Number(teamId),
        },
      ],
    };
    const FILTERED_TASKS = {
      AND: [
        {
          teamId: Number(teamId),
        },
        {
          assignedTo: Number(memberId),
        },
        {
          status: status as TaskStatus,
        },
      ],
    };

    const tasksCount = await prisma.task.count({
      where: status === undefined ? TASKS_CONDITIONS : FILTERED_TASKS,
    });
    const tasks = await prisma.task.findMany({
      where: status === undefined ? TASKS_CONDITIONS : FILTERED_TASKS,
    });

    const totalPages = calcTotalPages(tasksCount, Number(limit));
    const remainingPages = calcRemainingPages(totalPages, Number(page));

    res.status(200).json(
      paginatedResponseAdapter({
        data: tasks,
        pagination: {
          page: Number(page),
          totalPages,
          remainingPages: remainingPages <= -1 ? 0 : remainingPages,
        },
      })
    );
  } catch (error: any) {
    console.error("🛑 Error in getTasksByProjectId", error);
    res.status(400).json(
      responseAdapter({
        data: [],
        error: RESPONSE_ERROR.BAD_REQUEST,
        errorDetails: error,
        isError: true,
      })
    );
    return;
  }
};

export const assignTaskToUser = async (req: Request, res: Response) => {
  try {
    const { user } = res.locals.user as { user: TokenPayloadType };
    const task = req.body;

    if (!task.teamId) {
      res.status(400).json(
        responseAdapter({
          data: [],
          error: RESPONSE_ERROR.BAD_REQUEST,
          errorDetails: "Please provide a team ID",
          isError: true,
        })
      );
      return;
    }

    if (!task.assignedTo) {
      res.status(400).json(
        responseAdapter({
          data: [],
          error: RESPONSE_ERROR.BAD_REQUEST,
          errorDetails: "Please provide a user ID",
          isError: true,
        })
      );
      return;
    }

    const createdTask = await prisma.task.create({
      data: {
        ...task,
        assignedTo: Number(task.assignedTo),
        teamId: Number(task.teamId),
      },
    });

    res.status(201).json(
      responseAdapter({
        data: createdTask,
      })
    );
  } catch (error: any) {
    console.error("🛑 Error in assignTaskToUser", error);
    res.status(400).json(
      responseAdapter({
        data: [],
        error: RESPONSE_ERROR.BAD_REQUEST,
        errorDetails: error,
        isError: true,
      })
    );
    return;
  }
};

export const updateTask = async (req: Request, res: Response) => {
  try {
    const { user } = res.locals.user as { user: TokenPayloadType };
    const { taskId } = req.params;
    const newTask = req.body;

    if (!taskId) throw new Error("Please provide a task ID");
    if (Object.keys(newTask).length === 0)
      throw new Error("Please provide a task object to update");

    const updatedTask = await prisma.task.update({
      where: { id: Number(taskId) },
      data: newTask,
    });
    res.status(200).json(
      responseAdapter({
        data: updatedTask,
      })
    );
  } catch (error: any) {
    console.error("🛑 Error in updateTask", error);
    res.status(400).json(
      responseAdapter({
        data: [],
        error: RESPONSE_ERROR.BAD_REQUEST,
        errorDetails: error,
        isError: true,
      })
    );
  }
};

export const updateTaskStatus = async (req: Request, res: Response) => {
  try {
    const { user } = res.locals.user as { user: TokenPayloadType };

    const { taskId } = req.params;
    const { status } = req.body;

    if (!taskId) throw new Error("Please provide a task ID");
    if (!status) throw new Error("Please provide a task status to update");

    const updatedTask = await prisma.task.update({
      where: { id: Number(taskId) },
      data: {
        status,
      },
      select: {
        id: true,
        status: true,
      },
    });
    res.status(200).json(
      responseAdapter({
        data: updatedTask,
      })
    );
  } catch (error: any) {
    console.error("🛑 Error in updateTaskStatus", error);
    res.status(400).json(
      responseAdapter({
        data: [],
        error: RESPONSE_ERROR.BAD_REQUEST,
        errorDetails: error,
        isError: true,
      })
    );
  }
};

export const deleteTask = async (req: Request, res: Response) => {
  try {
    const { user } = res.locals.user as { user: TokenPayloadType };
    const { taskId } = req.params;

    if (!taskId) throw new Error("Please provide a task ID");

    await prisma.task.delete({
      where: { id: Number(taskId) },
    });

    res.status(200).json(
      responseAdapter({
        data: [],
      })
    );
  } catch (error: any) {
    console.error("🛑 Error in deleteTask", error);
    res.status(400).json(
      responseAdapter({
        data: [],
        error: RESPONSE_ERROR.BAD_REQUEST,
        errorDetails: error,
        isError: true,
      })
    );
  }
};
