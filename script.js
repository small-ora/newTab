// --- 默认配置 (如果用户第一次使用) ---
const defaultApps = [
    { name: "天气", url: "https://weather.com/zh-CN/", content: "fa-solid fa-cloud-sun" },
    { name: "日历", url: "https://calendar.google.com", content: "fa-regular fa-calendar-check" },
    { name: "Bilibili", url: "https://www.bilibili.com", content: "fa-brands fa-bilibili" },
    { name: "微博", url: "https://weibo.com", content: "fa-brands fa-weibo" },
    { name: "GitHub", url: "https://github.com", content: "fa-brands fa-github" },
    { name: "知乎", url: "https://www.zhihu.com", content: "fa-brands fa-zhihu" },
    { name: "YouTube", url: "https://www.youtube.com", content: "fa-brands fa-youtube" },
    { name: "ChatGPT", url: "https://chat.openai.com", content: "fa-solid fa-robot" },
    { name: "Gmail", url: "https://mail.google.com", content: "fa-solid fa-envelope" },
    { name: "淘宝", url: "https://www.taobao.com", content: "fa-solid fa-bag-shopping" },
    { name: "X", url: "https://x.com", content: "fa-brands fa-twitter" },
    { name: "V2EX", url: "https://v2ex.com", content: "fa-solid fa-layer-group" },
];

let currentApps = [];
// 缓存DOM元素以提高性能
let domCache = {};
// 用于节流的变量
let lastRenderTime = 0;
const RENDER_INTERVAL = 16; // 约60fps

document.addEventListener('DOMContentLoaded', () => {
    // 缓存常用的DOM元素
    domCache = {
        clock: document.getElementById('clock'),
        date: document.getElementById('date'),
        engineSelect: document.getElementById('searchEngine'),
        searchInput: document.getElementById('searchInput'),
        searchBtn: document.getElementById('searchBtn'),
        appGrid: document.getElementById('appGrid'),
        appModal: document.getElementById('appModal'),
        refreshWallpaper: document.getElementById('refreshWallpaper')
    };
    
    initClock();
    initSearch();
    initApps();
    initWallpaper();
});

// --- 1. 时钟功能 ---
function initClock() {
    function updateClock() {
        const now = new Date();
        const h = String(now.getHours()).padStart(2, '0');
        const m = String(now.getMinutes()).padStart(2, '0');
        const s = String(now.getSeconds()).padStart(2, '0');
        domCache.clock.textContent = `${h}:${m}:${s}`;
        
        const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
        domCache.date.textContent = now.toLocaleDateString('zh-CN', options);
    }
    
    // 使用 requestAnimationFrame 来优化时钟更新
    function animateClock() {
        updateClock();
        requestAnimationFrame(animateClock);
    }
    
    // 仍然保留 setInterval 作为备选方案
    // setInterval(updateClock, 1000);
    requestAnimationFrame(animateClock);
}

// --- 2. 搜索功能 ---
function initSearch() {
    const { engineSelect, searchInput, searchBtn } = domCache;

    // 读取引擎设置
    if(localStorage.getItem('defaultEngine')) {
        engineSelect.value = localStorage.getItem('defaultEngine');
    }

    engineSelect.addEventListener('change', () => {
        localStorage.setItem('defaultEngine', engineSelect.value);
    });

    function performSearch() {
        const query = searchInput.value.trim();
        if (!query) return;
        
        let url = '';
        const engine = engineSelect.value;
        if (engine === 'google') url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
        else if (engine === 'bing') url = `https://www.bing.com/search?q=${encodeURIComponent(query)}`;
        else if (engine === 'baidu') url = `https://www.baidu.com/s?wd=${encodeURIComponent(query)}`;
        
        window.location.href = url; // 在当前标签页打开，或者用 window.open
    }

    searchBtn.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performSearch();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === '/' && document.activeElement !== searchInput) {
            e.preventDefault();
            searchInput.focus();
        }
    });
    
    setTimeout(() => searchInput.focus(), 100);
}

// --- 3. 图标管理 (核心新功能) ---
function initApps() {
    // 1. 读取数据
    chrome.storage.local.get(['apps'], (result) => {
        if (result.apps && result.apps.length > 0) {
            currentApps = result.apps;
        } else {
            currentApps = [...defaultApps];
        }
        renderApps();
    });

    // 2. 模态框按钮逻辑
    const { appModal } = domCache;
    const saveBtn = document.getElementById('saveBtn');
    const cancelBtn = document.getElementById('cancelBtn');

    // --- 新增：实时预览逻辑 START ---
    const iconInput = document.getElementById('appIcon');
    const iconPreview = document.querySelector('#iconPreview i');

    // 监听输入框变化
    iconInput.addEventListener('input', (e) => {
        const val = e.target.value.trim();
        // 如果输入为空，显示默认问号；否则显示输入的图标
        iconPreview.className = val || 'fa-solid fa-circle-question';
    });
    // --- 新增：实时预览逻辑 END ---

    saveBtn.addEventListener('click', saveNewApp);
    cancelBtn.addEventListener('click', () => { appModal.style.display = 'none'; });
    
    window.addEventListener('click', (e) => {
        if (e.target === appModal) appModal.style.display = 'none';
    });
}

