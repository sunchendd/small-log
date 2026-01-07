import { Entry, AppSettings, Report, DEFAULT_SETTINGS } from "../types";
import { v4 as uuidv4 } from 'uuid'; // Assuming uuid is available or we use a simple random string

const STORAGE_KEY = 'lumina_diary_entries';
const SETTINGS_KEY = 'lumina_diary_settings';
const REPORTS_KEY = 'lumina_diary_reports';

const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const StorageService = {
  // Entry operations
  loadEntries(): Entry[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error("Failed to load entries", e);
      return [];
    }
  },

  saveEntry(entry: Entry): void {
    const entries = this.loadEntries();
    const index = entries.findIndex(e => e.id === entry.id);
    
    if (index >= 0) {
      entries[index] = entry;
    } else {
      entries.push(entry);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  },

  deleteEntry(id: string): void {
    const entries = this.loadEntries().filter(e => e.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  },

  createEntry(date?: Date): Entry {
    return {
      id: generateId(),
      title: '',
      content: '',
      date: (date || new Date()).toISOString(),
      updatedAt: new Date().toISOString(),
      tags: [],
    };
  },

  exportData(): void {
    const entries = this.loadEntries();
    const settings = this.loadSettings();
    const reports = this.loadReports();
    
    const exportData = {
      entries,
      settings,
      reports,
      exportedAt: new Date().toISOString(),
      version: '2.0'
    };
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "lumina_diary_backup_" + new Date().toISOString().slice(0,10) + ".json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  },

  // Settings operations
  loadSettings(): AppSettings {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Merge with defaults to ensure new fields are present
        return { ...DEFAULT_SETTINGS, ...parsed, providers: { ...DEFAULT_SETTINGS.providers, ...parsed.providers } };
      }
      return DEFAULT_SETTINGS;
    } catch (e) {
      console.error("Failed to load settings", e);
      return DEFAULT_SETTINGS;
    }
  },

  saveSettings(settings: AppSettings): void {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  },

  // Report operations
  loadReports(): Report[] {
    try {
      const stored = localStorage.getItem(REPORTS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error("Failed to load reports", e);
      return [];
    }
  },

  saveReport(report: Report): void {
    const reports = this.loadReports();
    reports.unshift(report); // Add to beginning
    // Keep only last 50 reports
    const trimmed = reports.slice(0, 50);
    localStorage.setItem(REPORTS_KEY, JSON.stringify(trimmed));
  },

  deleteReport(id: string): void {
    const reports = this.loadReports().filter(r => r.id !== id);
    localStorage.setItem(REPORTS_KEY, JSON.stringify(reports));
  }
};
