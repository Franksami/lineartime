/**
 * CheatCal Main Layout - Timepage-Inspired Excellence + Controversial Edge
 * 
 * Combines Moleskine Timepage award-winning design sophistication with
 * controversial "productivity cheating" positioning for money-focused professionals.
 * 
 * Design Philosophy: Sophisticated controversy for elite results
 * Target: Money-getters who embrace controversial methods for extraordinary outcomes
 * 
 * @version 1.0.0 (Revolutionary Design Release)
 * @author CheatCal UI/UX Team
 */

"use client";

import { AnimatePresence, motion } from "framer-motion";
import { 
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  BarChart3, 
  Bell,
  Brain, 
  Briefcase,
  Calendar,
  ChevronRight,
  Clock, 
  Crown,
  DollarSign, 
  Eye,
  Flame,
  Grid3X3,
  List,
  Plus,
  Search,
  Settings,
  Skull,
  Star,
  Target, 
  TrendingDown, 
  TrendingUp, 
  Trophy,
  Users, 
  Zap 
} from "lucide-react";
import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";

// Utility function for class names
const cn = (...classes: Array<string | false | null | undefined>) => {
  return classes.filter(Boolean).join(" ");
};

// ASCII Layout Architecture Documentation
const CHEATCAL_LAYOUT_ARCHITECTURE = `
CHEATCAL TIMEPAGE-INSPIRED LAYOUT ARCHITECTURE
═══════════════════════════════════════════════════════════════════

SOPHISTICATED CONTROVERSIAL DESIGN SYSTEM:
┌─────────────────────────────────────────────────────────────────┐
│                 AWARD-WINNING FOUNDATION                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ 🏆 TIMEPAGE DESIGN EXCELLENCE:                                │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ • Typography Excellence: Numerical emphasis + tabular nums │ │
│ │ • Sophisticated Animations: Physics-based + 60+ FPS        │ │
│ │ • Color Psychology: Professional palette + money focus     │ │
│ │ • Perfect Alignment: CSS Subgrid + container queries       │ │
│ │ • Micro-interactions: Delightful yet professional polish   │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                              │                                 │
│                              ▼                                 │
│ 💀 CONTROVERSIAL INTEGRATION:                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ • Money-focused metrics: Revenue, ROI, value creation      │ │
│ │ • Controversial branding: Skull + productivity cheating    │ │
│ │ • Elite positioning: "For people who get money" messaging  │ │
│ │ • Privacy trade-offs: Monitoring controls + transparency   │ │
│ │ • Success celebration: Achievement animations + viral hooks│ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘

LAYOUT HIERARCHY (PROFESSIONAL + CONTROVERSIAL):
Header: Controversial branding + sophisticated status indicators
Metrics: Money-focused KPIs with Timepage-level visual excellence  
Actions: Elite productivity commands with controversial positioning
Navigation: Sophisticated tab system with money-getter focus
Footer: Transparent about controversial methods + professional results
`;

// Enhanced Types for Money-Focused Professionals
interface CheatCalMetric {
  id: string;
  label: string;
  value: number;
  change: number;
  trend: "up" | "down";
  target?: number;
  controversy_level: "standard" | "moderate" | "high";
  money_impact: number; // Dollar value of this metric
}

interface EliteTask {
  id: string;
  title: string;
  priority: "billionaire" | "millionaire" | "entrepreneur";
  status: "cheating" | "optimizing" | "dominated";
  money_value: number;
  deadline: string;
  category: string;
  controversy_required: boolean;
}

interface ProductivityCheat {
  id: string;
  type: "revenue" | "efficiency" | "competition" | "optimization";
  title: string;
  description: string;
  money_impact: number;
  confidence: number;
  controversy_level: number;
  implementation_time: string;
}

