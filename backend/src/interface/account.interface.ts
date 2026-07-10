export interface AccountI {
    id: String;
    username: string;
    email: string;
    phone?: string;
    role: string;
    password: string;
    status:boolean;
}