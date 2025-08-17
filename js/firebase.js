// Firebase Configuration and Management - إدارة Firebase مع جميع الميزات
class FirebaseManager {
    constructor() {
        this.app = null;
        this.database = null;
        this.analytics = null;
        this.isInitialized = false;
        this.initializationCallbacks = [];
        
        this.initialize();
    }

    // تهيئة Firebase
    async initialize() {
        try {
            // إعدادات Firebase
            const firebaseConfig = {
                apiKey: "AIzaSyDAESNvfUuhHdlLQLt-paJHIWtypYLZN64",
                authDomain: "jehad-fdf3b.firebaseapp.com",
                databaseURL: "https://jehad-fdf3b-default-rtdb.europe-west1.firebasedatabase.app",
                projectId: "jehad-fdf3b",
                storageBucket: "jehad-fdf3b.firebasestorage.app",
                messagingSenderId: "337523232354",
                appId: "1:337523232354:web:19ec6c1cadb1ea7db40b3b",
                measurementId: "G-TQ2H75KK4S"
            };

            // تهيئة Firebase
            this.app = firebase.initializeApp(firebaseConfig);
            this.database = firebase.database();
            
            // تهيئة Analytics (اختياري)
            try {
                this.analytics = firebase.analytics();
            } catch (error) {
                console.warn('Analytics not available:', error);
            }

            this.isInitialized = true;
            console.log('Firebase initialized successfully');

            // تشغيل callbacks التهيئة
            this.initializationCallbacks.forEach(callback => {
                try {
                    callback();
                } catch (error) {
                    console.error('Error in initialization callback:', error);
                }
            });

        } catch (error) {
            console.error('Error initializing Firebase:', error);
            this.isInitialized = false;
        }
    }

    // إضافة callback للتهيئة
    onInitialized(callback) {
        if (this.isInitialized) {
            callback();
        } else {
            this.initializationCallbacks.push(callback);
        }
    }

    // التحقق من حالة التهيئة
    isReady() {
        return this.isInitialized && this.database !== null;
    }

    // === وظائف الرسائل ===

    // إرسال رسالة
    async sendMessage(messageData) {
        if (!this.isReady()) {
            throw new Error('Firebase not ready');
        }

        try {
            const messageRef = this.database.ref('messages').push();
            const messageId = messageRef.key;
            
            const message = {
                id: messageId,
                senderId: messageData.senderId,
                receiverId: messageData.receiverId,
                content: messageData.content,
                type: messageData.type || 'text',
                timestamp: firebase.database.ServerValue.TIMESTAMP,
                read: false
            };

            await messageRef.set(message);
            console.log('Message sent successfully:', messageId);
            
            return { ...message, timestamp: Date.now() };
        } catch (error) {
            console.error('Error sending message:', error);
            throw error;
        }
    }

    // جلب الرسائل الموجودة
    async getExistingMessages() {
        if (!this.isReady()) {
            return [];
        }

        try {
            const snapshot = await this.database.ref('messages').orderByChild('timestamp').once('value');
            const messages = [];
            
            snapshot.forEach(childSnapshot => {
                const message = childSnapshot.val();
                if (message) {
                    messages.push(message);
                }
            });

            console.log(`Loaded ${messages.length} existing messages`);
            return messages;
        } catch (error) {
            console.error('Error fetching existing messages:', error);
            return [];
        }
    }

    // الاستماع للرسائل الجديدة
    listenForMessages(callback) {
        if (!this.isReady()) {
            console.warn('Firebase not ready for listening to messages');
            return;
        }

        try {
            this.database.ref('messages').on('child_added', (snapshot) => {
                const message = snapshot.val();
                if (message && callback) {
                    callback(message);
                }
            });

            console.log('Started listening for new messages');
        } catch (error) {
            console.error('Error setting up message listener:', error);
        }
    }

    // === وظائف المنشورات ===

