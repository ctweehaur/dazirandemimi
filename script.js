// 🧠 核心习题区：支持概述背景卡片，移除 AI 批改，支持直接对答案
function renderQuestions() {
    if (typeof lessonQuestions === 'undefined' || lessonQuestions.length === 0) return;

    const cnt = document.getElementById('content');
    const qCard = document.createElement("div");
    qCard.style.marginTop = "40px";
    qCard.style.padding = "25px";
    qCard.style.borderTop = "2px dashed #bdc3c7";
    qCard.style.background = "var(--card-bg, #ffffff)";
    qCard.style.borderRadius = "12px";

    const qTitle = document.createElement("h2");
    qTitle.innerText = "📚 课后思考与自测练习";
    qTitle.style.fontSize = "20px";
    qTitle.style.color = "#2c3e50";
    qTitle.style.marginBottom = "20px";
    qCard.appendChild(qTitle);

    lessonQuestions.forEach((q) => {
        const qBox = document.createElement("div");
        qBox.style.marginBottom = "30px";
        qBox.style.paddingBottom = "20px";
        qBox.style.borderBottom = "1px dashed #eee";

        const qText = document.createElement("div");
        qText.innerHTML = `<strong>${q.number}</strong> ${q.question} <span style="color:#e74c3c; font-weight:bold;">[${q.score}分]</span>`;
        qText.style.fontSize = "16px";
        qBox.appendChild(qText);

        // 如果题目配有 context 背景文本（如概述题），在前端生成高质感的紫色引用卡片
        if (q.context) {
            const contextBox = document.createElement("div");
            contextBox.innerHTML = q.context.replace(/\n/g, '<br>');
            contextBox.style.background = "#f8f9fa";
            contextBox.style.borderLeft = "4px solid #9b59b6";
            contextBox.style.padding = "15px";
            contextBox.style.margin = "12px 0";
            contextBox.style.fontSize = "15px";
            contextBox.style.color = "#34495e";
            contextBox.style.lineHeight = "1.6";
            contextBox.style.borderRadius = "4px";
            qBox.appendChild(contextBox);
        }

        const textarea = document.createElement("textarea");
        textarea.placeholder = (q.type && q.type === "summary") ? "请在此处输入您的概述答案（注意不超过60字）..." : "请在此处输入您的答案...";
        textarea.style.width = "100%";
        textarea.style.height = (q.type && q.type === "summary") ? "110px" : "80px";
        textarea.style.padding = "10px";
        textarea.style.marginTop = "10px";
        textarea.style.boxSizing = "border-box";
        textarea.style.borderRadius = "6px";
        textarea.style.border = "1px solid #ccc";
        textarea.style.fontSize = "15px";
        textarea.style.fontFamily = "inherit";

        textarea.value = localStorage.getItem(`ans_${q.id}`) || "";
        qBox.appendChild(textarea);

        const controlRow = document.createElement("div");
        controlRow.style.display = "flex";
        controlRow.style.justify = "space-between";
        controlRow.style.alignItems = "center";
        controlRow.style.marginTop = "8px";

        const counter = document.createElement("div");
        counter.style.fontSize = "13px";
        counter.style.color = "#7f8c8d";
        if (q.type && q.type === "summary") {
            counter.innerHTML = `当前字数：<span id="charCount_${q.id}">0</span> / 60 字`;
        }
        controlRow.appendChild(counter);

        const btnGroup = document.createElement("div");

        const submitBtn = document.createElement("button");
        submitBtn.innerText = "查看满分答案 📋";
        submitBtn.style.padding = "6px 12px";
        submitBtn.style.background = "#2ecc71";
        submitBtn.style.color = "white";
        submitBtn.style.border = "none";
        submitBtn.style.borderRadius = "4px";
        submitBtn.style.cursor = "pointer";
        submitBtn.style.fontSize = "13px";
        btnGroup.appendChild(submitBtn);

        controlRow.appendChild(btnGroup);
        qBox.appendChild(controlRow);

        const ansBox = document.createElement("div");
        ansBox.style.display = "none";
        ansBox.style.marginTop = "15px";
        ansBox.style.padding = "12px";
        ansBox.style.background = "#fff9db";
        ansBox.style.borderLeft = "4px solid #f1c40f";
        ansBox.style.borderRadius = "4px";
        ansBox.style.fontSize = "14px";
        ansBox.innerHTML = `<strong>💡 满分答案：</strong><br><div style="margin-top:6px; color:#2c3e50; font-weight:500;">${q.modelAnswer}</div>`;
        qBox.appendChild(ansBox);

        submitBtn.onclick = function() {
            ansBox.style.display = ansBox.style.display === "none" ? "block" : "none";
            submitBtn.innerText = ansBox.style.display === "block" ? "收起满分答案 ❌" : "查看满分答案 📋";
        };

        function updateCharCount() {
            if (q.type && q.type === "summary") {
                const text = textarea.value;
                const matched = text.match(/[\u4e00-\u9fa5\w\d\u3000-\u303f\uff00-\uffef]/g);
                const count = matched ? matched.length : 0;
                const countEl = document.getElementById(`charCount_${q.id}`);
                if (countEl) {
                    countEl.innerText = count;
                    countEl.style.color = count > 60 ? "#e74c3c" : "#27ae60";
                }
            }
        }

        textarea.oninput = function() {
            localStorage.setItem(`ans_${q.id}`, textarea.value);
            updateCharCount();
        };
        setTimeout(updateCharCount, 100);

        qCard.appendChild(qBox);
    });

    cnt.appendChild(qCard);
}
