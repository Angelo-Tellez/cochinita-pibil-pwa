export interface User {
  id: string
  email: string
  password: string // In production, hash this!
  name: string
  createdAt: string
}

const USERS_STORAGE_KEY = "cochinita-users"
const SESSION_STORAGE_KEY = "cochinita-session"

export const authStore = {
  // Get all users
  getUsers: (): User[] => {
    if (typeof window === "undefined") return []
    try {
      const stored = localStorage.getItem(USERS_STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  },

  // Get current session user
  getSession: (): User | null => {
    if (typeof window === "undefined") return null
    try {
      const stored = localStorage.getItem(SESSION_STORAGE_KEY)
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  },

  // Set current session
  setSession: (user: User) => {
    if (typeof window === "undefined") return
    try {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user))
    } catch {
      console.error("Failed to save session")
    }
  },

  // Clear session (logout)
  clearSession: () => {
    if (typeof window === "undefined") return
    try {
      localStorage.removeItem(SESSION_STORAGE_KEY)
    } catch {
      console.error("Failed to clear session")
    }
  },

  // Register new user
  register: (email: string, password: string, name: string): { success: boolean; message: string } => {
    const users = authStore.getUsers()

    if (users.find((u) => u.email === email)) {
      return { success: false, message: "Este email ya está registrado" }
    }

    if (password.length < 6) {
      return { success: false, message: "La contraseña debe tener al menos 6 caracteres" }
    }

    const newUser: User = {
      id: `USR-${Date.now()}`,
      email,
      password, // In production, hash this!
      name,
      createdAt: new Date().toISOString(),
    }

    users.push(newUser)
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users))

    // Auto-login after registration
    authStore.setSession(newUser)

    return { success: true, message: "Registro exitoso" }
  },

  // Login user
  login: (email: string, password: string): { success: boolean; message: string; user?: User } => {
    const users = authStore.getUsers()
    const user = users.find((u) => u.email === email && u.password === password)

    if (!user) {
      return { success: false, message: "Email o contraseña incorrectos" }
    }

    authStore.setSession(user)
    return { success: true, message: "Login exitoso", user }
  },

  // Logout
  logout: () => {
    authStore.clearSession()
  },
}
