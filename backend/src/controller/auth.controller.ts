import { NextFunction, Request, Response } from "express";
import { ReasonPhrases, StatusCodes } from "http-status-codes";
import { hashPassword } from "../service/bcrypt.service";
import passportLocal from "../config/passportLocal";
import ResponseHandler from "../util/responseHandler";
import prisma from "../db/prisma";
import { sendEmail } from "../service/sendEmail.service";
import { generateEmailVerificationToken, generateForgotPasswordToken, verifyToken } from "../service/token.service";
import { UserI } from "../interface/user.interface";
import userService from "../service/user.service";
import templateMails from "../util/templateMails";
import { Roles } from "@prisma/client";
import { use } from "passport";
import farmService from "../service/farm.service";
import { paginate } from "../util/paginate";
import { createLog } from "../service/activityLog.service";

const responseHandler = new ResponseHandler();

export const registerUser = async (req: Request, res: Response) => {
    try {
        const { fullname, username, email, gender, phone, password, farmId } = req.body;
        const RequestUser = (req as any).user.data;
        let role:Roles;

        const emailExist = await prisma.account.findUnique({ where: { email } });
        const phoneExist = await prisma.account.findUnique({ where: { phone } });
        const accountExist = await prisma.account.findUnique({ where: { username } });

        if (emailExist) {
            responseHandler.setError(StatusCodes.BAD_REQUEST, "An account with this email address already exists.");
            return responseHandler.send(res);
        }

        if (phoneExist) {
            responseHandler.setError(StatusCodes.BAD_REQUEST, "An account with this phone address already exists.");
            return responseHandler.send(res);
        }

        if (username && accountExist) {
            responseHandler.setError(StatusCodes.BAD_REQUEST, "An account with this  username already exists.");
            return responseHandler.send(res);
        }

        if (RequestUser.role === Roles.SUPERADMIN) {
            role = Roles.ADMIN;
        } else {
            role = Roles.MANAGER;
        }

        if (!farmId) {
            responseHandler.setError(StatusCodes.BAD_REQUEST, "Farm assignment is required. Create a farm first.");
            return responseHandler.send(res);
        }

        const farm = await farmService.getSingleFarm(farmId);
        if (!farm) {
            responseHandler.setError(StatusCodes.BAD_REQUEST, "Selected farm was not found.");
            return responseHandler.send(res);
        }

        if (RequestUser.role === Roles.ADMIN) {
            if (farm.ownerId !== RequestUser.userId) {
                responseHandler.setError(StatusCodes.FORBIDDEN, "You can only assign managers to your own farms.");
                return responseHandler.send(res);
            }
            if (!farm.status) {
                responseHandler.setError(StatusCodes.BAD_REQUEST, "Farm must be activated before assigning a manager.");
                return responseHandler.send(res);
            }
        }

        if (RequestUser.role === Roles.SUPERADMIN && role === Roles.ADMIN) {
            if (farm.ownerId) {
                responseHandler.setError(
                    StatusCodes.BAD_REQUEST,
                    "This farm already has a farm admin assigned. Choose an unassigned farm."
                );
                return responseHandler.send(res);
            }
        }

        const inactiveUntilActivated =
            (RequestUser.role === Roles.ADMIN && role === Roles.MANAGER);
        const userAccount = await prisma.account.create({
            data: {
                username,
                email,
                phone,
                role,
                password: await hashPassword(password),
                status: !inactiveUntilActivated,
            },
        });

        const userData = {
            accountId: userAccount.id,
            fullname,
            gender,
        };
        const user = await prisma.user.create({ data: userData });

        if (role === Roles.MANAGER) {
            await farmService.assignManagerToFarm(farmId, user.id);
        } else if (RequestUser.role === Roles.SUPERADMIN && role === Roles.ADMIN) {
            await farmService.updateFarm(farmId, { ownerId: user.id });
        }

        createLog({
            accountId: RequestUser.id,
            userId: user.id,
            action: "CREATE_USER",
            entityType: "user",
            entityId: user.id,
            details: `Created ${role} ${fullname}`,
        }).then(() => {});

        const verificationToken = generateEmailVerificationToken({ userId: user.id });

        const verificationUrl = `http://yourdomain.com/verify-email?token=${verificationToken}`;

        const emailMessage = `Please verify your email by clicking the following link: ${verificationUrl}`;

        await sendEmail(email, 'Email Verification', emailMessage);


        const message =
            inactiveUntilActivated
                ? "Manager created. Account is inactive until super admin activates it."
                : "Registration successful. Please check your email to verify your account.";
        responseHandler.setSuccess(StatusCodes.CREATED, message, user);
        return responseHandler.send(res);

    } catch (error) {
        console.log(error)
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ status: ReasonPhrases.INTERNAL_SERVER_ERROR, error: 'Server error' });
    }
};
export const registerSuperAdmin = async (req: Request, res: Response) => {
  try {
    const { fullname, username, email, gender, phone, password } = req.body;
    const emailExist = await prisma.account.findUnique({ where: { email } });
    const phoneExist = await prisma.account.findUnique({ where: { phone } });
    const accountExist = await prisma.account.findUnique({
      where: { username },
    });

    if (emailExist) {
      responseHandler.setError(
        StatusCodes.BAD_REQUEST,
        "An account with this email address already exists."
      );
      return responseHandler.send(res);
    }
    if (phoneExist) {
      responseHandler.setError(
        StatusCodes.BAD_REQUEST,
        "An account with this phone address already exists."
      );
      return responseHandler.send(res);
    }
    if (username && accountExist) {
      responseHandler.setError(
        StatusCodes.BAD_REQUEST,
        "An account with this  username already exists."
      );
      return responseHandler.send(res);
    }

    const userAccount = await prisma.account.create({
      data: {
        username,
        email,
        phone,
        role: "SUPERADMIN",
        password: await hashPassword(password),
      },
    });

    const userData = {
      accountId: userAccount.id,
      fullname,
      gender,
    };
    const user = await prisma.user.create({ data: userData });
    const verificationToken = generateEmailVerificationToken({
      userId: user.id,
    });

    const verificationUrl = `http://yourdomain.com/verify-email?token=${verificationToken}`;
    const emailMessage = `Please verify your email by clicking the following link: ${verificationUrl}`;
    await sendEmail(email, "Email Verification", emailMessage);
    responseHandler.setSuccess(
      StatusCodes.CREATED,
      "Registration successful. Please check your email to verify your account.",
      user
    );
    return responseHandler.send(res);
  } catch (error) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({
        status: ReasonPhrases.INTERNAL_SERVER_ERROR,
        error: "Server error",
      });
  }
};
export const getAllUsers = async (req: Request, res: Response) => {
    const responseHandler = new ResponseHandler();
    const { page = 1, pageSize = 10, role, status } = req.query;
    const currentPage = Math.max(1, Number(page) || 1);
    const currentPageSize = Math.min(Math.max(1, Number(pageSize) || 10), 100);

    const skip = (currentPage - 1) * currentPageSize;
    const take = currentPageSize;

    try {
      const where: { account?: { role?: Roles; status?: boolean } } = {};
      if (role && typeof role === "string" && Object.values(Roles).includes(role as Roles)) {
        where.account = { ...where.account, role: role as Roles };
      }
      if (status !== undefined && status !== "") {
        const active = status === "true" || status === "active";
        where.account = { ...where.account, status: active };
      }

      const [users, totalCount] = await Promise.all([
        prisma.user.findMany({
          where,
          include: {
            account: true,
            farms: { select: { id: true, name: true, location: true, status: true } },
          },
          skip,
          take,
          orderBy: { createdAt: "desc" },
        }),
        prisma.user.count({ where }),
      ]);

      const paginationResult = paginate(users, totalCount, currentPage, currentPageSize);
      responseHandler.setSuccess(StatusCodes.OK, "Users retrieved successfully", paginationResult);
      return responseHandler.send(res);
    } catch (error) {
      console.error("Error retrieving users:", error);
      responseHandler.setError(StatusCodes.INTERNAL_SERVER_ERROR, "Error retrieving users");
      return responseHandler.send(res);
    }
  };

