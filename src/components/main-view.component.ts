import { Component, inject, signal, computed, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoreService, Task } from '../services/store.service';
import { FormsModule } from '@angular/forms';
import * as chrono from 'chrono-node';

@Component({
   selector: 'app-main-view',
   imports: [CommonModule, FormsModule],
   template: `
    <div class="h-full flex flex-col bg-[#121212] text-[#e0e0e0]">
      <!-- Header - Responsive padding -->
      <div class="px-4 pt-4 pb-3 md:px-10 md:pt-10 md:pb-6 shrink-0">
        <div class="flex items-start justify-between gap-2">
           <div class="min-w-0 flex-1">
              <h1 class="text-xl md:text-3xl font-bold text-white mb-1 md:mb-2 animate-slideIn truncate">
                {{ getViewTitle() }}
              </h1>
              <p class="text-xs md:text-sm text-[#666] animate-fadeIn">
                {{ getSubtitle() }}
              </p>
           </div>
           
           <!-- Sort & Filter -->
           <div class="flex items-center gap-2 relative shrink-0">
              <button 
                 class="flex items-center gap-1 md:gap-2 px-2 md:px-4 py-2 text-sm bg-[#1e1e1e] hover:bg-[#252525] rounded-lg transition-all border border-[#2d2d2d] btn-press"
                 (click)="toggleSortMenu()">
                 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 6h18M7 12h10M10 18h4"/>
                 </svg>
                 <span class="text-[#888] hidden md:inline">{{ getSortLabel() }}</span>
              </button>
              
              <!-- Sort Dropdown -->
              @if (isSortMenuOpen()) {
              <div class="absolute right-0 top-full mt-2 w-44 bg-[#1e1e1e] border border-[#2d2d2d] rounded-xl shadow-2xl z-20 py-2 animate-scaleIn overflow-hidden">
                 <button 
                    (click)="setSort('added')" 
                    class="w-full text-left px-4 py-2.5 text-sm hover:bg-[#252525] flex items-center gap-3 transition-colors"
                    [class.text-red-400]="sortOption() === 'added'">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                    Date Added
                 </button>
                 <button 
                    (click)="setSort('priority')" 
                    class="w-full text-left px-4 py-2.5 text-sm hover:bg-[#252525] flex items-center gap-3 transition-colors"
                    [class.text-red-400]="sortOption() === 'priority'">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    Priority
                 </button>
                 <button 
                    (click)="setSort('date')" 
                    class="w-full text-left px-4 py-2.5 text-sm hover:bg-[#252525] flex items-center gap-3 transition-colors"
                    [class.text-red-400]="sortOption() === 'date'">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    Due Date
                 </button>
              </div>
              }
           </div>
        </div>
      </div>

      <div class="flex-1 flex overflow-hidden">
        <!-- Task List - Responsive padding -->
        <div class="flex-1 overflow-y-auto px-4 pb-4 md:px-10 md:pb-10">
            
             @if (store.activeViewType() === 'settings') {
             <!-- Settings View -->
             <div class="max-w-2xl mx-auto space-y-6">
                
                <!-- Completed Tasks Section -->
                <div class="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl overflow-hidden">
                   <div class="px-5 py-4 border-b border-[#2d2d2d] flex items-center justify-between">
                      <div class="flex items-center gap-3">
                         <div class="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                            <svg class="text-green-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                               <polyline points="20 6 9 17 4 12"/>
                            </svg>
                         </div>
                         <div>
                            <h3 class="text-white font-medium">Completed Tasks</h3>
                            <p class="text-xs text-[#666]">{{ store.completedTasks().length }} tasks</p>
                         </div>
                      </div>
                   </div>
                   <div class="max-h-[300px] overflow-y-auto">
                      @if (store.completedTasks().length === 0) {
                      <div class="px-5 py-8 text-center text-[#555] text-sm">
                         No completed tasks yet
                      </div>
                      } @else {
                      @for (task of store.completedTasks(); track task.id) {
                      <div class="px-5 py-3 border-b border-[#2d2d2d] last:border-b-0 flex items-center justify-between gap-3 hover:bg-[#252525] transition-colors">
                         <div class="flex-1 min-w-0">
                            <p class="text-sm text-[#888] line-through truncate">{{ task.title }}</p>
                            @if (task.dueDate) {
                            <p class="text-xs text-[#555] mt-0.5">{{ formatDate(task.dueDate) }}</p>
                            }
                         </div>
                         <div class="flex items-center gap-2 shrink-0">
                            <button 
                               (click)="restoreCompletedTask(task.id)"
                               class="px-3 py-1.5 text-xs bg-[#252525] hover:bg-[#333] text-[#888] hover:text-white rounded-lg transition-colors">
                               Restore
                            </button>
                            <button 
                               (click)="store.deleteTask(task.id)"
                               class="px-3 py-1.5 text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors">
                               Delete
                            </button>
                         </div>
                      </div>
                      }
                      }
                   </div>
                </div>

                <!-- Trash Section -->
                <div class="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl overflow-hidden">
                   <div class="px-5 py-4 border-b border-[#2d2d2d] flex items-center justify-between">
                      <div class="flex items-center gap-3">
                         <div class="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
                            <svg class="text-red-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                               <polyline points="3 6 5 6 21 6"/>
                               <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                            </svg>
                         </div>
                         <div>
                            <h3 class="text-white font-medium">Trash</h3>
                            <p class="text-xs text-[#666]">{{ store.deletedTasks().length }} deleted tasks</p>
                         </div>
                      </div>
                      @if (store.deletedTasks().length > 0) {
                      <button 
                         (click)="emptyTrash()"
                         class="px-3 py-1.5 text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors">
                         Empty Trash
                      </button>
                      }
                   </div>
                   <div class="max-h-[300px] overflow-y-auto">
                      @if (store.deletedTasks().length === 0) {
                      <div class="px-5 py-8 text-center text-[#555] text-sm">
                         Trash is empty
                      </div>
                      } @else {
                      @for (task of store.deletedTasks(); track task.id) {
                      <div class="px-5 py-3 border-b border-[#2d2d2d] last:border-b-0 flex items-center justify-between gap-3 hover:bg-[#252525] transition-colors">
                         <div class="flex-1 min-w-0">
                            <p class="text-sm text-[#888] truncate">{{ task.title }}</p>
                            @if (task.deletedAt) {
                            <p class="text-xs text-[#555] mt-0.5">Deleted {{ formatDate(task.deletedAt.split('T')[0]) }}</p>
                            }
                         </div>
                         <div class="flex items-center gap-2 shrink-0">
                            <button 
                               (click)="restoreDeletedTask(task.id)"
                               class="px-3 py-1.5 text-xs bg-[#252525] hover:bg-[#333] text-[#888] hover:text-white rounded-lg transition-colors">
                               Restore
                            </button>
                            <button 
                               (click)="permanentlyDeleteTask(task.id)"
                               class="px-3 py-1.5 text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors">
                               Delete Forever
                            </button>
                         </div>
                      </div>
                      }
                      }
                   </div>
                </div>

                <!-- App Settings Section -->
                <div class="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl overflow-hidden">
                   <div class="px-5 py-4 border-b border-[#2d2d2d]">
                      <div class="flex items-center gap-3">
                         <div class="w-8 h-8 rounded-lg bg-[#252525] flex items-center justify-center">
                            <svg class="text-[#888]" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                               <circle cx="12" cy="12" r="3"/>
                               <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>
                            </svg>
                         </div>
                         <h3 class="text-white font-medium">Preferences</h3>
                      </div>
                   </div>
                   <div class="divide-y divide-[#2d2d2d]">
                      <div class="px-5 py-4 flex items-center justify-between">
                         <div>
                            <p class="text-sm text-white">Smart Date Parsing</p>
                            <p class="text-xs text-[#666] mt-0.5">Automatically detect dates like "tomorrow" or "next week"</p>
                         </div>
                         <button 
                            (click)="toggleSmartParsing()"
                            class="w-10 h-5 rounded-full relative transition-colors"
                            [class.bg-green-500]="store.settings().smartParsing"
                            [class.bg-[#444]]="!store.settings().smartParsing">
                            <div 
                               class="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
                               [class.left-0.5]="!store.settings().smartParsing"
                               [class.left-5]="store.settings().smartParsing">
                            </div>
                         </button>
                      </div>
                   </div>
                </div>
                
             </div>
             } @else {
             <!-- Add Task Button / Form -->
             <div class="mb-4 md:mb-8 w-full flex justify-center">
                <div class="w-full max-w-2xl transition-all duration-300" [class.max-w-full]="store.isSidebarMode()">
                   @if (!isAdding()) {
                   <button 
                      (click)="isAdding.set(true)"
                      class="w-full py-3 md:py-4 border-2 border-dashed border-[#2d2d2d] rounded-xl text-[#555] hover:text-red-400 hover:border-red-400/30 transition-all flex items-center justify-center gap-2 md:gap-3 group">
                      <div class="w-6 h-6 md:w-8 md:h-8 rounded-full bg-[#1e1e1e] group-hover:bg-red-500/10 flex items-center justify-center transition-colors">
                         <svg class="text-[#555] group-hover:text-red-400 transition-colors" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 5v14M5 12h14"/>
                         </svg>
                      </div>
                      <span class="font-medium text-sm md:text-base">Add task</span>
                   </button>
                   } @else {
                   <div class="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-3 md:p-5 shadow-xl animate-scaleIn relative">
                      <input 
                         #taskInput
                         type="text" 
                         [(ngModel)]="newTaskTitle"
                         (ngModelChange)="onInputChange($event)"
                         (keyup.enter)="addTask()" 
                         (keyup.escape)="isAdding.set(false)"
                         placeholder="What needs to be done?" 
                         class="w-full bg-transparent text-white placeholder-[#555] text-sm md:text-base focus:outline-none mb-3 md:mb-4 font-medium"
                         autofocus
                      >
                      
                      <div class="flex flex-col md:flex-row md:items-center justify-between gap-3">
                         <div class="flex items-center gap-2 md:gap-3 flex-wrap">
                            <!-- Due Date Button -->
                            <button 
                               (click)="openDatePicker('new')"
                               class="flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1.5 md:py-2 rounded-lg border border-[#2d2d2d] hover:border-[#444] transition-colors text-xs md:text-sm"
                               [class.text-green-400]="newTaskDueDate"
                               [class.border-green-400/30]="newTaskDueDate">
                               <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                  <line x1="16" y1="2" x2="16" y2="6"/>
                                  <line x1="8" y1="2" x2="8" y2="6"/>
                                  <line x1="3" y1="10" x2="21" y2="10"/>
                               </svg>
                               <span>{{ newTaskDueDate ? formatDate(newTaskDueDate) : 'Date' }}</span>
                            </button>
                            
                            <!-- Project Selector -->
                            <div class="relative">
                               <button 
                                  (click)="toggleProjectMenu()"
                                  class="flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1.5 md:py-2 rounded-lg border border-[#2d2d2d] hover:border-[#444] transition-colors text-xs md:text-sm max-w-[150px]">
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                     <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
                                  </svg>
                                  <span class="truncate">{{ getSelectedProjectName() }}</span>
                               </button>
                               
                               @if (isProjectMenuOpen()) {
                               <div class="absolute top-full left-0 mt-2 w-56 bg-[#1e1e1e] border border-[#2d2d2d] rounded-xl shadow-2xl z-20 py-1 animate-scaleIn overflow-hidden max-h-[300px] overflow-y-auto">
                                  <!-- Current Workspace -->
                                  @if (store.currentWorkspace(); as ws) {
                                  <button 
                                     (click)="selectProject(ws.id)"
                                     class="w-full text-left px-3 py-2 text-xs hover:bg-[#252525] flex items-center gap-2 transition-colors border-b border-[#2d2d2d/50]"
                                     [class.text-red-400]="newTaskProjectId() === ws.id || (!newTaskProjectId() && ws.id === store.workspaceId())">
                                     <div class="w-2 h-2 rounded-full bg-red-500"></div>
                                     <span class="truncate flex-1">{{ ws.name }}</span>
                                     @if (newTaskProjectId() === ws.id || (!newTaskProjectId() && ws.id === store.workspaceId())) {
                                     <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                                     }
                                  </button>
                                  }
                                  <!-- Recent Workspaces -->
                                  @for (ws of store.recentWorkspaces(); track ws.id) {
                                     @if (ws.id !== store.currentWorkspace()?.id) {
                                     <button 
                                        (click)="selectProject(ws.id)"
                                        class="w-full text-left px-3 py-2 text-xs hover:bg-[#252525] flex items-center gap-2 transition-colors"
                                        [class.text-red-400]="newTaskProjectId() === ws.id">
                                        <div class="w-2 h-2 rounded-full bg-[#444]"></div>
                                        <span class="truncate flex-1">{{ ws.name }}</span>
                                        @if (newTaskProjectId() === ws.id) {
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                                        }
                                     </button>
                                     }
                                  }
                               </div>
                               }
                            </div>

                            <!-- Priority Selector -->
                            <div class="flex rounded-lg border border-[#2d2d2d] overflow-hidden">
                               @for (p of [1,2,3,4]; track p) {
                               <button 
                                  (click)="newTaskPriority.set(p)"
                                  class="w-7 h-7 md:w-9 md:h-9 flex items-center justify-center text-[10px] md:text-xs font-bold transition-all"
                                  [class]="getPriorityButtonClass(p, newTaskPriority() === p)">
                                  P{{ p }}
                               </button>
                               }
                            </div>
                         </div>
                         
                         <div class="flex items-center gap-2 md:gap-3 justify-end">
                            <button 
                               (click)="isAdding.set(false)" 
                               class="px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm text-[#888] hover:text-white transition-colors btn-press">
                               Cancel
                            </button>
                            <button 
                               (click)="addTask()" 
                               class="px-3 md:px-5 py-1.5 md:py-2 text-xs md:text-sm bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-lg hover:opacity-90 transition-opacity btn-press font-medium disabled:opacity-40"
                               [disabled]="!newTaskTitle.trim()">
                               Add
                            </button>
                         </div>
                      </div>
                   </div>
                   }
                </div>
             </div>

            <!-- Task List -->
            <div class="flex flex-col gap-1 md:gap-2">
               @for (task of sortedTasks(); track task.id; let i = $index) {
               <div 
                  (click)="selectedTaskId.set(task.id)"
                  class="task-item group flex items-start gap-2 md:gap-4 p-2.5 md:p-4 rounded-lg md:rounded-xl cursor-pointer border border-transparent hover:border-[#2d2d2d] transition-all"
                  [class.bg-[#1a1a1a]]="selectedTaskId() === task.id"
                  [class.border-[#2d2d2d]]="selectedTaskId() === task.id"
                  [style.animation-delay]="i * 30 + 'ms'"
                  style="animation: slideIn 0.3s ease-out backwards;">
                  
                  <!-- Checkbox -->
                  <button 
                     (click)="$event.stopPropagation(); toggleTask(task)"
                     class="mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all checkbox-animate hover:scale-110"
                     [class]="getCheckboxClass(task)">
                     @if (task.completed) {
                     <svg class="animate-checkmark" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                        <polyline points="20 6 9 17 4 12"/>
                     </svg>
                     }
                  </button>
                  
                  <!-- Content -->
                  <div class="flex-1 min-w-0">
                     <div 
                        class="text-[15px] leading-relaxed transition-all"
                        [class.line-through]="task.completed" 
                        [class.text-[#555]]="task.completed"
                        [class.text-white]="!task.completed">
                        {{ task.title }}
                     </div>
                     
                     <!-- Meta info -->
                     <div class="flex items-center gap-3 mt-2 text-xs text-[#555]">
                        @if (task.dueDate) {
                        <span class="flex items-center gap-1.5" [class.text-red-400]="isOverdue(task.dueDate)" [class.text-green-400]="isToday(task.dueDate)">
                           <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                              <line x1="16" y1="2" x2="16" y2="6"/>
                              <line x1="8" y1="2" x2="8" y2="6"/>
                              <line x1="3" y1="10" x2="21" y2="10"/>
                           </svg>
                           {{ formatDate(task.dueDate) }}
                        </span>
                        }
                        
                        @if (task.description) {
                        <span class="flex items-center gap-1.5">
                           <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                              <line x1="17" y1="10" x2="3" y2="10"/>
                              <line x1="21" y1="6" x2="3" y2="6"/>
                              <line x1="21" y1="14" x2="3" y2="14"/>
                              <line x1="17" y1="18" x2="3" y2="18"/>
                           </svg>
                           Note
                        </span>
                        }
                        
                        @for (label of task.labels; track label) {
                        <span class="px-2 py-0.5 rounded-full bg-[#252525] text-[#888]">#{{ label }}</span>
                        }
                     </div>
                  </div>
                  
                  <!-- Priority Badge -->
                  <div 
                     class="w-2 h-2 rounded-full opacity-60 group-hover:opacity-100 transition-opacity"
                     [class]="getPriorityDotClass(task.priority)">
                  </div>
               </div>
               }
            </div>
            
            <!-- Empty State -->
            @if (sortedTasks().length === 0) {
            <div class="flex flex-col items-center justify-center py-20 animate-fadeIn">
               <div class="w-20 h-20 rounded-full bg-[#1a1a1a] flex items-center justify-center mb-6">
                  <svg class="text-[#333]" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                     <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                     <polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
               </div>
               <h3 class="text-lg font-medium text-[#555] mb-2">All clear!</h3>
               <p class="text-sm text-[#444]">No tasks here. Enjoy your day.</p>
            </div>
            }
            }
        </div>

        <!-- Task Details Panel - Modal on small screens, side panel on large -->
        @if (selectedTask(); as task) {
        <!-- Backdrop for modal mode -->
        <div class="fixed inset-0 bg-black/60 z-40 md:hidden animate-fadeIn" (click)="selectedTaskId.set(null)"></div>
        
        <div class="fixed inset-x-0 bottom-0 max-h-[85vh] md:relative md:inset-auto md:max-h-none md:w-[400px] border-t md:border-t-0 md:border-l border-[#2d2d2d] flex flex-col bg-[#1a1a1a] animate-slideInRight z-50 md:z-auto rounded-t-2xl md:rounded-none">
            <!-- Panel Header -->
            <div class="px-4 md:px-6 py-3 md:py-4 border-b border-[#2d2d2d] flex items-center justify-between">
               <span class="text-xs font-medium text-[#666] uppercase tracking-wider">Task Details</span>
               <button 
                  (click)="selectedTaskId.set(null)" 
                  class="w-8 h-8 rounded-lg hover:bg-[#252525] flex items-center justify-center text-[#666] hover:text-white transition-colors btn-press">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                     <line x1="18" y1="6" x2="6" y2="18"/>
                     <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
               </button>
            </div>

            <!-- Panel Content -->
            <div class="flex-1 overflow-y-auto p-4 md:p-6">
               <!-- Task Title & Checkbox -->
               <div class="flex gap-4 mb-6">
                  <button 
                     (click)="toggleTask(task)"
                     class="mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all checkbox-animate shrink-0"
                     [class]="getCheckboxClass(task)">
                     @if (task.completed) {
                     <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                        <polyline points="20 6 9 17 4 12"/>
                     </svg>
                     }
                  </button>
                  
                  <textarea 
                     [ngModel]="task.title" 
                     (ngModelChange)="updateTaskTitle(task.id, $event)"
                     class="flex-1 bg-transparent text-xl font-semibold text-white placeholder-[#555] focus:outline-none resize-none overflow-hidden leading-tight"
                     rows="1"
                     placeholder="Task name">
                  </textarea>
               </div>

               <!-- Description -->
               <div class="mb-6">
                  <label class="text-xs font-medium text-[#555] uppercase tracking-wider mb-2 block">Description</label>
                  <textarea 
                     [ngModel]="task.description" 
                     (ngModelChange)="updateTaskDescription(task.id, $event)"
                     class="w-full bg-[#252525] text-sm text-[#ccc] placeholder-[#555] focus:outline-none resize-none rounded-lg p-4 min-h-[100px] border border-transparent focus:border-[#333] transition-colors"
                     placeholder="Add a description...">
                  </textarea>
               </div>

               <!-- Due Date -->
               <div class="mb-6">
                  <label class="text-xs font-medium text-[#555] uppercase tracking-wider mb-2 block">Due Date</label>
                  <button 
                     (click)="openDatePicker('edit', task.id, task.dueDate)"
                     class="w-full flex items-center gap-3 px-4 py-3 bg-[#252525] rounded-lg text-left hover:bg-[#2a2a2a] transition-colors"
                     [class.text-green-400]="task.dueDate && isToday(task.dueDate)"
                     [class.text-red-400]="task.dueDate && isOverdue(task.dueDate)">
                     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                     </svg>
                     <span class="text-sm">{{ task.dueDate ? formatDateLong(task.dueDate) : 'Set due date' }}</span>
                     @if (task.dueDate) {
                     <button 
                        (click)="$event.stopPropagation(); clearDueDate(task.id)"
                        class="ml-auto text-[#555] hover:text-red-400 transition-colors">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                           <line x1="18" y1="6" x2="6" y2="18"/>
                           <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                     </button>
                     }
                  </button>
               </div>

               <!-- Priority -->
               <div class="mb-6">
                  <label class="text-xs font-medium text-[#555] uppercase tracking-wider mb-2 block">Priority</label>
                  <div class="flex gap-2">
                     @for (p of [1,2,3,4]; track p) {
                     <button 
                        (click)="store.updateTask(task.id, { priority: p })"
                        class="flex-1 py-3 rounded-lg text-sm font-medium transition-all btn-press"
                        [class]="getPriorityButtonClass(p, task.priority === p)">
                        P{{ p }}
                     </button>
                     }
                  </div>
               </div>

               <!-- Labels -->
               <div class="mb-6">
                  <label class="text-xs font-medium text-[#555] uppercase tracking-wider mb-2 block">Labels</label>
                  <div class="flex flex-wrap gap-2 mb-3">
                     @for (label of task.labels; track label) {
                     <div class="flex items-center gap-2 px-3 py-1.5 bg-[#252525] rounded-lg text-sm">
                        <span class="text-[#888]">#{{ label }}</span>
                        <button 
                           (click)="removeLabel(task.id, label)" 
                           class="text-[#555] hover:text-red-400 transition-colors">
                           <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                              <line x1="18" y1="6" x2="6" y2="18"/>
                              <line x1="6" y1="6" x2="18" y2="18"/>
                           </svg>
                        </button>
                     </div>
                     }
                  </div>
                  <input 
                     #labelInput
                     (keyup.enter)="addLabel(task.id, labelInput)"
                     type="text" 
                     placeholder="Add label and press Enter" 
                     class="w-full bg-[#252525] border border-transparent focus:border-[#333] rounded-lg px-4 py-3 text-sm text-white placeholder-[#555] focus:outline-none transition-colors"
                  >
               </div>
            </div>
            
            <!-- Panel Footer -->
            <div class="px-6 py-4 border-t border-[#2d2d2d]">
               <button 
                  (click)="deleteSelectedTask(task.id)" 
                  class="w-full py-3 text-sm text-red-400 hover:bg-red-400/10 rounded-lg transition-colors flex items-center justify-center gap-2 btn-press">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                     <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                  </svg>
                  Delete Task
               </button>
            </div>
        </div>
        }
      </div>

             <!-- Date Picker Modal -->
             @if (isDatePickerOpen()) {
             <div 
                class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 modal-backdrop animate-fadeIn"
                (click)="closeDatePicker()">
                <div 
                   class="bg-[#1e1e1e] rounded-2xl shadow-2xl border border-[#2d2d2d] w-[340px] animate-scaleIn overflow-hidden"
                   (click)="$event.stopPropagation()">
                   <!-- Existing Date Picker Content -->
                   <!-- Calendar Header -->
                   <div class="px-6 py-4 border-b border-[#2d2d2d] flex items-center justify-between">
                      <button 
                         (click)="prevMonth()"
                         class="w-8 h-8 rounded-lg hover:bg-[#252525] flex items-center justify-center text-[#888] hover:text-white transition-colors btn-press">
                         <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="15 18 9 12 15 6"/>
                         </svg>
                      </button>
                      <span class="font-semibold text-white">{{ getMonthYearLabel() }}</span>
                      <button 
                         (click)="nextMonth()"
                         class="w-8 h-8 rounded-lg hover:bg-[#252525] flex items-center justify-center text-[#888] hover:text-white transition-colors btn-press">
                         <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="9 18 15 12 9 6"/>
                         </svg>
                      </button>
                   </div>
                   
                   <!-- Quick Select -->
                   <div class="px-4 py-3 border-b border-[#2d2d2d] flex gap-2">
                      <button 
                         (click)="selectToday()"
                         class="flex-1 py-2 text-xs font-medium rounded-lg transition-colors"
                         [class.bg-green-500]="isSelectedDate(getTodayDate())"
                         [class.text-white]="isSelectedDate(getTodayDate())"
                         [class.bg-[#252525]]="!isSelectedDate(getTodayDate())"
                         [class.text-green-400]="!isSelectedDate(getTodayDate())"
                         [class.hover:bg-green-500/20]="!isSelectedDate(getTodayDate())">
                         Today
                      </button>
                      <button 
                         (click)="selectTomorrow()"
                         class="flex-1 py-2 text-xs font-medium rounded-lg transition-colors"
                         [class.bg-blue-500]="isSelectedDate(getTomorrowDate())"
                         [class.text-white]="isSelectedDate(getTomorrowDate())"
                         [class.bg-[#252525]]="!isSelectedDate(getTomorrowDate())"
                         [class.text-blue-400]="!isSelectedDate(getTomorrowDate())"
                         [class.hover:bg-blue-500/20]="!isSelectedDate(getTomorrowDate())">
                         Tomorrow
                      </button>
                      <button 
                         (click)="selectNextWeek()"
                         class="flex-1 py-2 text-xs font-medium rounded-lg transition-colors"
                         [class.bg-purple-500]="isSelectedDate(getNextWeekDate())"
                         [class.text-white]="isSelectedDate(getNextWeekDate())"
                         [class.bg-[#252525]]="!isSelectedDate(getNextWeekDate())"
                         [class.text-purple-400]="!isSelectedDate(getNextWeekDate())"
                         [class.hover:bg-purple-500/20]="!isSelectedDate(getNextWeekDate())">
                         Next Week
                      </button>
                   </div>
                   
                   <!-- Calendar Grid -->
                   <div class="p-4">
                      <!-- Weekday Headers -->
                      <div class="grid grid-cols-7 gap-1 mb-2">
                         @for (day of ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']; track day) {
                         <div class="h-8 flex items-center justify-center text-xs text-[#555] font-medium">
                            {{ day }}
                         </div>
                         }
                      </div>
                      
                      <!-- Calendar Days -->
                      <div class="grid grid-cols-7 gap-1">
                         @for (day of calendarDays(); track $index) {
                         <button 
                            (click)="day.date && selectDate(day.date)"
                            class="h-10 rounded-lg text-sm font-medium transition-all btn-press flex items-center justify-center"
                            [class.text-[#333]]="!day.currentMonth"
                            [class.text-[#888]]="day.currentMonth && !day.isToday && !isSelectedDate(day.date)"
                            [class.text-white]="day.isToday || isSelectedDate(day.date)"
                            [class.bg-gradient-to-r]="isSelectedDate(day.date)"
                            [class.from-red-500]="isSelectedDate(day.date)"
                            [class.to-orange-500]="isSelectedDate(day.date)"
                            [class.ring-2]="day.isToday && !isSelectedDate(day.date)"
                            [class.ring-green-500]="day.isToday && !isSelectedDate(day.date)"
                            [class.hover:bg-[#252525]]="!isSelectedDate(day.date)"
                            [disabled]="!day.date">
                            {{ day.day || '' }}
                         </button>
                         }
                      </div>
                   </div>
                   
                   <!-- Footer -->
                   <div class="px-4 py-3 border-t border-[#2d2d2d] flex justify-between">
                      <button 
                         (click)="clearDateSelection()"
                         class="px-4 py-2 text-sm text-[#888] hover:text-white transition-colors btn-press">
                         Clear
                      </button>
                      <button 
                         (click)="confirmDateSelection()"
                         class="px-5 py-2 text-sm bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-lg hover:opacity-90 transition-opacity btn-press font-medium">
                         Done
                      </button>
                   </div>
                </div>
                      </div>
              }
              
              <!-- Undo Toast -->
              @if (lastCompletedTaskId()) {
              <div class="absolute bottom-6 left-1/2 -translate-x-1/2 bg-[#1e1e1e] border border-[#2d2d2d] shadow-2xl rounded-full px-5 py-3 flex items-center gap-4 animate-slideUp z-30">
                 <span class="text-sm text-white">Task completed</span>
                 <button 
                    (click)="undoCompletion()"
                    class="text-sm font-medium text-red-400 hover:text-red-300 transition-colors">
                    Undo
                 </button>
                 <button 
                    (click)="lastCompletedTaskId.set(null)"
                    class="text-[#666] hover:text-white transition-colors">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                       <line x1="18" y1="6" x2="6" y2="18"/>
                       <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                 </button>
              </div>
               }
              </div>
              `,
})
export class MainViewComponent {
   store = inject(StoreService);

