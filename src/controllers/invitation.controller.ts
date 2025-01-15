import { RESPONSE_ERROR } from "../types/response";
import { responseAdapter } from "../utils/adaptors/response";
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
import { Request, Response } from "express";
import { TokenPayloadType } from "../types/users";
import { sendMail } from "./mail.controller";

const prisma = new PrismaClient();
export const sendInvitation = async (req: Request, res: Response) => {
  try {
    const { user } = res.locals as { user: TokenPayloadType };

    const FRONTEND_INVITATION_PATH_URL = `${process.env.FRONTEND_URL}/invitation`;
    const oneDayInMilliseconds = 24 * 60 * 60 * 1000;
    const expirationDate = new Date(Date.now() + oneDayInMilliseconds);
    const data = req.body;
    const invitationToken = crypto.randomBytes(32).toString("hex");

    if (!user.companyId) {
      res.status(404).json(
        responseAdapter({
          data: [],
          error: RESPONSE_ERROR.NOT_FOUND,
          errorDetails:
            "User does not belong to a company or company id is not found",
          isError: true,
        })
      );
    }

    console.log({
      ...data,
      companyId: user.companyId,
      expiresAt: expirationDate,
      token: invitationToken,
    });

    const invite = await prisma.invitation.create({
      data: {
        ...data,
        companyId: user.companyId,
        expiresAt: expirationDate,
        token: invitationToken,
      },
      select: {
        email: true,
        status: true,
        company: true,
      },
    });
    console.log("invite: ", invite);

    await sendMail({
      to: data.email,
      subject: `Invitation to join the company : ${invite.company.name}`,
      text: `You have been invited to join the ${invite.company.name}. Please click on the link to accept the invitation: ${FRONTEND_INVITATION_PATH_URL}/${invitationToken}`,
    });

    res.status(200).json(
      responseAdapter({
        data: { invite },
        error: null,
        isError: false,
      })
    );
  } catch (error: any) {
    console.error("🛑 Error in sendInvitationMail", error);
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
