# New Tab - 自定义浏览器新标签页

这是一个美观且实用的浏览器新标签页，具有时间显示、搜索引擎切换和常用网站快捷访问等功能。

![预览图](https://bing.biturl.top/?resolution=1920&format=image&index=0&mkt=zh-CN)

## 功能特性

### 1. 实时时钟
- 显示当前时间（24小时制）
- 显示详细日期信息（年月日及星期）
- 秒级更新，确保时间准确

### 2. 多搜索引擎支持
- 支持 Bing、Google 和百度三种搜索引擎
- 可通过下拉菜单快速切换搜索引擎
- 搜索记录本地保存，下次打开时自动恢复上次使用的搜索引擎
- 支持回车键快速搜索
- 支持按下 `/` 键快速聚焦到搜索框

### 3. 常用网站快捷访问
提供12个常用网站的快捷入口：
- 天气网
- Google 日历
- Bilibili
- 微博
- GitHub
- 知乎
- YouTube
- ChatGPT
- Gmail
- 淘宝
- X (Twitter)
- V2EX

### 4. 美观设计
- 采用毛玻璃效果界面设计
- 动态背景图片（每日 Bing 壁纸）
- 响应式布局，适配不同屏幕尺寸
- 图标悬停动画效果

## 技术实现

### 主要技术栈
- HTML5
- CSS3（包含毛玻璃效果、动画等现代特性）
- JavaScript（ES6+）
- Font Awesome 图标库
- Bing 壁纸 API

### 核心功能代码结构

#### 时间显示模块
```javascript
function updateClock() {
    const now = new Date();
    // 时间格式化 HH:MM:SS
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    document.getElementById('clock').innerText = `${h}:${m}:${s}`;
    
    // 日期格式化
    const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
    document.getElementById('date').innerText = now.toLocaleDateString('zh-CN', options);
}
```

#### 搜索功能模块
```javascript
function performSearch() {
    const engine = engineSelect.value;
    const query = document.getElementById('searchInput').value;
    if (!query) return;

    let url = '';
    if (engine === 'google') url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    else if (engine === 'bing') url = `https://www.bing.com/search?q=${encodeURIComponent(query)}`;
    else if (engine === 'baidu') url = `https://www.baidu.com/s?wd=${encodeURIComponent(query)}`;

    window.open(url, '_blank');
}
```

#### 网站快捷方式渲染
```javascript
const appConfig = [
    { name: "天气", url: "https://weather.com/zh-CN/", content: "fa-solid fa-cloud-sun" },
    { name: "日历", url: "https://calendar.google.com", content: "fa-regular fa-calendar-check" },
    // ...其他网站配置
];

function renderApps() {
    const grid = document.getElementById('appGrid');
    grid.innerHTML = ''; 

    appConfig.forEach(app => {
        const a = document.createElement('a');
        a.className = 'app-item';
        a.href = app.url;
        a.target = '_blank';

        const iconDiv = document.createElement('div');
        iconDiv.className = 'app-icon';
        iconDiv.innerHTML = `<i class="${app.content}"></i>`;

        const span = document.createElement('span');
        span.className = 'app-name';
        span.innerText = app.name;

        a.appendChild(iconDiv);
        a.appendChild(span);
        grid.appendChild(a);
    });
}
```

## 自定义配置

### 添加/修改网站快捷方式
在 `appConfig` 数组中添加或修改网站配置项：

```javascript
{
  name: "网站名称",      // 显示在图标下方的名称
  url: "https://...",   // 网站链接地址
  content: "fa-..."     // Font Awesome 图标类名
}
```

### 修改搜索引擎
在 HTML 的 [select](file:///D:/dev/newTab/index.html#L151-L157) 元素中添加新的选项，并在 JavaScript 的 `performSearch()` 函数中添加相应的处理逻辑。

## 使用方法

1. 将该文件设置为浏览器的新标签页（具体方法因浏览器而异）：
   - Chrome/Edge: 安装 "Custom New Tab" 类扩展程序，或替换浏览器新标签页文件
   - Firefox: 在设置中指定新标签页 URL

2. 直接在浏览器中打开该文件使用

## 浏览器兼容性

- Chrome 60+
- Firefox 54+
- Edge 79+
- Safari 11+

## 注意事项

1. 背景图片来源于 Bing 每日壁纸 API，需要网络连接才能正常显示
2. 搜索引擎选择会保存在浏览器本地存储中
3. 所有网站链接都会在新标签页中打开

## 许可证

该项目仅供个人使用，如需用于商业用途请遵守相关法律法规。