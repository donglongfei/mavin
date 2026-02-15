/**
 * Mavin Left Pane - Project Hierarchy Manager
 *
 * Features:
 * - Collapsible panel (360px → 60px)
 * - Database-driven 3-level hierarchy (Categories → Epics → Projects)
 * - Search with CMD/CTRL+K
 * - Smooth animations
 * - Keyboard navigation
 * - Scrollable content
 */

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Search,
  ChevronRight,
  ChevronDown,
  Plus,
  PanelLeftClose,
  PanelLeft,
  Star,
  StarOff,
  Settings,
  Server
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { AvatarSettings } from "./AvatarSettings";
import ServiceStatusPanel from "./ServiceStatusPanel";
import CreateCategoryDialog from "./CreateCategoryDialog";
import CreateEpicDialog from "./CreateEpicDialog";
import CreateProjectDialog from "./CreateProjectDialog";

// Type definitions matching backend
interface Project {
  project_id: string;
  epic_id: string;
  name: string;
  description?: string;
  icon: string;
  status: string;
  color?: string;
  display_order: number;
  is_favorite: number;
  file_count: number;
  last_accessed_at: string;
}

interface Epic {
  epic_id: string;
  category_id: string;
  name: string;
  description?: string;
  icon: string;
  start_date?: string;
  end_date?: string;
  status: string;
  display_order: number;
  is_expanded: number;
  project_count: number;
  projects: Project[];
}

interface Category {
  category_id: string;
  name: string;
  icon: string;
  color: string;
  display_order: number;
  is_expanded: number;
  epic_count: number;
  epics: Epic[];
}

interface LeftPaneProps {
  onProjectSelect?: (projectId: string, projectName: string) => void;
  isPanelCollapsed?: boolean;
  setIsPanelCollapsed?: (collapsed: boolean) => void;
}

