// Data Management - إدارة البيانات والحالة مع دمج Firebase
class DataManager {
    constructor() {
        this.storageKey = 'mj36_app_data'; // لا يزال يستخدم لحفظ بعض الإعدادات المحلية مثل الثيم
        this.messageCache = [];
        this.isFirebaseReady = false;
        
        this.initializeData();
        this.setupFirebaseConnection();
    }

    // إعداد اتصال Firebase
    setupFirebaseConnection() {
        if (window.firebaseManager) {
            window.firebaseManager.onInitialized(() => {
                this.isFirebaseReady = true;
                this.loadMessagesFromFirebase();
            });
        } else {
            // انتظار تحميل Firebase
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(() => {
                    if (window.firebaseManager) {
                        window.firebaseManager.onInitialized(() => {
                            this.isFirebaseReady = true;
                            this.loadMessagesFromFirebase();
                        });
                    }
                }, 1000);
            });
        }
    }

    // تحميل الرسائل من Firebase
    async loadMessagesFromFirebase() {
        if (!this.isFirebaseReady || !window.firebaseManager.isReady()) {
            return;
        }

        try {
            // جلب الرسائل الموجودة
            const existingMessages = await window.firebaseManager.getExistingMessages();
            this.messageCache = existingMessages;

            // الاستماع للرسائل الجديدة
            window.firebaseManager.listenForMessages((message) => {
                // التأكد من عدم تكرار الرسائل
                const exists = this.messageCache.find(m => m.id === message.id);
                if (!exists) {
                    this.messageCache.push(message);
                    this.notifyWatchers('newMessage', message);
                }
            });

            console.log(`Loaded ${existingMessages.length} messages from Firebase`);
        } catch (error) {
            console.error('Error loading messages from Firebase:', error);
        }
    }

    // تشفير كلمة المرور بسيط (SHA-256 بالمتصفح)
    async hashPassword(password) {
        const textEncoder = new TextEncoder();
        const data = textEncoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashedPassword = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashedPassword;
    }

    // تهيئة البيانات (لم تعد تعتمد على بيانات افتراضية)
    initializeData() {
        // لم تعد هناك بيانات افتراضية يتم تحميلها محلياً
        // كل البيانات ستأتي من Firebase
    }

    // جلب المستخدمين (من Firebase)
    async getUsers() {
        if (this.isFirebaseReady && window.firebaseManager.isReady()) {
            return await window.firebaseManager.getUsers();
        }
        return []; // لا يوجد مستخدمون محليون
    }

    // جلب مستخدم بالمعرف (من Firebase)
    async getUserById(id) {
        if (this.isFirebaseReady && window.firebaseManager.isReady()) {
            return await window.firebaseManager.getUserById(id);
        }
        return null;
    }

    // جلب مستخدم بالاسم (من Firebase)
    async getUserByUsername(username) {
        if (this.isFirebaseReady && window.firebaseManager.isReady()) {
            return await window.firebaseManager.getUserByUsername(username);
        }
        return null;
    }

    // إضافة مستخدم جديد (إلى Firebase)
    async addUser(userData) {
        if (this.isFirebaseReady && window.firebaseManager.isReady()) {
            const newUser = {
                id: Date.now().toString(), // معرف فريد
                ...userData,
                isAdmin: false,
                createdAt: new Date().toISOString(),
                lastActive: new Date().toISOString()
            };
            await window.firebaseManager.addUser(newUser);
            return newUser;
        }
        throw new Error("Firebase not ready to add user.");
    }

    // تحديث نشاط المستخدم (في Firebase)
    async updateUserActivity(userId) {
        if (this.isFirebaseReady && window.firebaseManager.isReady()) {
            await window.firebaseManager.logUserActivity(userId, 'activity_update');
        }
    }

    // جلب المنشورات (من Firebase)
    async getPosts() {
        if (this.isFirebaseReady && window.firebaseManager.isReady()) {
            return await window.firebaseManager.getPosts();
        }
        return [];
    }

    // إضافة منشور (إلى Firebase)
    async addPost(postData) {
        if (this.isFirebaseReady && window.firebaseManager.isReady()) {
            const newPost = {
                id: Date.now().toString(),
                ...postData,
                timestamp: new Date().toISOString(),
                likes: 0,
                likedBy: []
            };
            await window.firebaseManager.savePost(newPost);
            return newPost;
        }
        throw new Error("Firebase not ready to add post.");
    }

    // إعجاب بمنشور (في Firebase)
    async togglePostLike(postId, userId) {
        if (this.isFirebaseReady && window.firebaseManager.isReady()) {
            await window.firebaseManager.togglePostLike(postId, userId);
            // لا نحتاج لإرجاع المنشور هنا، Firebase سيقوم بالمزامنة
        }
    }

    // حذف منشور (من Firebase)
    async deletePost(postId) {
        if (this.isFirebaseReady && window.firebaseManager.isReady()) {
            await window.firebaseManager.deletePost(postId);
        }
    }

    // جلب الرسائل (من Firebase Cache)
    getMessages() {
        return this.messageCache.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
    }

    // إضافة رسالة (إلى Firebase)
    async addMessage(messageData) {
        if (this.isFirebaseReady && window.firebaseManager.isReady()) {
            const newMessage = {
                id: Date.now().toString(),
                ...messageData,
                timestamp: new Date().toISOString()
            };
            await window.firebaseManager.sendMessage(newMessage);
            return newMessage;
        }
        throw new Error("Firebase not ready to send message.");
    }

    // جلب الستوريات النشطة (من Firebase)
    async getActiveStories() {
        if (this.isFirebaseReady && window.firebaseManager.isReady()) {
            return await window.firebaseManager.getActiveStories();
        }
        return [];
    }

    // إضافة ستوري (إلى Firebase)
    async addStory(storyData) {
        if (this.isFirebaseReady && window.firebaseManager.isReady()) {
            const newStory = {
                id: Date.now().toString(),
                ...storyData,
                timestamp: new Date().toISOString(),
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 ساعة
            };
            await window.firebaseManager.saveStory(newStory);
            return newStory;
        }
        throw new Error("Firebase not ready to add story.");
    }

    // جلب الروايات (من Firebase)
    async getNovels() {
        if (this.isFirebaseReady && window.firebaseManager.isReady()) {
            return await window.firebaseManager.getNovels();
        }
        return [];
    }

    // إضافة رواية (إلى Firebase)
    async addNovel(novelData) {
        if (this.isFirebaseReady && window.firebaseManager.isReady()) {
            const newNovel = {
                id: Date.now().toString(),
                ...novelData,
                timestamp: new Date().toISOString()
            };
            await window.firebaseManager.saveNovel(newNovel);
            return newNovel;
        }
        throw new Error("Firebase not ready to add novel.");
    }

    // جلب الإعدادات (من Firebase)
    async getSettings() {
        if (this.isFirebaseReady && window.firebaseManager.isReady()) {
            return await window.firebaseManager.getSettings();
        }
        // إعدادات افتراضية إذا لم تكن Firebase جاهزة
        return {
            adminCode: 'Wwsdjehadadmen56780097gg',
            features: {
                posts: true,
                messages: true,
                stories: true,
                watch: true,
                novels: true
            },
            theme: 'light',
            language: 'ar',
            lockEnabled: false,
            lockPin: null
        };
    }

    // تحديث الإعدادات (في Firebase)
    async updateSettings(newSettings) {
        if (this.isFirebaseReady && window.firebaseManager.isReady()) {
            await window.firebaseManager.saveSettings(newSettings);
            this.notifyWatchers('settingsChanged', newSettings);
            return newSettings;
        }
        throw new Error("Firebase not ready to update settings.");
    }

    // تحديث حالة الميزة (في Firebase)
    async updateFeatureStatus(feature, status) {
        if (this.isFirebaseReady && window.firebaseManager.isReady()) {
            const currentSettings = await this.getSettings();
            currentSettings.features[feature] = status;
            await this.updateSettings(currentSettings);
            this.notifyWatchers('featureChanged', { feature, status });
        }
    }

    // جلب سجلات لقطات الشاشة (من Firebase)
    async getScreenshots() {
        if (this.isFirebaseReady && window.firebaseManager.isReady()) {
            return await window.firebaseManager.getScreenshots();
        }
        return [];
    }

    // إضافة سجل لقطة شاشة (إلى Firebase)
    async addScreenshot(userId, page) {
        if (this.isFirebaseReady && window.firebaseManager.isReady()) {
            const newScreenshot = {
                id: Date.now().toString(),
                userId,
                page,
                timestamp: new Date().toISOString()
            };
            await window.firebaseManager.saveScreenshot(newScreenshot);
            return newScreenshot;
        }
        throw new Error("Firebase not ready to add screenshot.");
    }

    // مراقبة التغييرات
    watchers = [];

    addWatcher(callback) {
        this.watchers.push(callback);
    }

    removeWatcher(callback) {
        this.watchers = this.watchers.filter(w => w !== callback);
    }

    notifyWatchers(event, data) {
        this.watchers.forEach(callback => {
            try {
                callback(event, data);
            } catch (error) {
                console.error('Error in watcher:', error);
            }
        });
    }
}

window.dataManager = new DataManager();


