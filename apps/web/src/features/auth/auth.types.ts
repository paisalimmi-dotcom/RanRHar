export type Role = 'owner' | 'staff' | 'cashier'

export type AuthSession = {
    email: string
    role: Role
}

export type User = {
    email: string
    role: Role
}

export type AuthResponse = {
    accessToken: string
    user: User
}
