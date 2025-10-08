client/src/components/AnalyticsDashboard.jsx:

import React, { useState, useEffect } from 'react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { TrendingUp, Users, Award, BookOpen } from 'lucide-react';
import axios from 'axios';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const AnalyticsDashboard = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [timeRange, setTimeRange] = useState('30d');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/analytics/dashboard?timeRange=${timeRange}`);
      setAnalyticsData(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-64 bg-gray-200 rounded-lg"></div>
            <div className="h-64 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  const performanceData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Average Competency Score',
        data: [65, 68, 72, 75, 78, 82],
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        tension: 0.4,
      },
    ],
  };

  const competencyDistribution = {
    labels: ['Advanced', 'Proficient', 'Developing', 'Beginning'],
    datasets: [
      {
        data: [25, 45, 20, 10],
        backgroundColor: [
          '#10B981',
          '#3B82F6',
          '#F59E0B',
          '#EF4444',
        ],
      },
    ],
  };

  const subjectPerformance = {
    labels: ['Mathematics', 'Science', 'English', 'Social Studies'],
    datasets: [
      {
        label: 'Average Score',
        data: [78, 82, 75, 80],
        backgroundColor: 'rgba(99, 102, 241, 0.8)',
      },
    ],
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600">Comprehensive insights into learning outcomes</p>
        </div>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="1y">Last year</option>
        </select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Total Students"
          value="1,247"
          change="+12%"
          icon={<Users className="w-6 h-6" />}
          color="blue"
        />
        <MetricCard
          title="Avg Competency"
          value="78%"
          change="+5%"
          icon={<Award className="w-6 h-6" />}
          color="green"
        />
        <MetricCard
          title="Assessments"
          value="156"
          change="+8%"
          icon={<BookOpen className="w-6 h-6" />}
          color="purple"
        />
        <MetricCard
          title="Engagement"
          value="92%"
          change="+3%"
          icon={<TrendingUp className="w-6 h-6" />}
          color="orange"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Performance Trend */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Performance Trend</h3>
          <Line data={performanceData} options={{
            responsive: true,
            plugins: {
              legend: {
                position: 'top',
              },
            },
          }} />
        </div>

        {/* Competency Distribution */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Competency Distribution</h3>
          <Doughnut data={competencyDistribution} options={{
            responsive: true,
            plugins: {
              legend: {
                position: 'bottom',
              },
            },
          }} />
        </div>

        {/* Subject Performance */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Subject Performance</h3>
          <Bar data={subjectPerformance} options={{
            responsive: true,
            plugins: {
              legend: {
                display: false,
              },
            },
          }} />
        </div>

        {/* Real-time Activity */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Real-time Activity</h3>
          <div className="space-y-4">
            <ActivityItem
              type="assessment"
              message="Sarah completed Algebra Assessment"
              time="2 minutes ago"
            />
            <ActivityItem
              type="resource"
              message="New resource uploaded: Geometry Guide"
              time="5 minutes ago"
            />
            <ActivityItem
              type="grade"
              message="Biology Lab reports graded"
              time="10 minutes ago"
            />
          </div>
        </div>
      </div>

      {/* Detailed Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <StudentPerformanceTable />
        <CompetencyBreakdown />
      </div>
    </div>
  );
};

const MetricCard = ({ title, value, change, icon, color }) => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600'
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-sm text-green-600">{change} from last period</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

const ActivityItem = ({ type, message, time }) => (
  <div className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
    <div className="flex-1">
      <p className="text-sm font-medium text-gray-900">{message}</p>
      <p className="text-xs text-gray-500">{time}</p>
    </div>
  </div>
);

const StudentPerformanceTable = () => (
  <div className="bg-white rounded-xl shadow-lg p-6">
    <h3 className="text-lg font-semibold mb-4">Top Performing Students</h3>
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left py-2">Student</th>
            <th className="text-left py-2">Avg Score</th>
            <th className="text-left py-2">Competency</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b">
            <td className="py-2">Sarah Johnson</td>
            <td className="py-2">92%</td>
            <td className="py-2">
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                Advanced
              </span>
            </td>
          </tr>
          <tr className="border-b">
            <td className="py-2">James Mwangi</td>
            <td className="py-2">88%</td>
            <td className="py-2">
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                Proficient
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
);

const CompetencyBreakdown = () => (
  <div className="bg-white rounded-xl shadow-lg p-6">
    <h3 className="text-lg font-semibold mb-4">Competency Breakdown</h3>
    <div className="space-y-4">
      {['Problem Solving', 'Critical Thinking', 'Communication', 'Collaboration'].map((competency, index) => (
        <div key={competency}>
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-gray-700">{competency}</span>
            <span className="text-sm text-gray-500">{78 + index * 3}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-indigo-600 h-2 rounded-full"
              style={{ width: `${78 + index * 3}%` }}
            ></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default AnalyticsDashboard;

