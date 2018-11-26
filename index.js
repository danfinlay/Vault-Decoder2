const passworder = require('browser-passworder')

const form = document.querySelector('form')
form.addEventListener('submit', function (event) {
  event.preventDefault()
  const encrypted = JSON.parse(fileInput.value).KeyringController.vault
  passworder.decrypt(password.value, encrypted)
  .then(function (result) {
    decodedResult.innerText = JSON.stringify(result)
  })
  .catch(function (error) {
    decodedResult.innerText = `Error: ${JSON.stringify(error)}`
  })
})
