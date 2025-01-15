import { Router } from "express";
import {
  addCompany,
  deleteCompany,
  getAllCompanies,
  getCompanyInfo,
} from "../controllers/company.controller";
import { withAuthentication } from "../middleware/with-auth";

export const companyRouter = Router();

companyRouter.post("/", addCompany);
companyRouter.get("/", getAllCompanies);
companyRouter.get("/info", withAuthentication, getCompanyInfo);
companyRouter.delete("/:companyId", deleteCompany);
