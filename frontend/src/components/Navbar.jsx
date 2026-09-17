import React from 'react';
import { Radio, Search, UploadCloud, User as UserIcon, LogOut } from 'lucide-react';

const GENRES = ['All', 'Electronic', 'Lofi', 'Synthwave', 'Rock', 'Ambient'];

const Navbar = ({
  searchQuery,
  setSearchQuery,
  selectedGenre,
  setSelectedGenre,
  onOpenUpload,
  onOpenAuth,
  user,
  onLogout
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 px-4 lg:px-8 py-3 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Brand */}
        <div className="flex items-center justify-between w-full md:w-auto">
          <div className="flex items-center gap-2.5 cursor-pointer">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-slate-950">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-emerald-400 bg-clip-text text-transparent">
                SoundWave
              </span>
              <span className="block text-[10px] text-emerald-400 font-medium tracking-wide">
                Production Audio Engine
              </span>
            </div>
          </div>

          {/* Mobile Actions */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={onOpenUpload}
              className="p-2 rounded-lg bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition"
              title="Upload Audio"
            >
              <UploadCloud className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search tracks, artists..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
          />
        </div>

        {/* Right Actions: Upload & Auth */}
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={onOpenUpload}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-medium px-3.5 py-1.5 rounded-lg text-sm transition shadow-md shadow-emerald-500/20 cursor-pointer"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Track</span>
          </button>

          {user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-semibold text-emerald-400">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <span className="text-xs font-medium text-slate-300 max-w-[90px] truncate">{user.name}</span>
              <button
                onClick={onLogout}
                className="text-slate-400 hover:text-rose-400 p-1 transition cursor-pointer"
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-sm transition cursor-pointer"
            >
              <UserIcon className="w-4 h-4" />
              <span>Log In</span>
            </button>
          )}
        </div>
      </div>

      {/* Genre Filter Pills */}
      <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto pt-3 pb-1 scrollbar-none">
        {GENRES.map((g) => {
          const isActive = (g === 'All' && !selectedGenre) || selectedGenre === g;
          return (
            <button
              key={g}
              onClick={() => setSelectedGenre(g === 'All' ? '' : g)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-emerald-500 text-slate-950 font-semibold'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {g}
            </button>
          );
        })}
      </div>
    </header>
  );
};

export default Navbar;