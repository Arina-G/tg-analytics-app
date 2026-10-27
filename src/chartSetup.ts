import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js'

// В Chart.js 4 всё tree-shakable, поэтому регистрирую только то, что реально использую
Chart.register(ArcElement, BarElement, CategoryScale, Filler, Legend, LinearScale, LineElement, PointElement, Tooltip)

export const COLORS = {
  accent: '#4ea8ff',
  accentSoft: 'rgba(78, 168, 255, 0.18)',
  text: '#9aa7b8',
  grid: 'rgba(154, 167, 184, 0.12)',
  palette: ['#4ea8ff', '#a78bfa', '#34d399', '#fbbf24', '#f472b6', '#fb923c', '#22d3ee', '#94a3b8', '#e879f9'],
}

Chart.defaults.color = COLORS.text
Chart.defaults.borderColor = COLORS.grid
Chart.defaults.font.family = 'Inter, system-ui, sans-serif'
Chart.defaults.maintainAspectRatio = false
Chart.defaults.plugins.legend.display = false
