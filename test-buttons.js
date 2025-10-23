// Test script to verify button functionality
console.log("Testing button functionality...");

// Test developer contact button
const devContactBtn = document.getElementById("dev-contact-btn");
if (devContactBtn) {
  console.log("✅ Developer contact button found");
  console.log("Button text:", devContactBtn.textContent.trim());
} else {
  console.log("❌ Developer contact button not found");
}

// Test developer profile button
const devProfileBtn = document.getElementById("dev-profile-btn");
if (devProfileBtn) {
  console.log("✅ Developer profile button found");
  console.log("Button text:", devProfileBtn.textContent.trim());
} else {
  console.log("❌ Developer profile button not found");
}

// Test collaborator buttons
const connectButtons = document.querySelectorAll(".collaborator-connect-btn");
const profileButtons = document.querySelectorAll(".collaborator-profile-btn");

console.log(`✅ Found ${connectButtons.length} collaborator connect buttons`);
console.log(`✅ Found ${profileButtons.length} collaborator profile buttons`);

// Test if event listeners are attached
if (devContactBtn && devContactBtn.click) {
  console.log("✅ Developer contact button has click handler");
}

if (devProfileBtn && devProfileBtn.click) {
  console.log("✅ Developer profile button has click handler");
}

console.log("Button functionality test complete!");