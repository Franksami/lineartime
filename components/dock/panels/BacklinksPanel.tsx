/**
 * Backlinks Panel - Entity Relationship Graph
 * Research validation: Obsidian graph view patterns + entity relationship visualization
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Network,
  Search,
  Filter,
  ExternalLink,
  Calendar,
  CheckSquare,
  FileText,
  Mail,
  User,
  FolderOpen,
  Zap,
} from 'lucide-react';
import { useEntityLinking } from '@/lib/entities/EntityLinkingSystem';
import { useAppShell } from '@/contexts/AppShellProvider';
import { useFeatureFlag, COMMAND_WORKSPACE_FLAGS } from '@/lib/features/useFeatureFlags';
import { cn } from '@/lib/utils';

/**
 * Backlinks Panel Hook
 */
function useBacklinksPanel() {
  const entityLinking = useEntityLinking();
  const { activeView } = useAppShell();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntityType, setSelectedEntityType] = useState<string | null>(null);
  const [graphView, setGraphView] = useState(false);
  const backlinksEnabled = useFeatureFlag(COMMAND_WORKSPACE_FLAGS.DOCK_BACKLINKS_PANEL);

  // Get graph data for visualization
  const graphData = useMemo(() => {
    if (!entityLinking.selectedEntity) return null;

    return entityLinking.getEntityGraph(
      entityLinking.selectedEntity.id,
      2, // Max depth
      {
        entityTypes: selectedEntityType ? [selectedEntityType as any] : undefined,
        minStrength: 0.3,
      }
    );
  }, [entityLinking.selectedEntity, selectedEntityType]);

  // Filter backlinks by search query
  const filteredBacklinks = useMemo(() => {
    if (!entityLinking.backlinks) return null;

    let incomingLinks = entityLinking.backlinks.incomingLinks;
    let outgoingLinks = entityLinking.backlinks.outgoingLinks;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      incomingLinks = incomingLinks.filter(
        (link) =>
          link.from.title.toLowerCase().includes(query) || link.type.toLowerCase().includes(query)
      );
      outgoingLinks = outgoingLinks.filter(
        (link) =>
          link.to.title.toLowerCase().includes(query) || link.type.toLowerCase().includes(query)
      );
    }

    if (selectedEntityType) {
      incomingLinks = incomingLinks.filter((link) => link.from.type === selectedEntityType);
      outgoingLinks = outgoingLinks.filter((link) => link.to.type === selectedEntityType);
    }

    return {
      ...entityLinking.backlinks,
      incomingLinks,
      outgoingLinks,
    };
  }, [entityLinking.backlinks, searchQuery, selectedEntityType]);

  return {
    selectedEntity: entityLinking.selectedEntity,
    backlinks: filteredBacklinks,
    searchQuery,
    setSearchQuery,
    selectedEntityType,
    setSelectedEntityType,
    graphView,
    setGraphView,
    graphData,
    selectEntity: entityLinking.selectEntity,
    createLink: entityLinking.createLink,
    searchEntities: entityLinking.searchEntities,
    handleDragToLink: entityLinking.handleDragToLink,
    backlinksEnabled,
    stats: entityLinking.getStats(),
  };
}

/**
 * Entity Type Icon Component
 */
function EntityTypeIcon({ type, className }: { type: string; className?: string }) {
  const icons = {
    event: Calendar,
    task: CheckSquare,
    note: FileText,
    contact: User,
    project: FolderOpen,
    email: Mail,
  };

  const Icon = icons[type as keyof typeof icons] || FileText;
  return <Icon className={className} />;
}

/**
 * Backlink Item Component
 */
