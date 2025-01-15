import { NextFunction, Request, Response } from "express";
import { RESPONSE_ERROR } from "../types/response";
import { verifyToken } from "../utils/jwt";
import { responseAdapter } from "../utils/adaptors/response";

export const withAuthentication = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      res.status(401).json(
        responseAdapter({
          data: [],
          isError: true,
          error: RESPONSE_ERROR.NOT_AUTHENTICATED,
        })
      );
      return;
    }
    const tokenPayload = verifyToken(token);
    if (!tokenPayload) {
      res.status(401).json(
        responseAdapter({
          data: [],
          isError: true,
          error: RESPONSE_ERROR.NOT_AUTHENTICATED,
        })
      );
      return;
    }

    res.locals.user = tokenPayload;
    next();
  } catch (error) {
    console.error("🛑 Error verifying token", error);
    res.status(400).json(
      responseAdapter({
        data: [],
        isError: true,
        error: RESPONSE_ERROR.BAD_REQUEST,
      })
    );
  }
};
