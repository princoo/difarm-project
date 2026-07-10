import config from "../config";

const TOKEN_NAME = `${config.APP_NAME}-token`;

const safeStorage = () => (typeof window !== 'undefined' ? localStorage : null);

export const storage = {
	getToken: () => safeStorage()?.getItem(TOKEN_NAME) ?? null,
	setToken: (token: string) => safeStorage()?.setItem(TOKEN_NAME, token),
	removeToken: () => safeStorage()?.removeItem(TOKEN_NAME),
};
