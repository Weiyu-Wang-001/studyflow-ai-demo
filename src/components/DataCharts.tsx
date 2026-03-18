import React, { useMemo } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { PieChart, BarChart, RadarChart } from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  RadarComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { Resource } from '../types';

echarts.use([
  PieChart,
  BarChart,
  RadarChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  RadarComponent,
  CanvasRenderer,
]);

const chartPanelSx = {
  borderRadius: '22px',
  p: 2.5,
  background: 'rgba(255,255,255,0.88)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.75)',
  boxShadow: '0 8px 28px rgba(15,23,42,0.06)',
  transition: 'box-shadow 0.25s ease, transform 0.25s ease',
  '&:hover': {
    boxShadow: '0 14px 36px rgba(15,23,42,0.11)',
    transform: 'translateY(-2px)',
  },
};

const labelSx = { color: '#71839c', fontWeight: 800, letterSpacing: '0.08em', fontSize: 11 };

interface DataChartsProps {
  resources: Resource[];
}

const DataCharts: React.FC<DataChartsProps> = ({ resources }) => {
  // 1. Resource type distribution - Donut
  const pieOption = useMemo(() => {
    const typeCount: Record<string, number> = {};
    resources.forEach((r) => { typeCount[r.type] = (typeCount[r.type] || 0) + 1; });
    const colorMap: Record<string, string> = {
      PDF: '#3b82f6', Slides: '#8b5cf6', Image: '#f59e0b',
      Link: '#10b981', Notes: '#64748b', Video: '#6366f1',
    };
    const data = Object.entries(typeCount).map(([name, value]) => ({
      name, value, itemStyle: { color: colorMap[name] || '#94a3b8' },
    }));
    return {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)',
        backgroundColor: 'rgba(255,255,255,0.96)',
        borderColor: '#e2e8f0',
        textStyle: { color: '#334155', fontSize: 13 },
        borderRadius: 12,
        padding: [10, 14],
        extraCssText: 'box-shadow: 0 8px 24px rgba(0,0,0,0.08);',
      },
      legend: {
        bottom: 0,
        itemWidth: 10,
        itemHeight: 10,
        itemGap: 14,
        textStyle: { fontSize: 11, color: '#64748b' },
      },
      series: [{
        type: 'pie',
        radius: ['44%', '72%'],
        center: ['50%', '42%'],
        avoidLabelOverlap: true,
        itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 3 },
        label: { show: false },
        emphasis: {
          scaleSize: 8,
          label: { show: true, fontWeight: 'bold', fontSize: 13, color: '#1e293b' },
          itemStyle: { shadowBlur: 16, shadowColor: 'rgba(0,0,0,0.12)' },
        },
        animationType: 'scale',
        animationEasing: 'elasticOut',
        data,
      }],
    };
  }, [resources]);

  // 2. Course progress - Gradient Bar
  const barOption = useMemo(() => {
    const courseProgress: Record<string, { total: number; count: number }> = {};
    resources.forEach((r) => {
      if (!courseProgress[r.course]) courseProgress[r.course] = { total: 0, count: 0 };
      courseProgress[r.course].total += r.progress;
      courseProgress[r.course].count += 1;
    });
    const courses = Object.keys(courseProgress);
    const avgValues = courses.map((c) => Math.round(courseProgress[c].total / courseProgress[c].count));
    const barColors = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#fb7185'];
    return {
      tooltip: {
        trigger: 'axis',
        formatter: '{b}<br/>Progress: <b>{c}%</b>',
        backgroundColor: 'rgba(255,255,255,0.96)',
        borderColor: '#e2e8f0',
        textStyle: { color: '#334155', fontSize: 13 },
        borderRadius: 12,
        padding: [10, 14],
        extraCssText: 'box-shadow: 0 8px 24px rgba(0,0,0,0.08);',
      },
      grid: { left: 8, right: 16, top: 12, bottom: 24, containLabel: true },
      xAxis: {
        type: 'category',
        data: courses,
        axisLabel: { fontSize: 10, color: '#94a3b8', rotate: 12 },
        axisLine: { lineStyle: { color: '#e2e8f0' } },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        max: 100,
        axisLabel: { fontSize: 10, color: '#cbd5e1', formatter: '{value}%' },
        splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
      },
      series: [{
        type: 'bar',
        data: avgValues.map((v, i) => ({
          value: v,
          itemStyle: {
            borderRadius: [8, 8, 0, 0],
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: barColors[i % barColors.length] },
              { offset: 1, color: barColors[i % barColors.length] + '66' },
            ]),
          },
        })),
        barWidth: 26,
        animationDelay: (idx: number) => idx * 120,
      }],
      animationEasing: 'cubicOut',
    };
  }, [resources]);

  // 3. Radar - Course dimension analysis
  const radarOption = useMemo(() => {
    const courseData: Record<string, { progress: number[]; count: number; favCount: number; tagCount: number }> = {};
    resources.forEach((r) => {
      if (!courseData[r.course]) courseData[r.course] = { progress: [], count: 0, favCount: 0, tagCount: 0 };
      courseData[r.course].progress.push(r.progress);
      courseData[r.course].count += 1;
      if (r.favorite) courseData[r.course].favCount += 1;
      courseData[r.course].tagCount += r.tags.length;
    });
    const courses = Object.keys(courseData);
    const indicator = [
      { name: 'Avg Progress', max: 100 },
      { name: 'Resources', max: Math.max(...courses.map((c) => courseData[c].count), 4) },
      { name: 'Favorites', max: Math.max(...courses.map((c) => courseData[c].favCount), 3) },
      { name: 'Tags', max: Math.max(...courses.map((c) => courseData[c].tagCount), 10) },
      { name: 'Completeness', max: 100 },
    ];
    const radarColors = ['rgba(59,130,246,0.7)', 'rgba(139,92,246,0.7)', 'rgba(16,185,129,0.7)', 'rgba(245,158,11,0.7)', 'rgba(251,113,133,0.7)'];
    const series = courses.map((c, i) => {
      const d = courseData[c];
      const avgP = Math.round(d.progress.reduce((a, b) => a + b, 0) / d.progress.length);
      const completeness = Math.round((d.progress.filter((p) => p >= 80).length / d.progress.length) * 100);
      return {
        value: [avgP, d.count, d.favCount, d.tagCount, completeness],
        name: c,
        lineStyle: { width: 2, color: radarColors[i % radarColors.length] },
        areaStyle: { color: radarColors[i % radarColors.length].replace('0.7', '0.12') },
        itemStyle: { color: radarColors[i % radarColors.length] },
      };
    });
    return {
      tooltip: {
        backgroundColor: 'rgba(255,255,255,0.96)',
        borderColor: '#e2e8f0',
        textStyle: { color: '#334155', fontSize: 12 },
        borderRadius: 12,
        padding: [10, 14],
        extraCssText: 'box-shadow: 0 8px 24px rgba(0,0,0,0.08);',
      },
      legend: {
        bottom: 0,
        itemWidth: 10,
        itemHeight: 10,
        textStyle: { fontSize: 10, color: '#64748b' },
      },
      radar: {
        indicator,
        radius: '58%',
        center: ['50%', '44%'],
        axisName: { color: '#94a3b8', fontSize: 10 },
        splitArea: { areaStyle: { color: ['rgba(241,245,249,0.5)', 'rgba(248,250,252,0.5)'] } },
        splitLine: { lineStyle: { color: '#e2e8f0' } },
        axisLine: { lineStyle: { color: '#e2e8f0' } },
      },
      series: [{ type: 'radar', data: series, animationDuration: 800 }],
    };
  }, [resources]);

  // 4. Tag heatmap - horizontal bar
  const tagBarOption = useMemo(() => {
    const tagCount: Record<string, number> = {};
    resources.forEach((r) => r.tags.forEach((t) => { tagCount[t] = (tagCount[t] || 0) + 1; }));
    const sorted = Object.entries(tagCount).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const tags = sorted.map(([t]) => t);
    const values = sorted.map(([, v]) => v);
    const maxVal = Math.max(...values, 1);
    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: '{b}: <b>{c}</b> resources',
        backgroundColor: 'rgba(255,255,255,0.96)',
        borderColor: '#e2e8f0',
        textStyle: { color: '#334155', fontSize: 13 },
        borderRadius: 12,
        padding: [10, 14],
        extraCssText: 'box-shadow: 0 8px 24px rgba(0,0,0,0.08);',
      },
      grid: { left: 6, right: 20, top: 8, bottom: 4, containLabel: true },
      xAxis: {
        type: 'value',
        max: maxVal + 1,
        axisLabel: { show: false },
        splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
        axisLine: { show: false },
      },
      yAxis: {
        type: 'category',
        data: tags.reverse(),
        axisLabel: { fontSize: 11, color: '#64748b' },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      series: [{
        type: 'bar',
        data: values.reverse().map((v, i) => ({
          value: v,
          itemStyle: {
            borderRadius: [0, 6, 6, 0],
            color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
              { offset: 0, color: '#818cf8' },
              { offset: 1, color: '#6366f1' },
            ]),
          },
          label: { show: true, position: 'right', formatter: '{c}', fontSize: 11, color: '#64748b' },
        })),
        barWidth: 16,
        animationDelay: (idx: number) => idx * 80,
      }],
      animationEasing: 'cubicOut',
    };
  }, [resources]);

  // 5. Status distribution - Nested donut
  const statusOption = useMemo(() => {
    const statusCount: Record<string, number> = {};
    resources.forEach((r) => { statusCount[r.status] = (statusCount[r.status] || 0) + 1; });
    const statusColors: Record<string, string> = {
      'Reviewing': '#3b82f6', 'Ready': '#10b981', 'Pinned': '#f59e0b',
      'Shared': '#8b5cf6', 'In Progress': '#06b6d4', 'Draft': '#94a3b8',
    };
    const data = Object.entries(statusCount).map(([name, value]) => ({
      name, value, itemStyle: { color: statusColors[name] || '#cbd5e1' },
    }));
    return {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)',
        backgroundColor: 'rgba(255,255,255,0.96)',
        borderColor: '#e2e8f0',
        textStyle: { color: '#334155', fontSize: 13 },
        borderRadius: 12,
        padding: [10, 14],
        extraCssText: 'box-shadow: 0 8px 24px rgba(0,0,0,0.08);',
      },
      legend: {
        bottom: 0,
        itemWidth: 8,
        itemHeight: 8,
        itemGap: 10,
        textStyle: { fontSize: 10, color: '#64748b' },
      },
      series: [{
        type: 'pie',
        radius: ['25%', '50%'],
        center: ['50%', '42%'],
        roseType: 'area',
        itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
        label: { show: false },
        emphasis: {
          label: { show: true, fontSize: 12, fontWeight: 'bold', color: '#1e293b' },
          itemStyle: { shadowBlur: 12, shadowColor: 'rgba(0,0,0,0.1)' },
        },
        animationType: 'scale',
        animationEasing: 'elasticOut',
        data,
      }],
    };
  }, [resources]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Donut - Type Distribution */}
      <Paper elevation={0} sx={chartPanelSx}>
        <Typography variant="overline" sx={labelSx}>
          Resource Type Distribution
        </Typography>
        <ReactEChartsCore echarts={echarts} option={pieOption} style={{ height: 220 }} opts={{ renderer: 'canvas' }} />
      </Paper>

      {/* Bar - Course Progress */}
      <Paper elevation={0} sx={chartPanelSx}>
        <Typography variant="overline" sx={labelSx}>
          Average Progress by Course
        </Typography>
        <ReactEChartsCore echarts={echarts} option={barOption} style={{ height: 200 }} opts={{ renderer: 'canvas' }} />
      </Paper>

      {/* Radar - Course Dimensions */}
      <Paper elevation={0} sx={chartPanelSx}>
        <Typography variant="overline" sx={labelSx}>
          Course Dimension Analysis
        </Typography>
        <ReactEChartsCore echarts={echarts} option={radarOption} style={{ height: 260 }} opts={{ renderer: 'canvas' }} />
      </Paper>

      {/* Horizontal Bar - Tag Heatmap */}
      <Paper elevation={0} sx={chartPanelSx}>
        <Typography variant="overline" sx={labelSx}>
          Popular Tags
        </Typography>
        <ReactEChartsCore echarts={echarts} option={tagBarOption} style={{ height: 210 }} opts={{ renderer: 'canvas' }} />
      </Paper>

      {/* Rose - Status Distribution */}
      <Paper elevation={0} sx={chartPanelSx}>
        <Typography variant="overline" sx={labelSx}>
          Resource Status Overview
        </Typography>
        <ReactEChartsCore echarts={echarts} option={statusOption} style={{ height: 220 }} opts={{ renderer: 'canvas' }} />
      </Paper>
    </Box>
  );
};

export default DataCharts;