export default function LeftPane({
  onProjectSelect,
  isPanelCollapsed = false,
  setIsPanelCollapsed = () => {}
}: LeftPaneProps) {
  // Panel state
  const [hierarchy, setHierarchy] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentView, setCurrentView] = useState<'projects' | 'services'>('projects');
  const [activeProject, setActiveProject] = useState<string | null>(null);
  const [avatarSettingsOpen, setAvatarSettingsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Dialog state
  const [createCategoryOpen, setCreateCategoryOpen] = useState(false);
  const [createEpicOpen, setCreateEpicOpen] = useState(false);
  const [createEpicCategoryId, setCreateEpicCategoryId] = useState('');
  const [createEpicCategoryName, setCreateEpicCategoryName] = useState('');
  const [createProjectOpen, setCreateProjectOpen] = useState(false);
  const [createProjectEpicId, setCreateProjectEpicId] = useState('');
  const [createProjectEpicName, setCreateProjectEpicName] = useState('');

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Load hierarchy from database
  const loadHierarchy = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:8002/api/panel/hierarchy');
      const data = await response.json();
      if (data.success) {
        setHierarchy(data.hierarchy);
      }
    } catch (error) {
      console.error('Failed to load hierarchy:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadHierarchy();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // CMD/CTRL + K - Focus search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }

      // CMD/CTRL + B - Toggle panel
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        setIsPanelCollapsed(!isPanelCollapsed);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPanelCollapsed]);

  // Toggle category expansion
  const handleCategoryToggle = async (categoryId: string) => {
    try {
      await fetch(`http://localhost:8002/api/panel/categories/${categoryId}/toggle`, {
        method: 'POST'
      });
      // Refresh hierarchy
      loadHierarchy();
    } catch (error) {
      console.error('Failed to toggle category:', error);
    }
  };

  // Toggle epic expansion
  const handleEpicToggle = async (epicId: string) => {
    try {
      await fetch(`http://localhost:8002/api/panel/epics/${epicId}/toggle`, {
        method: 'POST'
      });
      // Refresh hierarchy
      loadHierarchy();
    } catch (error) {
      console.error('Failed to toggle epic:', error);
    }
  };

  // Handle project selection
  const handleProjectSelect = async (projectId: string, projectName: string) => {
    setActiveProject(projectId);

    // Update last accessed timestamp
    try {
      await fetch(`http://localhost:8002/api/panel/projects/${projectId}/access`, {
        method: 'POST'
      });
    } catch (error) {
      console.error('Failed to update last accessed:', error);
    }

    // Notify parent component
    if (onProjectSelect) {
      onProjectSelect(projectId, projectName);
    }
  };

  // Filter hierarchy by search
  const filterHierarchy = (categories: Category[]): Category[] => {
    if (!searchQuery.trim()) return categories;

    const query = searchQuery.toLowerCase();

    return categories
      .map(category => ({
        ...category,
        is_expanded: 1, // Auto-expand when searching
        epics: category.epics
          .map(epic => ({
            ...epic,
            is_expanded: 1, // Auto-expand when searching
            projects: epic.projects.filter(project =>
              project.name.toLowerCase().includes(query) ||
              project.description?.toLowerCase().includes(query)
            )
          }))
          .filter(epic => epic.projects.length > 0)
      }))
      .filter(category => category.epics.length > 0);
  };

  const filteredHierarchy = filterHierarchy(hierarchy);

  // Collapsed panel view
  if (isPanelCollapsed) {
    return (
      <div className="h-full w-[60px] glass border-r border-border/50 flex flex-col relative transition-all duration-300">
        {/* Toggle button */}
        <div className="p-3 border-b border-border/30">
          <Button
            variant="ghost"
            size="icon"
            className="w-full h-9 text-neon-cyan hover:bg-neon-cyan/10"
            onClick={() => setIsPanelCollapsed(false)}
            title="Expand panel (⌘B)"
          >
            <PanelLeft className="h-4 w-4" />
          </Button>
        </div>

        {/* Category icons only */}
        <ScrollArea className="flex-1 h-0">
          <div className="p-2 space-y-2">
            {hierarchy.map(category => (
              <Button
                key={category.category_id}
                variant="ghost"
                size="icon"
                className="w-full h-10 text-2xl hover:bg-card/50"
                style={{ color: category.color }}
                title={category.name}
              >
                {category.icon}
              </Button>
            ))}
          </div>
        </ScrollArea>

        {/* Bottom actions */}
        <div className="p-2 space-y-2 border-t border-border/30">
          <Button
            variant="ghost"
            size="icon"
            className="w-full h-9 text-muted-foreground hover:text-neon-cyan hover:bg-neon-cyan/10"
            onClick={() => setCurrentView(currentView === 'projects' ? 'services' : 'projects')}
            title="Services"
          >
            <Server className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="w-full h-9 text-muted-foreground hover:text-neon-cyan hover:bg-neon-cyan/10"
            onClick={() => setAvatarSettingsOpen(true)}
            title="Settings"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>

        <AvatarSettings
          open={avatarSettingsOpen}
          onOpenChange={setAvatarSettingsOpen}
        />
      </div>
    );
  }

  // Expanded panel view
  return (
    <div className="h-full w-[360px] glass border-r border-border/50 flex flex-col relative transition-all duration-300">
      {/* Header */}
      <div className="p-4 border-b border-border/30">
        {/* Toggle and view switch */}
        <div className="flex items-center justify-between mb-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-neon-cyan hover:bg-neon-cyan/10"
            onClick={() => setIsPanelCollapsed(true)}
            title="Collapse panel (⌘B)"
          >
            <PanelLeftClose className="h-4 w-4" />
          </Button>

          <div className="flex gap-1 bg-card/50 rounded-lg p-1">
            <Button
              variant="ghost"
              size="icon"
              className={`h-7 w-7 ${currentView === 'projects' ? 'bg-neon-cyan/20 text-neon-cyan' : 'text-muted-foreground'}`}
              onClick={() => setCurrentView('projects')}
              title="Projects"
            >
              <PanelLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`h-7 w-7 ${currentView === 'services' ? 'bg-neon-cyan/20 text-neon-cyan' : 'text-muted-foreground'}`}
              onClick={() => setCurrentView('services')}
              title="Services"
            >
              <Server className="h-4 w-4" />
            </Button>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-neon-cyan hover:bg-neon-cyan/10"
            onClick={() => setAvatarSettingsOpen(true)}
            title="Avatar Settings"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>

        {/* Search bar */}
        {currentView === 'projects' && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              placeholder="Search projects... (⌘K)"
              className="pl-9 bg-card/50 border-border/50 focus:border-neon-cyan/50 focus:ring-neon-cyan/20 h-9 text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* Content */}
      {currentView === 'projects' ? (
        <ScrollArea className="flex-1 h-0">
          <div className="p-2 pr-4">
            {isLoading ? (
              <div className="text-center text-muted-foreground text-sm py-8">
                Loading projects...
              </div>
            ) : filteredHierarchy.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm py-8">
                {searchQuery ? 'No projects found' : 'No projects yet'}
              </div>
            ) : (
              <div className="space-y-1">
                {filteredHierarchy.map(category => (
                  <CategoryItem
                    key={category.category_id}
                    category={category}
                    activeProject={activeProject}
                    onCategoryToggle={handleCategoryToggle}
                    onEpicToggle={handleEpicToggle}
                    onProjectSelect={handleProjectSelect}
                    onCreateEpic={(categoryId, categoryName) => {
                      setCreateEpicCategoryId(categoryId);
                      setCreateEpicCategoryName(categoryName);
                      setCreateEpicOpen(true);
                    }}
                    onCreateProject={(epicId, epicName) => {
                      setCreateProjectEpicId(epicId);
                      setCreateProjectEpicName(epicName);
                      setCreateProjectOpen(true);
                    }}
                  />
                ))}

                {/* New Category Button - Only show when not searching */}
                {!searchQuery && (
                  <button
                    className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-neon-cyan/10 transition-colors group border border-dashed border-transparent hover:border-neon-cyan/30 mt-2"
                    onClick={() => setCreateCategoryOpen(true)}
                  >
                    <div className="w-6 h-6 rounded-md border border-dashed border-border/50 flex items-center justify-center group-hover:border-neon-cyan/50 transition-colors">
                      <Plus className="h-3 w-3 text-muted-foreground group-hover:text-neon-cyan transition-colors" />
                    </div>
                    <span className="text-xs text-muted-foreground group-hover:text-neon-cyan transition-colors">
                      New Category
                    </span>
                  </button>
                )}
              </div>
            )}
          </div>
        </ScrollArea>
      ) : (
        <ServiceStatusPanel />
      )}

      <AvatarSettings
        open={avatarSettingsOpen}
        onOpenChange={setAvatarSettingsOpen}
      />

      {/* Create Dialogs */}
      <CreateCategoryDialog
        open={createCategoryOpen}
        onOpenChange={setCreateCategoryOpen}
        onSuccess={loadHierarchy}
      />

      <CreateEpicDialog
        open={createEpicOpen}
        onOpenChange={setCreateEpicOpen}
        categoryId={createEpicCategoryId}
        categoryName={createEpicCategoryName}
        onSuccess={loadHierarchy}
      />

      <CreateProjectDialog
        open={createProjectOpen}
        onOpenChange={setCreateProjectOpen}
        epicId={createProjectEpicId}
        epicName={createProjectEpicName}
        onSuccess={loadHierarchy}
      />
    </div>
  );
}

