/**
 * Multi-Modal Coordinator - Revolutionary AI Data Fusion Engine
 *
 * Coordinates and fuses data from computer vision, voice processing, and contextual
 * analysis to generate sophisticated productivity insights and revenue optimization
 * opportunities through controversial but powerful multi-modal AI.
 *
 * Core Controversy: "The AI that connects everything you do"
 * Value Proposition: Invisible coordination through multi-modal intelligence fusion
 *
 * @version Command Center Phase 3.0 (Revolutionary Enhancement)
 * @author Command Center Multi-Modal Coordination Team
 */

import { logger } from '@/lib/utils/logger';

// ==========================================
// Types & Interfaces
// ==========================================

export interface MultiModalData {
  vision?: VisionModalData;
  voice?: VoiceModalData;
  context?: ContextualModalData;
  timestamp: Date;
  fusion_confidence: number;
}

export interface VisionModalData {
  application: string;
  context_type: 'email' | 'calendar' | 'productivity' | 'communication' | 'research';
  text_content: string;
  ui_elements: any[];
  workflow_state: any;
  optimization_opportunities: any[];
  confidence: number;
}

export interface VoiceModalData {
  transcription: string;
  confidence: number;
  provider: 'whisper' | 'deepgram' | 'native';
  commands_detected: VoiceCommand[];
  intent_analysis: IntentAnalysis;
}

export interface ContextualModalData {
  time_context: TimeContext;
  calendar_state: CalendarState;
  productivity_patterns: ProductivityPatterns;
  user_behavior: UserBehaviorContext;
}

export interface VoiceCommand {
  command: string;
  parameters: Record<string, any>;
  confidence: number;
  intent: string;
}

export interface IntentAnalysis {
  primary_intent: 'create' | 'schedule' | 'optimize' | 'analyze' | 'coordinate';
  secondary_intents: string[];
  action_items: ActionItem[];
  urgency_level: 'low' | 'medium' | 'high' | 'critical';
}

export interface ActionItem {
  action: string;
  priority: number;
  estimated_value: number;
  implementation_effort: 'minimal' | 'moderate' | 'significant';
}

export interface TimeContext {
  current_hour: number;
  work_period: 'early' | 'morning' | 'midday' | 'afternoon' | 'evening' | 'late';
  productivity_window: 'peak' | 'moderate' | 'low';
  available_time_slots: TimeSlot[];
}

export interface CalendarState {
  active_events: number;
  upcoming_conflicts: number;
  free_time_blocks: TimeSlot[];
  coordination_opportunities: CoordinationOpportunity[];
}

export interface ProductivityPatterns {
  current_level: 'low' | 'medium' | 'high' | 'peak';
  trend: 'declining' | 'stable' | 'improving' | 'optimal';
  focus_state: 'distracted' | 'focused' | 'deep_work' | 'coordination_mode';
  efficiency_score: number;
}

export interface UserBehaviorContext {
  application_switching_rate: number;
  task_completion_rate: number;
  break_patterns: BreakPattern[];
  communication_frequency: number;
}

export interface TimeSlot {
  start: Date;
  end: Date;
  type: 'free' | 'busy' | 'tentative' | 'optimal';
  value_score: number;
}

export interface CoordinationOpportunity {
  id: string;
  type: 'meeting_optimization' | 'workflow_batching' | 'task_scheduling' | 'team_coordination';
  participants: string[];
  estimated_value: number;
  confidence: number;
  implementation_complexity: 'simple' | 'moderate' | 'complex';
  suggested_timing: TimeSlot;
}

export interface BreakPattern {
  frequency: number;
  duration: number;
  trigger: 'time_based' | 'task_based' | 'fatigue' | 'external';
  productivity_impact: number;
}

export interface FusedInsight {
  id: string;
  title: string;
  description: string;
  confidence: number;
  value_estimate: number;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  source_modalities: ('vision' | 'voice' | 'context')[];
  coordination_type: CoordinationOpportunity['type'] | 'general_optimization';
  implementation_guide: ImplementationGuide;
  created_at: Date;
}

