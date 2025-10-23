/**
 * Universal Comment System for NeoSharX - Light Theme Only
 * Fully interactive with admin delete functionality
 * Works across: Talks, Startups, Neo Stories, Projects, SharXathons, RoboSharX, Tech News
 */

class CommentSystem {
  // Utility to update debug panel in UI
  updateDebugPanel(extra = {}) {
    let debugDiv = document.getElementById("comment-debug-panel");
    if (!debugDiv) {
      debugDiv = document.createElement("div");
      debugDiv.id = "comment-debug-panel";
      debugDiv.style =
        "background:#f3f4f6;color:#222;font-size:13px;padding:8px 12px;margin-bottom:8px;border-radius:6px;border:1px solid #ddd;word-break:break-all;";
      const container = document.getElementById(this.containerId);
      if (container) container.prepend(debugDiv);
    }
    const user = this.currentUser;
    debugDiv.innerHTML = `<b>CommentSystem Debug</b><br>
      <b>Token:</b> ${
        this.authToken ? this.authToken.substring(0, 12) + "..." : "None"
      }<br>
      <b>User:</b> ${user ? user.username || user.email || user.id : "None"}<br>
      <b>UserObj:</b> <code>${JSON.stringify(user)}</code><br>
      <b>Extra:</b> <code>${JSON.stringify(extra)}</code>`;
  }
  constructor(contentType, contentSlug, containerId, options = {}) {
    console.log("CommentSystem: Initializing", {
      contentType,
      contentSlug,
      containerId,
    });
    this.contentType = contentType;
    this.contentSlug = contentSlug;
    this.containerId = containerId;
    this.apiBaseUrl = options.apiBaseUrl || "http://localhost:8001/api/auth";
    this.authToken = localStorage.getItem("authToken") || null;
    this.currentUser = JSON.parse(
      localStorage.getItem("currentUser") || "null"
    );

    console.log("CommentSystem: Initial auth state", {
      hasToken: !!this.authToken,
      hasUser: !!this.currentUser,
      user: this.currentUser,
    });
    this.comments = [];
    this.isLoading = false;
    this.options = {
      showLoginPrompt: true,
      enableReplies: true,
      enableLikes: true,
      enableFlags: true,
      maxDepth: 3,
      ...options,
    };

    console.log("=== COMMENT SYSTEM INITIALIZED ===");
    console.log("Content Type:", this.contentType);
    console.log("Content Slug:", this.contentSlug);
    console.log("API Base URL:", this.apiBaseUrl);
    console.log("Auth Token:", this.authToken ? "Present ✓" : "Missing ✗");
    console.log(
      "Current User:",
      this.currentUser
        ? this.currentUser.username || this.currentUser.email
        : "Not logged in"
    );
    console.log("==================================");

    this.init();
    // Force auth refresh on page load
    setTimeout(() => {
      this.refreshAuth();
    }, 100);
  }

  init() {
    this.renderContainer();
    this.loadComments();
    this.bindEvents();

    // Listen for auth state changes
    document.addEventListener("authStateChanged", (e) => {
      console.log("CommentSystem: Auth state changed", e.detail);
      this.refreshAuth();
    });

    // Listen for storage changes (for cross-tab auth updates)
    window.addEventListener("storage", (e) => {
      if (e.key === "authToken" || e.key === "currentUser") {
        console.log("CommentSystem: Storage changed, refreshing auth");
        this.refreshAuth();
      }
    });

    // Check auth state on page load
    setTimeout(() => {
      const currentAuth = localStorage.getItem("authToken");
      const currentUserStr = localStorage.getItem("currentUser");
      if (currentAuth && currentUserStr && !this.currentUser) {
        console.log("CommentSystem: Auth detected on load, refreshing");
        this.refreshAuth();
      }
    }, 500);
  }

