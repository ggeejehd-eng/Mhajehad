// Main Application - التطبيق الرئيسي
class MJ36App {
    constructor() {
        this.isInitialized = false;
        this.currentPage = this.getCurrentPage();
        
        this.initialize();
    }

    // تهيئة التطبيق
    initialize() {
        if (this.isInitialized) return;

        // التحقق من تسجيل الدخول
        this.checkAuthentication();
        
        // تهيئة الصفحة الحالية
        this.initializePage();
        
        // إعداد مستمعي الأحداث العامة
        this.setupGlobalEventListeners();
        
        this.isInitialized = true;
    }

    // التحقق من المصادقة
    checkAuthentication() {
        const isLoggedIn = window.authManager.isLoggedIn();
        const isLoginPage = this.currentPage === 'login';
        const isAdminPage = this.currentPage === 'admin';

        // إعادة توجيه إلى صفحة تسجيل الدخول إذا لم يكن مسجلاً
        if (!isLoggedIn && !isLoginPage && !isAdminPage) {
            window.location.href = 'login.html';
            return;
        }

        // إعادة توجيه إلى الصفحة الرئيسية إذا كان مسجلاً ويحاول الوصول لصفحة تسجيل الدخول
        if (isLoggedIn && isLoginPage) {
            window.location.href = 'index.html';
            return;
        }
    }

    // تهيئة الصفحة الحالية
    initializePage() {
        switch (this.currentPage) {
            case 'index':
                this.initializeMainPage();
                break;
            case 'login':
                this.initializeLoginPage();
                break;
            case 'admin':
                this.initializeAdminPage();
                break;
            case 'profile':
                this.initializeProfilePage();
                break;
            case 'post':
                this.initializePostPage();
                break;
            case 'story':
                this.initializeStoryPage();
                break;
            case 'novel':
                this.initializeNovelPage();
                break;
        }
    }

    // تهيئة الصفحة الرئيسية
    initializeMainPage() {
        // تحديث معلومات المستخدم
        this.updateUserInfo();
        
        // تحميل المحتوى
        setTimeout(() => {
            window.uiManager.refresh();
        }, 100);

        // إعداد الزر العائم
        this.setupFloatingButton();
        
        // إعداد شريط البحث
        this.setupSearchBar();
    }