export interface ImplementationGuide {
  steps: ImplementationStep[];
  prerequisites: string[];
  estimated_time: string;
  success_metrics: string[];
  risk_factors: string[];
}

export interface ImplementationStep {
  order: number;
  action: string;
  description: string;
  estimated_time: number; // minutes
  tools_required: string[];
  validation: string;
}

// ==========================================
// ASCII Multi-Modal Architecture
// ==========================================

const MULTIMODAL_ARCHITECTURE = `
CHEATCAL MULTI-MODAL COORDINATOR ARCHITECTURE
═══════════════════════════════════════════════════════════════════

REVOLUTIONARY DATA FUSION INTELLIGENCE SYSTEM:
┌─────────────────────────────────────────────────────────────────┐
│                   MULTI-MODAL DATA FUSION                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ INPUT LAYER: MULTI-MODAL DATA STREAMS                         │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 👁️ Vision Stream          🎤 Voice Stream                  │ │
│ │   • Screen analysis         • Voice commands               │ │
│ │   • App detection          • Transcription                 │ │
│ │   • Workflow state         • Intent analysis               │ │
│ │   • UI interactions        • Natural language              │ │
│ │                                                             │ │
│ │ 🧠 Context Stream          🔄 Fusion Engine                │ │
│ │   • Time analysis          • Data correlation              │ │
│ │   • Calendar state         • Pattern recognition           │ │
│ │   • Productivity patterns  • Insight generation            │ │
│ │   • User behavior          • Value estimation              │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                              │                                 │
│                              ▼                                 │
│ PROCESSING LAYER: INTELLIGENT FUSION                          │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 🔗 Cross-Modal Correlation                                  │ │
│ │   • Vision + Voice alignment                                │ │
│ │   • Context + Intent matching                               │ │
│ │   • Temporal pattern fusion                                 │ │
│ │   • Confidence scoring                                      │ │
│ │                                                             │ │
│ │ 💡 Insight Generation                                       │ │
│ │   • Revenue optimization detection                          │ │
│ │   • Coordination opportunity identification                  │ │
│ │   • Workflow efficiency analysis                            │ │
│ │   • Predictive opportunity modeling                         │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                              │                                 │
│                              ▼                                 │
│ OUTPUT LAYER: ACTIONABLE INTELLIGENCE                         │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 🎯 Fused Insights                                           │ │
│ │   • Multi-modal validated recommendations                   │ │
│ │   • High-confidence coordination opportunities              │ │
│ │   • Revenue-focused optimization suggestions                │ │
│ │   • Implementation-ready action plans                       │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘

FUSION INTELLIGENCE GUARANTEES:
🧠 Cross-Modal Validation | 🎯 High-Confidence Insights | 💰 Revenue Focus
`;

// ==========================================
// Multi-Modal Coordinator Main Class
// ==========================================

export class MultiModalCoordinator {
  private isActive = false;
  private dataBuffer: Map<string, MultiModalData> = new Map();
  private fusionQueue: FusedInsight[] = [];
  private correlationThreshold = 0.75;
  private maxBufferSize = 50;

  constructor() {
    logger.info('🔗 Multi-Modal Coordinator initializing...');
    logger.info(MULTIMODAL_ARCHITECTURE);
    this.setupEventListeners();
  }

  // ==========================================
  // Initialization & Setup
  // ==========================================

  initialize(): void {
    this.isActive = true;
    this.startCoordinationLoop();
    logger.info('🚀 Multi-Modal Coordinator active');
  }

  private setupEventListeners(): void {
    // Vision analysis events
    window.addEventListener('cheatcal-analysis-complete', (event: any) => {
      const visionData = this.processVisionData(event.detail);
      this.addToBuffer('vision', { vision: visionData });
    });

    // Voice processing events
    window.addEventListener('cheatcal-voice-transcription', (event: any) => {
      const voiceData = this.processVoiceData(event.detail);
      this.addToBuffer('voice', { voice: voiceData });
    });

    // Context change events
    window.addEventListener('cheatcal-context-change', (event: any) => {
      const contextData = this.processContextData(event.detail);
      this.addToBuffer('context', { context: contextData });
    });
  }