// Mock data with controversial money-focused positioning
const eliteMetrics: CheatCalMetric[] = [
  { 
    id: "money_velocity", 
    label: "Money Velocity (Cheated)", 
    value: 847000, 
    change: 234.5, 
    trend: "up", 
    target: 1000000,
    controversy_level: "high",
    money_impact: 847000
  },
  { 
    id: "time_theft", 
    label: "Time Theft Efficiency", 
    value: 94.2, 
    change: 18.1, 
    trend: "up", 
    target: 95,
    controversy_level: "moderate", 
    money_impact: 45000
  },
  { 
    id: "roi_hacking", 
    label: "ROI Hacking Multiplier", 
    value: 312.8, 
    change: 67.3, 
    trend: "up", 
    target: 400,
    controversy_level: "high",
    money_impact: 156000
  },
  { 
    id: "elite_productivity", 
    label: "Elite Productivity Score", 
    value: 89.7, 
    change: 23.2, 
    trend: "up", 
    target: 95,
    controversy_level: "standard",
    money_impact: 78000
  }
];

const eliteTasks: EliteTask[] = [
  { 
    id: "dominate_market", 
    title: "Dominate Competitor Market Share", 
    priority: "billionaire", 
    status: "cheating", 
    money_value: 2500000, 
    deadline: "2024-12-15", 
    category: "Market Domination",
    controversy_required: true
  },
  { 
    id: "revenue_optimization", 
    title: "Revenue Stream Optimization", 
    priority: "millionaire", 
    status: "optimizing", 
    money_value: 850000, 
    deadline: "2024-12-20", 
    category: "Financial Engineering",
    controversy_required: false
  },
  { 
    id: "scale_operations", 
    title: "Scale Elite Operations", 
    priority: "entrepreneur", 
    status: "dominated", 
    money_value: 450000, 
    deadline: "2024-12-10", 
    category: "Operational Excellence",
    controversy_required: true
  }
];

const productivityCheats: ProductivityCheat[] = [
  { 
    id: "revenue_acceleration", 
    type: "revenue", 
    title: "Revenue Acceleration Window Detected", 
    description: "AI analysis shows 67% higher conversion rates during 10 AM - 12 PM window. Controversial monitoring reveals your peak money-making hours.", 
    money_impact: 127000, 
    confidence: 94, 
    controversy_level: 85,
    implementation_time: "Immediate"
  },
  { 
    id: "competitor_intelligence", 
    type: "competition", 
    title: "Competitor Weakness Identified", 
    description: "Surveillance AI detected competitor scheduling patterns. Exploit their 2-4 PM productivity gap for maximum market advantage.", 
    money_impact: 234000, 
    confidence: 87, 
    controversy_level: 92,
    implementation_time: "Within 48 hours"
  },
  { 
    id: "efficiency_multiplier", 
    type: "efficiency", 
    title: "Elite Productivity Pattern Unlocked", 
    description: "Controversial workflow monitoring reveals 47% efficiency gain opportunity through task batching and interruption elimination.", 
    money_impact: 89000, 
    confidence: 91, 
    controversy_level: 78,
    implementation_time: "This week"
  }
];

// Enhanced Components with Controversial Positioning

