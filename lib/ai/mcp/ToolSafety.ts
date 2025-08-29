/**
 * MCP Tool Safety & Permission System
 * Research validation: ImageSorcery MCP patterns for tool safety and auto-approval
 *
 * Key patterns implemented:
 * - Auto-approval lists for trusted, non-destructive operations
 * - Scoped permissions with granular access control
 * - Complete audit logging for all tool executions
 * - Tool validation and parameter sanitization
 */

import { useState } from 'react';

/**
 * Tool permission levels (ImageSorcery research patterns)
 */
export enum ToolPermissionLevel {
  AUTO_APPROVE = 'auto_approve', // Execute immediately (safe operations)
  CONFIRM = 'confirm', // Require user confirmation
  MANUAL_ONLY = 'manual_only', // Require manual execution
  RESTRICTED = 'restricted', // Blocked/not allowed
}

/**
 * Tool execution context for scoped permissions
 */
interface ToolExecutionContext {
  userId: string;
  workspaceId: string;
  activeView: string;
  selectedEntities: Array<{ id: string; type: string }>;
  userRole: 'viewer' | 'editor' | 'admin' | 'owner';
  sessionId: string;
  timestamp: string;
}

/**
 * Tool safety configuration
 */
interface ToolSafetyConfig {
  toolName: string;
  permissionLevel: ToolPermissionLevel;
  allowedScopes: string[]; // Which views/contexts can use this tool
  maxExecutionsPerHour: number;
  requiresUserPresence: boolean;

  // Parameter validation
  parameterRules: Record<
    string,
    {
      required: boolean;
      type: 'string' | 'number' | 'boolean' | 'object' | 'array';
      validation?: (value: any) => boolean;
      sanitization?: (value: any) => any;
    }
  >;

  // Safety checks
  preExecutionChecks: Array<(context: ToolExecutionContext, params: any) => Promise<boolean>>;
  postExecutionChecks: Array<(context: ToolExecutionContext, result: any) => Promise<void>>;
}

/**
 * Tool execution audit log entry
 */
interface ToolAuditLog {
  id: string;
  toolName: string;
  userId: string;
  sessionId: string;

  execution: {
    parameters: any;
    result: any;
    success: boolean;
    executionTime: number;
    permissionLevel: ToolPermissionLevel;
    confirmationRequired: boolean;
    userConfirmed: boolean;
  };

  context: ToolExecutionContext;
  timestamp: string;

  // Security tracking
  ipAddress?: string;
  userAgent?: string;

  // Performance tracking
  performanceMetrics: {
    parameterValidationTime: number;
    executionTime: number;
    totalTime: number;
  };
}

/**
 * Tool Safety Manager Class
 * Implements comprehensive tool safety with research-validated patterns
 */
export class ToolSafetyManager {
  private static safetyConfigs: Map<string, ToolSafetyConfig> = new Map();
  private static auditLogs: ToolAuditLog[] = [];
  private static executionCounts: Map<
    string,
    { userId: string; count: number; hourStart: number }
  > = new Map();