   isAdding = signal(false);
   newTaskTitle = '';
   newTaskDueDate = '';
   newTaskPriority = signal<1 | 2 | 3 | 4>(4);
   newTaskProjectId = signal<string | null>(null);

   isSortMenuOpen = signal(false);
   isProjectMenuOpen = signal(false);
   sortOption = signal<'added' | 'priority' | 'date'>('added');

   selectedTaskId = signal<string | null>(null);
   selectedTask = computed(() =>
      this.store.allTasks().find(t => t.id === this.selectedTaskId())
   );

   // Date picker state
   isDatePickerOpen = signal(false);
   datePickerMode = signal<'new' | 'edit'>('new');
   datePickerTaskId = signal<string | null>(null);
   selectedDate = signal<string>('');
   currentMonth = signal(new Date());

   calendarDays = computed(() => {
      const date = this.currentMonth();
      const year = date.getFullYear();
      const month = date.getMonth();

      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const startPadding = firstDay.getDay();
      const totalDays = lastDay.getDate();

      const days: { day: number | null; date: string | null; currentMonth: boolean; isToday: boolean }[] = [];
      const today = new Date().toISOString().split('T')[0];

      // Previous month padding
      const prevMonthLastDay = new Date(year, month, 0).getDate();
      for (let i = startPadding - 1; i >= 0; i--) {
         const d = prevMonthLastDay - i;
         const dateStr = this.formatDateISO(year, month - 1, d);
         days.push({ day: d, date: dateStr, currentMonth: false, isToday: dateStr === today });
      }

      // Current month
      for (let d = 1; d <= totalDays; d++) {
         const dateStr = this.formatDateISO(year, month, d);
         days.push({ day: d, date: dateStr, currentMonth: true, isToday: dateStr === today });
      }

      // Next month padding
      const remaining = 42 - days.length;
      for (let d = 1; d <= remaining; d++) {
         const dateStr = this.formatDateISO(year, month + 1, d);
         days.push({ day: d, date: dateStr, currentMonth: false, isToday: dateStr === today });
      }

      return days;
   });

