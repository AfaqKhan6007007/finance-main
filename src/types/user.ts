export interface IUser{
    _id:string
    firstName: string;
    lastName:string;
    email: string;
    password?: string;
    provider: 'credentials' | 'google' | 'apple' | 'facebook';
    forgotPasswordToken?: string;
    forgotPasswordTokenExpiry?: Date;
    emailVerified?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}