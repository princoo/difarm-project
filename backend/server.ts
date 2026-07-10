import express from 'express';
import passport from 'passport';
import session from 'express-session';
import morgan from 'morgan';
import cors from 'cors';
import path from 'path';
import router from './src/router';
import ErrorHandler from './src/middleware/errorHandler.middleware';
import './src/config/passportLocal'
import dotenv from 'dotenv';
import globalTypes from './src/index'; //this line imports extended express request object


dotenv.config();

const app = express();
const allowedOrigins = [
    process.env.FRONTEND_UrL,
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:3003',
].filter((origin): origin is string => Boolean(origin));

const corsOptions = {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        const isLocalhost =
            typeof origin === 'string' && /^http:\/\/localhost:\d+$/.test(origin);

        if (!origin || allowedOrigins.includes(origin) || isLocalhost) {
            callback(null, true);
        } else {
            callback(new Error(`CORS blocked for origin: ${origin}`));
        }
    },
    credentials: true,
};
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(cors(corsOptions));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
app.use(session({
    secret: "secret",
    resave: false,
    saveUninitialized: true,
}))
app.use(passport.initialize());
app.use(passport.session());

app.use('/api/v1', router);
app.use(ErrorHandler);

const port = process.env['PORT'] || 4000;
app.listen(port, () => {
    console.log(`Server started at port ${port}`);
})