export const activateAccount = async (req: Request, res: Response) => {
    const { accountId } = req.params;
    const requestUser = (req as any).user?.data;
    try {
      const account = await prisma.account.update({
        where: { id: accountId },
        data: { status: true },
      });
      if (requestUser?.id) {
        createLog({
          accountId: requestUser.id,
          action: "ACTIVATE_ACCOUNT",
          entityType: "account",
          entityId: accountId,
          details: `Account ${account.username} activated`,
        }).then(() => {});
      }
      responseHandler.setSuccess(StatusCodes.OK, "Account activated successfully", account);
    } catch (error) {
      responseHandler.setError(StatusCodes.INTERNAL_SERVER_ERROR, "Error activating account");
    }
    return responseHandler.send(res);
  };

export const registerVeterinarian = async (req: Request, res: Response) => {
    try {
      const { fullname, username, email, phone, password, farmId } = req.body;
      const requestUser = (req as any).user.data;

      if (!farmId) {
        responseHandler.setError(StatusCodes.BAD_REQUEST, "Farm assignment is required. Create a farm first.");
        return responseHandler.send(res);
      }

      const farm = await farmService.getSingleFarm(farmId);
      if (!farm) {
        responseHandler.setError(StatusCodes.BAD_REQUEST, "Selected farm was not found.");
        return responseHandler.send(res);
      }

      const emailExist = await prisma.account.findUnique({ where: { email } });
      const accountExist = await prisma.account.findUnique({ where: { username } });
      if (emailExist || accountExist) {
        responseHandler.setError(StatusCodes.BAD_REQUEST, "Email or username already exists.");
        return responseHandler.send(res);
      }

      const userAccount = await prisma.account.create({
        data: {
          username,
          email,
          phone,
          role: Roles.VETERINARIAN,
          password: await hashPassword(password),
          status: false,
        },
      });

      const user = await prisma.user.create({
        data: {
          accountId: userAccount.id,
          fullname,
          gender: null,
        },
      });

      await prisma.veterinarian.create({
        data: {
          name: fullname,
          email: email!,
          phone: phone || "",
          farmId,
          accountId: userAccount.id,
        },
      });

      if (requestUser?.id) {
        createLog({
          accountId: requestUser.id,
          userId: user.id,
          action: "CREATE_VETERINARIAN",
          entityType: "account",
          entityId: userAccount.id,
          details: `Veterinarian ${fullname} account created`,
        }).then(() => {});
      }

      responseHandler.setSuccess(
        StatusCodes.CREATED,
        "Veterinarian account created. Inactive until super admin activates.",
        { user, account: userAccount }
      );
      return responseHandler.send(res);
    } catch (error) {
      console.error(error);
      responseHandler.setError(StatusCodes.INTERNAL_SERVER_ERROR, "Server error");
      return responseHandler.send(res);
    }
  };

