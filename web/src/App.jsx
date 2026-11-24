import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { AuthProvider } from './features/auth/AuthContext.jsx'
import RequireAuth from './features/auth/RequireAuth.jsx'
import { StudentProvider } from './features/courses/StudentContext.jsx'
import RequireRecord from './features/courses/RequireRecord.jsx'
import LoginScreen from './features/auth/LoginScreen.jsx'
import UploadScreen from './features/courses/UploadScreen.jsx'
import ConfirmScreen from './features/courses/ConfirmScreen.jsx'
import PlanScreen from './features/courses/PlanScreen.jsx'
import LockedSheet from './features/courses/LockedSheet.jsx'
import ElectivesScreen from './features/courses/ElectivesScreen.jsx'
import GpaScreen from './features/gpa/GpaScreen.jsx'
import StatesScreen from './features/dev/StatesScreen.jsx'

// Routes = كل رابط وش الشاشة اللي يعرضها. زر الرجوع في الجوال يشتغل لأن كل شاشة لها رابط.
// كل الشاشات داخل <RequireAuth> تحتاج دخول.
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <StudentProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<LoginScreen />} />
            <Route element={<RequireAuth />}>
              <Route path="/upload" element={<UploadScreen />} />
              <Route path="/states" element={<StatesScreen />} />
              {/* هذي تحتاج إن الطالب رفع ملفاته */}
              <Route element={<RequireRecord />}>
                <Route path="/confirm" element={<ConfirmScreen />} />
                <Route path="/plan" element={<PlanScreen />}>
                  <Route path="locked/:code" element={<LockedSheet />} />
                </Route>
                <Route path="/electives" element={<ElectivesScreen />} />
                <Route path="/gpa" element={<GpaScreen />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </StudentProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
