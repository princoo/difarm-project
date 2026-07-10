import config from '@/config';
import { storage } from '@/utils';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const baseApi = createApi({
	baseQuery: fetchBaseQuery({
		baseUrl: config.API_URL,
		prepareHeaders: headers => {
			const token = storage.getToken();
			if (token) headers.set('authorization', `Bearer ${token}`);

			return headers;
		},
	}),
	tagTypes: [
		
	],
	endpoints: () => ({}),
});

export default baseApi;