function BacklinkItem({
  link,
  direction,
  onSelect,
}: {
  link: any;
  direction: 'incoming' | 'outgoing';
  onSelect: (entityId: string) => void;
}) {
  const entity = direction === 'incoming' ? link.from : link.to;
  const linkTypeColors = {
    related: 'bg-blue-100 /* TODO: Use semantic token */ text-blue-800 /* TODO: Use semantic token */',
    depends_on: 'bg-orange-100 text-orange-800',
    part_of: 'bg-green-100 /* TODO: Use semantic token */ text-green-800 /* TODO: Use semantic token */',
    references: 'bg-purple-100 /* TODO: Use semantic token */ text-purple-800 /* TODO: Use semantic token */',
    mentions: 'bg-gray-100 /* TODO: Use semantic token */ text-gray-800 /* TODO: Use semantic token */',
  };

  return (
    <Card className="cursor-pointer hover:shadow-sm transition-all duration-200">
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 flex-1">
            <EntityTypeIcon type={entity.type} className="h-4 w-4 mt-0.5 text-muted-foreground" />

            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{entity.title}</div>

              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {entity.type}
                </Badge>

                <Badge
                  className={cn(
                    'text-xs',
                    linkTypeColors[link.type] || 'bg-gray-100 /* TODO: Use semantic token */ text-gray-800 /* TODO: Use semantic token */'
                  )}
                >
                  {link.type.replace('_', ' ')}
                </Badge>

                {link.strength && (
                  <div className="text-xs text-muted-foreground">
                    {(link.strength * 100).toFixed(0)}%
                  </div>
                )}
              </div>

              {/* Link context */}
              {link.context?.sourceText && (
                <div className="text-xs text-muted-foreground mt-2 bg-muted/50 p-2 rounded italic">
                  "{link.context.sourceText.slice(0, 100)}..."
                </div>
              )}
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(entity.id);
            }}
            className="h-6 w-6 p-0"
          >
            <ExternalLink className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Simple Graph Visualization (text-based for MVP)
 */
