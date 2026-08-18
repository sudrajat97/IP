import { useState } from 'react'
import api from '../services/api'
import AuthContext from './useAuth'

const TOKEN_KEY = 'rakman_token'
const USER_KEY = 'rakman_user'

function readStoredUser() {
  const token = localStorage.getItem(TOKEN_KEY)
  const storedUser = localStorage.getItem(USER_KEY)
  if (!token || !storedUser) {
    return null
  }
  try {
    return JSON.parse(storedUser)
  } catch {
    return null
  }
}

function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser)

  async function login(email, password) {
    const response = await api.post('/auth/login', { email, password })
    const { access_token, user: loggedInUser } = response.data

    localStorage.setItem(TOKEN_KEY, access_token)
    localStorage.setItem(USER_KEY, JSON.stringify(loggedInUser))
    setUser(loggedInUser)

    return loggedInUser
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setUser(null)
  }

  const value = { user, login, logout }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthProvider