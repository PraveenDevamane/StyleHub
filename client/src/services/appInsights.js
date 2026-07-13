import { ApplicationInsights } from '@microsoft/applicationinsights-web';

const connectionString = import.meta.env.VITE_AZURE_MONITOR_CONNECTION_STRING || 
                         import.meta.env.EXPO_PUBLIC_AZURE_MONITOR_CONNECTION_STRING || '';

const isValidConnectionString = connectionString && connectionString.toLowerCase().includes('instrumentationkey=');
let appInsights = null;

if (typeof window !== 'undefined' && isValidConnectionString) {
  try {
    appInsights = new ApplicationInsights({
      config: {
        connectionString: connectionString,
        enableAutoRouteTracking: true,
      }
    });
    appInsights.loadAppInsights();
    appInsights.trackPageView();
    console.log('[AppInsights] Azure Application Insights initialized successfully.');
  } catch (err) {
    console.warn('[AppInsights] Failed to initialize AppInsights:', err);
  }
}

export { appInsights };