// Category component
interface CategoryItemProps {
  category: Category;
  activeProject: string | null;
  onCategoryToggle: (categoryId: string) => void;
  onEpicToggle: (epicId: string) => void;
  onProjectSelect: (projectId: string, projectName: string) => void;
  onCreateEpic: (categoryId: string, categoryName: string) => void;
  onCreateProject: (epicId: string, epicName: string) => void;
}

function CategoryItem({
  category,
  activeProject,
  onCategoryToggle,
  onEpicToggle,
  onProjectSelect,
  onCreateEpic,
  onCreateProject
}: CategoryItemProps) {
  const isExpanded = category.is_expanded === 1;

  return (
    <div className="space-y-1">
      {/* Category header */}
      <button
        onClick={() => onCategoryToggle(category.category_id)}
        className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-card/50 transition-colors group"
      >
        {isExpanded ? (
          <ChevronDown className="h-3 w-3 text-muted-foreground flex-shrink-0" />
        ) : (
          <ChevronRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
        )}
        <span className="text-base" style={{ color: category.color }}>
          {category.icon}
        </span>
        <span className="text-xs font-bold uppercase tracking-wide text-foreground/90 flex-1 text-left">
          {category.name}
        </span>
        <span className="text-xs text-muted-foreground bg-card/50 px-1.5 py-0.5 rounded">
          {category.epic_count}
        </span>
      </button>

      {/* Epics */}
      {isExpanded && (
        <div className="ml-4 space-y-1 border-l-2 border-border/30 pl-2">
          {category.epics.map(epic => (
            <EpicItem
              key={epic.epic_id}
              epic={epic}
              activeProject={activeProject}
              onEpicToggle={onEpicToggle}
              onProjectSelect={onProjectSelect}
              onCreateProject={onCreateProject}
            />
          ))}

          {/* New Epic Button */}
          <button
            className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-neon-purple/10 transition-colors group border border-dashed border-transparent hover:border-neon-purple/30"
            onClick={() => onCreateEpic(category.category_id, category.name)}
          >
            <div className="w-6 h-6 rounded-md border border-dashed border-border/50 flex items-center justify-center group-hover:border-neon-purple/50 transition-colors">
              <Plus className="h-3 w-3 text-muted-foreground group-hover:text-neon-purple transition-colors" />
            </div>
            <span className="text-xs text-muted-foreground group-hover:text-neon-purple transition-colors">
              New Epic
            </span>
          </button>
        </div>
      )}
    </div>
  );
}

