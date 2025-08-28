/**
 * Entity Linking System - Relationship Management with Backlinks
 * Research validation: Obsidian backlinks patterns + entity relationship mapping
 * 
 * Key patterns implemented:
 * - Bidirectional entity linking with automatic backlink calculation
 * - Visual knowledge graph with node interactions (Obsidian graph view)
 * - Drag-to-link functionality for intuitive relationship creation
 * - Cross-reference tracking with context preservation
 * - Entity mention detection and automatic linking suggestions
 */

/**
 * Entity interface for linking system
 */
export interface Entity {
  id: string
  type: 'event' | 'task' | 'note' | 'contact' | 'project' | 'email'
  title: string
  description?: string
  
  // Core entity data
  data: Record<string, any>
  
  // Metadata
  createdAt: string
  updatedAt: string
  createdBy: string
  
  // Tags and categorization
  tags: string[]
  category?: string
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  
  // Status tracking
  status: 'active' | 'completed' | 'archived' | 'deleted'
}

/**
 * Entity link interface (research: Obsidian link structure)
 */
export interface EntityLink {
  id: string
  
  // Link endpoints
  from: {
    type: Entity['type']
    id: string
    title: string
  }
  
  to: {
    type: Entity['type'] 
    id: string
    title: string
  }
  
  // Link metadata
  type: 'related' | 'depends_on' | 'part_of' | 'references' | 'mentions' | 'blocks' | 'custom'
  strength: number // 0.0-1.0 relationship strength
  bidirectional: boolean
  
  // Context information
  context?: {
    sourceText?: string // Text where link was mentioned
    creationMethod: 'manual' | 'automatic' | 'drag_drop' | 'mention_detection'
    confidence?: number // For automatic links
  }
  
  // Audit trail
  createdAt: string
  createdBy: string
  
  // Link metadata
  metadata?: Record<string, any>
}

/**
 * Backlink calculation result (research: Obsidian backlinks patterns)
 */
interface BacklinkGraph {
  entityId: string
  
  // Direct links
  outgoingLinks: EntityLink[]  // Links this entity creates
  incomingLinks: EntityLink[]  // Links pointing to this entity
  
  // Calculated relationships
  relatedEntities: Array<{
    entity: Entity
    relationshipType: string
    strength: number
    path: string[] // Entity IDs showing connection path
  }>
  
  // Graph metrics
  metrics: {
    totalConnections: number
    directConnections: number
    secondDegreeConnections: number
    centralityScore: number // How central this entity is in the graph
  }
  
  calculatedAt: string
}

/**
 * Entity Linking System Class
 * Implements comprehensive entity relationship management
 */
export class EntityLinkingSystem {
  private static entities: Map<string, Entity> = new Map()
  private static links: Map<string, EntityLink> = new Map()
  private static backlinkCache: Map<string, BacklinkGraph> = new Map()
  private static isProcessing = false
  
  /**
   * Register entity in the linking system
   */
  static registerEntity(entity: Entity): void {
    this.entities.set(entity.id, entity)
    
    // Clear backlink cache for recalculation
    this.invalidateBacklinkCache(entity.id)
    
    console.log(`🔗 Entity registered: ${entity.type}/${entity.id} - ${entity.title}`)
  }
  
  /**
   * Create link between entities with automatic backlink calculation
   */
  static async createLink(
    fromEntity: { type: string, id: string },
    toEntity: { type: string, id: string },
    linkType: EntityLink['type'] = 'related',
    metadata?: {
      context?: string
      creationMethod?: EntityLink['context']['creationMethod']
      bidirectional?: boolean
      strength?: number
    }
  ): Promise<{
    success: boolean
    linkId: string
    backlinksUpdated: string[]
  }> {
    console.log(`🔗 Creating link: ${fromEntity.type}/${fromEntity.id} → ${toEntity.type}/${toEntity.id}`)
    
    try {
      // Validate entities exist
      const fromEntityData = this.entities.get(fromEntity.id)
      const toEntityData = this.entities.get(toEntity.id)
      
      if (!fromEntityData || !toEntityData) {
        throw new Error('Cannot link non-existent entities')
      }
      
      // Create link
      const linkId = `link-${fromEntity.id}-${toEntity.id}-${Date.now()}`
      
      const link: EntityLink = {
        id: linkId,
        
        from: {
          type: fromEntity.type as Entity['type'],
          id: fromEntity.id,
          title: fromEntityData.title
        },
        
        to: {
          type: toEntity.type as Entity['type'],
          id: toEntity.id,
          title: toEntityData.title
        },
        
        type: linkType,
        strength: metadata?.strength || 0.5,
        bidirectional: metadata?.bidirectional !== false,
        
        context: {
          sourceText: metadata?.context,
          creationMethod: metadata?.creationMethod || 'manual',
          confidence: metadata?.creationMethod === 'automatic' ? 0.8 : 1.0
        },
        
        createdAt: new Date().toISOString(),
        createdBy: 'user', // TODO: Get actual user ID
        
        metadata: metadata || {}
      }
      
      this.links.set(linkId, link)
      
      // Update backlinks for both entities
      const updatedBacklinks = await this.recalculateBacklinks([fromEntity.id, toEntity.id])
      
      console.log(`✅ Link created: ${linkId}`)
      
      return {
        success: true,
        linkId,
        backlinksUpdated: updatedBacklinks
      }
      
    } catch (error) {
      console.error('Failed to create link:', error)
      return {
        success: false,
        linkId: '',
        backlinksUpdated: []
      }
    }
  }
  
