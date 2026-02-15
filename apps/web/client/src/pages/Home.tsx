/**
 * Cyberpunk Lab - Home Page
 *
 * Main application view with three-pane cockpit layout
 */

import { useState } from "react";
import Layout from "@/components/Layout";
import LeftPane from "@/components/LeftPane";
import MiddlePane from "@/components/MiddlePane";
import RightPane from "@/components/RightPane";

export default function Home() {
  // Shared state: Current active project for MavinStorage integration
  const [currentProject, setCurrentProject] = useState<string>("");
  const [currentProjectId, setCurrentProjectId] = useState<string>("");

  // Left panel collapse state
  const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = useState(false);

  const handleProjectSelect = (projectId: string, projectName: string) => {
    setCurrentProject(projectName);
    setCurrentProjectId(projectId);
    // Persist to localStorage for session recovery
    localStorage.setItem('mavin_current_project', projectName);
    localStorage.setItem('mavin_current_project_id', projectId);
  };

  return (
    <Layout
      leftPane={
        <LeftPane
          onProjectSelect={handleProjectSelect}
          isPanelCollapsed={isLeftPanelCollapsed}
          setIsPanelCollapsed={setIsLeftPanelCollapsed}
        />
      }
      middlePane={<MiddlePane currentProject={currentProject} currentProjectId={currentProjectId} />}
      rightPane={<RightPane currentProject={currentProject} currentProjectId={currentProjectId} />}
      isLeftPanelCollapsed={isLeftPanelCollapsed}
    />
  );
}
