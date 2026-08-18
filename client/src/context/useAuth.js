import { createContext, useContext } from 'react'

const AuthContext = createContext(null)

function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth harus dipakai di dalam AuthProvider')
  }
  return context
}

export { useAuth }
export default AuthContext