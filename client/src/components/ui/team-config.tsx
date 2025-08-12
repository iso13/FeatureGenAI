/**
 * Team Configuration feature flag wrapper
 * When VITE_FEATURE_TEAM_CONFIG=false, these components render nothing.
 */

const SHOW_TEAM_CONFIG =
  import.meta.env.VITE_FEATURE_TEAM_CONFIG === "true";

export type { TeamContext } from "./team-config-original";

// Import the original components (types still load even if we render null)
import {
  TeamConfig as OriginalTeamConfig,
  TeamContextSummary as OriginalTeamContextSummary,
} from "./team-config-original";

interface TeamConfigProps {
  teamContext?: import("./team-config-original").TeamContext;
  onSave: (context: import("./team-config-original").TeamContext) => void;
}

export function TeamConfig(props: TeamConfigProps) {
  if (!SHOW_TEAM_CONFIG) return null;
  return <OriginalTeamConfig {...props} />;
}

export function TeamContextSummary(props: { teamContext?: import("./team-config-original").TeamContext }) {
  if (!SHOW_TEAM_CONFIG) return null;
  return <OriginalTeamContextSummary {...props} />;
}