export interface BaseModel {
	id: string;
	createdAt: string;
	updatedAt: string;
}
export interface DefaultResponse <T> {
	status: number,
	message: string
	data: T
}

export interface ResponseModel<Model> {
    list: any;
  description: any;
	status: string;
	data: Model;
}

export interface ResponseListModel<Model> {
	status: string;
	data: Model[];
	total: number;
	previousPage: number | null;
	currentPage: number | null;
	nextPage: number | null;
}

export interface FailModel {
	status: string;
	error: {
		path: string;
		message: string;
	};
}

export interface ErrorModel {
	status: string;
	message: string;
}

export interface ProductionData {
    cattleId: string;
    productName: string;
    quantity: string;
    productionDate: string;
    expirationDate?: string | null;
    milkingSession?: 'MORNING' | 'EVENING' | '' | null;
}

