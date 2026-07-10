const config = {
	NODE_ENV: process.env.NODE_ENV ?? 'development',
	APP_NAME: process.env.NEXT_PUBLIC_APP_NAME ?? process.env.REACT_APP_NAME ?? 'farm',
	API_URL: (() => {
		const v = (process.env.NEXT_PUBLIC_SERVER_URL || process.env.REACT_APP_SERVER_URL || '').trim();
		if (!v || v === 'undefined' || v === 'null') return '';
		return v.replace(/\/$/, '');
	})(),
};

export default config;
