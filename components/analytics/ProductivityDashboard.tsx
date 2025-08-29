'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { Event } from '@/types/calendar';
import * as d3 from 'd3';
import {
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  getDayOfYear,
  startOfMonth,
} from 'date-fns';
import { motion } from 'framer-motion';
import {
  Activity,
  BarChart3,
  Calendar,
  Download,
  Filter,
  PieChart,
  Target,
  TrendingUp,
} from 'lucide-react';
import React, { useEffect, useRef, useMemo } from 'react';

interface ProductivityDashboardProps {
  events: Event[];
  year: number;
  className?: string;
}

interface DayData {
  date: Date;
  events: Event[];
  count: number;
  categories: Record<string, number>;
  productivity: number;
}

export function ProductivityDashboard({ events, year, className }: ProductivityDashboardProps) {
  const heatmapRef = useRef<SVGSVGElement>(null);
  const trendsRef = useRef<SVGSVGElement>(null);
  const categoryRef = useRef<SVGSVGElement>(null);

  // Process event data for visualizations
  const analyticsData = useMemo(() => {
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year, 11, 31);
    const allDays = eachDayOfInterval({ start: yearStart, end: yearEnd });

    // Create day-by-day data
    const dayData: DayData[] = allDays.map((date) => {
      const dayEvents = events.filter((event) => {
        const eventStart = new Date(event.startDate);
        const eventEnd = new Date(event.endDate);
        return date >= eventStart && date <= eventEnd;
      });

      const categories = dayEvents.reduce(
        (acc, event) => {
          acc[event.category] = (acc[event.category] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      // Calculate productivity score (weighted by category)
      const categoryWeights = {
        work: 3,
        effort: 2,
        personal: 1,
        note: 0.5,
      };

      const productivity = dayEvents.reduce((score, event) => {
        const weight = categoryWeights[event.category as keyof typeof categoryWeights] || 1;
        return score + weight;
      }, 0);

      return {
        date,
        events: dayEvents,
        count: dayEvents.length,
        categories,
        productivity,
      };
    });

    // Monthly summaries
    const monthlyData = Array.from({ length: 12 }, (_, monthIndex) => {
      const monthStart = startOfMonth(new Date(year, monthIndex, 1));
      const monthEnd = endOfMonth(monthStart);
      const monthDays = dayData.filter((day) => day.date >= monthStart && day.date <= monthEnd);

      return {
        month: monthIndex,
        monthName: format(monthStart, 'MMM'),
        totalEvents: monthDays.reduce((sum, day) => sum + day.count, 0),
        avgProductivity:
          monthDays.reduce((sum, day) => sum + day.productivity, 0) / monthDays.length,
        categories: monthDays.reduce(
          (acc, day) => {
            Object.entries(day.categories).forEach(([category, count]) => {
              acc[category] = (acc[category] || 0) + count;
            });
            return acc;
          },
          {} as Record<string, number>
        ),
      };
    });

    // Category totals
    const categoryTotals = events.reduce(
      (acc, event) => {
        acc[event.category] = (acc[event.category] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      dayData,
      monthlyData,
      categoryTotals,
      maxDayEvents: Math.max(...dayData.map((d) => d.count), 1),
      maxProductivity: Math.max(...dayData.map((d) => d.productivity), 1),
      totalEvents: events.length,
      avgEventsPerDay: events.length / 365,
      mostProductiveDay: dayData.reduce(
        (max, day) => (day.productivity > max.productivity ? day : max),
        dayData[0]
      ),
    };
  }, [events, year]);

  // D3.js Heatmap Visualization
  useEffect(() => {
    if (!heatmapRef.current) return;

    const svg = d3.select(heatmapRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 20, right: 20, bottom: 30, left: 40 };
    const width = 800 - margin.left - margin.right;
    const height = 200 - margin.top - margin.bottom;

    const g = svg
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Color scale
    const colorScale = d3
      .scaleSequential(d3.interpolateViridis)
      .domain([0, analyticsData.maxProductivity]);

    // Create heatmap
    const cellWidth = width / 53; // 53 weeks in a year
    const cellHeight = height / 7; // 7 days in a week

    analyticsData.dayData.forEach((day) => {
      const week = Math.floor(getDayOfYear(day.date) / 7);
      const weekday = getDay(day.date);

      g.append('rect')
        .attr('x', week * cellWidth)
        .attr('y', weekday * cellHeight)
        .attr('width', cellWidth - 1)
        .attr('height', cellHeight - 1)
        .attr('fill', colorScale(day.productivity))
        .attr('rx', 2)
        .style('cursor', 'pointer')
        .on('mouseover', (event) => {
          // Tooltip
          d3.select('body')
            .append('div')
            .attr('class', 'tooltip')
            .style('opacity', 0)
            .style('position', 'absolute')
            .style('background', 'rgba(0,0,0,0.8)')
            .style('color', 'white')
            .style('padding', '8px')
            .style('border-radius', '4px')
            .style('font-size', '12px')
            .style('pointer-events', 'none')
            .style('left', `${event.pageX + 10}px`)
            .style('top', `${event.pageY - 10}px`)
            .transition()
            .duration(200)
            .style('opacity', 1)
            .text(
              `${format(day.date, 'MMM d')}: ${day.count} events (${day.productivity.toFixed(1)} productivity)`
            );
        })
        .on('mouseout', () => {
          d3.selectAll('.tooltip').remove();
        });
    });

    // Add legend
    const legendWidth = 200;
    const legendHeight = 10;
    const legendScale = d3
      .scaleLinear()
      .domain([0, analyticsData.maxProductivity])
      .range([0, legendWidth]);

    const legendAxis = d3.axisBottom(legendScale).ticks(5);

    const legend = g
      .append('g')
      .attr('transform', `translate(${width - legendWidth - 20}, ${height + 20})`);

    // Legend gradient
    const defs = svg.append('defs');
    const gradient = defs.append('linearGradient').attr('id', 'legend-gradient');

    gradient
      .selectAll('stop')
      .data(d3.range(0, 1.1, 0.1))
      .enter()
      .append('stop')
      .attr('offset', (d) => `${d * 100}%`)
      .attr('stop-color', (d) => d3.interpolateViridis(d));

    legend
      .append('rect')
      .attr('width', legendWidth)
      .attr('height', legendHeight)
      .style('fill', 'url(#legend-gradient)');

    legend.append('g').attr('transform', `translate(0, ${legendHeight})`).call(legendAxis);
  }, [analyticsData]);

  // D3.js Monthly Trends Chart
  useEffect(() => {
    if (!trendsRef.current) return;

    const svg = d3.select(trendsRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
    const width = 600 - margin.left - margin.right;
    const height = 200 - margin.top - margin.bottom;

    const g = svg
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const xScale = d3
      .scaleBand()
      .domain(analyticsData.monthlyData.map((d) => d.monthName))
      .range([0, width])
      .padding(0.1);

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(analyticsData.monthlyData, (d) => d.totalEvents) || 0])
      .range([height, 0]);

    // Bars
    g.selectAll('.bar')
      .data(analyticsData.monthlyData)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', (d) => xScale(d.monthName)!)
      .attr('y', (d) => yScale(d.totalEvents))
      .attr('width', xScale.bandwidth())
      .attr('height', (d) => height - yScale(d.totalEvents))
      .attr('fill', 'hsl(var(--primary))')
      .attr('rx', 4);

    // Axes
    g.append('g').attr('transform', `translate(0,${height})`).call(d3.axisBottom(xScale));

    g.append('g').call(d3.axisLeft(yScale));
  }, [analyticsData]);

  // D3.js Category Pie Chart
  useEffect(() => {
    if (!categoryRef.current) return;

    const svg = d3.select(categoryRef.current);
    svg.selectAll('*').remove();

    const width = 250;
    const height = 250;
    const radius = Math.min(width, height) / 2;

    const g = svg
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`);

    const color = d3
      .scaleOrdinal()
      .domain(Object.keys(analyticsData.categoryTotals))
      .range([
        'hsl(var(--primary))',
        'hsl(var(--secondary))',
        'hsl(var(--accent))',
        'hsl(var(--muted))',
      ]);

    const pie = d3.pie<[string, number]>().value((d) => d[1]);

    const arc = d3
      .arc<d3.PieArcDatum<[string, number]>>()
      .innerRadius(0)
      .outerRadius(radius - 10);

    const arcs = g
      .selectAll('.arc')
      .data(pie(Object.entries(analyticsData.categoryTotals)))
      .enter()
      .append('g')
      .attr('class', 'arc');

    arcs
      .append('path')
      .attr('d', arc)
      .attr('fill', (d) => color(d.data[0]) as string)
      .style('cursor', 'pointer');

    arcs
      .append('text')
      .attr('transform', (d) => `translate(${arc.centroid(d)})`)
      .attr('text-anchor', 'middle')
      .text((d) => d.data[0])
      .style('font-size', '12px')
      .style('fill', 'white');
  }, [analyticsData]);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Badge variant="secondary">{analyticsData.totalEvents}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.totalEvents}</div>
            <p className="text-xs text-muted-foreground">Total Events</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <Badge variant="secondary">{analyticsData.avgEventsPerDay.toFixed(1)}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.avgEventsPerDay.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">Avg Per Day</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Target className="h-4 w-4 text-muted-foreground" />
              <Badge variant="secondary">
                {analyticsData.mostProductiveDay.productivity.toFixed(1)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {format(analyticsData.mostProductiveDay.date, 'MMM d')}
            </div>
            <p className="text-xs text-muted-foreground">Most Productive</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <Badge variant="secondary">{Object.keys(analyticsData.categoryTotals).length}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.keys(analyticsData.categoryTotals).length}
            </div>
            <p className="text-xs text-muted-foreground">Categories</p>
          </CardContent>
        </Card>
      </div>

      {/* Productivity Heatmap */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Productivity Heatmap
          </CardTitle>
          <CardDescription>
            Daily activity visualization showing event density and productivity patterns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <svg ref={heatmapRef} className="w-full" style={{ minWidth: '800px' }} />
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Monthly Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Monthly Trends
            </CardTitle>
            <CardDescription>Event distribution across months</CardDescription>
          </CardHeader>
          <CardContent>
            <svg ref={trendsRef} className="w-full" />
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Category Distribution
            </CardTitle>
            <CardDescription>Breakdown of events by category</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <svg ref={categoryRef} />
          </CardContent>
        </Card>
      </div>

      {/* Export Actions */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" disabled>
          <Download className="h-4 w-4 mr-2" />
          Export Data
        </Button>
        <Button variant="outline" size="sm" disabled>
          <Filter className="h-4 w-4 mr-2" />
          Filter Period
        </Button>
      </div>
    </div>
  );
}