   sortedTasks = computed(() => {
      const tasks = [...this.store.tasksForActiveView()];
      const sort = this.sortOption();

      if (sort === 'priority') {
         return tasks.sort((a, b) => a.priority - b.priority);
      }
      if (sort === 'date') {
         return tasks.sort((a, b) => {
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;
            return a.dueDate.localeCompare(b.dueDate);
         });
      }
      return tasks;
   });

   getViewTitle() {
      const id = this.store.activeViewId();
      const type = this.store.activeViewType();
      if (type === 'inbox') return 'All Tasks';
      if (type === 'today') return 'Today';
      if (type === 'upcoming') return 'Upcoming';
      if (type === 'completed') return 'Completed Tasks';
      if (type === 'settings') return 'Settings';
      if (type === 'label') return '#' + id.substring(6);
      return this.store.workspaceName();
   }

   getSubtitle() {
      const type = this.store.activeViewType();
      const count = this.sortedTasks().length;
      const taskWord = count === 1 ? 'task' : 'tasks';

      if (type === 'today') {
         return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
      }
      if (type === 'completed') {
         return `${count} completed ${taskWord}`;
      }
      if (type === 'settings') {
         return 'Manage completed and deleted tasks';
      }
      return `${count} ${taskWord}`;
   }

   restoreDeletedTask(taskId: string) {
      this.store.restoreTask(taskId);
   }

