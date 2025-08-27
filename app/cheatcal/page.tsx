/**
 * CheatCal Main Application
 * 
 * The most controversial productivity application ever built.
 * Combines sophisticated design with polarizing positioning for
 * money-focused professionals who want results over reputation.
 * 
 * "The AI That Cheats At Productivity For People Who Get Money"
 * 
 * @version 1.0.0 (Revolutionary Release)
 * @author CheatCal Team
 */

'use client';

import dynamic from 'next/dynamic';
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Skull, 
  Eye, 
  Zap, 
  TrendingUp,
  AlertTriangle,
  DollarSign,
  Target,
  Crown,
  Flame,
  Shield,
  Users,
  Brain,
  Cpu,
  Activity,
  BarChart3,
  Settings
} from 'lucide-react';

// Dynamic imports for performance
const CheatCalViralInterface = dynamic(() => import('@/components/viral/CheatCalViralInterface'), {
  ssr: false,
  loading: () => <div className="p-8 text-center">Loading viral systems...</div>
});

const QuantumCalendarCore = dynamic(() => import('@/components/calendar/quantum/QuantumCalendarCore'), {
  ssr: false, 
  loading: () => <div className="p-8 text-center">Loading productivity cheating interface...</div>
});

// Integration imports
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

// ASCII Application Architecture
const CHEATCAL_APP_ARCHITECTURE = `
CHEATCAL MAIN APPLICATION ARCHITECTURE
═════════════════════════════════════════════════════════════════

"THE AI THAT CHEATS AT PRODUCTIVITY FOR PEOPLE WHO GET MONEY"
┌─────────────────────────────────────────────────────────────────┐
│                   CONTROVERSIAL PRODUCTIVITY HUB                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ LAYER 1: SOPHISTICATED CONTROVERSIAL INTERFACE                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 🎨 Design: Sunsama sophistication + Tate controversy       │ │
│ │ ⚡ Performance: 60+ FPS + enterprise-grade responsiveness  │ │
│ │ 👁️ Overlay: Transparent monitoring across all applications  │ │
│ │ 💰 Focus: Money-making optimization and value creation     │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                              │                                 │
│                              ▼                                 │
│ LAYER 2: QUANTUM CALENDAR INTEGRATION                         │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 📅 Foundation: 133,222+ lines of proven calendar tech     │ │
│ │ 🧠 AI Enhancement: Conflict detection + optimization       │ │
│ │ 🔄 Real-time: Multi-user coordination and collaboration    │ │
│ │ 📊 Analytics: Value creation tracking and optimization     │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                              │                                 │
│                              ▼                                 │
│ LAYER 3: COMPUTER VISION + CONTEXT ENGINE                     │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 👁️ OpenCV: Screen analysis + workflow optimization         │ │
│ │ 🤖 Multi-Modal: Visual + audio + calendar context fusion  │ │
│ │ ⚡ Real-time: Instant suggestions + invisible optimization │ │
│ │ 💡 Predictive: Anticipate needs before user realizes them  │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                              │                                 │
│                              ▼                                 │
│ LAYER 4: VIRAL MARKETPLACE COMMUNITY                          │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 🎓 University: Community education + controversial growth  │ │
│ │ 🎭 Marketplace: Service providers + coordination specialists│ │
│ │ 📱 Viral Engine: Content creation + controversy amplification│ │
│ │ 💰 Revenue: Community + marketplace + viral monetization   │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘

TARGET USER: Money-focused professionals who embrace controversy for results
VALUE PROP: Sophisticated productivity cheating for extraordinary financial outcomes
`;

interface CheatCalUser {
  id: string;
  profile_type: 'course_creator' | 'agency_owner' | 'family_office' | 'entrepreneur';
  controversy_tolerance: 'minimal' | 'moderate' | 'maximum' | 'chaos_mode';
  money_focus_level: number; // 1-100 scale
  privacy_vs_profit_preference: number; // 0 = privacy, 100 = profit
  current_coordination_value: number; // $ value being optimized
}