    // حفظ منشور
    async savePost(postData) {
        if (!this.isReady()) {
            throw new Error('Firebase not ready');
        }

        try {
            const postRef = this.database.ref('posts').push();
            const postId = postRef.key;
            
            const post = {
                id: postId,
                userId: postData.userId,
                content: postData.content,
                image: postData.image || null,
                timestamp: firebase.database.ServerValue.TIMESTAMP,
                likes: 0,
                likedBy: []
            };

            await postRef.set(post);
            console.log('Post saved successfully:', postId);
            
            return { ...post, timestamp: Date.now() };
        } catch (error) {
            console.error('Error saving post:', error);
            throw error;
        }
    }

    // جلب المنشورات
    async getPosts() {
        if (!this.isReady()) {
            return [];
        }

        try {
            const snapshot = await this.database.ref('posts').orderByChild('timestamp').once('value');
            const posts = [];
            
            snapshot.forEach(childSnapshot => {
                const post = childSnapshot.val();
                if (post) {
                    posts.push(post);
                }
            });

            // ترتيب المنشورات من الأحدث للأقدم
            posts.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
            
            console.log(`Loaded ${posts.length} posts`);
            return posts;
        } catch (error) {
            console.error('Error fetching posts:', error);
            return [];
        }
    }

    // تحديث إعجاب المنشور
    async togglePostLike(postId, userId, isLiked) {
        if (!this.isReady()) {
            throw new Error('Firebase not ready');
        }

        try {
            const postRef = this.database.ref(`posts/${postId}`);
            const snapshot = await postRef.once('value');
            const post = snapshot.val();
            
            if (!post) {
                throw new Error('Post not found');
            }

            const likedBy = post.likedBy || [];
            const likes = post.likes || 0;

            if (isLiked) {
                // إضافة إعجاب
                if (!likedBy.includes(userId)) {
                    likedBy.push(userId);
                }
            } else {
                // إزالة إعجاب
                const index = likedBy.indexOf(userId);
                if (index > -1) {
                    likedBy.splice(index, 1);
                }
            }

            await postRef.update({
                likes: likedBy.length,
                likedBy: likedBy
            });

            console.log('Post like updated successfully');
        } catch (error) {
            console.error('Error updating post like:', error);
            throw error;
        }
    }

    // === وظائف الستوري ===

    // حفظ ستوري
    async saveStory(storyData) {
        if (!this.isReady()) {
            throw new Error('Firebase not ready');
        }

        try {
            const storyRef = this.database.ref('stories').push();
            const storyId = storyRef.key;
            
            const story = {
                id: storyId,
                userId: storyData.userId,
                content: storyData.content,
                media: storyData.media || null,
                timestamp: firebase.database.ServerValue.TIMESTAMP,
                expiresAt: storyData.expiresAt
            };

            await storyRef.set(story);
            console.log('Story saved successfully:', storyId);
            
            return { ...story, timestamp: Date.now() };
        } catch (error) {
            console.error('Error saving story:', error);
            throw error;
        }
    }

    // جلب الستوريات النشطة
    async getActiveStories() {
        if (!this.isReady()) {
            return [];
        }

        try {
            const now = Date.now();
            const snapshot = await this.database.ref('stories').orderByChild('timestamp').once('value');
            const stories = [];
            
            snapshot.forEach(childSnapshot => {
                const story = childSnapshot.val();
                if (story && new Date(story.expiresAt).getTime() > now) {
                    stories.push(story);
                }
            });

            console.log(`Loaded ${stories.length} active stories`);
            return stories;
        } catch (error) {
            console.error('Error fetching active stories:', error);
            return [];
        }
    }

    // === وظائف الروايات ===

