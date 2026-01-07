import React, { useState, useEffect, useMemo } from 'react';
import { Sidebar } from './components/Sidebar';
import { EntryList } from './components/EntryList';
import { Editor } from './components/Editor';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { SettingsPanel } from './components/SettingsPanel';
import { CalendarView } from './components/CalendarView';
import { Entry, ViewMode, ThemeMode, AppSettings, Report, DEFAULT_SETTINGS } from './types';
import { StorageService } from './services/storageService';
import { Moon, Sun } from 'lucide-react';

const App: React.FC = () => {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('editor');
  const [theme, setTheme] = useState<ThemeMode>('light');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [reports, setReports] = useState<Report[]>([]);

  // Initial Load
  useEffect(() => {
    const loadedEntries = StorageService.loadEntries();
    setEntries(loadedEntries);
    
    const loadedSettings = StorageService.loadSettings();
    setSettings(loadedSettings);
    
    const loadedReports = StorageService.loadReports();
    setReports(loadedReports);
    
    // Check system preference for theme
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
    }
  }, []);

  // Theme Effect
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Derived State
  const selectedEntry = useMemo(() => 
    entries.find(e => e.id === selectedEntryId) || null, 
  [entries, selectedEntryId]);

  const filteredEntries = useMemo(() => {
    if (!searchQuery) return entries;
    const lowerQ = searchQuery.toLowerCase();
    return entries.filter(e => 
      e.title.toLowerCase().includes(lowerQ) || 
      e.content.toLowerCase().includes(lowerQ) ||
      e.tags.some(t => t.toLowerCase().includes(lowerQ))
    );
  }, [entries, searchQuery]);

  // Handlers
  const handleCreateEntry = (date?: Date) => {
    const newEntry = StorageService.createEntry(date);
    setEntries(prev => [newEntry, ...prev]);
    setSelectedEntryId(newEntry.id);
    setViewMode('editor');
  };

  const handleUpdateEntry = (updates: Partial<Entry>) => {
    if (!selectedEntryId) return;
    
    setEntries(prev => prev.map(entry => {
      if (entry.id === selectedEntryId) {
        const updated = { ...entry, ...updates, updatedAt: new Date().toISOString() };
        StorageService.saveEntry(updated); // Async save, fire and forget for UI responsiveness
        return updated;
      }
      return entry;
    }));
  };

  const handleDeleteEntry = (id: string) => {
    StorageService.deleteEntry(id);
    setEntries(prev => prev.filter(e => e.id !== id));
    if (selectedEntryId === id) {
      setSelectedEntryId(null);
    }
  };

  const handleSettingsChange = (newSettings: AppSettings) => {
    setSettings(newSettings);
    StorageService.saveSettings(newSettings);
  };

  const handleReportGenerated = (report: Report) => {
    setReports(prev => [report, ...prev]);
    StorageService.saveReport(report);
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleImport = (importedEntries: Entry[]) => {
    // Merge strategy: Add ones that don't exist by ID
    const currentIds = new Set(entries.map(e => e.id));
    const newEntries = importedEntries.filter(e => !currentIds.has(e.id));
    const merged = [...newEntries, ...entries].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    setEntries(merged);
    merged.forEach(e => StorageService.saveEntry(e));
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Sidebar - Navigation */}
      <Sidebar 
        viewMode={viewMode} 
        setViewMode={setViewMode}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        onImport={handleImport}
        allEntries={entries}
        settings={settings}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden transition-all duration-300">
        
        {/* Top Mobile/Tablet Header (mostly for theme toggle and sidebar toggle on small screens) */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900">
           <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded">
             <span className="sr-only">Menu</span>
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
           </button>
           <h1 className="font-serif font-bold text-lg">Lumina</h1>
           <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800">
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden relative">
          
          {/* Middle Column: Entry List (Only visible if viewing Editor or if on mobile and no entry selected) */}
          {(viewMode === 'editor') && (
            <div className={`
              ${selectedEntryId && 'hidden md:flex'} 
              flex-col w-full md:w-80 lg:w-96 border-r border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 z-10
            `}>
              <EntryList 
                entries={filteredEntries}
                selectedId={selectedEntryId}
                onSelect={setSelectedEntryId}
                onDelete={handleDeleteEntry}
                onCreate={() => handleCreateEntry()}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
              />
            </div>
          )}

          {/* Right Column: Editor or Analytics */}
          <main className={`flex-1 flex flex-col h-full overflow-hidden bg-gray-50 dark:bg-slate-950 relative`}>
            
            {/* Desktop Theme Toggle Overlay */}
            <div className="hidden md:block absolute top-4 right-4 z-50">
              <button 
                onClick={toggleTheme} 
                className="p-2 rounded-full bg-white dark:bg-slate-800 shadow-sm border border-gray-200 dark:border-slate-700 text-slate-500 hover:text-primary-600 dark:text-slate-400 dark:hover:text-primary-400 transition-colors"
                title="Toggle Theme"
              >
                {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
              </button>
            </div>

            {viewMode === 'analytics' ? (
              <AnalyticsDashboard 
                entries={entries} 
                settings={settings}
                reports={reports}
                onReportGenerated={handleReportGenerated}
              />
            ) : viewMode === 'settings' ? (
              <SettingsPanel 
                settings={settings}
                onSettingsChange={handleSettingsChange}
                theme={theme}
              />
            ) : viewMode === 'calendar' ? (
              <CalendarView
                entries={entries}
                onSelectEntry={(id) => {
                  setSelectedEntryId(id);
                  setViewMode('editor');
                }}
                onCreateEntry={(date) => handleCreateEntry(date)}
              />
            ) : (
              selectedEntry ? (
                <Editor 
                  entry={selectedEntry} 
                  onUpdate={handleUpdateEntry} 
                  onBack={() => setSelectedEntryId(null)}
                  settings={settings}
                />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                  <div className="w-24 h-24 mb-6 rounded-full bg-indigo-50 dark:bg-slate-900 flex items-center justify-center">
                    <svg className="w-12 h-12 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-serif font-medium text-slate-700 dark:text-slate-200 mb-2">选择一篇日记</h2>
                  <p className="max-w-xs mx-auto">从列表中选择一篇日记，或者创建新的日记开始写作。</p>
                  <button 
                    onClick={() => handleCreateEntry()}
                    className="mt-6 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-medium transition-colors"
                  >
                    写新日记
                  </button>
                </div>
              )
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default App;