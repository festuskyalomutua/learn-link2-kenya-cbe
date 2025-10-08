client/src/components/IntegrationManager.jsx:

import React, { useState, useEffect } from 'react';
import { Link, Settings, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const IntegrationManager = () => {
  const [integrations, setIntegrations] = useState([]);
  const [syncing, setSyncing] = useState({});
  const [showSetup, setShowSetup] = useState(null);

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    try {
      const response = await axios.get('/integrations');
      setIntegrations(response.data);
    } catch (error) {
      console.error('Error fetching integrations:', error);
    }
  };

  const handleSync = async (integrationId) => {
    setSyncing(prev => ({ ...prev, [integrationId]: true }));
    
    try {
      const response = await axios.post(`/integrations/${integrationId}/sync`);
      
      if (response.data.success) {
        toast.success('Sync completed successfully!');
        fetchIntegrations(); // Refresh the list
      } else {
        toast.error(`Sync failed: ${response.data.error}`);
      }
    } catch (error) {
      toast.error('Sync failed. Please try again.');
    } finally {
      setSyncing(prev => ({ ...prev, [integrationId]: false }));
    }
  };

  const integrationConfigs = [
    {
      id: 'google_classroom',
      name: 'Google Classroom',
      description: 'Sync courses, assignments, and grades from Google Classroom',
      icon: '🎓',
      color: 'bg-blue-500',
      features: ['Course sync', 'Assignment import', 'Grade sync', 'Student roster']
    },
    {
      id: 'canvas',
      name: 'Canvas LMS',
      description: 'Import courses and assessments from Canvas Learning Management System',
      icon: '📚',
      color: 'bg-orange-500',
      features: ['Course import', 'Assignment sync', 'Submission tracking', 'Grade passback']
    },
    {
      id: 'moodle',
      name: 'Moodle',
      description: 'Connect with Moodle courses and activities',
      icon: '🎯',
      color: 'bg-green-500',
      features: ['Activity sync', 'Quiz import', 'Forum integration', 'Resource sharing']
    },
    {
      id: 'teams_education',
      name: 'Microsoft Teams for Education',
      description: 'Integrate with Teams classes and assignments',
      icon: '💼',
      color: 'bg-purple-500',
      features: ['Class sync', 'Assignment integration', 'Meeting data', 'Collaboration tools']
    },
    {
      id: 'khan_academy',
      name: 'Khan Academy',
      description: 'Import student progress and competency data from Khan Academy',
      icon: '🧠',
      color: 'bg-teal-500',
      features: ['Progress tracking', 'Skill mastery', 'Badge integration', 'Competency mapping']
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">External Integrations</h1>
        <p className="text-gray-600">Connect your CBE platform with external educational systems</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {integrationConfigs.map((config) => {
          const integration = integrations.find(i => i.type === config.id);
          const isConnected = integration?.status === 'connected';
          const isSyncing = syncing[config.id];

          return (
            <div key={config.id} className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className={`${config.color} text-white p-3 rounded-lg mr-4`}>
                    <span className="text-2xl">{config.icon}</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{config.name}</h3>
                    <div className="flex items-center mt-1">
                      {isConnected ? (
                        <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-gray-400 mr-1" />
                      )}
                      <span className={`text-sm ${isConnected ? 'text-green-600' : 'text-gray-500'}`}>
                        {isConnected ? 'Connected' : 'Not Connected'}
                      </span>
                    </div>
                  </div>
                </div>
                <Settings 
                  className="w-5 h-5 text-gray-400 cursor-pointer hover:text-gray-600"
                  onClick={() => setShowSetup(config.id)}
                />
              </div>

              <p className="text-gray-600 text-sm mb-4">{config.description}</p>

              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Features:</h4>
                <div className="flex flex-wrap gap-1">
                  {config.features.map((feature, index) => (
                    <span 
                      key={index}
                      className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>

              {isConnected && integration && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600">
                    <p>Last sync: {new Date(integration.lastSync).toLocaleString()}</p>
                    <p>Synced items: {integration.syncedItems || 0}</p>
                  </div>
                </div>
              )}

              <div className="flex space-x-2">
                {isConnected ? (
                  <>
                    <button
                      onClick={() => handleSync(config.id)}
                      disabled={isSyncing}
                      className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center"
                    >
                      {isSyncing ? (
                        <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <RefreshCw className="w-4 h-4 mr-2" />
                      )}
                      {isSyncing ? 'Syncing...' : 'Sync Now'}
                    </button>
                    <button
                      onClick={() => setShowSetup(config.id)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      Configure
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setShowSetup(config.id)}
                    className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 flex items-center justify-center"
                  >
                    <Link className="w-4 h-4 mr-2" />
                    Connect
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Integration Setup Modal */}
      {showSetup && (
        <IntegrationSetupModal
          integrationId={showSetup}
          config={integrationConfigs.find(c => c.id === showSetup)}
          onClose={() => setShowSetup(null)}
          onSuccess={() => {
            setShowSetup(null);
            fetchIntegrations();
          }}
        />
      )}
    </div>
  );
};

const IntegrationSetupModal = ({ integrationId, config, onClose, onSuccess }) => {
  const [setupData, setSetupData] = useState({});
  const [loading, setLoading] = useState(false);

  const handleSetup = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`/integrations/${integrationId}/setup`, setupData);
      
      if (response.data.success) {
        toast.success('Integration configured successfully!');
        onSuccess();
      } else {
        toast.error(`Setup failed: ${response.data.error}`);
      }
    } catch (error) {
      toast.error('Setup failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const renderSetupForm = () => {
    switch (integrationId) {
      case 'google_classroom':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Google OAuth Credentials
              </label>
              <button
                type="button"
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
                onClick={() => window.open('/auth/google', '_blank')}
              >
                Authorize with Google
              </button>
            </div>
          </div>
        );

      case 'canvas':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Canvas URL
              </label>
              <input
                type="url"
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="https://your-school.instructure.com"
                value={setupData.canvasUrl || ''}
                onChange={(e) => setSetupData({...setupData, canvasUrl: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API Token
              </label>
              <input
                type="password"
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="Your Canvas API token"
                value={setupData.apiToken || ''}
                onChange={(e) => setSetupData({...setupData, apiToken: e.target.value})}
              />
            </div>
          </div>
        );

      case 'moodle':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Moodle URL
              </label>
              <input
                type="url"
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="https://your-moodle-site.com"
                value={setupData.moodleUrl || ''}
                onChange={(e) => setSetupData({...setupData, moodleUrl: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Web Service Token
              </label>
              <input
                type="password"
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="Your Moodle web service token"
                value={setupData.token || ''}
                onChange={(e) => setSetupData({...setupData, token: e.target.value})}
              />
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-8">
            <p className="text-gray-600">Setup form for {config?.name} coming soon!</p>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Setup {config?.name}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSetup}>
          {renderSetupForm()}
          
          <div className="flex space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Setting up...' : 'Connect'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default IntegrationManager;