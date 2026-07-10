import bcrypt from "bcrypt";

const hashPassword = (password:string) => {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds)
}

const comparePassword = (password: string, hashPassword: string) => {
    return bcrypt.compare(password, hashPassword);
}

export {hashPassword, comparePassword}