  // Refresh authentication state
  refreshAuth() {
    const prevToken = this.authToken;
    const prevUser = this.currentUser;

    this.authToken = localStorage.getItem("authToken") || null;
    this.currentUser = JSON.parse(
      localStorage.getItem("currentUser") || "null"
    );

    console.log("=== COMMENT SYSTEM: REFRESHING AUTH ===");
    console.log("Previous Auth:", prevToken ? "Had token" : "No token");
    console.log("Current Auth:", this.authToken ? "Has token ✓" : "No token ✗");
    console.log(
      "Previous User:",
      prevUser ? prevUser.username || prevUser.email : "Not logged in"
    );
    console.log(
      "Current User:",
      this.currentUser
        ? this.currentUser.username || this.currentUser.email
        : "Not logged in"
    );
    console.log(
      "Auth Changed:",
      !!prevToken !== !!this.authToken ? "YES" : "NO"
    );
    console.log("========================================");

    this.updateDebugPanel();

    const formContainer = document.getElementById("comment-form-container");
    if (formContainer) {
      console.log("Re-rendering comment form...");
      formContainer.innerHTML = this.renderCommentForm();
      this.bindCommentFormEvents();
    } else {
      console.warn("Comment form container not found!");
    }

    // Re-render comments to show appropriate actions
    if (this.comments && this.comments.length > 0) {
      console.log("Re-rendering comments...");
      this.renderComments();
    }
  }

