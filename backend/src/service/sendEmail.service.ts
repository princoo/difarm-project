import nodemailer from 'nodemailer';
import 'dotenv/config';

const sendEmail = async (email: string, subject: string, text: string) => {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASS, 
            },
        });

        await transporter.sendMail({
            from: process.env.EMAIL,
            to: email,
            subject: subject,
            text: text,
        });
    } catch (error) {
        console.error('Error sending email:', error);
    }
};

export { sendEmail };