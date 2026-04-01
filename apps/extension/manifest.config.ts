import { defineManifest } from "@crxjs/vite-plugin";

export default defineManifest({
  manifest_version: 3,
  name: "PromptShield",
  short_name: "PromptShield",
  description: "Privacy-first guard for sensitive prompt submissions on protected domains.",
  version: "0.1.0",
  homepage_url: "https://promptshieldapp.co.uk",
  minimum_chrome_version: "120",
  permissions: ["storage", "alarms", "activeTab"],
  host_permissions: ["https://*/*", "http://*/*"],
  background: {
    service_worker: "src/background/index.ts",
    type: "module"
  },
  icons: {
    "16": "assets/icons/icon-16.png",
    "32": "assets/icons/icon-32.png",
    "48": "assets/icons/icon-48.png",
    "128": "assets/icons/icon-128.png"
  },
  action: {
    default_popup: "src/popup/index.html",
    default_title: "PromptShield",
    default_icon: {
      "16": "assets/icons/icon-16.png",
      "32": "assets/icons/icon-32.png",
      "48": "assets/icons/icon-48.png"
    }
  },
  options_page: "src/options/index.html",
  content_scripts: [
    {
      matches: ["https://*/*", "http://*/*"],
      js: ["src/content/index.ts"],
      run_at: "document_start"
    }
  ]
});