interface ProductivityCheatMetrics {
  daily_value_created: number;
  coordination_optimizations_active: number;
  time_saved_hours: number;
  revenue_impact_tracked: number;
  controversy_engagement: number;
  viral_content_generated: number;
}

export default function CheatCalMainApplication() {
  // Core controversial state
  const [activeMode, setActiveMode] = useState<'stealth' | 'cheat' | 'chaos'>('cheat');
  const [monitoringActive, setMonitoringActive] = useState(true);
  const [controversyLevel, setControversyLevel] = useState(85);
  
  // Money-focused metrics
  const [productivityMetrics, setProductivityMetrics] = useState<ProductivityCheatMetrics>({
    daily_value_created: 3247,
    coordination_optimizations_active: 7,
    time_saved_hours: 2.7,
    revenue_impact_tracked: 12847,
    controversy_engagement: 94,
    viral_content_generated: 23
  });

  // User profile simulation
  const [userProfile] = useState<CheatCalUser>({
    id: 'demo_money_getter',
    profile_type: 'course_creator',
    controversy_tolerance: 'maximum',
    money_focus_level: 94,
    privacy_vs_profit_preference: 87, // Heavy profit focus
    current_coordination_value: 45000
  });

  // Real-time metrics updates (simulated)
  useEffect(() => {
    const interval = setInterval(() => {
      setProductivityMetrics(prev => ({
        ...prev,
        daily_value_created: prev.daily_value_created + Math.floor(Math.random() * 50),
        revenue_impact_tracked: prev.revenue_impact_tracked + Math.floor(Math.random() * 100)
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Handle controversial mode switching
  const handleModeChange = useCallback(async (newMode: typeof activeMode) => {
    setActiveMode(newMode);
    
    // Log controversial mode selection
    logger.info("💀 CheatCal mode changed", { 
      new_mode: newMode, 
      controversy_level: controversyLevel,
      user_money_focus: userProfile.money_focus_level
    });
  }, [controversyLevel, userProfile]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white">
      <div className="container mx-auto p-6 space-y-8">
        
        {/* Controversial Header */}
        <motion.header
          className="text-center space-y-6"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="flex items-center justify-center space-x-6">
            <motion.div
              className="relative"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Skull className="w-16 h-16 text-red-500" />
              <div className="absolute -top-2 -right-2">
                <Flame className="w-6 h-6 text-orange-500" />
              </div>
            </motion.div>
            
            <div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 bg-clip-text text-transparent">
                CheatCal
              </h1>
              <div className="text-sm text-gray-400 font-mono">
                The AI That Cheats At Productivity
              </div>
            </div>
            
            <Crown className="w-16 h-16 text-yellow-500" />
          </div>

          <motion.div
            className="max-w-4xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <div className="text-2xl font-bold text-red-400 mb-3">
              💰 "For People Who Get Money" 💰
            </div>
            <div className="text-lg text-gray-300">
              Real hustlers • Elite entrepreneurs • Money-focused professionals
            </div>
            <div className="text-md text-yellow-400 mt-2">
              "Stop working harder, start coordinating smarter, get more money"
            </div>
          </motion.div>

          {/* Controversial Status Bar */}
          <motion.div
            className="flex items-center justify-center space-x-8"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
          >
            <Badge variant="destructive" className="bg-red-600 px-4 py-2">
              <Eye className="w-4 h-4 mr-2" />
              Monitoring: {monitoringActive ? 'ACTIVE' : 'PAUSED'}
            </Badge>
            
            <Badge variant="secondary" className="bg-green-600 px-4 py-2 text-white">
              <DollarSign className="w-4 h-4 mr-2" />
              Value Today: ${productivityMetrics.daily_value_created.toLocaleString()}
            </Badge>
            
            <Badge variant="outline" className="bg-orange-600 text-white border-orange-600 px-4 py-2">
              <TrendingUp className="w-4 h-4 mr-2" />
              Controversy: {controversyLevel}%
            </Badge>
          </motion.div>
        </motion.header>

        {/* ASCII Architecture Display */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Card className="bg-gray-900 border-green-500">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-green-400">
                <Brain className="w-5 h-5" />
                <span>CheatCal Architecture (Money-Focused Design)</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs text-green-400 font-mono overflow-x-auto leading-tight">
                {CHEATCAL_APP_ARCHITECTURE}
              </pre>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Interface Tabs */}
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-gray-800 border border-gray-600">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-red-600">
              💀 Dashboard
            </TabsTrigger>
            <TabsTrigger value="calendar" className="data-[state=active]:bg-green-600">
              📅 Cheat Calendar  
            </TabsTrigger>
            <TabsTrigger value="marketplace" className="data-[state=active]:bg-orange-600">
              🎭 Marketplace
            </TabsTrigger>
            <TabsTrigger value="university" className="data-[state=active]:bg-purple-600">
              🎓 University
            </TabsTrigger>
            <TabsTrigger value="viral" className="data-[state=active]:bg-yellow-600">
              🔥 Viral
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab - Main Productivity Cheating Interface */}
          <TabsContent value="dashboard" className="space-y-6">
            
            {/* Money-Focused Metrics Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <motion.div whileHover={{ scale: 1.05 }}>
                <Card className="bg-gradient-to-br from-green-600/20 to-green-800/20 border-green-500">
                  <CardContent className="p-6 text-center">
                    <DollarSign className="w-8 h-8 text-green-400 mx-auto mb-3" />
                    <div className="text-3xl font-bold text-green-400">
                      ${productivityMetrics.daily_value_created.toLocaleString()}
                    </div>
                    <div className="text-sm text-green-300">Value Cheated Today</div>
                    <div className="text-xs text-gray-400 mt-2">
                      🎯 Target: ${(productivityMetrics.daily_value_created * 1.3).toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div whileHover={{ scale: 1.05 }}>
                <Card className="bg-gradient-to-br from-orange-600/20 to-orange-800/20 border-orange-500">
                  <CardContent className="p-6 text-center">
                    <Zap className="w-8 h-8 text-orange-400 mx-auto mb-3" />
                    <div className="text-3xl font-bold text-orange-400">
                      {productivityMetrics.coordination_optimizations_active}
                    </div>
                    <div className="text-sm text-orange-300">Active Cheats</div>
                    <div className="text-xs text-gray-400 mt-2">
                      ⚡ Optimizing your money-making workflow
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div whileHover={{ scale: 1.05 }}>
                <Card className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 border-blue-500">
                  <CardContent className="p-6 text-center">
                    <Target className="w-8 h-8 text-blue-400 mx-auto mb-3" />
                    <div className="text-3xl font-bold text-blue-400">
                      {productivityMetrics.time_saved_hours.toFixed(1)}h
                    </div>
                    <div className="text-sm text-blue-300">Time Saved Today</div>
                    <div className="text-xs text-gray-400 mt-2">
                      💰 = ${(productivityMetrics.time_saved_hours * 500).toLocaleString()} value
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div whileHover={{ scale: 1.05 }}>
                <Card className="bg-gradient-to-br from-red-600/20 to-red-800/20 border-red-500">
                  <CardContent className="p-6 text-center">
                    <Flame className="w-8 h-8 text-red-400 mx-auto mb-3" />
                    <div className="text-3xl font-bold text-red-400">
                      {productivityMetrics.controversy_engagement}%
                    </div>
                    <div className="text-sm text-red-300">Controversy Score</div>
                    <div className="text-xs text-gray-400 mt-2">
                      🔥 Love it or hate it - never ignored
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Live Productivity Cheating Status */}
            <Card className="bg-gray-900 border-yellow-500">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-yellow-400">
                  <Activity className="w-5 h-5" />
                  <span>Live Productivity Cheating Status</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    {
                      action: 'Email Timing Optimization',
                      status: 'ACTIVE',
                      impact: '$347 projected value',
                      controversy: 'Monitoring email patterns for timing optimization'
                    },
                    {
                      action: 'Meeting Coordination Automation', 
                      status: 'RUNNING',
                      impact: '$1,247 coordination value',
                      controversy: 'AI analyzing calendar conflicts and participant patterns'
                    },
                    {
                      action: 'Workflow Analysis & Batching',
                      status: 'PROCESSING',
                      impact: '$456 efficiency gains',
                      controversy: 'Computer vision monitoring productivity patterns'
                    },
                    {
                      action: 'Revenue Opportunity Tracking',
                      status: 'LIVE',
                      impact: '$2,847 opportunities identified', 
                      controversy: 'Cross-platform analysis of money-making activities'
                    }
                  ].map((cheat, index) => (
                    <motion.div
                      key={cheat.action}
                      className="flex items-center justify-between p-4 rounded-lg bg-gray-800 border border-yellow-500/30"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.02, borderColor: '#eab308' }}
                    >
                      <div className="flex-1">
                        <div className="font-semibold text-yellow-300">{cheat.action}</div>
                        <div className="text-sm text-gray-400">{cheat.controversy}</div>
                      </div>
                      
                      <div className="text-right space-y-1">
                        <Badge className={cn(
                          'border-0',
                          cheat.status === 'ACTIVE' ? 'bg-red-600' :
                          cheat.status === 'RUNNING' ? 'bg-green-600' :
                          cheat.status === 'PROCESSING' ? 'bg-orange-600' : 'bg-blue-600'
                        )}>
                          {cheat.status}
                        </Badge>
                        <div className="text-sm font-medium text-green-400">{cheat.impact}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Controversial Control Panel */}
                <div className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-red-300">⚠️ Controversial Monitoring Controls</h4>
                    <Badge variant="destructive">
                      👁️ WATCHING EVERYTHING
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm text-gray-300">Privacy vs Profit</label>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-red-400">Privacy</span>
                        <div className="flex-1 h-2 bg-gray-700 rounded">
                          <div 
                            className="h-full bg-gradient-to-r from-red-500 to-green-500 rounded"
                            style={{ width: `${userProfile.privacy_vs_profit_preference}%` }}
                          />
                        </div>
                        <span className="text-xs text-green-400">Profit</span>
                      </div>
                      <div className="text-xs text-yellow-400">
                        💰 {userProfile.privacy_vs_profit_preference}% profit-focused
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm text-gray-300">Controversy Tolerance</label>
                      <div className="text-center">
                        <div className="text-lg font-bold text-red-400">{controversyLevel}%</div>
                        <div className="text-xs text-gray-400">
                          {controversyLevel >= 90 ? '💀 CHAOS MODE' :
                           controversyLevel >= 70 ? '🔥 CONTROVERSIAL' : 
                           '⚡ MODERATE EDGE'}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm text-gray-300">Money Focus Level</label>
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-400">{userProfile.money_focus_level}%</div>
                        <div className="text-xs text-gray-400">
                          💎 TRUE MONEY-GETTER
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex space-x-3">
                    <Button 
                      variant="destructive"
                      size="sm"
                      className="bg-red-600 hover:bg-red-700"
                      onClick={() => handleModeChange('chaos')}
                    >
                      💀 Maximum Chaos Mode
                    </Button>
                    
                    <Button 
                      variant="outline"
                      size="sm"
                      className="border-yellow-500 text-yellow-400 hover:bg-yellow-500/10"
                    >
                      🎓 Join CheatCal University
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="border-green-500 text-green-400 hover:bg-green-500/10"
                    >
                      💰 Find Coordination Cheater
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Calendar Tab - Sophisticated Productivity Interface */}
          <TabsContent value="calendar" className="space-y-6">
            <Card className="bg-gray-900 border-blue-500 min-h-[600px]">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-blue-400">
                  <Target className="w-5 h-5" />
                  <span>Quantum Calendar - Productivity Cheating Interface</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {/* Integration with existing quantum calendar */}
                <QuantumCalendarCore
                  year={2025}
                  events={[]} // Would integrate with real events
                  enableQuantumFeatures={true}
                  theme="timepage"
                  animationIntensity="delightful"
                  variant="quantum"
                  className="w-full h-full"
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Marketplace Tab */}
          <TabsContent value="marketplace" className="space-y-6">
            <Card className="bg-gray-900 border-orange-500">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-orange-400">
                  <Users className="w-5 h-5" />
                  <span>Coordination Cheating Marketplace</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center p-8">
                  <Skull className="w-16 h-16 text-orange-500 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-orange-400 mb-2">
                    Find Your Coordination Cheater
                  </h3>
                  <p className="text-gray-300 mb-6">
                    Professional coordination specialists who help money-focused  
                    professionals optimize their workflows for maximum revenue.
                  </p>
                  <Button className="bg-orange-600 hover:bg-orange-700" size="lg">
                    <Crown className="w-5 h-5 mr-2" />
                    Browse Elite Coordinators
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* University Tab */}
          <TabsContent value="university" className="space-y-6">
            <Card className="bg-gray-900 border-purple-500">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-purple-400">
                  <Crown className="w-5 h-5" />
                  <span>CheatCal University - Get Out The Productivity Matrix</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center p-8">
                  <motion.div
                    className="mb-6"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Brain className="w-20 h-20 text-purple-500 mx-auto mb-4" />
                    <h3 className="text-3xl font-bold text-purple-400 mb-2">
                      💰 "For People Who Get Money" 💰
                    </h3>
                    <p className="text-gray-300 text-lg mb-4">
                      Join 100K+ hustlers who chose controversial productivity optimization over traditional methods
                    </p>
                    <div className="text-yellow-400 font-semibold">
                      "Stop being poor - Learn billionaire coordination secrets"
                    </div>
                  </motion.div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <Card className="bg-purple-900/30 border-purple-500/50">
                      <CardContent className="p-4">
                        <h4 className="font-bold text-purple-300 mb-2">💎 What You Get:</h4>
                        <ul className="text-sm text-gray-300 space-y-1 text-left">
                          <li>• 5 money-focused coordination schools</li>
                          <li>• AI productivity optimization tools</li>
                          <li>• Elite money-getter community access</li>
                          <li>• Controversial methods that actually work</li>
                          <li>• Success story viral content opportunities</li>
                        </ul>
                      </CardContent>
                    </Card>

                    <Card className="bg-green-900/30 border-green-500/50">
                      <CardContent className="p-4">
                        <h4 className="font-bold text-green-300 mb-2">🎯 Who This Is For:</h4>
                        <ul className="text-sm text-gray-300 space-y-1 text-left">
                          <li>• Course creators wanting $100K+ launches</li>
                          <li>• Agency owners scaling to 8+ figures</li>
                          <li>• Entrepreneurs who prioritize results</li>
                          <li>• Anyone who wants money over reputation</li>
                          <li>• Hustlers ready for controversial methods</li>
                        </ul>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-4">
                    <div className="text-2xl font-bold text-green-400">
                      $49/month - Join The Money-Getters
                    </div>
                    <Button 
                      size="lg"
                      className="bg-gradient-to-r from-red-600 via-orange-600 to-yellow-600 hover:from-red-700 hover:via-orange-700 hover:to-yellow-700 text-white font-bold px-8 py-4"
                    >
                      <Skull className="w-6 h-6 mr-3" />
                      GET OUT THE PRODUCTIVITY MATRIX
                      <Crown className="w-6 h-6 ml-3" />
                    </Button>
                    <div className="text-xs text-gray-400">
                      💀 "Privacy is for people who don't make serious money"
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Viral Tab */}
          <TabsContent value="viral" className="space-y-6">
            <CheatCalViralInterface />
          </TabsContent>
        </Tabs>

        {/* Controversial Footer */}
        <motion.footer
          className="text-center p-6 bg-gray-900 border border-red-500/30 rounded-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          <div className="text-red-400 font-bold mb-2">
            ⚠️ "This AI watches everything you do to help you make more money"
          </div>
          <div className="text-gray-400 text-sm">
            Privacy advocates will hate it. Money-getters will love it. Choose your side.
          </div>
          <div className="text-yellow-400 text-xs mt-2">
            💰 "Results over reputation. Money over conventional methods. Success over safety."
          </div>
        </motion.footer>

      </div>
    </div>
  );
}