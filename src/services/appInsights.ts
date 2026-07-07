import { ApplicationInsights } from '@microsoft/applicationinsights-web';
import { Platform } from 'react-native';

const connectionString = process.env.EXPO_PUBLIC_AZURE_MONITOR_CONNECTION_STRING || '';

let appInsights: ApplicationInsights | null = null;

if (Platform.OS === 'web' && typeof window !== 'undefined' && connectionString) {
  try {
    appInsights = new ApplicationInsights({
      config: {
        connectionString: connectionString,
        enableAutoRouteTracking: true, // Tracks route changes automatically in single page apps
      }
    });
    appInsights.loadAppInsights();
    appInsights.trackPageView(); // Log initial page view
    console.log('Azure Application Insights initialized successfully.');
  } catch (error) {
    console.error('Failed to initialize Azure Application Insights:', error);
  }
}

export { appInsights };
