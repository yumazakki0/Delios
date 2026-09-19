import { Navigate, Route, Routes } from "react-router-dom";
import { Header } from "./components/Header";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { StudentProtectedRoute } from "./components/StudentProtectedRoute";
import { AdminPage } from "./pages/AdminPage";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { ReportPage } from "./pages/ReportPage";
import { StudentLoginPage } from "./pages/StudentLoginPage";
import { StudentImportPage } from "./pages/StudentImportPage";

export default function App() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/aluno" element={<StudentLoginPage />} />
        <Route path="/ajuda" element={<StudentProtectedRoute><ReportPage /></StudentProtectedRoute>} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
        <Route path="/admin/alunos" element={<ProtectedRoute><StudentImportPage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
