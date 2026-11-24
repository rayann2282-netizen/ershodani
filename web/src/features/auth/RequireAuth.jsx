import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from './AuthContext.jsx'

// «حارس»: أي شاشة داخله تحتاج دخول. لو ما دخل، يروح لشاشة الدخول،
// ونتذكر وين كان رايح عشان نرجعه له بعد الدخول.
export default function RequireAuth() {
  const { user, ready } = useAuth()
  const location = useLocation()
  if (!ready) return null
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  return <Outlet />
}
