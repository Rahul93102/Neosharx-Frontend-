/**
 * YouTube-Style Comment System for NeoSharX
 * Professional, Responsive, Clean Design
 */

class CommentSystem {
  constructor(contentType, contentSlug, containerId, options = {}) {
    this.contentType = contentType;
    this.contentSlug = contentSlug;
    this.containerId = containerId;
    this.apiBaseUrl = options.apiBaseUrl || "http://localhost:8001/api/auth";
    this.authToken = localStorage.getItem("authToken") || null;
    this.currentUser = JSON.parse(
      localStorage.getItem("currentUser") || "null"
    );
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

    console.log("=== YOUTUBE-STYLE COMMENT SYSTEM INITIALIZED ===");
    console.log("Content Type:", this.contentType);
    console.log("Content Slug:", this.contentSlug);
    console.log("API Base URL:", this.apiBaseUrl);
    console.log("Auth Token:", this.authToken ? "Present ✓" : "Missing ✗");
    console.log("Current User:", this.currentUser ? this.currentUser.username || this.currentUser.email : "Not logged in");
    console.log("===============================================");

    this.init();
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
    console.log("Previous User:", prevUser ? prevUser.username || prevUser.email : "Not logged in");
    console.log("Current User:", this.currentUser ? this.currentUser.username || this.currentUser.email : "Not logged in");
    console.log("Auth Changed:", (!!prevToken !== !!this.authToken) ? "YES" : "NO");
    console.log("========================================");

    // Re-render the comment form with updated auth state
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
                /* YouTube-Style Comment Section - Professional & Responsive */
                * {
                    box-sizing: border-box;
                }
                
                .yt-comments-section {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 24px 16px;
                    font-family: "Roboto", "Arial", sans-serif;
                    background: #fff;
                }
                
                .yt-comments-header {
                    margin-bottom: 24px;
                }
                
                .yt-comments-header h3 {
                    font-size: 20px;
                    font-weight: 400;
                    color: #030303;
                    margin: 0;
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    line-height: 28px;
                }
                
                #comment-count {
                    font-size: 16px;
                    color: #0f0f0f;
                    font-weight: 400;
                }

                /* Comment Form - YouTube Style */
                .yt-comment-form-wrapper {
                    display: flex;
                    gap: 16px;
                    margin-bottom: 32px;
                    align-items: start;
                }
                
                .yt-comment-form-login {
                    background: #f2f2f2;
                    padding: 16px 20px;
                    border-radius: 12px;
                    margin-bottom: 32px;
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }
                
                .yt-comment-form-login a {
                    color: #065fd4;
                    text-decoration: none;
                    font-weight: 500;
                    transition: color 0.1s;
                }
                
                .yt-comment-form-login a:hover {
                    color: #0448ad;
                }

                /* User Avatar - YouTube Style */
                .yt-avatar {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    background: #065fd4;
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 500;
                    font-size: 16px;
                    flex-shrink: 0;
                    text-transform: uppercase;
                }

                .yt-avatar-small {
                    width: 24px;
                    height: 24px;
                    font-size: 12px;
                }

                /* Textarea - YouTube Style */
                .yt-comment-input-wrapper {
                    flex: 1;
                }

                .yt-comment-input {
                    width: 100%;
                    padding: 2px 0;
                    border: none;
                    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
                    font-family: "Roboto", "Arial", sans-serif;
                    font-size: 14px;
                    line-height: 20px;
                    resize: none;
                    background: transparent;
                    transition: border-bottom 0.1s;
                    color: #0f0f0f;
                }
                
                .yt-comment-input:focus {
                    outline: none;
                    border-bottom: 2px solid #065fd4;
                }
                
                .yt-comment-input:focus + .yt-comment-form-actions {
                    opacity: 1;
                    visibility: visible;
                    max-height: 50px;
                    margin-top: 8px;
                }

                .yt-comment-input::placeholder {
                    color: #606060;
                }

                /* Form Actions */
                .yt-comment-form-actions {
                    display: flex;
                    justify-content: flex-end;
                    align-items: center;
                    gap: 8px;
                    margin-top: 8px;
                    opacity: 0;
                    visibility: hidden;
                    max-height: 0;
                    transition: all 0.2s;
                }

                .yt-comment-form-actions.active {
                    opacity: 1;
                    visibility: visible;
                    max-height: 50px;
                }

                .yt-btn {
                    padding: 10px 16px;
                    border: none;
                    border-radius: 18px;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.1s;
                    font-family: "Roboto", "Arial", sans-serif;
                }

