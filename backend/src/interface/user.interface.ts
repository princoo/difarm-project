import { AccountI } from "./account.interface";

export interface UserI {
    _id: string;
    accountId: AccountI['id']
    fullname: string;
    gender: string;
    profilePic: string;
}