   permanentlyDeleteTask(taskId: string) {
      this.store.purgeTask(taskId);
   }

   restoreCompletedTask(taskId: string) {
      this.store.updateTask(taskId, { completed: false });
   }

   emptyTrash() {
      const deletedTasks = this.store.deletedTasks();
      deletedTasks.forEach(t => this.store.purgeTask(t.id));
   }

   toggleSmartParsing() {
      this.store.settings.update(s => ({ ...s, smartParsing: !s.smartParsing }));
   }

   getSortLabel() {
      const opt = this.sortOption();
      if (opt === 'priority') return 'Priority';
      if (opt === 'date') return 'Due Date';
      return 'Date Added';
   }

   // Date helpers
   formatDateISO(year: number, month: number, day: number): string {
      const d = new Date(year, month, day);
      return d.toISOString().split('T')[0];
   }

   formatDate(dateStr: string): string {
      const date = new Date(dateStr + 'T00:00:00');
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      if (dateStr === today.toISOString().split('T')[0]) return 'Today';
      if (dateStr === tomorrow.toISOString().split('T')[0]) return 'Tomorrow';

      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
   }

   formatDateLong(dateStr: string): string {
      const date = new Date(dateStr + 'T00:00:00');
      return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
   }

   isToday(dateStr: string): boolean {
      return dateStr === new Date().toISOString().split('T')[0];
   }