  renderContainer() {
    const container = document.getElementById(this.containerId);
    if (!container) {
      console.error(`Comment container ${this.containerId} not found`);
      return;
    }

    container.innerHTML = `
            <style>
                .comments-section {
                    max-width: 1200px;
                    margin: 0 auto;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                }
                .comments-header h3 {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: #000000;
                    margin-bottom: 1.5rem;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                #comment-count {
                    font-size: 1rem;
                    font-weight: 400;
                    color: #666666;
                }
                .comment-form-login {
        background: #f9f9f9;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        padding: 1.5rem 2rem;
        margin-bottom: 1.5rem;
        color: #0f0f0f;
        display: flex;
        align-items: center;
        gap: 1rem;
        font-family: 'Roboto', 'Inter', sans-serif;
        font-size: 0.95rem;
        transition: background-color 0.2s;
                }
                .comment-form-login:hover {
                    background: #f0f0f0;
                }
                .comment-form-login a {
          color: #065fd4;
          font-weight: 500;
          text-decoration: none;
        }
        .comment-form-login a:hover {
          text-decoration: underline;
        }
                }
                .comment-form {
                    background: #ffffff;
                    border: 1px solid #e5e7eb;
                    border-radius: 8px;
                    padding: 1rem;
                    margin-bottom: 1.5rem;
                    transition: border-color 0.2s ease;
                }
                .comment-form:hover {
                    border-color: #d1d5db;
                }
                .comment-form textarea {
                    width: 100%;
                    padding: 0.75rem;
                    border: 1px solid #e5e7eb;
                    border-radius: 4px;
                    background: #ffffff;
                    color: #0f0f0f;
                    font-size: 0.95rem;
                    resize: none;
                    font-family: 'Roboto', 'Inter', sans-serif;
                    transition: border-color 0.2s ease;
                }
                .comment-form textarea:focus {
                    outline: none;
                    border-color: #9ca3af;
                    box-shadow: 0 0 0 1px #9ca3af;
                }
                .user-avatar {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    background: #f3f3f3;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #606060;
                    font-weight: 500;
                    font-size: 0.9rem;
                    flex-shrink: 0;
                }
                .comment {
                    margin-bottom: 1.5rem;
                    animation: slideIn 0.3s ease;
                    padding: 1rem 0;
                    border-bottom: 1px solid #f0f0f0;
                }
                .comment:last-child {
                    border-bottom: none;
                }
                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .comment-box {
                    background: transparent;
                    border: none;
                    border-radius: 0;
                    padding: 0.5rem 0;
                    transition: background-color 0.1s ease;
                }
                .comment-box:hover {
                    background: #f9f9f9;
                }
                .comment-reply {
                    margin-top: 1rem;
                }
                .comment-reply .comment-box {
                    background: transparent;
                    padding: 0;
                }
                .replies {
                    margin-top: 1rem;
                    margin-left: 40px;
                    padding-left: 1rem;
                }
                .replies-toggle {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    margin-top: 0.75rem;
                    padding: 0.5rem 1rem;
                    background: transparent;
                    color: #065fd4;
                    font-weight: 600;
                    font-size: 0.875rem;
                    border: none;
                    border-radius: 20px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                .replies-toggle:hover {
                    background: #def1ff;
                }
                .replies-toggle svg {
                    width: 1rem;
                    height: 1rem;
                    transition: transform 0.2s ease;
                }
                .replies-toggle.expanded svg {
                    transform: rotate(180deg);
                }
                .replies.hidden {
                    display: none;
                }
                .comment-header {
                    display: flex;
                    align-items: flex-start;
                    gap: 1rem;
                    margin-bottom: 0.5rem;
                }
                .comment-author {
                    font-weight: 500;
                    color: #0f0f0f;
                    font-size: 0.8125rem;
                }
                .comment-time {
                    font-size: 0.75rem;
                    color: #606060;
                    margin-left: 0.25rem;
                }
                .comment-badge {
                    font-size: 0.75rem;
                    background: #ffcccc;
                    color: #cc0000;
                    padding: 0.25rem 0.5rem;
                    border-radius: 4px;
                    font-weight: 600;
                }
                .admin-badge {
                    background: #cce7ff;
                    color: #0056b3;
                }
                                .comment-text {
                    color: #030303;
                    line-height: 1.5;
                    margin-bottom: 0.75rem;
                    margin-left: 48px;
                    word-wrap: break-word;
                    font-size: 0.875rem;
                }
                .comment-actions {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    margin-left: 48px;
                }
                .action-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.375rem;
                    padding: 0.5rem 0.75rem;
                    border: none;
                    background: transparent;
                    color: #606060;
                    font-size: 0.75rem;
                    font-weight: 500;
                    cursor: pointer;
                    border-radius: 18px;
                    transition: all 0.2s ease;
                }
                .action-btn:hover {
                    background: #f2f2f2;
                    color: #030303;
                }
                .action-btn svg {
                    width: 1rem;
                    height: 1rem;
                }
                .like-btn.active {
                    color: #0f0f0f;
                    font-weight: 600;
                }
                .dislike-btn.active {
                    color: #0f0f0f;
                    font-weight: 600;
                }
                .reply-btn {
                    color: #0f0f0f;
                    font-weight: 600;
                }
                .reply-btn:hover {
                    background: #f2f2f2;
                    color: #0f0f0f;
                }
                .delete-btn {
                    color: #cc0000;
                }
                .delete-btn:hover {
                    background: #ffe6e6;
                    color: #990000;
                }
                .flag-btn {
                    color: #ff9900;
                }
                .flag-btn:hover {
                    background: #fff5e6;
                    color: #cc7a00;
                }
                .submit-btn {
                    padding: 0.5rem 1rem;
                    background: #065fd4;
                    color: white;
                    border: none;
                    border-radius: 18px;
                    font-weight: 500;
                    font-size: 0.85rem;
                    cursor: pointer;
                    transition: background-color 0.2s ease;
                }
                .submit-btn:hover:not(:disabled) {
                    background: #0d7df7;
                }
                .submit-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }
                .cancel-btn {
                    padding: 0.625rem 1.5rem;
                    background: #ffffff;
                    color: #666666;
                    border: 1px solid #cccccc;
                    border-radius: 8px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                .cancel-btn:hover {
                    background: #f8f9fa;
                    border-color: #999999;
                    color: #000000;
                }
                .reply-form {
                    background: #f9fafb;
                    border: 1px solid #e5e7eb;
                    border-radius: 8px;
                    padding: 1rem;
                    margin-top: 0.75rem;
                }
                .loading-spinner {
                    display: inline-block;
                    width: 1.25rem;
                    height: 1.25rem;
                    border: 2px solid #e5e7eb;
                    border-top-color: #3b82f6;
                    border-radius: 50%;
                    animation: spin 0.6s linear infinite;
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                .alert {
                    position: fixed;
                    top: 1.5rem;
                    right: 1.5rem;
                    z-index: 9999;
                    max-width: 400px;
                    padding: 1rem 1.25rem;
                    border-radius: 8px;
                    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
                    animation: slideInRight 0.3s ease;
                }
                @keyframes slideInRight {
                    from {
                        opacity: 0;
                        transform: translateX(100px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
                .alert-success {
                    background: #ecfdf5;
                    color: #047857;
                    border: 1px solid #a7f3d0;
                }
                .alert-error {
                    background: #fef2f2;
                    color: #dc2626;
                    border: 1px solid #fecaca;
                }
                .alert-warning {
                    background: #fffbeb;
                    color: #d97706;
                    border: 1px solid #fde68a;
                }
                .alert-info {
                    background: #eff6ff;
                    color: #2563eb;
                    border: 1px solid #bfdbfe;
                }
                .load-more-btn {
                    padding: 0.75rem 2rem;
                    background: white;
                    color: #3b82f6;
                    border: 2px solid #3b82f6;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }
                .load-more-btn:hover {
                    background: #3b82f6;
                    color: white;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
                }
                .empty-state {
                    text-align: center;
                    padding: 3rem 1rem;
                    color: #6b7280;
                }
                .empty-state svg {
                    width: 4rem;
                    height: 4rem;
                    margin: 0 auto 1rem;
                    opacity: 0.5;
                }
            </style>
            
            <div class="comments-section">
                <div class="comments-header">
                    <h3>
                        Comments
                        <span id="comment-count">(Loading...)</span>
                    </h3>
                </div>
                
                <div id="comment-form-container">
                    ${this.renderCommentForm()}
                </div>
                
                <div id="comments-list" class="mt-6">
                    ${this.renderLoadingState()}
                </div>
                
                <div id="load-more-container" style="display: none; text-align: center; margin-top: 1.5rem;">
                    <button id="load-more-btn" class="load-more-btn">
                        Load More Comments
                    </button>
                </div>
            </div>
        `;
  }

