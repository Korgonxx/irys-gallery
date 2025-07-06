import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Button } from '@/components/ui/button';
import { Palette, User, Upload, Home } from 'lucide-react';

export const Header = ({ currentView, setCurrentView }) => {
  const { connected, publicKey } = useWallet();

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Palette className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Irys Gallery
            </h1>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-4">
            <Button
              variant={currentView === 'gallery' ? 'default' : 'ghost'}
              onClick={() => setCurrentView('gallery')}
              className="flex items-center space-x-2"
            >
              <Home className="h-4 w-4" />
              <span>Gallery</span>
            </Button>
            {connected && (
              <>
                <Button
                  variant={currentView === 'upload' ? 'default' : 'ghost'}
                  onClick={() => setCurrentView('upload')}
                  className="flex items-center space-x-2"
                >
                  <Upload className="h-4 w-4" />
                  <span>Upload</span>
                </Button>
                <Button
                  variant={currentView === 'profile' ? 'default' : 'ghost'}
                  onClick={() => setCurrentView('profile')}
                  className="flex items-center space-x-2"
                >
                  <User className="h-4 w-4" />
                  <span>Profile</span>
                </Button>
              </>
            )}
          </nav>

          {/* Wallet Connection */}
          <div className="flex items-center space-x-4">
            {connected && publicKey && (
              <div className="hidden sm:block text-sm text-gray-600">
                {publicKey.toString().slice(0, 4)}...{publicKey.toString().slice(-4)}
              </div>
            )}
            <WalletMultiButton className="!bg-gradient-to-r !from-purple-600 !to-pink-600 hover:!from-purple-700 hover:!to-pink-700 !border-none !rounded-lg !text-white !font-medium !px-4 !py-2 !text-sm" />
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {connected && (
        <div className="md:hidden border-t border-gray-200 bg-gray-50">
          <div className="flex justify-around py-2">
            <Button
              variant={currentView === 'gallery' ? 'default' : 'ghost'}
              onClick={() => setCurrentView('gallery')}
              size="sm"
              className="flex flex-col items-center space-y-1 h-auto py-2"
            >
              <Home className="h-4 w-4" />
              <span className="text-xs">Gallery</span>
            </Button>
            <Button
              variant={currentView === 'upload' ? 'default' : 'ghost'}
              onClick={() => setCurrentView('upload')}
              size="sm"
              className="flex flex-col items-center space-y-1 h-auto py-2"
            >
              <Upload className="h-4 w-4" />
              <span className="text-xs">Upload</span>
            </Button>
            <Button
              variant={currentView === 'profile' ? 'default' : 'ghost'}
              onClick={() => setCurrentView('profile')}
              size="sm"
              className="flex flex-col items-center space-y-1 h-auto py-2"
            >
              <User className="h-4 w-4" />
              <span className="text-xs">Profile</span>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
};

