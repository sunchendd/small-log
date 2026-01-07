import React, { useState, useMemo } from 'react';
import { Entry, AppSettings, ReportType, Report } from '../types';
import { AIProviderService } from '../services/aiProviderService';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';
import { FileText, Loader2, TrendingUp, Calendar, Hash, Clock, BookOpen, Sparkles, ChevronDown, History } from 'lucide-react';
import { format, subDays, subMonths, subYears, startOfWeek, startOfMonth, startOfYear, isWithinInterval } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface AnalyticsProps {
  entries: Entry[];
  settings: AppSettings;
  reports: Report[];
  onReportGenerated: (report: Report) => void;
}

const REPORT_TYPE_CONFIG: Record<ReportType, { label: string; icon: string; dateRange: () => { start: Date; end: Date } }> = {
  weekly: {
    label: '周报',
    icon: '📅',
    dateRange: () => ({
      start: startOfWeek(new Date(), { weekStartsOn: 1 }),
      end: new Date()
    })
  },
  monthly: {
    label: '月报',
    icon: '📆',
    dateRange: () => ({
      start: startOfMonth(new Date()),
      end: new Date()
    })
  },
  yearly: {
    label: '年报',
    icon: '📊',
    dateRange: () => ({
      start: startOfYear(new Date()),
      end: new Date()
    })
  }
};

