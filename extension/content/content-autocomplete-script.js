/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

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

document.addEventListener('focus', function(event) {
  const inputElement = event.target;

  if (inputElement.tagName === 'INPUT' && ['text', 'email'].includes(inputElement.type)) {
    showAutocompletePopup(inputElement);
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

function autofill(inputElement, suggestion) {
  inputElement.value = suggestion;
  inputElement.removeAttribute('data-moz-previous-value');
  inputElement.removeAttribute('data-moz-previous-bg-value');
}

// Function to clear preview text (reset preview area or placeholder)
function clearPreview(inputElement) {
  if (inputElement.hasAttribute('data-moz-previous-value')) {
    inputElement.value = inputElement.dataset.mozPreviousValue || '';
    inputElement.style.backgroundColor = inputElement.dataset.mozPreviousBGValue || '';
  }

  // remove mozPreviousValue and mozPreviousBGValue attributes
  inputElement.removeAttribute('data-moz-previous-value');
  inputElement.removeAttribute('data-moz-previous-bg-value');
}

// Function to display preview text (either on the input or a dedicated preview area)
function displayPreview(inputElement, suggestion) {

  inputElement.dataset.mozPreviousValue = inputElement.value;
  inputElement.dataset.mozPreviousBGValue = inputElement.style.backgroundColor;
  inputElement.value = `${suggestion}`;
  inputElement.style.backgroundColor = '#e0f7fa'; // Change input background color
}

function showAutocompletePopup(inputElement) {
  const suggestions = ['user@example.com', 'test@example.com', 'admin@example.com'];

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

      displayPreview(inputElement, suggestion); // Update the preview text (input or preview area)
    });

    // When mouse leaves the item, reset background color
    listItem.addEventListener('mouseleave', function() {
      listItem.style.backgroundColor = ''; // Reset background color

      clearPreview(inputElement);
    });

    listItem.addEventListener('click', function() {
      autofill(inputElement, suggestion);
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
