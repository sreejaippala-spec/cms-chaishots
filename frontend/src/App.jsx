import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';
import Login from './pages/Login';
import ProgramList from './pages/ProgramList';
import ProgramDetail from './pages/ProgramDetail';
import LessonEditor from './pages/LessonEditor';
import ProgramPreview from './pages/ProgramPreview';
import Layout from './components/Layout';

const ProtectedLayout = () => {
  const auth = useAuthStore();
  if (!auth.token) return <Navigate to="/login" replace />;
  return <Layout auth={auth} />;
};

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<LoginWrapper />} />

        <Route element={<ProtectedLayout />}>
          <Route path="/" element={<Navigate to="/programs" replace />} />
          <Route path="/programs" element={<ProgramList />} />
          <Route path="/programs/:id" element={<ProgramDetail />} />
          <Route path="/preview/:id" element={<ProgramPreview />} />
          <Route path="/lessons/:id" element={<LessonEditor />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

const LoginWrapper = () => {
  const auth = useAuthStore();
  return <Login auth={auth} />;
};