                .yt-btn-cancel {
                    background: transparent;
                    color: #606060;
                }

                .yt-btn-cancel:hover {
                    background: rgba(0, 0, 0, 0.05);
                }

                /* Submit Button - YouTube Style */
                .yt-btn-submit {
                    background: #065fd4;
                    color: white;
                }
                
                .yt-btn-submit:hover {
                    background: #0448ad;
                }
                
                .yt-btn-submit:disabled {
                    background: rgba(0, 0, 0, 0.05);
                    color: rgba(0, 0, 0, 0.26);
                    cursor: not-allowed;
                }

                /* Comment Item - YouTube Style */
                .yt-comment {
                    display: flex;
                    gap: 16px;
                    margin-bottom: 16px;
                    padding: 12px 0;
                }

                .yt-comment-content {
                    flex: 1;
                    min-width: 0;
                }
                
                .yt-comment-header {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 4px;
                    flex-wrap: wrap;
                }
                
                .yt-comment-author {
                    font-size: 13px;
                    font-weight: 500;
                    color: #0f0f0f;
                }
                
                .yt-comment-time {
                    font-size: 12px;
                    color: #606060;
                }
                
                .yt-badge {
                    font-size: 11px;
                    background: #f2f2f2;
                    color: #606060;
                    padding: 2px 6px;
                    border-radius: 2px;
                    font-weight: 500;
                }
                
                .yt-badge-admin {
                    background: #065fd4;
                    color: white;
                }

                /* Comment Text */
                .yt-comment-text {
                    color: #0f0f0f;
                    font-size: 14px;
                    line-height: 20px;
                    margin: 2px 0 8px 0;
                    word-wrap: break-word;
                    white-space: pre-wrap;
                }

                /* Comment Actions - YouTube Style */
                .yt-comment-actions {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    margin-top: 4px;
                }
                
