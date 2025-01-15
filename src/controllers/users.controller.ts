import { PrismaClient, User, UserRole } from "@prisma/client";
import { Request, Response } from "express";
import { responseAdapter } from "../utils/adaptors/response";
import { RESPONSE_ERROR } from "../types/response";
import { TokenPayloadType } from "../types/users";
import { comparePasswords, hashPassword } from "../utils/protect-password";
import { generateToken, verifyToken } from "../utils/jwt";
import {
  calcRemainingPages,
  calcTotalPages,
  resultPagination,
} from "../utils/results-pagination";
import { paginatedResponseAdapter } from "../utils/adaptors/paginated-response";

const prisma = new PrismaClient();

export const getUsersByCompanyId = async (req: Request, res: Response) => {
  const {
    user: { companyId },
  } = res.locals as { user: TokenPayloadType };

  const {
    page = 1,
    limit = 4,
    sortBy = "joinedAt",
    sortDir = "asc",
    companyId: companyIdQueryParam,
    query = "",
  } = req.query;

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        skills: true,
      },
      where: {
        OR: [
          {
            companyId: Number(companyId || companyIdQueryParam),
          },
          {
            companyId: Number(companyId || companyIdQueryParam),
            name: {
              contains: query as string,
            },
          },
        ],
      },
      ...resultPagination({ limit: Number(limit), page: Number(page) }),
      orderBy: {
        [sortBy as keyof Omit<User, "id" | "password" | "companyId">]: sortDir,
      },
    });

    if (users.length === 0) {
      res.status(404).json(
        paginatedResponseAdapter<[]>({
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

    res.status(200).json(
      paginatedResponseAdapter({
        data: users,
        pagination: {
          page: Number(page),
          totalPages: calcTotalPages(users.length, Number(limit)),
          remainingPages: calcRemainingPages(
            calcTotalPages(users.length, Number(limit)),
            Number(page)
          ),
        },
      })
    );
  } catch (error) {
    console.error("🛑 Error fetching users", error);
    res.status(400).json(
      responseAdapter({
        data: [],
        isError: true,
        error: RESPONSE_ERROR.BAD_REQUEST,
      })
    );
  }
};

export const getUserDetails = async (req: Request, res: Response) => {
  const { user } = res.locals as { user: TokenPayloadType };
  const { userId } = req.params;

  try {
    const userDetails = await prisma.user.findUnique({
      where: { id: Number(userId), companyId: Number(user.companyId) },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        skills: true,
        joinedAt: true,
      },
    });
    if (!userDetails) {
      res.status(404).json(
        responseAdapter({
          data: [],
          isError: true,
          error: RESPONSE_ERROR.NOT_FOUND,
        })
      );
      return;
    }
    res.status(200).json(responseAdapter({ data: userDetails }));
  } catch (error) {
    console.error("🛑 Error fetching user details", error);
  }
};

export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      res.status(404).json(
        responseAdapter({
          data: [],
          isError: true,
          error: RESPONSE_ERROR.INCORRECT_LOGIN_DATA,
        })
      );
      return;
    }

    const isPasswordValid = await comparePasswords(password, user.password);
    if (!isPasswordValid) {
      res.status(400).json(
        responseAdapter({
          data: [],
          isError: true,
          error: RESPONSE_ERROR.INCORRECT_LOGIN_DATA,
        })
      );
      return;
    }

    if (!user.companyId)
      throw new Error("User is not associated with a company");

    const payload: TokenPayloadType = {
      companyId: user.companyId,
      userId: user.id,
    };
    const token = generateToken(payload);

    res
      .cookie("token", token, {
        secure: true,
        httpOnly: true,
      })
      .status(200)
      .json(
        responseAdapter({
          data: { name: user.name },
          isError: false,
          error: null,
        })
      );
  } catch (error) {
    console.error("🛑 Error logging in user", error);
    res.status(400).json(
      responseAdapter({
        data: [],
        isError: true,
        error: RESPONSE_ERROR.BAD_REQUEST,
      })
    );
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    res
      .clearCookie("token")
      .status(200)
      .json(
        responseAdapter({
          data: true,
          isError: false,
          error: null,
        })
      );
  } catch (error) {
    console.error("🛑 Error logging out user", error);
    res.status(400).json(
      responseAdapter({
        data: false,
        isError: true,
        error: RESPONSE_ERROR.BAD_REQUEST,
      })
    );
  }
};

export const getMeInfo = async (req: Request, res: Response) => {
  const { user } = res.locals;

  try {
    const userInfo = await prisma.user.findUnique({
      where: { id: user.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        skills: true,
      },
    });
    if (!userInfo) {
      res.status(404).json(
        responseAdapter({
          data: [],
          isError: true,
          error: RESPONSE_ERROR.NOT_FOUND,
        })
      );
      return;
    }
    res.json(responseAdapter({ data: userInfo, isError: false, error: null }));
  } catch (error) {
    console.error("🛑 Error fetching user info", error);
    res.status(400).json(
      responseAdapter({
        data: [],
        isError: true,
        error: RESPONSE_ERROR.BAD_REQUEST,
      })
    );
  }
};

