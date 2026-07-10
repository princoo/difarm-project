const config = {
	NODE_ENV: process.env.NODE_ENV ?? 'development',
	APP_NAME: process.env.NEXT_PUBLIC_APP_NAME ?? process.env.REACT_APP_NAME ?? 'farm',
	API_URL: process.env.NEXT_PUBLIC_SERVER_URL ?? process.env.REACT_APP_SERVER_URL,
};

export default config;
