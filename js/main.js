import { loadProfile, saveProfile, resetToOriginal, currentLinks, defaultProfile } from './profile-manager.js';
import { renderLinks, renderLinkEditor } from './link-manager.js';
import { updateThemePreview } from './ui-interactions.js';

const loader = document.getElementById("loader");
const mainContainer = document.getElementById("mainContainer");
const modal = document.getElementById("settingsModal");
const bgColor = document.getElementById("bgColor");
const linkColor = document.getElementById("linkColor");
const cardColor = document.getElementById("cardColor");
const textColor = document.getElementById("textColor");
const linkBoxTextColor = document.getElementById("linkBoxTextColor"); // New link box text color
const displayName = document.getElementById("displayName");
const bioText = document.getElementById("bioText");
const profilePic = document.getElementById("profilePic");
const followerCount = document.getElementById("followerCount");
const previewName = document.getElementById("previewName");
const previewBio = document.getElementById("previewBio");
const previewPic = document.getElementById("previewPic");

function updatePreview() {
  // Update preview with actual profile data
  previewName.textContent = displayName.textContent;
  previewBio.textContent = bioText.textContent;
  previewPic.src = profilePic.src;
  const previewFollowerCount = document.querySelector("#previewContainer .follower-count");
  previewFollowerCount.textContent = followerCount.textContent;

  // Render links and update theme
  renderLinks(currentLinks, document.getElementById("previewLinks"));
  updateThemePreview();
}

function initialize() {
  loadProfile();
  renderLinks(currentLinks, document.getElementById("linksContainer"));
  renderLinkEditor();
  updatePreview();
  // Apply theme settings after loading
  document.documentElement.style.setProperty("--bg-color", bgColor.value);
  document.documentElement.style.setProperty("--link-bg", linkColor.value);
  document.documentElement.style.setProperty("--card-bg", cardColor.value);
  document.documentElement.style.setProperty("--profile-text-color", textColor.value);
  document.documentElement.style.setProperty("--link-box-text-color", linkBoxTextColor.value);
  setTimeout(() => {
    loader.style.display = "none";
    mainContainer.style.display = "block";
  }, 1000);
}

document.querySelectorAll(".save-tab-btn").forEach(button => {
  button.addEventListener("click", () => {
    const updated = {
      name: document.getElementById("editName").value || defaultProfile.name,
      bio: document.getElementById("editBio").value, // Allow blank bio
      links: currentLinks,
      bgColor: bgColor.value,
      linkColor: linkColor.value,
      cardColor: cardColor.value,
      textColor: textColor.value,
      linkBoxTextColor: linkBoxTextColor.value // Save link box text color
    };
    saveProfile(updated);
    // Re-apply theme settings after saving
    document.documentElement.style.setProperty("--bg-color", updated.bgColor);
    document.documentElement.style.setProperty("--link-bg", updated.linkColor);
    document.documentElement.style.setProperty("--card-bg", updated.cardColor);
    document.documentElement.style.setProperty("--profile-text-color", updated.textColor);
    document.documentElement.style.setProperty("--link-box-text-color", updated.linkBoxTextColor);
    initialize();
    modal.style.display = "none";
  });
});

document.querySelectorAll(".discard-tab-btn").forEach(button => {
  button.addEventListener("click", () => {
    resetToOriginal();
    updatePreview();
  });
});

// Update preview when modal is opened
editToggle.addEventListener("click", () => {
  updatePreview();
  modal.style.display = "flex";
});

initialize();
