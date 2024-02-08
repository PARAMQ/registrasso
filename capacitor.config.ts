import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'registrasso.starter',
  appName: 'registrasso-app',
  webDir: 'www',
  server: {
    androidScheme: 'https'
  }
};

export default config;
