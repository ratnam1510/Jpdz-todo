import {
  Component,
  inject,
  signal,
  computed,
  effect,
  ElementRef,
  ViewChild,
  HostListener,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoreService, Task } from '../services/store.service';
import { FormsModule } from '@angular/forms';
import * as chrono from 'chrono-node';
import { DateUtils } from '../utils/date-utils';
import { APP_CONSTANTS, PRIORITY_COLORS } from '../constants';
import { isValidPriority } from '../utils/validators';

@Component({
  selector: 'app-main-view',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="h-full flex flex-col bg-[#121212] text-[#e0e0e0]" (keydown)="onKeyDown($event)">
      <!-- Sidebar Mode Navigation Bar - Responsive -->
      @if (store.isSidebarMode()) {
        <div class="px-2 pt-2 pb-1.5 shrink-0 border-b border-[#2d2d2d]">
          <div class="flex items-center justify-between gap-0.5">
            <button
              (click)="store.activeViewId.set('inbox')"
              class="flex-1 flex items-center justify-center gap-1 px-1.5 py-1.5 rounded-lg text-[10px] font-medium whitespace-nowrap transition-colors min-w-0"
              [class.bg-blue-500/20]="store.activeViewId() === 'inbox'"
              [class.text-blue-400]="store.activeViewId() === 'inbox'"
              [class.text-[#888]]="store.activeViewId() !== 'inbox'"
              [class.hover:bg-[#252525]]="store.activeViewId() !== 'inbox'"
              title="All Tasks"
            >
              <svg
                class="shrink-0"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <span class="hidden min-[200px]:inline truncate">All</span>
            </button>
            <button
              (click)="store.activeViewId.set('today')"
              class="flex-1 flex items-center justify-center gap-1 px-1.5 py-1.5 rounded-lg text-[10px] font-medium whitespace-nowrap transition-colors min-w-0"
              [class.bg-green-500/20]="store.activeViewId() === 'today'"
              [class.text-green-400]="store.activeViewId() === 'today'"
              [class.text-[#888]]="store.activeViewId() !== 'today'"
              [class.hover:bg-[#252525]]="store.activeViewId() !== 'today'"
              title="Today"
            >
              <svg
                class="shrink-0"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span class="hidden min-[200px]:inline truncate">Today</span>
            </button>
            <button
              (click)="store.activeViewId.set('upcoming')"
              class="flex-1 flex items-center justify-center gap-1 px-1.5 py-1.5 rounded-lg text-[10px] font-medium whitespace-nowrap transition-colors min-w-0"
              [class.bg-purple-500/20]="store.activeViewId() === 'upcoming'"
              [class.text-purple-400]="store.activeViewId() === 'upcoming'"
              [class.text-[#888]]="store.activeViewId() !== 'upcoming'"
              [class.hover:bg-[#252525]]="store.activeViewId() !== 'upcoming'"
              title="Upcoming"
            >
              <svg
                class="shrink-0"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span class="hidden min-[200px]:inline truncate">Soon</span>
            </button>
            <button
              (click)="store.activeViewId.set('completed')"
              class="flex-1 flex items-center justify-center gap-1 px-1.5 py-1.5 rounded-lg text-[10px] font-medium whitespace-nowrap transition-colors min-w-0"
              [class.bg-[#333]/50]="store.activeViewId() === 'completed'"
              [class.text-[#aaa]]="store.activeViewId() === 'completed'"
              [class.text-[#888]]="store.activeViewId() !== 'completed'"
              [class.hover:bg-[#252525]]="store.activeViewId() !== 'completed'"
              title="Completed"
            >
              <svg
                class="shrink-0"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span class="hidden min-[200px]:inline truncate">Done</span>
            </button>
            <button
              (click)="store.activeViewId.set('settings')"
              class="flex-1 flex items-center justify-center gap-1 px-1.5 py-1.5 rounded-lg text-[10px] font-medium whitespace-nowrap transition-colors min-w-0"
              [class.bg-orange-500/20]="store.activeViewId() === 'settings'"
              [class.text-orange-400]="store.activeViewId() === 'settings'"
              [class.text-[#888]]="store.activeViewId() !== 'settings'"
              [class.hover:bg-[#252525]]="store.activeViewId() !== 'settings'"
              title="Settings"
            >
              <svg
                class="shrink-0"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <circle cx="12" cy="12" r="3" />
                <path
                  d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"
                />
              </svg>
              <span class="hidden min-[240px]:inline truncate">Settings</span>
            </button>
          </div>
        </div>
      }

      <!-- Header - Responsive padding -->
      <div class="px-4 pt-4 pb-3 md:px-10 md:pt-10 md:pb-6 shrink-0">
        <div class="flex items-start justify-between gap-2">
          <div class="min-w-0 flex-1">
            <h1
              class="text-xl md:text-3xl font-bold text-white mb-1 md:mb-2 animate-slideIn truncate"
            >
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
              (click)="toggleSortMenu()"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M3 6h18M7 12h10M10 18h4" />
              </svg>
              <span class="text-[#888] hidden md:inline">{{ getSortLabel() }}</span>
            </button>

            <!-- Sort Dropdown -->
            @if (isSortMenuOpen()) {
              <div
                class="absolute right-0 top-full mt-2 w-44 bg-[#1e1e1e] border border-[#2d2d2d] rounded-xl shadow-2xl z-20 py-2 animate-scaleIn overflow-hidden"
              >
                <button
                  (click)="setSort('added')"
                  class="w-full text-left px-4 py-2.5 text-sm hover:bg-[#252525] flex items-center gap-3 transition-colors"
                  [class.text-red-400]="sortOption() === 'added'"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6v6l4 2" />
                  </svg>
                  Date Added
                </button>
                <button
                  (click)="setSort('priority')"
                  class="w-full text-left px-4 py-2.5 text-sm hover:bg-[#252525] flex items-center gap-3 transition-colors"
                  [class.text-red-400]="sortOption() === 'priority'"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  Priority
                </button>
                <button
                  (click)="setSort('date')"
                  class="w-full text-left px-4 py-2.5 text-sm hover:bg-[#252525] flex items-center gap-3 transition-colors"
                  [class.text-red-400]="sortOption() === 'date'"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
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
              <!-- Settings Tab Navigation -->
              <div class="flex gap-2 p-1 bg-[#1a1a1a] rounded-xl border border-[#2d2d2d]">
                <button
                  (click)="settingsTab.set('general')"
                  class="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all"
                  [class.bg-gradient-to-r]="settingsTab() === 'general'"
                  [class.from-red-500/20]="settingsTab() === 'general'"
                  [class.to-orange-500/20]="settingsTab() === 'general'"
                  [class.text-white]="settingsTab() === 'general'"
                  [class.text-[#666]]="settingsTab() !== 'general'"
                  [class.hover:text-[#888]]="settingsTab() !== 'general'"
                >
                  General
                </button>
                <button
                  (click)="settingsTab.set('stats')"
                  class="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2"
                  [class.bg-gradient-to-r]="settingsTab() === 'stats'"
                  [class.from-purple-500/20]="settingsTab() === 'stats'"
                  [class.to-blue-500/20]="settingsTab() === 'stats'"
                  [class.text-white]="settingsTab() === 'stats'"
                  [class.text-[#666]]="settingsTab() !== 'stats'"
                  [class.hover:text-[#888]]="settingsTab() !== 'stats'"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path d="M18 20V10M12 20V4M6 20v-6" />
                  </svg>
                  Stats
                </button>
              </div>

              @if (settingsTab() === 'stats') {
                <!-- Stats View - Scrollable Container -->
                <div class="space-y-4 md:space-y-6 overflow-y-auto max-h-[calc(100vh-12rem)] pr-1 md:pr-2 pb-4 smooth-scroll">
                  <!-- Hero Stats Cards -->
                <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <!-- Total Completed -->
                  <div
                    class="bg-gradient-to-br from-green-500/10 to-emerald-500/5 border border-green-500/20 rounded-xl p-3 md:p-4 relative overflow-hidden"
                  >
                    <div
                      class="absolute top-0 right-0 w-12 h-12 md:w-16 md:h-16 bg-green-500/10 rounded-full blur-2xl"
                    ></div>
                    <div class="relative">
                      <p class="text-[10px] uppercase tracking-wider text-green-400/70 font-medium">
                        Total Done
                      </p>
                      <p class="text-xl md:text-2xl lg:text-3xl font-bold text-green-400 mt-1">
                        {{ store.userStats().totalCompleted }}
                      </p>
                    </div>
                  </div>

                  <!-- Current Streak -->
                  <div
                    class="bg-gradient-to-br from-orange-500/10 to-red-500/5 border border-orange-500/20 rounded-xl p-3 md:p-4 relative overflow-hidden"
                  >
                    <div
                      class="absolute top-0 right-0 w-12 h-12 md:w-16 md:h-16 bg-orange-500/10 rounded-full blur-2xl"
                    ></div>
                    <div class="relative">
                      <p
                        class="text-[10px] uppercase tracking-wider text-orange-400/70 font-medium flex items-center gap-1"
                      >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                          <path
                            d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
                          />
                        </svg>
                        Streak
                      </p>
                      <p class="text-xl md:text-2xl lg:text-3xl font-bold text-orange-400 mt-1">
                        {{ store.userStats().currentStreak
                        }}<span class="text-xs md:text-sm font-normal text-orange-400/50 ml-1">days</span>
                      </p>
                    </div>
                  </div>

                  <!-- Today -->
                  <div
                    class="bg-gradient-to-br from-blue-500/10 to-cyan-500/5 border border-blue-500/20 rounded-xl p-3 md:p-4 relative overflow-hidden"
                  >
                    <div
                      class="absolute top-0 right-0 w-12 h-12 md:w-16 md:h-16 bg-blue-500/10 rounded-full blur-2xl"
                    ></div>
                    <div class="relative">
                      <p class="text-[10px] uppercase tracking-wider text-blue-400/70 font-medium">
                        Today
                      </p>
                      <p class="text-xl md:text-2xl lg:text-3xl font-bold text-blue-400 mt-1">
                        {{ store.todayCompletions() }}
                      </p>
                    </div>
                  </div>

                  <!-- This Week -->
                  <div
                    class="bg-gradient-to-br from-purple-500/10 to-pink-500/5 border border-purple-500/20 rounded-xl p-3 md:p-4 relative overflow-hidden"
                  >
                    <div
                      class="absolute top-0 right-0 w-12 h-12 md:w-16 md:h-16 bg-purple-500/10 rounded-full blur-2xl"
                    ></div>
                    <div class="relative">
                      <p
                        class="text-[10px] uppercase tracking-wider text-purple-400/70 font-medium"
                      >
                        This Week
                      </p>
                      <p class="text-xl md:text-2xl lg:text-3xl font-bold text-purple-400 mt-1">
                        {{ store.thisWeekCompletions() }}
                      </p>
                    </div>
                  </div>
                </div>

                <!-- Weekly Activity Chart -->
                <div class="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-5">
                  <div class="flex items-center justify-between mb-4">
                    <h3 class="text-white font-medium flex items-center gap-2">
                      <svg
                        class="text-purple-400"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                      >
                        <path d="M18 20V10M12 20V4M6 20v-6" />
                      </svg>
                      Last 7 Days
                    </h3>
                    <p class="text-xs text-[#666]">
                      {{ store.userStats().weeklyAverage }} avg/week
                    </p>
                  </div>

                  <!-- Bar Chart -->
                  <div class="flex items-end justify-between gap-2 h-32">
                    @for (day of store.last7DaysData(); track day.date) {
                      <div class="flex-1 flex flex-col items-center gap-2">
                        <div
                          class="w-full bg-[#252525] rounded-t-lg relative overflow-hidden"
                          style="height: 100%"
                        >
                          <div
                            class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-purple-500 to-blue-500 rounded-t-lg transition-all duration-500"
                            [style.height.%]="getBarHeight(day.count)"
                          ></div>
                          @if (day.count > 0) {
                            <div class="absolute inset-0 flex items-center justify-center">
                              <span class="text-[10px] font-bold text-white drop-shadow-lg">{{
                                day.count
                              }}</span>
                            </div>
                          }
                        </div>
                        <span
                          class="text-[10px] text-[#666]"
                          [class.text-purple-400]="isToday(day.date)"
                          >{{ day.day }}</span
                        >
                      </div>
                    }
                  </div>
                </div>

                <!-- Achievements Row -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <!-- Longest Streak -->
                  <div class="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-5">
                    <div class="flex items-center gap-4">
                      <div
                        class="w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 flex items-center justify-center"
                      >
                        <svg
                          class="text-yellow-400"
                          width="28"
                          height="28"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path
                            d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                          />
                        </svg>
                      </div>
                      <div>
                        <p class="text-xs text-[#666] uppercase tracking-wider">Best Streak</p>
                        <p class="text-2xl font-bold text-white">
                          {{ store.userStats().longestStreak }}
                          <span class="text-sm font-normal text-[#555]">days</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  <!-- Best Day -->
                  <div class="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-5">
                    <div class="flex items-center gap-4">
                      <div
                        class="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center"
                      >
                        <svg
                          class="text-green-400"
                          width="28"
                          height="28"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                        >
                          <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                          <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                      </div>
                      <div>
                        <p class="text-xs text-[#666] uppercase tracking-wider">Best Day</p>
                        @if (store.userStats().bestDay) {
                          <p class="text-2xl font-bold text-white">
                            {{ store.userStats().bestDay!.count }}
                            <span class="text-sm font-normal text-[#555]">tasks</span>
                          </p>
                          <p class="text-[10px] text-[#555]">
                            {{ formatDate(store.userStats().bestDay!.date) }}
                          </p>
                        } @else {
                          <p class="text-lg text-[#555]">No data yet</p>
                        }
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Project Leaderboard -->
                <div class="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl overflow-hidden">
                  <div class="px-5 py-4 border-b border-[#2d2d2d]">
                    <h3 class="text-white font-medium flex items-center gap-2">
                      <svg
                        class="text-blue-400"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                      >
                        <path
                          d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"
                        />
                      </svg>
                      Top Projects
                    </h3>
                  </div>
                  @if (store.topProjects().length === 0) {
                    <div class="px-5 py-8 text-center text-[#555] text-sm">
                      Complete tasks to see project stats
                    </div>
                  } @else {
                    <div class="divide-y divide-[#2d2d2d]">
                      @for (
                        project of store.topProjects();
                        track project.projectId;
                        let i = $index
                      ) {
                        <div class="px-5 py-3 flex items-center gap-4">
                          <div
                            class="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm"
                            [class.bg-yellow-500/20]="i === 0"
                            [class.text-yellow-400]="i === 0"
                            [class.bg-[#333]/50]="i === 1"
                            [class.text-[#aaa]]="i === 1"
                            [class.bg-orange-900/30]="i === 2"
                            [class.text-orange-400]="i === 2"
                            [class.bg-[#252525]]="i > 2"
                            [class.text-[#666]]="i > 2"
                          >
                            {{ i + 1 }}
                          </div>
                          <div class="flex-1 min-w-0">
                            <p class="text-sm text-white truncate">{{ project.projectName }}</p>
                          </div>
                          <div class="text-right">
                            <p class="text-lg font-bold text-white">{{ project.totalCompleted }}</p>
                            <p class="text-[10px] text-[#555]">completed</p>
                          </div>
                        </div>
                      }
                    </div>
                  }
                </div>
              </div>
              } @else {
                <!-- General Settings Tab -->

                <!-- Completed Tasks Section -->
                <div class="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl overflow-hidden">
                  <div
                    class="px-5 py-4 border-b border-[#2d2d2d] flex items-center justify-between"
                  >
                    <div class="flex items-center gap-3">
                      <div
                        class="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center"
                      >
                        <svg
                          class="text-green-400"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                        >
                          <polyline points="20 6 9 17 4 12" />
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
                        <div
                          class="px-5 py-3 border-b border-[#2d2d2d] last:border-b-0 flex items-center justify-between gap-3 hover:bg-[#252525] transition-colors"
                        >
                          <div class="flex-1 min-w-0">
                            <p class="text-sm text-[#888] line-through truncate">
                              {{ task.title }}
                            </p>
                            @if (task.dueDate) {
                              <p class="text-xs text-[#555] mt-0.5">
                                {{ formatDate(task.dueDate) }}
                              </p>
                            }
                          </div>
                          <div class="flex items-center gap-2 shrink-0">
                            <button
                              (click)="restoreCompletedTask(task.id)"
                              class="px-3 py-1.5 text-xs bg-[#252525] hover:bg-[#333] text-[#888] hover:text-white rounded-lg transition-colors"
                            >
                              Restore
                            </button>
                            <button
                              (click)="store.deleteTask(task.id)"
                              class="px-3 py-1.5 text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                            >
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
                  <div
                    class="px-5 py-4 border-b border-[#2d2d2d] flex items-center justify-between"
                  >
                    <div class="flex items-center gap-3">
                      <div
                        class="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center"
                      >
                        <svg
                          class="text-red-400"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                        >
                          <polyline points="3 6 5 6 21 6" />
                          <path
                            d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"
                          />
                        </svg>
                      </div>
                      <div>
                        <h3 class="text-white font-medium">Trash</h3>
                        <p class="text-xs text-[#666]">
                          {{ store.deletedTasks().length }} deleted tasks
                        </p>
                      </div>
                    </div>
                    @if (store.deletedTasks().length > 0) {
                      <button
                        (click)="emptyTrash()"
                        class="px-3 py-1.5 text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                      >
                        Empty Trash
                      </button>
                    }
                  </div>
                  <div class="max-h-[300px] overflow-y-auto">
                    @if (store.deletedTasks().length === 0) {
                      <div class="px-5 py-8 text-center text-[#555] text-sm">Trash is empty</div>
                    } @else {
                      @for (task of store.deletedTasks(); track task.id) {
                        <div
                          class="px-5 py-3 border-b border-[#2d2d2d] last:border-b-0 flex items-center justify-between gap-3 hover:bg-[#252525] transition-colors"
                        >
                          <div class="flex-1 min-w-0">
                            <p class="text-sm text-[#888] truncate">{{ task.title }}</p>
                            @if (task.deletedAt) {
                              <p class="text-xs text-[#555] mt-0.5">
                                Deleted {{ formatDate(task.deletedAt.split('T')[0]) }}
                              </p>
                            }
                          </div>
                          <div class="flex items-center gap-2 shrink-0">
                            <button
                              (click)="restoreDeletedTask(task.id)"
                              class="px-3 py-1.5 text-xs bg-[#252525] hover:bg-[#333] text-[#888] hover:text-white rounded-lg transition-colors"
                            >
                              Restore
                            </button>
                            <button
                              (click)="permanentlyDeleteTask(task.id)"
                              class="px-3 py-1.5 text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                            >
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
                        <svg
                          class="text-[#888]"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                        >
                          <circle cx="12" cy="12" r="3" />
                          <path
                            d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"
                          />
                        </svg>
                      </div>
                      <h3 class="text-white font-medium">Preferences</h3>
                    </div>
                  </div>
                  <div class="divide-y divide-[#2d2d2d]">
                    <div class="px-5 py-4 flex items-center justify-between">
                      <div>
                        <p class="text-sm text-white">Smart Date Parsing</p>
                        <p class="text-xs text-[#666] mt-0.5">
                          Automatically detect dates like "tomorrow" or "next week"
                        </p>
                      </div>
                      <button
                        (click)="toggleSmartParsing()"
                        class="w-10 h-5 rounded-full relative transition-colors"
                        [class.bg-green-500]="store.settings().smartParsing"
                        [class.bg-[#444]]="!store.settings().smartParsing"
                      >
                        <div
                          class="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
                          [class.left-0.5]="!store.settings().smartParsing"
                          [class.left-5]="store.settings().smartParsing"
                        ></div>
                      </button>
                    </div>
                  </div>
                </div>
              }
            </div>
          } @else {
            <!-- Add Task Button / Form -->
            <div class="mb-4 md:mb-8 w-full flex justify-center">
              <div
                class="w-full max-w-2xl transition-all duration-300"
                [class.max-w-full]="store.isSidebarMode()"
              >
                @if (!isAdding()) {
                  <button
                    (click)="isAdding.set(true)"
                    class="w-full py-3 md:py-4 border-2 border-dashed border-[#2d2d2d] rounded-xl text-[#555] hover:text-red-400 hover:border-red-400/30 transition-all flex items-center justify-center gap-2 md:gap-3 group"
                  >
                    <div
                      class="w-6 h-6 md:w-8 md:h-8 rounded-full bg-[#1e1e1e] group-hover:bg-red-500/10 flex items-center justify-center transition-colors"
                    >
                      <svg
                        class="text-[#555] group-hover:text-red-400 transition-colors"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                      >
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                    </div>
                    <span class="font-medium text-sm md:text-base">Add task</span>
                  </button>
                } @else {
                  <div
                    class="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-3 md:p-5 shadow-xl animate-scaleIn relative"
                  >
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
                    />

                    <div class="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div class="flex items-center gap-2 md:gap-3 flex-wrap">
                        <!-- Due Date Button -->
                        <button
                          (click)="openDatePicker('new')"
                          class="flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1.5 md:py-2 rounded-lg border border-[#2d2d2d] hover:border-[#444] transition-colors text-xs md:text-sm"
                          [class.text-green-400]="newTaskDueDate"
                          [class.border-green-400/30]="newTaskDueDate"
                        >
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                          >
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                          </svg>
                          <span>{{ newTaskDueDate ? formatDate(newTaskDueDate) : 'Date' }}</span>
                        </button>

                        <!-- Project Selector -->
                        <div class="relative">
                          <button
                            (click)="toggleProjectMenu()"
                            class="flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1.5 md:py-2 rounded-lg border border-[#2d2d2d] hover:border-[#444] transition-colors text-xs md:text-sm max-w-[150px]"
                          >
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              stroke-width="2"
                            >
                              <path
                                d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"
                              />
                            </svg>
                            <span class="truncate">{{ getSelectedProjectName() }}</span>
                          </button>

                          @if (isProjectMenuOpen()) {
                            <div
                              class="absolute top-full left-0 mt-2 w-56 bg-[#1e1e1e] border border-[#2d2d2d] rounded-xl shadow-2xl z-20 py-1 animate-scaleIn overflow-hidden max-h-[300px] overflow-y-auto"
                            >
                              <!-- Current Workspace -->
                              @if (store.currentWorkspace(); as ws) {
                                <button
                                  (click)="selectProject(ws.id)"
                                  class="w-full text-left px-3 py-2 text-xs hover:bg-[#252525] flex items-center gap-2 transition-colors border-b border-[#2d2d2d/50]"
                                  [class.text-red-400]="
                                    newTaskProjectId() === ws.id ||
                                    (!newTaskProjectId() && ws.id === store.workspaceId())
                                  "
                                >
                                  <div class="w-2 h-2 rounded-full bg-red-500"></div>
                                  <span class="truncate flex-1">{{ ws.name }}</span>
                                  @if (
                                    newTaskProjectId() === ws.id ||
                                    (!newTaskProjectId() && ws.id === store.workspaceId())
                                  ) {
                                    <svg
                                      width="12"
                                      height="12"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      stroke-width="2"
                                    >
                                      <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                  }
                                </button>
                              }
                              <!-- Recent Workspaces -->
                              @for (ws of store.recentWorkspaces(); track ws.id) {
                                @if (ws.id !== store.currentWorkspace()?.id) {
                                  <button
                                    (click)="selectProject(ws.id)"
                                    class="w-full text-left px-3 py-2 text-xs hover:bg-[#252525] flex items-center gap-2 transition-colors"
                                    [class.text-red-400]="newTaskProjectId() === ws.id"
                                  >
                                    <div class="w-2 h-2 rounded-full bg-[#444]"></div>
                                    <span class="truncate flex-1">{{ ws.name }}</span>
                                    @if (newTaskProjectId() === ws.id) {
                                      <svg
                                        width="12"
                                        height="12"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-width="2"
                                      >
                                        <polyline points="20 6 9 17 4 12" />
                                      </svg>
                                    }
                                  </button>
                                }
                              }
                            </div>
                          }
                        </div>

                        <!-- Priority Selector -->
                        <div class="flex rounded-lg border border-[#2d2d2d] overflow-hidden">
                          @for (p of [1, 2, 3, 4]; track p) {
                            <button
                              (click)="newTaskPriority.set(p)"
                              class="w-7 h-7 md:w-9 md:h-9 flex items-center justify-center text-[10px] md:text-xs font-bold transition-all"
                              [class]="getPriorityButtonClass(p, newTaskPriority() === p)"
                            >
                              P{{ p }}
                            </button>
                          }
                        </div>
                      </div>

                      <div class="flex items-center gap-2 md:gap-3 justify-end">
                        <button
                          (click)="isAdding.set(false)"
                          class="px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm text-[#888] hover:text-white transition-colors btn-press"
                        >
                          Cancel
                        </button>
                        <button
                          (click)="addTask()"
                          class="px-3 md:px-5 py-1.5 md:py-2 text-xs md:text-sm bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-lg hover:opacity-90 transition-opacity btn-press font-medium disabled:opacity-40"
                          [disabled]="!newTaskTitle.trim()"
                        >
                          Add
                        </button>
                      </div>
                    </div>

                    <!-- Smart Detection Suggestions -->
                    @if (detectedProject() || detectedDate() || detectedPriority()) {
                      <div
                        class="mt-3 pt-3 border-t border-[#2d2d2d] flex flex-wrap items-center gap-2"
                      >
                        <span class="text-[10px] text-[#555] uppercase tracking-wider"
                          >Detected:</span
                        >

                        @if (detectedProject(); as project) {
                          <button
                            (click)="applyDetectedProject(project)"
                            class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-all bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 group"
                          >
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              stroke-width="2"
                            >
                              <path
                                d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"
                              />
                            </svg>
                            <span class="font-medium">{{ project.name }}</span>
                            <svg
                              class="opacity-0 group-hover:opacity-100 transition-opacity"
                              width="10"
                              height="10"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              stroke-width="3"
                            >
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          </button>
                        }

                        @if (detectedDate(); as dateInfo) {
                          <div
                            class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-green-500/10 border border-green-500/30 text-green-400"
                          >
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              stroke-width="2"
                            >
                              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                              <line x1="16" y1="2" x2="16" y2="6" />
                              <line x1="8" y1="2" x2="8" y2="6" />
                              <line x1="3" y1="10" x2="21" y2="10" />
                            </svg>
                            <span>"{{ dateInfo.text }}"</span>
                            <span class="text-green-400/60">→</span>
                            <span class="font-medium">{{ formatDate(dateInfo.date) }}</span>
                          </div>
                        }

                        @if (detectedPriority(); as priorityInfo) {
                          <div
                            class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs border"
                            [class.bg-red-500/10]="priorityInfo.priority === 1"
                            [class.border-red-500/30]="priorityInfo.priority === 1"
                            [class.text-red-400]="priorityInfo.priority === 1"
                            [class.bg-orange-500/10]="priorityInfo.priority === 2"
                            [class.border-orange-500/30]="priorityInfo.priority === 2"
                            [class.text-orange-400]="priorityInfo.priority === 2"
                            [class.bg-yellow-500/10]="priorityInfo.priority === 3"
                            [class.border-yellow-500/30]="priorityInfo.priority === 3"
                            [class.text-yellow-400]="priorityInfo.priority === 3"
                            [class.bg-[#333]/50]="priorityInfo.priority === 4"
                            [class.border-[#444]]="priorityInfo.priority === 4"
                            [class.text-[#888]]="priorityInfo.priority === 4"
                          >
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              stroke-width="2"
                            >
                              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                              <polyline points="22 4 12 14.01 9 11.01" />
                            </svg>
                            <span class="font-medium">Priority {{ priorityInfo.priority }}</span>
                          </div>
                        }
                      </div>
                    }
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
                  style="animation: slideIn 0.3s ease-out backwards;"
                >
                  <!-- Checkbox -->
                  <button
                    (click)="$event.stopPropagation(); toggleTask(task)"
                    class="mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all checkbox-animate hover:scale-110"
                    [class]="getCheckboxClass(task)"
                  >
                    @if (task.completed) {
                      <svg
                        class="animate-checkmark"
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="3"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    }
                  </button>

                  <!-- Content -->
                  <div class="flex-1 min-w-0">
                    <div
                      class="text-[15px] leading-relaxed transition-all"
                      [class.line-through]="task.completed"
                      [class.text-[#555]]="task.completed"
                      [class.text-white]="!task.completed"
                    >
                      {{ task.title }}
                    </div>

                    <!-- Meta info -->
                    <div class="flex items-center gap-3 mt-2 text-xs text-[#555]">
                      @if (task.dueDate) {
                        <span
                          class="flex items-center gap-1.5"
                          [class.text-red-400]="isOverdue(task.dueDate)"
                          [class.text-green-400]="isToday(task.dueDate)"
                        >
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                          >
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                          </svg>
                          {{ formatDate(task.dueDate) }}
                        </span>
                      }

                      @if (task.description) {
                        <span class="flex items-center gap-1.5">
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                          >
                            <line x1="17" y1="10" x2="3" y2="10" />
                            <line x1="21" y1="6" x2="3" y2="6" />
                            <line x1="21" y1="14" x2="3" y2="14" />
                            <line x1="17" y1="18" x2="3" y2="18" />
                          </svg>
                          Note
                        </span>
                      }

                      @for (label of task.labels; track label) {
                        <span class="px-2 py-0.5 rounded-full bg-[#252525] text-[#888]"
                          >#{{ label }}</span
                        >
                      }
                    </div>
                  </div>

                  <!-- Priority Badge -->
                  <div
                    class="w-2 h-2 rounded-full opacity-60 group-hover:opacity-100 transition-opacity"
                    [class]="getPriorityDotClass(task.priority)"
                  ></div>
                </div>
              }
            </div>

            <!-- Empty State -->
            @if (sortedTasks().length === 0) {
              <div class="flex flex-col items-center justify-center py-20 animate-fadeIn">
                <div
                  class="w-20 h-20 rounded-full bg-[#1a1a1a] flex items-center justify-center mb-6"
                >
                  <svg
                    class="text-[#333]"
                    width="40"
                    height="40"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.5"
                  >
                    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
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
          <div
            class="fixed inset-0 bg-black/60 z-40 md:hidden animate-fadeIn"
            (click)="selectedTaskId.set(null)"
          ></div>

          <div
            class="fixed inset-x-0 bottom-0 max-h-[85vh] md:relative md:inset-auto md:max-h-none md:w-[400px] border-t md:border-t-0 md:border-l border-[#2d2d2d] flex flex-col bg-[#1a1a1a] animate-slideInRight z-50 md:z-auto rounded-t-2xl md:rounded-none"
          >
            <!-- Panel Header -->
            <div
              class="px-4 md:px-6 py-3 md:py-4 border-b border-[#2d2d2d] flex items-center justify-between"
            >
              <span class="text-xs font-medium text-[#666] uppercase tracking-wider"
                >Task Details</span
              >
              <button
                (click)="selectedTaskId.set(null)"
                class="w-8 h-8 rounded-lg hover:bg-[#252525] flex items-center justify-center text-[#666] hover:text-white transition-colors btn-press"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
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
                  [class]="getCheckboxClass(task)"
                >
                  @if (task.completed) {
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="3"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  }
                </button>

                <textarea
                  [ngModel]="task.title"
                  (ngModelChange)="updateTaskTitle(task.id, $event)"
                  class="flex-1 bg-transparent text-xl font-semibold text-white placeholder-[#555] focus:outline-none resize-none overflow-hidden leading-tight"
                  rows="1"
                  placeholder="Task name"
                >
                </textarea>
              </div>

              <!-- Description -->
              <div class="mb-6">
                <label class="text-xs font-medium text-[#555] uppercase tracking-wider mb-2 block"
                  >Description</label
                >
                <textarea
                  [ngModel]="task.description"
                  (ngModelChange)="updateTaskDescription(task.id, $event)"
                  class="w-full bg-[#252525] text-sm text-[#ccc] placeholder-[#555] focus:outline-none resize-none rounded-lg p-4 min-h-[100px] border border-transparent focus:border-[#333] transition-colors"
                  placeholder="Add a description..."
                >
                </textarea>
              </div>

              <!-- Due Date -->
              <div class="mb-6">
                <label class="text-xs font-medium text-[#555] uppercase tracking-wider mb-2 block"
                  >Due Date</label
                >
                <button
                  (click)="openDatePicker('edit', task.id, task.dueDate)"
                  class="w-full flex items-center gap-3 px-4 py-3 bg-[#252525] rounded-lg text-left hover:bg-[#2a2a2a] transition-colors"
                  [class.text-green-400]="task.dueDate && isToday(task.dueDate)"
                  [class.text-red-400]="task.dueDate && isOverdue(task.dueDate)"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  <span class="text-sm">{{
                    task.dueDate ? formatDateLong(task.dueDate) : 'Set due date'
                  }}</span>
                  @if (task.dueDate) {
                    <button
                      (click)="$event.stopPropagation(); clearDueDate(task.id)"
                      class="ml-auto text-[#555] hover:text-red-400 transition-colors"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                      >
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  }
                </button>
              </div>

              <!-- Priority -->
              <div class="mb-6">
                <label class="text-xs font-medium text-[#555] uppercase tracking-wider mb-2 block"
                  >Priority</label
                >
                <div class="flex gap-2">
                  @for (p of [1, 2, 3, 4]; track p) {
                    <button
                      (click)="store.updateTask(task.id, { priority: p })"
                      class="flex-1 py-3 rounded-lg text-sm font-medium transition-all btn-press"
                      [class]="getPriorityButtonClass(p, task.priority === p)"
                    >
                      P{{ p }}
                    </button>
                  }
                </div>
              </div>

              <!-- Labels -->
              <div class="mb-6">
                <label class="text-xs font-medium text-[#555] uppercase tracking-wider mb-2 block"
                  >Labels</label
                >
                <div class="flex flex-wrap gap-2 mb-3">
                  @for (label of task.labels; track label) {
                    <div
                      class="flex items-center gap-2 px-3 py-1.5 bg-[#252525] rounded-lg text-sm"
                    >
                      <span class="text-[#888]">#{{ label }}</span>
                      <button
                        (click)="removeLabel(task.id, label)"
                        class="text-[#555] hover:text-red-400 transition-colors"
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                        >
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
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
                />
              </div>
            </div>

            <!-- Panel Footer -->
            <div class="px-6 py-4 border-t border-[#2d2d2d]">
              <button
                (click)="deleteSelectedTask(task.id)"
                class="w-full py-3 text-sm text-red-400 hover:bg-red-400/10 rounded-lg transition-colors flex items-center justify-center gap-2 btn-press"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path
                    d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"
                  />
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
          (click)="closeDatePicker()"
        >
          <div
            class="bg-[#1e1e1e] rounded-2xl shadow-2xl border border-[#2d2d2d] w-[340px] animate-scaleIn overflow-hidden"
            (click)="$event.stopPropagation()"
          >
            <!-- Existing Date Picker Content -->
            <!-- Calendar Header -->
            <div class="px-6 py-4 border-b border-[#2d2d2d] flex items-center justify-between">
              <button
                (click)="prevMonth()"
                class="w-8 h-8 rounded-lg hover:bg-[#252525] flex items-center justify-center text-[#888] hover:text-white transition-colors btn-press"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <span class="font-semibold text-white">{{ getMonthYearLabel() }}</span>
              <button
                (click)="nextMonth()"
                class="w-8 h-8 rounded-lg hover:bg-[#252525] flex items-center justify-center text-[#888] hover:text-white transition-colors btn-press"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <polyline points="9 18 15 12 9 6" />
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
                [class.hover:bg-green-500/20]="!isSelectedDate(getTodayDate())"
              >
                Today
              </button>
              <button
                (click)="selectTomorrow()"
                class="flex-1 py-2 text-xs font-medium rounded-lg transition-colors"
                [class.bg-blue-500]="isSelectedDate(getTomorrowDate())"
                [class.text-white]="isSelectedDate(getTomorrowDate())"
                [class.bg-[#252525]]="!isSelectedDate(getTomorrowDate())"
                [class.text-blue-400]="!isSelectedDate(getTomorrowDate())"
                [class.hover:bg-blue-500/20]="!isSelectedDate(getTomorrowDate())"
              >
                Tomorrow
              </button>
              <button
                (click)="selectNextWeek()"
                class="flex-1 py-2 text-xs font-medium rounded-lg transition-colors"
                [class.bg-purple-500]="isSelectedDate(getNextWeekDate())"
                [class.text-white]="isSelectedDate(getNextWeekDate())"
                [class.bg-[#252525]]="!isSelectedDate(getNextWeekDate())"
                [class.text-purple-400]="!isSelectedDate(getNextWeekDate())"
                [class.hover:bg-purple-500/20]="!isSelectedDate(getNextWeekDate())"
              >
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
                    [class.text-[#888]]="
                      day.currentMonth && !day.isToday && !isSelectedDate(day.date)
                    "
                    [class.text-white]="day.isToday || isSelectedDate(day.date)"
                    [class.bg-gradient-to-r]="isSelectedDate(day.date)"
                    [class.from-red-500]="isSelectedDate(day.date)"
                    [class.to-orange-500]="isSelectedDate(day.date)"
                    [class.ring-2]="day.isToday && !isSelectedDate(day.date)"
                    [class.ring-green-500]="day.isToday && !isSelectedDate(day.date)"
                    [class.hover:bg-[#252525]]="!isSelectedDate(day.date)"
                    [disabled]="!day.date"
                  >
                    {{ day.day || '' }}
                  </button>
                }
              </div>
            </div>

            <!-- Footer -->
            <div class="px-4 py-3 border-t border-[#2d2d2d] flex justify-between">
              <button
                (click)="clearDateSelection()"
                class="px-4 py-2 text-sm text-[#888] hover:text-white transition-colors btn-press"
              >
                Clear
              </button>
              <button
                (click)="confirmDateSelection()"
                class="px-5 py-2 text-sm bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-lg hover:opacity-90 transition-opacity btn-press font-medium"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Undo Toast -->
      @if (lastCompletedTaskId()) {
        <div
          class="absolute bottom-6 left-1/2 -translate-x-1/2 bg-[#1e1e1e] border border-[#2d2d2d] shadow-2xl rounded-full px-5 py-3 flex items-center gap-4 animate-slideUp z-30"
        >
          <span class="text-sm text-white">Task completed</span>
          <button
            (click)="undoCompletion()"
            class="text-sm font-medium text-red-400 hover:text-red-300 transition-colors"
          >
            Undo
          </button>
          <button
            (click)="lastCompletedTaskId.set(null)"
            class="text-[#666] hover:text-white transition-colors"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      }

      <!-- Keyboard Shortcuts Help Modal -->
      @if (isShortcutsHelpOpen()) {
        <div
          class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fadeIn"
          (click)="isShortcutsHelpOpen.set(false)"
        >
          <div
            class="bg-[#1e1e1e] rounded-2xl shadow-2xl border border-[#2d2d2d] w-[420px] max-h-[80vh] overflow-hidden animate-scaleIn"
            (click)="$event.stopPropagation()"
          >
            <div class="px-6 py-4 border-b border-[#2d2d2d] flex items-center justify-between">
              <h2 class="text-lg font-semibold text-white">Keyboard Shortcuts</h2>
              <button
                (click)="isShortcutsHelpOpen.set(false)"
                class="w-8 h-8 rounded-lg hover:bg-[#252525] flex items-center justify-center text-[#666] hover:text-white transition-colors"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div class="p-6 overflow-y-auto max-h-[60vh] space-y-6">
              <!-- General -->
              <div>
                <h3 class="text-xs font-semibold text-[#666] uppercase tracking-wider mb-3">
                  General
                </h3>
                <div class="space-y-2">
                  <div class="flex items-center justify-between">
                    <span class="text-sm text-[#b0b0b0]">Show shortcuts</span>
                    <kbd class="px-2 py-1 bg-[#252525] rounded text-xs text-white font-mono">?</kbd>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-sm text-[#b0b0b0]">Close modal/panel</span>
                    <kbd class="px-2 py-1 bg-[#252525] rounded text-xs text-white font-mono"
                      >Esc</kbd
                    >
                  </div>
                </div>
              </div>

              <!-- Tasks -->
              <div>
                <h3 class="text-xs font-semibold text-[#666] uppercase tracking-wider mb-3">
                  Tasks
                </h3>
                <div class="space-y-2">
                  <div class="flex items-center justify-between">
                    <span class="text-sm text-[#b0b0b0]">New task</span>
                    <div class="flex gap-1">
                      <kbd class="px-2 py-1 bg-[#252525] rounded text-xs text-white font-mono"
                        >N</kbd
                      >
                      <span class="text-xs text-[#555]">or</span>
                      <kbd class="px-2 py-1 bg-[#252525] rounded text-xs text-white font-mono"
                        >A</kbd
                      >
                    </div>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-sm text-[#b0b0b0]">Complete task</span>
                    <div class="flex gap-1">
                      <kbd class="px-2 py-1 bg-[#252525] rounded text-xs text-white font-mono"
                        >Space</kbd
                      >
                      <span class="text-xs text-[#555]">or</span>
                      <kbd class="px-2 py-1 bg-[#252525] rounded text-xs text-white font-mono"
                        >Enter</kbd
                      >
                    </div>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-sm text-[#b0b0b0]">Delete task</span>
                    <div class="flex gap-1">
                      <kbd class="px-2 py-1 bg-[#252525] rounded text-xs text-white font-mono"
                        >Delete</kbd
                      >
                      <span class="text-xs text-[#555]">or</span>
                      <kbd class="px-2 py-1 bg-[#252525] rounded text-xs text-white font-mono"
                        >⌫</kbd
                      >
                    </div>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-sm text-[#b0b0b0]">Set priority 1-4</span>
                    <div class="flex gap-1">
                      <kbd class="px-2 py-1 bg-[#252525] rounded text-xs text-white font-mono"
                        >1</kbd
                      >
                      <kbd class="px-2 py-1 bg-[#252525] rounded text-xs text-white font-mono"
                        >2</kbd
                      >
                      <kbd class="px-2 py-1 bg-[#252525] rounded text-xs text-white font-mono"
                        >3</kbd
                      >
                      <kbd class="px-2 py-1 bg-[#252525] rounded text-xs text-white font-mono"
                        >4</kbd
                      >
                    </div>
                  </div>
                </div>
              </div>

              <!-- Dates -->
              <div>
                <h3 class="text-xs font-semibold text-[#666] uppercase tracking-wider mb-3">
                  Dates
                </h3>
                <div class="space-y-2">
                  <div class="flex items-center justify-between">
                    <span class="text-sm text-[#b0b0b0]">Set due date</span>
                    <kbd class="px-2 py-1 bg-[#252525] rounded text-xs text-white font-mono">D</kbd>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-sm text-[#b0b0b0]">Due today</span>
                    <kbd class="px-2 py-1 bg-[#252525] rounded text-xs text-white font-mono">T</kbd>
                  </div>
                </div>
              </div>

              <!-- Navigation -->
              <div>
                <h3 class="text-xs font-semibold text-[#666] uppercase tracking-wider mb-3">
                  Navigation
                </h3>
                <div class="space-y-2">
                  <div class="flex items-center justify-between">
                    <span class="text-sm text-[#b0b0b0]">Next task</span>
                    <div class="flex gap-1">
                      <kbd class="px-2 py-1 bg-[#252525] rounded text-xs text-white font-mono"
                        >↓</kbd
                      >
                      <span class="text-xs text-[#555]">or</span>
                      <kbd class="px-2 py-1 bg-[#252525] rounded text-xs text-white font-mono"
                        >J</kbd
                      >
                    </div>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-sm text-[#b0b0b0]">Previous task</span>
                    <div class="flex gap-1">
                      <kbd class="px-2 py-1 bg-[#252525] rounded text-xs text-white font-mono"
                        >↑</kbd
                      >
                      <span class="text-xs text-[#555]">or</span>
                      <kbd class="px-2 py-1 bg-[#252525] rounded text-xs text-white font-mono"
                        >K</kbd
                      >
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Keyboard Shortcut Hint -->
      <button
        (click)="openShortcutsHelp()"
        class="fixed bottom-6 right-6 w-8 h-8 bg-[#252525] hover:bg-[#333] border border-[#2d2d2d] rounded-lg flex items-center justify-center text-[#666] hover:text-white transition-colors z-20"
        title="Keyboard shortcuts (?)"
      >
        <span class="text-sm font-mono">?</span>
      </button>
    </div>
  `,
})
export class MainViewComponent implements OnDestroy {
  store = inject(StoreService);

  isAdding = signal(false);
  newTaskTitle = '';
  newTaskDueDate = '';
  newTaskPriority = signal<1 | 2 | 3 | 4>(APP_CONSTANTS.TASKS.DEFAULT_PRIORITY);
  newTaskProjectId = signal<string | null>(null);
  settingsTab = signal<'general' | 'stats'>('general');

  // Smart detection suggestions
  detectedProject = signal<{ id: string; name: string; matchedText: string } | null>(null);
  detectedDate = signal<{ date: string; text: string } | null>(null);
  detectedPriority = signal<{ priority: number; text: string } | null>(null);

  @ViewChild('taskInput') taskInput?: ElementRef<HTMLInputElement>;

  constructor() {
    // Auto-focus input when isAdding becomes true
    effect(() => {
      if (this.isAdding()) {
        this.focusTaskInput();
      }
    });
  }

  ngOnDestroy(): void {
    // Clean up timer to prevent memory leaks
    if (this.undoTimeout) {
      clearTimeout(this.undoTimeout);
      this.undoTimeout = null;
    }
  }

  private focusTaskInput() {
    // Use multiple attempts to ensure focus works even when DOM is updating
    const attemptFocus = (attempts: number) => {
      if (attempts <= 0) return;
      setTimeout(() => {
        if (this.taskInput?.nativeElement) {
          this.taskInput.nativeElement.focus();
          this.taskInput.nativeElement.select();
        } else {
          attemptFocus(attempts - 1);
        }
      }, APP_CONSTANTS.UI.FOCUS_RETRY_DELAY_MS);
    };
    attemptFocus(APP_CONSTANTS.UI.FOCUS_RETRY_ATTEMPTS);
  }

  isSortMenuOpen = signal(false);
  isProjectMenuOpen = signal(false);
  sortOption = signal<'added' | 'priority' | 'date'>('added');

  selectedTaskId = signal<string | null>(null);
  selectedTask = computed(() => this.store.allTasks().find(t => t.id === this.selectedTaskId()));

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

    const days: {
      day: number | null;
      date: string | null;
      currentMonth: boolean;
      isToday: boolean;
    }[] = [];
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
      return new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      });
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

  // Date helpers - delegate to DateUtils
  formatDateISO(year: number, month: number, day: number): string {
    return DateUtils.formatDateISO(year, month, day);
  }

  formatDate(dateStr: string): string {
    return DateUtils.formatDate(dateStr);
  }

  formatDateLong(dateStr: string): string {
    return DateUtils.formatDateLong(dateStr);
  }

  isToday(dateStr: string): boolean {
    return DateUtils.isToday(dateStr);
  }

  isOverdue(dateStr: string): boolean {
    return DateUtils.isOverdue(dateStr);
  }

  getBarHeight(count: number): number {
    const data = this.store.last7DaysData();
    const maxCount = Math.max(...data.map(d => d.count), 1);
    return count === 0 ? 5 : Math.max(15, (count / maxCount) * 100);
  }

  getTodayDate(): string {
    return DateUtils.getTodayISO();
  }

  getTomorrowDate(): string {
    return DateUtils.getTomorrowISO();
  }

  getNextWeekDate(): string {
    return DateUtils.addDays(7);
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
      1: {
        selected: 'bg-red-500 text-white',
        unselected: 'bg-[#252525] text-red-400 hover:bg-red-500/20',
      },
      2: {
        selected: 'bg-orange-500 text-white',
        unselected: 'bg-[#252525] text-orange-400 hover:bg-orange-500/20',
      },
      3: {
        selected: 'bg-blue-500 text-white',
        unselected: 'bg-[#252525] text-blue-400 hover:bg-blue-500/20',
      },
      4: {
        selected: 'bg-[#444] text-white',
        unselected: 'bg-[#252525] text-[#666] hover:bg-[#333]',
      },
    };
    return isSelected ? colors[priority].selected : colors[priority].unselected;
  }

  getCheckboxClass(task: Task): string {
    const colors: Record<number, string> = {
      1: 'border-red-500 text-red-500',
      2: 'border-orange-500 text-orange-500',
      3: 'border-blue-500 text-blue-500',
      4: 'border-[#555] text-[#555]',
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
      4: 'bg-[#444]',
    };
    return colors[priority];
  }

  // Task methods
  onInputChange(value: string) {
    if (!this.store.settings().smartParsing) {
      this.detectedProject.set(null);
      this.detectedDate.set(null);
      this.detectedPriority.set(null);
      return;
    }

    // Priority Parsing (p1, p2, p3, p4)
    const priorityMatch = value.match(/(?:^|\s)(p[1-4])(?:$|\s)/i);
    if (priorityMatch) {
      const parsedPriority = parseInt(priorityMatch[1].charAt(1));
      if (isValidPriority(parsedPriority)) {
        this.newTaskPriority.set(parsedPriority);
        this.detectedPriority.set({ priority: parsedPriority, text: priorityMatch[1] });
      }
    } else {
      this.detectedPriority.set(null);
    }

    // Project Parsing - now with fuzzy matching
    // Look for #projectName or @projectName or just partial text matching
    const projectMatch = value.match(/(?:^|\s)[#@]([\w-]+)/i);
    const allWorkspaces = [this.store.currentWorkspace(), ...this.store.recentWorkspaces()]
      .filter((ws): ws is NonNullable<typeof ws> => !!ws)
      .filter((ws, index, self) => self.findIndex(w => w.id === ws.id) === index); // Remove duplicates

    if (projectMatch) {
      const searchTerm = projectMatch[1].toLowerCase();
      const matched = this.findBestProjectMatch(searchTerm, allWorkspaces);

      if (matched) {
        this.newTaskProjectId.set(matched.id);
        this.detectedProject.set({
          id: matched.id,
          name: matched.name,
          matchedText: projectMatch[0].trim(),
        });
      } else {
        this.detectedProject.set(null);
      }
    } else {
      // Also try to detect project names mentioned naturally in the text
      const words = value.toLowerCase().split(/\s+/);
      let bestMatch: {
        workspace: (typeof allWorkspaces)[0];
        score: number;
        matchedText: string;
      } | null = null;

      for (const ws of allWorkspaces) {
        const wsNameLower = ws.name.toLowerCase();
        const wsWords = wsNameLower.split(/[\s-_]+/);

        // Check if any word in the input matches the start of the workspace name
        for (const word of words) {
          if (word.length >= 2) {
            // Check if word matches start of workspace name
            if (wsNameLower.startsWith(word)) {
              const score = word.length / wsNameLower.length;
              if (!bestMatch || score > bestMatch.score) {
                bestMatch = { workspace: ws, score, matchedText: word };
              }
            }
            // Check if word matches any word in multi-word workspace name
            for (const wsWord of wsWords) {
              if (wsWord.startsWith(word) && wsWord !== word) {
                const score = (word.length / wsWord.length) * 0.9; // Slightly lower score for partial word match
                if (!bestMatch || score > bestMatch.score) {
                  bestMatch = { workspace: ws, score, matchedText: word };
                }
              }
            }
          }
        }
      }

      if (bestMatch && bestMatch.score >= 0.3) {
        this.detectedProject.set({
          id: bestMatch.workspace.id,
          name: bestMatch.workspace.name,
          matchedText: bestMatch.matchedText,
        });
      } else {
        this.detectedProject.set(null);
      }
    }

    // Date Parsing
    const results = chrono.parse(value);
    if (results.length > 0) {
      const parsedDate = results[0].start.date();
      this.newTaskDueDate = this.formatDateISO(
        parsedDate.getFullYear(),
        parsedDate.getMonth(),
        parsedDate.getDate()
      );
      this.detectedDate.set({ date: this.newTaskDueDate, text: results[0].text });
    } else {
      this.detectedDate.set(null);
    }
  }

  private findBestProjectMatch(
    searchTerm: string,
    workspaces: { id: string; name: string }[]
  ): { id: string; name: string } | null {
    // Exact match first
    let match = workspaces.find(
      ws =>
        ws.name.toLowerCase() === searchTerm ||
        ws.name.toLowerCase().replace(/\s+/g, '-') === searchTerm
    );
    if (match) return match;

    // Starts with match
    match = workspaces.find(ws => ws.name.toLowerCase().startsWith(searchTerm));
    if (match) return match;

    // Contains match
    match = workspaces.find(ws => ws.name.toLowerCase().includes(searchTerm));
    if (match) return match;

    // Fuzzy match - check if all characters appear in order
    for (const ws of workspaces) {
      const name = ws.name.toLowerCase();
      let searchIndex = 0;
      for (const char of name) {
        if (char === searchTerm[searchIndex]) {
          searchIndex++;
          if (searchIndex === searchTerm.length) {
            return ws;
          }
        }
      }
    }

    return null;
  }

  addTask() {
    if (!this.newTaskTitle.trim()) return;

    // Clean up title before adding (remove priority and date text)
    let cleanTitle = this.newTaskTitle;

    if (this.store.settings().smartParsing) {
      // Remove priority
      cleanTitle = cleanTitle.replace(/(?:^|\s)p([1-4])(?:$|\s)/i, ' ').trim();

      // Remove project hashtag
      cleanTitle = cleanTitle.replace(/(?:^|\s)#([\w-]+)/i, ' ').trim();

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
    this.detectedProject.set(null);
    this.detectedDate.set(null);
    this.detectedPriority.set(null);
    this.isAdding.set(false); // Close the input
  }

  applyDetectedProject(project: { id: string; name: string; matchedText: string }) {
    this.newTaskProjectId.set(project.id);
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
  undoTimeout: NodeJS.Timeout | null = null;

  toggleTask(task: Task) {
    const wasCompleted = task.completed;
    this.store.toggleTask(task.id);

    if (!wasCompleted) {
      // Task just completed
      this.lastCompletedTaskId.set(task.id);

      // Clear previous timeout
      if (this.undoTimeout) clearTimeout(this.undoTimeout);

      // Auto-hide after configured duration
      this.undoTimeout = setTimeout(() => {
        this.lastCompletedTaskId.set(null);
      }, APP_CONSTANTS.UI.UNDO_TOAST_DURATION_MS);
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

  // Keyboard shortcuts
  isShortcutsHelpOpen = signal(false);

  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    // Don't trigger shortcuts when typing in inputs
    const target = event.target as HTMLElement;
    const isTyping =
      target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

    // Escape - close modals/panels
    if (event.key === 'Escape') {
      if (this.isShortcutsHelpOpen()) {
        this.isShortcutsHelpOpen.set(false);
        event.preventDefault();
        return;
      }
      if (this.isDatePickerOpen()) {
        this.closeDatePicker();
        event.preventDefault();
        return;
      }
      if (this.selectedTaskId()) {
        this.selectedTaskId.set(null);
        event.preventDefault();
        return;
      }
      if (this.isAdding()) {
        this.isAdding.set(false);
        event.preventDefault();
        return;
      }
    }

    // Don't process other shortcuts when typing
    if (isTyping) return;

    // ? or Ctrl+/ - Show shortcuts help
    if (event.key === '?' || (event.ctrlKey && event.key === '/')) {
      this.isShortcutsHelpOpen.set(!this.isShortcutsHelpOpen());
      event.preventDefault();
      return;
    }

    // N or A - New task
    if (event.key === 'n' || event.key === 'a') {
      if (this.store.activeViewType() !== 'settings') {
        this.isAdding.set(true);
        event.preventDefault();
      }
      return;
    }

    // 1-4 - Set priority of selected task
    if (['1', '2', '3', '4'].includes(event.key) && this.selectedTaskId()) {
      const priority = parseInt(event.key) as 1 | 2 | 3 | 4;
      this.store.updateTask(this.selectedTaskId()!, { priority });
      event.preventDefault();
      return;
    }

    // Space or Enter - Toggle selected task completion
    if ((event.key === ' ' || event.key === 'Enter') && this.selectedTaskId()) {
      this.store.toggleTask(this.selectedTaskId()!);
      event.preventDefault();
      return;
    }

    // Delete or Backspace - Delete selected task
    if ((event.key === 'Delete' || event.key === 'Backspace') && this.selectedTaskId()) {
      this.deleteSelectedTask(this.selectedTaskId()!);
      event.preventDefault();
      return;
    }

    // D - Set due date for selected task
    if (event.key === 'd' && this.selectedTaskId()) {
      const task = this.selectedTask();
      if (task) {
        this.openDatePicker('edit', task.id, task.dueDate);
        event.preventDefault();
      }
      return;
    }

    // T - Set due date to today
    if (event.key === 't' && this.selectedTaskId()) {
      this.store.updateTask(this.selectedTaskId()!, { dueDate: this.getTodayDate() });
      event.preventDefault();
      return;
    }

    // Arrow keys - Navigate tasks
    if (event.key === 'ArrowDown' || event.key === 'j') {
      this.navigateTasks(1);
      event.preventDefault();
      return;
    }
    if (event.key === 'ArrowUp' || event.key === 'k') {
      this.navigateTasks(-1);
      event.preventDefault();
      return;
    }

    // G then I - Go to Inbox
    // G then T - Go to Today
    // G then U - Go to Upcoming
    // G then S - Go to Settings
  }

  navigateTasks(direction: number) {
    const tasks = this.sortedTasks();
    if (tasks.length === 0) return;

    const currentId = this.selectedTaskId();
    if (!currentId) {
      // Select first or last task
      this.selectedTaskId.set(direction > 0 ? tasks[0].id : tasks[tasks.length - 1].id);
      return;
    }

    const currentIndex = tasks.findIndex(t => t.id === currentId);
    const newIndex = Math.max(0, Math.min(tasks.length - 1, currentIndex + direction));
    this.selectedTaskId.set(tasks[newIndex].id);
  }

  openShortcutsHelp() {
    this.isShortcutsHelpOpen.set(true);
  }
}
