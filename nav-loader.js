/**
 * Navigation Component Loader for NeoSharX
 * This script loads the standard navigation component into all pages
 */

(function () {
  "use strict";

  // Load navigation HTML
  function loadNavigation() {
    // Support both nav-container and nav-placeholder for backwards compatibility
    const navContainer =
      document.getElementById("nav-container") ||
      document.getElementById("nav-placeholder");

    if (!navContainer) {
      console.warn(
        'Navigation container not found. Make sure to add <div id="nav-container"></div> or <div id="nav-placeholder"></div> to your HTML.'
      );
      return;
    }

    fetch("navigation.html")
      .then((response) => response.text())
      .then((html) => {
        navContainer.innerHTML = html;

        // Execute any scripts in the loaded HTML
        const scripts = navContainer.querySelectorAll("script");
        scripts.forEach((script) => {
          const newScript = document.createElement("script");
          if (script.src) {
            newScript.src = script.src;
          } else {
            newScript.textContent = script.textContent;
          }
          document.body.appendChild(newScript);
        });

        // Execute any styles in the loaded HTML
        const styles = navContainer.querySelectorAll("style");
        styles.forEach((style) => {
          const newStyle = document.createElement("style");
          newStyle.textContent = style.textContent;
          document.head.appendChild(newStyle);
        });

        // Load global-auth.js after navigation is loaded
        const authScript = document.createElement("script");
        authScript.src = "global-auth.js";
        authScript.onload = () =>
          console.log("Global auth loaded successfully");
        authScript.onerror = () =>
          console.error("Failed to load global-auth.js");
        document.head.appendChild(authScript);
      })
      .catch((error) => {
        console.error("Error loading navigation:", error);
      });
  }

  // Load navigation when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadNavigation);
  } else {
    loadNavigation();
  }
})();