  renderCommentForm() {
    if (!this.currentUser) {
      return `
        <div class="comment-form-login" aria-label="Login required to comment">
          <svg style="min-width:2.5rem; height:2.5rem; margin-right:0.5rem; background:rgba(255,255,255,0.12); border-radius:50%; padding:0.3rem;" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clip-rule="evenodd"></path>
          </svg>
          <div>
            <p style="font-size:1.15rem; font-weight:700; margin-bottom:0.25rem; color:#fff;">Join the conversation!</p>
            <p style="font-size:1rem; opacity:0.98; color:#f3f7ff; font-weight:500;">Please <a href="login.html">login</a> to post comments and interact with the community.</p>
          </div>
        </div>
      `;
    }

    return `
            <div class="comment-form">
                <div style="display: flex; gap: 1rem;">
                    <div class="user-avatar">
                        ${this.getInitials(
                          this.currentUser.username || this.currentUser.email
                        )}
                    </div>
                    <div style="flex: 1;">
                        <form id="comment-form">
                            <textarea 
                                id="comment-text" 
                                placeholder="Share your thoughts... 💭" 
                                rows="3"
                                maxlength="1000"
                            ></textarea>
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.75rem;">
                                <span style="font-size: 0.85rem; color: #6b7280;">
                                    <span id="char-count">0</span>/1000 characters
                                </span>
                                <button type="submit" id="submit-comment" class="submit-btn">
                                    Post Comment
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
  }

  renderLoadingState() {
    return `
            <div style="text-align: center; padding: 3rem 1rem;">
                <div class="loading-spinner" style="margin: 0 auto 1rem;"></div>
                <p style="color: #6b7280;">Loading comments...</p>
            </div>
        `;
  }

  renderComment(comment, level = 0) {
    const isOwner = this.currentUser && comment.user === this.currentUser.id;
    const canDelete = comment.can_delete;
    const timeAgo = this.formatTimeAgo(comment.created_at);
    const isAdmin = comment.user_is_staff || comment.user_is_superuser;

    return `
            <div class="comment ${
              level > 0 ? "comment-reply" : ""
            }" data-comment-id="${comment.id}">
                <div class="comment-box" style="display: flex; gap: 12px;">
                    <div class="user-avatar" style="width: 40px; height: 40px; font-size: 0.875rem; flex-shrink: 0;">
                        ${this.getInitials(comment.user_name)}
                    </div>
                    <div style="flex: 1; min-width: 0;">
                        <div class="comment-header" style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
                            <span class="comment-author">${
                              comment.user_name
                            }</span>
                            ${
                              isAdmin
                                ? '<span class="comment-badge admin-badge">Admin</span>'
                                : ""
                            }
                            <span class="comment-time">${timeAgo}</span>
                            ${
                              comment.is_flagged
                                ? '<span class="comment-badge">Flagged</span>'
                                : ""
                            }
                        </div>
                        
                        <div class="comment-text" style="margin-left: 0; margin-bottom: 0.5rem;">
                            ${this.formatCommentText(comment.text)}
                        </div>
                        
                        <div class="comment-actions" style="margin-left: 0;">
                        ${this.renderLikeButtons(comment)}
                        
                        ${
                          this.options.enableReplies &&
                          level < this.options.maxDepth
                            ? `
                            <button class="action-btn reply-btn" data-comment-id="${comment.id}">
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"></path>
                                </svg>
                                Reply
                            </button>
                        `
                            : ""
                        }
                        
