<template>
  <AppLayout>
    <template #default>
      <div class="max-w-7xl mx-auto space-y-6">
        <!-- Header -->
        <div class="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">智能课表</h1>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              管理你的课程安排，支持教务文本导入和手动编辑
            </p>
          </div>
          <div class="flex items-center gap-3">
            <!-- Mode Tabs -->
            <div class="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1 border border-gray-200 dark:border-gray-700">
              <button
                v-for="tab in modeTabs"
                :key="tab.value"
                @click="mode = tab.value"
                :class="mode === tab.value
                  ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'"
                class="px-4 py-2 text-sm font-medium rounded-md transition-all"
              >
                {{ tab.label }}
              </button>
            </div>
          </div>
        </div>

        <!-- Import Mode -->
        <div v-if="mode === 'import'" class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              粘贴教务系统课表文本
            </label>
            <textarea
              v-model="importText"
              rows="12"
              placeholder="请从教务系统复制课表文本并粘贴到此处...&#10;&#10;例如：&#10;高等数学 | 张三 | 教1-101 | 周一 8:00-9:40 | 1-16周&#10;大学物理 | 李四 | 教2-203 | 周二 10:00-11:40 | 1-16周&#10;&#10;也可以使用以下格式：&#10;课程名+教师+教室+时间+周次"
              class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y transition-colors font-mono text-sm"
            ></textarea>
          </div>

          <div class="flex flex-wrap items-center gap-4">
            <div class="flex items-center gap-2">
              <label class="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">学期:</label>
              <input
                v-model="semester"
                type="text"
                placeholder="2025-2026-2"
                class="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent w-40"
              />
            </div>

            <button
              @click="handleImport"
              :disabled="importing || !importText.trim()"
              class="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 dark:disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors shadow-sm"
            >
              <svg v-if="importing" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
              {{ importing ? '解析中...' : '解析导入' }}
            </button>
          </div>

          <!-- Import Loading -->
          <LoadingSpinner v-if="importing" text="正在解析课表文本..." />

          <!-- Import Error -->
          <div
            v-if="importError"
            class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4"
          >
            <div class="flex items-start gap-3">
              <svg class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div class="flex-1">
                <p class="text-sm font-medium text-red-800 dark:text-red-300">{{ importError }}</p>
              </div>
            </div>
          </div>

          <!-- Import Success -->
          <div
            v-if="importSuccess"
            class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 flex items-center gap-3"
          >
            <svg class="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p class="text-sm font-medium text-green-800 dark:text-green-300">导入成功！共导入 {{ importCount }} 门课程</p>
              <button @click="mode = 'view'; importSuccess = false" class="text-sm text-green-600 dark:text-green-400 hover:underline mt-1">查看课表</button>
            </div>
          </div>
        </div>

        <!-- View Mode -->
        <div v-if="mode === 'view'" class="space-y-4">
          <!-- Loading -->
          <div v-if="loading" class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-16">
            <LoadingSpinner text="加载课表数据..." />
          </div>

          <!-- Load Error -->
          <div
            v-if="loadError && !loading"
            class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4"
          >
            <div class="flex items-start gap-3">
              <svg class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div class="flex-1">
                <p class="text-sm font-medium text-red-800 dark:text-red-300">{{ loadError }}</p>
                <button @click="fetchSchedule" class="mt-2 text-sm text-red-600 dark:text-red-400 hover:underline">重试</button>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div
            v-if="!loading && !loadError && courses.length === 0"
            class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-dashed border-gray-300 dark:border-gray-600 p-16"
          >
            <EmptyState
              icon="📅"
              title="还没有课表"
              description="请导入教务文本或手动添加课程，开始管理你的课表"
            />
            <div class="flex items-center justify-center gap-3 mt-4">
              <button @click="mode = 'import'" class="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
                导入课表
              </button>
              <button @click="openAddModal" class="inline-flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                手动添加
              </button>
            </div>
          </div>

          <!-- Schedule Content -->
          <div v-if="!loading && !loadError && courses.length > 0" class="space-y-4">
            <!-- Toolbar -->
            <div class="flex flex-wrap items-center justify-between gap-3">
              <!-- Day Filter Tabs -->
              <div class="flex flex-wrap gap-1">
                <button
                  v-for="day in dayTabs"
                  :key="day.value"
                  @click="selectedDay = day.value"
                  :class="selectedDay === day.value
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'"
                  class="px-3 py-1.5 text-xs font-medium rounded-md transition-colors"
                >
                  {{ day.label }}
                </button>
              </div>

              <!-- Actions -->
              <div class="flex items-center gap-2">
                <button
                  @click="openAddModal"
                  class="inline-flex items-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                  </svg>
                  添加课程
                </button>
                <button
                  @click="handleExportWallpaper"
                  :disabled="exporting"
                  class="inline-flex items-center gap-1.5 px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 dark:disabled:bg-purple-800 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <svg v-if="exporting" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {{ exporting ? '导出中...' : '导出壁纸' }}
                </button>
              </div>
            </div>

            <!-- Week View Grid -->
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div class="overflow-x-auto">
                <div class="min-w-[900px]">
                  <!-- Header Row: Day columns -->
                  <div class="grid grid-cols-8 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <div class="p-2 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700">
                      时间
                    </div>
                    <div
                      v-for="day in weekDays"
                      :key="day.value"
                      :class="[
                        'p-2 text-center text-xs font-semibold border-r border-gray-200 dark:border-gray-700',
                        selectedDay === day.value ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/10' : 'text-gray-700 dark:text-gray-300'
                      ]"
                    >
                      {{ day.label }}
                    </div>
                  </div>

                  <!-- Time Slots: 8:00 - 22:00 -->
                  <div
                    v-for="slot in timeSlots"
                    :key="slot.hour"
                    class="grid grid-cols-8 border-b border-gray-100 dark:border-gray-700/50"
                  >
                    <!-- Time Label -->
                    <div class="p-1 text-center text-xs text-gray-500 dark:text-gray-400 border-r border-gray-100 dark:border-gray-700/50 flex items-center justify-center bg-gray-50/50 dark:bg-gray-900/20">
                      {{ slot.label }}
                    </div>

                    <!-- Day Columns -->
                    <div
                      v-for="day in weekDays"
                      :key="day.value"
                      class="relative p-0.5 border-r border-gray-100 dark:border-gray-700/50 min-h-[48px]"
                    >
                      <div
                        v-if="getCourseAtSlot(day.value, slot.hour)"
                        @click.stop="openEditModal(getCourseAtSlot(day.value, slot.hour))"
                        class="absolute inset-x-0.5 top-0.5 bottom-0.5 rounded p-1.5 cursor-pointer hover:opacity-90 transition-opacity overflow-hidden group"
                        :style="{
                          backgroundColor: getCourseAtSlot(day.value, slot.hour).color + '18',
                          borderLeft: '3px solid ' + getCourseAtSlot(day.value, slot.hour).color
                        }"
                      >
                        <p
                          class="text-[11px] font-semibold truncate leading-tight"
                          :style="{ color: getCourseAtSlot(day.value, slot.hour).color }"
                        >
                          {{ getCourseAtSlot(day.value, slot.hour).name }}
                        </p>
                        <p class="text-[10px] text-gray-500 dark:text-gray-400 truncate leading-tight">
                          {{ getCourseAtSlot(day.value, slot.hour).location || '' }}
                        </p>
                        <p class="text-[10px] text-gray-400 dark:text-gray-500 truncate leading-tight">
                          {{ getCourseAtSlot(day.value, slot.hour).teacher || '' }}
                        </p>
                        <!-- Edit hint on hover -->
                        <div class="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors rounded flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <span class="text-[9px] text-gray-900 dark:text-gray-100 bg-white/80 dark:bg-gray-800/80 px-1.5 py-0.5 rounded">编辑</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Course List (Mobile-friendly) -->
            <div class="lg:hidden space-y-3">
              <div
                v-for="course in filteredCourses"
                :key="course.id || course._id"
                @click="openEditModal(course)"
                class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 cursor-pointer hover:shadow-md transition-shadow"
                :style="{ borderLeftColor: course.color, borderLeftWidth: '4px' }"
              >
                <div class="flex items-start justify-between">
                  <div>
                    <h3 class="font-semibold text-gray-900 dark:text-white">{{ course.name }}</h3>
                    <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">{{ course.teacher }}</p>
                  </div>
                  <span class="text-xs text-gray-400 dark:text-gray-500 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">
                    {{ weekDays.find(d => d.value === course.day)?.label || '周' + course.day }}
                  </span>
                </div>
                <div class="flex flex-wrap items-center gap-2 mt-2 text-xs text-gray-500 dark:text-gray-400">
                  <span>{{ formatTime(course.startTime || course.start_time) }} - {{ formatTime(course.endTime || course.end_time) }}</span>
                  <span v-if="course.location" class="text-gray-300 dark:text-gray-600">|</span>
                  <span v-if="course.location">{{ course.location }}</span>
                  <span v-if="course.weeks" class="text-gray-300 dark:text-gray-600">|</span>
                  <span v-if="course.weeks">第{{ course.weeks }}周</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Add/Edit Course Modal -->
        <transition name="modal">
          <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div class="absolute inset-0 bg-black/50" @click="closeModal"></div>
            <div class="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div class="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between z-10">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                  {{ editingCourse ? '编辑课程' : '添加课程' }}
                </h3>
                <button @click="closeModal" class="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div class="p-6 space-y-4">
                <!-- Course Name -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">课程名称 *</label>
                  <input
                    v-model="form.name"
                    type="text"
                    placeholder="如：高等数学"
                    class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <!-- Teacher & Location -->
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">教师</label>
                    <input
                      v-model="form.teacher"
                      type="text"
                      placeholder="任课教师"
                      class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">教室</label>
                    <input
                      v-model="form.location"
                      type="text"
                      placeholder="如：教1-101"
                      class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <!-- Day & Weeks -->
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">星期</label>
                    <select
                      v-model="form.day"
                      class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option v-for="d in weekDays" :key="d.value" :value="d.value">{{ d.label }}</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">周次</label>
                    <input
                      v-model="form.weeks"
                      type="text"
                      placeholder="如：1-16"
                      class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <!-- Start/End Time -->
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">开始时间</label>
                    <input
                      v-model="form.startTime"
                      type="time"
                      class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">结束时间</label>
                    <input
                      v-model="form.endTime"
                      type="time"
                      class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <!-- Color Picker -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">颜色标识</label>
                  <div class="flex flex-wrap gap-2">
                    <button
                      v-for="color in courseColors"
                      :key="color"
                      @click="form.color = color"
                      class="w-8 h-8 rounded-full border-2 transition-all duration-200"
                      :class="form.color === color ? 'border-gray-900 dark:border-white scale-110 ring-2 ring-offset-1 ring-gray-400 dark:ring-offset-gray-800' : 'border-transparent hover:scale-105'"
                      :style="{ backgroundColor: color }"
                    ></button>
                  </div>
                </div>

                <!-- Action Buttons -->
                <div class="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    v-if="editingCourse"
                    @click="handleDeleteCourse"
                    :disabled="saving"
                    class="px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                  >
                    删除课程
                  </button>
                  <div v-else></div>
                  <div class="flex items-center gap-2">
                    <button
                      @click="closeModal"
                      class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                    >
                      取消
                    </button>
                    <button
                      @click="handleSaveCourse"
                      :disabled="saving || !form.name.trim()"
                      class="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 dark:disabled:bg-blue-800 disabled:cursor-not-allowed rounded-lg transition-colors"
                    >
                      <svg v-if="saving" class="animate-spin w-4 h-4 inline mr-1" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      {{ saving ? '保存中...' : (editingCourse ? '更新课程' : '保存课程') }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </transition>
      </div>
    </template>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import { scheduleAPI } from '@/api'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import EmptyState from '@/components/common/EmptyState.vue'

// View / Import mode
const modeTabs = [
  { value: 'view', label: '视图模式' },
  { value: 'import', label: '导入模式' }
]
const mode = ref('view')

// Schedule data
const loading = ref(false)
const loadError = ref('')
const courses = ref([])
const selectedDay = ref(0)

// Import state
const importText = ref('')
const semester = ref('2025-2026-2')
const importing = ref(false)
const importError = ref('')
const importSuccess = ref(false)
const importCount = ref(0)

// Modal state
const showModal = ref(false)
const editingCourse = ref(null)
const saving = ref(false)
const exporting = ref(false)

// Form state
const defaultForm = () => ({
  name: '',
  teacher: '',
  location: '',
  day: 1,
  startTime: '08:00',
  endTime: '09:40',
  weeks: '1-16',
  color: '#3B82F6'
})
const form = ref(defaultForm())

const courseColors = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
  '#EC4899', '#06B6D4', '#F97316', '#14B8A6', '#6366F1',
  '#84CC16', '#D946EF'
]

