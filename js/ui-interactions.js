const editToggle = document.getElementById("editToggle");
const modal = document.getElementById("settingsModal");
const closeModal = document.querySelector(".close-modal");
const followBtn = document.getElementById("followBtn");
const followerCount = document.getElementById("followerCount");
const typewriter = document.getElementById("typewriter");
const tabButtons = document.querySelectorAll(".tab-btn");
const tabContents = document.querySelectorAll(".tab-content");
const bgColor = document.getElementById("bgColor");
const linkColor = document.getElementById("linkColor");
const cardColor = document.getElementById("cardColor");
const textColor = document.getElementById("textColor");
const linkBoxTextColor = document.getElementById("linkBoxTextColor"); // New link box text color
const bgColorValue = document.getElementById("bgColorValue");
const linkColorValue = document.getElementById("linkColorValue");
const cardColorValue = document.getElementById("cardColorValue");
const textColorValue = document.getElementById("textColorValue");
const linkBoxTextColorValue = document.getElementById("linkBoxTextColorValue"); // New link box text color value
const previewContainer = document.getElementById("previewContainer");

let followers = parseInt(localStorage.getItem("followers") || "0");
let isFollowing = localStorage.getItem("isFollowing") === "true";
followerCount.textContent = `${followers} followers`;
if (isFollowing) {
  followBtn.classList.add("followed");
  followBtn.textContent = "Unfollow";
}

followBtn.addEventListener("click", () => {
  if (isFollowing) {
    followers--;
    isFollowing = false;
    followBtn.classList.remove("followed");
    followBtn.textContent = "Follow";
  } else {
    followers++;
    isFollowing = true;
    followBtn.classList.add("followed");
    followBtn.textContent = "Unfollow";
  }
  followerCount.textContent = `${followers} followers`;
  localStorage.setItem("followers", followers);
  localStorage.setItem("isFollowing", isFollowing);
  // Update preview follower count
  const previewFollowerCount = document.querySelector("#previewContainer .follower-count");
  previewFollowerCount.textContent = followerCount.textContent;
});

editToggle.addEventListener("click", () => modal.style.display = "flex");

closeModal.addEventListener("click", () => modal.style.display = "none");

let index = 0;
const message = "My socials:";
function type() {
  if (index < message.length) {
    typewriter.innerHTML = message.substring(0, index + 1);
    index++;
    setTimeout(type, 50);
  }
}
setTimeout(type, 1000);

tabButtons.forEach(button => {
  button.addEventListener("click", () => {
    tabButtons.forEach(btn => btn.classList.remove("active"));
    button.classList.add("active");
    tabContents.forEach(content => content.style.display = "none");
    document.getElementById(`${button.dataset.tab}Tab`).style.display = "flex";
  });
});

function updateThemePreview() {
  document.documentElement.style.setProperty("--bg-color", bgColor.value);
  document.documentElement.style.setProperty("--link-bg", linkColor.value);
  document.documentElement.style.setProperty("--card-bg", cardColor.value);
  document.documentElement.style.setProperty("--profile-text-color", textColor.value);
  document.documentElement.style.setProperty("--link-box-text-color", linkBoxTextColor.value);
  previewContainer.style.background = cardColor.value;
  previewContainer.style.color = textColor.value;
  // Update link box text color in preview
  const previewLinks = document.querySelectorAll("#previewLinks a");
  previewLinks.forEach(link => {
    link.style.color = linkBoxTextColor.value;
    const clickCount = link.querySelector(".click-count");
    if (clickCount) clickCount.style.color = linkBoxTextColor.value;
  });
  bgColorValue.textContent = bgColor.value;
  linkColorValue.textContent = linkColor.value;
  cardColorValue.textContent = cardColor.value;
  textColorValue.textContent = textColor.value;
  linkBoxTextColorValue.textContent = linkBoxTextColor.value;
}

bgColor.addEventListener("input", updateThemePreview);
linkColor.addEventListener("input", updateThemePreview);
cardColor.addEventListener("input", updateThemePreview);
textColor.addEventListener("input", updateThemePreview);
linkBoxTextColor.addEventListener("input", updateThemePreview);

document.addEventListener("contextmenu", e => {
  if (!["INPUT", "TEXTAREA"].includes(e.target.tagName)) e.preventDefault();
});

document.addEventListener("keydown", e => {
  const isInput = ["INPUT", "TEXTAREA"].includes(document.activeElement.tagName);
  if ((e.ctrlKey || e.metaKey) && (e.key === "c" || e.key === "v")) {
    if (!isInput) e.preventDefault();
  }
});

export { updateThemePreview };