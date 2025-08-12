/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FEATURE_TEAM_CONFIG?: string;
  readonly VITE_FEATURE_PLANNING_INSIGHTS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}