  /**
   * Initialize safety configurations for MCP tools
   * Research pattern: ImageSorcery auto-approval lists
   */
  static initializeSafetyConfigs() {
    // Calendar tools (generally safe with confirmation)
    this.registerToolSafety('calendar.createEvent', {
      toolName: 'calendar.createEvent',
      permissionLevel: ToolPermissionLevel.CONFIRM,
      allowedScopes: ['week', 'planner', 'mailbox'],
      maxExecutionsPerHour: 20,
      requiresUserPresence: true,
      parameterRules: {
        title: { required: true, type: 'string' },
        start: { required: true, type: 'string' },
        end: { required: true, type: 'string' },
        attendees: { required: false, type: 'array' },
      },
      preExecutionChecks: [
        async (context, params) => {
          // Validate date is not in the past
          const startDate = new Date(params.start);
          return startDate > new Date();
        },
      ],
      postExecutionChecks: [
        async (context, result) => {
          console.log(`Calendar event created: ${result.id}`);
        },
      ],
    });

    // Task tools (safe for auto-approval)
    this.registerToolSafety('tasks.create', {
      toolName: 'tasks.create',
      permissionLevel: ToolPermissionLevel.AUTO_APPROVE,
      allowedScopes: ['planner', 'notes', 'mailbox'],
      maxExecutionsPerHour: 50,
      requiresUserPresence: false,
      parameterRules: {
        title: { required: true, type: 'string' },
        priority: { required: false, type: 'string' },
        dueDate: { required: false, type: 'string' },
      },
      preExecutionChecks: [],
      postExecutionChecks: [],
    });

    // Conflict resolution (requires confirmation due to impact)
    this.registerToolSafety('calendar.resolveConflicts', {
      toolName: 'calendar.resolveConflicts',
      permissionLevel: ToolPermissionLevel.CONFIRM,
      allowedScopes: ['week', 'planner'],
      maxExecutionsPerHour: 5,
      requiresUserPresence: true,
      parameterRules: {
        range: { required: true, type: 'string' },
        policy: { required: false, type: 'string' },
      },
      preExecutionChecks: [
        async (context, params) => {
          // Ensure user has edit permissions
          return (
            context.userRole === 'editor' ||
            context.userRole === 'admin' ||
            context.userRole === 'owner'
          );
        },
      ],
      postExecutionChecks: [
        async (context, result) => {
          // Log conflict resolution for audit
          console.log(`Conflict resolution applied: ${result.conflictsResolved} conflicts`);
        },
      ],
    });

    // Email conversion (auto-approve with audit)
    this.registerToolSafety('mail.convertToEntity', {
      toolName: 'mail.convertToEntity',
      permissionLevel: ToolPermissionLevel.AUTO_APPROVE,
      allowedScopes: ['mailbox'],
      maxExecutionsPerHour: 30,
      requiresUserPresence: false,
      parameterRules: {
        emailId: { required: true, type: 'string' },
        targetType: { required: false, type: 'string' },
      },
      preExecutionChecks: [],
      postExecutionChecks: [
        async (context, result) => {
          console.log(`Email converted: ${result.sourceId} → ${result.targetType}`);
        },
      ],
    });

    console.log('🔒 Tool safety configurations initialized');
  }

  /**
   * Register tool safety configuration
   */
  static registerToolSafety(toolName: string, config: ToolSafetyConfig) {
    this.safetyConfigs.set(toolName, config);
  }

