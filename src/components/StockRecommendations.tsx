import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Search,
  ExternalLink,
  Sparkles,
  Star,
  Download,
  ArrowLeft,
  PieChart,
  BarChart3,
  Calendar,
  Layers,
  ShieldCheck,
  Zap,
  Info,
  ChevronRight,
  Filter,
  CheckCircle2,
  RefreshCw,
  Wallet,
  Globe2,
  Building2,
  ArrowUpRight,
  Calculator,
} from 'lucide-react';
import {
  StockItem,
  MarketType,
  ChartPeriod,
  PricePoint,
  SimulatorStrategy,
  SimulationResult,
} from '../types/stocks';
import {
  INITIAL_STOCKS,
  getSavedStocks,
  getWatchlist,
  toggleWatchlistTicker,
  calculateInvestmentSimulation,
  fetchStockAIAnalysis,
  exportStocksToCSV,
} from '../services/stockService';

interface StockRecommendationsProps {
  userName?: string;
  onBack: () => void;
}

export const StockRecommendations: React.FC<StockRecommendationsProps> = ({
  userName,
  onBack,
}) => {
  const [stocks, setStocks] = useState<StockItem[]>(() => getSavedStocks());
  const [watchlist, setWatchlist] = useState<string[]>(() => getWatchlist());
  const [selectedStockTicker, setSelectedStockTicker] = useState<string>('BBAS3');
  const [selectedPeriod, setSelectedPeriod] = useState<ChartPeriod>('1M');
  const [activeTab, setActiveTab] = useState<'top10' | 'all' | 'simulator'>('top10');
  const [marketFilter, setMarketFilter] = useState<'ALL' | MarketType>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'score' | 'upside' | 'dy' | 'pe'>('score');
  const [hoveredPoint, setHoveredPoint] = useState<PricePoint | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Simulator State
  const [simBudget, setSimBudget] = useState<number>(2000);
  const [simCurrency, setSimCurrency] = useState<'BRL' | 'USD'>('BRL');
  const [simStrategy, setSimStrategy] = useState<SimulatorStrategy>('top10');

  // Currently selected stock
  const selectedStock = useMemo(() => {
    return stocks.find((s) => s.ticker === selectedStockTicker) || stocks[0];
  }, [stocks, selectedStockTicker]);

  // Top 10 Stocks
  const top10Stocks = useMemo(() => {
    return [...stocks]
      .filter((s) => s.isTop10 || s.score >= 88)
      .sort((a, b) => (a.top10Rank || 99) - (b.top10Rank || 99))
      .slice(0, 10);
  }, [stocks]);

  // Filtered & Sorted Stocks for "all" tab
  const displayedStocks = useMemo(() => {
    return stocks
      .filter((s) => {
        if (marketFilter !== 'ALL' && s.market !== marketFilter) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          return (
            s.ticker.toLowerCase().includes(q) ||
            s.name.toLowerCase().includes(q) ||
            s.sector.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'upside') return b.upsidePercent - a.upsidePercent;
        if (sortBy === 'dy') return b.dividendYield - a.dividendYield;
        if (sortBy === 'pe') return a.peRatio - b.peRatio;
        return b.score - a.score;
      });
  }, [stocks, marketFilter, searchQuery, sortBy]);

  // Watchlist items
  const watchlistStocks = useMemo(() => {
    return stocks.filter((s) => watchlist.includes(s.ticker));
  }, [stocks, watchlist]);

  // Simulation result
  const simulationResult: SimulationResult = useMemo(() => {
    return calculateInvestmentSimulation(simBudget, simCurrency, simStrategy, stocks);
  }, [simBudget, simCurrency, simStrategy, stocks]);

  // Toggle watchlist
  const handleToggleWatchlist = (ticker: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const updated = toggleWatchlistTicker(ticker);
    setWatchlist(updated);
  };

  // Trigger Gemini AI stock analysis
  const handleGenerateAIThesis = async () => {
    if (!selectedStock) return;
    setIsAiLoading(true);
    try {
      const updatedThesis = await fetchStockAIAnalysis(selectedStock);
      setStocks((prev) =>
        prev.map((s) => (s.ticker === selectedStock.ticker ? { ...s, thesis: updatedThesis } : s))
      );
    } finally {
      setIsAiLoading(false);
    }
  };

  // Price history points for the selected period
  const historyPoints = useMemo(() => {
    return selectedStock?.history?.[selectedPeriod] || [];
  }, [selectedStock, selectedPeriod]);

  // Calculate SVG Chart coordinates
  const chartData = useMemo(() => {
    if (historyPoints.length === 0) return { path: '', area: '', min: 0, max: 0, points: [] };
    const prices = historyPoints.map((p) => p.price);
    const min = Math.min(...prices) * 0.99;
    const max = Math.max(...prices) * 1.01;
    const range = max - min || 1;

    const width = 800;
    const height = 260;
    const paddingBottom = 25;
    const paddingTop = 20;
    const chartHeight = height - paddingTop - paddingBottom;

    const coords = historyPoints.map((p, i) => {
      const x = (i / (historyPoints.length - 1)) * (width - 40) + 20;
      const y = paddingTop + (1 - (p.price - min) / range) * chartHeight;
      return { x, y, point: p };
    });

    const path = coords.reduce((acc, c, i) => {
      if (i === 0) return `M ${c.x} ${c.y}`;
      // Smooth cubic bezier
      const prev = coords[i - 1];
      const cpX = (prev.x + c.x) / 2;
      return `${acc} C ${cpX} ${prev.y}, ${cpX} ${c.y}, ${c.x} ${c.y}`;
    }, '');

    const area = `${path} L ${coords[coords.length - 1].x} ${height} L ${coords[0].x} ${height} Z`;

    const isPositive =
      historyPoints[historyPoints.length - 1].price >= historyPoints[0].price;

    return { path, area, min, max, coords, isPositive };
  }, [historyPoints]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-teal-500 selection:text-white pb-16">
      {/* Top Ticker Bar (Global Indices & Dólar) */}
      <div className="bg-slate-900/90 border-b border-slate-800 text-xs py-2 px-4 sticky top-0 z-30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-6 text-[11px] whitespace-nowrap">
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Mercado Aberto
            </span>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-300">IBOVESPA:</span>
              <span className="text-white font-medium">134.820 pts</span>
              <span className="text-emerald-400 font-semibold flex items-center">
                +0.62% <TrendingUp className="h-3 w-3 inline ml-0.5" />
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-300">S&P 500:</span>
              <span className="text-white font-medium">5.782 pts</span>
              <span className="text-emerald-400 font-semibold flex items-center">
                +0.45% <TrendingUp className="h-3 w-3 inline ml-0.5" />
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-300">NASDAQ:</span>
              <span className="text-white font-medium">18.275 pts</span>
              <span className="text-emerald-400 font-semibold flex items-center">
                +0.81% <TrendingUp className="h-3 w-3 inline ml-0.5" />
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-300">DÓLAR (USD/BRL):</span>
              <span className="text-white font-medium">R$ 5,42</span>
              <span className="text-emerald-400 font-semibold flex items-center">
                -0.38% <TrendingDown className="h-3 w-3 inline ml-0.5" />
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://www.google.com/finance"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium border border-slate-700 transition-colors"
            >
              <Globe2 className="h-3 w-3 text-teal-400" />
              Google Finance
              <ExternalLink className="h-2.5 w-2.5 opacity-60" />
            </a>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer mr-2 py-1 px-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Voltar à Central
              </button>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-teal-500/20 text-teal-300 border border-teal-500/30 uppercase tracking-wide">
                Google Finance &bull; B3 & EUA
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Radar de Ações & Auxiliar de Compra
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Top 10 do dia, valuation fundamentalista, gráficos interativos e simulador de aporte.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => exportStocksToCSV(stocks, simulationResult)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-300 transition-all cursor-pointer"
            >
              <Download className="h-3.5 w-3.5 text-teal-400" />
              Exportar CSV
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mt-5 border-b border-slate-800 pb-3">
          <button
            type="button"
            onClick={() => setActiveTab('top10')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'top10'
                ? 'bg-teal-600 text-white shadow-md shadow-teal-900/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Sparkles className="h-4 w-4" />
            Top 10 Melhores Ações do Dia
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-950/60 text-teal-200">
              Hoje
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'all'
                ? 'bg-teal-600 text-white shadow-md shadow-teal-900/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Layers className="h-4 w-4" />
            Todas as Ações (B3 & Wall Street)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('simulator')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'simulator'
                ? 'bg-teal-600 text-white shadow-md shadow-teal-900/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Calculator className="h-4 w-4" />
            Simulador de Aporte & Carteira
          </button>
        </div>

        {/* ========================================================================= */}
        {/* MAIN INTERACTIVE CARD: STOCK CHART & DETAILS VIEW                         */}
        {/* ========================================================================= */}
        {selectedStock && (
          <div className="mt-6 bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl overflow-hidden backdrop-blur-sm">
            {/* Stock Header & Live Price */}
            <div className="p-5 sm:p-6 border-b border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-teal-900/70 to-slate-800 border border-teal-500/20 flex items-center justify-center font-bold text-white text-base shadow-sm">
                  {selectedStock.ticker.slice(0, 3)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                      {selectedStock.ticker}
                    </h2>
                    <span className="text-xs text-slate-400 font-medium">
                      &bull; {selectedStock.name}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                        selectedStock.market === 'B3'
                          ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                          : 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                      }`}
                    >
                      {selectedStock.market === 'B3' ? '🇧🇷 B3 Brasil' : '🇺🇸 EUA / ' + selectedStock.exchange}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => handleToggleWatchlist(selectedStock.ticker, e)}
                      title="Salvar na Watchlist"
                      className="text-slate-500 hover:text-amber-400 transition-colors p-1"
                    >
                      <Star
                        className={`h-4 w-4 ${
                          watchlist.includes(selectedStock.ticker)
                            ? 'text-amber-400 fill-amber-400'
                            : ''
                        }`}
                      />
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {selectedStock.sector} &bull; Cap: {selectedStock.marketCap}
                  </p>
                </div>
              </div>

              {/* Price & Signal Badges */}
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-2xl sm:text-3xl font-black text-white">
                    {selectedStock.currency === 'BRL' ? 'R$ ' : '$ '}
                    {selectedStock.price.toFixed(2)}
                  </div>
                  <div
                    className={`text-xs font-bold inline-flex items-center gap-1 ${
                      selectedStock.changePercent >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {selectedStock.changePercent >= 0 ? '+' : ''}
                    {selectedStock.change.toFixed(2)} ({selectedStock.changePercent >= 0 ? '+' : ''}
                    {selectedStock.changePercent.toFixed(2)}%)
                    {selectedStock.changePercent >= 0 ? (
                      <TrendingUp className="h-3.5 w-3.5" />
                    ) : (
                      <TrendingDown className="h-3.5 w-3.5" />
                    )}
                  </div>
                </div>

                <div className="border-l border-slate-800 pl-4 flex flex-col items-end gap-1.5">
                  <span
                    className={`px-3 py-1 rounded-lg text-xs font-black tracking-wider uppercase border shadow-sm ${
                      selectedStock.recommendation === 'COMPRA FORTE'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : selectedStock.recommendation === 'COMPRA'
                        ? 'bg-teal-500/20 text-teal-300 border-teal-500/40'
                        : 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                    }`}
                  >
                    {selectedStock.recommendation}
                  </span>
                  <div className="text-[11px] text-slate-400">
                    Score:{' '}
                    <span className="font-bold text-teal-300">{selectedStock.score}/100</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Google Finance External Link + Period Bar */}
            <div className="px-5 py-3 bg-slate-950/60 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
              {/* Google Finance Direct Link Button */}
              <a
                href={selectedStock.googleFinanceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-950/60 hover:bg-teal-900/60 border border-teal-600/30 text-teal-300 font-semibold transition-all hover:scale-102"
              >
                <Globe2 className="h-3.5 w-3.5 text-teal-400" />
                <span>Ver cotação oficial no Google Finance ({selectedStock.ticker})</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>

              {/* Chart Period Switcher */}
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                {(['1D', '5D', '1M', '6M', '1A', '5A'] as ChartPeriod[]).map((period) => (
                  <button
                    key={period}
                    type="button"
                    onClick={() => {
                      setSelectedPeriod(period);
                      setHoveredPoint(null);
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      selectedPeriod === period
                        ? 'bg-teal-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {period}
                  </button>
                ))}
              </div>
            </div>

            {/* Interactive SVG Chart */}
            <div className="p-4 sm:p-6 relative">
              {/* Hover point tooltip */}
              {hoveredPoint && (
                <div className="absolute top-2 left-6 z-10 bg-slate-900/95 border border-teal-500/40 px-3 py-1.5 rounded-xl shadow-lg text-xs">
                  <div className="text-[10px] text-slate-400">Data/Hora: {hoveredPoint.date}</div>
                  <div className="text-white font-bold">
                    {selectedStock.currency === 'BRL' ? 'R$ ' : '$ '}
                    {hoveredPoint.price.toFixed(2)}
                  </div>
                </div>
              )}

              {/* Responsive SVG */}
              <div className="w-full h-64 relative">
                <svg
                  viewBox="0 0 800 260"
                  preserveAspectRatio="none"
                  className="w-full h-full cursor-crosshair overflow-visible"
                  onMouseLeave={() => setHoveredPoint(null)}
                >
                  <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="0%"
                        stopColor={chartData.isPositive ? '#10b981' : '#f43f5e'}
                        stopOpacity="0.25"
                      />
                      <stop
                        offset="100%"
                        stopColor={chartData.isPositive ? '#10b981' : '#f43f5e'}
                        stopOpacity="0.0"
                      />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Grid lines */}
                  <line x1="20" y1="50" x2="780" y2="50" stroke="#1e293b" strokeDasharray="3 3" />
                  <line x1="20" y1="120" x2="780" y2="120" stroke="#1e293b" strokeDasharray="3 3" />
                  <line x1="20" y1="190" x2="780" y2="190" stroke="#1e293b" strokeDasharray="3 3" />

                  {/* Area fill */}
                  {chartData.area && (
                    <path d={chartData.area} fill="url(#chartGradient)" />
                  )}

                  {/* Price Path line */}
                  {chartData.path && (
                    <path
                      d={chartData.path}
                      fill="none"
                      stroke={chartData.isPositive ? '#10b981' : '#f43f5e'}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}

                  {/* Target Price dashed line */}
                  <line
                    x1="20"
                    y1={20}
                    x2="780"
                    y2={20}
                    stroke="#14b8a6"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                    opacity="0.6"
                  />

                  {/* Interactive tracking points */}
                  {chartData.coords?.map((c, i) => (
                    <circle
                      key={i}
                      cx={c.x}
                      cy={c.y}
                      r={hoveredPoint?.date === c.point.date ? 6 : 3}
                      className="cursor-pointer transition-all"
                      fill={hoveredPoint?.date === c.point.date ? '#ffffff' : (chartData.isPositive ? '#10b981' : '#f43f5e')}
                      stroke="#0f172a"
                      strokeWidth="2"
                      onMouseEnter={() => setHoveredPoint(c.point)}
                    />
                  ))}
                </svg>

                {/* Target Price indicator badge on chart */}
                <div className="absolute top-2 right-4 text-[11px] font-semibold text-teal-400 bg-teal-950/80 px-2 py-0.5 rounded border border-teal-800">
                  Preço Alvo / Teto: {selectedStock.currency === 'BRL' ? 'R$ ' : '$ '}
                  {selectedStock.targetPrice.toFixed(2)} (+{selectedStock.upsidePercent.toFixed(1)}%)
                </div>
              </div>

              {/* Chart footer metrics (Min, Max, Period return) */}
              <div className="mt-3 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-3">
                <div>
                  Mínima do período:{' '}
                  <span className="font-semibold text-slate-200">
                    {selectedStock.currency === 'BRL' ? 'R$ ' : '$ '}
                    {chartData.min.toFixed(2)}
                  </span>
                </div>
                <div>
                  Máxima do período:{' '}
                  <span className="font-semibold text-slate-200">
                    {selectedStock.currency === 'BRL' ? 'R$ ' : '$ '}
                    {chartData.max.toFixed(2)}
                  </span>
                </div>
                <div>
                  Potencial (Upside):{' '}
                  <span className="font-bold text-teal-300">
                    +{selectedStock.upsidePercent.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Fundamental Valuation Grid */}
            <div className="bg-slate-950/50 p-5 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-400 block mb-0.5">Preço Teto / Alvo</span>
                <span className="text-base font-bold text-teal-300">
                  {selectedStock.currency === 'BRL' ? 'R$ ' : '$ '}
                  {selectedStock.targetPrice.toFixed(2)}
                </span>
                <span className="text-[10px] text-emerald-400 block font-medium">
                  +{selectedStock.upsidePercent.toFixed(1)}% upside
                </span>
              </div>

              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-400 block mb-0.5">P/L (P/E Ratio)</span>
                <span className="text-base font-bold text-white">
                  {selectedStock.peRatio.toFixed(1)}x
                </span>
                <span className="text-[10px] text-slate-400 block font-medium">
                  {selectedStock.peRatio < 10 ? 'Muito Barato' : selectedStock.peRatio < 25 ? 'Justo' : 'Crescimento'}
                </span>
              </div>

              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-400 block mb-0.5">Dividend Yield</span>
                <span className="text-base font-bold text-emerald-400">
                  {selectedStock.dividendYield.toFixed(2)}%
                </span>
                <span className="text-[10px] text-slate-400 block font-medium">
                  Projeção anual
                </span>
              </div>

              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-400 block mb-0.5">RSI (14 Dias)</span>
                <span className="text-base font-bold text-white">
                  {selectedStock.rsi}
                </span>
                <span className="text-[10px] text-slate-400 block font-medium">
                  {selectedStock.rsi < 45 ? 'Zona de Compra' : 'Neutro'}
                </span>
              </div>

              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-400 block mb-0.5">52 Semanas (Mín / Máx)</span>
                <span className="text-xs font-bold text-slate-200 block truncate">
                  {selectedStock.fiftyTwoWeekLow.toFixed(1)} - {selectedStock.fiftyTwoWeekHigh.toFixed(1)}
                </span>
                <span className="text-[10px] text-slate-400 block font-medium">
                  Faixa de 1 ano
                </span>
              </div>

              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-400 block mb-0.5">Preço Ideal de Entrada</span>
                <span className="text-base font-bold text-amber-300">
                  {selectedStock.currency === 'BRL' ? 'R$ ' : '$ '}
                  {selectedStock.thesis.idealBuyPrice.toFixed(2)}
                </span>
                <span className="text-[10px] text-amber-400/80 block font-medium">
                  Margem de segurança
                </span>
              </div>
            </div>

            {/* AI Investment Thesis & Highlights */}
            <div className="p-5 sm:p-6 border-t border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      Tese de Investimento & Parecer com IA
                    </h3>
                    <span className="text-[11px] text-slate-400">
                      Racional estratégico e análise de risco para compra hoje
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGenerateAIThesis}
                  disabled={isAiLoading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isAiLoading ? 'animate-spin' : ''}`} />
                  {isAiLoading ? 'Analisando Mercado...' : 'Atualizar Análise com IA'}
                </button>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-xs sm:text-sm text-slate-300 leading-relaxed mb-4">
                {selectedStock.thesis.summary}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Highlights */}
                <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-900/30">
                  <span className="font-bold text-emerald-400 flex items-center gap-1.5 mb-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Pontos Fortes & Catalisadores
                  </span>
                  <ul className="space-y-1.5 text-slate-300">
                    {selectedStock.thesis.highlights.map((h, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-emerald-500 font-bold">&bull;</span>
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Risks */}
                <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-900/30">
                  <span className="font-bold text-rose-400 flex items-center gap-1.5 mb-2">
                    <Info className="h-4 w-4" />
                    Principais Fatores de Risco
                  </span>
                  <ul className="space-y-1.5 text-slate-300">
                    {selectedStock.thesis.risks.map((r, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-rose-500 font-bold">&bull;</span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 1: TOP 10 MELHORES AÇÕES DO DIA                                       */}
        {/* ========================================================================= */}
        {activeTab === 'top10' && (
          <div className="mt-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-400" />
                  Top 10 Melhores Ações para Comprar Hoje
                </h3>
                <p className="text-xs text-slate-400">
                  Classificação baseada em Valuation (P/L), Margem de Segurança, Dividend Yield e Momentum.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {top10Stocks.map((stock, index) => {
                const isSelected = selectedStockTicker === stock.ticker;
                return (
                  <div
                    key={stock.ticker}
                    onClick={() => {
                      setSelectedStockTicker(stock.ticker);
                      window.scrollTo({ top: 120, behavior: 'smooth' });
                    }}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                      isSelected
                        ? 'bg-slate-900 border-teal-500 shadow-lg shadow-teal-950/50'
                        : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                    }`}
                  >
                    {/* Rank Number Badge */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="h-6 w-6 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 flex items-center justify-center text-xs font-black">
                          #{index + 1}
                        </span>
                        <span className="font-black text-white text-base">
                          {stock.ticker}
                        </span>
                        <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
                          {stock.name}
                        </span>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                          stock.market === 'B3'
                            ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                            : 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                        }`}
                      >
                        {stock.market === 'B3' ? 'B3' : 'EUA'}
                      </span>
                    </div>

                    {/* Price & Upside */}
                    <div className="flex items-baseline justify-between mt-3">
                      <div>
                        <div className="text-lg font-black text-white">
                          {stock.currency === 'BRL' ? 'R$ ' : '$ '}
                          {stock.price.toFixed(2)}
                        </div>
                        <span
                          className={`text-xs font-bold ${
                            stock.changePercent >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {stock.changePercent >= 0 ? '+' : ''}
                          {stock.changePercent.toFixed(2)}%
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-[11px] text-slate-400 block">Preço Teto</span>
                        <span className="text-sm font-bold text-teal-300">
                          {stock.currency === 'BRL' ? 'R$ ' : '$ '}
                          {stock.targetPrice.toFixed(2)}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-400 block">
                          +{stock.upsidePercent.toFixed(1)}% upside
                        </span>
                      </div>
                    </div>

                    {/* Quick Metrics Bar */}
                    <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                      <div>
                        P/L: <span className="font-semibold text-slate-200">{stock.peRatio.toFixed(1)}x</span>
                      </div>
                      <div>
                        DY: <span className="font-semibold text-emerald-400">{stock.dividendYield.toFixed(1)}%</span>
                      </div>
                      <div>
                        Score: <span className="font-bold text-teal-300">{stock.score}/100</span>
                      </div>
                    </div>

                    {/* Action Indicator */}
                    <div className="mt-3 flex items-center justify-between text-xs">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          stock.recommendation === 'COMPRA FORTE'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-teal-500/20 text-teal-300'
                        }`}
                      >
                        {stock.recommendation}
                      </span>
                      <span className="text-slate-400 hover:text-white flex items-center gap-0.5 font-medium text-[11px]">
                        Ver Gráfico &rarr;
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: TODAS AS AÇÕES COM FILTROS E BUSCA                                 */}
        {/* ========================================================================= */}
        {activeTab === 'all' && (
          <div className="mt-8">
            {/* Filters Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5">
              {/* Search input */}
              <div className="relative flex-1 max-w-md">
                <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar ação por ticker, empresa ou setor..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                />
              </div>

              {/* Market Filter (B3 / EUA / ALL) */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
                  <button
                    type="button"
                    onClick={() => setMarketFilter('ALL')}
                    className={`px-3 py-1.5 rounded-lg font-semibold cursor-pointer ${
                      marketFilter === 'ALL'
                        ? 'bg-teal-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Todas ({stocks.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setMarketFilter('B3')}
                    className={`px-3 py-1.5 rounded-lg font-semibold cursor-pointer ${
                      marketFilter === 'B3'
                        ? 'bg-amber-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    🇧🇷 B3 Brasil
                  </button>
                  <button
                    type="button"
                    onClick={() => setMarketFilter('US')}
                    className={`px-3 py-1.5 rounded-lg font-semibold cursor-pointer ${
                      marketFilter === 'US'
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    🇺🇸 EUA / Wall St
                  </button>
                </div>

                {/* Sort selector */}
                <select
                  value={sortBy}
                  onChange={(e: any) => setSortBy(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-teal-500"
                >
                  <option value="score">Maior Score</option>
                  <option value="upside">Maior Upside (%)</option>
                  <option value="dy">Maior Dividend Yield</option>
                  <option value="pe">Menor P/L (Mais Baratas)</option>
                </select>
              </div>
            </div>

            {/* Table of stocks */}
            <div className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase font-semibold text-[11px]">
                    <tr>
                      <th className="py-3.5 px-4">Ativo / Empresa</th>
                      <th className="py-3.5 px-3">Mercado</th>
                      <th className="py-3.5 px-3">Preço Atual</th>
                      <th className="py-3.5 px-3">Var. Hoje</th>
                      <th className="py-3.5 px-3">Preço Teto</th>
                      <th className="py-3.5 px-3">Upside</th>
                      <th className="py-3.5 px-3">P/L</th>
                      <th className="py-3.5 px-3">DY (%)</th>
                      <th className="py-3.5 px-3">Score</th>
                      <th className="py-3.5 px-3">Recomendação</th>
                      <th className="py-3.5 px-4 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {displayedStocks.map((stock) => {
                      const isSelected = selectedStockTicker === stock.ticker;
                      return (
                        <tr
                          key={stock.ticker}
                          onClick={() => {
                            setSelectedStockTicker(stock.ticker);
                            window.scrollTo({ top: 120, behavior: 'smooth' });
                          }}
                          className={`hover:bg-slate-800/50 transition-colors cursor-pointer ${
                            isSelected ? 'bg-teal-950/20' : ''
                          }`}
                        >
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={(e) => handleToggleWatchlist(stock.ticker, e)}
                                className="text-slate-600 hover:text-amber-400"
                              >
                                <Star
                                  className={`h-3.5 w-3.5 ${
                                    watchlist.includes(stock.ticker)
                                      ? 'text-amber-400 fill-amber-400'
                                      : ''
                                  }`}
                                />
                              </button>
                              <div>
                                <span className="font-bold text-white text-sm block">
                                  {stock.ticker}
                                </span>
                                <span className="text-[11px] text-slate-400">
                                  {stock.name}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-3">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                                stock.market === 'B3'
                                  ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                                  : 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                              }`}
                            >
                              {stock.market === 'B3' ? 'B3' : 'EUA'}
                            </span>
                          </td>

                          <td className="py-3.5 px-3 font-bold text-white">
                            {stock.currency === 'BRL' ? 'R$ ' : '$ '}
                            {stock.price.toFixed(2)}
                          </td>

                          <td
                            className={`py-3.5 px-3 font-semibold ${
                              stock.changePercent >= 0 ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {stock.changePercent >= 0 ? '+' : ''}
                            {stock.changePercent.toFixed(2)}%
                          </td>

                          <td className="py-3.5 px-3 font-semibold text-teal-300">
                            {stock.currency === 'BRL' ? 'R$ ' : '$ '}
                            {stock.targetPrice.toFixed(2)}
                          </td>

                          <td className="py-3.5 px-3 font-bold text-emerald-400">
                            +{stock.upsidePercent.toFixed(1)}%
                          </td>

                          <td className="py-3.5 px-3 text-slate-300">
                            {stock.peRatio.toFixed(1)}x
                          </td>

                          <td className="py-3.5 px-3 font-bold text-emerald-400">
                            {stock.dividendYield.toFixed(1)}%
                          </td>

                          <td className="py-3.5 px-3">
                            <span className="font-black text-teal-300">{stock.score}</span>
                            <span className="text-[10px] text-slate-500">/100</span>
                          </td>

                          <td className="py-3.5 px-3">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                stock.recommendation === 'COMPRA FORTE'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                              }`}
                            >
                              {stock.recommendation}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <button
                              type="button"
                              className="text-xs text-teal-400 hover:text-teal-300 font-semibold"
                            >
                              Ver Detalhes &rarr;
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: SIMULADOR DE COMPRA & APORTE INTELIGENTE                            */}
        {/* ========================================================================= */}
        {activeTab === 'simulator' && (
          <div className="mt-8">
            <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 sm:p-6 shadow-xl mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30">
                  <Calculator className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white">
                    Simulador Inteligente de Aporte em Ações
                  </h3>
                  <p className="text-xs text-slate-400">
                    Defina quanto você deseja investir hoje e o sistema distribuirá de forma otimizada entre as melhores ações.
                  </p>
                </div>
              </div>

              {/* Simulator Input Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Valor a Investir
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                      {simCurrency === 'BRL' ? 'R$' : '$'}
                    </span>
                    <input
                      type="number"
                      min={100}
                      step={50}
                      value={simBudget}
                      onChange={(e) => setSimBudget(Math.max(0, Number(e.target.value)))}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-bold text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Mercado / Moeda
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setSimCurrency('BRL')}
                      className={`py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                        simCurrency === 'BRL'
                          ? 'bg-amber-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      🇧🇷 Brasil (R$)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSimCurrency('USD')}
                      className={`py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                        simCurrency === 'USD'
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      🇺🇸 EUA ($)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Estratégia de Alocação
                  </label>
                  <select
                    value={simStrategy}
                    onChange={(e: any) => setSimStrategy(e.target.value)}
                    className="w-full py-2.5 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-teal-500"
                  >
                    <option value="top10">Top 10 Geral (Equilibrada)</option>
                    <option value="dividends">Foco em Dividendos Altos (Renda Passiva)</option>
                    <option value="growth">Foco em Crescimento & Upside</option>
                    <option value="defensive">Defensiva / Valor com Margem de Segurança</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Simulation KPI Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800">
                <span className="text-xs text-slate-400 block mb-1">Total Alocado em Cotas</span>
                <span className="text-xl font-black text-white">
                  {simCurrency === 'BRL' ? 'R$ ' : '$ '}
                  {simulationResult.totalAllocated.toFixed(2)}
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  Troco/Caixa:{' '}
                  <span className="text-teal-400 font-semibold">
                    {simCurrency === 'BRL' ? 'R$ ' : '$ '}
                    {simulationResult.cashRemaining.toFixed(2)}
                  </span>
                </span>
              </div>

              <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800">
                <span className="text-xs text-slate-400 block mb-1">Dividendos Anuais Projetados</span>
                <span className="text-xl font-black text-emerald-400">
                  {simCurrency === 'BRL' ? 'R$ ' : '$ '}
                  {simulationResult.annualDividendsEstimated.toFixed(2)}
                </span>
                <span className="text-[11px] text-emerald-400 block mt-0.5">
                  Renda passiva estimada
                </span>
              </div>

              <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800">
                <span className="text-xs text-slate-400 block mb-1">Yield Médio da Carteira</span>
                <span className="text-xl font-black text-teal-300">
                  {simulationResult.averageYieldPercent.toFixed(2)}% a.a.
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  Retorno em proventos
                </span>
              </div>

              <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800">
                <span className="text-xs text-slate-400 block mb-1">Potencial Médio (Upside)</span>
                <span className="text-xl font-black text-emerald-400">
                  +{simulationResult.estimatedReturnPercent.toFixed(1)}%
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  Até o preço alvo
                </span>
              </div>
            </div>

            {/* Allocation Order Table */}
            <div className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
              <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <PieChart className="h-4 w-4 text-teal-400" />
                  Sugestão de Ordem de Compra
                </h4>
                <span className="text-xs text-slate-400">
                  {simulationResult.allocations.length} ações selecionadas para o aporte
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/90 text-slate-400 uppercase text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Ação</th>
                      <th className="py-3 px-3">Cotação Atual</th>
                      <th className="py-3 px-3">Cotas a Comprar</th>
                      <th className="py-3 px-3">Total Investido</th>
                      <th className="py-3 px-3">Peso na Carteira</th>
                      <th className="py-3 px-3">Dividendos Anuais</th>
                      <th className="py-3 px-4 text-right">Link Google Finance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {simulationResult.allocations.map((alloc) => (
                      <tr key={alloc.stock.ticker} className="hover:bg-slate-800/40">
                        <td className="py-3 px-4">
                          <span className="font-bold text-white text-sm">
                            {alloc.stock.ticker}
                          </span>
                          <span className="text-[11px] text-slate-400 block">
                            {alloc.stock.name}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-slate-200">
                          {alloc.stock.currency === 'BRL' ? 'R$ ' : '$ '}
                          {alloc.stock.price.toFixed(2)}
                        </td>

                        <td className="py-3 px-3">
                          <span className="px-2.5 py-1 rounded-lg bg-teal-500/20 text-teal-300 font-bold border border-teal-500/30 text-xs">
                            {alloc.shares} cotas
                          </span>
                        </td>

                        <td className="py-3 px-3 font-bold text-white">
                          {alloc.stock.currency === 'BRL' ? 'R$ ' : '$ '}
                          {alloc.totalInvested.toFixed(2)}
                        </td>

                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-2 rounded-full bg-slate-800 overflow-hidden">
                              <div
                                className="h-full bg-teal-500 rounded-full"
                                style={{ width: `${alloc.weightPercent}%` }}
                              />
                            </div>
                            <span className="text-slate-300 font-semibold">
                              {alloc.weightPercent}%
                            </span>
                          </div>
                        </td>

                        <td className="py-3 px-3 font-bold text-emerald-400">
                          {alloc.stock.currency === 'BRL' ? 'R$ ' : '$ '}
                          {alloc.annualDividendProjected.toFixed(2)}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <a
                            href={alloc.stock.googleFinanceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-teal-400 hover:text-teal-300 font-semibold"
                          >
                            Abrir no Google Finance
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