   isOverdue(dateStr: string): boolean {
      return dateStr < new Date().toISOString().split('T')[0];
   }

   getTodayDate(): string {
      return new Date().toISOString().split('T')[0];
   }

   getTomorrowDate(): string {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      return d.toISOString().split('T')[0];
   }

   getNextWeekDate(): string {
      const d = new Date();
      d.setDate(d.getDate() + 7);
      return d.toISOString().split('T')[0];
   }

   getMonthYearLabel(): string {
      return this.currentMonth().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
   }

   // Date picker methods
   openDatePicker(mode: 'new' | 'edit', taskId?: string, currentDate?: string) {
      this.datePickerMode.set(mode);
      this.datePickerTaskId.set(taskId || null);
      this.selectedDate.set(currentDate || this.newTaskDueDate || '');
      if (currentDate) {
         this.currentMonth.set(new Date(currentDate + 'T00:00:00'));
      } else {
         this.currentMonth.set(new Date());
      }
      this.isDatePickerOpen.set(true);
   }

   closeDatePicker() {
      this.isDatePickerOpen.set(false);
   }

   prevMonth() {
      const d = new Date(this.currentMonth());
      d.setMonth(d.getMonth() - 1);
      this.currentMonth.set(d);
   }

   nextMonth() {
      const d = new Date(this.currentMonth());
      d.setMonth(d.getMonth() + 1);
      this.currentMonth.set(d);
   }

