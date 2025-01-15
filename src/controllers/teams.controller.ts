import { Request, Response } from "express";
import { responseAdapter } from "../utils/adaptors/response";
import { RESPONSE_ERROR } from "../types/response";
import { PrismaClient, Team, TeamRole, UserRole } from "@prisma/client";
import { TokenPayloadType } from "../types/users";

type TeamType = Team & {
  members: number[];
};
import { paginatedResponseAdapter } from "../utils/adaptors/paginated-response";
import {
  calcRemainingPages,
  calcTotalPages,
} from "../utils/results-pagination";

const prisma = new PrismaClient();

export const getTeamsByProjectId = async (req: Request, res: Response) => {
  const { projectId } = req.params;
  const { limit = 3, page = 1 } = req.query;
  try {
    const teamsCount = await prisma.team.count({
      where: { projectId: parseInt(projectId) },
    });

    const totalPages = calcTotalPages(teamsCount, Number(limit));
    const remainingPages = calcRemainingPages(totalPages, Number(page));
    const teams = await prisma.team.findMany({
      where: { projectId: parseInt(projectId) },
      select: {
        id: true,
        name: true,
        description: true,
        leader: {
          select: { id: true, name: true, email: true, joinedAt: true },
        },
        members: {
          select: { id: true, name: true, email: true, joinedAt: true },
          take: 6,
          skip: 0,
        },
      },
      take: Number(limit),
      skip: (Number(page) - 1) * Number(limit),
    });

    if (teams.length === 0) {
      res.status(404).json(
        responseAdapter({
          data: [],
          isError: true,
          error: RESPONSE_ERROR.NOT_FOUND,
        })
      );
    }

    res.json(
      paginatedResponseAdapter({
        data: teams,
        pagination: { page: Number(page), remainingPages, totalPages },
      })
    );
  } catch (e) {
    console.error("🛑 Error fetching teams: ", e);
    res.status(400).json(
      responseAdapter({
        data: [],
        isError: true,
        error: RESPONSE_ERROR.BAD_REQUEST,
      })
    );
  }
};

export const addNewTeam = async (req: Request, res: Response) => {
  const { user } = res.locals as { user: TokenPayloadType };

  const { team, members } = req.body as {
    team: Omit<TeamType, "id" | "members">;
    members: number[];
  };

  try {
    const [addedMembers, updatedTeam] = await prisma.$transaction(
      async (ctx) => {
        const newTeam = await ctx.team.create({
          data: team,
          select: {
            id: true,
            projectId: true,
            leaderId: true,
          },
        });

        const teamMembersList = members.map((member) => ({
          teamId: newTeam.id,
          userId: member,
          role: TeamRole.MEMBER,
        }));

        const addedMembers = await ctx.teamMembers.createManyAndReturn({
          data: teamMembersList,
        });

        if (addedMembers.length === 0) {
          throw new Error("No members were added to the team");
        }

        const updatedTeam = await ctx.team.update({
          where: { id: newTeam.id },
          data: {
            members: {
              connect: addedMembers.map((member) => ({ id: member.userId })),
            },
          },
        });

        return [addedMembers, updatedTeam];
      }
    );
    res
      .status(201)
      .json(responseAdapter({ data: { updatedTeam, addedMembers } }));
  } catch (error: any) {
    console.error("🛑 Error adding new team: ", error);
    res.status(400).json(
      responseAdapter({
        data: [],
        isError: true,
        error: RESPONSE_ERROR.BAD_REQUEST,
        errorDetails: error.message,
      })
    );
  }
};

export const getTeamDetails = async (req: Request, res: Response) => {
  const { teamId } = req.params;
  const { user } = res.locals as { user: TokenPayloadType };

  try {
    const team = await prisma.team.findUnique({
      where: {
        id: parseInt(teamId),
      },
      select: {
        id: true,
        name: true,
        description: true,
        leader: {
          select: {
            id: true,
            name: true,
            email: true,
            joinedAt: true,
            role: true,
          },
        },
        members: {
          select: {
            id: true,
            name: true,
            email: true,
            joinedAt: true,
            role: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            description: true,
            startDate: true,
            endDate: true,
          },
        },
      },
    });

    if (!team) {
      res.status(404).json(
        responseAdapter({
          data: [],
          isError: true,
          error: RESPONSE_ERROR.NOT_FOUND,
        })
      );
      return;
    }

    res.json(responseAdapter({ data: team }));
  } catch (error) {
    console.error("🛑 Error fetching team details: ", error);
    res.status(400).json(
      responseAdapter({
        data: [],
        isError: true,
        error: RESPONSE_ERROR.BAD_REQUEST,
      })
    );
  }
};

export const deleteTeam = async (req: Request, res: Response) => {
  const { teamId } = req.params;
  const { user } = res.locals as { user: TokenPayloadType };

  try {
    const deleteData = await prisma.$transaction([
      prisma.teamMembers.deleteMany({
        where: { teamId: parseInt(teamId) },
      }),
      prisma.team.delete({
        where: { id: parseInt(teamId) },
      }),
    ]);

    res.json(responseAdapter({ data: deleteData }));
  } catch (error) {
    console.error("🛑 Error deleting team: ", error);
    res.status(400).json(
      responseAdapter({
        data: [],
        isError: true,
        error: RESPONSE_ERROR.BAD_REQUEST,
      })
    );
  }
};

