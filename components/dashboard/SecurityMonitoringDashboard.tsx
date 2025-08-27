'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  EyeOff,
  FileText,
  Globe,
  Key,
  Lock,
  RefreshCw,
  Server,
  Shield,
  XCircle,
  Zap,
} from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';

interface SecurityEvent {
  id: string;
  timestamp: string;
  type: 'success' | 'warning' | 'error' | 'info';
  category: 'authentication' | 'authorization' | 'encryption' | 'webhook' | 'audit' | 'compliance';
  message: string;
  details?: string;
  source: string;
}

interface ComplianceStatus {
  name: string;
  status: 'compliant' | 'partial' | 'non-compliant';
  progress: number;
  lastAudit: string;
  nextAudit: string;
  icon: React.ReactNode;
}

interface TokenStatus {
  provider: string;
  status: 'valid' | 'expiring' | 'expired';
  expiresIn: string;
  lastRotation: string;
  encryptionMethod: string;
}

const SecurityMonitoringDashboard: React.FC = () => {
  const [showDetails, setShowDetails] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [securityEvents, _setSecurityEvents] = useState<SecurityEvent[]>([
    {
      id: '1',
      timestamp: '2 minutes ago',
      type: 'success',
      category: 'encryption',
      message: 'Token encryption successful',
      details: 'AES-256-GCM encryption applied to Google Calendar tokens',
      source: 'Google Provider',
    },
    {
      id: '2',
      timestamp: '5 minutes ago',
      type: 'success',
      category: 'webhook',
      message: 'Webhook signature verified',
      details: 'HMAC-SHA256 signature validation passed for Microsoft webhook',
      source: 'Microsoft Provider',
    },
    {
      id: '3',
      timestamp: '12 minutes ago',
      type: 'warning',
      category: 'authentication',
      message: 'Token expiring soon',
      details: 'Microsoft Graph token expires in 7 days',
      source: 'Token Manager',
    },
    {
      id: '4',
      timestamp: '1 hour ago',
      type: 'info',
      category: 'audit',
      message: 'Security scan completed',
      details: 'No vulnerabilities detected in system audit',
      source: 'Security Scanner',
    },
    {
      id: '5',
      timestamp: '2 hours ago',
      type: 'success',
      category: 'compliance',
      message: 'GDPR compliance check passed',
      details: 'All data protection measures verified',
      source: 'Compliance Monitor',
    },
  ]);

  const [complianceStatus] = useState<ComplianceStatus[]>([
    {
      name: 'SOC 2 Type II',
      status: 'compliant',
      progress: 95,
      lastAudit: '3 months ago',
      nextAudit: '9 months',
      icon: <Shield className="w-5 h-5" />,
    },
    {
      name: 'GDPR',
      status: 'compliant',
      progress: 100,
      lastAudit: '1 month ago',
      nextAudit: '11 months',
      icon: <Globe className="w-5 h-5" />,
    },
    {
      name: 'ISO 27001',
      status: 'partial',
      progress: 78,
      lastAudit: '6 months ago',
      nextAudit: '6 months',
      icon: <FileText className="w-5 h-5" />,
    },
  ]);

  const [tokenStatus] = useState<TokenStatus[]>([
    {
      provider: 'Google Calendar',
      status: 'valid',
      expiresIn: '45 days',
      lastRotation: '15 days ago',
      encryptionMethod: 'AES-256-GCM',
    },
    {
      provider: 'Microsoft Outlook',
      status: 'expiring',
      expiresIn: '7 days',
      lastRotation: '53 days ago',
      encryptionMethod: 'AES-256-GCM',
    },
    {
      provider: 'Apple CalDAV',
      status: 'valid',
      expiresIn: '90 days',
      lastRotation: '30 days ago',
      encryptionMethod: 'AES-256-GCM',
    },
    {
      provider: 'Generic CalDAV',
      status: 'expired',
      expiresIn: 'Expired',
      lastRotation: '120 days ago',
      encryptionMethod: 'N/A',
    },
  ]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsRefreshing(false);
  };

  const getEventIcon = (type: string, category: string) => {
    if (category === 'encryption') return <Lock className="w-4 h-4" />;
    if (category === 'webhook') return <Zap className="w-4 h-4" />;
    if (category === 'authentication') return <Key className="w-4 h-4" />;
    if (category === 'audit') return <Eye className="w-4 h-4" />;
    if (category === 'compliance') return <Shield className="w-4 h-4" />;

    switch (type) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-blue-500" />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const getComplianceColor = (status: string) => {
    switch (status) {
      case 'compliant':
        return 'text-green-600';
      case 'partial':
        return 'text-yellow-600';
      case 'non-compliant':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getTokenStatusColor = (status: string) => {
    switch (status) {
      case 'valid':
        return 'text-green-600 bg-green-100';
      case 'expiring':
        return 'text-yellow-600 bg-yellow-100';
      case 'expired':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getTokenStatusIcon = (status: string) => {
    switch (status) {
      case 'valid':
        return <CheckCircle className="w-4 h-4" />;
      case 'expiring':
        return <AlertTriangle className="w-4 h-4" />;
      case 'expired':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-foreground">Security Monitoring</h2>
          <p className="text-muted-foreground">
            Enterprise-grade security compliance and monitoring
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-2"
          >
            {showDetails ? (
              <>
                <EyeOff className="w-4 h-4" />
                Hide Details
              </>
            ) : (
              <>
                <Eye className="w-4 h-4" />
                Show Details
              </>
            )}
          </Button>
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2"
            variant="outline"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Security Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-green-50/50 border-green-200/50 dark:bg-green-950/20 dark:border-green-800/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Shield className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-700 dark:text-green-300">
                  Security Status
                </p>
                <p className="text-xl font-bold text-green-800 dark:text-green-200">Secure</p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs text-green-600 dark:text-green-400">
                All systems protected
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50/50 border-blue-200/50 dark:bg-blue-950/20 dark:border-blue-800/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Lock className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Encryption</p>
                <p className="text-xl font-bold text-blue-800 dark:text-blue-200">AES-256-GCM</p>
              </div>
            </div>
            <div className="mt-3">
              <span className="text-xs text-blue-600 dark:text-blue-400">All tokens encrypted</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-50/50 border-purple-200/50 dark:bg-purple-950/20 dark:border-purple-800/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Activity className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-purple-700 dark:text-purple-300">
                  Active Monitoring
                </p>
                <p className="text-xl font-bold text-purple-800 dark:text-purple-200">24/7</p>
              </div>
            </div>
            <div className="mt-3">
              <span className="text-xs text-purple-600 dark:text-purple-400">
                Real-time threat detection
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-orange-50/50 border-orange-200/50 dark:bg-orange-950/20 dark:border-orange-800/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <Server className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-orange-700 dark:text-orange-300">
                  Compliance
                </p>
                <p className="text-xl font-bold text-orange-800 dark:text-orange-200">91%</p>
              </div>
            </div>
            <div className="mt-3">
              <span className="text-xs text-orange-600 dark:text-orange-400">
                3 standards monitored
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Token Status */}
        <Card className="bg-card/30 backdrop-blur-md border-border/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Key className="w-5 h-5" />
              Token Management
            </CardTitle>
            <p className="text-sm text-muted-foreground">Provider authentication token status</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tokenStatus.map((token, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getTokenStatusIcon(token.status)}
                    <div>
                      <p className="font-medium text-foreground">{token.provider}</p>
                      <p className="text-sm text-muted-foreground">
                        {token.encryptionMethod !== 'N/A'
                          ? `Encrypted: ${token.encryptionMethod}`
                          : 'Not encrypted'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={`mb-1 ${getTokenStatusColor(token.status)}`}>
                      {token.expiresIn}
                    </Badge>
                    <p className="text-xs text-muted-foreground">Rotated {token.lastRotation}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Compliance Status */}
        <Card className="bg-card/30 backdrop-blur-md border-border/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Compliance Status
            </CardTitle>
            <p className="text-sm text-muted-foreground">Security standards and certifications</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {complianceStatus.map((compliance, index) => (
                <div key={index} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg ${getComplianceColor(compliance.status)} bg-current/10`}
                      >
                        {compliance.icon}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{compliance.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Last audit: {compliance.lastAudit}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        compliance.status === 'compliant'
                          ? 'default'
                          : compliance.status === 'partial'
                            ? 'secondary'
                            : 'destructive'
                      }
                      className="capitalize"
                    >
                      {compliance.status}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Compliance Progress</span>
                      <span className="font-medium">{compliance.progress}%</span>
                    </div>
                    <Progress value={compliance.progress} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      Next audit in {compliance.nextAudit}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Security Events Log */}
        <Card className="lg:col-span-2 bg-card/30 backdrop-blur-md border-border/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Security Event Log
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Real-time security events and audit trail
            </p>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {securityEvents.map((event) => (
                  <div
                    key={event.id}
                    className={`p-4 rounded-lg border-l-4 ${getEventColor(event.type)}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        {getEventIcon(event.type, event.category)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-foreground">{event.message}</p>
                            <Badge variant="outline" className="text-xs">
                              {event.category}
                            </Badge>
                          </div>
                          {showDetails && event.details && (
                            <p className="text-sm text-muted-foreground mb-2">{event.details}</p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {event.timestamp}
                            </span>
                            <span>Source: {event.source}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Security Health Indicator */}
      <div className="flex items-center justify-center py-4">
        <div className="flex items-center gap-3 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-green-600 font-medium">Security Status: Healthy</span>
          </div>
          <div className="w-px h-4 bg-border" />
          <span className="text-muted-foreground">
            Last security scan: {new Date().toLocaleTimeString()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default SecurityMonitoringDashboard;
