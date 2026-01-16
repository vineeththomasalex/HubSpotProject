import { useState, useEffect } from 'react';
import { getStorageData, saveStorageData } from '../utils/storage';
import { testHubSpotConnection } from '../api/hubspot';
import { testOpenAIConnection } from '../api/openai';
import './settings.css';

function Settings() {
  // Check if API keys are set in environment variables
  const envHubspotToken = import.meta.env.VITE_HUBSPOT_ACCESS_TOKEN || '';
  const envOpenaiKey = import.meta.env.VITE_OPENAI_API_KEY || '';
  const isHubspotLocked = !!envHubspotToken;
  const isOpenaiLocked = !!envOpenaiKey;

  const [hubspotToken, setHubspotToken] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  const [saveStatus, setSaveStatus] = useState('');
  const [hubspotTestStatus, setHubspotTestStatus] = useState('');
  const [openaiTestStatus, setOpenaiTestStatus] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Load saved values on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await getStorageData();
      // Use env variables if set, otherwise use stored values
      setHubspotToken(envHubspotToken || data.hubspotToken || '');
      setOpenaiKey(envOpenaiKey || data.openaiKey || '');
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaveStatus('Saving...');
      await saveStorageData({
        hubspotToken,
        openaiKey,
      });
      setSaveStatus('✓ Saved successfully!');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (error) {
      setSaveStatus('✗ Error saving settings');
      console.error('Error saving settings:', error);
    }
  };

  const handleTestHubSpot = async () => {
    if (!hubspotToken) {
      setHubspotTestStatus('✗ Please enter a HubSpot token');
      return;
    }

    setHubspotTestStatus('Testing...');
    const success = await testHubSpotConnection(hubspotToken);

    if (success) {
      setHubspotTestStatus('✓ Connection successful!');
    } else {
      setHubspotTestStatus('✗ Connection failed. Check your token.');
    }

    setTimeout(() => setHubspotTestStatus(''), 5000);
  };

  const handleTestOpenAI = async () => {
    if (!openaiKey) {
      setOpenaiTestStatus('✗ Please enter an OpenAI API key');
      return;
    }

    setOpenaiTestStatus('Testing...');
    const success = await testOpenAIConnection(openaiKey);

    if (success) {
      setOpenaiTestStatus('✓ Connection successful!');
    } else {
      setOpenaiTestStatus('✗ Connection failed. Check your API key.');
    }

    setTimeout(() => setOpenaiTestStatus(''), 5000);
  };

  if (isLoading) {
    return <div className="container"><p>Loading...</p></div>;
  }

  return (
    <div className="container">
      <header>
        <h1>HubSpot Gmail Breeze AI - Settings</h1>
        <p className="subtitle">
          Configure your API credentials to enable AI-powered email responses
        </p>
      </header>

      <main>
        <section className="setting-section">
          <h2>HubSpot Configuration</h2>
          <p className="help-text">
            Enter your HubSpot Private App access token. This is used to fetch contact
            information from your CRM.
          </p>
          <p className="help-text">
            <a
              href="https://developers.hubspot.com/docs/api/private-apps"
              target="_blank"
              rel="noopener noreferrer"
            >
              How to create a Private App →
            </a>
          </p>
          <div className="input-group">
            <label htmlFor="hubspot-token">Private App Access Token:</label>
            {isHubspotLocked && (
              <p className="env-notice">
                ✓ Set via environment variable (.env file)
              </p>
            )}
            <input
              type="password"
              id="hubspot-token"
              value={hubspotToken}
              onChange={(e) => setHubspotToken(e.target.value)}
              placeholder="pat-na1-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              disabled={isHubspotLocked}
              className={isHubspotLocked ? 'locked' : ''}
            />
            <button onClick={handleTestHubSpot} className="test-button">
              Test Connection
            </button>
            {hubspotTestStatus && (
              <span className="status-message">{hubspotTestStatus}</span>
            )}
          </div>
        </section>

        <section className="setting-section">
          <h2>OpenAI Configuration</h2>
          <p className="help-text">
            Enter your OpenAI API key. This powers the AI response generation.
          </p>
          <p className="help-text">
            <a
              href="https://platform.openai.com/api-keys"
              target="_blank"
              rel="noopener noreferrer"
            >
              Get your API key from OpenAI →
            </a>
          </p>
          <div className="input-group">
            <label htmlFor="openai-key">OpenAI API Key:</label>
            {isOpenaiLocked && (
              <p className="env-notice">
                ✓ Set via environment variable (.env file)
              </p>
            )}
            <input
              type="password"
              id="openai-key"
              value={openaiKey}
              onChange={(e) => setOpenaiKey(e.target.value)}
              placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              disabled={isOpenaiLocked}
              className={isOpenaiLocked ? 'locked' : ''}
            />
            <button onClick={handleTestOpenAI} className="test-button">
              Test Connection
            </button>
            {openaiTestStatus && (
              <span className="status-message">{openaiTestStatus}</span>
            )}
          </div>
        </section>

        <section className="button-section">
          <button onClick={handleSave} className="save-button">
            Save Settings
          </button>
          {saveStatus && <span className="status-message">{saveStatus}</span>}
        </section>

        <section className="info-section">
          <h3>About</h3>
          <p>
            This extension combines HubSpot contact data with OpenAI's GPT-4 to generate
            contextually relevant email responses directly in Gmail.
          </p>
          <p>
            <strong>Note:</strong> Both API keys are required for full functionality.
          </p>
        </section>
      </main>
    </div>
  );
}

export default Settings;
