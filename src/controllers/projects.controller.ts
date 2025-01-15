import { Request, Response } from "express";
import { PrismaClient, Project } from "@prisma/client";
import { responseAdapter } from "../utils/adaptors/response";
import { RESPONSE_ERROR } from "../types/response";
import { paginatedResponseAdapter } from "../utils/adaptors/paginated-response";
import {
  calcRemainingPages,
  calcTotalPages,
  resultPagination,
} from "../utils/results-pagination";
import { TokenPayloadType } from "../types/users";

const prisma = new PrismaClient();

export const getProjectsByCompanyId = async (req: Request, res: Response) => {
  const { user } = res.locals as { user: TokenPayloadType };

  const {
    page = 1,
    limit = 4,
    sortBy = "startDate",
    sortDir = "asc",
  } = req.query;

  try {
    if (!user.companyId) {
      res.status(400).json(
        responseAdapter({
          data: [],
          isError: true,
          error: "Please provide a company ID.",
        })
      );

      return;
    }
    const projectsCount = await prisma.project.count({
      where: { companyId: Number(user.companyId) },
    });
    const projects = await prisma.project.findMany({
      where: {
        companyId: Number(user.companyId),
      },
      ...resultPagination({ limit: Number(limit), page: Number(page) }),
      orderBy: {
        [sortBy as keyof Omit<
          Project,
          "company" | "companyId" | "id" | "teams" | "manager" | "managerId"
        >]: sortDir,
      },
    });

    if (projects.length === 0) {
      res.status(404).json(
        paginatedResponseAdapter<Project>({
          error: RESPONSE_ERROR.NOT_FOUND,
          isError: true,
          data: [],
          pagination: {
            page: Number(page),
            totalPages: 0,
            remainingPages: 0,
          },
        })
      );
      return;
    }
    const totalPages = calcTotalPages(projectsCount, Number(limit));
    const remainingPages = calcRemainingPages(totalPages, Number(page));
    res.status(200).json(
      paginatedResponseAdapter<Project>({
        data: projects,
        pagination: {
          page: Number(page),
          totalPages,
          remainingPages: remainingPages <= -1 ? 0 : remainingPages,
        },
      })
    );
  } catch (error) {
    console.error("🛑 Error fetching projects", error);
    res.status(400).json(
      paginatedResponseAdapter<Project>({
        data: [],
        isError: true,
        error: RESPONSE_ERROR.BAD_REQUEST,
        pagination: {
          page: Number(page),
          totalPages: 0,
          remainingPages: 0,
        },
      })
    );
  }
};

export const createProject = async (req: Request, res: Response) => {
  const project = req.body as Project;
  const { user } = res.locals as { user: TokenPayloadType };

  try {
    if (!user.companyId) {
      res.status(400).json(
        responseAdapter({
          data: [],
          isError: true,
          error: "Please provide a company ID.",
        })
      );
      return;
    }

    if (!project.managerId) {
      res.status(400).json(
        responseAdapter({
          data: [],
          isError: true,
          error: "Please provide a manager ID.",
        })
      );
      return;
    }

    const newProject = await prisma.project.create({
      data: { ...project, companyId: Number(user.companyId) },
      select: {
        id: true,
        name: true,
        description: true,
        startDate: true,
        endDate: true,
        status: true,
      },
    });
    res.status(201).json(
      responseAdapter({
        data: newProject,
      })
    );
  } catch (error) {
    console.error("🛑 Error creating project", error);
    res.status(400).json(
      responseAdapter({
        data: [],
        isError: true,
        error: RESPONSE_ERROR.BAD_REQUEST,
      })
    );
  }
};

export const getProjectDetails = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.query;
    const { user } = res.locals as { user: TokenPayloadType };
    if (!user.companyId) {
      res.status(404).json(
        responseAdapter({
          data: [],
          error: RESPONSE_ERROR.NOT_FOUND,
          isError: true,
          errorDetails: "Please provide a company ID.",
        })
      );
      return;
    }

    if (!projectId) {
      res.status(404).json(
        responseAdapter({
          data: [],
          error: RESPONSE_ERROR.NOT_FOUND,
          isError: true,
          errorDetails: "Please provide a project ID.",
        })
      );
      return;
    }

    const project = await prisma.project.findUnique({
      where: {
        companyId: Number(user.companyId),
        id: Number(projectId),
      },
    });

    if (!project) {
      res.status(404).json(
        responseAdapter({
          data: [],
          error: RESPONSE_ERROR.NOT_FOUND,
          isError: true,
          errorDetails: "Project not found.",
        })
      );
      return;
    }

    res.status(200).json(
      responseAdapter({
        data: project,
      })
    );
  } catch (e) {
    console.error("🛑 Error fetching project details", e);
    res.status(400).json(
      responseAdapter({
        data: [],
        isError: true,
        error: RESPONSE_ERROR.BAD_REQUEST,
      })
    );
  }
};

export const deleteProject = async (req: Request, res: Response) => {
  const { companyId, projectId } = req.query;

  try {
    if (!companyId) {
      res.status(400).json(
        responseAdapter({
          data: [],
          isError: true,
          error: "Please provide a company ID.",
        })
      );
      return;
    }
    if (!projectId) {
      res.status(400).json(
        responseAdapter({
          data: [],
          isError: true,
          error: "Please provide a project ID.",
        })
      );
      return;
    }

    const deletedProject = await prisma.project.delete({
      where: {
        companyId: parseInt(companyId as string),
        id: parseInt(projectId as string),
      },
    });

    res.status(200).json(
      responseAdapter({
        data: deletedProject,
        isError: false,
        error: null,
      })
    );
  } catch (error) {
    console.error("🛑 Error deleting project", error);
    res.status(400).json(
      responseAdapter({
        data: [],
        isError: true,
        error: RESPONSE_ERROR.BAD_REQUEST,
      })
    );
  }
};