   selectDate(date: string | null) {
      if (date) this.selectedDate.set(date);
   }

   selectToday() {
      this.selectedDate.set(this.getTodayDate());
   }

   selectTomorrow() {
      this.selectedDate.set(this.getTomorrowDate());
   }

   selectNextWeek() {
      this.selectedDate.set(this.getNextWeekDate());
   }

   isSelectedDate(date: string | null): boolean {
      return date === this.selectedDate();
   }

   clearDateSelection() {
      this.selectedDate.set('');
   }

   confirmDateSelection() {
      const mode = this.datePickerMode();
      const date = this.selectedDate();

      if (mode === 'new') {
         this.newTaskDueDate = date;
      } else {
         const taskId = this.datePickerTaskId();
         if (taskId) {
            this.store.updateTask(taskId, { dueDate: date || undefined });
         }
      }

      this.closeDatePicker();
   }

   clearDueDate(taskId: string) {
      this.store.updateTask(taskId, { dueDate: undefined });
   }

   // Styling helpers
   getPriorityButtonClass(priority: number, isSelected: boolean): string {
      const colors: Record<number, { selected: string; unselected: string }> = {
         1: { selected: 'bg-red-500 text-white', unselected: 'bg-[#252525] text-red-400 hover:bg-red-500/20' },
         2: { selected: 'bg-orange-500 text-white', unselected: 'bg-[#252525] text-orange-400 hover:bg-orange-500/20' },
         3: { selected: 'bg-blue-500 text-white', unselected: 'bg-[#252525] text-blue-400 hover:bg-blue-500/20' },
         4: { selected: 'bg-[#444] text-white', unselected: 'bg-[#252525] text-[#666] hover:bg-[#333]' }
      };
      return isSelected ? colors[priority].selected : colors[priority].unselected;
   }