const weekDays = [
  { value: 1, label: '周一' },
  { value: 2, label: '周二' },
  { value: 3, label: '周三' },
  { value: 4, label: '周四' },
  { value: 5, label: '周五' },
  { value: 6, label: '周六' },
  { value: 7, label: '周日' }
]

const dayTabs = [
  { value: 0, label: '全部' },
  ...weekDays
]

const timeSlots = computed(() => {
  const slots = []
  for (let h = 8; h <= 22; h++) {
    slots.push({
      hour: h,
      label: `${String(h).padStart(2, '0')}:00`
    })
  }
  return slots
})

const filteredCourses = computed(() => {
  if (selectedDay.value === 0) return courses.value
  return courses.value.filter(c => c.day === selectedDay.value)
})

function parseTimeHour(timeStr) {
  if (!timeStr) return 0
  return parseInt(timeStr.split(':')[0], 10) || 0
}

function getCourseAtSlot(day, hour) {
  return courses.value.find(c => {
    if (c.day !== day) return false
    const start = parseTimeHour(c.startTime || c.start_time)
    const end = parseTimeHour(c.endTime || c.end_time)
    return hour >= start && hour < end
  })
}

function formatTime(timeStr) {
  if (!timeStr) return ''
  const parts = timeStr.split(':')
  return `${parts[0] || '00'}:${parts[1] || '00'}`
}