  private startCoordinationLoop(): void {
    const processData = () => {
      if (this.isActive && this.dataBuffer.size > 0) {
        this.processFusionQueue();
        this.performCrossModalCorrelation();
        this.generateFusedInsights();
      }

      // Schedule next processing cycle
      setTimeout(processData, 1000); // 1-second processing cycles
    };

    processData();
  }

  // ==========================================
  // Data Processing & Fusion
  // ==========================================

  private processVisionData(rawData: any): VisionModalData {
    return {
      application: rawData.application || 'Unknown',
      context_type: rawData.context_type || 'productivity',
      text_content: rawData.content_analysis?.text_content || '',
      ui_elements: rawData.content_analysis?.ui_elements || [],
      workflow_state: rawData.content_analysis?.workflow_state || {},
      optimization_opportunities: rawData.optimization_opportunities || [],
      confidence: rawData.analysis_confidence || 0.8,
    };
  }

  private processVoiceData(rawData: any): VoiceModalData {
    return {
      transcription: rawData.text || '',
      confidence: rawData.confidence || 0.75,
      provider: rawData.provider || 'native',
      commands_detected: this.extractVoiceCommands(rawData.text || ''),
      intent_analysis: this.analyzeVoiceIntent(rawData.text || ''),
    };
  }

  private processContextData(rawData: any): ContextualModalData {
    return {
      time_context: this.analyzeTimeContext(),
      calendar_state: this.analyzeCalendarState(rawData.calendar || {}),
      productivity_patterns: this.analyzeProductivityPatterns(rawData.productivity || {}),
      user_behavior: this.analyzeUserBehavior(rawData.behavior || {}),
    };
  }

  private addToBuffer(source: string, data: Partial<MultiModalData>): void {
    const timestamp = new Date();
    const bufferId = `${source}_${timestamp.getTime()}`;

    const multiModalData: MultiModalData = {
      ...data,
      timestamp,
      fusion_confidence: this.calculateInitialConfidence(data),
    };

    this.dataBuffer.set(bufferId, multiModalData);

    // Maintain buffer size
    if (this.dataBuffer.size > this.maxBufferSize) {
      const oldestKey = Array.from(this.dataBuffer.keys())[0];
      this.dataBuffer.delete(oldestKey);
    }

    // Trigger immediate correlation check if we have multi-modal data
    if (this.hasMultiModalData()) {
      this.performCrossModalCorrelation();
    }
  }

  private hasMultiModalData(): boolean {
    const recentData = Array.from(this.dataBuffer.values()).filter(
      (data) => Date.now() - data.timestamp.getTime() < 5000
    ); // Last 5 seconds

    const hasVision = recentData.some((d) => d.vision);
    const hasVoice = recentData.some((d) => d.voice);
    const hasContext = recentData.some((d) => d.context);

    return (hasVision && hasVoice) || (hasVision && hasContext) || (hasVoice && hasContext);
  }

  // ==========================================
  // Cross-Modal Correlation
  // ==========================================

  private performCrossModalCorrelation(): void {
    const recentData = this.getRecentData(5000); // Last 5 seconds

    if (recentData.length < 2) return;

    const correlations = this.findCorrelations(recentData);
    const highConfidenceCorrelations = correlations.filter(
      (c) => c.confidence >= this.correlationThreshold
    );

    for (const correlation of highConfidenceCorrelations) {
      const fusedInsight = this.generateCorrelatedInsight(correlation);
      if (fusedInsight) {
        this.fusionQueue.push(fusedInsight);
      }
    }
  }

