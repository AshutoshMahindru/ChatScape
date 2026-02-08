'use client'

import { MindMapControlsProps, LayoutType, FilterState } from '@/lib/visualization/types'
import { useState } from 'react'

export default function MindMapControls({
  layout,
  onLayoutChange,
  filters,
  onFilterChange,
  availableTopics,
  onZoomIn,
  onZoomOut,
  onFitToScreen,
}: MindMapControlsProps) {
  const [showTopicDropdown, setShowTopicDropdown] = useState(false)

  const handleRoleToggle = (role: 'user' | 'assistant' | 'system') => {
    const newRoles = filters.roles.includes(role)
      ? filters.roles.filter((r) => r !== role)
      : [...filters.roles, role]

    onFilterChange({ ...filters, roles: newRoles })
  }

  const handleTopicToggle = (topic: string) => {
    const newTopics = filters.topics.includes(topic)
      ? filters.topics.filter((t) => t !== topic)
      : [...filters.topics, topic]

    onFilterChange({ ...filters, topics: newTopics })
  }

  const handleClearFilters = () => {
    onFilterChange({
      topics: [],
      roles: [],
      searchQuery: '',
    })
  }

  const hasActiveFilters = filters.topics.length > 0 || filters.roles.length > 0 || filters.searchQuery !== ''

  return (
    <div className="absolute top-0 left-0 right-0 p-4 bg-white border-b border-gray-200 shadow-sm z-10">
      <div className="flex flex-wrap gap-4 items-center justify-between">
        {/* Left: Search and Filters */}
        <div className="flex flex-wrap gap-3 items-center flex-1">
          {/* Search Box */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search messages..."
              value={filters.searchQuery}
              onChange={(e) => onFilterChange({ ...filters, searchQuery: e.target.value })}
              className="w-64 pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            {filters.searchQuery && (
              <button
                onClick={() => onFilterChange({ ...filters, searchQuery: '' })}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Role Filter */}
          <div className="flex gap-2 items-center">
            <span className="text-sm text-gray-600 font-medium">Role:</span>
            <button
              onClick={() => handleRoleToggle('user')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filters.roles.length === 0 || filters.roles.includes('user')
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-400'
              }`}
            >
              👤 User
            </button>
            <button
              onClick={() => handleRoleToggle('assistant')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filters.roles.length === 0 || filters.roles.includes('assistant')
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-gray-100 text-gray-400'
              }`}
            >
              🤖 Assistant
            </button>
          </div>

          {/* Topic Filter */}
          {availableTopics.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowTopicDropdown(!showTopicDropdown)}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
              >
                <span>Topics</span>
                {filters.topics.length > 0 && (
                  <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                    {filters.topics.length}
                  </span>
                )}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showTopicDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowTopicDropdown(false)}
                  />
                  <div className="absolute top-full mt-2 left-0 bg-white border border-gray-200 rounded-lg shadow-lg z-20 w-64 max-h-64 overflow-y-auto">
                    {availableTopics.map((topicItem) => (
                      <label
                        key={topicItem.topic}
                        className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={filters.topics.includes(topicItem.topic)}
                          onChange={() => handleTopicToggle(topicItem.topic)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="flex-1 text-sm text-gray-700 truncate">{topicItem.topic}</span>
                        <span className="text-xs text-gray-400">{topicItem.count}</span>
                      </label>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* Right: Layout and Zoom Controls */}
        <div className="flex gap-3 items-center">
          {/* Layout Switcher */}
          <select
            value={layout}
            onChange={(e) => onLayoutChange(e.target.value as LayoutType)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="force-directed">Force-Directed</option>
            <option value="hierarchical">Hierarchical</option>
            <option value="radial">Radial</option>
          </select>

          {/* Zoom Controls */}
          <div className="flex gap-1 border border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={onZoomIn}
              className="px-3 py-1.5 hover:bg-gray-100 transition-colors"
              title="Zoom In"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
            <button
              onClick={onZoomOut}
              className="px-3 py-1.5 hover:bg-gray-100 transition-colors border-x border-gray-300"
              title="Zoom Out"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            <button
              onClick={onFitToScreen}
              className="px-3 py-1.5 hover:bg-gray-100 transition-colors"
              title="Fit to Screen"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
