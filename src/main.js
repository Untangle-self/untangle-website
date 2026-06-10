import {
  init,
  trackJoinWaitlistClicked,
  trackWaitlistSignupCompleted,
} from './analytics.js'

init()

const form = document.getElementById('waitlist-form')
const emailInput = document.getElementById('waitlist-email')

if (form && emailInput) {
  form.addEventListener('submit', function (event) {
    event.preventDefault()
    const email = emailInput.value.trim()
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!emailPattern.test(email)) {
      emailInput.focus()
      return
    }

    const submitButton = form.querySelector('.waitlist-btn')
    if (submitButton) submitButton.disabled = true

    // join_waitlist_clicked fires after email validation, before the network request
    trackJoinWaitlistClicked()

    fetch('https://hooks.zapier.com/hooks/catch/10548864/4y3dpz9/', {
      method: 'POST',
      body: new URLSearchParams({ email }),
    })
      .then(function (response) {
        if (!response.ok) throw new Error('Request failed')
        // waitlist_signup_completed fires only on confirmed success
        trackWaitlistSignupCompleted()
        form.style.display = 'none'
        const confirmEl = document.getElementById('wl-confirm')
        if (confirmEl) {
          confirmEl.innerHTML =
            'You’re on the list ✨<br />We’ll reach out when it’s ready.'
          confirmEl.style.display = 'block'
        }
      })
      .catch(function () {
        if (submitButton) submitButton.disabled = false
      })
  })
}