async function fetchSchedule() {
  loading.value = true
  loadError.value = ''

  try {
    const res = await scheduleAPI.getCurrent()
    const data = res.data || res
    const raw = data.courses || data || []
    courses.value = Array.isArray(raw) ? raw.map(c => ({
      ...c,
      id: c.id || c._id,
      day: c.day || c.dayOfWeek,
      startTime: c.startTime || c.start_time,
      endTime: c.endTime || c.end_time
    })) : []
  } catch (err) {
    loadError.value = err?.response?.data?.message || err?.message || '加载课表失败'
  } finally {
    loading.value = false
  }
}

async function handleImport() {
  if (!importText.value.trim()) return

  importing.value = true
  importError.value = ''
  importSuccess.value = false

  try {
    const res = await scheduleAPI.importFromText({
      text: importText.value,
      semester: semester.value
    })
    const data = res.data || res
    importCount.value = data.count || data.courses?.length || 0
    const raw = data.courses || data || []
    courses.value = Array.isArray(raw) ? raw.map(c => ({
      ...c,
      id: c.id || c._id,
      day: c.day || c.dayOfWeek,
      startTime: c.startTime || c.start_time,
      endTime: c.endTime || c.end_time
    })) : []
    importSuccess.value = true
  } catch (err) {
    importError.value = err?.response?.data?.message || err?.message || '导入失败，请检查文本格式'
  } finally {
    importing.value = false
  }
}

