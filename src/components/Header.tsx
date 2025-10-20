'use client';

import Link from 'next/link';
import { useState } from 'react';
import { User, Menu, X } from 'lucide-react';
import Image from 'next/image';

export default function Header() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="bg-primary-white shadow-base">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <Image
              src="/ap-logo.webp"
              alt="Ação Paramita"
              width={180}
              height={71}
              priority
            />
          </Link>

          {/* Desktop Navigation - Centralizado */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-primary-charcoal hover:text-primary-blue transition-colors font-medium">
              Repositório Ação Paramita
            </Link>
            <Link href="/playlists" className="text-primary-charcoal hover:text-primary-blue transition-colors font-medium">
              Ensinamentos
            </Link>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <button 
              onClick={() => setIsLoggedIn(!isLoggedIn)}
              className="flex items-center space-x-2 bg-primary-blue text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <User className="w-4 h-4" />
              <span>{isLoggedIn ? 'Logout' : 'Login'}</span>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-primary-charcoal hover:text-primary-blue hover:bg-gray-100 transition-colors"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <nav className="flex flex-col space-y-4">
              <Link 
                href="/" 
                className="text-primary-charcoal hover:text-primary-blue transition-colors font-medium py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Repositório Ação Paramita
              </Link>
              <Link 
                href="/playlists" 
                className="text-primary-charcoal hover:text-primary-blue transition-colors font-medium py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Ensinamentos
              </Link>
              <div className="pt-4 border-t border-gray-200">
                <button 
                  onClick={() => {
                    setIsLoggedIn(!isLoggedIn);
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center space-x-2 bg-primary-blue text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium w-full justify-center"
                >
                  <User className="w-4 h-4" />
                  <span>{isLoggedIn ? 'Logout' : 'Login'}</span>
                </button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
