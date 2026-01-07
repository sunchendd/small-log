import React from 'react';
import { Book, PieChart, Upload, Download, Settings, ChevronLeft, Feather, Calendar, Sparkles } from 'lucide-react';
import { ViewMode, Entry, AppSettings } from '../types';
import { StorageService } from '../services/storageService';

interface SidebarProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onImport: (entries: Entry[]) => void;
  allEntries: Entry[];
  settings: AppSettings;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  viewMode, 
  setViewMode, 
  isOpen, 
  setIsOpen,
  onImport,
  allEntries,
  settings
}) => {
  
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const result = e.target?.result as string;
        const parsed = JSON.parse(result);
        // Support both old format (array) and new format (object with entries)
        const entries = Array.isArray(parsed) ? parsed : parsed.entries;
        if (Array.isArray(entries)) {
          onImport(entries);
          alert(`成功导入 ${entries.length} 篇日记！`);
        }
      } catch (err) {
        alert("JSON 文件解析失败");
      }
    };
    reader.readAsText(file);
  };

  const navItems = [
    { mode: 'editor' as ViewMode, icon: Book, label: '日记' },
    { mode: 'calendar' as ViewMode, icon: Calendar, label: '日历' },
    { mode: 'analytics' as ViewMode, icon: PieChart, label: '数据洞察' },
    { mode: 'settings' as ViewMode, icon: Settings, label: '设置' },
  ];

  return (
    <aside 
      className={`
        fixed inset-y-0 left-0 z-20 w-64 bg-slate-50 dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0
      `}
    >
      <div className="flex flex-col h-full">
        {/* Logo Area */}
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400">
            <Feather className="w-6 h-6" />
            <span className="text-xl font-serif font-bold tracking-tight">Lumina</span>
          </div>
          <button onClick={() => setIsOpen(false)} className="md:hidden text-slate-500">
            <ChevronLeft />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-2">
          {navItems.map(({ mode, icon: Icon, label }) => (
            <button 
              key={mode}
              onClick={() => { setViewMode(mode); setIsOpen(false); }}
              className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-xl transition-colors ${
                viewMode === mode 
                  ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-5 h-5 mr-3" />
              {label}
            </button>
          ))}
        </nav>

        {/* Stats Summary */}
        <div className="px-6 py-4">
           <div className="p-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
             <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">总日记数</p>
             <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{allEntries.length}</p>
           </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-200 dark:border-slate-800 space-y-1">
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={() => StorageService.exportData()}
              className="flex flex-col items-center justify-center p-3 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-400 text-xs"
            >
              <Download className="w-5 h-5 mb-1" />
              备份
            </button>
            <label className="flex flex-col items-center justify-center p-3 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-400 text-xs cursor-pointer">
              <Upload className="w-5 h-5 mb-1" />
              导入
              <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
          
          <div className="pt-2">
             <div className="flex items-center justify-center text-xs text-slate-400 dark:text-slate-500 mt-2">
                <Sparkles className="w-3 h-3 mr-1" />
                <span>Powered by {settings.activeProvider === 'deepseek' ? 'DeepSeek' : 'Gemini'}</span>
             </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
