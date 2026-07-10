import { Router } from "express";
import {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  updateAccount,
  getAdminTeam,
} from "../../controller/users.controller";
import checkRole from "../../middleware/checkRole.middleware";
import { Roles } from "../../util/enum/Roles.enum";
import userMiddleware from "../../middleware/user.middleware";
import asyncWrapper from "../../util/asyncWrapper";
import validate from "../../middleware/validation/validation";
import userSchemaValidation from "../../validation/userSchema.validation";
import farmMiddleware from "../../middleware/farm.middleware";
import accountSchemaValidation from "../../validation/accountSchema.validation";
import accountMiddleware from "../../middleware/account.middleware";

const router = Router();

router.post("/", checkRole([Roles.SUPERADMIN, Roles.ADMIN]), createUser);
router.get(
  "/team",
  checkRole([Roles.ADMIN]),
  getAdminTeam
);
router.get(
  "/detail/:userId",
  checkRole([Roles.SUPERADMIN, Roles.ADMIN]),
  asyncWrapper(userMiddleware.checkUserExists),
  getUserById
);
router.get(
  "/:farmId",
  checkRole([Roles.SUPERADMIN, Roles.ADMIN, Roles.MANAGER]),
  asyncWrapper(farmMiddleware.checkUserFarmExists),
  getAllUsers
);
router.put(
  "/:userId",
  validate(userSchemaValidation.userSchema),
  asyncWrapper(userMiddleware.checkUserExists),
  updateUser
);
router.put(
  "/account/:accId",
  validate(accountSchemaValidation.accountSchema),
  asyncWrapper(accountMiddleware.checkAccountExists),
  updateAccount
);
router.delete(
  "/:userId",
  checkRole([Roles.SUPERADMIN, Roles.ADMIN]),
  asyncWrapper(userMiddleware.checkUserExists),
  deleteUser
);

export default router;