export const register = async (req: Request, res: Response) => {
  const userData = req.body as User;
  try {
    if (userData.role !== UserRole.ADMIN) {
      res.status(400).json(
        responseAdapter({
          data: [],
          isError: true,
          error: "Admin user must be created in the company's initial setup.",
        })
      );
      return;
    }

    if (!userData.companyId) {
      res.status(400).json(
        responseAdapter({
          data: [],
          isError: true,
          error: "Company ID is required to create a user.",
        })
      );
      return;
    }

    const hashedPassword = await hashPassword(userData.password);

    const user = await prisma.user.create({
      data: { ...userData, password: hashedPassword },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        skills: true,
      },
    });

    const payload: TokenPayloadType = {
      companyId: userData.companyId,
      userId: user.id,
    };
    const token = generateToken(payload);

    res
      .cookie("token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
      })
      .status(201)
      .json(responseAdapter({ data: user }));
  } catch (error) {
    console.error("🛑 Error creating user", error);
    res.status(400).json(
      responseAdapter({
        data: [],
        isError: true,
        error: RESPONSE_ERROR.BAD_REQUEST,
      })
    );
  }
};

export const createUser = async (req: Request, res: Response) => {
  const {
    user: { companyId },
  } = res.locals as { user: TokenPayloadType };

  try {
    if (!companyId) {
      res.status(400).json(
        responseAdapter({
          data: [],
          isError: true,
          error: RESPONSE_ERROR.NOT_AUTHENTICATED,
          errorDetails: "please provide company ID",
        })
      );
      return;
    }

    const userData = req.body as Omit<User, "id" | "companyId">;
    const hashedPassword = await hashPassword(userData.password);
    const newUser = await prisma.user.create({
      data: {
        ...userData,
        password: hashedPassword,
        companyId: Number(companyId),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        skills: true,
      },
    });

    res.status(201).json(responseAdapter({ data: newUser }));
  } catch (error: any) {
    console.error("🛑 creating user", error);
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

export const updateUser = async (req: Request, res: Response) => {
  const { userId } = req.params;
  const userData = req.body as User;
  const {
    user: { companyId },
  } = res.locals as { user: TokenPayloadType };

  try {
    const user = await prisma.user.update({
      where: { id: parseInt(userId), companyId: Number(companyId) },
      data: userData,
    });

    if (!user) {
      res.status(404).json(
        responseAdapter({
          data: [],
          isError: true,
          error: RESPONSE_ERROR.NOT_FOUND,
        })
      );
    } else {
      res.json(responseAdapter({ data: user }));
    }
  } catch (error: any) {
    console.error("🛑 Error updating user", error);
    res.status(400).json(
      responseAdapter({
        data: null,
        isError: true,
        error: RESPONSE_ERROR.BAD_REQUEST,
        errorDetails: error.message,
      })
    );
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  const { userId } = req.params;
  const {
    user: { companyId },
  } = res.locals as { user: TokenPayloadType };

  try {
    const user = await prisma.user.delete({
      where: { id: parseInt(userId), companyId: Number(companyId) },
    });
    if (!user) {
      res.status(404).json(
        responseAdapter({
          data: [],
          isError: true,
          error: RESPONSE_ERROR.NOT_FOUND,
        })
      );
    } else {
      res.json(responseAdapter({ data: user }));
    }
  } catch (error: any) {
    console.error("🛑 Error deleting user", error);
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

export const checkIsValidToken = async (req: Request, res: Response) => {
  const cookie = req.cookies;

  try {
    const token = cookie?.token;

    if (!token) {
      res.status(401).json(
        responseAdapter({
          data: false,
          isError: true,
          error: RESPONSE_ERROR.UNAUTHORIZED,
          errorDetails: "No token provided expect string but got undefined",
        })
      );
      return;
    }
    const user = verifyToken(token) as TokenPayloadType | null;

    if (!user) {
      res.status(401).json(
        responseAdapter({
          data: false,
          isError: true,
          error: RESPONSE_ERROR.UNAUTHORIZED,
        })
      );
      return;
    }

    const isExist = await prisma.user.findFirst({
      where: { id: user.userId, companyId: user.companyId },
    });
    if (!isExist) {
      res.status(404).json(
        responseAdapter({
          data: false,
          isError: true,
          error: RESPONSE_ERROR.NOT_FOUND,
        })
      );
    }

    res.status(200).json(
      responseAdapter({
        data: true,
      })
    );
  } catch (error: any) {
    console.error("🛑 Error checking user token", error);
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
