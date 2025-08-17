// UI Management - إدارة واجهة المستخدم مع دعم Firebase
class UIManager {
    constructor() {
        this.currentSection = 'posts';
        this.currentTheme = 'light';
        this.currentLanguage = 'ar';
        this.toasts = [];
        this.messageUpdateInterval = null;
        
        this.initializeUI();
    }

    // تهيئة واجهة المستخدم
    initializeUI() {
        this.loadSettings();
        this.setupEventListeners();
        this.updateFeatureVisibility();
        this.setupMessageUpdates();
    }

    // إعداد تحديثات الرسائل
    setupMessageUpdates() {
        // تحديث الرسائل عند تحميل Firebase
        if (window.firebaseManager) {
            window.firebaseManager.onInitialized(() => {
                this.renderMessages();
            });
        }
    }

    // تحميل الإعدادات
    loadSettings() {
        const settings = window.dataManager.getSettings();
        this.currentTheme = settings.theme || 'light';
        this.currentLanguage = settings.language || 'ar';
        
        this.applyTheme(this.currentTheme);
        this.applyLanguage(this.currentLanguage);
    }

    // إعداد مستمعي الأحداث
    setupEventListeners() {
        // تبديل التبويبات
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('tab-item')) {
                this.switchTab(e.target.dataset.tab);
            }
        });

        // تبديل الثيم
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('theme-toggle') || e.target.closest('.theme-toggle')) {
                this.toggleTheme();
            }
        });

        // تبديل اللغة
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('language-toggle')) {
                this.toggleLanguage();
            }
        });

        // زر لقطة الشاشة
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('screenshot-btn')) {
                this.takeScreenshot();
            }
        });

        // إغلاق النوافذ المنبثقة
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal') || e.target.classList.contains('modal-close')) {
                this.closeModal();
            }
        });

        // مراقبة تغييرات البيانات
        window.dataManager.addWatcher((event, data) => {
            if (event === 'featureChanged') {
                this.updateFeatureVisibility();
            } else if (event === 'newMessage') {
                // تحديث فوري للرسائل عند وصول رسالة جديدة
                if (this.currentSection === 'messages') {
                    this.renderMessages();
                }
            }
        });
    }

    // تبديل التبويبات
    switchTab(tabName) {
        // التحقق من تفعيل الميزة
        const settings = window.dataManager.getSettings();
        if (!settings.features[tabName]) {
            this.showToast('هذه الميزة معطلة حالياً', 'warning');
            return;
        }

        this.currentSection = tabName;
        
        // تحديث التبويبات النشطة
        document.querySelectorAll('.tab-item').forEach(tab => {
            tab.classList.remove('active');
        });
        
        document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.remove('active');
        });

        // تفعيل التبويب الحالي
        const activeTab = document.querySelector(`[data-tab="${tabName}"]`);
        const activePane = document.getElementById(`${tabName}Tab`);
        
        if (activeTab) activeTab.classList.add('active');
        if (activePane) activePane.classList.add('active');

        // تحديث المحتوى
        this.refresh();
    }

    // تحديث المحتوى
    refresh() {
        switch (this.currentSection) {
            case 'posts':
                this.renderPosts();
                break;
            case 'messages':
                this.renderMessages();
                break;
            case 'stories':
                this.renderStories();
                break;
            case 'watch':
                this.renderWatchPage();
                break;
            case 'novels':
                this.renderNovels();
                break;
        }
    }

    // عرض المنشورات
    renderPosts() {
        const postsContainer = document.getElementById('postsContainer');
        if (!postsContainer) return;

        const posts = window.dataManager.getPosts();

        if (posts.length === 0) {
            postsContainer.innerHTML = `
                <div class="empty-state">
                    <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14,2 14,8 20,8"/>
                        <line x1="16" y1="13" x2="8" y2="13"/>
                        <line x1="16" y1="17" x2="8" y2="17"/>
                        <polyline points="10,9 9,9 8,9"/>
                    </svg>
                    <h3>لا توجد منشورات</h3>
                    <p>ابدأ بإنشاء منشورك الأول</p>
                </div>
            `;
            return;
        }

        postsContainer.innerHTML = posts.map(post => {
            const author = window.dataManager.getUserById(post.userId);
            const currentUser = window.authManager.getCurrentUser();
            const isLiked = post.likedBy && post.likedBy.includes(currentUser?.id);
            const timeAgo = this.getTimeAgo(post.timestamp);

            return `
                <div class="card post-card">
                    <div class="post-header">
                        <img src="${author?.avatar || 'assets/images/avatar-male.png'}" alt="${author?.username}" class="post-avatar">
                        <div class="post-author">
                            <h4>${author?.username || 'مستخدم'}</h4>
                            <p class="post-time">${timeAgo}</p>
                        </div>
                    </div>
                    <div class="post-content">
                        <p>${post.content}</p>
                        ${post.image ? `<img src="${post.image}" alt="منشور" class="post-image">` : ''}
                    </div>
                    <div class="post-actions">
                        <button class="action-btn ${isLiked ? 'liked' : ''}" onclick="window.uiManager.togglePostLike(${post.id})">
                            <svg class="action-icon" viewBox="0 0 24 24" fill="${isLiked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                            </svg>
                            <span>${post.likes || 0}</span>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    // عرض الرسائل مع دعم Firebase
    async renderMessages() {
        const messagesContainer = document.getElementById('messagesContainer');
        if (!messagesContainer) return;

        try {
            // عرض مؤشر التحميل
            messagesContainer.innerHTML = `
                <div class="loading-state">
                    <div class="spinner"></div>
                    <p>جاري تحميل الرسائل...</p>
                </div>
            `;

            const messages = window.dataManager.getMessages();
            const currentUser = window.authManager.getCurrentUser();

            if (!currentUser) {
                messagesContainer.innerHTML = `
                    <div class="empty-state">
                        <p>يرجى تسجيل الدخول لعرض الرسائل</p>
                    </div>
                `;
                return;
            }

            if (messages.length === 0) {
                messagesContainer.innerHTML = `
                    <div class="empty-state">
                        <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                        </svg>
                        <h3>لا توجد رسائل</h3>
                        <p>ابدأ محادثة جديدة</p>
                    </div>
                `;
                return;
            }

            // عرض الرسائل
            const messagesHTML = messages.map(message => {
                const sender = window.dataManager.getUserById(message.senderId);
                const isCurrentUser = message.senderId === currentUser.id;
                const timeAgo = this.getTimeAgo(message.timestamp);

                return `
                    <div class="message ${isCurrentUser ? 'message-sent' : 'message-received'}">
                        <div class="message-content">
                            <div class="message-header">
                                <img src="${sender?.avatar || 'assets/images/avatar-male.png'}" alt="${sender?.username}" class="message-avatar">
                                <span class="message-sender">${sender?.username || 'مستخدم'}</span>
                                <span class="message-time">${timeAgo}</span>
                            </div>
                            <div class="message-body">
                                <p>${message.content}</p>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

            messagesContainer.innerHTML = messagesHTML;

            // التمرير إلى أسفل
            setTimeout(() => {
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }, 100);

        } catch (error) {
            console.error('Error rendering messages:', error);
            messagesContainer.innerHTML = `
                <div class="error-state">
                    <p>حدث خطأ أثناء تحميل الرسائل</p>
                    <button class="btn btn-primary" onclick="window.uiManager.renderMessages()">إعادة المحاولة</button>
                </div>
            `;
        }
    }

    // عرض الستوريات
    async renderStories() {
        const storiesContainer = document.getElementById('storiesContainer');
        if (!storiesContainer) return;

        try {
            const stories = await window.dataManager.getActiveStories();

            if (stories.length === 0) {
                storiesContainer.innerHTML = `
                    <div class="empty-state">
                        <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"/>
                            <path d="M12 6v6l4 2"/>
                        </svg>
                        <h3>لا توجد ستوريات</h3>
                        <p>أضف ستوري جديد</p>
                    </div>
                `;
                return;
            }

            storiesContainer.innerHTML = stories.map(story => {
                const author = window.dataManager.getUserById(story.userId);
                const timeAgo = this.getTimeAgo(story.timestamp);

                return `
                    <div class="card story-card">
                        <div class="story-header">
                            <img src="${author?.avatar || 'assets/images/avatar-male.png'}" alt="${author?.username}" class="post-avatar">
                            <div class="story-author">
                                <h4>${author?.username || 'مستخدم'}</h4>
                                <p>${timeAgo}</p>
                            </div>
                        </div>
                        <div class="story-content">
                            ${story.media ? `<img src="${story.media}" alt="ستوري" class="story-media">` : ''}
                            <p>${story.content}</p>
                        </div>
                    </div>
                `;
            }).join('');
        } catch (error) {
            console.error('Error rendering stories:', error);
            storiesContainer.innerHTML = `
                <div class="error-state">
                    <p>حدث خطأ أثناء تحميل الستوريات</p>
                </div>
            `;
        }
    }

    // عرض الروايات
    async renderNovels() {
        const novelsContainer = document.getElementById('novelsContainer');
        if (!novelsContainer) return;

        try {
            const novels = await window.dataManager.getNovels();

            if (novels.length === 0) {
                novelsContainer.innerHTML = `
                    <div class="empty-state">
                        <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                        </svg>
                        <h3>لا توجد روايات</h3>
                        <p>اكتب رواية جديدة</p>
                    </div>
                `;
                return;
            }

            novelsContainer.innerHTML = novels.map(novel => {
                const author = window.dataManager.getUserById(novel.authorId);
                const timeAgo = this.getTimeAgo(novel.timestamp);

                return `
                    <div class="card novel-card">
                        <div class="card-header">
                            <h3 class="card-title">${novel.title}</h3>
                            <p class="text-muted">بقلم: ${author?.username || 'مستخدم'} • ${timeAgo}</p>
                        </div>
                        <div class="card-body">
                            <p class="card-text">${novel.content}</p>
                        </div>
                    </div>
                `;
            }).join('');
        } catch (error) {
            console.error('Error rendering novels:', error);
            novelsContainer.innerHTML = `
                <div class="error-state">
                    <p>حدث خطأ أثناء تحميل الروايات</p>
                </div>
            `;
        }
    }

    // عرض صفحة المشاهدة
    renderWatchPage() {
        const watchContainer = document.getElementById('watchContainer');
        if (!watchContainer) return;

        watchContainer.innerHTML = `
            <div class="watch-layout">
                <div class="video-container">
                    <div class="video-placeholder">
                        <svg class="video-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polygon points="23 7 16 12 23 17 23 7"/>
                            <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                        </svg>
                        <p>مشغل الفيديو</p>
                    </div>
                </div>
                <div class="video-controls">
                    <div class="row">
                        <div class="col-md-6">
                            <h4>مشاهدة من الهاتف</h4>
                            <input type="file" id="localVideo" accept="video/*" class="form-control">
                        </div>
                        <div class="col-md-6">
                            <h4>مشاهدة من YouTube</h4>
                            <div class="d-flex gap-2">
                                <input type="url" id="youtubeUrl" placeholder="رابط YouTube" class="form-control">
                                <button class="btn btn-primary" onclick="loadYouTubeVideo()">تشغيل</button>
                            </div>
                        </div>
                    </div>
                    <div class="mt-3">
                        <button class="btn btn-secondary me-2" onclick="playVideo()">تشغيل</button>
                        <button class="btn btn-secondary me-2" onclick="pauseVideo()">إيقاف</button>
                        <button class="btn btn-secondary" onclick="skipVideo()">تقديم 10 ثواني</button>
                    </div>
                </div>
            </div>
        `;
    }

    // إعجاب بمنشور
    async togglePostLike(postId) {
        const currentUser = window.authManager.getCurrentUser();
        if (!currentUser) return;

        try {
            await window.dataManager.togglePostLike(postId, currentUser.id);
            this.renderPosts(); // إعادة عرض المنشورات
        } catch (error) {
            console.error('Error toggling post like:', error);
            this.showToast('حدث خطأ أثناء الإعجاب', 'error');
        }
    }

    // تبديل الثيم
    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme(this.currentTheme);
        
        // حفظ الإعداد
        window.dataManager.updateSettings({ theme: this.currentTheme });
    }

    // تطبيق الثيم
    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        
        // تحديث أيقونة الثيم
        const themeToggle = document.querySelector('.theme-toggle');
        if (themeToggle) {
            themeToggle.classList.add('theme-changing');
            setTimeout(() => {
                themeToggle.classList.remove('theme-changing');
            }, 300);
        }
    }

    // تبديل اللغة
    toggleLanguage() {
        this.currentLanguage = this.currentLanguage === 'ar' ? 'en' : 'ar';
        this.applyLanguage(this.currentLanguage);
        
        // حفظ الإعداد
        window.dataManager.updateSettings({ language: this.currentLanguage });
    }

    // تطبيق اللغة
    applyLanguage(language) {
        document.documentElement.setAttribute('dir', language === 'ar' ? 'rtl' : 'ltr');
        document.documentElement.setAttribute('lang', language);
        
        // تحديث نص زر اللغة
        const languageToggle = document.querySelector('.language-toggle .lang-text');
        if (languageToggle) {
            languageToggle.textContent = language === 'ar' ? 'EN' : 'ع';
        }
    }

    // تحديث رؤية الميزات
    updateFeatureVisibility() {
        const settings = window.dataManager.getSettings();
        const features = settings.features;

        // إخفاء/إظهار التبويبات
        Object.keys(features).forEach(feature => {
            const tabElement = document.querySelector(`[data-tab="${feature}"]`);
            if (tabElement) {
                tabElement.style.display = features[feature] ? 'flex' : 'none';
            }
        });

        // إخفاء الزر العائم إذا كانت المنشورات معطلة
        const floatingBtn = document.querySelector('.btn-floating');
        if (floatingBtn) {
            floatingBtn.style.display = features.posts ? 'flex' : 'none';
        }
    }

    // أخذ لقطة شاشة
    takeScreenshot() {
        const currentUser = window.authManager.getCurrentUser();
        if (!currentUser) return;

        // تسجيل لقطة الشاشة
        window.dataManager.addScreenshot(currentUser.id, document.title);
        
        this.showToast('تم تسجيل لقطة الشاشة', 'info');
    }

    // عرض رسالة منبثقة
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <span class="toast-message">${message}</span>
                <button class="toast-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;

        // إضافة الرسالة إلى الصفحة
        let toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toastContainer';
            toastContainer.className = 'toast-container';
            document.body.appendChild(toastContainer);
        }

        toastContainer.appendChild(toast);

        // إزالة الرسالة تلقائياً بعد 3 ثوانٍ
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 3000);
    }

    // عرض نافذة منبثقة
    showModal(title, content, buttons = []) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title">${title}</h3>
                    <button class="modal-close">×</button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
                ${buttons.length > 0 ? `
                    <div class="modal-footer">
                        ${buttons.map(btn => `
                            <button class="${btn.class}" onclick="${btn.onclick}">${btn.text}</button>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `;

        document.body.appendChild(modal);
        return modal;
    }

    // إغلاق النافذة المنبثقة
    closeModal() {
        const modal = document.querySelector('.modal');
        if (modal) {
            modal.remove();
        }
    }

    // تنسيق الوقت
    getTimeAgo(timestamp) {
        const now = new Date();
        const time = new Date(timestamp);
        const diffInSeconds = Math.floor((now - time) / 1000);

        if (diffInSeconds < 60) {
            return 'الآن';
        } else if (diffInSeconds < 3600) {
            const minutes = Math.floor(diffInSeconds / 60);
            return `منذ ${minutes} دقيقة`;
        } else if (diffInSeconds < 86400) {
            const hours = Math.floor(diffInSeconds / 3600);
            return `منذ ${hours} ساعة`;
        } else {
            const days = Math.floor(diffInSeconds / 86400);
            return `منذ ${days} يوم`;
        }
    }

    // تنسيق التاريخ
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('ar-SA', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // إظهار حالة الاتصال بـ Firebase
    showConnectionStatus() {
        const isConnected = window.dataManager && window.dataManager.isFirebaseConnected();
        const statusElement = document.getElementById('connectionStatus');
        
        if (statusElement) {
            statusElement.innerHTML = `
                <div class="connection-status ${isConnected ? 'connected' : 'disconnected'}">
                    <span class="status-indicator"></span>
                    <span class="status-text">${isConnected ? 'متصل' : 'غير متصل'}</span>
                </div>
            `;
        }
    }
}

// إنشاء مثيل عام لإدارة واجهة المستخدم
window.uiManager = new UIManager();

// تحديث حالة الاتصال دورياً
setInterval(() => {
    if (window.uiManager) {
        window.uiManager.showConnectionStatus();
    }
}, 5000);

// إضافة أنماط CSS للرسائل والتحسينات
const additionalStyles = document.createElement('style');
additionalStyles.textContent = `
    .loading-state, .error-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 2rem;
        text-align: center;
        color: var(--text-secondary);
    }

    .spinner {
        width: 40px;
        height: 40px;
        border: 3px solid var(--border-color);
        border-top: 3px solid var(--primary-color);
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-bottom: 1rem;
    }

    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }

    .message {
        margin-bottom: 1rem;
        display: flex;
        align-items: flex-start;
    }

    .message-sent {
        justify-content: flex-end;
    }

    .message-sent .message-content {
        background: var(--primary-color);
        color: white;
        border-radius: 1rem 1rem 0.25rem 1rem;
    }

    .message-received .message-content {
        background: var(--bg-secondary);
        color: var(--text-primary);
        border-radius: 1rem 1rem 1rem 0.25rem;
    }

    .message-content {
        max-width: 70%;
        padding: 0.75rem 1rem;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .message-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.25rem;
        font-size: 0.8rem;
        opacity: 0.8;
    }

    .message-avatar {
        width: 20px;
        height: 20px;
        border-radius: 50%;
    }

    .message-time {
        margin-right: auto;
        font-size: 0.7rem;
    }

    .message-body p {
        margin: 0;
        line-height: 1.4;
    }

    .connection-status {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.8rem;
        padding: 0.25rem 0.5rem;
        border-radius: 0.5rem;
        background: var(--bg-secondary);
    }

    .status-indicator {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--danger-color);
    }

    .connection-status.connected .status-indicator {
        background: var(--success-color);
    }

    .video-placeholder {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 300px;
        background: var(--bg-secondary);
        border-radius: 0.5rem;
        color: var(--text-secondary);
    }

    .video-icon {
        width: 48px;
        height: 48px;
        margin-bottom: 1rem;
    }

    .toast-container {
        position: fixed;
        top: 1rem;
        right: 1rem;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .toast {
        background: var(--bg-card);
        border-radius: 0.5rem;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        min-width: 300px;
        animation: slideIn 0.3s ease;
    }

    .toast-success { border-left: 4px solid var(--success-color); }
    .toast-error { border-left: 4px solid var(--danger-color); }
    .toast-warning { border-left: 4px solid var(--warning-color); }
    .toast-info { border-left: 4px solid var(--info-color); }

    .toast-content {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1rem;
    }

    .toast-close {
        background: none;
        border: none;
        font-size: 1.2rem;
        cursor: pointer;
        color: var(--text-secondary);
        margin-right: 0.5rem;
    }

    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @media (max-width: 768px) {
        .message-content {
            max-width: 85%;
        }
        
        .toast-container {
            right: 0.5rem;
            left: 0.5rem;
        }
        
        .toast {
            min-width: auto;
        }
    }
`;
document.head.appendChild(additionalStyles);

