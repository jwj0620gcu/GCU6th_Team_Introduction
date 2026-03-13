import { Navigate, Route, Routes } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import TopBar from './components/TopBar';
import ChaewooPage from './pages/ChaewooPage';
import ContactPage from './pages/ContactPage';
import JaebinPage from './pages/JaebinPage';
import LandingPage from './pages/LandingPage';
import WonjunPokemonPage from './pages/WonjunPokemonPage';
import YujeongPage from './pages/YujeongPage';

function App() {
  const { pathname } = useLocation();
  const hideTopBar = ['/about', '/yujeong', '/code'].includes(pathname);

  return (
    <div className="min-h-screen bg-peelBg text-peelText">
      {!hideTopBar && <TopBar />}
      <main className={hideTopBar ? '' : 'pt-14'}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/jaebin" element={<JaebinPage />} />
          <Route path="/chaewoo" element={<ChaewooPage />} />
          <Route path="/yujeong" element={<YujeongPage />} />
          <Route path="/about" element={<ChaewooPage />} />
          <Route path="/code" element={<YujeongPage />} />
          <Route path="/pokemon" element={<WonjunPokemonPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
