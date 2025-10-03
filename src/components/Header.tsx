'use client';

import Link from 'next/link';
import { useState } from 'react';
import { User, Heart } from 'lucide-react';

export default function Header() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <header className="bg-primary-white shadow-base">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary-blue rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">AP</span>
            </div>
            <span className="font-bold text-xl text-primary-charcoal">Repositório Ação Paramita</span>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center space-x-8">
            <Link href="/playlists" className="text-primary-charcoal hover:text-primary-blue transition-colors font-medium">
              Ensinamentos
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            <button className="flex items-center space-x-2 bg-accent-red text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium">
              <Heart className="w-4 h-4" />
              <span>Doação</span>
            </button>
            <button 
              onClick={() => setIsLoggedIn(!isLoggedIn)}
              className="flex items-center space-x-2 bg-primary-blue text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <User className="w-4 h-4" />
              <span>{isLoggedIn ? 'Logout' : 'Login'}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