function SimpleGraphView({ graphData }: { graphData: any }) {
  if (!graphData) return null;

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-2">
          <Network className="h-8 w-8 text-primary" />
        </div>
        <div className="text-sm font-medium">Knowledge Graph</div>
        <div className="text-xs text-muted-foreground">
          {graphData.stats.totalNodes} entities • {graphData.stats.totalEdges} connections
        </div>
      </div>

      {/* Connected entities */}
      <div className="space-y-2">
        <h5 className="text-xs font-medium text-muted-foreground">Connected Entities</h5>

        {graphData.nodes.slice(1, 6).map(
          (
            node: any // Skip center node, show 5 connected
          ) => (
            <div key={node.id} className="flex items-center gap-2 p-2 bg-muted/30 rounded">
              <EntityTypeIcon type={node.type} className="h-3 w-3" />
              <span className="text-xs flex-1 truncate">{node.title}</span>
              <Badge variant="outline" className="text-xs">
                {node.type}
              </Badge>
            </div>
          )
        )}

        {graphData.nodes.length > 6 && (
          <div className="text-xs text-muted-foreground text-center">
            +{graphData.nodes.length - 6} more entities
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Main Backlinks Panel Component
 */
export function BacklinksPanel() {
  const {
    selectedEntity,
    backlinks,
    searchQuery,
    setSearchQuery,
    selectedEntityType,
    setSelectedEntityType,
    graphView,
    setGraphView,
    graphData,
    selectEntity,
    createLink,
    searchEntities,
    backlinksEnabled,
    stats,
  } = useBacklinksPanel();

  if (!backlinksEnabled) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <div className="text-center space-y-2">
          <Network className="h-8 w-8 text-muted-foreground mx-auto" />
          <h3 className="text-sm font-semibold">Backlinks Panel</h3>
          <p className="text-xs text-muted-foreground">Feature flag disabled</p>
          <Badge variant="outline" className="text-xs">
            dock.backlinksPanel
          </Badge>
        </div>
      </div>
    );
  }

  if (!selectedEntity) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-4 border-b border-border">
          <h4 className="text-sm font-semibold">Backlinks & Relations</h4>
          <p className="text-xs text-muted-foreground mt-1">
            Select an entity to view its relationships
          </p>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Network className="h-8 w-8 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">No entity selected</p>

            {/* System stats */}
            <div className="bg-muted/50 p-3 rounded-lg text-xs space-y-1">
              <div className="font-medium">System Statistics</div>
              <div>Entities: {stats.entities.total}</div>
              <div>Links: {stats.links.total}</div>
              <div>Avg Links/Entity: {stats.links.averagePerEntity}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Panel header */}
      <div className="p-4 border-b border-border space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold">Backlinks</h4>

          <div className="flex gap-1">
            <Button
              variant={!graphView ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => setGraphView(false)}
              className="h-6 px-2 text-xs"
            >
              List
            </Button>
            <Button
              variant={graphView ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => setGraphView(true)}
              className="h-6 px-2 text-xs"
            >
              Graph
            </Button>
          </div>
        </div>

        {/* Selected entity info */}
        <div className="flex items-center gap-2 p-2 bg-muted/30 rounded">
          <EntityTypeIcon type={selectedEntity.type} className="h-4 w-4" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{selectedEntity.title}</div>
            <div className="text-xs text-muted-foreground">
              {backlinks?.metrics.totalConnections || 0} connections
            </div>
          </div>
        </div>

        {/* Search and filters */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <Input
              placeholder="Search links..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-7 text-xs"
            />
          </div>

          <div className="flex gap-1 flex-wrap">
            <Button
              variant={selectedEntityType === null ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => setSelectedEntityType(null)}
              className="h-6 px-2 text-xs"
            >
              All
            </Button>
            {['event', 'task', 'note', 'contact'].map((type) => (
              <Button
                key={type}
                variant={selectedEntityType === type ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => setSelectedEntityType(type)}
                className="h-6 px-2 text-xs"
              >
                {type}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Panel content */}
      <ScrollArea className="flex-1">
        {graphView ? (
          <div className="p-4">
            <SimpleGraphView graphData={graphData} />
          </div>
        ) : (
          <div className="p-3 space-y-4">
            {/* Incoming links (backlinks) */}
            {backlinks && backlinks.incomingLinks.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h5 className="text-xs font-medium text-muted-foreground">
                    Incoming Links ({backlinks.incomingLinks.length})
                  </h5>
                </div>

                {backlinks.incomingLinks.map((link) => (
                  <BacklinkItem
                    key={link.id}
                    link={link}
                    direction="incoming"
                    onSelect={selectEntity}
                  />
                ))}
              </div>
            )}

            {/* Outgoing links */}
            {backlinks && backlinks.outgoingLinks.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h5 className="text-xs font-medium text-muted-foreground">
                    Outgoing Links ({backlinks.outgoingLinks.length})
                  </h5>
                </div>

                {backlinks.outgoingLinks.map((link) => (
                  <BacklinkItem
                    key={link.id}
                    link={link}
                    direction="outgoing"
                    onSelect={selectEntity}
                  />
                ))}
              </div>
            )}

            {/* Related entities */}
            {backlinks && backlinks.relatedEntities.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h5 className="text-xs font-medium text-muted-foreground">
                    Related Entities ({backlinks.relatedEntities.length})
                  </h5>
                </div>

                {backlinks.relatedEntities.slice(0, 5).map((related, index) => (
                  <Card key={index} className="cursor-pointer hover:shadow-sm transition-all">
                    <CardContent className="p-2">
                      <div className="flex items-center gap-2">
                        <EntityTypeIcon type={related.entity.type} className="h-3 w-3" />
                        <span className="text-xs flex-1 truncate">{related.entity.title}</span>
                        <Badge variant="outline" className="text-xs">
                          {(related.strength * 100).toFixed(0)}%
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Empty state */}
            {(!backlinks ||
              (backlinks.incomingLinks.length === 0 && backlinks.outgoingLinks.length === 0)) && (
              <div className="text-center py-8">
                <Network className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm font-medium">No Links Found</p>
                <p className="text-xs text-muted-foreground mt-1">
                  This entity has no connections yet
                </p>

                <Button
                  size="sm"
                  className="mt-3"
                  onClick={() => {
                    // TODO: Open link creation dialog
                    console.log('Create new link');
                  }}
                >
                  <Zap className="h-3 w-3 mr-1" />
                  Create Link
                </Button>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Panel footer - Metrics */}
      {backlinks && (
        <div className="border-t border-border p-3">
          <div className="text-xs text-muted-foreground space-y-1">
            <div className="flex justify-between">
              <span>Total Connections:</span>
              <span>{backlinks.metrics.totalConnections}</span>
            </div>
            <div className="flex justify-between">
              <span>Centrality Score:</span>
              <span>{(backlinks.metrics.centralityScore * 100).toFixed(0)}%</span>
            </div>
            <div className="flex justify-between">
              <span>Graph Updated:</span>
              <span>{new Date(backlinks.calculatedAt).toLocaleTimeString()}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BacklinksPanel;