export const updateTeam = async (req: Request, res: Response) => {
  const { teamId } = req.params;
  const { user } = res.locals as { user: TokenPayloadType };
  const updatedTeam = req.body as Partial<Team>;
  console.log("updatedTeam: ", updatedTeam);
  try {
    const team = await prisma.team.update({
      where: {
        id: parseInt(teamId),
      },
      data: {},
    });

    if (!team) {
      res.status(404).json(
        responseAdapter({
          data: [],
          isError: true,
          error: RESPONSE_ERROR.NOT_FOUND,
        })
      );
      return;
    }
    res.json(responseAdapter({ data: team }));
  } catch (error) {
    console.error("🛑 Error updating team: ", error);
    res.status(400).json(
      responseAdapter({
        data: [],
        isError: true,
        error: RESPONSE_ERROR.BAD_REQUEST,
      })
    );
  }
};

// export const addTeamMember = async (req: Request, res: Response) => {
//   try {
//     const { teamId } = req.params;
//     const { user } = res.locals as { user: TokenPayloadType };
//     const { id: userId, role } = req.body;

//     if (role === TeamRole.LEADER) {
//       throw new Error(
//         "Team leader role are not allowed to added, members only !"
//       );
//     }
//     const updatedTeam = await prisma.team.update({
//       where: {
//         id: parseInt(teamId),
//       },
//       data: {
//         members: {
//           connect: {
//             id: userId,
//           },
//         },
//       },
//       select: {
//         members: {
//           select: { id: true, name: true, email: true, role: true },
//         },
//       },
//     });

//     res.status(200).json(responseAdapter({ data: updatedTeam }));
//   } catch (error: any) {
//     console.error("🛑 Error adding team member: ", error);

//     res.status(400).json(
//       responseAdapter({
//         data: [],
//         isError: true,
//         error: RESPONSE_ERROR.BAD_REQUEST,
//         errorDetails: error.message,
//       })
//     );
//   }
// };

export const addTeamMember = async (req: Request, res: Response) => {
  try {
    const { teamId } = req.params;
    const { user } = res.locals as { user: TokenPayloadType };
    const members = req.body as { role: TeamRole; id: number }[];

    if (members.some((item) => item.role === TeamRole.LEADER)) {
      throw new Error(
        "Team leader role are not allowed to added, members only !"
      );
    }

    const [addedMembers, updatedTeam] = await prisma.$transaction(
      async (ctx) => {
        const addedMembers = await ctx.teamMembers.createManyAndReturn({
          data: members.map((member) => ({
            teamId: parseInt(teamId),
            userId: member.id,
            role: member.role,
          })),
        });

        const updatedTeam = await ctx.team.update({
          where: {
            id: parseInt(teamId),
          },
          data: {
            members: {
              connect: addedMembers.map((member) => ({ id: member.userId })),
            },
          },
          select: {
            members: {
              select: { id: true, name: true, email: true, role: true },
            },
          },
        });

        return [addedMembers, updatedTeam];
      }
    );

    res
      .status(200)
      .json(responseAdapter({ data: { addedMembers, updatedTeam } }));
  } catch (error: any) {
    console.error("🛑 Error adding team member: ", error);

    res.status(400).json(
      responseAdapter({
        data: [],
        isError: true,
        error: RESPONSE_ERROR.BAD_REQUEST,
        errorDetails: error.message,
      })
    );
  }
};

export const removeTeamMember = async (req: Request, res: Response) => {
  try {
    const { teamId, teamMemberId } = req.query;
    const { user } = res.locals as { user: TokenPayloadType };

    if (!teamId) {
      throw new Error("teamId is required");
    }

    if (!teamMemberId) {
      throw new Error("userId is required");
    }

    const memberRemoveOperation = await prisma.$transaction([
      prisma.team.update({
        where: {
          id: Number(teamId),
        },
        data: {
          members: {
            disconnect: {
              id: Number(teamMemberId),
            },
          },
        },
        select: {
          members: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
      }),
      prisma.teamMembers.deleteMany({
        where: {
          id: Number(teamMemberId),
          teamId: Number(teamId),
        },
      }),
    ]);

    res.status(200).json(responseAdapter({ data: memberRemoveOperation }));
  } catch (error: any) {
    console.error("🛑 Error removing team member: ", error);
    res.status(400).json(
      responseAdapter({
        data: [],
        isError: true,
        error: RESPONSE_ERROR.BAD_REQUEST,
        errorDetails: error.message,
      })
    );
  }
};

export const clearTeamMembers = async (req: Request, res: Response) => {
  try {
    const { teamId } = req.params;
    const { user } = res.locals as { user: TokenPayloadType };

    const updatedTeam = await prisma.teamMembers.deleteMany({
      where: {
        teamId: parseInt(teamId),
      },
    });
    res.status(200).json(responseAdapter({ data: updatedTeam }));
  } catch (error: any) {
    console.error("🛑 Error clearing team members: ", error);
    res.status(400).json(
      responseAdapter({
        data: [],
        isError: true,
        error: RESPONSE_ERROR.BAD_REQUEST,
        errorDetails: error.message,
      })
    );
  }
};
