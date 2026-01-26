import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoreService, WorkspaceInfo } from '../services/store.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  imports: [CommonModule, FormsModule],
})
export class SidebarComponent {
  store = inject(StoreService);

  // UI State for collapsibles
  isProjectsOpen = signal(true);

  toggleProjects() {
    this.isProjectsOpen.set(!this.isProjectsOpen());
  }

  toggleSettings() {
    // This is handled by hover for now
  }

  toggleSmartParsing() {
    this.store.settings.update(s => ({ ...s, smartParsing: !s.smartParsing }));
  }

  getInboxCount() {
    return this.store.allTasks().filter(t => !t.completed).length;
  }

  isCurrentWorkspace(workspaceId: string): boolean {
    return this.store.currentWorkspace()?.id === workspaceId;
  }

  getWorkspaceTaskCount(workspaceId: string): number {
    // If it's the current workspace, return from store
    if (this.isCurrentWorkspace(workspaceId)) {
      return this.store.allTasks().filter(t => !t.completed).length;
    }
    // Otherwise, try to get from localStorage
    return this.store.getWorkspaceTaskCount(workspaceId);
  }

  onWorkspaceSelect(workspace: WorkspaceInfo) {
    // If it's the current workspace, do nothing
    if (this.isCurrentWorkspace(workspace.id)) {
      return;
    }
    // Switch to the selected workspace (this will open the folder in VS Code)
    this.store.switchWorkspace(workspace.id);
  }
}
