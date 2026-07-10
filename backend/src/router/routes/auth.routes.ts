import { Router } from '../../util/cjsDeps';
import type { Request, Response } from 'express';
import signupValidation from '../../middleware/signupValidation.middleware';
import {
  forgotPassword,
  getAllUsers,
  registerUser,
  registerSuperAdmin,
  resetPassword,
  userLogin,
  userLogout,
  activateAccount,
  registerVeterinarian,
} from '../../controller/auth.controller';
import asyncWrapper from "../../util/asyncWrapper";
import validate from "../../middleware/validation/validation";
import resetPasswordSchemas from "../../validation/resetPasswordSchemas";
import checkRole from "../../middleware/checkRole.middleware";
import { Roles } from "@prisma/client";
import isAuthorized from "../../middleware/isAuthorized.middleware";
import authMiddleware from "../../middleware/auth.middleware";
import adminValidation from "../../validation/admin.validation";

const route = Router();

route.post(
  "/signup",
  isAuthorized,
  checkRole([Roles.ADMIN, Roles.SUPERADMIN]),
  asyncWrapper(authMiddleware.checkInitialBody),
  signupValidation,
  registerUser
);
route.post(
  "/register/super",
  validate(adminValidation.adminSchema),
  async (req, res, next) => {
    // Bootstrap only: allow when no super admin exists, or ALLOW_SUPER_REGISTER=true
    const allow = process.env.ALLOW_SUPER_REGISTER === "true";
    if (!allow) {
      const { default: prisma } = await import("../../db/prisma");
      const existing = await prisma.account.count({
        where: { role: Roles.SUPERADMIN },
      });
      if (existing > 0) {
        return res.status(403).json({
          message: "Super admin registration is disabled.",
        });
      }
    }
    next();
  },
  registerSuperAdmin
);
route.post('/login', userLogin);
route.post('/logout', userLogout);
route.get('/users', isAuthorized, checkRole([Roles.SUPERADMIN]), getAllUsers);
route.patch(
  '/accounts/:accountId/activate',
  isAuthorized,
  checkRole([Roles.SUPERADMIN]),
  activateAccount
);
route.post(
  '/register/veterinarian',
  isAuthorized,
  checkRole([Roles.ADMIN]),
  asyncWrapper(authMiddleware.checkInitialBody),
  signupValidation,
  registerVeterinarian
);
route.get(
  "/forgotpass/",
  validate(resetPasswordSchemas.forgotPasswordSchema),
  asyncWrapper(forgotPassword)
);
route.get(
  "/resetpass/:token",
  validate(resetPasswordSchemas.resetPasswordSchema),
  asyncWrapper(resetPassword)
);


export default route;
