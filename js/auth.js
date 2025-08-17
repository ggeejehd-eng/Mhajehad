// Authentication - المصادقة وإدارة الجلسات مع دمج Firebase
class AuthManager {
    constructor() {
        this.sessionKey = 'mj36_session';
        this.lockKey = 'mj36_lock_state';
        this.currentUser = null;
        this.isLocked = false;
        this.isFirebaseReady = false;
        
        this.initializeAuth();
    }

    // تهيئة المصادقة
    initializeAuth() {
        this.loadSession();
        this.checkLockState();
        this.setupFirebaseConnection();
    }

    // إعداد اتصال Firebase
    setupFirebaseConnection() {
        if (window.firebaseManager) {
            window.firebaseManager.onInitialized(() => {
                this.isFirebaseReady = true;
                this.syncUserDataWithFirebase();
            });
        } else {
            // انتظار تحميل Firebase
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(() => {
                    if (window.firebaseManager) {
                        window.firebaseManager.onInitialized(() => {
                            this.isFirebaseReady = true;
                            this.syncUserDataWithFirebase();
                        });
                    }
                }, 1000);
            });
        }
    }

    // مزامنة بيانات المستخدم مع Firebase
    async syncUserDataWithFirebase() {
        if (!this.isFirebaseReady || !this.currentUser) {
            return;
        }

        try {
            // حفظ بيانات المستخدم الحالي في Firebase
            await window.firebaseManager.saveUserData(this.currentUser.id, {
                id: this.currentUser.id,
                username: this.currentUser.username,
                avatar: this.currentUser.avatar,
                isAdmin: this.currentUser.isAdmin,
                lastActive: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error syncing user data with Firebase:', error);
        }
    }

    // تحميل الجلسة المحفوظة
    loadSession() {
        const sessionData = localStorage.getItem(this.sessionKey);
        if (sessionData) {
            try {
                const session = JSON.parse(sessionData);
                // التحقق من صحة الجلسة
                if (this.isValidSession(session)) {
                    this.currentUser = session.user;
                    this.updateUserActivity();
                } else {
                    this.clearSession();
                }
            } catch (error) {
                console.error('Error loading session:', error);
                this.clearSession();
            }
        }
    }

    // التحقق من صحة الجلسة
    isValidSession(session) {
        if (!session || !session.user || !session.timestamp) {
            return false;
        }
        
        // التحقق من انتهاء صلاحية الجلسة (7 أيام)
        const sessionAge = Date.now() - new Date(session.timestamp).getTime();
        const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 أيام
        
        if (sessionAge > maxAge) {
            return false;
        }

        // التحقق من وجود المستخدم في قاعدة البيانات (Firebase)
        // لا يمكن التحقق هنا بشكل متزامن، سيتم التحقق عند محاولة الوصول للبيانات
        return true;
    }

    // حفظ الجلسة
    async saveSession(user) {
        const sessionData = {
            user: {
                id: user.id,
                username: user.username,
                avatar: user.avatar,
                isAdmin: user.isAdmin
            },
            timestamp: new Date().toISOString()
        };
        
        localStorage.setItem(this.sessionKey, JSON.stringify(sessionData));
        this.currentUser = sessionData.user;

        // حفظ في Firebase أيضاً
        if (this.isFirebaseReady && window.firebaseManager.isReady()) {
            try {
                await window.firebaseManager.saveUserData(user.id, {
                    ...sessionData.user,
                    lastLogin: new Date().toISOString(),
                    sessionActive: true
                });
            } catch (error) {
                console.error('Error saving session to Firebase:', error);
            }
        }
    }

    // مسح الجلسة
    async clearSession() {
        if (this.currentUser && this.isFirebaseReady && window.firebaseManager.isReady()) {
            try {
                // تحديث حالة الجلسة في Firebase
                await window.firebaseManager.saveUserData(this.currentUser.id, {
                    sessionActive: false,
                    lastLogout: new Date().toISOString()
                });
            } catch (error) {
                console.error('Error updating session in Firebase:', error);
            }
        }

        localStorage.removeItem(this.sessionKey);
        this.currentUser = null;
    }

    // التحقق من رمز الآدمن
    verifyAdminCode(code) {
        const settings = window.dataManager.getSettings();
        return code === settings.adminCode;
    }

    // تسجيل الدخول
    async login(username, password) {
        try {
            // التحقق من المستخدم في Firebase
            const user = await window.firebaseManager.getUserByUsername(username);
            if (!user) {
                throw new Error('اسم المستخدم غير موجود');
            }

            // التحقق من كلمة المرور (باستخدام SHA-256)
            const hashedPassword = await window.dataManager.hashPassword(password);
            if (hashedPassword !== user.password) {
                throw new Error('كلمة المرور غير صحيحة');
            }

            // حفظ الجلسة
            await this.saveSession(user);
            this.updateUserActivity();

            // تسجيل نشاط تسجيل الدخول في Firebase
            if (this.isFirebaseReady && window.firebaseManager.isReady()) {
                try {
                    await window.firebaseManager.logUserActivity(user.id, 'login');
                } catch (error) {
                    console.error('Error logging login activity:', error);
                }
            }

            return {
                success: true,
                user: this.currentUser
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // إنشاء حساب جديد
    async register(username, password, avatar = null) {
        try {
            // التحقق من عدم وجود المستخدم في Firebase
            const existingUser = await window.firebaseManager.getUserByUsername(username);
            if (existingUser) {
                throw new Error('اسم المستخدم موجود بالفعل');
            }

            // التحقق من قوة كلمة المرور
            if (password.length < 6) {
                throw new Error('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
            }

            // تجزئة كلمة المرور
            const hashedPassword = await window.dataManager.hashPassword(password);

            // إنشاء المستخدم الجديد في Firebase
            const newUser = await window.firebaseManager.addUser({
                username,
                password: hashedPassword,
                avatar: avatar || 'assets/images/avatar-male.png',
                isAdmin: false, // المستخدمون الجدد ليسوا آدمن افتراضياً
                createdAt: new Date().toISOString()
            });

            // حفظ الجلسة
            await this.saveSession(newUser);

            // تسجيل نشاط إنشاء الحساب في Firebase
            if (this.isFirebaseReady && window.firebaseManager.isReady()) {
                try {
                    await window.firebaseManager.logUserActivity(newUser.id, 'register');
                } catch (error) {
                    console.error('Error saving new user to Firebase:', error);
                }
            }

            return {
                success: true,
                user: this.currentUser
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // تسجيل الخروج
    async logout() {
        // تسجيل نشاط تسجيل الخروج في Firebase
        if (this.currentUser && this.isFirebaseReady && window.firebaseManager.isReady()) {
            try {
                await window.firebaseManager.logUserActivity(this.currentUser.id, 'logout');
            } catch (error) {
                console.error('Error logging logout activity:', error);
            }
        }

        await this.clearSession();
        this.clearLockState();
        window.location.href = 'login.html';
    }

    // التحقق من تسجيل الدخول
    isLoggedIn() {
        return this.currentUser !== null;
    }

    // الحصول على المستخدم الحالي
    getCurrentUser() {
        return this.currentUser;
    }

    // التحقق من صلاحيات الآدمن
    isAdmin() {
        return this.currentUser && this.currentUser.isAdmin;
    }

    // تحديث نشاط المستخدم
    async updateUserActivity() {
        if (this.currentUser) {
            // تحديث النشاط في Firebase
            if (this.isFirebaseReady && window.firebaseManager.isReady()) {
                try {
                    await window.firebaseManager.saveUserData(this.currentUser.id, {
                        lastActive: new Date().toISOString()
                    });
                } catch (error) {
                    console.error('Error updating user activity in Firebase:', error);
                }
            }
        }
    }

    // إدارة القفل الداخلي
    checkLockState() {
        const lockState = localStorage.getItem(this.lockKey);
        if (lockState) {
            const lockData = JSON.parse(lockState);
            this.isLocked = lockData.isLocked;
        }
    }

    // تفعيل القفل
    async enableLock(pin) {
        if (!pin || pin.length < 4) {
            throw new Error('الرمز يجب أن يكون 4 أرقام على الأقل');
        }

        const hashedPin = await window.dataManager.hashPassword(pin);
        
        await window.firebaseManager.updateSettings({
            lockEnabled: true,
            lockPin: hashedPin
        });

        // تسجيل تفعيل القفل في Firebase
        if (this.currentUser && this.isFirebaseReady && window.firebaseManager.isReady()) {
            try {
                await window.firebaseManager.logUserActivity(this.currentUser.id, 'lock_enabled');
            } catch (error) {
                console.error('Error logging lock enable activity:', error);
            }
        }

        this.showLockOverlay();
        
        return true;
    }

    // تعطيل القفل
    async disableLock() {
        await window.firebaseManager.updateSettings({
            lockEnabled: false,
            lockPin: null
        });

        // تسجيل تعطيل القفل في Firebase
        if (this.currentUser && this.isFirebaseReady && window.firebaseManager.isReady()) {
            try {
                await window.firebaseManager.logUserActivity(this.currentUser.id, 'lock_disabled');
            }
        }

        this.clearLockState();
        this.hideLockOverlay();
        
        return true;
    }

    // قفل التطبيق
    async lockApp() {
        const settings = await window.firebaseManager.getSettings();
        if (settings && settings.lockEnabled) {
            this.isLocked = true;
            localStorage.setItem(this.lockKey, JSON.stringify({
                isLocked: true,
                timestamp: new Date().toISOString()
            }));

            // تسجيل قفل التطبيق في Firebase
            if (this.currentUser && this.isFirebaseReady && window.firebaseManager.isReady()) {
                try {
                    await window.firebaseManager.logUserActivity(this.currentUser.id, 'app_locked');
                }
            }

            this.showLockOverlay();
        }
    }

    // إلغاء قفل التطبيق
    async unlockApp(pin) {
        const settings = await window.firebaseManager.getSettings();
        
        if (!settings || !settings.lockEnabled || !settings.lockPin) {
            return { success: false, error: 'القفل غير مفعل' };
        }

        const hashedPin = await window.dataManager.hashPassword(pin);
        if (hashedPin === settings.lockPin) {
            this.isLocked = false;
            this.clearLockState();
            this.hideLockOverlay();

            // تسجيل إلغاء قفل التطبيق في Firebase
            if (this.currentUser && this.isFirebaseReady && window.firebaseManager.isReady()) {
                try {
                    await window.firebaseManager.logUserActivity(this.currentUser.id, 'app_unlocked');
                }
            }

            return { success: true };
        } else {
            return { success: false, error: 'الرمز غير صحيح' };
        }
    }

    // مسح حالة القفل
    clearLockState() {
        localStorage.removeItem(this.lockKey);
        this.isLocked = false;
    }

    // عرض واجهة القفل
    showLockOverlay() {
        // إنشاء واجهة القفل إذا لم تكن موجودة
        let lockOverlay = document.getElementById('lockOverlay');
        if (!lockOverlay) {
            lockOverlay = this.createLockOverlay();
            document.body.appendChild(lockOverlay);
        }
        
        lockOverlay.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    // إخفاء واجهة القفل
    hideLockOverlay() {
        const lockOverlay = document.getElementById('lockOverlay');
        if (lockOverlay) {
            lockOverlay.style.display = 'none';
            document.body.style.overflow = '';
        }
    }

    // إنشاء واجهة القفل
    createLockOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'lockOverlay';
        overlay.className = 'lock-overlay';
        overlay.innerHTML = `
            <div class="lock-content">
                <div class="lock-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                        <circle cx="12" cy="16" r="1"/>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                </div>
                <h2>التطبيق مقفل</h2>
                <p>أدخل الرمز لإلغاء القفل</p>
                <form id="unlockForm">
                    <input type="password" id="unlockPin" placeholder="أدخل الرمز" maxlength="10" required>
                    <button type="submit" class="btn btn-primary">إلغاء القفل</button>
                </form>
                <div id="unlockError" class="error-message" style="display: none;"></div>
            </div>
        `;

        // إضافة الأنماط
        const style = document.createElement('style');
        style.textContent = `
            .lock-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.9);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                backdrop-filter: blur(10px);
            }
            
            .lock-content {
                background: var(--bg-card);
                padding: 2rem;
                border-radius: 1rem;
                text-align: center;
                max-width: 400px;
                width: 90%;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
            }
            
            .lock-icon {
                color: var(--primary-color);
                margin-bottom: 1rem;
            }
            
            .lock-content h2 {
                margin-bottom: 0.5rem;
                color: var(--text-primary);
            }
            
            .lock-content p {
                margin-bottom: 1.5rem;
                color: var(--text-secondary);
            }
            
            .lock-content form {
                display: flex;
                flex-direction: column;
                gap: 1rem;
            }
            
            .lock-content input[type="password"] {
                padding: 0.8rem;
                border: 1px solid var(--border-color);
                border-radius: 0.5rem;
                font-size: 1.1rem;
                text-align: center;
                background: var(--bg-secondary);
                color: var(--text-primary);
            }
            
            .lock-content input[type="password"]:focus {
                outline: none;
                border-color: var(--primary-color);
                box-shadow: 0 0 0 3px rgba(233, 30, 99, 0.2);
            }
            
            .lock-content .btn {
                padding: 0.8rem;
                font-size: 1.1rem;
                border-radius: 0.5rem;
                background: var(--primary-color);
                color: white;
                border: none;
                cursor: pointer;
                transition: background-color 0.3s ease;
            }
            
            .lock-content .btn:hover {
                background: var(--primary-dark);
            }
            
            .error-message {
                color: var(--danger-color);
                margin-top: 1rem;
                font-size: 0.9rem;
            }
        `;
        document.head.appendChild(style);

        overlay.querySelector('#unlockForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const pin = overlay.querySelector('#unlockPin').value;
            const result = await this.unlockApp(pin);
            const errorMessage = overlay.querySelector('#unlockError');
            if (!result.success) {
                errorMessage.textContent = result.error;
                errorMessage.style.display = 'block';
            } else {
                errorMessage.style.display = 'none';
            }
        });

        return overlay;
    }
}

window.authManager = new AuthManager();


