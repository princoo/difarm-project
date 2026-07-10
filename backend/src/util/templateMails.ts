
const ForgortPasswordTemplate = (token: string) => `
    <p>Reset your password.</p>
    <p>Please click the link below to reset your password.</p>
    ${process.env.FRONTEND_UrL}/accounts/reset-password/new?token=${token}`;

export default {ForgortPasswordTemplate}