// 优化渲染函数，避免频繁操作DOM
function renderApps() {
    const currentTime = performance.now();
    
    // 节流处理，避免过于频繁的渲染
    if (currentTime - lastRenderTime < RENDER_INTERVAL) {
        // 如果距离上次渲染时间太短，则延迟执行
        setTimeout(renderApps, RENDER_INTERVAL);
        return;
    }
    
    lastRenderTime = currentTime;
    const { appGrid } = domCache;
    
    // 使用文档片段减少重排次数
    const fragment = document.createDocumentFragment();
    
    // 渲染现有图标
    currentApps.forEach((app, index) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'app-item-wrapper';

        // 删除按钮
        const delBtn = document.createElement('button');
        delBtn.className = 'delete-btn';
        delBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
        delBtn.onclick = (e) => {
            e.stopPropagation(); // 防止触发跳转
            deleteApp(index);
        };

        // 图标主体
        const a = document.createElement('a');
        a.className = 'app-item';
        a.href = app.url;
        
        const iconDiv = document.createElement('div');
        iconDiv.className = 'app-icon';
        iconDiv.innerHTML = `<i class="${app.content}"></i>`;
        
        const span = document.createElement('span');
        span.className = 'app-name';
        span.textContent = app.name;

        a.appendChild(iconDiv);
        a.appendChild(span);
        
        wrapper.appendChild(delBtn);
        wrapper.appendChild(a);
        fragment.appendChild(wrapper);
    });

    // 渲染 "添加" 按钮
    const addWrapper = document.createElement('div');
    addWrapper.className = 'app-item-wrapper add-item';
    addWrapper.onclick = openAddModal;

    const addIconDiv = document.createElement('div');
    addIconDiv.className = 'app-icon';
    addIconDiv.innerHTML = '<i class="fa-solid fa-plus"></i>';

    const addSpan = document.createElement('span');
    addSpan.className = 'app-name';
    addSpan.textContent = '添加';

    addWrapper.appendChild(addIconDiv);
    addWrapper.appendChild(addSpan);
    fragment.appendChild(addWrapper);
    
    // 一次性更新DOM
    appGrid.innerHTML = '';
    appGrid.appendChild(fragment);
}

function deleteApp(index) {
    if (confirm('确定要删除这个图标吗？')) {
        currentApps.splice(index, 1);
        saveToStorage();
        renderApps();
    }
}

function openAddModal() {
    document.getElementById('appName').value = '';
    document.getElementById('appUrl').value = '';
    
    // 清空输入框并重置预览图标
    const iconInput = document.getElementById('appIcon');
    iconInput.value = '';
    
    // 重置为问号
    document.querySelector('#iconPreview i').className = 'fa-solid fa-circle-question';
    
    domCache.appModal.style.display = 'flex';
    
    // 自动聚焦第一个输入框
    setTimeout(() => document.getElementById('appName').focus(), 100);
}

function saveNewApp() {
    const name = document.getElementById('appName').value.trim();
    let url = document.getElementById('appUrl').value.trim();
    const icon = document.getElementById('appIcon').value.trim() || 'fa-solid fa-link';

    if (!name || !url) {
        alert('请输入名称和链接');
        return;
    }
    
    if (!url.startsWith('http')) {
        url = 'https://' + url;
    }

    currentApps.push({ name, url, content: icon });
    saveToStorage();
    domCache.appModal.style.display = 'none';
    renderApps();
}

function saveToStorage() {
    chrome.storage.local.set({ apps: currentApps });
}

// --- 4. 壁纸刷新功能 ---
function initWallpaper() {
    const { refreshWallpaper } = domCache;
    
    // 1. 尝试从缓存加载，实现“秒开”
    const cachedUrl = localStorage.getItem('wallpaperUrl');
    if (cachedUrl) {
        document.body.style.backgroundImage = `url('${cachedUrl}')`;
    } else {
        // 无缓存（首次使用），则获取新壁纸
        setRandomWallpaper();
    }

    refreshWallpaper.addEventListener('click', () => {
        // 添加旋转动画类
        refreshWallpaper.style.transition = 'transform 0.3s ease';
        refreshWallpaper.style.transform = 'rotate(360deg)';
        setTimeout(() => {
            refreshWallpaper.style.transition = '';
            refreshWallpaper.style.transform = '';
        }, 300);
        
        // 点击按钮强制刷新
        setRandomWallpaper(true);
    });
}

function setRandomWallpaper(forceRefresh = false) {
    // Bing 接口支持 index 0-7，我们随机取一个
    const randomIndex = Math.floor(Math.random() * 8); 
    
    let bgUrl = `https://bing.biturl.top/?resolution=1920&format=image&index=${randomIndex}&mkt=zh-CN`;
    
    // 只有强制刷新时才加时间戳，避免破坏浏览器缓存，同时保证获取新图
    if (forceRefresh) {
        bgUrl += `&t=${new Date().getTime()}`;
    }
    
    // 创建一个 img 对象预加载，防止背景闪烁白屏
    const img = new Image();
    img.src = bgUrl;
    
    // 仅在没有背景（首次加载且无缓存）或强制刷新时显示加载状态
    if (!document.body.style.backgroundImage || forceRefresh) {
        document.body.classList.add('loading-wallpaper');
    }
    
    img.onload = () => {
        document.body.style.backgroundImage = `url('${bgUrl}')`;
        document.body.classList.remove('loading-wallpaper');
        // 缓存当前壁纸 URL
        localStorage.setItem('wallpaperUrl', bgUrl);
    };
    
    img.onerror = () => {
        // 如果图片加载失败
        console.error('Wallpaper load failed');
        document.body.classList.remove('loading-wallpaper');
        // 如果当前没有背景，使用默认色
        if (!document.body.style.backgroundImage) {
            document.body.style.backgroundColor = '#333';
        }
    };
}