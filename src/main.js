import {
  init,
  trackJoinWaitlistClicked,
  trackWaitlistSignupCompleted,
} from './analytics.js'

init()

const TURNSTILE_SITE_KEY = import.meta.env.TURNSTILE_SITE_KEY
const WAITLIST_API_URL = (() => {
  const url = import.meta.env.VITE_WAITLIST_API_URL?.trim()
  if (!url) return ''
  const base = url.replace(/\/+$/, '')
  return base.endsWith('/api/waitlist') ? base : `${base}/api/waitlist`
})()

const form = document.getElementById('waitlist-form')
const emailInput = document.getElementById('waitlist-email')
const errorEl = document.getElementById('wl-error')
const turnstileContainer = document.getElementById('turnstile-widget')

/** @type {string | null} */
let turnstileWidgetId = null

/**
 * @param {string} message
 */
function showWaitlistError(message) {
  if (!errorEl) return
  errorEl.textContent = message
  errorEl.style.display = 'block'
}

function clearWaitlistError() {
  if (!errorEl) return
  errorEl.textContent = ''
  errorEl.style.display = 'none'
}

function loadTurnstileScript() {
  if (window.turnstile) return Promise.resolve()

  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Turnstile failed to load'))
    document.head.appendChild(script)
  })
}

function renderTurnstileWidget() {
  if (!turnstileContainer || !TURNSTILE_SITE_KEY || !window.turnstile) return

  turnstileWidgetId = window.turnstile.render(turnstileContainer, {
    sitekey: TURNSTILE_SITE_KEY,
    theme: 'light',
    callback: () => clearWaitlistError(),
    'expired-callback': () => {
      if (turnstileWidgetId !== null) window.turnstile?.reset(turnstileWidgetId)
    },
    'error-callback': () => {
      showWaitlistError('Verification could not load. Please refresh and try again.')
    },
  })
}

if (form && emailInput) {
  if (TURNSTILE_SITE_KEY) {
    loadTurnstileScript()
      .then(renderTurnstileWidget)
      .catch(() => {
        showWaitlistError('Verification could not load. Please refresh and try again.')
      })
  }

  form.addEventListener('submit', async function (event) {
    event.preventDefault()
    clearWaitlistError()

    const email = emailInput.value.trim()
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!emailPattern.test(email)) {
      emailInput.focus()
      return
    }

    const turnstileToken =
      turnstileWidgetId !== null && window.turnstile
        ? window.turnstile.getResponse(turnstileWidgetId) || ''
        : ''

    if (!turnstileToken) {
      showWaitlistError('Please complete the verification check before joining the waitlist.')
      return
    }

    if (!WAITLIST_API_URL) {
      showWaitlistError('Waitlist is temporarily unavailable. Please try again later.')
      return
    }

    const submitButton = form.querySelector('.waitlist-btn')
    if (submitButton) submitButton.disabled = true

    trackJoinWaitlistClicked()

    try {
      const response = await fetch(WAITLIST_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, turnstileToken }),
      })

      let payload = {}
      try {
        payload = await response.json()
      } catch {
        payload = {}
      }

      if (!response.ok) {
        showWaitlistError(
          typeof payload.error === 'string'
            ? payload.error
            : 'We could not add you to the waitlist right now. Please try again shortly.',
        )
        if (turnstileWidgetId !== null) window.turnstile?.reset(turnstileWidgetId)
        if (submitButton) submitButton.disabled = false
        return
      }

      trackWaitlistSignupCompleted()
      form.style.display = 'none'
      const confirmEl = document.getElementById('wl-confirm')
      if (confirmEl) {
        confirmEl.innerHTML =
          'You’re on the list ✨<br />We’ll reach out when it’s ready.'
        confirmEl.style.display = 'block'
      }
    } catch {
      showWaitlistError(
        'We could not reach the server. Please check your connection and try again.',
      )
      if (turnstileWidgetId !== null) window.turnstile?.reset(turnstileWidgetId)
      if (submitButton) submitButton.disabled = false
    }
  })
}
