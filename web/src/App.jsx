import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { StudentProvider } from './features/courses/StudentContext.jsx'
import LoginScreen from './features/auth/LoginScreen.jsx'
import UploadScreen from './features/courses/UploadScreen.jsx'
import ConfirmScreen from './features/courses/ConfirmScreen.jsx'
import PlanScreen from './features/courses/PlanScreen.jsx'
import LockedSheet from './features/courses/LockedSheet.jsx'
import ElectivesScreen from './features/courses/ElectivesScreen.jsx'
import GpaScreen from './features/gpa/GpaScreen.jsx'
import StatesScreen from './features/dev/StatesScreen.jsx'

// Routes = كل رابط وش الشاشة اللي يعرضها. زر الرجوع في الجوال يشتغل لأن كل شاشة لها رابط.
export default function App() {
  return (
    <BrowserRouter>
      <StudentProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginScreen />} />
          <Route path="/upload" element={<UploadScreen />} />
          <Route path="/confirm" element={<ConfirmScreen />} />
          <Route path="/plan" element={<PlanScreen />}>
            <Route path="locked/:code" element={<LockedSheet />} />
          </Route>
          <Route path="/electives" element={<ElectivesScreen />} />
          <Route path="/gpa" element={<GpaScreen />} />
          <Route path="/states" element={<StatesScreen />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </StudentProvider>
    </BrowserRouter>
  )
}