                        ${
                          canDelete
                            ? `
                            <button class="action-btn delete-btn" data-comment-id="${comment.id}">
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                </svg>
                                Delete
                            </button>
                        `
                            : ""
                        }
                        
                        ${
                          this.currentUser &&
                          !isOwner &&
                          this.options.enableFlags
                            ? `
                            <button class="action-btn flag-btn" data-comment-id="${comment.id}">
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"></path>
                                </svg>
                                Flag
                            </button>
                        `
                            : ""
                        }
                        </div>
                        
                        <div id="reply-form-${
                          comment.id
                        }" class="reply-form" style="display: none;">
                            ${this.renderReplyForm(comment.id)}
                        </div>
                    </div>
                </div>
                
                ${
                  comment.replies && comment.replies.length > 0 && level === 0
                    ? `
                    <button class="replies-toggle" data-comment-id="${
                      comment.id
                    }" data-reply-count="${comment.replies.length}">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                        </svg>
                        <span>${comment.replies.length} ${
                        comment.replies.length === 1 ? "reply" : "replies"
                      }</span>
                    </button>
                `
                    : ""
                }
                
                <div class="replies${
                  level === 0 ? " hidden" : ""
                }" id="replies-${comment.id}">
                    ${
                      comment.replies
                        ? comment.replies
                            .map((reply) =>
                              this.renderComment(reply, level + 1)
                            )
                            .join("")
                        : ""
                    }
                </div>
            </div>
        `;
  }

  renderLikeButtons(comment) {
    if (!this.options.enableLikes) return "";

    const userReaction = comment.user_reaction;
    const likeActive = userReaction === "like" ? "active" : "";
    const dislikeActive = userReaction === "dislike" ? "active" : "";

    return `
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <button class="action-btn like-btn ${likeActive}" data-comment-id="${
      comment.id
    }" data-reaction="like">
                    <svg fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z"></path>
                    </svg>
                    <span>${comment.likes_count || 0}</span>
                </button>
                <button class="action-btn dislike-btn ${dislikeActive}" data-comment-id="${
      comment.id
    }" data-reaction="dislike">
                    <svg fill="currentColor" viewBox="0 0 20 20" style="transform: rotate(180deg);">
                        <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z"></path>
                    </svg>
                    <span>${comment.dislikes_count || 0}</span>
                </button>
            </div>
        `;
  }

  renderReplyForm(parentId) {
    if (!this.currentUser) return "";

    return `
            <div style="display: flex; gap: 0.75rem;">
                <div class="user-avatar" style="width: 28px; height: 28px; font-size: 0.7rem;">
                    ${this.getInitials(
                      this.currentUser.username || this.currentUser.email
                    )}
                </div>
                <div style="flex: 1;">
                    <form class="reply-form-inner" data-parent-id="${parentId}">
                        <textarea 
                            placeholder="Write a reply... " 
                            rows="2"
                            maxlength="500"
                            style="width: 100%; padding: 0.625rem; border: 1px solid #d1d5db; border-radius: 6px; background: white; font-size: 0.9rem; resize: none;"
                        ></textarea>
                        <div style="display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 0.5rem;">
                            <button type="button" class="cancel-reply cancel-btn">
                                Cancel
                            </button>
                            <button type="submit" class="submit-btn">
                                Reply
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
  }

  bindEvents() {
    const container = document.getElementById(this.containerId);

    // Comment form submission
    container.addEventListener("submit", (e) => {
      if (e.target.id === "comment-form") {
        e.preventDefault();
        this.submitComment();
      } else if (e.target.classList.contains("reply-form-inner")) {
        e.preventDefault();
        this.submitReply(e.target);
      }
    });

    // Character count for main comment form
    const commentText = container.querySelector("#comment-text");
    if (commentText) {
      commentText.addEventListener("input", (e) => {
        const charCount = container.querySelector("#char-count");
        if (charCount) {
          charCount.textContent = e.target.value.length;
        }
      });
    }

    // Event delegation for dynamic elements
    container.addEventListener("click", (e) => {
      if (
        e.target.classList.contains("like-btn") ||
        e.target.closest(".like-btn")
      ) {
        const btn = e.target.classList.contains("like-btn")
          ? e.target
          : e.target.closest(".like-btn");
        this.toggleLike(btn.dataset.commentId, btn.dataset.reaction);
      } else if (
        e.target.classList.contains("dislike-btn") ||
        e.target.closest(".dislike-btn")
      ) {
        const btn = e.target.classList.contains("dislike-btn")
          ? e.target
          : e.target.closest(".dislike-btn");
        this.toggleLike(btn.dataset.commentId, btn.dataset.reaction);
      } else if (
        e.target.classList.contains("reply-btn") ||
        e.target.closest(".reply-btn")
      ) {
        const btn = e.target.classList.contains("reply-btn")
          ? e.target
          : e.target.closest(".reply-btn");
        this.showReplyForm(btn.dataset.commentId);
      } else if (e.target.classList.contains("cancel-reply")) {
        this.hideReplyForm(e.target);
      } else if (
        e.target.classList.contains("delete-btn") ||
        e.target.closest(".delete-btn")
      ) {
        const btn = e.target.classList.contains("delete-btn")
          ? e.target
          : e.target.closest(".delete-btn");
        this.deleteComment(btn.dataset.commentId);
      } else if (
        e.target.classList.contains("flag-btn") ||
        e.target.closest(".flag-btn")
      ) {
        const btn = e.target.classList.contains("flag-btn")
          ? e.target
          : e.target.closest(".flag-btn");
        this.flagComment(btn.dataset.commentId);
      } else if (
        e.target.classList.contains("replies-toggle") ||
        e.target.closest(".replies-toggle")
      ) {
        const btn = e.target.classList.contains("replies-toggle")
          ? e.target
          : e.target.closest(".replies-toggle");
        this.toggleReplies(btn.dataset.commentId, btn);
      } else if (e.target.id === "load-more-btn") {
        this.loadMoreComments();
      }
    });
  }

  bindCommentFormEvents() {
    const container = document.getElementById(this.containerId);
    const commentText = container.querySelector("#comment-text");
    if (commentText) {
      commentText.addEventListener("input", (e) => {
        const charCount = container.querySelector("#char-count");
        if (charCount) {
          charCount.textContent = e.target.value.length;
        }
      });
    }
  }

  async loadComments(offset = 0) {
    if (this.isLoading) return;

    this.isLoading = true;
    const commentsContainer = document.getElementById("comments-list");

    if (offset === 0) {
      commentsContainer.innerHTML = this.renderLoadingState();
    }

    try {
      const url = `${this.apiBaseUrl}/comments/?content_type=${this.contentType}&content_slug=${this.contentSlug}&limit=10&offset=${offset}`;
      console.log("CommentSystem: Loading comments from URL:", url);
      const response = await fetch(url, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (offset === 0) {
        this.comments = data.results;
        this.renderComments();
      } else {
        this.comments = [...this.comments, ...data.results];
        this.renderComments();
      }

      this.updateCommentCount(data.count);
      this.updateLoadMoreButton(data.count, offset + data.results.length);
    } catch (error) {
      console.error("Error loading comments:", error);
      if (offset === 0) {
        commentsContainer.innerHTML = `
                    <div class="empty-state">
                        <p style="color: #ef4444; font-weight: 600;">Failed to load comments</p>
                        <button onclick="location.reload()" class="submit-btn" style="margin-top: 1rem;">
                            Retry
                        </button>
                    </div>
                `;
      }
    } finally {
      this.isLoading = false;
    }
  }

  renderComments() {
    const commentsContainer = document.getElementById("comments-list");

    if (this.comments.length === 0) {
      commentsContainer.innerHTML = `
                <div class="empty-state">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                    </svg>
                    <p style="font-size: 1.1rem; font-weight: 500; margin-bottom: 0.5rem;">No comments yet</p>
                    <p style="font-size: 0.9rem;">Be the first to share your thoughts! 💡</p>
                </div>
            `;
    } else {
      commentsContainer.innerHTML = this.comments
        .map((comment) => this.renderComment(comment))
        .join("");
    }
  }

  async submitComment() {
    console.log("CommentSystem: submitComment called");
    const commentText = document.getElementById("comment-text");
    const submitBtn = document.getElementById("submit-comment");

    // Always refresh auth before checking
    this.refreshAuth();
    const debugInfo = {
      hasToken: !!this.authToken,
      hasUser: !!this.currentUser,
      user: this.currentUser,
      token: this.authToken,
    };
    console.log("CommentSystem: Auth check (after refresh)", debugInfo);
    this.updateDebugPanel({ submitComment: debugInfo });

    if (!this.currentUser || !this.authToken) {
      console.log("CommentSystem: Auth check failed, showing login prompt");
      this.updateDebugPanel({ error: "Not logged in" });
      this.showAlert("Please log in to post comments", "warning");
      return;
    }

    if (!commentText.value.trim()) {
      this.showAlert("Please enter a comment", "warning");
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="loading-spinner"></span> Posting...';

    try {
      const response = await fetch(`${this.apiBaseUrl}/comments/`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          content_type: this.contentType,
          content_slug: this.contentSlug,
          text: commentText.value.trim(),
        }),
      });

      let debugResult = {
        status: response.status,
        statusText: response.statusText,
      };
      if (!response.ok) {
        const errorData = await response.json();
        debugResult.error = errorData;
        this.updateDebugPanel({ postResult: debugResult });
        if (response.status === 401 || response.status === 403) {
          this.showAlert("Please log in to post comments", "warning");
          this.refreshAuth();
          return;
        }
        throw new Error(
          errorData.error || errorData.detail || "Failed to post comment"
        );
      }

      const newComment = await response.json();
      debugResult.success = true;
      this.updateDebugPanel({ postResult: debugResult });

      // Add new comment to the beginning
      this.comments.unshift(newComment);
      this.renderComments();
      this.updateCommentCount(this.comments.length);

      // Clear form
      commentText.value = "";
      document.getElementById("char-count").textContent = "0";

      this.showAlert("Comment posted successfully! 🎉", "success");
    } catch (error) {
      console.error("Error posting comment:", error);
      this.updateDebugPanel({ error: error.message });
      this.showAlert(error.message, "error");
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = "Post Comment";
    }
  }

  async submitReply(form) {
    const textarea = form.querySelector("textarea");
    const submitBtn = form.querySelector('button[type="submit"]');
    const parentId = form.dataset.parentId;

    if (!textarea.value.trim()) {
      this.showAlert("Please enter a reply", "warning");
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="loading-spinner"></span> Posting...';

    try {
      const response = await fetch(`${this.apiBaseUrl}/comments/`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          content_type: this.contentType,
          content_slug: this.contentSlug,
          text: textarea.value.trim(),
          parent: parseInt(parentId),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to post reply");
      }

      const newReply = await response.json();

      // Find parent and add reply
      const parentComment = this.findCommentById(
        this.comments,
        parseInt(parentId)
      );
      if (parentComment) {
        if (!parentComment.replies) {
          parentComment.replies = [];
        }
        parentComment.replies.push(newReply);
        parentComment.reply_count = (parentComment.reply_count || 0) + 1;
      }

      this.renderComments();
      this.hideReplyForm(form.querySelector(".cancel-reply"));

      this.showAlert("Reply posted successfully! ", "success");
    } catch (error) {
      console.error("Error posting reply:", error);
      this.showAlert(error.message, "error");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Reply";
    }
  }

  async toggleLike(commentId, reaction) {
    if (!this.currentUser) {
      this.showAlert("Please login to like comments", "warning");
      return;
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/comments/like/`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          comment_id: parseInt(commentId),
          reaction: reaction,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update reaction");
      }

      const data = await response.json();

      // Update local state
      const comment = this.findCommentById(this.comments, parseInt(commentId));
      if (comment) {
        comment.likes_count = data.likes_count;
        comment.dislikes_count = data.dislikes_count;
        comment.user_reaction = data.user_reaction;
      }

      this.renderComments();
    } catch (error) {
      console.error("Error toggling like:", error);
      this.showAlert(error.message, "error");
    }
  }

  async deleteComment(commentId) {
    if (
      !confirm(
        "Are you sure you want to delete this comment? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const response = await fetch(
        `${this.apiBaseUrl}/comments/${commentId}/`,
        {
          method: "DELETE",
          headers: this.getHeaders(),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete comment");
      }

      // Remove from local state
      this.removeCommentById(this.comments, parseInt(commentId));
      this.renderComments();
      this.updateCommentCount(this.comments.length);

      this.showAlert("Comment deleted successfully 🗑️", "success");
    } catch (error) {
      console.error("Error deleting comment:", error);
      this.showAlert(error.message, "error");
    }
  }

  async flagComment(commentId) {
    const reason = prompt(
      "Please specify the reason for flagging this comment:"
    );
    if (!reason) return;

    try {
      const response = await fetch(
        `${this.apiBaseUrl}/comments/${commentId}/flag/`,
        {
          method: "POST",
          headers: this.getHeaders(),
          body: JSON.stringify({ reason }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to flag comment");
      }

      this.showAlert("Comment flagged for review 🚩", "success");
    } catch (error) {
      console.error("Error flagging comment:", error);
      this.showAlert(error.message, "error");
    }
  }

  showReplyForm(commentId) {
    // Hide all reply forms
    document.querySelectorAll(".reply-form").forEach((form) => {
      form.style.display = "none";
    });

    // Show specific reply form
    const replyForm = document.getElementById(`reply-form-${commentId}`);
    if (replyForm) {
      replyForm.style.display = "block";
      replyForm.querySelector("textarea").focus();
    }
  }

  hideReplyForm(cancelBtn) {
    const replyForm = cancelBtn.closest(".reply-form");
    if (replyForm) {
      replyForm.style.display = "none";
      replyForm.querySelector("textarea").value = "";
    }
  }

  toggleReplies(commentId, toggleBtn) {
    const repliesContainer = document.getElementById(`replies-${commentId}`);
    const replyCount = toggleBtn.dataset.replyCount;

    if (repliesContainer) {
      const isHidden = repliesContainer.classList.contains("hidden");

      if (isHidden) {
        // Show replies
        repliesContainer.classList.remove("hidden");
        toggleBtn.classList.add("expanded");
        toggleBtn.querySelector("span").textContent = `Hide ${replyCount} ${
          replyCount === "1" ? "reply" : "replies"
        }`;
      } else {
        // Hide replies
        repliesContainer.classList.add("hidden");
        toggleBtn.classList.remove("expanded");
        toggleBtn.querySelector("span").textContent = `${replyCount} ${
          replyCount === "1" ? "reply" : "replies"
        }`;
      }
    }
  }

  updateCommentCount(count) {
    const commentCount = document.getElementById("comment-count");
    if (commentCount) {
      commentCount.textContent = `(${count})`;
    }
  }

  updateLoadMoreButton(totalCount, loadedCount) {
    const loadMoreContainer = document.getElementById("load-more-container");
    if (loadMoreContainer) {
      loadMoreContainer.style.display =
        loadedCount < totalCount ? "block" : "none";
    }
  }

  loadMoreComments() {
    this.loadComments(this.comments.length);
  }

  // Utility methods
  getHeaders() {
    const headers = {
      "Content-Type": "application/json",
    };

    if (this.authToken) {
      headers["Authorization"] = `Token ${this.authToken}`;
    }

    return headers;
  }

  getInitials(name) {
    if (!name) return "?";
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  }

  formatTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return "just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000)
      return `${Math.floor(diffInSeconds / 86400)}d ago`;

    return date.toLocaleDateString();
  }

  formatCommentText(text) {
    return text.replace(/\n/g, "<br>");
  }

  findCommentById(comments, id) {
    for (const comment of comments) {
      if (comment.id === id) return comment;
      if (comment.replies) {
        const found = this.findCommentById(comment.replies, id);
        if (found) return found;
      }
    }
    return null;
  }

  removeCommentById(comments, id) {
    for (let i = 0; i < comments.length; i++) {
      if (comments[i].id === id) {
        comments.splice(i, 1);
        return true;
      }
      if (comments[i].replies) {
        if (this.removeCommentById(comments[i].replies, id)) {
          comments[i].reply_count = Math.max(
            0,
            (comments[i].reply_count || 0) - 1
          );
          return true;
        }
      }
    }
    return false;
  }

  showAlert(message, type = "info") {
    const alertColors = {
      success: "alert-success",
      error: "alert-error",
      warning: "alert-warning",
      info: "alert-info",
    };

    const alert = document.createElement("div");
    alert.className = `alert ${alertColors[type]}`;
    alert.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 1rem;">
                <span style="font-weight: 500;">${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; cursor: pointer; padding: 0.25rem; opacity: 0.7; transition: opacity 0.2s;">
                    <svg style="width: 1.25rem; height: 1.25rem;" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                    </svg>
                </button>
            </div>
        `;

    document.body.appendChild(alert);

    setTimeout(() => {
      if (alert.parentElement) {
        alert.remove();
      }
    }, 5000);
  }
}

// Make CommentSystem available globally
window.CommentSystem = CommentSystem;