// Epic component
interface EpicItemProps {
  epic: Epic;
  activeProject: string | null;
  onEpicToggle: (epicId: string) => void;
  onProjectSelect: (projectId: string, projectName: string) => void;
  onCreateProject: (epicId: string, epicName: string) => void;
}

function EpicItem({ epic, activeProject, onEpicToggle, onProjectSelect, onCreateProject }: EpicItemProps) {
  const isExpanded = epic.is_expanded === 1;

  return (
    <div className="space-y-1">
      {/* Epic header */}
      <button
        onClick={() => onEpicToggle(epic.epic_id)}
        className="w-full flex items-start gap-2 p-2 rounded-lg hover:bg-card/50 transition-colors group"
      >
        <div className="mt-0.5">
          {isExpanded ? (
            <ChevronDown className="h-3 w-3 text-muted-foreground flex-shrink-0" />
          ) : (
            <ChevronRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
          )}
        </div>
        <span className="text-sm flex-shrink-0">{epic.icon}</span>
        <div className="flex-1 text-left min-w-0">
          <p className="text-sm font-semibold text-foreground/90 truncate">
            {epic.name}
          </p>
          {epic.description && (
            <p className="text-xs text-muted-foreground truncate">
              {epic.description} · {epic.project_count} project{epic.project_count !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      </button>

      {/* Projects */}
      {isExpanded && (
        <div className="ml-4 space-y-1">
          {epic.projects.map(project => (
            <ProjectItem
              key={project.project_id}
              project={project}
              isActive={activeProject === project.project_id}
              onProjectSelect={onProjectSelect}
            />
          ))}

          {/* New project button */}
          <button
            className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-neon-purple/10 transition-colors group border border-dashed border-transparent hover:border-neon-purple/30"
            onClick={() => onCreateProject(epic.epic_id, epic.name)}
          >
            <div className="w-6 h-6 rounded-md border border-dashed border-border/50 flex items-center justify-center group-hover:border-neon-purple/50 transition-colors">
              <Plus className="h-3 w-3 text-muted-foreground group-hover:text-neon-purple transition-colors" />
            </div>
            <span className="text-xs text-muted-foreground group-hover:text-neon-purple transition-colors">
              New Project
            </span>
          </button>
        </div>
      )}
    </div>
  );
}

// Project component
interface ProjectItemProps {
  project: Project;
  isActive: boolean;
  onProjectSelect: (projectId: string, projectName: string) => void;
}

function ProjectItem({ project, isActive, onProjectSelect }: ProjectItemProps) {
  const isFavorite = project.is_favorite === 1;

  return (
    <button
      onClick={() => onProjectSelect(project.project_id, project.name)}
      className={`w-full flex items-center gap-2 p-2 rounded-lg transition-all group ${
        isActive
          ? "bg-neon-cyan/20 border-l-2 border-neon-cyan"
          : "hover:bg-card/50 border-l-2 border-transparent"
      }`}
    >
      <div className={`w-6 h-6 rounded-md border flex items-center justify-center transition-colors ${
        isActive
          ? "bg-neon-cyan/20 border-neon-cyan/50"
          : "bg-card border-border/50 group-hover:border-neon-cyan/30"
      }`}>
        <span className={`text-xs transition-colors ${
          isActive
            ? "text-neon-cyan"
            : "text-muted-foreground group-hover:text-neon-cyan/70"
        }`}>
          {project.icon}
        </span>
      </div>
      <span className={`text-xs flex-1 text-left transition-colors truncate ${
        isActive
          ? "text-foreground font-semibold"
          : "text-foreground/80 group-hover:text-foreground"
      }`}>
        {project.name}
      </span>

      {/* File count badge */}
      {project.file_count > 0 && (
        <span className={`text-[10px] px-1.5 py-0.5 rounded transition-colors ${
          isActive
            ? "bg-neon-cyan/30 text-neon-cyan"
            : "bg-card/50 text-muted-foreground"
        }`}>
          {project.file_count}
        </span>
      )}

      {/* Favorite star */}
      {isFavorite && (
        <Star className={`h-3 w-3 transition-colors ${
          isActive ? "text-neon-cyan fill-neon-cyan" : "text-yellow-500 fill-yellow-500"
        }`} />
      )}
    </button>
  );
}
