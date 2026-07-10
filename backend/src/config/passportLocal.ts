import { passport } from "../util/cjsDeps";
import { Strategy as LocalStrategy } from 'passport-local';
import prisma from "../db/prisma";
import { comparePassword } from "../service/bcrypt.service";
import { generateToken } from "../service/token.service";

interface userSchema {
  fullname: string;
  email: string;
  phone?: string
  role: string;
  password?: string;
}


passport.use(new LocalStrategy({
  usernameField: 'username',
  passwordField: 'password'
}, async (loginId, password, done) => {
  try {
    
    const userFound = await prisma.account.findFirst({
        where: {
          OR: [
            { username: loginId },
            { email: loginId },
            { phone: loginId }
          ]
        }
      });

    if (!userFound) {
      return done(null, false);
    }

    if (!userFound.status) {
      return done(null, false, {
        message:
          "Your account is pending activation. Please contact the super admin.",
      });
    }

    const isPasswordValid = userFound.password ? await comparePassword(password, userFound.password) : false;

    if (!isPasswordValid) {
      return done(null, false);
    }
    
    const userData = await prisma.user.findFirst({ where: { accountId: userFound.id } });
    const { id, email, role, status, phone } = userFound;
    const accountUsername = userFound.username;
    const userDataPayLoad = {
      id,
      userId: userData?.id,
      username: accountUsername,
      email,
      role,
      status,
    };
    const token = generateToken(userDataPayLoad);
    return done(null, {
      userFound: {
        id,
        userId: userData?.id,
        username: accountUsername,
        email,
        phone,
        role,
        status,
      },
      token,
    });
  } catch (error) {
    return done(error);
  }
}))

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user: userSchema, done) => done(null, user));
export default passport;