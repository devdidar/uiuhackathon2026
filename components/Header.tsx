
import React from 'react';

interface HeaderProps {
  onSave: () => void;
  onClear: () => void;
}

const Header: React.FC<HeaderProps> = () => {
  return (
    <header className="h-16 bg-white flex items-center justify-between px-6 z-50 border-b border-slate-100">
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 poppy-gradient rounded-full flex items-center justify-center text-white font-bold">S</div>
          <span className="text-lg font-bold text-slate-900 tracking-tight">Second Brain</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
          <img src="https://i.pravatar.cc/150?u=current" className="w-full h-full rounded-full" alt="profile" />
        </div>
      </div>
    </header>
  );
};

export default Header;
