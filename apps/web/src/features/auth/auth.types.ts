export type Role = 'owner' | 'staff' | 'cashier'

export type AuthSession = {
    email: string
    role: Role
}
