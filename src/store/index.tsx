import {
    combineReducers,
    configureStore,
    getDefaultMiddleware,
} from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import { TypedUseSelectorHook } from 'react-redux';
import themeConfigSlice from './themeConfigSlice';
import baseApi from '../core/lib/base';
import config from '@/config';



const rootReducer = combineReducers({
    themeConfig: themeConfigSlice,
   
});

const middlewares: any = [baseApi.middleware];

export const store = configureStore({
    reducer: rootReducer,
    devTools: config.NODE_ENV === 'development',
    middleware: () =>
        getDefaultMiddleware().concat(middlewares),
});

export type IRootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<IRootState> = useSelector;
