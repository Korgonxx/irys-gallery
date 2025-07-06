import { useState } from 'react';
import { WalletContextProvider } from './components/WalletProvider';
import { WelcomeModal } from './components/WelcomeModal';
import { Header } from './components/Header';
import { GalleryView } from './components/GalleryView';
import { ProfileView } from './components/ProfileView';
import { UploadView } from './components/UploadView';
import './App.css';

function App() {
  const [currentView, setCurrentView] = useState('gallery');

  const handleUploadSuccess = (artwork) => {
    // Switch to gallery view after successful upload
    setCurrentView('gallery');
    // You could also show a success notification here
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'gallery':
        return <GalleryView />;
      case 'upload':
        return <UploadView onUploadSuccess={handleUploadSuccess} />;
      case 'profile':
        return <ProfileView />;
      default:
        return <GalleryView />;
    }
  };

  return (
    <WalletContextProvider>
      <div className="min-h-screen bg-gray-50">
        <WelcomeModal />
        <Header currentView={currentView} setCurrentView={setCurrentView} />
        <main>
          {renderCurrentView()}
        </main>
      </div>
    </WalletContextProvider>
  );
}

export default App;

