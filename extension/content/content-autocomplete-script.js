/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

let mlAutofillSuggestions = null;

let popup = document.getElementById('autocomplete-popup');
if (!popup) {
  popup = document.createElement('div');
  popup.id = 'autocomplete-popup';
  popup.style.position = 'absolute';
  popup.style.display = 'none';
  popup.style.border = '1px solid #ccc';
  popup.style.backgroundColor = 'white';
  popup.style.maxHeight = '150px';
  popup.style.overflowY = 'auto';
  popup.style.zIndex = '9999';
  document.body.appendChild(popup);
}

let preview = document.createElement('div');
preview.id = 'autocomplete-preview';
document.body.appendChild(preview);

document.addEventListener('focus', async (event) => {
  const inputElement = event.target;

  if (inputElement.tagName === 'INPUT' && ['text', 'email'].includes(inputElement.type)) {
    await showAutocompletePopup(inputElement);
    // Hide the popup when the input loses focus (blur event)
    inputElement.addEventListener('blur', function() {
      setTimeout(function() {
        // Add a delay to allow for click on the popup list items
        const popup = document.getElementById('autocomplete-popup');
        if (popup) {
          popup.style.display = 'none'; // Hide the popup when input loses focus
        }
      }, 150); // Slight delay to avoid popup closing when clicking on list items
    }, { once: true });
  }
}, true);


// Step 1: Function to find the form containing the specified autofillId
function findFormByAutofillId(data, targetAutofillId) {
  // Iterate through all forms to find the form containing the target autofillId
  for (let form of data.forms) {
    for (let field of form.fields) {
      if (field.dataMozAutofillInspectId === targetAutofillId) {
        return form;  // Return the form containing the target field
      }
    }
  }
  return null;  // Return null if no matching form is found
}

// Function to display preview text (either on the input or a dedicated preview area)
function displayPreview(inputElement, suggestion, { preview = true, clear = false } = {}) {
  const form = findFormByAutofillId(suggestion, inputElement.getAttribute('data-moz-autofill-inspect-id'));
  if (!form) {
    return; // If no form is found, do nothing
  }

  dump("[Dimi]display preview " + preview + "/ " + clear + "\n");
  form.fields.forEach(field => {
    const element = document.querySelector(`[data-moz-autofill-inspect-id="${field.dataMozAutofillInspectId}"]`);;

    if (clear) {
      if ((preview && element.dataset.mozAutofillState === 'preview') ||
         (!preview && element.dataset.mozAutofillState === 'autofilled')) {
        element.value = element.dataset.mozDefaultValue || '';
        element.style.backgroundColor = element.dataset.mozDefaultBGValue || '';
        element.removeAttribute('data-moz-default-value');
        element.removeAttribute('data-moz-default-b-g-value');
        element.removeAttribute('data-moz-autofill-state');
      }
      return;
    } else if (preview && element.dataset.mozAutofillState === 'autofilled') {
      return;
    }

    const fillValue = field.fillValue || '';
    if (!fillValue) {
      return; // Skip if no suggestion is available
    }

    element.dataset.mozAutofillState = preview ? 'preview' : 'autofilled';
    if (!element.hasAttribute("data-moz-default-value")) {
      element.dataset.mozDefaultValue = element.value;
      element.dataset.mozDefaultBGValue = element.style.backgroundColor;
    }
    element.value = `${fillValue}`;
    element.style.backgroundColor = '#e0f7fa'; // Change input background color
  });
}

async function showAutocompletePopup(inputElement) {
  const useText = 'Use AI Autofill Suggestion';
  const clearText = 'Clear Autofill Suggestion';
  const suggestions = [useText, clearText];

  const list = document.createElement('ul');
  list.id = 'autocomplete-list';
  list.style.margin = 0;
  list.style.padding = '0';
  list.style.listStyleType = 'none';

  suggestions.forEach(function(suggestion) {
    const listItem = document.createElement('li');
    listItem.textContent = suggestion;
    listItem.style.padding = '8px';
    listItem.style.cursor = 'pointer';

    // When hovered over, change the background color
    listItem.addEventListener('mouseover', function() {
      listItem.style.backgroundColor = '#f0f0f0'; // Change background color on hover
      if (suggestion == useText) {
        displayPreview(inputElement, mlAutofillSuggestions, { preview: true, clear: false}); // Update the preview text (input or preview area)
      }
    });

    // When mouse leaves the item, reset background color
    listItem.addEventListener('mouseleave', function() {
      listItem.style.backgroundColor = ''; // Reset background color
      if (suggestion == useText) {
        displayPreview(inputElement, mlAutofillSuggestions, { preview: true, clear: true}); 
      }
    });

    listItem.addEventListener('click', async () => {
      const clear = suggestion === clearText;
      displayPreview(inputElement, mlAutofillSuggestions, { preview: false, clear}); 
      popup.style.display = 'none';
      preview.style.display = 'none';
    });

    list.appendChild(listItem);
  });

  popup.innerHTML = '';
  popup.appendChild(list);

  const rect = inputElement.getBoundingClientRect();
  popup.style.top = rect.bottom + window.scrollY + 'px';
  popup.style.left = rect.left + window.scrollX + 'px';
  popup.style.display = 'block';
}

browser.runtime.onMessage.addListener((request, sender) => {
  console.log("[Dimi]Received ai-autofill-fields message " + request.msg + "\n");
  if (request.msg === "ai-autofill-fields") {
    dump("[Dimi]Received ai-autofill-fields message " + JSON.stringify(request.data) + "\n");
    mlAutofillSuggestions = request.data;
  }
});