  /**
   * Execute tool with comprehensive safety checks
   */
  static async executeToolSafely(
    toolName: string,
    parameters: any,
    context: ToolExecutionContext,
    options: {
      skipConfirmation?: boolean;
      dryRun?: boolean;
      auditOnly?: boolean;
    } = {}
  ): Promise<{
    success: boolean;
    result?: any;
    auditLog: ToolAuditLog;
    requiresConfirmation: boolean;
    blockedReason?: string;
  }> {
    const executionStart = performance.now();
    const auditId = `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Get safety configuration
    const safetyConfig = this.safetyConfigs.get(toolName);
    if (!safetyConfig) {
      return {
        success: false,
        auditLog: this.createAuditLog(auditId, toolName, context, parameters, {
          success: false,
          error: 'Tool not registered in safety system',
        }),
        requiresConfirmation: false,
        blockedReason: 'Tool not found in safety registry',
      };
    }

    try {
      // Step 1: Validate parameters
      const paramValidationStart = performance.now();
      const paramValidation = await this.validateParameters(
        parameters,
        safetyConfig.parameterRules
      );
      const paramValidationTime = performance.now() - paramValidationStart;

      if (!paramValidation.valid) {
        throw new Error(`Parameter validation failed: ${paramValidation.errors.join(', ')}`);
      }

      // Step 2: Check execution limits (rate limiting)
      const rateLimitOk = this.checkExecutionLimits(
        toolName,
        context.userId,
        safetyConfig.maxExecutionsPerHour
      );
      if (!rateLimitOk) {
        throw new Error('Rate limit exceeded for tool execution');
      }

      // Step 3: Validate scope permissions
      const scopeValid =
        safetyConfig.allowedScopes.includes(context.activeView) ||
        safetyConfig.allowedScopes.includes('*');
      if (!scopeValid) {
        throw new Error(`Tool not allowed in scope: ${context.activeView}`);
      }

      // Step 4: Run pre-execution checks
      for (const check of safetyConfig.preExecutionChecks) {
        const checkPassed = await check(context, parameters);
        if (!checkPassed) {
          throw new Error('Pre-execution safety check failed');
        }
      }

      // Step 5: Handle confirmation requirements
      const requiresConfirmation =
        safetyConfig.permissionLevel === ToolPermissionLevel.CONFIRM ||
        safetyConfig.permissionLevel === ToolPermissionLevel.MANUAL_ONLY;

      if (requiresConfirmation && !options.skipConfirmation && !options.dryRun) {
        const confirmed = await this.requestUserConfirmation(toolName, parameters, safetyConfig);
        if (!confirmed) {
          const auditLog = this.createAuditLog(auditId, toolName, context, parameters, {
            success: false,
            error: 'User denied confirmation',
          });

          return {
            success: false,
            auditLog,
            requiresConfirmation: true,
            blockedReason: 'User denied confirmation',
          };
        }
      }

      // Step 6: Execute tool (or simulate for dry run)
      const toolExecutionStart = performance.now();
      const result = options.dryRun
        ? await this.simulateToolExecution(toolName, parameters)
        : await this.executeActualTool(toolName, parameters, context);
      const toolExecutionTime = performance.now() - toolExecutionStart;

      // Step 7: Run post-execution checks
      for (const check of safetyConfig.postExecutionChecks) {
        await check(context, result);
      }

      // Step 8: Create audit log
      const totalTime = performance.now() - executionStart;
      const auditLog = this.createAuditLog(auditId, toolName, context, parameters, {
        success: true,
        result,
        executionTime: toolExecutionTime,
        totalTime,
        paramValidationTime,
      });

      this.auditLogs.push(auditLog);

      // Step 9: Update execution tracking
      this.updateExecutionCount(toolName, context.userId);

      console.log(`✅ Tool executed safely: ${toolName} (${totalTime.toFixed(2)}ms)`);

      return {
        success: true,
        result,
        auditLog,
        requiresConfirmation,
      };
    } catch (error) {
      console.error(`❌ Tool execution failed: ${toolName}`, error);

      const auditLog = this.createAuditLog(auditId, toolName, context, parameters, {
        success: false,
        error: error.message,
      });

      this.auditLogs.push(auditLog);

      return {
        success: false,
        auditLog,
        requiresConfirmation: requiresConfirmation || false,
        blockedReason: error.message,
      };
    }
  }

  /**
   * Validate tool parameters against safety rules
   */
  private static async validateParameters(
    parameters: any,
    rules: ToolSafetyConfig['parameterRules']
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Check required parameters
    for (const [paramName, rule] of Object.entries(rules)) {
      if (rule.required && !(paramName in parameters)) {
        errors.push(`Missing required parameter: ${paramName}`);
      }

      if (paramName in parameters) {
        const value = parameters[paramName];

        // Type validation
        if (rule.type === 'string' && typeof value !== 'string') {
          errors.push(`Parameter ${paramName} must be string, got ${typeof value}`);
        }

        if (rule.type === 'number' && typeof value !== 'number') {
          errors.push(`Parameter ${paramName} must be number, got ${typeof value}`);
        }

        if (rule.type === 'boolean' && typeof value !== 'boolean') {
          errors.push(`Parameter ${paramName} must be boolean, got ${typeof value}`);
        }

        if (rule.type === 'array' && !Array.isArray(value)) {
          errors.push(`Parameter ${paramName} must be array, got ${typeof value}`);
        }

        // Custom validation
        if (rule.validation && !rule.validation(value)) {
          errors.push(`Parameter ${paramName} failed validation`);
        }

        // Apply sanitization
        if (rule.sanitization) {
          parameters[paramName] = rule.sanitization(value);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Check execution rate limits
   */
  private static checkExecutionLimits(
    toolName: string,
    userId: string,
    maxPerHour: number
  ): boolean {
    const key = `${toolName}-${userId}`;
    const now = Date.now();
    const hourStart = Math.floor(now / (1000 * 60 * 60)) * (1000 * 60 * 60);

    const current = this.executionCounts.get(key);

    if (!current || current.hourStart !== hourStart) {
      // New hour, reset count
      this.executionCounts.set(key, { userId, count: 0, hourStart });
      return true;
    }

    return current.count < maxPerHour;
  }

  /**
   * Update execution count tracking
   */
  private static updateExecutionCount(toolName: string, userId: string) {
    const key = `${toolName}-${userId}`;
    const current = this.executionCounts.get(key);

    if (current) {
      current.count += 1;
    }
  }

  /**
   * Request user confirmation for tool execution
   */
  private static async requestUserConfirmation(
    toolName: string,
    parameters: any,
    config: ToolSafetyConfig
  ): Promise<boolean> {
    // In a real implementation, this would show a confirmation dialog
    // For development, we'll use browser confirm

    const parameterSummary = Object.entries(parameters)
      .slice(0, 3)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');

    const message = `Execute ${toolName}?\\n\\nParameters: ${parameterSummary}\\n\\nThis action ${config.permissionLevel === ToolPermissionLevel.MANUAL_ONLY ? 'requires manual review' : 'will modify your data'}.`;

    return confirm(message);
  }

  /**
   * Simulate tool execution for dry runs and testing
   */
  private static async simulateToolExecution(toolName: string, parameters: any): Promise<any> {
    console.log(`🧪 Simulating tool execution: ${toolName}`);

    // Return mock results based on tool type
    if (toolName.includes('create')) {
      return {
        id: `simulated-${Date.now()}`,
        created: true,
        parameters,
        simulated: true,
      };
    }

    if (toolName.includes('resolve')) {
      return {
        conflictsResolved: 2,
        entitiesModified: 3,
        simulated: true,
      };
    }

    return {
      tool: toolName,
      parameters,
      simulated: true,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Execute actual tool (integrate with MCP system)
   */
  private static async executeActualTool(
    toolName: string,
    parameters: any,
    context: ToolExecutionContext
  ): Promise<any> {
    console.log(`🔧 Executing tool: ${toolName}`);

    // TODO: Integrate with actual MCP tool system
    // For now, return structured mock results

    switch (toolName) {
      case 'calendar.createEvent':
        // TODO: Integrate with calendar backend
        return {
          id: `event-${Date.now()}`,
          title: parameters.title,
          start: parameters.start,
          end: parameters.end,
          created: true,
        };

      case 'tasks.create':
        // TODO: Integrate with task system
        return {
          id: `task-${Date.now()}`,
          title: parameters.title,
          priority: parameters.priority || 'medium',
          created: true,
        };

      case 'calendar.resolveConflicts':
        // TODO: Integrate with PlannerAgent
        return {
          conflictsAnalyzed: 5,
          conflictsResolved: 3,
          entitiesModified: 4,
          executionTime: 1200,
        };

      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }

  /**
   * Create comprehensive audit log entry
   */
  private static createAuditLog(
    id: string,
    toolName: string,
    context: ToolExecutionContext,
    parameters: any,
    execution: any
  ): ToolAuditLog {
    return {
      id,
      toolName,
      userId: context.userId,
      sessionId: context.sessionId,

      execution: {
        parameters,
        result: execution.result,
        success: execution.success !== false,
        executionTime: execution.executionTime || 0,
        permissionLevel:
          this.safetyConfigs.get(toolName)?.permissionLevel || ToolPermissionLevel.MANUAL_ONLY,
        confirmationRequired: execution.confirmationRequired || false,
        userConfirmed: execution.userConfirmed || false,
      },

      context,
      timestamp: new Date().toISOString(),

      performanceMetrics: {
        parameterValidationTime: execution.paramValidationTime || 0,
        executionTime: execution.executionTime || 0,
        totalTime: execution.totalTime || 0,
      },
    };
  }

  /**
   * Get auto-approval list (ImageSorcery pattern)
   */
  static getAutoApprovalList(): string[] {
    return Array.from(this.safetyConfigs.entries())
      .filter(([_, config]) => config.permissionLevel === ToolPermissionLevel.AUTO_APPROVE)
      .map(([toolName, _]) => toolName);
  }

  /**
   * Get audit logs for review (privacy feature)
   */
  static getAuditLogs(userId?: string, toolName?: string, limit: number = 100): ToolAuditLog[] {
    return this.auditLogs
      .filter((log) => !userId || log.userId === userId)
      .filter((log) => !toolName || log.toolName === toolName)
      .slice(-limit);
  }

  /**
   * Clear audit logs (privacy compliance)
   */
  static clearAuditLogs(userId?: string, olderThanDays?: number) {
    if (userId && olderThanDays) {
      const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
      this.auditLogs = this.auditLogs.filter(
        (log) => log.userId !== userId || new Date(log.timestamp) > cutoffDate
      );
    } else if (userId) {
      this.auditLogs = this.auditLogs.filter((log) => log.userId !== userId);
    } else {
      this.auditLogs = [];
    }

    console.log(`🗑️ Audit logs cleared for ${userId || 'all users'}`);
  }

  /**
   * Get safety system status and statistics
   */
  static getSafetyStatus() {
    const autoApprovalCount = Array.from(this.safetyConfigs.values()).filter(
      (config) => config.permissionLevel === ToolPermissionLevel.AUTO_APPROVE
    ).length;

    const totalExecutions = this.auditLogs.length;
    const successfulExecutions = this.auditLogs.filter((log) => log.execution.success).length;
    const successRate = totalExecutions > 0 ? (successfulExecutions / totalExecutions) * 100 : 100;

    return {
      registeredTools: this.safetyConfigs.size,
      autoApprovalTools: autoApprovalCount,
      totalExecutions,
      successRate: successRate.toFixed(1) + '%',
      averageExecutionTime:
        totalExecutions > 0
          ? this.auditLogs.reduce((sum, log) => sum + log.execution.executionTime, 0) /
            totalExecutions
          : 0,
      recentAuditLogs: this.auditLogs.slice(-5).map((log) => ({
        toolName: log.toolName,
        success: log.execution.success,
        timestamp: log.timestamp,
      })),
    };
  }
}

/**
 * Tool Safety Hook for React components
 */
export function useToolSafety() {
  const [safetyStatus, setSafetyStatus] = useState(ToolSafetyManager.getSafetyStatus());

  const executeToolSafely = async (
    toolName: string,
    parameters: any,
    context: any,
    options?: any
  ) => {
    const result = await ToolSafetyManager.executeToolSafely(
      toolName,
      parameters,
      context,
      options
    );

    // Update safety status after execution
    setSafetyStatus(ToolSafetyManager.getSafetyStatus());

    return result;
  };

  const getAuditLogs = (userId?: string, toolName?: string) => {
    return ToolSafetyManager.getAuditLogs(userId, toolName);
  };

  const getAutoApprovalList = () => {
    return ToolSafetyManager.getAutoApprovalList();
  };

  return {
    safetyStatus,
    executeToolSafely,
    getAuditLogs,
    getAutoApprovalList,
    clearLogs: ToolSafetyManager.clearAuditLogs.bind(ToolSafetyManager),
  };
}

// Initialize safety configurations when module loads
ToolSafetyManager.initializeSafetyConfigs();
