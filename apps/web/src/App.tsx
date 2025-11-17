import { AuthProvider } from './contexts/AuthContext';
import { Dashboard } from './pages/Dashboard';
import { Toaster } from './components/ui/sonner';

export default function App() {
  return (
    <AuthProvider>
      <div className="w-full min-h-screen">
        <Toaster />
        <Dashboard />
      </div>
    </AuthProvider>
  );
}