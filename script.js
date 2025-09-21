// ==UserScript==
// @name         B站直播摸鱼模式|偷偷看直播|上班摸鱼
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  隐身模式下伪装成AI聊天界面，支持拖动按钮和随机间隔自动发送
// @author       小派sama
// @match        https://live.bilibili.com/*
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// @license      GPL-3.0-only
// ==/UserScript==

(function() {
    'use strict';

    // 添加样式
    GM_addStyle(`
        #stealth-mode-btn {
            position: fixed;
            bottom: 100px;
            right: -25px;
            z-index: 10000;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background: #FB7299;
            color: white;
            border: none;
            cursor: pointer;
            font-size: 16px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
            transition: all 0.3s;
            user-select: none;
            touch-action: none;
        }

        #stealth-mode-btn:hover {
            background: #FF85AD;
            transform: scale(1.05);
        }

        #stealth-mode-btn.stealth-active {
            background: #00A1D6;
        }

        #stealth-mode-btn.dragging {
            opacity: 0.8;
            box-shadow: 0 4px 15px rgba(0,0,0,0.4);
        }

        /* 隐身模式样式 */
        .stealth-mode body > *:not(#stealth-mode-btn):not(#stealth-danmu-panel):not(#stealth-emoji-panel):not(#stealth-ai-chat) {
            display: none !important;
        }

        .stealth-mode {
            background: #f7f7f7 !important;
        }

        /* AI聊天界面容器 */
        #stealth-ai-chat {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 9000;
            background: #f7f7f7;
            display: flex;
            flex-direction: column;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }

        /* AI聊天头部 */
        .stealth-ai-header {
            padding: 15px;
            background: white;
            border-bottom: 1px solid #e5e5e5;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .stealth-ai-title {
            font-size: 18px;
            font-weight: 600;
            color: #333;
        }

        .stealth-ai-subtitle {
            font-size: 14px;
            color: #666;
        }

        /* AI聊天消息区域 */
        .stealth-ai-messages {
            flex: 1;
            padding: 15px;
            overflow-y: auto;
            background: #f7f7f7;
        }

        /* AI消息气泡 */
        .stealth-ai-message {
            max-width: 80%;
            margin-bottom: 15px;
            padding: 12px 16px;
            border-radius: 18px;
            line-height: 1.4;
            position: relative;
        }

        .stealth-ai-message.ai {
            background: white;
            align-self: flex-start;
            border-top-left-radius: 4px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            color: #333;
        }

        .stealth-ai-message.user {
            background: #00A1D6;
            color: white;
            align-self: flex-end;
            border-top-right-radius: 4px;
        }

        /* 弹幕面板样式 - 伪装成AI输入框 */
        #stealth-danmu-panel {
            position: fixed !important;
            bottom: 20px !important;
            left: 50% !important;
            transform: translateX(-50%) !important;
            z-index: 9999 !important;
            background: white !important;
            padding: 12px !important;
            border-radius: 12px !important;
            width: 90% !important;
            max-width: 600px !important;
            border: 1px solid #e5e5e5 !important;
            display: flex !important;
            flex-direction: column !important;
            gap: 8px !important;
            opacity: 0;
            visibility: hidden;
            transition: opacity 0.3s, visibility 0.3s;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }

        /* 表情面板样式 */
        #stealth-emoji-panel {
            position: fixed !important;
            bottom: 150px !important;
            left: 50% !important;
            transform: translateX(-50%) !important;
            z-index: 9998 !important;
            background: white !important;
            padding: 10px !important;
            border-radius: 12px !important;
            width: 90% !important;
            max-width: 600px !important;
            max-height: 250px !important;
            overflow-y: auto !important;
            border: 1px solid #e5e5e5 !important;
            display: none;
            flex-wrap: wrap !important;
            justify-content: center !important;
            gap: 5px !important;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }

        #stealth-emoji-panel.show {
            display: flex !important;
        }

        /* 优化后的表情按钮样式 */
        .stealth-emoji-btn {
            padding: 8px 12px !important;
            background: #f7f7f7 !important;
            border: 1px solid #e5e5e5 !important;
            border-radius: 8px !important;
            color: #333 !important;
            cursor: pointer !important;
            font-size: 14px !important;
            transition: all 0.2s !important;
        }

        .stealth-emoji-btn:hover {
            background: #e5e5e5 !important;
        }

        /* 显示控制 */
        .panel-visible #stealth-danmu-panel,
        .stealth-mode #stealth-danmu-panel {
            opacity: 1 !important;
            visibility: visible !important;
        }

        /* 输入框样式 */
        #stealth-danmu-input {
            width: 95% !important;
            height: 40px !important;
            background: #f7f7f7 !important;
            border: 1px solid #e5e5e5 !important;
            border-radius: 8px !important;
            color: #333 !important;
            padding: 0 12px !important;
            font-size: 14px !important;
        }

        #stealth-danmu-input:focus {
            outline: none;
            border-color: #00A1D6;
        }

        /* 按钮样式 */
        #stealth-danmu-send,
        #stealth-emoji-btn,
        #stealth-meow-btn {
            height: 40px !important;
            background: #00A1D6 !important;
            color: white !important;
            border: none !important;
            border-radius: 8px !important;
            cursor: pointer !important;
            font-size: 14px !important;
            transition: background 0.2s;
        }

        #stealth-danmu-send:hover,
        #stealth-emoji-btn:hover,
        #stealth-meow-btn:hover {
            background: #0088B4 !important;
        }

        /* 按钮容器 */
        .stealth-btn-container {
            display: flex !important;
            gap: 8px !important;
        }

        .stealth-btn-container button {
            flex: 1 !important;
        }

        /* 喵按钮激活状态 */
        #stealth-meow-btn.active {
            background: #FB7299 !important;
        }
    `);

    // 创建控制按钮
    const btn = document.createElement('button');
    btn.id = 'stealth-mode-btn';
    btn.textContent = '隐';
    document.body.appendChild(btn);

    // 创建AI聊天界面容器
    const aiChatContainer = document.createElement('div');
    aiChatContainer.id = 'stealth-ai-chat';
    aiChatContainer.style.display = 'none';
    aiChatContainer.innerHTML = `
        <div class="stealth-ai-header">
            <div>
                <div class="stealth-ai-title">AI 助手</div>
                <div class="stealth-ai-subtitle">随时为您解答问题</div>
            </div>
        </div>
        <div class="stealth-ai-messages">
            <div class="stealth-ai-message ai">
                您好！我是AI助手，有什么可以帮您的吗？
            </div>
            <div class="stealth-ai-message user">
                帮我写一段JavaScript代码
            </div>
            <div class="stealth-ai-message ai">
                当然可以！您需要实现什么功能的JavaScript代码呢？比如DOM操作、AJAX请求、动画效果等。
            </div>
            <div class="stealth-ai-message ai">
                请描述您的需求，我会为您生成合适的代码示例。
            </div>
        </div>
    `;
    document.body.appendChild(aiChatContainer);

    // 创建弹幕面板
    const danmuPanel = document.createElement('div');
    danmuPanel.id = 'stealth-danmu-panel';
    danmuPanel.innerHTML = `
        <input type="text" id="stealth-danmu-input" placeholder="输入您的问题...">
        <div class="stealth-btn-container">
            <button id="stealth-meow-btn">喵</button>
            <button id="stealth-emoji-btn">表情</button>
            <button id="stealth-danmu-send">发送</button>
        </div>
    `;
    document.body.appendChild(danmuPanel);

    // 创建表情面板
    const emojiPanel = document.createElement('div');
    emojiPanel.id = 'stealth-emoji-panel';
    document.body.appendChild(emojiPanel);

    let isStealthMode = false;
    let isPanelVisible = false;
    let autoMeowInterval = null;
    let meowCountdownInterval = null;
    const BASE_MEOW_INTERVAL = 15 * 60 * 1000; // 15分钟基础值
    const RANDOM_RANGE = 2 * 60 * 1000; // ±2分钟随机范围
    let remainingTime = 0;
    let nextMeowTime = 0;

    // B站常用表情文字代码
    const emojiList = [
        '[大笑]', '[笑哭]', '[生气]', '[惊讶]', '[点赞]',
        '[爱心]', '[OK]', '[星星眼]', '[吃瓜]', '[捂脸]',
        '[脱单doge]', '[doge]', '[微笑]', '[害羞]', '[喜欢]',
        '[委屈]', '[流泪]', '[无语]', '[思考]', '[惊喜]',
        '[抠鼻]', '[坏笑]', '[阴险]', '[奋斗]', '[撇嘴]',
        '[尴尬]', '[抓狂]', '[吐]', '[斜眼笑]', '[嘘声]',
        '[酷]', '[可怜]', '[睡]', '[翻白眼]', '[哈欠]',
        '[鄙视]', '[亲亲]', '[大哭]', '[发怒]', '[恐惧]',
        '[调皮]', '[晕]', '[衰]', '[骷髅]', '[炸弹]',
        '[胜利]', '[鼓掌]', '[握手]', '[抱拳]', '[勾引]',
        '[拳头]', '[差劲]', '[爱你]', '[NO]', '[好的]',
        '[弱]', '[强]', '[拜拜]', '[喝彩]', '[礼物]',
        '[红包]', '[干杯]', '[撒花]', '[加油]', '[支持]'
    ];

    // 获取随机间隔时间 (13-17分钟)
    function getRandomInterval() {
        return BASE_MEOW_INTERVAL + (Math.random() * RANDOM_RANGE * 2 - RANDOM_RANGE);
    }

    // 渲染表情按钮
    function renderEmojis() {
        emojiPanel.innerHTML = '';

        emojiList.forEach(emoji => {
            const btn = document.createElement('button');
            btn.className = 'stealth-emoji-btn';
            btn.textContent = emoji;
            btn.dataset.text = emoji;
            emojiPanel.appendChild(btn);
        });
    }

    // 查找原始弹幕元素
    function findOriginalDanmuElements() {
        return {
            input: document.querySelector('.bl-textarea, .chat-input-ctnr textarea, .chat-input-container textarea, [contenteditable="true"]'),
            sendBtn: document.querySelector('.bl-button--primary, .send-btn, .chat-send-btn')
        };
    }

    // 发送弹幕
    function sendDanmu() {
        const text = document.getElementById('stealth-danmu-input').value.trim();
        if (!text) return;

        const { input, sendBtn } = findOriginalDanmuElements();

        if (input) {
            // 设置原始输入框的值
            if (input.tagName === 'TEXTAREA' || input.tagName === 'INPUT') {
                input.value = text;
            } else if (input.contentEditable === 'true') {
                input.textContent = text;
            }

            // 触发输入事件
            const inputEvent = new Event('input', { bubbles: true });
            input.dispatchEvent(inputEvent);

            // 尝试点击发送按钮
            if (sendBtn) {
                sendBtn.click();
            } else {
                // 模拟回车键
                const enterEvent = new KeyboardEvent('keydown', {
                    key: 'Enter',
                    code: 'Enter',
                    keyCode: 13,
                    which: 13,
                    bubbles: true
                });
                input.dispatchEvent(enterEvent);
            }

            // 清空输入框
            document.getElementById('stealth-danmu-input').value = '';

            // 如果是隐身模式，添加"用户消息"
            if (isStealthMode) {
                addAIMessage(text);
            }
        }
    }

    // 更新倒计时显示
    function updateCountdownDisplay() {
        const meowBtn = document.getElementById('stealth-meow-btn');
        if (!meowBtn) return;
        
        const minutes = Math.floor(remainingTime / 60000);
        const seconds = Math.floor((remainingTime % 60000) / 1000);
        meowBtn.textContent = `喵(${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')})`;
    }

    // 自动发送"喵"弹幕
    function autoSendMeow() {
        const input = document.getElementById('stealth-danmu-input');
        input.value = '喵';
        sendDanmu();
        
        // 设置下一次发送时间
        scheduleNextMeow();
    }

    // 安排下一次发送
    function scheduleNextMeow() {
        const interval = getRandomInterval();
        nextMeowTime = Date.now() + interval;
        remainingTime = interval;
        
        // 清除现有定时器
        if (autoMeowInterval) {
            clearInterval(autoMeowInterval);
        }
        
        // 设置新定时器
        autoMeowInterval = setTimeout(autoSendMeow, interval);
        updateCountdownDisplay();
        
        // 启动倒计时
        startCountdown();
    }

    // 开始倒计时
    function startCountdown() {
        if (meowCountdownInterval) {
            clearInterval(meowCountdownInterval);
        }
        
        meowCountdownInterval = setInterval(() => {
            remainingTime = nextMeowTime - Date.now();
            if (remainingTime <= 0) {
                remainingTime = 0;
                clearInterval(meowCountdownInterval);
            }
            updateCountdownDisplay();
        }, 1000);
    }

    // 停止倒计时
    function stopCountdown() {
        if (meowCountdownInterval) {
            clearInterval(meowCountdownInterval);
            meowCountdownInterval = null;
        }
    }

    // 切换自动发送喵功能
    function toggleAutoMeow() {
        const meowBtn = document.getElementById('stealth-meow-btn');
        
        if (autoMeowInterval) {
            // 如果已经有定时器，则关闭
            clearInterval(autoMeowInterval);
            autoMeowInterval = null;
            stopCountdown();
            meowBtn.classList.remove('active');
            meowBtn.textContent = '喵';
            console.log('已关闭自动发送喵功能');
        } else {
            // 如果没有定时器，则开启
            scheduleNextMeow();
            meowBtn.classList.add('active');
            console.log('已开启自动发送喵功能，随机间隔13-17分钟');
            
            // 立即发送一次
            autoSendMeow();
        }
    }

    // 添加AI消息
    function addAIMessage(text) {
        const messagesContainer = document.querySelector('.stealth-ai-messages');

        // 添加用户消息
        const userMsg = document.createElement('div');
        userMsg.className = 'stealth-ai-message user';
        userMsg.textContent = text;
        messagesContainer.appendChild(userMsg);

        // 滚动到底部
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        // 模拟AI回复
        setTimeout(() => {
            const aiResponses = [
                "我明白了，这个问题很有深度。",
                "让我思考一下如何回答这个问题...",
                "这是一个很好的问题！",
                "根据我的分析，这个问题可以这样理解...",
                "我正在处理您的请求，请稍等...",
                "感谢您的提问，我会尽力解答。",
                "这个问题涉及到多个方面，让我详细解释。",
                "我已经记录下您的问题，正在生成回答。"
            ];

            const aiMsg = document.createElement('div');
            aiMsg.className = 'stealth-ai-message ai';
            aiMsg.textContent = aiResponses[Math.floor(Math.random() * aiResponses.length)];
            messagesContainer.appendChild(aiMsg);

            // 滚动到底部
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }, 1000 + Math.random() * 2000);
    }

    // 切换面板显示状态
    function togglePanel(show) {
        isPanelVisible = show;
        if (show) {
            document.documentElement.classList.add('panel-visible');
            setTimeout(() => {
                document.getElementById('stealth-danmu-input').focus();
            }, 100);
        } else {
            document.documentElement.classList.remove('panel-visible');
            emojiPanel.classList.remove('show');
        }
    }

    // 切换表情面板
    function toggleEmojiPanel() {
        emojiPanel.classList.toggle('show');
        if (emojiPanel.classList.contains('show') && emojiPanel.children.length === 0) {
            renderEmojis();
        }

        // 重新定位面板
        const danmuPanel = document.getElementById('stealth-danmu-panel');
        if (danmuPanel) {
            emojiPanel.style.bottom = `${danmuPanel.offsetHeight + danmuPanel.offsetTop + 10}px`;
        }
    }

    // 初始化按钮位置
    function initButtonPosition() {
        const savedPos = GM_getValue('btnPosition', { x: -25, y: 100 });
        btn.style.right = `${savedPos.x}px`;
        btn.style.bottom = `${savedPos.y}px`;
    }

    // 保存按钮位置
    function saveButtonPosition() {
        const x = parseInt(btn.style.right) || -25;
        const y = parseInt(btn.style.bottom) || 100;
        GM_setValue('btnPosition', { x, y });
    }

    // 处理按钮拖动
    function setupDrag() {
        let isDragging = false;
        let startX, startY, startRight, startBottom;

        btn.addEventListener('mousedown', startDrag);
        btn.addEventListener('touchstart', startDrag);

        function startDrag(e) {
            // 如果是点击事件，不处理拖动
            if (e.type === 'mousedown' && e.button !== 0) return;
            
            e.preventDefault();
            isDragging = true;
            btn.classList.add('dragging');

            // 获取初始位置
            const rect = btn.getBoundingClientRect();
            startRight = parseInt(btn.style.right) || -25;
            startBottom = parseInt(btn.style.bottom) || 100;
            
            // 获取初始鼠标/触摸位置
            if (e.type === 'mousedown') {
                startX = e.clientX;
                startY = e.clientY;
            } else {
                startX = e.touches[0].clientX;
                startY = e.touches[0].clientY;
            }

            // 添加移动和结束事件监听器
            document.addEventListener('mousemove', drag);
            document.addEventListener('touchmove', drag);
            document.addEventListener('mouseup', endDrag);
            document.addEventListener('touchend', endDrag);
        }

        function drag(e) {
            if (!isDragging) return;
            e.preventDefault();

            let clientX, clientY;
            if (e.type === 'mousemove') {
                clientX = e.clientX;
                clientY = e.clientY;
            } else {
                clientX = e.touches[0].clientX;
                clientY = e.touches[0].clientY;
            }

            // 计算新位置
            const deltaX = clientX - startX;
            const deltaY = clientY - startY;
            
            let newRight = startRight - deltaX;
            let newBottom = startBottom - deltaY;

            // 限制在窗口范围内
            const windowWidth = window.innerWidth;
            const windowHeight = window.innerHeight;
            const btnWidth = btn.offsetWidth;
            const btnHeight = btn.offsetHeight;

            newRight = Math.min(Math.max(newRight, -btnWidth/2), windowWidth - btnWidth/2);
            newBottom = Math.min(Math.max(newBottom, 0), windowHeight - btnHeight);

            // 应用新位置
            btn.style.right = `${newRight}px`;
            btn.style.bottom = `${newBottom}px`;
        }

        function endDrag(e) {
            if (!isDragging) return;
            e.preventDefault();
            isDragging = false;
            btn.classList.remove('dragging');

            // 移除事件监听器
            document.removeEventListener('mousemove', drag);
            document.removeEventListener('touchmove', drag);
            document.removeEventListener('mouseup', endDrag);
            document.removeEventListener('touchend', endDrag);

            // 检查是否需要吸附到边缘
            const rect = btn.getBoundingClientRect();
            const windowWidth = window.innerWidth;
            const btnWidth = btn.offsetWidth;

            // 如果靠近右侧边缘，则吸附到边缘
            if (rect.right >= windowWidth - btnWidth/4) {
                btn.style.right = `-${btnWidth/2}px`;
            }

            // 保存位置
            saveButtonPosition();
        }
    }

    // 点击控制按钮
    btn.addEventListener('click', function(e) {
        // 如果正在拖动，不处理点击
        if (btn.classList.contains('dragging')) {
            e.stopPropagation();
            return;
        }

        if (!isStealthMode) {
            // 正常模式下切换面板显示
            togglePanel(!isPanelVisible);
        } else {
            // 隐身模式下退出隐身
            isStealthMode = false;
            btn.classList.remove('stealth-active');
            btn.textContent = '隐';
            document.documentElement.classList.remove('stealth-mode');
            aiChatContainer.style.display = 'none';
            togglePanel(false);
        }
    });

    // 双击控制按钮进入隐身模式
    btn.addEventListener('dblclick', function(e) {
        // 如果正在拖动，不处理双击
        if (btn.classList.contains('dragging')) {
            e.stopPropagation();
            return;
        }

        isStealthMode = true;
        btn.classList.add('stealth-active');
        btn.textContent = '显';
        document.documentElement.classList.add('stealth-mode');
        aiChatContainer.style.display = 'flex';
        togglePanel(true);
    });

    // 喵按钮点击事件
    document.getElementById('stealth-meow-btn').addEventListener('click', function(e) {
        e.stopPropagation();
        toggleAutoMeow();
    });

    // 表情按钮点击事件
    document.getElementById('stealth-emoji-btn').addEventListener('click', function(e) {
        e.stopPropagation();
        toggleEmojiPanel();
    });

    // 表情按钮点击事件
    emojiPanel.addEventListener('click', function(e) {
        if (e.target.classList.contains('stealth-emoji-btn')) {
            const input = document.getElementById('stealth-danmu-input');
            input.value += e.target.dataset.text;
            input.focus();
        }
    });

    // 发送按钮点击事件
    document.getElementById('stealth-danmu-send').addEventListener('click', sendDanmu);

    // 输入框回车发送
    document.getElementById('stealth-danmu-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendDanmu();
        }
    });

    // 点击表情面板外部隐藏表情面板
    document.addEventListener('click', function(e) {
        if (emojiPanel.classList.contains('show') &&
            !emojiPanel.contains(e.target) &&
            e.target.id !== 'stealth-emoji-btn') {
            emojiPanel.classList.remove('show');
        }
    });

    // 确保元素在最上层
    setInterval(() => {
        btn.style.zIndex = '10000';
        danmuPanel.style.zIndex = '9999';
        emojiPanel.style.zIndex = '9998';
        aiChatContainer.style.zIndex = '9000';
    }, 1000);

    // 初始化按钮位置
    initButtonPosition();

    // 设置拖动功能
    setupDrag();

    // 初始渲染表情
    renderEmojis();
})();