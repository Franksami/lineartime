'use client'

import React from 'react'
import { EventManagement } from '@/components/calendar/EventManagement'

export default function EventsTestPage() {
  // Use a test user ID for testing purposes
  const userId = 'test-user'

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
      {/* Glassmorphic background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000" />
      </div>

      <div className="relative z-10 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-5xl font-bold text-white mb-2 tracking-tight">
              Event Management System
            </h1>
            <p className="text-white/70 text-lg">
              Glassmorphic event cards with drag-and-drop functionality
            </p>
          </div>

          {/* Main Content */}
          <div className="bg-white/10 backdrop-blur-2xl rounded-3xl border border-white/20 shadow-2xl p-8">
            <EventManagement userId={userId} />
          </div>

          {/* Features List */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 p-6">
              <h3 className="text-white font-semibold mb-2">✨ Glassmorphic Design</h3>
              <p className="text-white/70 text-sm">
                Beautiful frosted glass effects with depth and layering
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 p-6">
              <h3 className="text-white font-semibold mb-2">🎯 Drag & Drop</h3>
              <p className="text-white/70 text-sm">
                Intuitive drag and drop interface for event organization
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 p-6">
              <h3 className="text-white font-semibold mb-2">💾 Offline Support</h3>
              <p className="text-white/70 text-sm">
                IndexedDB integration for reliable offline functionality
              </p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 10s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  )
}