export const emailVerification = async (req: Request, res: Response) => {
    const { token } = req.query;

    if (!token) {
        return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Invalid verification link.' });
    }

    try {
        const decoded = verifyToken(token as string, "verify-email");
        const userId = decoded?.data?.userId ?? decoded?.userId;
        const user = await prisma.user.findUnique({ where: { id: userId } });
        const account = await prisma.account.findUnique({ where: { id: user?.accountId } });
        if (!user) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Invalid verification link.' });
        }
        if (!account) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Invalid verification link.' });
        }
        await prisma.account.update({
            where: { id: account.id },
            data: { status: true }
        });

        res.status(StatusCodes.OK).json({ message: 'Email verified successfully.' });
    } catch (error) {
        res.status(StatusCodes.BAD_REQUEST).json({ message: 'Invalid or expired verification link.' });
    }
}

export const userLogin = (req: Request, res: Response, next: NextFunction) => {
    passportLocal.authenticate('local', (err: any, user: UserI, info?: { message?: string }) => {
        if (err) return next(err);
        if (!user) {
            const message =
              (info as { message?: string })?.message ||
              'Invalid email or password';
            responseHandler.setError(StatusCodes.BAD_REQUEST, message);
            return responseHandler.send(res);
        }
        try {
            createLog({
                accountId: (user as any).userFound.id,
                userId: (user as any).userFound.userId,
                action: 'LOGIN',
                entityType: 'auth',
                details: 'User logged in',
            }).then(() => {});
            req.login(user, (err) => {
                if (err) return next(err);
                return res.status(StatusCodes.OK).json({
                    message: 'Login successful',
                    user,
                });
            });
        } catch (error) {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ status: ReasonPhrases.INTERNAL_SERVER_ERROR, error: 'Server error' });
        }
    })(req, res, next);
};

export const userLogout = (req: Request, res: Response) => {
    try {
        req.logout(() => {
            req.session.destroy((err) => {
                if (err) {
                    console.error('Error destroying session:', err);
                    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ status: ReasonPhrases.INTERNAL_SERVER_ERROR, error: 'Server error' });
                }
            });
            return res.status(StatusCodes.OK).json({
                message: 'Logout successful',
            })
        })
    } catch (error) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Failed to logout',
        })
    }
}


export const userAccessToken = (req: Request, res: Response) => {
    responseHandler.setSuccess(
        StatusCodes.OK,
        "User login is successfully",
        req.user
    );
    return responseHandler.send(res);
};

export const checkAuth = (req: Request, res: Response) => {
    if (req.isAuthenticated()) {
        res.status(StatusCodes.OK).json({ isAuthenticated: true, user: req.user });
    } else {
        res.status(StatusCodes.BAD_REQUEST).json({ isAuthenticated: false });
    }
};

export const forgotPassword = async(req: Request, res: Response,_next:NextFunction) => {
const {email}= req.body
const user = await userService.getUserByEmail(email)
if (!user) {
    return res.status(StatusCodes.NOT_FOUND).json({
      message: 'User with email does not exist!',
    });
  }
const userMeta = {
    email,
    id: user.id
}
const verifToken = generateForgotPasswordToken(userMeta);
const emailBody = templateMails.ForgortPasswordTemplate(verifToken);
await sendEmail(email, "Reset password link", emailBody);
return res
  .status(StatusCodes.OK)
  .json({ message: `we have sent password reset link to your email ${email}` });
};

export const resetPassword = async (req: Request, res: Response,_next:NextFunction) => {
  const { token } = req.params;
  if (!token) {
    return res.status(StatusCodes.NOT_FOUND).json({
        message: "No token provided",
      });
  }
  const payload = verifyToken(token, "reset-pass");
  const { email } = payload.data;
  const hashedPassword: string = await hashPassword(req.body.newPassword)
  await userService.resetPassword(email,hashedPassword);
  res.status(StatusCodes.OK).json({
    message: "You have reset successful your password",
  });
};