export const AnalyticsDashboard: React.FC<AnalyticsProps> = ({ entries, settings, reports, onReportGenerated }) => {
  const [report, setReport] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportType, setReportType] = useState<ReportType>('weekly');
  const [showReportTypeDropdown, setShowReportTypeDropdown] = useState(false);
  const [showReportHistory, setShowReportHistory] = useState(false);

  // Filter entries for the selected report type
  const filteredEntries = useMemo(() => {
    const { start, end } = REPORT_TYPE_CONFIG[reportType].dateRange();
    return entries.filter(e => {
      const entryDate = new Date(e.date);
      return isWithinInterval(entryDate, { start, end });
    });
  }, [entries, reportType]);

  // Prepare Data for Charts
  const sentimentData = entries
    .filter(e => e.sentimentScore !== undefined)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(e => ({
      date: format(new Date(e.date), 'MM/dd'),
      score: e.sentimentScore,
      title: e.title
    }))
    .slice(-14); // Last 14 entries

  // Mood Distribution
  const moodCounts = entries.reduce((acc, curr) => {
    const s = curr.sentiment || 'unclassified';
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const moodData = [
    { name: '积极', value: moodCounts['positive'] || 0, color: '#22c55e' },
    { name: '中性', value: moodCounts['neutral'] || 0, color: '#eab308' },
    { name: '消极', value: moodCounts['negative'] || 0, color: '#ef4444' },
  ];

  // Calculate writing streaks
  const calculateStreak = () => {
    if (entries.length === 0) return 0;
    const sortedEntries = [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    
    for (const entry of sortedEntries) {
      const entryDate = new Date(entry.date);
      entryDate.setHours(0, 0, 0, 0);
      const diffDays = Math.floor((currentDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 1) {
        streak++;
        currentDate = entryDate;
      } else {
        break;
      }
    }
    return streak;
  };

  // Average words per entry
  const avgWords = entries.length > 0 
    ? Math.round(entries.reduce((acc, e) => acc + e.content.split(/\s+/).length, 0) / entries.length)
    : 0;

  // Most frequent tags
  const tagCounts = entries.reduce((acc, curr) => {
    curr.tags.forEach(t => {
        acc[t] = (acc[t] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);
  
  const topTags = Object.entries(tagCounts)
    .sort((a, b) => (b[1] as number) - (a[1] as number))
    .slice(0, 5);

  const handleGenerateReport = async () => {
    if (!settings.providers[settings.activeProvider].apiKey) {
      alert('请先在设置中配置 API Key');
      return;
    }

    setIsGenerating(true);
    try {
      const result = await AIProviderService.generateReport(filteredEntries, reportType, settings);
      setReport(result);
      
      // Save report to history
      const newReport: Report = {
        id: Date.now().toString(36),
        type: reportType,
        title: `${REPORT_TYPE_CONFIG[reportType].label} - ${format(new Date(), 'yyyy-MM-dd')}`,
        content: result,
        startDate: REPORT_TYPE_CONFIG[reportType].dateRange().start.toISOString(),
        endDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        entryCount: filteredEntries.length
      };
      onReportGenerated(newReport);
    } catch (e: any) {
      alert(e.message || '报告生成失败');
    } finally {
      setIsGenerating(false);
    }
  };

  const loadHistoricalReport = (historicalReport: Report) => {
    setReport(historicalReport.content);
    setShowReportHistory(false);
  };

  return (
    <div className="flex-1 h-full overflow-y-auto p-6 md:p-10 bg-gray-50 dark:bg-slate-950">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="mb-8">
          <h1 className="text-3xl font-serif font-bold text-slate-800 dark:text-slate-100">📊 数据洞察</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">追踪你的情绪变化和写作习惯</p>
        </header>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800">
            <div className="flex items-center text-indigo-500 mb-2">
              <TrendingUp className="w-5 h-5 mr-2" />
              <span className="font-medium text-sm">平均情绪</span>
            </div>
            <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              {sentimentData.length > 0 
                ? Math.round(sentimentData.reduce((a, b) => a + (b.score || 0), 0) / sentimentData.length) + '%' 
                : 'N/A'
              }
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800">
            <div className="flex items-center text-emerald-500 mb-2">
              <Calendar className="w-5 h-5 mr-2" />
              <span className="font-medium text-sm">连续天数</span>
            </div>
            <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              {calculateStreak()} 天
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800">
            <div className="flex items-center text-amber-500 mb-2">
              <BookOpen className="w-5 h-5 mr-2" />
              <span className="font-medium text-sm">平均字数</span>
            </div>
            <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              {avgWords}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800">
            <div className="flex items-center text-purple-500 mb-2">
              <Hash className="w-5 h-5 mr-2" />
              <span className="font-medium text-sm">热门话题</span>
            </div>
            <div className="text-2xl font-bold text-slate-800 dark:text-slate-100 truncate">
              {topTags.length > 0 ? topTags[0][0] : '暂无'}
            </div>
          </div>
        </div>

        {/* Main Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sentiment Chart */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800">
            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-6">📈 情绪趋势</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sentimentData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis hide domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#8b5cf6" 
                    strokeWidth={3} 
                    dot={{ fill: '#8b5cf6', strokeWidth: 2 }} 
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Mood Bar Chart */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800">
            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-6">🎭 情绪分布</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={moodData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis hide />
                  <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px', border: 'none' }}/>
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {moodData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Top Tags */}
        {topTags.length > 0 && (
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800">
            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-4">🏷️ 常用标签</h3>
            <div className="flex flex-wrap gap-3">
              {topTags.map(([tag, count]) => (
                <span
                  key={tag}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-medium"
                >
                  #{tag} <span className="text-indigo-400 dark:text-indigo-500 ml-1">×{count}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* AI Report Section */}
        <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl p-8 text-white shadow-xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-serif font-bold mb-2 flex items-center gap-2">
                <Sparkles className="w-6 h-6" />
                AI 智能报告
              </h2>
              <p className="text-white/80 text-sm">
                使用 {settings.activeProvider.toUpperCase()} 生成深度分析报告
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Report Type Selector */}
              <div className="relative">
                <button
                  onClick={() => setShowReportTypeDropdown(!showReportTypeDropdown)}
                  className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg font-medium hover:bg-white/30 transition-colors flex items-center gap-2"
                >
                  {REPORT_TYPE_CONFIG[reportType].icon} {REPORT_TYPE_CONFIG[reportType].label}
                  <ChevronDown className="w-4 h-4" />
                </button>
                
                {showReportTypeDropdown && (
                  <div className="absolute top-full mt-2 right-0 bg-white dark:bg-slate-800 rounded-xl shadow-xl overflow-hidden z-10 min-w-[160px]">
                    {(Object.keys(REPORT_TYPE_CONFIG) as ReportType[]).map((type) => (
                      <button
                        key={type}
                        onClick={() => {
                          setReportType(type);
                          setShowReportTypeDropdown(false);
                          setReport(null);
                        }}
                        className={`w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2 ${
                          reportType === type ? 'bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400' : 'text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {REPORT_TYPE_CONFIG[type].icon} {REPORT_TYPE_CONFIG[type].label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* History Button */}
              {reports.length > 0 && (
                <button
                  onClick={() => setShowReportHistory(!showReportHistory)}
                  className="bg-white/20 backdrop-blur-sm p-2 rounded-lg hover:bg-white/30 transition-colors"
                  title="历史报告"
                >
                  <History className="w-5 h-5" />
                </button>
              )}
              
              {/* Generate Button */}
              <button 
                onClick={handleGenerateReport}
                disabled={isGenerating || filteredEntries.length === 0}
                className="bg-white text-indigo-600 px-5 py-2 rounded-lg font-medium hover:bg-indigo-50 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center shadow-sm"
              >
                {isGenerating ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <FileText className="w-4 h-4 mr-2" />}
                {isGenerating ? '生成中...' : '生成报告'}
              </button>
            </div>
          </div>

          {/* Entry Count Info */}
          <div className="mb-4 text-white/70 text-sm">
            📝 本期共 {filteredEntries.length} 篇日记
            {filteredEntries.length === 0 && <span className="text-yellow-300 ml-2">（需要至少 1 篇日记才能生成报告）</span>}
          </div>

          {/* Report History Panel */}
          {showReportHistory && reports.length > 0 && (
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 mb-4 border border-white/20">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <History className="w-4 h-4" />
                历史报告
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {reports.slice(0, 10).map((r) => (
                  <button
                    key={r.id}
                    onClick={() => loadHistoricalReport(r)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 transition-colors flex items-center justify-between"
                  >
                    <span>
                      {REPORT_TYPE_CONFIG[r.type].icon} {r.title}
                    </span>
                    <span className="text-white/60 text-xs">
                      {format(new Date(r.createdAt), 'MM/dd HH:mm')}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Report Content */}
          {report && (
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 text-sm leading-relaxed border border-white/20 animate-fade-in">
              <div className="prose prose-invert max-w-none">
                <div className="whitespace-pre-wrap font-sans">{report}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};