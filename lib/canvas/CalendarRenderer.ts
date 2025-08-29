import type { Event } from '@/types/calendar';

interface RenderContext {
  gridCanvas: HTMLCanvasElement;
  eventsCanvas: HTMLCanvasElement;
  interactionCanvas: HTMLCanvasElement;
  ctx: {
    grid: CanvasRenderingContext2D;
    events: CanvasRenderingContext2D;
    interaction: CanvasRenderingContext2D;
  };
}

interface EventRenderObject {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  title: string;
  event: Event;
}

interface RenderOptions {
  cellWidth: number;
  cellHeight: number;
  monthHeaderHeight: number;
  fontSize: number;
  padding: number;
}

export class CalendarRenderer {
  private container: HTMLElement;
  private gridCanvas!: HTMLCanvasElement;
  private eventsCanvas!: HTMLCanvasElement;
  private interactionCanvas!: HTMLCanvasElement;
  private ctx!: {
    grid: CanvasRenderingContext2D;
    events: CanvasRenderingContext2D;
    interaction: CanvasRenderingContext2D;
  };

  private offscreenCanvas?: OffscreenCanvas;
  private offscreenCtx?: OffscreenCanvasRenderingContext2D;
  private eventPool: EventRenderObject[] = [];
  private activeEvents: Map<string, EventRenderObject> = new Map();

  private options: RenderOptions = {
    cellWidth: 40,
    cellHeight: 36,
    monthHeaderHeight: 40,
    fontSize: 11,
    padding: 4,
  };

  private devicePixelRatio = 1;
  private isRendering = false;
  private renderQueue: (() => void)[] = [];
  private rafId: number | null = null;

  constructor(container: HTMLElement, options?: Partial<RenderOptions>) {
    this.container = container;
    if (options) {
      this.options = { ...this.options, ...options };
    }
    this.devicePixelRatio = window.devicePixelRatio || 1;
    this.setupCanvases();
    this.initializeOffscreenRendering();
  }

  private setupCanvases() {
    // Clear container
    this.container.innerHTML = '';
    this.container.style.position = 'relative';

    // Create context object
    this.ctx = {
      grid: null as any,
      events: null as any,
      interaction: null as any,
    };

    // Create three stacked canvases
    const layers = [
      { name: 'grid', zIndex: 1, interactive: false },
      { name: 'events', zIndex: 2, interactive: false },
      { name: 'interaction', zIndex: 3, interactive: true },
    ];

    layers.forEach((layer) => {
      const canvas = document.createElement('canvas');
      canvas.style.position = 'absolute';
      canvas.style.top = '0';
      canvas.style.left = '0';
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.zIndex = layer.zIndex.toString();

      // GPU acceleration
      canvas.style.willChange = 'transform';
      canvas.style.transform = 'translateZ(0)';

      // Pointer events
      canvas.style.pointerEvents = layer.interactive ? 'auto' : 'none';

      // High DPI support
      const rect = this.container.getBoundingClientRect();
      canvas.width = rect.width * this.devicePixelRatio;
      canvas.height = rect.height * this.devicePixelRatio;

      this.container.appendChild(canvas);

      // Store reference
      this[`${layer.name}Canvas` as keyof this] = canvas as any;

      // Get context with optimizations
      const ctx = canvas.getContext('2d', {
        alpha: layer.name !== 'grid',
        desynchronized: true,
        willReadFrequently: false,
      })!;

      // Scale for high DPI
      ctx.scale(this.devicePixelRatio, this.devicePixelRatio);

      this.ctx[layer.name as keyof typeof this.ctx] = ctx;
    });

    // Render static grid once
    this.renderGrid();
  }

  private initializeOffscreenRendering() {
    if (typeof OffscreenCanvas !== 'undefined') {
      const rect = this.container.getBoundingClientRect();
      this.offscreenCanvas = new OffscreenCanvas(
        rect.width * this.devicePixelRatio,
        rect.height * this.devicePixelRatio
      );
      this.offscreenCtx = this.offscreenCanvas.getContext('2d')!;
      this.offscreenCtx.scale(this.devicePixelRatio, this.devicePixelRatio);
    }
  }

