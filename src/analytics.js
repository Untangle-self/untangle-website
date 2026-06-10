import posthog from 'posthog-js'

const KEY = import.meta.env.VITE_POSTHOG_KEY

export function init() {
  if (!KEY) return

  posthog.init(KEY, {
    api_host: 'https://us.i.posthog.com',

    // Disable invasive capture — no autocapture, no session replay, no heatmaps.
    // Standard traffic metadata (referrer, UTM, $current_url) is included
    // automatically on every posthog.capture() call.
    autocapture: false,
    capture_pageview: false,
    capture_pageleave: false,
    disable_session_recording: true,
    enable_heatmaps: false,

    persistence: 'localStorage',
  })
}

function capture(event) {
  if (!KEY) return
  posthog.capture(event)
}

// ── Tracked events ───────────────────────────────────────────────────────────
// All posthog.capture() calls go through this file. No scattered raw calls.

export function trackLandingPageViewed() {
  capture('landing_page_viewed')
}

export function trackJoinWaitlistClicked() {
  capture('join_waitlist_clicked')
}

export function trackWaitlistSignupCompleted() {
  capture('waitlist_signup_completed')
}
