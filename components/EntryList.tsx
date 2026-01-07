import React from 'react';
import { Entry } from '../types';
import { Search, Plus, Trash2, Tag, Calendar, Frown, Meh, Smile } from 'lucide-react';
import { format } from 'date-fns';

interface EntryListProps {
  entries: Entry[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onCreate: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

const MoodIcon = ({ mood, sentiment }: { mood?: string, sentiment?: string }) => {
  if (mood) return <span className="text-lg">{mood}</span>;
  
  if (sentiment === 'positive') return <Smile className="w-4 h-4 text-green-500" />;
  if (sentiment === 'negative') return <Frown className="w-4 h-4 text-red-500" />;
  return <Meh className="w-4 h-4 text-slate-400" />;
};

export const EntryList: React.FC<EntryListProps> = ({ 
  entries, 
  selectedId, 
  onSelect, 
  onDelete, 
  onCreate,
  searchQuery,
  setSearchQuery
}) => {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">My Journal</h2>
          <button 
            onClick={onCreate}
            className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
            aria-label="Create new entry"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
        
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 w-4 h-4 transition-colors" />
          <input
            type="text"
            placeholder="Search entries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 text-slate-800 dark:text-slate-200 placeholder-slate-400 transition-all outline-none"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {entries.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-sm">
            {searchQuery ? "No matching entries found." : "No entries yet. Start writing!"}
          </div>
        ) : (
          entries.map(entry => (
            <div 
              key={entry.id}
              onClick={() => onSelect(entry.id)}
              className={`
                group relative p-4 rounded-xl cursor-pointer transition-all duration-200 border
                ${selectedId === entry.id 
                  ? 'bg-white dark:bg-slate-800 border-indigo-200 dark:border-indigo-900 shadow-md ring-1 ring-indigo-500/10' 
                  : 'bg-transparent border-transparent hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm hover:border-gray-100 dark:hover:border-slate-700'
                }
              `}
            >
              <div className="flex justify-between items-start mb-1">
                <span className="text-xs font-medium text-slate-400 flex items-center">
                  <Calendar className="w-3 h-3 mr-1" />
                  {format(new Date(entry.date), 'MMM d, yyyy')}
                </span>
                <div className="flex items-center space-x-2">
                   <MoodIcon mood={entry.mood} sentiment={entry.sentiment} />
                   <button 
                     onClick={(e) => { e.stopPropagation(); onDelete(entry.id); }}
                     className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition-opacity"
                     title="Delete"
                   >
                     <Trash2 className="w-3 h-3" />
                   </button>
                </div>
              </div>
              
              <h3 className={`font-serif font-semibold text-base mb-1 line-clamp-1 ${selectedId === entry.id ? 'text-indigo-900 dark:text-indigo-100' : 'text-slate-700 dark:text-slate-200'}`}>
                {entry.title || "Untitled Entry"}
              </h3>
              
              <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-2">
                {entry.content || "No content..."}
              </p>

              {entry.tags && entry.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {entry.tags.slice(0, 3).map(tag => (
                    <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                      <Tag className="w-2 h-2 mr-1" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