  /**
   * Calculate backlinks for entity (research: Obsidian backlinks calculation)
   */
  static async calculateBacklinks(entityId: string): Promise<BacklinkGraph> {
    console.log(`🔍 Calculating backlinks for: ${entityId}`)
    
    const entity = this.entities.get(entityId)
    
    if (!entity) {
      throw new Error(`Entity not found: ${entityId}`)
    }
    
    // Find all links involving this entity
    const allLinks = Array.from(this.links.values())
    
    const outgoingLinks = allLinks.filter(link => link.from.id === entityId)
    const incomingLinks = allLinks.filter(link => link.to.id === entityId)
    
    // Calculate related entities (direct connections)
    const relatedEntityIds = new Set([
      ...outgoingLinks.map(link => link.to.id),
      ...incomingLinks.map(link => link.from.id)
    ])
    
    const relatedEntities = Array.from(relatedEntityIds)
      .map(id => this.entities.get(id))
      .filter(Boolean)
      .map(entity => ({
        entity: entity!,
        relationshipType: 'direct',
        strength: 0.8,
        path: [entityId, entity!.id]
      }))
    
    // Calculate centrality score (how connected this entity is)
    const totalConnections = outgoingLinks.length + incomingLinks.length
    const centralityScore = Math.min(totalConnections / 10, 1.0) // Normalized to 0-1
    
    const backlinkGraph: BacklinkGraph = {
      entityId,
      outgoingLinks,
      incomingLinks,
      relatedEntities,
      
      metrics: {
        totalConnections,
        directConnections: relatedEntityIds.size,
        secondDegreeConnections: 0, // TODO: Calculate second-degree connections
        centralityScore
      },
      
      calculatedAt: new Date().toISOString()
    }
    
    // Cache backlink result
    this.backlinkCache.set(entityId, backlinkGraph)
    
    return backlinkGraph
  }
  