  private getRecentData(timeWindowMs: number): MultiModalData[] {
    const cutoff = Date.now() - timeWindowMs;
    return Array.from(this.dataBuffer.values())
      .filter((data) => data.timestamp.getTime() > cutoff)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  private findCorrelations(dataPoints: MultiModalData[]): CorrelationResult[] {
    const correlations: CorrelationResult[] = [];

    for (let i = 0; i < dataPoints.length; i++) {
      for (let j = i + 1; j < dataPoints.length; j++) {
        const correlation = this.calculateCorrelation(dataPoints[i], dataPoints[j]);
        if (correlation.confidence > 0.5) {
          correlations.push(correlation);
        }
      }
    }

    return correlations.sort((a, b) => b.confidence - a.confidence);
  }

  private calculateCorrelation(data1: MultiModalData, data2: MultiModalData): CorrelationResult {
    let confidence = 0;
    const correlationFactors: string[] = [];

    // Vision-Voice correlation
    if (data1.vision && data2.voice) {
      const visionVoiceCorrelation = this.correlateVisionVoice(data1.vision, data2.voice);
      confidence += visionVoiceCorrelation.score * 0.4;
      correlationFactors.push(...visionVoiceCorrelation.factors);
    }

    // Voice-Context correlation
    if (data1.voice && data2.context) {
      const voiceContextCorrelation = this.correlateVoiceContext(data1.voice, data2.context);
      confidence += voiceContextCorrelation.score * 0.3;
      correlationFactors.push(...voiceContextCorrelation.factors);
    }

    // Vision-Context correlation
    if (data1.vision && data2.context) {
      const visionContextCorrelation = this.correlateVisionContext(data1.vision, data2.context);
      confidence += visionContextCorrelation.score * 0.3;
      correlationFactors.push(...visionContextCorrelation.factors);
    }

    // Temporal correlation (closer in time = higher correlation)
    const timeDiff = Math.abs(data1.timestamp.getTime() - data2.timestamp.getTime());
    const temporalScore = Math.max(0, 1 - timeDiff / 10000); // 10 seconds max
    confidence += temporalScore * 0.2;

    return {
      data1,
      data2,
      confidence: Math.min(confidence, 1.0),
      correlation_factors: correlationFactors,
      correlation_type: this.determineCorrelationType(data1, data2),
    };
  }

  // ==========================================
  // Specific Correlation Methods
  // ==========================================

  private correlateVisionVoice(vision: VisionModalData, voice: VoiceModalData): CorrelationScore {
    let score = 0;
    const factors: string[] = [];

    // Application context matching
    if (
      voice.commands_detected.some((cmd) =>
        cmd.command.toLowerCase().includes(vision.application.toLowerCase())
      )
    ) {
      score += 0.3;
      factors.push('application_context_match');
    }

    // Intent-workflow alignment
    if (
      voice.intent_analysis.primary_intent === 'create' &&
      vision.optimization_opportunities.some((op) => op.type.includes('creation'))
    ) {
      score += 0.2;
      factors.push('creation_intent_alignment');
    }

    // Text content correlation
    const visionText = vision.text_content.toLowerCase();
    const voiceText = voice.transcription.toLowerCase();

    if (visionText && voiceText) {
      const commonWords = this.findCommonWords(visionText, voiceText);
      if (commonWords.length > 0) {
        score += Math.min(0.3, commonWords.length * 0.1);
        factors.push(`common_terms_${commonWords.length}`);
      }
    }

    return { score: Math.min(score, 1.0), factors };
  }

  private correlateVoiceContext(
    voice: VoiceModalData,
    context: ContextualModalData
  ): CorrelationScore {
    let score = 0;
    const factors: string[] = [];

    // Intent-time alignment
    if (
      voice.intent_analysis.urgency_level === 'high' &&
      context.time_context.productivity_window === 'peak'
    ) {
      score += 0.4;
      factors.push('urgent_peak_alignment');
    }

    // Calendar-voice command correlation
    if (
      voice.commands_detected.some((cmd) => cmd.intent === 'schedule') &&
      context.calendar_state.free_time_blocks.length > 0
    ) {
      score += 0.3;
      factors.push('scheduling_opportunity');
    }

    // Productivity state correlation
    if (
      voice.intent_analysis.primary_intent === 'optimize' &&
      context.productivity_patterns.current_level === 'low'
    ) {
      score += 0.3;
      factors.push('optimization_need');
    }

    return { score: Math.min(score, 1.0), factors };
  }

  private correlateVisionContext(
    vision: VisionModalData,
    context: ContextualModalData
  ): CorrelationScore {
    let score = 0;
    const factors: string[] = [];

    // Application-productivity correlation
    if (vision.context_type === 'email' && context.user_behavior.communication_frequency > 0.7) {
      score += 0.3;
      factors.push('high_communication_correlation');
    }

    // Workflow-time correlation
    if (
      vision.workflow_state &&
      context.time_context.productivity_window === 'peak' &&
      vision.optimization_opportunities.length > 0
    ) {
      score += 0.4;
      factors.push('peak_optimization_opportunity');
    }

    // UI-calendar correlation
    if (vision.context_type === 'calendar' && context.calendar_state.upcoming_conflicts > 0) {
      score += 0.3;
      factors.push('calendar_conflict_detected');
    }

    return { score: Math.min(score, 1.0), factors };
  }

  // ==========================================
  // Insight Generation
  // ==========================================

  private generateFusedInsights(): void {
    if (this.fusionQueue.length === 0) return;

    // Process fusion queue
    const processedInsights = this.fusionQueue.splice(0, 5); // Process up to 5 at a time

    for (const insight of processedInsights) {
      this.emitFusedInsight(insight);
    }
  }

  private generateCorrelatedInsight(correlation: CorrelationResult): FusedInsight | null {
    const { data1, data2, confidence, correlation_factors, correlation_type } = correlation;

    if (confidence < this.correlationThreshold) return null;

    const insight: FusedInsight = {
      id: `fused_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: this.generateInsightTitle(correlation_type, data1, data2),
      description: this.generateInsightDescription(correlation_factors, data1, data2),
      confidence,
      value_estimate: this.estimateInsightValue(correlation_type, data1, data2),
      urgency: this.determineInsightUrgency(correlation_factors, data1, data2),
      source_modalities: this.getSourceModalities(data1, data2),
      coordination_type: this.mapToCoordinationType(correlation_type),
      implementation_guide: this.generateImplementationGuide(correlation_type, data1, data2),
      created_at: new Date(),
    };

    return insight;
  }

  private generateInsightTitle(
    correlationType: string,
    data1: MultiModalData,
    data2: MultiModalData
  ): string {
    switch (correlationType) {
      case 'vision_voice':
        return `Multi-Modal ${data1.vision?.application || 'Application'} Optimization`;
      case 'voice_context':
        return `Voice-Activated Productivity Enhancement`;
      case 'vision_context':
        return `Screen Analysis Coordination Opportunity`;
      case 'tri_modal':
        return `Revolutionary Multi-Modal Optimization Detected`;
      default:
        return `Cross-Modal Productivity Opportunity`;
    }
  }

  private generateInsightDescription(
    factors: string[],
    data1: MultiModalData,
    data2: MultiModalData
  ): string {
    const factorDescriptions = {
      application_context_match: 'Voice command aligns with current application context',
      creation_intent_alignment: 'Creation intent detected across multiple modalities',
      urgent_peak_alignment: 'High-urgency task identified during peak productivity window',
      scheduling_opportunity: 'Voice scheduling request matches available calendar slots',
      optimization_need: 'Optimization intent detected during low productivity period',
      peak_optimization_opportunity:
        'Screen analysis reveals optimization opportunity during peak hours',
      calendar_conflict_detected: 'Calendar conflict detected through visual analysis',
    };

    const descriptions = factors
      .map((factor) => factorDescriptions[factor as keyof typeof factorDescriptions])
      .filter(Boolean)
      .slice(0, 3);

    return (
      descriptions.join('. ') +
      '. Multi-modal analysis confirms high-value coordination opportunity.'
    );
  }

  private estimateInsightValue(
    correlationType: string,
    data1: MultiModalData,
    data2: MultiModalData
  ): number {
    let baseValue = 200;

    // Vision optimization opportunities
    if (data1.vision?.optimization_opportunities || data2.vision?.optimization_opportunities) {
      const opportunities = [
        ...(data1.vision?.optimization_opportunities || []),
        ...(data2.vision?.optimization_opportunities || []),
      ];
      baseValue += opportunities.reduce((sum, op) => sum + (op.value_estimate || 0), 0);
    }

    // Voice intent urgency multiplier
    const voiceData = data1.voice || data2.voice;
    if (voiceData?.intent_analysis.urgency_level === 'critical') baseValue *= 2;
    else if (voiceData?.intent_analysis.urgency_level === 'high') baseValue *= 1.5;

    // Context productivity multiplier
    const contextData = data1.context || data2.context;
    if (contextData?.time_context.productivity_window === 'peak') baseValue *= 1.3;

    return Math.round(baseValue);
  }

  private determineInsightUrgency(
    factors: string[],
    data1: MultiModalData,
    data2: MultiModalData
  ): FusedInsight['urgency'] {
    if (
      factors.includes('urgent_peak_alignment') ||
      factors.includes('calendar_conflict_detected')
    ) {
      return 'critical';
    }

    const voiceData = data1.voice || data2.voice;
    if (voiceData?.intent_analysis.urgency_level === 'high') {
      return 'high';
    }

    if (factors.length >= 3) {
      return 'high';
    }

    return 'medium';
  }

  private getSourceModalities(
    data1: MultiModalData,
    data2: MultiModalData
  ): ('vision' | 'voice' | 'context')[] {
    const modalities: ('vision' | 'voice' | 'context')[] = [];

    if (data1.vision || data2.vision) modalities.push('vision');
    if (data1.voice || data2.voice) modalities.push('voice');
    if (data1.context || data2.context) modalities.push('context');

    return modalities;
  }

  private mapToCoordinationType(correlationType: string): FusedInsight['coordination_type'] {
    switch (correlationType) {
      case 'vision_voice':
        return 'workflow_batching';
      case 'voice_context':
        return 'task_scheduling';
      case 'vision_context':
        return 'meeting_optimization';
      case 'tri_modal':
        return 'team_coordination';
      default:
        return 'general_optimization';
    }
  }

  private generateImplementationGuide(
    correlationType: string,
    data1: MultiModalData,
    data2: MultiModalData
  ): ImplementationGuide {
    const steps: ImplementationStep[] = [
      {
        order: 1,
        action: 'Analyze multi-modal correlation',
        description: 'Review the correlation between different data sources',
        estimated_time: 2,
        tools_required: ['Command Center AI', 'Calendar access'],
        validation: 'Correlation confidence >75%',
      },
      {
        order: 2,
        action: 'Implement optimization',
        description: 'Apply the recommended optimization based on multi-modal analysis',
        estimated_time: 10,
        tools_required: ['Calendar management', 'Task tools'],
        validation: 'Optimization successfully applied',
      },
      {
        order: 3,
        action: 'Monitor results',
        description: 'Track the impact of the optimization on productivity metrics',
        estimated_time: 5,
        tools_required: ['Productivity tracking'],
        validation: 'Positive productivity impact measured',
      },
    ];

    return {
      steps,
      prerequisites: ['Command Center AI active', 'Multi-modal permissions granted'],
      estimated_time: '15-20 minutes',
      success_metrics: [
        'Increased productivity score',
        'Revenue optimization achieved',
        'Time savings measured',
      ],
      risk_factors: ['Workflow disruption', 'Learning curve', 'Integration complexity'],
    };
  }

  // ==========================================
  // Utility Methods
  // ==========================================

  private extractVoiceCommands(text: string): VoiceCommand[] {
    const commandPatterns = [
      { pattern: /create (event|meeting)/i, intent: 'create', command: 'create_event' },
      { pattern: /schedule (meeting|call)/i, intent: 'schedule', command: 'schedule_meeting' },
      {
        pattern: /optimize (schedule|calendar)/i,
        intent: 'optimize',
        command: 'optimize_schedule',
      },
      { pattern: /find (time|slot)/i, intent: 'search', command: 'find_time' },
      { pattern: /coordinate (with|team)/i, intent: 'coordinate', command: 'team_coordinate' },
    ];

    const commands: VoiceCommand[] = [];

    for (const { pattern, intent, command } of commandPatterns) {
      if (pattern.test(text)) {
        commands.push({
          command,
          parameters: { original_text: text },
          confidence: 0.8,
          intent,
        });
      }
    }

    return commands;
  }

  private analyzeVoiceIntent(text: string): IntentAnalysis {
    const intentKeywords = {
      create: ['create', 'make', 'new', 'add'],
      schedule: ['schedule', 'plan', 'book', 'arrange'],
      optimize: ['optimize', 'improve', 'enhance', 'better'],
      analyze: ['analyze', 'review', 'check', 'examine'],
      coordinate: ['coordinate', 'sync', 'align', 'collaborate'],
    };

    const words = text.toLowerCase().split(/\s+/);
    const intentScores: Record<string, number> = {};

    for (const [intent, keywords] of Object.entries(intentKeywords)) {
      intentScores[intent] = keywords.filter((keyword) => words.includes(keyword)).length;
    }

    const primaryIntent = Object.keys(intentScores).reduce((a, b) =>
      intentScores[a] > intentScores[b] ? a : b
    ) as IntentAnalysis['primary_intent'];

    const urgencyKeywords = ['urgent', 'asap', 'immediately', 'critical', 'important'];
    const urgencyScore = urgencyKeywords.filter((keyword) => words.includes(keyword)).length;

    let urgencyLevel: IntentAnalysis['urgency_level'] = 'medium';
    if (urgencyScore >= 2) urgencyLevel = 'critical';
    else if (urgencyScore >= 1) urgencyLevel = 'high';
    else if (words.includes('later') || words.includes('eventually')) urgencyLevel = 'low';

    return {
      primary_intent: primaryIntent,
      secondary_intents: Object.keys(intentScores).filter(
        (intent) => intent !== primaryIntent && intentScores[intent] > 0
      ),
      action_items: [],
      urgency_level: urgencyLevel,
    };
  }

  private analyzeTimeContext(): TimeContext {
    const now = new Date();
    const hour = now.getHours();

    let workPeriod: TimeContext['work_period'] = 'midday';
    if (hour < 6) workPeriod = 'late';
    else if (hour < 9) workPeriod = 'early';
    else if (hour < 12) workPeriod = 'morning';
    else if (hour < 14) workPeriod = 'midday';
    else if (hour < 17) workPeriod = 'afternoon';
    else if (hour < 20) workPeriod = 'evening';
    else workPeriod = 'late';

    let productivityWindow: TimeContext['productivity_window'] = 'moderate';
    if ((hour >= 9 && hour <= 11) || (hour >= 14 && hour <= 16)) {
      productivityWindow = 'peak';
    } else if (hour < 8 || hour > 18) {
      productivityWindow = 'low';
    }

    return {
      current_hour: hour,
      work_period: workPeriod,
      productivity_window: productivityWindow,
      available_time_slots: [], // Would be populated from calendar analysis
    };
  }

  private analyzeCalendarState(calendarData: any): CalendarState {
    return {
      active_events: calendarData.active_events || 0,
      upcoming_conflicts: calendarData.conflicts || 0,
      free_time_blocks: calendarData.free_time || [],
      coordination_opportunities: calendarData.opportunities || [],
    };
  }

  private analyzeProductivityPatterns(productivityData: any): ProductivityPatterns {
    return {
      current_level: productivityData.level || 'medium',
      trend: productivityData.trend || 'stable',
      focus_state: productivityData.focus || 'focused',
      efficiency_score: productivityData.efficiency || 0.75,
    };
  }

  private analyzeUserBehavior(behaviorData: any): UserBehaviorContext {
    return {
      application_switching_rate: behaviorData.app_switching || 0.5,
      task_completion_rate: behaviorData.task_completion || 0.8,
      break_patterns: behaviorData.breaks || [],
      communication_frequency: behaviorData.communication || 0.6,
    };
  }

  private calculateInitialConfidence(data: Partial<MultiModalData>): number {
    let confidence = 0.5; // Base confidence

    if (data.vision?.confidence) confidence += data.vision.confidence * 0.3;
    if (data.voice?.confidence) confidence += data.voice.confidence * 0.3;
    if (data.context) confidence += 0.2; // Context always adds confidence

    return Math.min(confidence, 1.0);
  }

  private findCommonWords(text1: string, text2: string): string[] {
    const words1 = new Set(text1.split(/\s+/).filter((word) => word.length > 3));
    const words2 = new Set(text2.split(/\s+/).filter((word) => word.length > 3));

    return Array.from(words1).filter((word) => words2.has(word));
  }

  private determineCorrelationType(data1: MultiModalData, data2: MultiModalData): string {
    const hasVision1 = !!data1.vision;
    const hasVision2 = !!data2.vision;
    const hasVoice1 = !!data1.voice;
    const hasVoice2 = !!data2.voice;
    const hasContext1 = !!data1.context;
    const hasContext2 = !!data2.context;

    if ((hasVision1 || hasVision2) && (hasVoice1 || hasVoice2) && (hasContext1 || hasContext2)) {
      return 'tri_modal';
    } else if ((hasVision1 || hasVision2) && (hasVoice1 || hasVoice2)) {
      return 'vision_voice';
    } else if ((hasVoice1 || hasVoice2) && (hasContext1 || hasContext2)) {
      return 'voice_context';
    } else if ((hasVision1 || hasVision2) && (hasContext1 || hasContext2)) {
      return 'vision_context';
    }

    return 'unknown';
  }

  private processFusionQueue(): void {
    // Remove old items from fusion queue
    const cutoff = Date.now() - 60000; // 1 minute
    this.fusionQueue = this.fusionQueue.filter((insight) => insight.created_at.getTime() > cutoff);
  }

  private emitFusedInsight(insight: FusedInsight): void {
    // Emit the fused insight as a coordination opportunity
    window.dispatchEvent(
      new CustomEvent('cheatcal-coordination-opportunity', {
        detail: {
          id: insight.id,
          type: insight.coordination_type,
          value_estimate: insight.value_estimate,
          confidence: insight.confidence,
          suggested_action: insight.title,
          urgency: insight.urgency,
        },
      })
    );

    // Also emit as a general productivity insight
    window.dispatchEvent(
      new CustomEvent('cheatcal-productivity-insight', {
        detail: {
          insight: {
            id: insight.id,
            type: 'coordination',
            title: insight.title,
            description: insight.description,
            confidence: insight.confidence,
            value_estimate: insight.value_estimate,
            urgency: insight.urgency,
            source: 'multi_modal',
            suggested_actions: [
              {
                id: `action_${insight.id}`,
                action: insight.title,
                impact: 'high',
                effort: 'moderate',
                revenue_potential: insight.value_estimate,
                implementation_steps: insight.implementation_guide.steps.map((step) => step.action),
              },
            ],
            created_at: insight.created_at,
          },
          implementation_guide: insight.implementation_guide,
        },
      })
    );

    logger.info(`🔗 Fused insight generated: ${insight.title} (Value: $${insight.value_estimate})`);
  }

  // ==========================================
  // Public API
  // ==========================================

  getActiveInsights(): FusedInsight[] {
    return [...this.fusionQueue];
  }

  getBufferStatus(): { size: number; maxSize: number; utilizationRate: number } {
    return {
      size: this.dataBuffer.size,
      maxSize: this.maxBufferSize,
      utilizationRate: this.dataBuffer.size / this.maxBufferSize,
    };
  }

  updateConfiguration(
    config: Partial<{ correlationThreshold: number; maxBufferSize: number }>
  ): void {
    if (config.correlationThreshold !== undefined) {
      this.correlationThreshold = config.correlationThreshold;
    }
    if (config.maxBufferSize !== undefined) {
      this.maxBufferSize = config.maxBufferSize;
    }

    logger.info('🔧 Multi-Modal Coordinator configuration updated');
  }

  isCoordinatorActive(): boolean {
    return this.isActive;
  }

  destroy(): void {
    this.isActive = false;
    this.dataBuffer.clear();
    this.fusionQueue.length = 0;
    logger.info('🧹 Multi-Modal Coordinator destroyed');
  }
}

// ==========================================
// Supporting Interfaces
// ==========================================

interface CorrelationResult {
  data1: MultiModalData;
  data2: MultiModalData;
  confidence: number;
  correlation_factors: string[];
  correlation_type: string;
}

interface CorrelationScore {
  score: number;
  factors: string[];
}

export default MultiModalCoordinator;