    // حفظ رواية
    async saveNovel(novelData) {
        if (!this.isReady()) {
            throw new Error('Firebase not ready');
        }

        try {
            const novelRef = this.database.ref('novels').push();
            const novelId = novelRef.key;
            
            const novel = {
                id: novelId,
                title: novelData.title,
                content: novelData.content,
                authorId: novelData.authorId,
                timestamp: firebase.database.ServerValue.TIMESTAMP
            };

            await novelRef.set(novel);
            console.log('Novel saved successfully:', novelId);
            
            return { ...novel, timestamp: Date.now() };
        } catch (error) {
            console.error('Error saving novel:', error);
            throw error;
        }
    }

    // جلب الروايات
    async getNovels() {
        if (!this.isReady()) {
            return [];
        }

        try {
            const snapshot = await this.database.ref('novels').orderByChild('timestamp').once('value');
            const novels = [];
            
            snapshot.forEach(childSnapshot => {
                const novel = childSnapshot.val();
                if (novel) {
                    novels.push(novel);
                }
            });

            // ترتيب الروايات من الأحدث للأقدم
            novels.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
            
            console.log(`Loaded ${novels.length} novels`);
            return novels;
        } catch (error) {
            console.error('Error fetching novels:', error);
            return [];
        }
    }

    // === وظائف المستخدمين ===

    // حفظ بيانات المستخدم
    async saveUserData(userId, userData) {
        if (!this.isReady()) {
            throw new Error('Firebase not ready');
        }

        try {
            const userRef = this.database.ref(`users/${userId}`);
            await userRef.update({
                ...userData,
                lastUpdated: firebase.database.ServerValue.TIMESTAMP
            });

            console.log('User data saved successfully:', userId);
        } catch (error) {
            console.error('Error saving user data:', error);
            throw error;
        }
    }

    // جلب بيانات المستخدم
    async getUserData(userId) {
        if (!this.isReady()) {
            return null;
        }

        try {
            const snapshot = await this.database.ref(`users/${userId}`).once('value');
            return snapshot.val();
        } catch (error) {
            console.error('Error fetching user data:', error);
            return null;
        }
    }

    // === وظائف الإعدادات ===

    // حفظ الإعدادات
    async saveSettings(settings) {
        if (!this.isReady()) {
            throw new Error('Firebase not ready');
        }

        try {
            await this.database.ref('settings').set({
                ...settings,
                lastUpdated: firebase.database.ServerValue.TIMESTAMP
            });

            console.log('Settings saved successfully');
        } catch (error) {
            console.error('Error saving settings:', error);
            throw error;
        }
    }

    // جلب الإعدادات
    async getSettings() {
        if (!this.isReady()) {
            return null;
        }

        try {
            const snapshot = await this.database.ref('settings').once('value');
            return snapshot.val();
        } catch (error) {
            console.error('Error fetching settings:', error);
            return null;
        }
    }

    // === وظائف تسجيل النشاط ===

    // تسجيل نشاط المستخدم
    async logUserActivity(userId, activityType, data = {}) {
        if (!this.isReady()) {
            return;
        }

        try {
            const activityRef = this.database.ref('activities').push();
            
            const activity = {
                userId: userId,
                type: activityType,
                data: data,
                timestamp: firebase.database.ServerValue.TIMESTAMP,
                userAgent: navigator.userAgent,
                url: window.location.href
            };

            await activityRef.set(activity);
            console.log('User activity logged:', activityType);
        } catch (error) {
            console.error('Error logging user activity:', error);
        }
    }

    // === وظائف الإحصائيات ===

    // جلب إحصائيات الاستخدام
    async getUsageStats() {
        if (!this.isReady()) {
            return null;
        }

        try {
            const [messagesSnapshot, postsSnapshot, storiesSnapshot, novelsSnapshot] = await Promise.all([
                this.database.ref('messages').once('value'),
                this.database.ref('posts').once('value'),
                this.database.ref('stories').once('value'),
                this.database.ref('novels').once('value')
            ]);

            const stats = {
                totalMessages: messagesSnapshot.numChildren(),
                totalPosts: postsSnapshot.numChildren(),
                totalStories: storiesSnapshot.numChildren(),
                totalNovels: novelsSnapshot.numChildren(),
                lastUpdated: Date.now()
            };

            console.log('Usage stats:', stats);
            return stats;
        } catch (error) {
            console.error('Error fetching usage stats:', error);
            return null;
        }
    }