   getCheckboxClass(task: Task): string {
      const colors: Record<number, string> = {
         1: 'border-red-500 text-red-500',
         2: 'border-orange-500 text-orange-500',
         3: 'border-blue-500 text-blue-500',
         4: 'border-[#555] text-[#555]'
      };
      if (task.completed) {
         return colors[task.priority] + ' bg-current';
      }
      return colors[task.priority] + ' hover:bg-current/20';
   }

   getPriorityDotClass(priority: number): string {
      const colors: Record<number, string> = {
         1: 'bg-red-500',
         2: 'bg-orange-500',
         3: 'bg-blue-500',
         4: 'bg-[#444]'
      };
      return colors[priority];
   }

   // Task methods
   onInputChange(value: string) {
      if (!this.store.settings().smartParsing) return;

      // Priority Parsing (p1, p2, p3, p4)
      const priorityMatch = value.match(/(?:^|\s)p([1-4])(?:$|\s)/i);
      if (priorityMatch) {
         this.newTaskPriority.set(parseInt(priorityMatch[1]) as 1 | 2 | 3 | 4);
      }

      // Date Parsing
      const parsedDate = chrono.parseDate(value);
      if (parsedDate) {
         this.newTaskDueDate = this.formatDateISO(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate());
      }
   }

   addTask() {
      if (!this.newTaskTitle.trim()) return;

      // Clean up title before adding (remove priority and date text)
      let cleanTitle = this.newTaskTitle;

      if (this.store.settings().smartParsing) {
         // Remove priority
         cleanTitle = cleanTitle.replace(/(?:^|\s)p([1-4])(?:$|\s)/i, ' ').trim();

         // Remove date (using chrono results to locate text)
         const results = chrono.parse(this.newTaskTitle);
         results.forEach(result => {
            cleanTitle = cleanTitle.replace(result.text, '').trim();
         });

         // Remove double spaces
         cleanTitle = cleanTitle.replace(/\s+/g, ' ').trim();
      }

      if (!cleanTitle) cleanTitle = this.newTaskTitle; // Fallback if we stripped everything

      this.store.addTask(
         cleanTitle,
         this.newTaskPriority(),
         this.newTaskDueDate || undefined,
         this.newTaskProjectId() || undefined
      );

      // Reset form
      this.newTaskTitle = '';
      this.newTaskDueDate = '';
      this.newTaskPriority.set(4);
      this.newTaskProjectId.set(null);
      this.isAdding.set(false); // Close the input
   }

