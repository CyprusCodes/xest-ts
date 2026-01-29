export const ADMIN = "admin";
export const USER = "user";

// Optional: Create a union type for extra type safety elsewhere
export type UserType = typeof ADMIN | typeof USER;