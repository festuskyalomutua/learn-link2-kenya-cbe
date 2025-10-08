Enhanced Frontend Components
client/src/components/AIRecommendations.jsx:

import React, { useState, useEffect } from 'react';
import { Brain, Target, TrendingUp, BookOpen, Clock, AlertTriangle } from 'lucide-react';
import axios from 'axios';

const AIRecommendations = ({ userId }) => {
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('competencies');

  useEffect(() => {
    fetchRecommendations();
  }, [userId]);

  const fetchRecommendations = async () => {
    try {
      const response = await axios.get(`/ai/recommendations/${userId}`);
      setRecommendations(response.data);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center mb-6">
        <Brain className="w-6 h-6 text-purple-600 mr-3" />
        <h3 className="text-xl font-bold text-gray-900">AI-Powered Recommendations</h3>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6">
        {[
          { id: 'competencies', label: 'Competencies', icon: Target },
          { id: 'learning', label: 'Learning Path', icon: TrendingUp },
          { id: 'resources', label: 'Resources', icon: BookOpen },
          { id: 'schedule', label: 'Schedule', icon: Clock }
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === id
                ? 'bg-white text-purple-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Icon className="w-4 h-4 mr-2" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'competencies' && (
          <CompetencyRecommendations data={recommendations?.competencyFocus} />
        )}
        {activeTab === 'learning' && (
          <LearningPathRecommendations data={recommendations?.learningPath} />
        )}
        {activeTab === 'resources' && (
          <ResourceRecommendations data={recommendations?.resources} />
        )}
        {activeTab === 'schedule' && (
          <StudyScheduleRecommendations data={recommendations?.studySchedule} />
        )}
      </div>

      {/* Interventions Alert */}
      {recommendations?.interventions?.length > 0 && (
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
            <h4 className="font-semibold text-yellow-800">Recommended Interventions</h4>
          </div>
          <ul className="space-y-1">
            {recommendations.interventions.map((intervention, index) => (
              <li key={index} className="text-sm text-yellow-700">
                • {intervention.description}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

const CompetencyRecommendations = ({ data }) => (
  <div className="space-y-4">
    <h4 className="font-semibold text-gray-900">Focus Areas</h4>
    {data?.map((competency, index) => (
      <div key={index} className="border border-gray-200 rounded-lg p-4">
        <div className="flex justify-between items-start mb-2">
          <h5 className="font-medium text-gray-900">{competency.competency}</h5>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            competency.priority === 'High' ? 'bg-red-100 text-red-800' :
            competency.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
            'bg-green-100 text-green-800'
          }`}>
            {competency.priority} Priority
          </span>
        </div>
        <div className="flex items-center mb-3">
          <div className="flex-1">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Current Level: {competency.currentLevel}</span>
              <span>Target Level: {competency.targetLevel}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-purple-600 h-2 rounded-full"
                style={{ width: `${(competency.currentLevel / 4) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
        <div className="text-sm text-gray-600 mb-3">
          Estimated time to improve: {competency.estimatedTimeToImprove}
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-700">Recommended Actions:</p>
          {competency.recommendedActions?.map((action, i) => (
            <p key={i} className="text-sm text-gray-600">• {action}</p>
          ))}
        </div>
      </div>
    ))}
  </div>
);

const LearningPathRecommendations = ({ data }) => (
  <div className="space-y-4">
    <h4 className="font-semibold text-gray-900">Personalized Learning Path</h4>
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-2xl font-bold text-blue-600">{data?.nextSteps?.length || 0}</p>
          <p className="text-sm text-blue-800">Next Steps</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-blue-600">{data?.estimatedDuration || 'N/A'}</p>
          <p className="text-sm text-blue-800">Est. Duration</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-blue-600">{data?.difficulty || 'Medium'}</p>
          <p className="text-sm text-blue-800">Difficulty</p>
        </div>
      </div>
    </div>
    <div className="space-y-3">
      {data?.nextSteps?.map((step, index) => (
        <div key={index} className="flex items-center p-3 border border-gray-200 rounded-lg">
          <div className="bg-blue-100 text-blue-600 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">
            {index + 1}
          </div>
          <div className="flex-1">
            <h5 className="font-medium text-gray-900">{step.title}</h5>
            <p className="text-sm text-gray-600">{step.description}</p>
          </div>
          <div className="text-sm text-gray-500">{step.estimatedTime}</div>
        </div>
      ))}
    </div>
  </div>
);

export default AIRecommendations;