                .yt-action-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    padding: 8px 12px;
                    border: none;
                    background: transparent;
                    color: #0f0f0f;
                    font-size: 12px;
                    font-weight: 500;
                    cursor: pointer;
                    border-radius: 18px;
                    transition: background 0.1s;
                    font-family: "Roboto", "Arial", sans-serif;
                }
                
                .yt-action-btn:hover {
                    background: rgba(0, 0, 0, 0.05);
                }
                
                .yt-action-btn svg {
                    width: 16px;
                    height: 16px;
                }

                /* Like/Dislike Buttons */
                .yt-action-btn.active {
                    color: #065fd4;
                }
                
                .yt-action-btn.active svg {
                    fill: currentColor;
                }

                /* Reply Button */
                .yt-reply-btn {
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    font-size: 12px;
                    font-weight: 500;
                    padding: 8px 12px;
                }

                /* Delete Button */
                .yt-delete-btn {
                    color: #cc0000;
                }
                
                .yt-delete-btn:hover {
                    background: rgba(204, 0, 0, 0.1);
                }

                /* Nested Replies */
                .yt-comment-replies {
                    margin-left: 56px;
                    margin-top: 12px;
                }

                /* Reply Form */
                .yt-reply-form {
                    display: flex;
                    gap: 12px;
                    margin-top: 12px;
                    padding: 12px 0;
                    align-items: start;
                }

                /* Loading State */
                .yt-loading {
                    text-align: center;
                    padding: 40px 20px;
                    color: #606060;
                }

                .yt-loading-spinner {
                    width: 24px;
                    height: 24px;
                    border: 3px solid #f3f3f3;
                    border-top: 3px solid #065fd4;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 12px;
                }

                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                /* Empty State */
                .yt-empty-state {
                    text-align: center;
                    padding: 60px 20px;
                    color: #606060;
                }

                .yt-empty-icon {
                    width: 96px;
                    height: 96px;
                    margin: 0 auto 16px;
                    opacity: 0.3;
                }

                /* Load More Button */
                .yt-load-more {
                    text-align: center;
                    margin-top: 24px;
                }

                .yt-load-more-btn {
                    padding: 10px 16px;
                    background: transparent;
                    color: #065fd4;
                    border: none;
                    border-radius: 18px;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: background 0.1s;
                }

                .yt-load-more-btn:hover {
                    background: rgba(0, 0, 0, 0.05);
                }

                /* Responsive Design */
                @media (max-width: 768px) {
                    .yt-comments-section {
                        padding: 16px 12px;
                    }

                    .yt-comments-header h3 {
                        font-size: 18px;
                    }

                    .yt-comment-form-wrapper,
                    .yt-comment {
                        gap: 12px;
                    }

                    .yt-avatar {
                        width: 32px;
                        height: 32px;
                        font-size: 14px;
                    }

                    .yt-comment-replies {
                        margin-left: 44px;
                    }
                }

                @media (max-width: 480px) {
                    .yt-comments-section {
                        padding: 12px 8px;
                    }

                    .yt-comment-form-wrapper,
                    .yt-comment {
                        gap: 8px;
                    }

                    .yt-avatar {
                        width: 28px;
                        height: 28px;
                        font-size: 12px;
                    }

                    .yt-comment-replies {
                        margin-left: 36px;
                    }

                    .yt-action-btn {
                        padding: 6px 10px;
                        font-size: 11px;
                    }
                }
            </style>
            
            <div class="yt-comments-section">
                <div class="yt-comments-header">
                    <h3>
                        <span id="comment-count">0 Comments</span>
                    </h3>
                </div>
                
                <div id="comment-form-container">
                    ${this.renderCommentForm()}
                </div>
                
                <div id="comments-list">
                    ${this.renderLoadingState()}
                </div>
                
                <div id="load-more-container" style="display: none;" class="yt-load-more">
                    <button id="load-more-btn" class="yt-load-more-btn">
                        Show more comments
                    </button>
                </div>
            </div>
        `;
  }

  renderCommentForm() {
    if (!this.currentUser) {
      return `
                <div class="yt-comment-form-login">
                    <svg style="width: 24px; height: 24px; flex-shrink: 0;" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clip-rule="evenodd"></path>
                    </svg>
                    <div>
                        <p style="font-size: 14px; margin: 0; color: #0f0f0f;">
                            <a href="login.html">Sign in</a> to comment
                        </p>
                    </div>
                </div>
            `;
    }

    return `
            <div class="yt-comment-form-wrapper">
                <div class="yt-avatar">
                    ${this.getInitials(this.currentUser.username || this.currentUser.email)}
                </div>
                <div class="yt-comment-input-wrapper">
                    <form id="comment-form">
                        <input 
                            type="text"
                            id="comment-text" 
                            class="yt-comment-input"
                            placeholder="Add a comment..." 
                            autocomplete="off"
                        />
                        <div class="yt-comment-form-actions" id="form-actions">
                            <button type="button" class="yt-btn yt-btn-cancel" id="cancel-comment">
                                Cancel
                            </button>
                            <button type="submit" class="yt-btn yt-btn-submit" id="submit-comment" disabled>
                                Comment
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
  }

  renderLoadingState() {
    return `
            <div class="yt-loading">
                <div class="yt-loading-spinner"></div>
                <p>Loading comments...</p>
            </div>
        `;
  }

  renderEmptyState() {
    return `
            <div class="yt-empty-state">
                <svg class="yt-empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                </svg>
                <p style="font-size: 14px;">No comments yet</p>
                <p style="font-size: 13px; color: #909090; margin-top: 4px;">Be the first to comment</p>
            </div>
        `;
  }

  getInitials(name) {
    if (!name) return "?";
    const parts = name.split(/[\s@._-]+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  getTimeAgo(timestamp) {
    const now = new Date();
    const commentDate = new Date(timestamp);
    const diffInSeconds = Math.floor((now - commentDate) / 1000);

    if (diffInSeconds < 60) return "just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`;
    return `${Math.floor(diffInSeconds / 31536000)} years ago`;
  }

  renderComment(comment, depth = 0) {
    const isAdmin = this.currentUser && this.currentUser.is_superuser;
    const isAuthor = this.currentUser && this.currentUser.id === comment.user_id;
    const canDelete = isAdmin || isAuthor;
    const userLiked = comment.user_reaction === "like";
    const userDisliked = comment.user_reaction === "dislike";

    return `
            <div class="yt-comment" data-comment-id="${comment.id}">
                <div class="yt-avatar ${depth > 0 ? 'yt-avatar-small' : ''}">
                    ${this.getInitials(comment.username)}
                </div>
                <div class="yt-comment-content">
                    <div class="yt-comment-header">
                        <span class="yt-comment-author">@${comment.username}</span>
                        <span class="yt-comment-time">${this.getTimeAgo(comment.created_at)}</span>
                        ${isAdmin ? '<span class="yt-badge yt-badge-admin">ADMIN</span>' : ''}
                    </div>
                    <div class="yt-comment-text">${this.escapeHtml(comment.text)}</div>
                    <div class="yt-comment-actions">
                        <button class="yt-action-btn like-btn ${userLiked ? 'active' : ''}" data-comment-id="${comment.id}" data-reaction="like">
                            <svg fill="${userLiked ? 'currentColor' : 'none'}" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"></path>
                            </svg>
                            ${comment.like_count > 0 ? comment.like_count : ''}
                        </button>
                        <button class="yt-action-btn dislike-btn ${userDisliked ? 'active' : ''}" data-comment-id="${comment.id}" data-reaction="dislike">
                            <svg fill="${userDisliked ? 'currentColor' : 'none'}" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5"></path>
                            </svg>
                        </button>
                        ${this.options.enableReplies && depth < this.options.maxDepth ? `
                            <button class="yt-action-btn yt-reply-btn reply-btn" data-comment-id="${comment.id}">
                                Reply
                            </button>
                        ` : ''}
                        ${canDelete ? `
                            <button class="yt-action-btn yt-delete-btn delete-btn" data-comment-id="${comment.id}">
                                Delete
                            </button>
                        ` : ''}
                    </div>
                    <div id="reply-form-${comment.id}"></div>
                    ${comment.replies && comment.replies.length > 0 ? `
                        <div class="yt-comment-replies">
                            ${comment.replies.map(reply => this.renderComment(reply, depth + 1)).join('')}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
  }

  renderComments() {
    const container = document.getElementById("comments-list");
    if (!container) return;

    if (this.comments.length === 0) {
      container.innerHTML = this.renderEmptyState();
      return;
    }

    container.innerHTML = this.comments.map(comment => this.renderComment(comment)).join('');
  }

  updateCommentCount(count) {
    const countElement = document.getElementById("comment-count");
    if (countElement) {
      countElement.textContent = `${count} ${count === 1 ? 'Comment' : 'Comments'}`;
    }
  }

  updateLoadMoreButton(totalCount, currentCount) {
    const loadMoreContainer = document.getElementById("load-more-container");
    const loadMoreBtn = document.getElementById("load-more-btn");
    
    if (loadMoreContainer && loadMoreBtn) {
      if (currentCount < totalCount) {
        loadMoreContainer.style.display = "block";
        loadMoreBtn.textContent = `Show more comments (${totalCount - currentCount} remaining)`;
      } else {
        loadMoreContainer.style.display = "none";
      }
    }
  }

  bindEvents() {
    const container = document.getElementById(this.containerId);

    // Form submission
    container.addEventListener("submit", async (e) => {
      if (e.target.id === "comment-form") {
        e.preventDefault();
        await this.submitComment();
      } else if (e.target.classList.contains("reply-form")) {
        e.preventDefault();
        const parentId = e.target.dataset.parentId;
        await this.submitReply(parentId, e.target);
      }
    });

    // Input focus/blur events
    container.addEventListener("focus", (e) => {
      if (e.target.id === "comment-text") {
        const actions = document.getElementById("form-actions");
        if (actions) actions.classList.add("active");
      }
    }, true);

    // Cancel button
    container.addEventListener("click", (e) => {
      if (e.target.id === "cancel-comment") {
        const input = document.getElementById("comment-text");
        const actions = document.getElementById("form-actions");
        if (input) input.value = "";
        if (actions) actions.classList.remove("active");
        if (input) input.blur();
      }
    });

    // Enable/disable submit button based on input
    container.addEventListener("input", (e) => {
      if (e.target.id === "comment-text") {
        const submitBtn = document.getElementById("submit-comment");
        if (submitBtn) {
          submitBtn.disabled = e.target.value.trim().length === 0;
        }
      }
    });

    // Event delegation for dynamic elements
    container.addEventListener("click", (e) => {
      const likeBtn = e.target.closest(".like-btn");
      const dislikeBtn = e.target.closest(".dislike-btn");
      const replyBtn = e.target.closest(".reply-btn");
      const deleteBtn = e.target.closest(".delete-btn");
      const loadMoreBtn = e.target.closest("#load-more-btn");

      if (likeBtn) {
        this.toggleLike(likeBtn.dataset.commentId, "like");
      } else if (dislikeBtn) {
        this.toggleLike(dislikeBtn.dataset.commentId, "dislike");
      } else if (replyBtn) {
        this.showReplyForm(replyBtn.dataset.commentId);
      } else if (deleteBtn) {
        this.deleteComment(deleteBtn.dataset.commentId);
      } else if (loadMoreBtn) {
        this.loadMoreComments();
      }
    });
  }

  bindCommentFormEvents() {
    const container = document.getElementById(this.containerId);
    const commentText = container.querySelector("#comment-text");
    
    if (commentText) {
      const actions = document.getElementById("form-actions");
      const submitBtn = document.getElementById("submit-comment");

      commentText.addEventListener("focus", () => {
        if (actions) actions.classList.add("active");
      });

      commentText.addEventListener("input", (e) => {
        if (submitBtn) {
          submitBtn.disabled = e.target.value.trim().length === 0;
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
      const response = await fetch(
        `${this.apiBaseUrl}/comments/?content_type=${this.contentType}&content_slug=${this.contentSlug}&limit=20&offset=${offset}`,
        {
          headers: this.getHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (offset === 0) {
        this.comments = data.results;
      } else {
        this.comments = [...this.comments, ...data.results];
      }

      this.renderComments();
      this.updateCommentCount(data.count);
      this.updateLoadMoreButton(data.count, this.comments.length);
    } catch (error) {
      console.error("Error loading comments:", error);
      if (offset === 0) {
        commentsContainer.innerHTML = `
          <div class="yt-empty-state">
            <p style="color: #cc0000;">Failed to load comments</p>
            <p style="font-size: 13px; color: #606060; margin-top: 4px;">${error.message}</p>
          </div>
        `;
      }
    } finally {
      this.isLoading = false;
    }
  }

  async loadMoreComments() {
    await this.loadComments(this.comments.length);
  }

  async submitComment() {
    const commentText = document.getElementById("comment-text");
    const text = commentText.value.trim();

    if (!text || !this.authToken) {
      if (!this.authToken) {
        alert("Authentication required. Redirecting to login...");
        window.location.href = "login.html";
      }
      return;
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/comments/`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          content_type: this.contentType,
          content_slug: this.contentSlug,
          text: text,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to post comment");
      }

      commentText.value = "";
      const actions = document.getElementById("form-actions");
      if (actions) actions.classList.remove("active");
      
      await this.loadComments();
    } catch (error) {
      console.error("Error submitting comment:", error);
      alert(`Failed to post comment: ${error.message}`);
    }
  }

  async toggleLike(commentId, reaction) {
    if (!this.authToken) {
      alert("Please login to like comments");
      return;
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/comments/${commentId}/react/`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({ reaction }),
      });

      if (!response.ok) {
        throw new Error("Failed to update reaction");
      }

      await this.loadComments();
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  }

  showReplyForm(parentId) {
    if (!this.currentUser) {
      alert("Please login to reply");
      return;
    }

    const replyContainer = document.getElementById(`reply-form-${parentId}`);
    if (!replyContainer) return;

    replyContainer.innerHTML = `
      <div class="yt-reply-form">
        <div class="yt-avatar yt-avatar-small">
          ${this.getInitials(this.currentUser.username || this.currentUser.email)}
        </div>
        <div class="yt-comment-input-wrapper">
          <form class="reply-form" data-parent-id="${parentId}">
            <input 
              type="text"
              class="yt-comment-input reply-text"
              placeholder="Add a reply..." 
              autocomplete="off"
            />
            <div class="yt-comment-form-actions active">
              <button type="button" class="yt-btn yt-btn-cancel cancel-reply">Cancel</button>
              <button type="submit" class="yt-btn yt-btn-submit">Reply</button>
            </div>
          </form>
        </div>
      </div>
    `;

    const cancelBtn = replyContainer.querySelector(".cancel-reply");
    cancelBtn.addEventListener("click", () => {
      replyContainer.innerHTML = "";
    });
  }

  async submitReply(parentId, form) {
    const replyInput = form.querySelector(".reply-text");
    const text = replyInput.value.trim();

    if (!text || !this.authToken) return;

    try {
      const response = await fetch(`${this.apiBaseUrl}/comments/`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          content_type: this.contentType,
          content_slug: this.contentSlug,
          text: text,
          parent_id: parentId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to post reply");
      }

      await this.loadComments();
    } catch (error) {
      console.error("Error submitting reply:", error);
      alert(`Failed to post reply: ${error.message}`);
    }
  }

  async deleteComment(commentId) {
    if (!confirm("Are you sure you want to delete this comment?")) {
      return;
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/comments/${commentId}/`, {
        method: "DELETE",
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error("Failed to delete comment");
      }

      await this.loadComments();
    } catch (error) {
      console.error("Error deleting comment:", error);
      alert(`Failed to delete comment: ${error.message}`);
    }
  }

  getHeaders() {
    const headers = {
      "Content-Type": "application/json",
    };

    if (this.authToken) {
      headers["Authorization"] = `Token ${this.authToken}`;
    }

    return headers;
  }

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
}
