window.onload = function() {
    // 初始化网页标题
    document.getElementById('articleTitle').innerText = lessonTitle;
    document.title = lessonTitle;

    // 渲染课文、生词本和习题
    if (typeof lessonData !== 'undefined') { 
        render(); 
        renderNB(); 
        
        // 🚀 核心联动：渲染跨文件读取到的 10 道选择题并进行随机洗牌
        renderMultipleChoiceQuizzes(); 
    }
    
    // 初始化气泡弹窗事件
    document.body.appendChild(document.getElementById('buddyPopover'));
    document.addEventListener('click', () => { 
        document.getElementById('buddyPopover').style.display = 'none'; 
        document.querySelectorAll('ruby').forEach(r => r.classList.remove('is-active'));
    });
};

// 🎯 选择题渲染器：在文章下方生成选择题，并且确保每次刷新/载入时选项全部重新洗牌
function renderMultipleChoiceQuizzes() {
    if (typeof quizDataList === 'undefined' || quizDataList.length === 0) return;
    
    const section = document.getElementById('quizSection');
    const container = document.getElementById('quizContainer');
    container.innerHTML = "";
    section.style.display = "block"; // 显示选择题卡片

    quizDataList.forEach((q) => {
        const qBox = document.createElement('div');
        qBox.style.marginBottom = "25px";
        qBox.style.paddingBottom = "15px";
        qBox.style.borderBottom = "1px dashed #ddd";

        // 题目文本（支持换行符）
        const qText = document.createElement('div');
        qText.style.fontWeight = "bold";
        qText.style.fontSize = "16px";
        qText.style.marginBottom = "10px";
        qText.style.color = "#2c3e50";
        qText.innerHTML = `${q.id}. ${q.question.replace(/\n/g, '<br>')}`;
        qBox.appendChild(qText);

        const optionsBox = document.createElement('div');
        
        // 🌟 选项绝对随机洗牌（Shuffle）
        let shuffledOptions = [...q.options].sort(() => Math.random() - 0.5);

        shuffledOptions.forEach(opt => {
            const btn = document.createElement('button');
            btn.innerText = opt;
            
            // 样式美化组件
            btn.style.display = "block";
            btn.style.width = "100%";
            btn.style.textAlign = "left";
            btn.style.margin = "6px 0";
            btn.style.padding = "10px 15px";
            btn.style.border = "1px solid #dcdde1";
            btn.style.borderRadius = "6px";
            btn.style.background = "#fff";
            btn.style.cursor = "pointer";
            btn.style.fontSize = "14px";
            btn.style.transition = "all 0.2s";

            btn.onmouseenter = () => { if(!btn.disabled) btn.style.background = "#f5f6fa"; };
            btn.onmouseleave = () => { if(!btn.disabled && !btn.classList.contains('wrong')) btn.style.background = "#fff"; };

            // 点击即时比对判定逻辑
            btn.onclick = () => {
                const currentLetter = opt.trim().charAt(0); // 抓取选项开头的 A, B, C, D
                
                if (currentLetter === q.answer) {
                    // 答对：锁定本题所有选项，当前选项变绿
                    Array.from(optionsBox.children).forEach(b => b.disabled = true);
                    btn.style.background = "#2ecc71";
                    btn.style.color = "white";
                    btn.style.borderColor = "#2ecc71";
                    btn.innerText = opt + "  (✓ 正确!)";
                } else {
                    // 答错：当前按钮变红并锁定（允许继续猜其他选项）
                    btn.style.background = "#e74c3c";
                    btn.style.color = "white";
                    btn.style.borderColor = "#e74c3c";
                    btn.disabled = true;
                }
            };
            optionsBox.appendChild(btn);
        });

        qBox.appendChild(optionsBox);
        container.appendChild(qBox);
    });
}
