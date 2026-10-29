import { defineManifest } from '@crxjs/vite-plugin'

const CANID_URLS = [
  'http://localhost:3000/*',
  'https://app-staging.canid.io/*',
  'https://app.canid.io/*',
  'http://localhost:3001/*',
  'http://localhost:4000/*',
  'http://localhost:4001/*',
  'https://internal-tools-staging.canid.io/*',
  'https://internal-tools.canid.io/*',
]

export default defineManifest({
  manifest_version: 3,
  name: 'QA Tools',
  version: '3.3',
  description: 'Tools to make easy job for QA engineers',
  author: 'Canid QA Team',
  permissions: ['activeTab', 'storage', 'contextMenus'],
  host_permissions: [
    'http://localhost:8080/*',
    'https://api-staging.canid.io/*',
    'https://api.canid.io/*',
  ],
  background: {
    service_worker: 'background.ts',
    type: 'module',
  },
  content_scripts: [
    {
      matches: CANID_URLS,
      js: ['content.ts'],
      all_frames: false,
    },
  ],
  action: {
    default_title: 'Canid - QA Tools',
    default_popup: 'popup.html',
    default_icon: {
      '16': 'icon-16.png',
      '32': 'icon-32.png',
      '48': 'icon-48.png',
      '128': 'icon-128.png',
    },
  },
  icons: {
    '16': 'icon-16.png',
    '32': 'icon-32.png',
    '48': 'icon-48.png',
    '128': 'icon-128.png',
  },
})