function openAddModal() {
  editingCourse.value = null
  form.value = defaultForm()
  showModal.value = true
}

function openEditModal(course) {
  editingCourse.value = course
  form.value = {
    name: course.name || '',
    teacher: course.teacher || '',
    location: course.location || '',
    day: course.day || course.dayOfWeek || 1,
    startTime: course.startTime || course.start_time || '08:00',
    endTime: course.endTime || course.end_time || '09:40',
    weeks: course.weeks || '1-16',
    color: course.color || '#3B82F6'
  }
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingCourse.value = null
}

async function handleSaveCourse() {
  if (!form.value.name.trim()) return

  saving.value = true

  try {
    if (editingCourse.value) {
      const id = editingCourse.value.id || editingCourse.value._id
      const payload = { ...form.value }
      await scheduleAPI.updateCourse(id, payload)

      const idx = courses.value.findIndex(c => (c.id || c._id) === id)
      if (idx > -1) {
        courses.value[idx] = { ...courses.value[idx], ...payload, id: courses.value[idx].id || courses.value[idx]._id }
      }
    } else {
      const payload = { ...form.value }
      const res = await scheduleAPI.addCourse(payload)
      const newCourse = {
        ...payload,
        id: (res.data?.course?._id || res.data?._id || Date.now()),
        _id: (res.data?.course?._id || res.data?._id),
        ...(res.data?.course || {})
      }
      courses.value.push(newCourse)
    }
    closeModal()
  } catch (err) {
    alert(err?.response?.data?.message || err?.message || '保存失败')
  } finally {
    saving.value = false
  }
}

