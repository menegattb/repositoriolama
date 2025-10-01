'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X, User, Heart } from 'lucide-react';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <header className="fixed top-0 left-0 right-0 bg-white shadow-md z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">DL</span>
            </div>
            <span className="font-bold text-xl text-gray-900">Digital Library</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/playlists" className="text-gray-700 hover:text-blue-600 transition-colors">
              Playlists
            </Link>
            <Link href="/recursos" className="text-gray-700 hover:text-blue-600 transition-colors">
              Recursos
            </Link>
            <Link href="/colecoes" className="text-gray-700 hover:text-blue-600 transition-colors">
              Coleções
            </Link>
            <Link href="/sobre" className="text-gray-700 hover:text-blue-600 transition-colors">
              Sobre
            </Link>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <button className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">
              <Heart className="w-4 h-4" />
              <span>Doação</span>
            </button>
            <button 
              onClick={() => setIsLoggedIn(!isLoggedIn)}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <User className="w-4 h-4" />
              <span>{isLoggedIn ? 'Logout' : 'Login'}</span>
            </button>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={toggleMenu}
            className="md:hidden p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-100"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <nav className="flex flex-col space-y-4">
              <Link href="/playlists" className="text-gray-700 hover:text-blue-600 transition-colors">
                Playlists
              </Link>
              <Link href="/recursos" className="text-gray-700 hover:text-blue-600 transition-colors">
                Recursos
              </Link>
              <Link href="/colecoes" className="text-gray-700 hover:text-blue-600 transition-colors">
                Coleções
              </Link>
              <Link href="/sobre" className="text-gray-700 hover:text-blue-600 transition-colors">
                Sobre
              </Link>
              <div className="flex flex-col space-y-2 pt-4 border-t border-gray-200">
                <button className="flex items-center justify-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">
                  <Heart className="w-4 h-4" />
                  <span>Doação</span>
                </button>
                <button 
                  onClick={() => setIsLoggedIn(!isLoggedIn)}
                  className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
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