  private renderGrid() {
    const ctx = this.ctx.grid;
    const rect = this.container.getBoundingClientRect();

    ctx.clearRect(0, 0, rect.width, rect.height);

    // Save context
    ctx.save();

    // Set styles
    ctx.strokeStyle = '#e5e5e5';
    ctx.lineWidth = 1;
    ctx.font = `${this.options.fontSize}px system-ui, -apple-system, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Draw month grid (12 rows)
    for (let month = 0; month < 12; month++) {
      const y = month * (this.options.monthHeaderHeight + 6 * this.options.cellHeight);

      // Month header background
      ctx.fillStyle = '#f5f5f5';
      ctx.fillRect(0, y, rect.width, this.options.monthHeaderHeight);

      // Month grid cells (6 weeks × 7 days)
      for (let week = 0; week < 6; week++) {
        for (let day = 0; day < 7; day++) {
          const cellX = day * this.options.cellWidth;
          const cellY = y + this.options.monthHeaderHeight + week * this.options.cellHeight;

          // Draw cell border
          ctx.strokeRect(cellX, cellY, this.options.cellWidth, this.options.cellHeight);

          // Weekend shading
          if (day === 0 || day === 6) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.02)';
            ctx.fillRect(cellX, cellY, this.options.cellWidth, this.options.cellHeight);
          }
        }
      }
    }

    ctx.restore();
  }

  public renderMonth(month: number, events: Event[]) {
    if (this.isRendering) {
      // Queue render if already rendering
      this.renderQueue.push(() => this.renderMonth(month, events));
      return;
    }

    this.isRendering = true;

    // Use requestAnimationFrame for smooth rendering
    this.rafId = requestAnimationFrame(() => {
      this.clearEventLayer(month);

      // Batch render events
      const renderBatch = events.slice(0, 100);
      this.renderEventBatch(month, renderBatch);

      if (events.length > 100) {
        // Schedule remaining events
        requestIdleCallback(
          () => {
            this.renderEventBatch(month, events.slice(100));
          },
          { timeout: 100 }
        );
      }

      this.isRendering = false;

      // Process queued renders
      if (this.renderQueue.length > 0) {
        const nextRender = this.renderQueue.shift();
        nextRender?.();
      }
    });
  }

  private clearEventLayer(month: number) {
    const ctx = this.ctx.events;
    const rect = this.container.getBoundingClientRect();
    const y = month * (this.options.monthHeaderHeight + 6 * this.options.cellHeight);
    const height = this.options.monthHeaderHeight + 6 * this.options.cellHeight;

    ctx.clearRect(0, y, rect.width, height);
  }

  private renderEventBatch(month: number, events: Event[]) {
    const ctx = this.offscreenCtx || this.ctx.events;
    ctx.save();

    // Set common styles
    ctx.font = `${this.options.fontSize - 2}px system-ui, -apple-system, sans-serif`;
    ctx.textBaseline = 'middle';

    events.forEach((event) => {
      const renderObj = this.getEventRenderObject(event, month);
      if (renderObj) {
        this.drawEvent(ctx, renderObj);
        this.activeEvents.set(event.id, renderObj);
      }
    });

    // Copy offscreen to main canvas if using offscreen
    if (this.offscreenCtx && this.offscreenCanvas) {
      const imageData = this.offscreenCtx.getImageData(
        0,
        0,
        this.offscreenCanvas.width,
        this.offscreenCanvas.height
      );
      this.ctx.events.putImageData(imageData, 0, 0);
    }

    ctx.restore();
  }

  private getEventRenderObject(event: Event, month: number): EventRenderObject | null {
    // Calculate position based on event date
    const eventMonth = event.startDate.getMonth();
    if (eventMonth !== month) return null;

    const day = event.startDate.getDate();
    const dayOfWeek = event.startDate.getDay();
    const weekOfMonth = Math.floor((day - 1) / 7);

    const x = dayOfWeek * this.options.cellWidth + this.options.padding;
    const y =
      month * (this.options.monthHeaderHeight + 6 * this.options.cellHeight) +
      this.options.monthHeaderHeight +
      weekOfMonth * this.options.cellHeight +
      this.options.padding;

    // Calculate duration width
    const duration =
      Math.ceil((event.endDate.getTime() - event.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const width = Math.min(
      duration * this.options.cellWidth - this.options.padding * 2,
      7 * this.options.cellWidth
    );
    const height = this.options.cellHeight / 4;

    // Get color based on category
    const colors: Record<Event['category'], string> = {
      personal: '#10b981',
      work: '#3b82f6',
      effort: '#f97316',
      note: '#a855f7',
    };

    // Try to reuse from pool
    let renderObj = this.eventPool.pop();

    if (!renderObj) {
      renderObj = {
        id: event.id,
        x,
        y,
        width,
        height,
        color: colors[event.category],
        title: event.title,
        event,
      };
    } else {
      // Update pooled object
      renderObj.id = event.id;
      renderObj.x = x;
      renderObj.y = y;
      renderObj.width = width;
      renderObj.height = height;
      renderObj.color = colors[event.category];
      renderObj.title = event.title;
      renderObj.event = event;
    }

    return renderObj;
  }

  private drawEvent(ctx: CanvasRenderingContext2D, renderObj: EventRenderObject) {
    // Draw event bar
    ctx.fillStyle = renderObj.color;
    ctx.fillRect(renderObj.x, renderObj.y, renderObj.width, renderObj.height);

    // Draw event title if space permits
    if (renderObj.width > 30) {
      ctx.fillStyle = '#ffffff';
      ctx.font = `${this.options.fontSize - 3}px system-ui, -apple-system, sans-serif`;

      // Truncate text if needed
      const maxWidth = renderObj.width - 4;
      let text = renderObj.title;

      if (ctx.measureText(text).width > maxWidth) {
        while (text.length > 0 && ctx.measureText(`${text}...`).width > maxWidth) {
          text = text.slice(0, -1);
        }
        text += '...';
      }

      ctx.fillText(text, renderObj.x + 2, renderObj.y + renderObj.height / 2);
    }
  }

  private releaseEventRenderObject(renderObj: EventRenderObject) {
    // Return to pool for reuse
    if (this.eventPool.length < 1000) {
      this.eventPool.push(renderObj);
    }
  }

  public handleInteraction(x: number, y: number, type: 'hover' | 'click'): Event | null {
    // Clear interaction layer
    const ctx = this.ctx.interaction;
    const rect = this.container.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);

    // Find event at position
    for (const [_id, renderObj] of this.activeEvents) {
      if (
        x >= renderObj.x &&
        x <= renderObj.x + renderObj.width &&
        y >= renderObj.y &&
        y <= renderObj.y + renderObj.height
      ) {
        // Highlight on interaction layer
        ctx.save();
        ctx.strokeStyle = type === 'hover' ? '#6b7280' : '#2563eb';
        ctx.lineWidth = 2;
        ctx.strokeRect(renderObj.x - 1, renderObj.y - 1, renderObj.width + 2, renderObj.height + 2);
        ctx.restore();

        return renderObj.event;
      }
    }

    return null;
  }

  public resize() {
    const rect = this.container.getBoundingClientRect();

    // Resize all canvases
    [this.gridCanvas, this.eventsCanvas, this.interactionCanvas].forEach((canvas) => {
      canvas.width = rect.width * this.devicePixelRatio;
      canvas.height = rect.height * this.devicePixelRatio;
    });

    // Re-scale contexts
    Object.values(this.ctx).forEach((ctx) => {
      ctx.scale(this.devicePixelRatio, this.devicePixelRatio);
    });

    // Redraw grid
    this.renderGrid();

    // Re-initialize offscreen canvas
    this.initializeOffscreenRendering();
  }

  public destroy() {
    // Cancel pending renders
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }
    // Clear canvases
    [this.gridCanvas, this.eventsCanvas, this.interactionCanvas].forEach((canvas) => {
      canvas.remove();
    });

    // Clear references
    this.activeEvents.clear();
    this.eventPool = [];
    this.renderQueue = [];
  }
}