async function handleDeleteCourse() {
  if (!editingCourse.value) return

  const courseName = editingCourse.value.name || '未命名课程'
  if (!confirm(`确定要删除课程"${courseName}"吗？此操作不可恢复。`)) return

  saving.value = true

  try {
    const id = editingCourse.value.id || editingCourse.value._id
    await scheduleAPI.deleteCourse(id)
    courses.value = courses.value.filter(c => (c.id || c._id) !== id)
    closeModal()
  } catch (err) {
    alert(err?.response?.data?.message || err?.message || '删除失败')
  } finally {
    saving.value = false
  }
}

async function handleExportWallpaper() {
  exporting.value = true
  try {
    const res = await scheduleAPI.getWallpaper()
    if (res.data?.url) {
      window.open(res.data.url, '_blank')
    } else if (res.data) {
      const blob = res.data instanceof Blob ? res.data : new Blob([JSON.stringify(res.data)], { type: 'image/png' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = '课表壁纸.png'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } else {
      // Fallback: capture the schedule grid as wallpaper using canvas if html2canvas available
      if (typeof html2canvas !== 'undefined') {
        const grid = document.querySelector('.overflow-x-auto')
        if (grid) {
          const canvas = await html2canvas(grid, { backgroundColor: '#ffffff' })
          const dataUrl = canvas.toDataURL('image/png')
          const a = document.createElement('a')
          a.href = dataUrl
          a.download = '课表壁纸.png'
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
        }
      } else {
        alert('导出壁纸功能需要服务端支持。你的课表数据已就绪，截图即可。')
      }
    }
  } catch (err) {
    alert(err?.response?.data?.message || err?.message || '导出失败')
  } finally {
    exporting.value = false
  }
}

onMounted(() => {
  fetchSchedule()
})
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-active > div:last-child,
.modal-leave-active > div:last-child {
  transition: transform 0.2s ease;
}
.modal-enter-from > div:last-child {
  transform: scale(0.95);
}
.modal-leave-to > div:last-child {
  transform: scale(0.95);
}
</style>
