import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const NAV_ITEMS = [
  { path: '/', label: 'Home' },
  { path: '/audit', label: 'Audit Portal' },
  { path: '/services', label: 'Services' },
  { path: '/pricing', label: 'Pricing' },
  { path: '/dashboard', label: 'Dashboard' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  return (
    <nav className="fixed top-0 w-full z-50 bg-dark-950/90 backdrop-blur border-b border-dark-800/50">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl font-bold gold-gradient">VERNEN™</span>
        </Link>
        <div className="hidden md:flex items-center gap-6">
          {NAV_ITEMS.map(({ path, label }) => (
            <Link key={path} to={path}
              className={`text-sm font-medium transition-colors ${
                pathname === path ? 'text-gold-400' : 'text-gray-400 hover:text-white'
              }`}>{label}</Link>
          ))}
          <Link to="/audit"
            className="px-4 py-2 bg-gold-500 text-dark-950 rounded-lg text-sm font-semibold hover:bg-gold-400 transition">
            Start Audit
          </Link>
        </div>
        <button onClick={() => setOpen(!open)} className="md:hidden text-white">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d={open ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
          </svg>
        </button>
      </div>
      {open && (
        <div className="md:hidden px-4 pb-4 space-y-2">
          {NAV_ITEMS.map(({ path, label }) => (
            <Link key={path} to={path} onClick={() => setOpen(false)}
              className={`block py-2 text-sm ${pathname === path ? 'text-gold-400' : 'text-gray-400'}`}>
              {label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