    // تهيئة صفحة تسجيل الدخول
    initializeLoginPage() {
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        const adminForm = document.getElementById('adminForm');

        // نموذج تسجيل الدخول
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleLogin(e.target);
            });
        }

        // نموذج إنشاء الحساب
        if (registerForm) {
            registerForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleRegister(e.target);
            });
        }

        // نموذج دخول الآدمن
        if (adminForm) {
            adminForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleAdminLogin(e.target);
            });
        }

        // تبديل النماذج
        this.setupFormSwitching();
    }

    // تهيئة لوحة التحكم
    initializeAdminPage() {
        this.loadAdminData();
        this.setupAdminControls();
    }

    // تهيئة صفحة الملف الشخصي
    initializeProfilePage() {
        this.loadProfileData();
        this.setupProfileForm();
    }

    // تهيئة صفحة إنشاء المنشور
    initializePostPage() {
        this.setupPostForm();
        this.setupMediaUpload();
    }

    // تهيئة صفحة إنشاء الستوري
    initializeStoryPage() {
        this.setupStoryForm();
        this.setupStoryMediaUpload();
    }

    // تهيئة صفحة إنشاء الرواية
    initializeNovelPage() {
        this.setupNovelForm();
    }

    // معالجة تسجيل الدخول
    async handleLogin(form) {
        const formData = new FormData(form);
        const username = formData.get('username');
        const password = formData.get('password');

        this.showLoading(form);

        try {
            const result = await window.authManager.login(username, password);
            
            if (result.success) {
                window.uiManager.showToast('تم تسجيل الدخول بنجاح', 'success');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1000);
            } else {
                this.showError(form, result.error);
            }
        } catch (error) {
            this.showError(form, 'حدث خطأ غير متوقع');
        } finally {
            this.hideLoading(form);
        }
    }

    // معالجة إنشاء الحساب
    async handleRegister(form) {
        const formData = new FormData(form);
        const username = formData.get('username');
        const password = formData.get('password');
        const confirmPassword = formData.get('confirmPassword');

        // التحقق من تطابق كلمات المرور
        if (password !== confirmPassword) {
            this.showError(form, 'كلمات المرور غير متطابقة');
            return;
        }

        this.showLoading(form);

        try {
            const result = await window.authManager.register(username, password);
            
            if (result.success) {
                window.uiManager.showToast('تم إنشاء الحساب بنجاح', 'success');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1000);
            } else {
                this.showError(form, result.error);
            }
        } catch (error) {
            this.showError(form, 'حدث خطأ غير متوقع');
        } finally {
            this.hideLoading(form);
        }
    }

    // معالجة دخول الآدمن
    async handleAdminLogin(form) {
        const formData = new FormData(form);
        const adminCode = formData.get('adminCode');

        this.showLoading(form);

        try {
            if (window.authManager.verifyAdminCode(adminCode)) {
                window.uiManager.showToast('تم التحقق من رمز الآدمن', 'success');
                setTimeout(() => {
                    window.location.href = 'admin.html';
                }, 1000);
            } else {
                this.showError(form, 'رمز الآدمن غير صحيح');
            }
        } catch (error) {
            this.showError(form, 'حدث خطأ غير متوقع');
        } finally {
            this.hideLoading(form);
        }
    }

    // تحديث معلومات المستخدم
    updateUserInfo() {
        const currentUser = window.authManager.getCurrentUser();
        if (!currentUser) return;

        // تحديث الصورة الشخصية
        const avatarElements = document.querySelectorAll('.user-avatar');
        avatarElements.forEach(avatar => {
            avatar.src = currentUser.avatar;
            avatar.alt = currentUser.username;
        });

        // تحديث اسم المستخدم
        const usernameElements = document.querySelectorAll('.user-name');
        usernameElements.forEach(username => {
            username.textContent = currentUser.username;
        });
    }

    // إعداد الزر العائم
    setupFloatingButton() {
        const floatingBtn = document.querySelector('.btn-floating');
        if (floatingBtn) {
            floatingBtn.addEventListener('click', () => {
                this.showCreatePostModal();
            });
        }
    }

    // إعداد شريط البحث
    setupSearchBar() {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.handleSearch(e.target.value);
            });
        }
    }

    // إعداد تبديل النماذج
    setupFormSwitching() {
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('form-switch')) {
                const targetForm = e.target.dataset.target;
                this.switchForm(targetForm);
            }
        });
    }

    // تبديل النماذج
    switchForm(targetForm) {
        document.querySelectorAll('.auth-form').forEach(form => {
            form.classList.remove('active');
        });
        
        const target = document.getElementById(targetForm);
        if (target) {
            target.classList.add('active');
        }
    }

    // عرض نافذة إنشاء منشور
    showCreatePostModal() {
        const modal = window.uiManager.showModal('إنشاء منشور جديد', `
            <form id="createPostForm">
                <div class="form-group">
                    <label for="postContent">المحتوى</label>
                    <textarea id="postContent" name="content" placeholder="ماذا تريد أن تشارك؟" required></textarea>
                </div>
                <div class="form-group">
                    <label for="postImage">صورة (اختياري)</label>
                    <input type="file" id="postImage" name="image" accept="image/*">
                </div>
            </form>
        `, [
            { text: 'إلغاء', class: 'btn-secondary', onclick: 'window.uiManager.closeModal()' },
            { text: 'نشر', class: 'btn-primary', onclick: 'window.app.createPost()' }
        ]);
    }

    // إنشاء منشور
    async createPost() {
        const form = document.getElementById('createPostForm');
        const formData = new FormData(form);
        const content = formData.get('content');
        const imageFile = formData.get('image');

        if (!content.trim()) {
            window.uiManager.showToast('يرجى كتابة محتوى المنشور', 'warning');
            return;
        }

        const currentUser = window.authManager.getCurrentUser();
        if (!currentUser) return;

        try {
            // معالجة الصورة إذا تم رفعها
            let imagePath = null;
            if (imageFile && imageFile.size > 0) {
                // في التطبيق الحقيقي، يتم رفع الصورة إلى الخادم
                // هنا نستخدم URL محلي للعرض
                imagePath = URL.createObjectURL(imageFile);
            }

            // إنشاء المنشور
            const newPost = await window.dataManager.addPost({
                userId: currentUser.id,
                content: content.trim(),
                image: imagePath
            });

            window.uiManager.showToast('تم نشر المنشور بنجاح', 'success');
            window.uiManager.closeModal();
            window.uiManager.refresh();
        } catch (error) {
            window.uiManager.showToast('حدث خطأ أثناء النشر', 'error');
        }
    }

    // معالجة البحث
    async handleSearch(query) {
        if (!query.trim()) {
            window.uiManager.refresh();
            return;
        }

        // البحث في المنشورات والرسائل والروايات
        const posts = await window.dataManager.getPosts();
        const messages = window.dataManager.getMessages();
        const novels = await window.dataManager.getNovels();

        const filteredPosts = posts.filter(post => 
            post.content.toLowerCase().includes(query.toLowerCase())
        );

        // عرض نتائج البحث
        this.displaySearchResults(filteredPosts, query);
    }

    // عرض نتائج البحث
    displaySearchResults(results, query) {
        const postsContainer = document.getElementById('postsContainer');
        if (!postsContainer) return;

        if (results.length === 0) {
            postsContainer.innerHTML = `
                <div class="empty-state">
                    <p>لا توجد نتائج للبحث عن "${query}"</p>
                </div>
            `;
            return;
        }

        // عرض النتائج
        window.uiManager.renderPosts();
    }

    // تحميل بيانات لوحة التحكم
    async loadAdminData() {
        const users = await window.dataManager.getUsers();
        const posts = await window.dataManager.getPosts();
        const messages = window.dataManager.getMessages();
        const screenshots = await window.dataManager.getScreenshots();
        const settings = await window.dataManager.getSettings();

        // تحديث الإحصائيات
        this.updateAdminStats(users, posts, messages, screenshots);
        
        // تحديث قائمة المستخدمين
        this.updateUsersList(users);
        
        // تحديث سجل لقطات الشاشة
        this.updateScreenshotsList(screenshots);
        
        // تحديث إعدادات الميزات
        this.updateFeatureSettings(settings.features);
    }

    // تحديث إحصائيات لوحة التحكم
    updateAdminStats(users, posts, messages, screenshots) {
        const statsContainer = document.getElementById('adminStats');
        if (!statsContainer) return;

        statsContainer.innerHTML = `
            <div class="row">
                <div class="col-md-3">
                    <div class="stat-card">
                        <h3>${users.length}</h3>
                        <p>المستخدمين</p>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="stat-card">
                        <h3>${posts.length}</h3>
                        <p>المنشورات</p>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="stat-card">
                        <h3>${messages.length}</h3>
                        <p>الرسائل</p>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="stat-card">
                        <h3>${screenshots.length}</h3>
                        <p>لقطات الشاشة</p>
                    </div>
                </div>
            </div>
        `;
    }

    // تحديث قائمة المستخدمين
    updateUsersList(users) {
        const usersContainer = document.getElementById('usersList');
        if (!usersContainer) return;

        usersContainer.innerHTML = users.map(user => `
            <div class="user-item">
                <img src="${user.avatar}" alt="${user.username}" class="user-avatar">
                <div class="user-info">
                    <h4>${user.username}</h4>
                    <p>آخر نشاط: ${window.uiManager.formatDate(user.lastActive)}</p>
                </div>
                <div class="user-actions">
                    <span class="badge ${user.isAdmin ? 'badge-primary' : 'badge-secondary'}">
                        ${user.isAdmin ? 'آدمن' : 'مستخدم'}
                    </span>
                </div>
            </div>
        `).join('');
    }

    // تحديث سجل لقطات الشاشة
    updateScreenshotsList(screenshots) {
        const screenshotsContainer = document.getElementById('screenshotsList');
        if (!screenshotsContainer) return;

        screenshotsContainer.innerHTML = screenshots.map(screenshot => {
            return `
                <div class="screenshot-item">
                    <div class="screenshot-info">
                        <h4>مستخدم ${screenshot.userId}</h4>
                        <p>${screenshot.page}</p>
                        <small>${window.uiManager.formatDate(screenshot.timestamp)}</small>
                    </div>
                </div>
            `;
        }).join('');
    }

    // تحديث إعدادات الميزات
    updateFeatureSettings(features) {
        const featuresContainer = document.getElementById('featureSettings');
        if (!featuresContainer) return;

        featuresContainer.innerHTML = Object.keys(features).map(feature => {
            const featureNames = {
                posts: 'المنشورات',
                messages: 'الرسائل',
                stories: 'الستوري',
                watch: 'المشاهدة',
                novels: 'الروايات'
            };

            return `
                <div class="feature-setting">
                    <label class="switch">
                        <input type="checkbox" ${features[feature] ? 'checked' : ''} 
                               onchange="window.app.toggleFeature('${feature}', this.checked)">
                        <span class="slider"></span>
                    </label>
                    <span class="feature-name">${featureNames[feature] || feature}</span>
                </div>
            `;
        }).join('');
    }

    // تبديل حالة الميزة
    async toggleFeature(feature, status) {
        await window.dataManager.updateFeatureStatus(feature, status);
        window.uiManager.showToast(`تم ${status ? 'تفعيل' : 'تعطيل'} ميزة ${this.getFeatureName(feature)}`, 'info');
    }

    // الحصول على اسم الميزة بالعربية
    getFeatureName(feature) {
        const featureNames = {
            posts: 'المنشورات',
            messages: 'الرسائل',
            stories: 'الستوري',
            watch: 'المشاهدة',
            novels: 'الروايات'
        };
        return featureNames[feature] || feature;
    }

    // إعداد أدوات التحكم في لوحة الآدمن
    setupAdminControls() {
        // إعداد أزرار التحكم
        const lockToggle = document.getElementById('lockToggle');
        if (lockToggle) {
            lockToggle.addEventListener('click', () => {
                this.toggleAppLock();
            });
        }

        const exportBtn = document.getElementById('exportData');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportData();
            });
        }

        const clearBtn = document.getElementById('clearData');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.clearAllData();
            });
        }
    }

    // تبديل قفل التطبيق
    async toggleAppLock() {
        const settings = await window.dataManager.getSettings();
        
        if (settings.lockEnabled) {
            // إلغاء تفعيل القفل
            await window.authManager.disableLock();
            window.uiManager.showToast('تم إلغاء تفعيل القفل', 'info');
        } else {
            // تفعيل القفل
            const pin = prompt('أدخل رمز القفل (4 أرقام على الأقل):');
            if (pin && pin.length >= 4) {
                await window.authManager.enableLock(pin);
                window.uiManager.showToast('تم تفعيل القفل بنجاح', 'success');
            } else {
                window.uiManager.showToast('رمز القفل غير صالح', 'error');
            }
        }
        
        // إعادة تحميل البيانات
        this.loadAdminData();
    }

    // تصدير البيانات
    async exportData() {
        try {
            const data = {
                users: await window.dataManager.getUsers(),
                posts: await window.dataManager.getPosts(),
                messages: window.dataManager.getMessages(),
                novels: await window.dataManager.getNovels(),
                screenshots: await window.dataManager.getScreenshots(),
                settings: await window.dataManager.getSettings(),
                exportDate: new Date().toISOString()
            };

            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `mj36-data-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);

            window.uiManager.showToast('تم تصدير البيانات بنجاح', 'success');
        } catch (error) {
            window.uiManager.showToast('حدث خطأ أثناء تصدير البيانات', 'error');
        }
    }

    // مسح جميع البيانات
    clearAllData() {
        if (confirm('هل أنت متأكد من مسح جميع البيانات؟ هذا الإجراء لا يمكن التراجع عنه.')) {
            localStorage.clear();
            window.uiManager.showToast('تم مسح جميع البيانات', 'warning');
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        }
    }

    // تحميل بيانات الملف الشخصي
    loadProfileData() {
        const currentUser = window.authManager.getCurrentUser();
        if (!currentUser) return;

        const usernameInput = document.getElementById('profileUsername');
        const avatarImg = document.getElementById('profileAvatar');

        if (usernameInput) usernameInput.value = currentUser.username;
        if (avatarImg) avatarImg.src = currentUser.avatar;
    }

    // إعداد نموذج الملف الشخصي
    setupProfileForm() {
        const profileForm = document.getElementById('profileForm');
        if (profileForm) {
            profileForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.updateProfile(e.target);
            });
        }
    }

    // تحديث الملف الشخصي
    async updateProfile(form) {
        const formData = new FormData(form);
        const username = formData.get('username');
        const avatarFile = formData.get('avatar');

        const currentUser = window.authManager.getCurrentUser();
        if (!currentUser) return;

        try {
            // تحديث اسم المستخدم
            if (username && username !== currentUser.username) {
                // التحقق من عدم وجود المستخدم
                const existingUser = await window.dataManager.getUserByUsername(username);
                if (existingUser && existingUser.id !== currentUser.id) {
                    window.uiManager.showToast('اسم المستخدم موجود بالفعل', 'error');
                    return;
                }
                currentUser.username = username;
            }

            // تحديث الصورة الشخصية
            if (avatarFile && avatarFile.size > 0) {
                currentUser.avatar = URL.createObjectURL(avatarFile);
            }

            // حفظ التحديثات
            await window.authManager.saveSession(currentUser);
            this.updateUserInfo();

            window.uiManager.showToast('تم تحديث الملف الشخصي بنجاح', 'success');
        } catch (error) {
            window.uiManager.showToast('حدث خطأ أثناء التحديث', 'error');
        }
    }

    // إعداد نموذج المنشور
    setupPostForm() {
        const postForm = document.getElementById('postForm');
        if (postForm) {
            postForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.submitPost(e.target);
            });
        }
    }

    // إرسال منشور
    async submitPost(form) {
        const formData = new FormData(form);
        const content = formData.get('content');
        const imageFile = formData.get('image');

        const currentUser = window.authManager.getCurrentUser();
        if (!currentUser) return;

        try {
            let imagePath = null;
            if (imageFile && imageFile.size > 0) {
                imagePath = URL.createObjectURL(imageFile);
            }

            await window.dataManager.addPost({
                userId: currentUser.id,
                content: content.trim(),
                image: imagePath
            });

            window.uiManager.showToast('تم نشر المنشور بنجاح', 'success');
            form.reset();
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        } catch (error) {
            window.uiManager.showToast('حدث خطأ أثناء النشر', 'error');
        }
    }

    // إعداد رفع الوسائط
    setupMediaUpload() {
        const imageInput = document.getElementById('postImage');
        const imagePreview = document.getElementById('imagePreview');

        if (imageInput && imagePreview) {
            imageInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        imagePreview.innerHTML = `<img src="${e.target.result}" alt="معاينة الصورة">`;
                        imagePreview.style.display = 'block';
                    };
                    reader.readAsDataURL(file);
                } else {
                    imagePreview.style.display = 'none';
                }
            });
        }
    }

    // إعداد نموذج الستوري
    setupStoryForm() {
        const storyForm = document.getElementById('storyForm');
        if (storyForm) {
            storyForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.submitStory(e.target);
            });
        }
    }

    // إرسال ستوري
    async submitStory(form) {
        const formData = new FormData(form);
        const content = formData.get('content');
        const mediaFile = formData.get('media');

        const currentUser = window.authManager.getCurrentUser();
        if (!currentUser) return;

        try {
            let mediaPath = null;
            if (mediaFile && mediaFile.size > 0) {
                mediaPath = URL.createObjectURL(mediaFile);
            }

            await window.dataManager.addStory({
                userId: currentUser.id,
                content: content.trim(),
                media: mediaPath
            });

            window.uiManager.showToast('تم نشر الستوري بنجاح', 'success');
            form.reset();
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        } catch (error) {
            window.uiManager.showToast('حدث خطأ أثناء النشر', 'error');
        }
    }

    // إعداد رفع وسائط الستوري
    setupStoryMediaUpload() {
        const mediaInput = document.getElementById('storyMedia');
        const mediaPreview = document.getElementById('mediaPreview');

        if (mediaInput && mediaPreview) {
            mediaInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        if (file.type.startsWith('image/')) {
                            mediaPreview.innerHTML = `<img src="${e.target.result}" alt="معاينة الصورة">`;
                        } else if (file.type.startsWith('video/')) {
                            mediaPreview.innerHTML = `<video controls><source src="${e.target.result}" type="${file.type}"></video>`;
                        }
                        mediaPreview.style.display = 'block';
                    };
                    reader.readAsDataURL(file);
                } else {
                    mediaPreview.style.display = 'none';
                }
            });
        }
    }

    // إعداد نموذج الرواية
    setupNovelForm() {
        const novelForm = document.getElementById('novelForm');
        if (novelForm) {
            novelForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.submitNovel(e.target);
            });
        }
    }

    // إرسال رواية
    async submitNovel(form) {
        const formData = new FormData(form);
        const title = formData.get('title');
        const content = formData.get('content');

        const currentUser = window.authManager.getCurrentUser();
        if (!currentUser) return;

        try {
            await window.dataManager.addNovel({
                title: title.trim(),
                content: content.trim(),
                authorId: currentUser.id
            });

            window.uiManager.showToast('تم نشر الرواية بنجاح', 'success');
            form.reset();
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        } catch (error) {
            window.uiManager.showToast('حدث خطأ أثناء النشر', 'error');
        }
    }

    // إعداد مستمعي الأحداث العامة
    setupGlobalEventListeners() {
        // تبديل الثيم
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('theme-toggle')) {
                window.uiManager.toggleTheme();
            }
        });

        // تبديل اللغة
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('language-toggle')) {
                window.uiManager.toggleLanguage();
            }
        });

        // تسجيل الخروج
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('logout-btn')) {
                window.authManager.logout();
            }
        });
    }

    // الحصول على الصفحة الحالية
    getCurrentPage() {
        const path = window.location.pathname;
        const fileName = path.split('/').pop();
        
        if (fileName === 'login.html') return 'login';
        if (fileName === 'admin.html') return 'admin';
        if (fileName === 'profile.html') return 'profile';
        if (fileName === 'post.html') return 'post';
        if (fileName === 'story.html') return 'story';
        if (fileName === 'novel.html') return 'novel';
        
        return 'index';
    }

    // عرض حالة التحميل
    showLoading(form) {
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            const originalText = submitBtn.dataset.originalText || submitBtn.textContent;
            submitBtn.dataset.originalText = originalText;
            submitBtn.textContent = 'جاري التحميل...';
        }
    }

    // إخفاء حالة التحميل
    hideLoading(form) {
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = false;
            const originalText = submitBtn.dataset.originalText;
            if (originalText) {
                submitBtn.textContent = originalText;
            }
        }
    }

    // عرض رسالة خطأ
    showError(form, message) {
        // إزالة رسائل الخطأ السابقة
        const existingError = form.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }

        // إضافة رسالة خطأ جديدة
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        errorDiv.style.color = 'var(--danger-color)';
        errorDiv.style.marginTop = '1rem';
        errorDiv.style.textAlign = 'center';
        
        form.appendChild(errorDiv);

        // إزالة رسالة الخطأ بعد 5 ثوانِ
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 5000);
    }
}

// تهيئة التطبيق عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    window.app = new MJ36App();
});