    // === وظائف الصيانة ===

    // تنظيف البيانات القديمة
    async cleanupOldData() {
        if (!this.isReady()) {
            return;
        }

        try {
            const now = Date.now();
            const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);

            // حذف الستوريات المنتهية الصلاحية
            const storiesSnapshot = await this.database.ref('stories').once('value');
            const expiredStories = [];

            storiesSnapshot.forEach(childSnapshot => {
                const story = childSnapshot.val();
                if (story && new Date(story.expiresAt).getTime() < now) {
                    expiredStories.push(childSnapshot.key);
                }
            });

            // حذف الستوريات المنتهية الصلاحية
            for (const storyId of expiredStories) {
                await this.database.ref(`stories/${storyId}`).remove();
            }

            // حذف الأنشطة القديمة (أكثر من 30 يوم)
            const activitiesSnapshot = await this.database.ref('activities').orderByChild('timestamp').endAt(thirtyDaysAgo).once('value');
            const oldActivities = [];

            activitiesSnapshot.forEach(childSnapshot => {
                oldActivities.push(childSnapshot.key);
            });

            for (const activityId of oldActivities) {
                await this.database.ref(`activities/${activityId}`).remove();
            }

            console.log(`Cleanup completed: ${expiredStories.length} expired stories, ${oldActivities.length} old activities removed`);
        } catch (error) {
            console.error('Error during cleanup:', error);
        }
    }

    // === وظائف النسخ الاحتياطي ===

    // إنشاء نسخة احتياطية
    async createBackup() {
        if (!this.isReady()) {
            throw new Error('Firebase not ready');
        }

        try {
            const [messages, posts, stories, novels, settings] = await Promise.all([
                this.database.ref('messages').once('value'),
                this.database.ref('posts').once('value'),
                this.database.ref('stories').once('value'),
                this.database.ref('novels').once('value'),
                this.database.ref('settings').once('value')
            ]);

            const backup = {
                messages: messages.val() || {},
                posts: posts.val() || {},
                stories: stories.val() || {},
                novels: novels.val() || {},
                settings: settings.val() || {},
                timestamp: Date.now(),
                version: '1.0'
            };

            // حفظ النسخة الاحتياطية
            const backupRef = this.database.ref('backups').push();
            await backupRef.set(backup);

            console.log('Backup created successfully:', backupRef.key);
            return backupRef.key;
        } catch (error) {
            console.error('Error creating backup:', error);
            throw error;
        }
    }

    // === وظائف المراقبة ===

    // مراقبة حالة الاتصال
    monitorConnection(callback) {
        if (!this.isReady()) {
            return;
        }

        this.database.ref('.info/connected').on('value', (snapshot) => {
            const connected = snapshot.val() === true;
            console.log('Firebase connection status:', connected ? 'Connected' : 'Disconnected');
            
            if (callback) {
                callback(connected);
            }
        });
    }

    // إيقاف جميع المستمعين
    disconnect() {
        if (this.database) {
            this.database.ref().off();
            console.log('Firebase listeners disconnected');
        }
    }
}

// إنشاء مثيل عام لإدارة Firebase
window.firebaseManager = new FirebaseManager();

// تنظيف دوري للبيانات القديمة (كل 24 ساعة)
setInterval(() => {
    if (window.firebaseManager && window.firebaseManager.isReady()) {
        window.firebaseManager.cleanupOldData();
    }
}, 24 * 60 * 60 * 1000);

// مراقبة حالة الاتصال
if (window.firebaseManager) {
    window.firebaseManager.monitorConnection((connected) => {
        // يمكن إضافة منطق إضافي هنا للتعامل مع تغيير حالة الاتصال
        if (window.uiManager) {
            window.uiManager.showConnectionStatus();
        }
    });
}

