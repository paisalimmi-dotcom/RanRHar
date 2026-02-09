export type Role = 'owner' | 'manager' | 'staff' | 'cashier' | 'chef' | 'host' | 'delivery'

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
