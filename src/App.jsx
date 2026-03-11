import { Navigate, Route, Routes } from 'react-router-dom';
import TopBar from './components/TopBar';
import AboutPage from './pages/AboutPage';
import CodePage from './pages/CodePage';
import ContactPage from './pages/ContactPage';
import LandingPage from './pages/LandingPage';

function App() {
  return (
    <div className="min-h-screen bg-peelBg text-peelText">
      <TopBar />
      <main className="pt-14">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/code" element={<CodePage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
