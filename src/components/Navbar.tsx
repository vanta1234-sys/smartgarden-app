import React, { useState } from 'react';
import { 
  Sprout, 
  BookOpen, 
  Sparkles, 
  Moon, 
  Sun, 
  Globe, 
  Menu, 
  X, 
  Bot, 
  Activity, 
  Scissors, 
  Share2, 
  Search 
} from 'lucide-react';
import { Language } from '../types';

interface NavbarProps {
  lang: Language;
  onLanguageChange: (lang: Language) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  activeSection: string;
  onNavigate: (sectionId: string) => void;
  onOpenAgronomist: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  lang,
  onLanguageChange,
  isDarkMode,
  onToggleDarkMode,
  activeSection,
  onNavigate,
  onOpenAgronomist,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const navItems = [
    {
      id: 'articles',
      label: lang === 'el' ? 'Όλα τα Άρθρα' : 'All Articles',
      badge: lang === 'el' ? 'Καθημερινά' : 'Daily',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
    },
    {
      id: 'guides',
      label: lang === 'el' ? 'Οδηγοί Φροντίδας' : 'Care Guides',
    },
    {
      id: 'telemetry',
      label: lang === 'el' ? 'Live Hub & IoT' : 'Live Hub & IoT',
    },
    {
      id: 'mowers',
      label: lang === 'el' ? 'Ρομποτικά Mowers' : 'Robotic Mowers',
    },
    {
      id: 'social-studio',
      label: lang === 'el' ? 'Social Scripts' : 'Social Scripts',
    },
    {
      id: 'agronomist',
      label: lang === 'el' ? 'Ρώτησε τον AI Γεωπόνο' : 'Ask AI Agronomist',
      badge: 'AI',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/80 dark:text-emerald-200 dark:border-emerald-700 font-bold',
      isAi: true,
    },
  ];

  const handleNavClick = (id: string, isAi?: boolean) => {
    setMobileMenuOpen(false);
    if (isAi) {
      onOpenAgronomist();
    } else {
      onNavigate(id);
    }
  };

  return (
    <header id="site-header" className="sticky top-0 z-40 w-full bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border-b border-neutral-200/80 dark:border-neutral-800 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Brand Logo & Tagline */}
          <div 
            id="brand-logo-container" 
            className="flex items-center gap-3 cursor-pointer select-none group"
            onClick={() => onNavigate('hero')}
          >
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-sm shadow-emerald-500/20 group-hover:scale-105 transition-transform duration-200">
              <Sprout className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
                  SmartGarden<span className="text-emerald-600 dark:text-emerald-400">.gr</span>
                </span>
              </div>
              <span className="text-[9.5px] uppercase tracking-wider font-semibold text-neutral-500 dark:text-neutral-400">
                {lang === 'el' 
                  ? 'Ψηφιακό Περιοδικό Κηπουρικής & Μπαλκονιού' 
                  : 'Digital Gardening & Balcony Magazine'}
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav id="desktop-navigation" className="hidden xl:flex items-center space-x-1 lg:space-x-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                id={`nav-link-${item.id}`}
                onClick={() => handleNavClick(item.id, item.isAi)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-all ${
                  activeSection === item.id
                    ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50/80 dark:bg-emerald-950/40'
                    : 'text-neutral-700 dark:text-neutral-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-neutral-100/70 dark:hover:bg-neutral-800/70'
                }`}
              >
                <span>{item.label}</span>
                {item.badge && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full border leading-none ${item.badgeClass}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>

          {/* Right Action Tools */}
          <div id="nav-actions" className="flex items-center gap-2 sm:gap-3">
            
            {/* Language Switcher */}
            <button
              id="lang-toggle-btn"
              onClick={() => onLanguageChange(lang === 'el' ? 'en' : 'el')}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:border-emerald-500 dark:hover:border-emerald-400 transition-colors shadow-2xs"
              title="Change Language"
            >
              <Globe className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="uppercase">{lang === 'el' ? 'EN' : 'GR'}</span>
            </button>

            {/* Dark Mode Toggle */}
            <button
              id="theme-toggle-btn"
              onClick={onToggleDarkMode}
              className="p-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors shadow-2xs"
              aria-label="Toggle theme"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Primary Read Articles CTA Button */}
            <button
              id="read-articles-cta-btn"
              onClick={() => onNavigate('articles')}
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white text-xs font-bold tracking-tight shadow-sm shadow-emerald-900/20 hover:shadow-md transition-all active:scale-98"
            >
              <BookOpen className="w-4 h-4 stroke-[2.2]" />
              <span>{lang === 'el' ? 'Διαβάστε Άρθρα' : 'Read Articles'}</span>
            </button>

            {/* Mobile Menu Toggle Button */}
            <button
              id="mobile-menu-toggle-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
              aria-label="Open mobile menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div id="mobile-menu-drawer" className="xl:hidden py-4 border-t border-neutral-200 dark:border-neutral-800 animate-in fade-in duration-200">
            <div className="flex flex-col space-y-1.5">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  id={`mobile-nav-${item.id}`}
                  onClick={() => handleNavClick(item.id, item.isAi)}
                  className={`flex items-center justify-between w-full px-4 py-2.5 text-sm font-medium rounded-xl text-left ${
                    activeSection === item.id
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold'
                      : 'text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    {item.id === 'articles' && <BookOpen className="w-4 h-4 text-emerald-600" />}
                    {item.id === 'guides' && <Sprout className="w-4 h-4 text-emerald-600" />}
                    {item.id === 'telemetry' && <Activity className="w-4 h-4 text-emerald-600" />}
                    {item.id === 'mowers' && <Scissors className="w-4 h-4 text-emerald-600" />}
                    {item.id === 'social-studio' && <Share2 className="w-4 h-4 text-emerald-600" />}
                    {item.id === 'agronomist' && <Bot className="w-4 h-4 text-emerald-600" />}
                    {item.label}
                  </span>
                  {item.badge && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${item.badgeClass}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}

              <div className="pt-2">
                <button
                  id="mobile-read-cta"
                  onClick={() => handleNavClick('articles')}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-800 text-white text-sm font-bold shadow-sm"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>{lang === 'el' ? 'Διαβάστε τα Σημερινά Άρθρα' : 'Read Today\'s Articles'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
