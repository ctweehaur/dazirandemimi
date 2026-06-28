// 存储学生当前选中的临时答案 (格式： { 题目ID: "选中的选项完整文本" })
let userSelectedAnswers = {}; 

// 🎯 选择题渲染器：内容随机洗牌，但开头的 A, B, C, D 顺序绝对不改动
function renderMultipleChoiceQuizzes() {
    if (typeof quizDataList === 'undefined' || quizDataList.length === 0) return;
    
    const section = document.getElementById('quizSection');
    const container = document.getElementById('quizContainer');
    container.innerHTML = "";
    section.style.display = "block"; 
    
    // 初始化状态
    userSelectedAnswers = {};
    document.getElementById('quizResultScore').style.display = "none";
    const submitBtn = document.getElementById('submitQuizBtn');
    submitBtn.disabled = false;
    submitBtn.style.background = "#34495e";
    submitBtn.innerText = "提交检查 🚀";

    quizDataList.forEach((q) => {
        const qBox = document.createElement('div');
        qBox.style.marginBottom = "25px";
        qBox.style.paddingBottom = "15px";
        qBox.style.borderBottom = "1px dashed #ddd";
        qBox.setAttribute("data-q-id", q.id);

        const qText = document.createElement('div');
        qText.style.fontWeight = "bold";
        qText.style.fontSize = "16px";
        qText.style.marginBottom = "10px";
        qText.style.color = "#2c3e50";
        qText.innerHTML = `${q.id}. ${q.question.replace(/\n/g, '<br>')}`;
        qBox.appendChild(qText);

        const optionsBox = document.createElement('div');
        optionsBox.className = "options-group";
        
        // 🌟 【硬核重构 1】先剥离原先的 A B C D 前缀，只把纯粹的内容提取出来打乱
        let pureContents = q.options.map(opt => opt.replace(/^[A-D]\s+/, ""));
        let shuffledContents = [...pureContents].sort(() => Math.random() - 0.5);

        // 固定不变的 A, B, C, D 字母模板
        const prefixes = ["A", "B", "C", "D"];

        // 拼接回固定顺序的字母
        shuffledContents.forEach((content, index) => {
            const prefix = prefixes[index];
            const finalOptText = `${prefix} ${content}`; // 拼接成全新的 "A 选项内容"

            const btn = document.createElement('button');
            btn.innerText = finalOptText;
            btn.className = "quiz-choice-btn";
            
            // 绑定一个自定义属性，用来记录这个内容在打乱前是否是正确答案
            // 这样无论它怎么洗牌，只要找对应的原选项并截取字母就能完美核对
            const originalMatch = q.options.find(o => o.endsWith(content));
            btn.setAttribute("data-original-text", originalMatch);

            // 基础样式
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
            btn.style.transition = "all 0.1s";

            btn.onmouseenter = () => { if(!btn.classList.contains('selected') && !btn.disabled) btn.style.background = "#f5f6fa"; };
            btn.onmouseleave = () => { if(!btn.classList.contains('selected') && !btn.disabled) btn.style.background = "#fff"; };

            // 🎯 点击事件：只做选中高亮标记，不会秒判对错
            btn.onclick = () => {
                Array.from(optionsBox.children).forEach(b => {
                    b.classList.remove('selected');
                    b.style.background = "#fff";
                    b.style.borderColor = "#dcdde1";
                    b.style.color = "inherit";
                    b.style.fontWeight = "normal";
                });

                btn.classList.add('selected');
                btn.style.background = "#ebf5fb";
                btn.style.borderColor = "#3498db";
                btn.style.color = "#2980b9";
                btn.style.fontWeight = "600";

                // 记录学生选中的按钮（保存整个按钮对象或自定义属性）
                userSelectedAnswers[q.id] = finalOptText;
            };
            optionsBox.appendChild(btn);
        });

        qBox.appendChild(optionsBox);
        container.appendChild(qBox);
    });
}

// 🚀 全局结算批改器：统一提交对答案
function submitAllAnswers() {
    const totalQuestions = quizDataList.length;
    const answeredCount = Object.keys(userSelectedAnswers).length;

    if (answeredCount < totalQuestions) {
        alert(`⚠️ 你还有未填完的习题哦！目前完成了 (${answeredCount} / ${totalQuestions}) 题。`);
        return;
    }

    let score = 0;

    quizDataList.forEach(q => {
        const qBox = document.querySelector(`div[data-q-id="${q.id}"]`);
        const buttons = qBox.querySelectorAll('.quiz-choice-btn');
        const studentOptText = userSelectedAnswers[q.id];

        // 找到学生选中的按钮
        let selectedBtn = null;
        buttons.forEach(btn => {
            if (btn.innerText === studentOptText) {
                selectedBtn = btn;
            }
        });

        // 获取学生选的内容在原题库中对应的原始字母
        const studentOriginalText = selectedBtn.getAttribute("data-original-text");
        const studentLetter = studentOriginalText.trim().charAt(0);

        buttons.forEach(btn => {
            btn.disabled = true; // 锁死
            
            const btnOriginalText = btn.getAttribute("data-original-text");
            const btnLetter = btnOriginalText.trim().charAt(0); // 获取原库里的 A B C D 来对答案

            btn.style.background = "#fff";
            btn.style.color = "inherit";
            btn.style.borderColor = "#dcdde1";

            // 💡 绿显原库里的正确选项
            if (btnLetter === q.answer) {
                btn.style.background = "#2ecc71";
                btn.style.color = "white";
                btn.style.borderColor = "#2ecc71";
                if (studentLetter === q.answer) {
                    btn.innerText = btn.innerText + "  (✓ 答对了)";
                }
            }
            
            // 💡 红显学生选错的选项
            if (btn === selectedBtn && studentLetter !== q.answer) {
                btn.style.background = "#e74c3c";
                btn.style.color = "white";
                btn.style.borderColor = "#e74c3c";
                btn.innerText = btn.innerText + "  (❌ 你的选择)";
            }
        });

        if (studentLetter === q.answer) {
            score++;
        }
    });

    const resultBox = document.getElementById('quizResultScore');
    resultBox.style.display = "block";
    resultBox.innerHTML = `🎉 批改完成！您的最终得分是：<span style="font-size: 24px; color: #e67e22;">${score}</span> / ${totalQuestions} 分`;
    
    const submitBtn = document.getElementById('submitQuizBtn');
    submitBtn.disabled = true;
    submitBtn.style.background = "#95a5a6";
    submitBtn.innerText = "已完成提交";
    
    resultBox.scrollIntoView({ behavior: "smooth", block: "center" });
}
