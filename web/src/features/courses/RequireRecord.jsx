import { Navigate, Outlet, useSearchParams } from 'react-router'
import { useStudent } from './StudentContext.jsx'

// «حارس» ثاني: الخطة والتأكد والمعدل تحتاج إن الطالب رفع ملفاته.
// لو ما رفع، نوديه لشاشة الرفع. (روابط التجربة ?state=... تشتغل على الطالب الوهمي.)
export default function RequireRecord() {
  const { hasRecord } = useStudent()
  const [params] = useSearchParams()
  if (!hasRecord && !params.get('state')) return <Navigate to="/upload" replace />
  return <Outlet />
}