  /**
   * Detect entity mentions in text and suggest automatic links
   * Research pattern: Obsidian automatic mention detection
   */
  static detectEntityMentions(
    text: string,
    sourceEntityId: string
  ): Promise<Array<{
    mentionedEntity: Entity
    context: string
    confidence: number
    suggestedLinkType: EntityLink['type']
    autoLinkable: boolean
  }>> {
    console.log(`🔍 Detecting entity mentions in text...`)
    
    const mentions: any[] = []
    const allEntities = Array.from(this.entities.values())
    
    // Simple mention detection (could be enhanced with NLP)
    allEntities.forEach(entity => {
      // Skip self-references
      if (entity.id === sourceEntityId) return
      
      // Check for entity title mentions
      const titleRegex = new RegExp(`\\b${entity.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi')
      const titleMatches = text.match(titleRegex)
      
      if (titleMatches) {
        // Find context around mention
        const mentionIndex = text.toLowerCase().indexOf(entity.title.toLowerCase())
        const contextStart = Math.max(0, mentionIndex - 50)
        const contextEnd = Math.min(text.length, mentionIndex + entity.title.length + 50)
        const context = text.slice(contextStart, contextEnd)
        
        mentions.push({
          mentionedEntity: entity,
          context,
          confidence: 0.8, // High confidence for title matches
          suggestedLinkType: this.suggestLinkType(sourceEntityId, entity.id),
          autoLinkable: true
        })
      }
    })
    
    return Promise.resolve(mentions.slice(0, 10)) // Limit to 10 suggestions
  }
  
  /**
   * Drag-to-link functionality (research: intuitive relationship creation)
   */
  static async handleDragToLink(
    draggedEntityId: string,
    targetEntityId: string,
    dropContext: {
      dropZone: 'details_panel' | 'note_editor' | 'calendar_event'
      position?: { x: number, y: number }
      modifierKeys?: string[]
    }
  ): Promise<{
    linkCreated: boolean
    linkId?: string
    linkType: EntityLink['type']
  }> {
    console.log(`🎯 Drag-to-link: ${draggedEntityId} → ${targetEntityId}`)
    
    // Determine link type based on drop context
    const linkType = this.determineLinkTypeFromContext(draggedEntityId, targetEntityId, dropContext)
    
    // Create link automatically for drag-drop (high confidence interaction)
    const result = await this.createLink(
      { type: 'unknown', id: draggedEntityId },
      { type: 'unknown', id: targetEntityId },
      linkType,
      {
        creationMethod: 'drag_drop',
        bidirectional: true,
        strength: 0.9 // High strength for intentional drag-drop
      }
    )
    
    return {
      linkCreated: result.success,
      linkId: result.linkId,
      linkType
    }
  }
  
  /**
   * Get entity graph visualization data (research: Obsidian graph view)
   */
  static getEntityGraph(
    centerEntityId?: string,
    maxDepth: number = 2,
    filters: {
      entityTypes?: Entity['type'][]
      linkTypes?: EntityLink['type'][]
      minStrength?: number
    } = {}
  ): {
    nodes: Array<{
      id: string
      type: Entity['type']
      title: string
      size: number // Based on connection count
      color: string
      position?: { x: number, y: number }
    }>
    edges: Array<{
      id: string
      from: string
      to: string
      type: EntityLink['type']
      strength: number
      bidirectional: boolean
    }>
    center: string | null
    stats: {
      totalNodes: number
      totalEdges: number
      maxDepth: number
    }
  } {
    const allEntities = Array.from(this.entities.values())
    const allLinks = Array.from(this.links.values())
    
    // Apply filters
    const filteredEntities = allEntities.filter(entity => {
      if (filters.entityTypes && !filters.entityTypes.includes(entity.type)) return false
      return true
    })
    
    const filteredLinks = allLinks.filter(link => {
      if (filters.linkTypes && !filters.linkTypes.includes(link.type)) return false
      if (filters.minStrength && link.strength < filters.minStrength) return false
      return true
    })
    
    // Convert to graph visualization format
    const nodes = filteredEntities.map(entity => {
      const connectionCount = filteredLinks.filter(link => 
        link.from.id === entity.id || link.to.id === entity.id
      ).length
      
      return {
        id: entity.id,
        type: entity.type,
        title: entity.title,
        size: Math.max(connectionCount * 10, 20), // Size based on connections
        color: this.getEntityColor(entity.type)
      }
    })
    
    const edges = filteredLinks.map(link => ({
      id: link.id,
      from: link.from.id,
      to: link.to.id,
      type: link.type,
      strength: link.strength,
      bidirectional: link.bidirectional
    }))
    
    return {
      nodes,
      edges,
      center: centerEntityId || null,
      stats: {
        totalNodes: nodes.length,
        totalEdges: edges.length,
        maxDepth
      }
    }
  }
  
  // Utility methods
  private static invalidateBacklinkCache(entityId: string): void {
    this.backlinkCache.delete(entityId)
    
    // Also invalidate cache for linked entities
    const relatedLinks = Array.from(this.links.values()).filter(link =>
      link.from.id === entityId || link.to.id === entityId
    )
    
    relatedLinks.forEach(link => {
      this.backlinkCache.delete(link.from.id)
      this.backlinkCache.delete(link.to.id)
    })
  }
  
  private static async recalculateBacklinks(entityIds: string[]): Promise<string[]> {
    const updated: string[] = []
    
    for (const entityId of entityIds) {
      await this.calculateBacklinks(entityId)
      updated.push(entityId)
    }
    
    return updated
  }
  
  private static suggestLinkType(fromEntityId: string, toEntityId: string): EntityLink['type'] {
    const fromEntity = this.entities.get(fromEntityId)
    const toEntity = this.entities.get(toEntityId)
    
    if (!fromEntity || !toEntity) return 'related'
    
    // Suggest link type based on entity types
    if (fromEntity.type === 'task' && toEntity.type === 'event') {
      return 'part_of'
    }
    
    if (fromEntity.type === 'note' && toEntity.type === 'event') {
      return 'references'
    }
    
    if (fromEntity.type === 'email' && (toEntity.type === 'task' || toEntity.type === 'event')) {
      return 'depends_on'
    }
    
    return 'related'
  }
  
  private static determineLinkTypeFromContext(
    draggedEntityId: string,
    targetEntityId: string,
    context: any
  ): EntityLink['type'] {
    // Determine link type based on drop context
    switch (context.dropZone) {
      case 'details_panel':
        return 'references'
      case 'note_editor':
        return 'mentions'
      case 'calendar_event':
        return 'part_of'
      default:
        return 'related'
    }
  }
  
  private static getEntityColor(type: Entity['type']): string {
    const colorMap = {
      event: '#3b82f6',     // Blue
      task: '#10b981',      // Green
      note: '#8b5cf6',      // Purple
      contact: '#f59e0b',   // Orange
      project: '#ef4444',   // Red
      email: '#6b7280'      // Gray
    }
    
    return colorMap[type] || '#6b7280'
  }
  
  /**
   * Search entities for linking
   */
  static searchEntities(
    query: string,
    filters: {
      types?: Entity['type'][]
      excludeIds?: string[]
      limit?: number
    } = {}
  ): Entity[] {
    const entities = Array.from(this.entities.values())
    
    return entities
      .filter(entity => {
        // Type filter
        if (filters.types && !filters.types.includes(entity.type)) return false
        
        // Exclude filter
        if (filters.excludeIds && filters.excludeIds.includes(entity.id)) return false
        
        // Search filter
        if (query) {
          const searchText = `${entity.title} ${entity.description || ''}`.toLowerCase()
          return searchText.includes(query.toLowerCase())
        }
        
        return true
      })
      .slice(0, filters.limit || 20)
  }
  
  /**
   * Get entity linking statistics
   */
  static getLinkingStats() {
    const totalEntities = this.entities.size
    const totalLinks = this.links.size
    const avgLinksPerEntity = totalEntities > 0 ? totalLinks / totalEntities : 0
    
    // Entity type distribution
    const entityTypeCount = Array.from(this.entities.values()).reduce((acc, entity) => {
      acc[entity.type] = (acc[entity.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    // Link type distribution
    const linkTypeCount = Array.from(this.links.values()).reduce((acc, link) => {
      acc[link.type] = (acc[link.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    return {
      entities: {
        total: totalEntities,
        byType: entityTypeCount
      },
      links: {
        total: totalLinks,
        byType: linkTypeCount,
        averagePerEntity: avgLinksPerEntity.toFixed(2)
      },
      graph: {
        density: totalEntities > 1 ? (totalLinks / (totalEntities * (totalEntities - 1))) * 100 : 0,
        cacheHitRate: this.backlinkCache.size / Math.max(totalEntities, 1) * 100
      }
    }
  }
}

/**
 * Entity Linking Hook for React components
 */
export function useEntityLinking() {
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null)
  const [backlinks, setBacklinks] = useState<BacklinkGraph | null>(null)
  const [isLinking, setIsLinking] = useState(false)
  
  const createLink = async (from: any, to: any, type?: any, metadata?: any) => {
    setIsLinking(true)
    
    try {
      const result = await EntityLinkingSystem.createLink(from, to, type, metadata)
      
      // Update backlinks if link was created
      if (result.success && selectedEntity) {
        const updatedBacklinks = await EntityLinkingSystem.calculateBacklinks(selectedEntity.id)
        setBacklinks(updatedBacklinks)
      }
      
      return result
    } finally {
      setIsLinking(false)
    }
  }
  
  const selectEntity = async (entityId: string) => {
    const entity = EntityLinkingSystem['entities'].get(entityId)
    
    if (entity) {
      setSelectedEntity(entity)
      
      // Calculate backlinks for selected entity
      const entityBacklinks = await EntityLinkingSystem.calculateBacklinks(entityId)
      setBacklinks(entityBacklinks)
    }
  }
  
  const searchEntities = (query: string, filters?: any) => {
    return EntityLinkingSystem.searchEntities(query, filters)
  }
  
  const getEntityGraph = (centerEntityId?: string, maxDepth?: number, filters?: any) => {
    return EntityLinkingSystem.getEntityGraph(centerEntityId, maxDepth, filters)
  }
  
  return {
    selectedEntity,
    backlinks,
    isLinking,
    createLink,
    selectEntity,
    searchEntities,
    getEntityGraph,
    detectMentions: EntityLinkingSystem.detectEntityMentions.bind(EntityLinkingSystem),
    handleDragToLink: EntityLinkingSystem.handleDragToLink.bind(EntityLinkingSystem),
    getStats: EntityLinkingSystem.getLinkingStats.bind(EntityLinkingSystem)
  }
}