   toggleProjectMenu() {
      this.isProjectMenuOpen.update(v => !v);
   }

   selectProject(projectId: string) {
      this.newTaskProjectId.set(projectId);
      this.isProjectMenuOpen.set(false);
   }

   getSelectedProjectName() {
      const projectId = this.newTaskProjectId();
      if (!projectId) return 'Current Project';

      const current = this.store.currentWorkspace();
      if (current && current.id === projectId) return current.name;

      const recent = this.store.recentWorkspaces().find(w => w.id === projectId);
      return recent ? recent.name : 'Unknown Project';
   }

   // Undo state
   lastCompletedTaskId = signal<string | null>(null);
   undoTimeout: any = null;

   toggleTask(task: Task) {
      const wasCompleted = task.completed;
      this.store.toggleTask(task.id);

      if (!wasCompleted) {
         // Task just completed
         this.lastCompletedTaskId.set(task.id);

         // Clear previous timeout
         if (this.undoTimeout) clearTimeout(this.undoTimeout);

         // Auto-hide after 5 seconds
         this.undoTimeout = setTimeout(() => {
            this.lastCompletedTaskId.set(null);
         }, 5000);
      }
   }

   undoCompletion() {
      const id = this.lastCompletedTaskId();
      if (id) {
         this.store.toggleTask(id);
         this.lastCompletedTaskId.set(null);
         if (this.undoTimeout) clearTimeout(this.undoTimeout);
      }
   }

   toggleSortMenu() {
      this.isSortMenuOpen.update(v => !v);
   }

   setSort(option: 'added' | 'priority' | 'date') {
      this.sortOption.set(option);
      this.isSortMenuOpen.set(false);
   }

   updateTaskTitle(id: string, title: string) {
      this.store.updateTask(id, { title });
   }

   updateTaskDescription(id: string, description: string) {
      this.store.updateTask(id, { description });
   }

   addLabel(taskId: string, labelInput: HTMLInputElement) {
      const label = labelInput.value.trim();
      if (!label) return;

      const task = this.store.allTasks().find(t => t.id === taskId);
      if (task) {
         const labels = task.labels || [];
         if (!labels.includes(label)) {
            this.store.updateTask(taskId, { labels: [...labels, label] });
         }
      }
      labelInput.value = '';
   }

   removeLabel(taskId: string, labelToRemove: string) {
      const task = this.store.allTasks().find(t => t.id === taskId);
      if (task) {
         const labels = task.labels || [];
         this.store.updateTask(taskId, { labels: labels.filter(l => l !== labelToRemove) });
      }
   }

   deleteSelectedTask(id: string) {
      this.store.deleteTask(id);
      this.selectedTaskId.set(null);
   }
}
