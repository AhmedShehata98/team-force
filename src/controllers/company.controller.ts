import { Company, PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { responseAdapter } from "../utils/adaptors/response";
import { RESPONSE_ERROR } from "../types/response";
const prisma = new PrismaClient();

export const addCompany = async (req: Request, res: Response) => {
  try {
    const company = req.body as Company;
    const newCompany = await prisma.company.createManyAndReturn({
      data: company,
    });

    res.status(201).json(
      responseAdapter({
        data: newCompany,
      })
    );
  } catch (error) {
    console.error("🛑 Error adding company", error);
    res.status(400).json(
      responseAdapter({
        isError: true,
        error: RESPONSE_ERROR.BAD_REQUEST,
        data: [],
      })
    );
  }
};

export const getAllCompanies = async (req: Request, res: Response) => {
  try {
    const companies = await prisma.company.findMany();

    res.status(200).json(responseAdapter({ data: companies }));
  } catch (error) {
    console.error("🛑 Error fetching companies", error);
    res.status(400).json(
      responseAdapter({
        error: RESPONSE_ERROR.BAD_REQUEST,
        data: [],
        isError: true,
      })
    );
  }
};

export const getCompanyInfo = async (req: Request, res: Response) => {
  const { user } = res.locals;
  try {
    const company = await prisma.company.findUnique({
      where: { id: parseInt(user.companyId) },
      select: {
        id: true,
        name: true,
        ownerName: true,
        bio: true,
        createdAt: true,
      },
    });
    if (!company) {
      res.status(404).json(
        responseAdapter({
          data: [],
          isError: true,
          error: RESPONSE_ERROR.NOT_FOUND,
        })
      );
    } else {
      res.status(200).json(responseAdapter({ data: company }));
    }
  } catch (error) {
    console.error("🛑 Error fetching company", error);
    res.status(400).json(
      responseAdapter({
        data: [],
        isError: true,
        error: RESPONSE_ERROR.BAD_REQUEST,
      })
    );
  }
};

export const deleteCompany = async (req: Request, res: Response) => {
  const { companyId } = req.params;
  try {
    const company = await prisma.company.delete({
      where: { id: parseInt(companyId) },
    });
    res.status(200).json(responseAdapter({ data: company }));
  } catch (error) {
    console.error("🛑 Error deleting company", error);
    res.status(400).json(
      responseAdapter({
        data: [],
        isError: true,
        error: RESPONSE_ERROR.BAD_REQUEST,
      })
    );
  }
};