const EliteMetricCard: React.FC<{ metric: CheatCalMetric }> = ({ metric }) => {
  const isPositive = metric.trend === "up";
  const progressPercentage = metric.target ? (metric.value / metric.target) * 100 : 0;
  
  // Controversy level styling
  const controversyStyle = {
    standard: "border-blue-500 /* TODO: Use semantic token *//30 bg-primary/5",
    moderate: "border-orange-500/30 bg-orange-500/5", 
    high: "border-red-500 /* TODO: Use semantic token *//30 bg-red-500 /* TODO: Use semantic token *//5"
  }[metric.controversy_level];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -2 }}
      className={cn(
        "backdrop-blur-sm border rounded-xl p-6 hover:shadow-xl transition-all duration-300",
        controversyStyle
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm text-muted-foreground font-medium">{metric.label}</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-foreground tabular-nums">
              {metric.id === "money_velocity" ? `$${(metric.value / 1000).toFixed(0)}K` : 
               metric.id === "roi_hacking" ? `${metric.value.toFixed(1)}%` : 
               `${metric.value.toFixed(1)}%`}
            </span>
            <div className={cn(
              "flex items-center gap-1 text-sm font-medium",
              isPositive ? "text-green-600 /* TODO: Use semantic token */ dark:text-green-400 /* TODO: Use semantic token */" : "text-red-600 /* TODO: Use semantic token */ dark:text-red-400 /* TODO: Use semantic token */"
            )}>
              {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {Math.abs(metric.change)}%
            </div>
          </div>
          <div className="text-xs text-green-400 /* TODO: Use semantic token */ font-medium mt-1">
            💰 ${(metric.money_impact / 1000).toFixed(0)}K impact
          </div>
        </div>
        
        {/* Controversial status indicator */}
        <div className="flex flex-col items-center gap-2">
          {metric.controversy_level === "high" && <Eye className="w-5 h-5 text-red-500 /* TODO: Use semantic token */" />}
          {metric.controversy_level === "moderate" && <Target className="w-5 h-5 text-orange-500" />}  
          {metric.controversy_level === "standard" && <Zap className="w-5 h-5 text-primary" />}
          
          <div className="text-xs text-center text-muted-foreground">
            {metric.controversy_level === "high" ? "👁️ Monitored" :
             metric.controversy_level === "moderate" ? "⚡ Enhanced" : 
             "🎯 Standard"}
          </div>
        </div>
      </div>
      
      {metric.target && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Elite Target Progress</span>
            <span>{progressPercentage.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(progressPercentage, 100)}%` }}
              transition={{ duration: 1, delay: 0.5, type: "spring", stiffness: 100 }}
              className={cn(
                "h-2 rounded-full",
                progressPercentage >= 90 ? "bg-green-500 /* TODO: Use semantic token */" : 
                progressPercentage >= 70 ? "bg-yellow-500 /* TODO: Use semantic token */" : "bg-red-500 /* TODO: Use semantic token */"
              )}
            />
          </div>
        </div>
      )}
    </motion.div>
  );
};

const EliteTaskCard: React.FC<{ task: EliteTask }> = ({ task }) => {
  const priorityConfig = {
    billionaire: { color: "bg-yellow-100 /* TODO: Use semantic token */ text-yellow-800 /* TODO: Use semantic token */ dark:bg-yellow-900 /* TODO: Use semantic token *//30 dark:text-yellow-300 /* TODO: Use semantic token */", icon: "👑" },
    millionaire: { color: "bg-green-100 /* TODO: Use semantic token */ text-green-800 /* TODO: Use semantic token */ dark:bg-green-900 /* TODO: Use semantic token *//30 dark:text-green-300 /* TODO: Use semantic token */", icon: "💎" },
    entrepreneur: { color: "bg-blue-100 /* TODO: Use semantic token */ text-blue-800 /* TODO: Use semantic token */ dark:bg-blue-900 /* TODO: Use semantic token *//30 dark:text-blue-300 /* TODO: Use semantic token */", icon: "⚡" }
  };

  const statusConfig = {
    cheating: { color: "text-red-400 /* TODO: Use semantic token */", icon: <Skull className="w-4 h-4" />, label: "AI Cheating" },
    optimizing: { color: "text-orange-400", icon: <Brain className="w-4 h-4" />, label: "Optimizing" },
    dominated: { color: "text-green-400 /* TODO: Use semantic token */", icon: <Trophy className="w-4 h-4" />, label: "Dominated" }
  };

  const priority = priorityConfig[task.priority];
  const status = statusConfig[task.status];

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ scale: 1.01, x: 2 }}
      className={cn(
        "backdrop-blur-sm border rounded-lg p-5 hover:shadow-lg transition-all duration-200",
        task.controversy_required ? "border-red-500 /* TODO: Use semantic token *//30 bg-red-500 /* TODO: Use semantic token *//5" : "border-border/30 bg-card/30"
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">{priority.icon}</span>
            <h4 className="font-semibold text-foreground text-sm">{task.title}</h4>
            {task.controversy_required && <Eye className="w-4 h-4 text-red-500 /* TODO: Use semantic token */" />}
          </div>
          <p className="text-xs text-muted-foreground">{task.category}</p>
        </div>
        
        <div className="flex flex-col items-end gap-2">
          <span className={cn("px-3 py-1 rounded-full text-xs font-medium", priority.color)}>
            {task.priority}
          </span>
          <div className={cn("flex items-center gap-1 text-xs", status.color)}>
            {status.icon}
            {status.label}
          </div>
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="text-sm">
          <span className="font-bold text-green-400 /* TODO: Use semantic token */ tabular-nums">
            ${(task.money_value / 1000).toFixed(0)}K
          </span>
          <span className="text-muted-foreground ml-1">money value</span>
        </div>
        <div className="text-xs text-muted-foreground">
          Due {new Date(task.deadline).toLocaleDateString()}
        </div>
      </div>
      
      {task.controversy_required && (
        <div className="mt-3 p-2 bg-red-500 /* TODO: Use semantic token *//10 border border-red-500 /* TODO: Use semantic token *//20 rounded text-xs text-red-300 /* TODO: Use semantic token */">
          ⚠️ Requires controversial methods for optimal results
        </div>
      )}
    </motion.div>
  );
};

const ProductivityCheatCard: React.FC<{ cheat: ProductivityCheat }> = ({ cheat }) => {
  const typeConfig = {
    revenue: { icon: DollarSign, color: "text-green-600 /* TODO: Use semantic token */ dark:text-green-400 /* TODO: Use semantic token */", bg: "bg-green-100 /* TODO: Use semantic token */ dark:bg-green-900 /* TODO: Use semantic token *//30" },
    efficiency: { icon: Zap, color: "text-blue-600 /* TODO: Use semantic token */ dark:text-blue-400 /* TODO: Use semantic token */", bg: "bg-blue-100 /* TODO: Use semantic token */ dark:bg-blue-900 /* TODO: Use semantic token *//30" },
    competition: { icon: Target, color: "text-red-600 /* TODO: Use semantic token */ dark:text-red-400 /* TODO: Use semantic token */", bg: "bg-red-100 /* TODO: Use semantic token */ dark:bg-red-900 /* TODO: Use semantic token *//30" },
    optimization: { icon: Brain, color: "text-purple-600 /* TODO: Use semantic token */ dark:text-purple-400 /* TODO: Use semantic token */", bg: "bg-purple-100 /* TODO: Use semantic token */ dark:bg-purple-900 /* TODO: Use semantic token *//30" }
  };

  const config = typeConfig[cheat.type];
  const IconComponent = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02, rotateY: 2 }}
      className="backdrop-blur-sm border border-border/40 rounded-xl p-6 hover:shadow-xl transition-all duration-300 bg-card/40"
    >
      <div className="flex items-start gap-4">
        <div className={cn("p-3 rounded-xl", config.bg)}>
          <IconComponent className={cn("w-6 h-6", config.color)} />
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-semibold text-foreground">{cheat.title}</h4>
            {cheat.controversy_level >= 80 && (
              <div className="flex items-center gap-1 text-xs text-red-400 /* TODO: Use semantic token */">
                <Skull className="w-3 h-3" />
                High Controversy
              </div>
            )}
          </div>
          
          <p className="text-sm text-muted-foreground mb-4">{cheat.description}</p>
          
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-green-400 /* TODO: Use semantic token */ tabular-nums">
                ${(cheat.money_impact / 1000).toFixed(0)}K
              </div>
              <div className="text-xs text-muted-foreground">Money Impact</div>
            </div>
            
            <div>
              <div className="text-lg font-bold text-blue-400 /* TODO: Use semantic token */ tabular-nums">
                {cheat.confidence}%
              </div>
              <div className="text-xs text-muted-foreground">AI Confidence</div>
            </div>
            
            <div>
              <div className="text-lg font-bold text-orange-400">
                {cheat.controversy_level}%
              </div>
              <div className="text-xs text-muted-foreground">Controversy</div>
            </div>
          </div>
          
          <div className="mt-4 flex justify-between items-center">
            <div className="text-xs text-muted-foreground">
              Implementation: {cheat.implementation_time}
            </div>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Execute Cheat
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Main Layout Component
export const CheatCalMainLayout: React.FC = () => {
  const [activeView, setActiveView] = useState<"dashboard" | "cheats" | "elite-tasks">("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [controversyMode, setControversyMode] = useState<"stealth" | "aggressive" | "maximum">("aggressive");

  // Real-time controversial metrics updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate real-time money-focused updates
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const filteredTasks = useMemo(() => {
    return eliteTasks.filter(task => 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  return (
    <div className="min-h-screen bg-background">
      {/* Sophisticated Controversial Header */}
      <header className="border-b border-border/50 bg-card/30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            {/* Controversial Branding */}
            <div className="flex items-center gap-6">
              <motion.div 
                className="flex items-center gap-3"
                whileHover={{ scale: 1.05 }}
              >
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 via-orange-500 to-yellow-500 rounded-xl flex items-center justify-center relative">
                  <Skull className="w-7 h-7 text-white" />
                  <div className="absolute -top-1 -right-1">
                    <Crown className="w-4 h-4 text-yellow-400 /* TODO: Use semantic token */" />
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">CheatCal</h1>
                  <p className="text-sm text-muted-foreground">Elite Productivity Command Center</p>
                </div>
              </motion.div>
              
              {/* Controversial Status Indicators */}
              <div className="flex items-center gap-3">
                <motion.div 
                  className="flex items-center gap-2 px-3 py-2 bg-red-500 /* TODO: Use semantic token *//10 border border-red-500 /* TODO: Use semantic token *//30 rounded-lg"
                  animate={{ opacity: [1, 0.7, 1] }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                >
                  <Eye className="w-4 h-4 text-red-400 /* TODO: Use semantic token */" />
                  <span className="text-sm font-medium text-red-400 /* TODO: Use semantic token */">Monitoring Active</span>
                </motion.div>
                
                <div className="flex items-center gap-2 px-3 py-2 bg-green-500 /* TODO: Use semantic token *//10 border border-green-500 /* TODO: Use semantic token *//30 rounded-lg">
                  <DollarSign className="w-4 h-4 text-green-400 /* TODO: Use semantic token */" />
                  <span className="text-sm font-medium text-green-400 /* TODO: Use semantic token */ tabular-nums">
                    ${(eliteMetrics.reduce((sum, m) => sum + m.money_impact, 0) / 1000).toFixed(0)}K Today
                  </span>
                </div>
              </div>
            </div>

            {/* Elite Controls */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search elite opportunities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 w-64"
                />
              </div>
              
              <button className="p-2 hover:bg-muted rounded-lg transition-colors">
                <Bell className="w-5 h-5 text-muted-foreground" />
              </button>
              
              <button className="p-2 hover:bg-muted rounded-lg transition-colors">
                <Settings className="w-5 h-5 text-muted-foreground" />
              </button>

              {/* Elite Profile */}
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 bg-gradient-to-br from-primary to-primary/60 rounded-xl flex items-center justify-center">
                  <span className="text-sm font-bold text-primary-foreground">E</span>
                </div>
                <div className="text-xs">
                  <div className="font-medium text-foreground">Elite Member</div>
                  <div className="text-muted-foreground">Money-Getter</div>
                </div>
              </div>
            </div>
          </div>

          {/* Sophisticated Navigation */}
          <nav className="flex items-center gap-2 mt-6">
            {[
              { id: "dashboard", label: "💰 Elite Overview", icon: BarChart3 },
              { id: "cheats", label: "🧠 AI Cheats", icon: Brain },
              { id: "elite-tasks", label: "👑 Elite Tasks", icon: Briefcase }
            ].map((item) => (
              <motion.button
                key={item.id}
                onClick={() => setActiveView(item.id as any)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  "flex items-center gap-3 px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                  activeView === item.id
                    ? "bg-primary text-primary-foreground shadow-lg"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </motion.button>
            ))}
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          {activeView === "dashboard" && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Controversial Hero Section */}
              <div className="text-center space-y-6">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6 }}
                >
                  <h2 className="text-4xl font-bold text-foreground mb-3">
                    💀 Elite Productivity Dashboard 💰
                  </h2>
                  <div className="text-xl text-muted-foreground max-w-3xl mx-auto">
                    For professionals who refuse mediocrity and embrace controversial methods for extraordinary results.
                    <div className="text-primary font-semibold mt-2">
                      "Privacy is for people who don't make serious money."
                    </div>
                  </div>
                </motion.div>
                
                {/* Controversy Mode Selector */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex items-center justify-center gap-2"
                >
                  {[
                    { mode: "stealth", label: "👻 Stealth", desc: "Professional discretion" },
                    { mode: "aggressive", label: "🔥 Aggressive", desc: "Calculated controversy" },
                    { mode: "maximum", label: "💀 Maximum", desc: "Full surveillance power" }
                  ].map((option) => (
                    <button
                      key={option.mode}
                      onClick={() => setControversyMode(option.mode as any)}
                      className={cn(
                        "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                        controversyMode === option.mode
                          ? "bg-red-500 /* TODO: Use semantic token */ text-white shadow-lg"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Elite Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {eliteMetrics.map((metric, index) => (
                  <motion.div
                    key={metric.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <EliteMetricCard metric={metric} />
                  </motion.div>
                ))}
              </div>

              {/* ASCII Architecture Display */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-card/20 backdrop-blur-sm border border-border/30 rounded-xl p-6"
              >
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Grid3X3 className="w-5 h-5" />
                  CheatCal Architecture (Elite Design)
                </h3>
                <pre className="text-xs text-muted-foreground font-mono overflow-x-auto leading-relaxed">
                  {CHEATCAL_LAYOUT_ARCHITECTURE}
                </pre>
              </motion.div>
            </motion.div>
          )}

          {activeView === "cheats" && (
            <motion.div
              key="cheats"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">🧠 AI Productivity Cheats</h2>
                  <p className="text-muted-foreground">Controversial methods that deliver extraordinary results</p>
                </div>
                <div className="text-sm text-green-400 /* TODO: Use semantic token */ font-medium">
                  💰 Total Impact: ${(productivityCheats.reduce((sum, c) => sum + c.money_impact, 0) / 1000).toFixed(0)}K
                </div>
              </div>

              <div className="space-y-4">
                {productivityCheats.map((cheat, index) => (
                  <motion.div
                    key={cheat.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <ProductivityCheatCard cheat={cheat} />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {activeView === "elite-tasks" && (
            <motion.div
              key="elite-tasks"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">👑 Elite Money-Making Tasks</h2>
                  <p className="text-muted-foreground">High-value objectives for serious money-getters</p>
                </div>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Billionaire Task
                </motion.button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredTasks.map((task, index) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <EliteTaskCard task={task} />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Controversial Footer */}
      <footer className="border-t border-border/50 bg-card/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="text-center">
            <div className="text-sm text-muted-foreground mb-1">
              ⚠️ "This AI monitors everything to help you make more money"
            </div>
            <div className="text-xs text-red-400 /* TODO: Use semantic token */">
              Privacy advocates will hate it. Elite professionals will love it. Choose your side.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CheatCalMainLayout;