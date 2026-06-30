// ==========================================================================
// ⚙️ 全互动式华文教学系统阅读器大脑 - script.js (2026 文本赏析外部解耦版)
// ==========================================================================

let currentIdx = -1; 
let saved = JSON.parse(localStorage.getItem('saved_104')) || [];
let quizData = [];
let currentQuizIdx = 0;
let isLocked = false;
let isTeacherMode = false; // 文本赏析状态开关
let userSelectedAnswers = {}; // 存储学生当前选中的临时答案 (格式： { 题目ID: "选中的选项完整文本" })

window.onload = function() {
    // 初始化网页标题
    document.getElementById('articleTitle').innerText = lessonTitle;
    document.title = lessonTitle;

    // 渲染课文基底、生词本和选择题
    if (typeof lessonData !== 'undefined') { 
        render(); 
        renderNB(); 
        renderMultipleChoiceQuizzes(); 
    }
    
    // 初始化气泡弹窗事件，点击空白处自动收回激活状态
    document.body.appendChild(document.getElementById('buddyPopover'));
    document.addEventListener('click', () => { 
        document.getElementById('buddyPopover').style.display = 'none'; 
        document.querySelectorAll('ruby').forEach(r => r.classList.remove('is-active'));
    });
};

// 📖 正文渲染器：支持华文首行空两格，并为深度文本赏析预留 DOM 节点
function render() {
    const cnt = document.getElementById('content'); 
    cnt.innerHTML = "";
    let pNum = 1; 
    let p = document.createElement("p"); 
    
    // 渲染课文顶部的全局总览赏析板
    const topAnalysis = document.getElementById('teacherArticleAnalysis');
    if (topAnalysis) {
        if (isTeacherMode && typeof lessonTeacherAnalysis !== 'undefined' && lessonTeacherAnalysis.overview) {
            topAnalysis.style.display = "block";
            topAnalysis.innerHTML = `<strong>💡 课文总览与赏析要点：</strong><br>${lessonTeacherAnalysis.overview}`;
        } else {
            topAnalysis.style.display = "none";
        }
    }

    function finalizeParagraph(paragraphElement) {
        if (paragraphElement.childNodes.length === 0) return;
        const textContent = paragraphElement.innerText.trim();
        const isAuthorLineAtEnd = (textContent.startsWith("（") && textContent.includes("《"));
        
        if (isAuthorLineAtEnd) {
            paragraphElement.style.textIndent = "0";
            paragraphElement.style.textAlign = "right";  
            paragraphElement.style.color = "#7f8c8d";    
            paragraphElement.style.fontSize = "15px";     
            paragraphElement.style.marginTop = "30px";    
            cnt.appendChild(paragraphElement);
        } else {
            paragraphElement.style.position = "relative";
            paragraphElement.style.textIndent = "2em"; 
            paragraphElement.style.paddingLeft = "0"; 
            paragraphElement.style.marginBottom = "15px";
            
            let s = document.createElement("span");
            s.className = "p-index";
            s.innerText = "第" + pNum + "段";
            s.style.position = "absolute";
            s.style.left = "-55px"; 
            s.style.top = "4px"; 
            s.style.textIndent = "0"; 
            
            paragraphElement.insertBefore(s, paragraphElement.firstChild); 
            cnt.appendChild(paragraphElement);

            // 👁️ 赏析节点预渲染：为每一段注入一个带独立 ID 的赏析容器，初始根据状态显隐
            if (typeof lessonTeacherAnalysis !== 'undefined' && lessonTeacherAnalysis.paragraphs && lessonTeacherAnalysis.paragraphs[pNum]) {
                let pAnalysis = document.createElement("div");
                pAnalysis.id = `p-analysis-${pNum}`;
                pAnalysis.className = "teacher-p-analysis";
                pAnalysis.style.background = "#faf5ff";
                pAnalysis.style.borderLeft = "3px solid #af7ac5";
                pAnalysis.style.padding = "10px 15px";
                pAnalysis.style.margin = "5px 0 20px 0";
                pAnalysis.style.fontSize = "13.5px";
                pAnalysis.style.color = "#6c3483";
                pAnalysis.style.borderRadius = "4px";
                pAnalysis.style.textIndent = "0";
                pAnalysis.innerHTML = `<strong>🔍 第 ${pNum} 段文本赏析：</strong>${lessonTeacherAnalysis.paragraphs[pNum]}`;
                
                // 根据当前的赏析开关状态决定是否显示
                pAnalysis.style.display = isTeacherMode ? "block" : "none";
                cnt.appendChild(pAnalysis);
            }

            pNum++; 
        }
    }

    lessonData.forEach((d, i) => {
        if (d[0] === "\n") { finalizeParagraph(p); p = document.createElement("p"); }
        else if (d[1] === "") { let s = document.createElement("span"); s.innerText = d[0]; p.appendChild(s); }
        else {
            let r = document.createElement("ruby"); 
            r.setAttribute("data-word-index", i);
            r.onclick = (e) => { 
                e.stopPropagation(); 
                document.querySelectorAll('ruby').forEach(x=>x.classList.remove('is-active')); 
                r.classList.add('is-active'); 
                openPop(e.currentTarget, i);
            };
            r.innerHTML = `${d[0]}<rt>${d[1]}</rt>`; 
            p.appendChild(r);
        }
    });
    finalizeParagraph(p);
}

// 🎯 选择题渲染器：支持动态读取 questions.js 里的问题赏析
function renderMultipleChoiceQuizzes() {
    if (typeof quizDataList === 'undefined' || quizDataList.length === 0) return;
    
    const section = document.getElementById('quizSection');
    const container = document.getElementById('quizContainer');
    container.innerHTML = "";
    section.style.display = "block"; 
    
    userSelectedAnswers = {};
    document.getElementById('quizResultScore').style.display = "none";

    // 恢复控制按钮的初始显隐状态
    document.getElementById('submitQuizBtn').style.display = "inline-block";
    document.getElementById('submitQuizBtn').disabled = false;
    document.getElementById('submitQuizBtn').style.background = "#34495e";
    document.getElementById('submitQuizBtn').innerText = "提交检查 🚀";
    
    document.getElementById('retryQuizBtn').style.display = "none";
    document.getElementById('showCorrectBtn').style.display = "none";

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

        // 👁️ 题目分析节点预渲染：为每道题生成独立的赏析板容器
        if (q.teacherAnalysis) {
            let qAnalysis = document.createElement("div");
            qAnalysis.id = `q-analysis-${q.id}`;
            qAnalysis.style.background = "#faf5ff";
            qAnalysis.style.borderLeft = "3px solid #af7ac5";
            qAnalysis.style.padding = "8px 12px";
            qAnalysis.style.marginBottom = "10px";
            qAnalysis.style.fontSize = "13px";
            qAnalysis.style.color = "#6c3483";
            qAnalysis.style.borderRadius = "4px";
            qAnalysis.innerHTML = `<strong>📐 设题意图与核心考点：</strong>${q.teacherAnalysis}`;
            
            qAnalysis.style.display = isTeacherMode ? "block" : "none";
            qBox.appendChild(qAnalysis);
        }

        const optionsBox = document.createElement('div');
        optionsBox.className = "options-group";
        
        let pureContents = q.options.map(opt => opt.replace(/^[A-D]\s+/, ""));
        let shuffledContents = [...pureContents].sort(() => Math.random() - 0.5);
        const prefixes = ["A", "B", "C", "D"];

        shuffledContents.forEach((content, index) => {
            const prefix = prefixes[index];
            const finalOptText = `${prefix} ${content}`;

            const btn = document.createElement('button');
            btn.innerText = finalOptText;
            btn.className = "quiz-choice-btn";
            
            const originalMatch = q.options.find(o => o.endsWith(content));
            btn.setAttribute("data-original-text", originalMatch);

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

            btn.onclick = () => {
                if (btn.disabled) return;
                
                Array.from(optionsBox.children).forEach(b => {
                    b.classList.remove('selected');
                    b.style.background = "#fff";
                    b.style.borderColor = "#dcdde1";
                    b.style.color = "inherit";
                    b.style.fontWeight = "normal";
                    b.style.boxShadow = "none";
                });

                btn.classList.add('selected');
                btn.style.background = "#f0f8ff";          
                btn.style.borderColor = "#2980b9";         
                btn.style.color = "#2980b9";               
                btn.style.fontWeight = "700";              
                btn.style.boxShadow = "0 4px 15px rgba(41, 128, 185, 0.15)"; 

                userSelectedAnswers[q.id] = finalOptText;
            };
            optionsBox.appendChild(btn);
        });

        qBox.appendChild(optionsBox);
        container.appendChild(qBox);
    });
}

// 👁️ 控制开关：切换文本赏析面板的显示与隐藏（实现原地展开、原地收起）
function toggleTeacherMode() {
    isTeacherMode = !isTeacherMode;
    const btn = document.getElementById('teacherToggleBtn');
    
    // 1. 改变按钮的外观样式
    if (isTeacherMode) {
        btn.innerText = "❌ 关闭文本赏析";
        btn.style.background = "#7d3c98";
    } else {
        btn.innerText = "👁️ 文本赏析";
        btn.style.background = "#9b59b6";
    }
    
    // 2. 控制课文顶部大赏析板的显隐
    const topAnalysis = document.getElementById('teacherArticleAnalysis');
    if (topAnalysis) {
        topAnalysis.style.display = isTeacherMode ? "block" : "none";
    }

    // 3. 循环批量切换正文各段赏析板的 display 状态（绝不重绘大树，体验极佳）
    const pPanels = document.querySelectorAll('.teacher-p-analysis');
    pPanels.forEach(panel => {
        panel.style.display = isTeacherMode ? "block" : "none";
    });

    // 4. 循环批量切换题目赏析板的 display 状态
    quizDataList.forEach(q => {
        const qPanel = document.getElementById(`q-analysis-${q.id}`);
        if (qPanel) {
            qPanel.style.display = isTeacherMode ? "block" : "none";
        }
    });
}

// ==================== 🎯 核心：错题隐藏式批改控制引擎 ====================
function submitAndShowWrongOnly() {
    const totalQuestions = quizDataList.length;
    const answeredCount = Object.keys(userSelectedAnswers).length;

    if (answeredCount < totalQuestions) {
        alert(`⚠️ 老师发现你还有未填完的习题哦！目前完成了 (${answeredCount} / ${totalQuestions}) 题。`);
        return;
    }

    let score = 0;

    quizDataList.forEach(q => {
        const qBox = document.querySelector(`div[data-q-id="${q.id}"]`);
        const buttons = qBox.querySelectorAll('.quiz-choice-btn');
        const studentOptText = userSelectedAnswers[q.id];

        let selectedBtn = null;
        buttons.forEach(btn => {
            if (btn.innerText === studentOptText) { selectedBtn = btn; }
        });

        const studentOriginalText = selectedBtn.getAttribute("data-original-text");
        const studentLetter = studentOriginalText.trim().charAt(0);

        buttons.forEach(btn => {
            btn.disabled = true; 
            btn.style.background = "#fff";
            btn.style.color = "inherit";
            btn.style.borderColor = "#dcdde1";
            btn.style.boxShadow = "none";

            if (btn === selectedBtn && studentLetter === q.answer) {
                btn.style.background = "#fff";
                btn.style.color = "inherit";
                btn.style.borderColor = "#dcdde1";
            }
            if (btn === selectedBtn && studentLetter !== q.answer) {
                btn.style.background = "#e74c3c";
                btn.style.color = "white";
                btn.style.borderColor = "#e74c3c";
                if (!btn.innerText.includes("  (❌️)")) btn.innerText = btn.innerText + "  (❌️)";
            }
        });

        if (studentLetter === q.answer) { score++; }
    });

    const resultBox = document.getElementById('quizResultScore');
    resultBox.style.display = "block";
    resultBox.innerHTML = `🎉 批改完成！您的当前得分是：<span style="font-size: 24px; color: #e67e22;">${score}</span> / ${totalQuestions} 分<br><small style="font-size:14px; font-weight:normal; color:#7f8c8d;">发现错题了？可以点击【重新作答】再试一次，或者点击【查看正确答案】。</small>`;
    
    document.getElementById('submitQuizBtn').style.display = "none";
    document.getElementById('retryQuizBtn').style.display = "inline-block";
    document.getElementById('showCorrectBtn').style.display = "inline-block";

    resultBox.scrollIntoView({ behavior: "smooth", block: "center" });
}

function retryQuizAnswers() {
    renderMultipleChoiceQuizzes();
    document.getElementById('quizResultScore').style.display = "none";
    document.getElementById('retryQuizBtn').style.display = "none";
    document.getElementById('showCorrectBtn').style.display = "none";
    
    document.getElementById('submitQuizBtn').style.display = "inline-block";
    document.getElementById('submitQuizBtn').disabled = false;
    document.getElementById('submitQuizBtn').style.background = "#34495e";
    document.getElementById('submitQuizBtn').innerText = "提交检查 🚀";
}

function revealRealCorrectAnswers() {
    quizDataList.forEach(q => {
        const qBox = document.querySelector(`div[data-q-id="${q.id}"]`);
        const buttons = qBox.querySelectorAll('.quiz-choice-btn');

        buttons.forEach(btn => {
            const btnOriginalText = btn.getAttribute("data-original-text");
            const btnLetter = btnOriginalText.trim().charAt(0); 

            if (btnLetter === q.answer) {
                if (!btn.innerText.includes("  (✅)")) {
                    btn.innerText = btn.innerText + "  (✅)";
                    if (!btn.innerText.includes("  (❌️)")) {
                        btn.style.fontWeight = "bold";
                        btn.style.color = "#2c3e50";
                        btn.style.borderColor = "#2ecc71"; 
                    }
                }
            }
        });
    });
    document.getElementById('showCorrectBtn').style.display = "none";
}

function submitAllAnswers() {
    submitAndShowWrongOnly();
}

// ==================== 🛠 *字词字典弹窗核心逻辑 ============================
function openPop(el, i) {
    currentIdx = i; const d = lessonData[i];
    document.getElementById('popWord').innerText = d[0];
    document.getElementById('popPinyin').innerText = `[${d[1]}]`;
    document.getElementById('popEn').innerText = d[2]; 
    document.getElementById('popBm').innerText = d[3];
    
    const pop = document.getElementById('buddyPopover'); 
    const arrow = document.getElementById('popArrow');
    pop.style.display = 'block'; 
    
    const rect = el.getBoundingClientRect(); 
    const popRect = pop.getBoundingClientRect();
    
    let top = rect.top - popRect.height - 15; 
    let left = rect.left + (rect.width / 2) - (popRect.width / 2);
    
    if (left + popRect.width > window.innerWidth - 15) left = window.innerWidth - popRect.width - 15;
    if (left < 15) left = 15;
    
    arrow.style.left = `${(rect.left + rect.width / 2) - left}px`; 
    pop.style.top = `${top}px`; 
    pop.style.left = `${left}px`;
}

function saveToNotebook(e) { 
    e.stopPropagation(); 
    if (!saved.includes(currentIdx)) { 
        saved.push(currentIdx); 
        localStorage.setItem('saved_104', JSON.stringify(saved)); 
        renderNB(); 
    } 
    const btn = e.target; 
    btn.innerText = "✓ 已存"; 
    setTimeout(() => btn.innerText = "Copy 📋", 1000); 
}

function renderNB() { 
    const list = document.getElementById('notebookList'); 
    if (saved.length === 0) { 
        list.innerHTML = "<span style='color:#999; font-size:13px;'>点击词语 Copy 记录生词</span>"; 
    } else { 
        list.innerHTML = ""; 
        saved.forEach(idx => { 
            const item = lessonData[idx]; 
            if(!item) return; 
            
            const div = document.createElement("div"); 
            div.className = "notebook-item"; 
            div.style.display = "inline-flex";
            div.style.alignItems = "center";
            div.style.gap = "6px";
            div.style.cursor = "pointer";

            const textSpan = document.createElement("span");
            textSpan.innerText = item[0];
            textSpan.onclick = (e) => { 
                e.stopPropagation(); 
                const target = document.querySelector(`ruby[data-word-index="${idx}"]`); 
                if(target) { 
                    target.scrollIntoView({behavior: "smooth", block: "center"}); 
                    document.querySelectorAll('ruby').forEach(r => r.classList.remove('is-active')); 
                    setTimeout(() => { 
                        target.classList.add('is-active'); 
                        openPop(target, idx); 
                    }, 500); 
                } 
            }; 
            div.appendChild(textSpan);

            const deleteBtn = document.createElement("span");
            deleteBtn.innerText = "×";
            deleteBtn.style.color = "#e74c3c";
            deleteBtn.style.fontWeight = "bold";
            deleteBtn.style.padding = "0 2px";
            deleteBtn.style.cursor = "pointer";
            deleteBtn.style.borderRadius = "50%";
            deleteBtn.style.transition = "all 0.2s";
            
            deleteBtn.onmouseenter = () => { deleteBtn.style.background = "#fce4e4"; };
            deleteBtn.onmouseleave = () => { deleteBtn.style.background = "transparent"; };
            
            deleteBtn.onclick = (e) => {
                e.stopPropagation(); 
                removeSingleWordFromNotebook(idx);
            };
            div.appendChild(deleteBtn);

            list.appendChild(div); 
        }); 
    } 
}

function removeSingleWordFromNotebook(idx) {
    saved = saved.filter(savedIdx => savedIdx !== idx);
    localStorage.setItem('saved_104', JSON.stringify(saved)); 
    renderNB(); 
    if (saved.length === 0) {
        document.getElementById('gameContainer').style.display = 'none'; 
        document.getElementById('gameToggleBtn').innerText = "🎯 生词测试";
    }
}

function forceClearNotebook() { localStorage.removeItem('saved_104'); saved = []; renderNB(); document.getElementById('gameContainer').style.display = 'none'; document.getElementById('gameToggleBtn').innerText = "🎯 生词测试"; }
function toggleGameMode() { const container = document.getElementById('gameContainer'); const btn = document.getElementById('gameToggleBtn'); if (container.style.display === 'block') { container.style.display = 'none'; btn.innerText = "🎯 生词测试"; } else { if (saved.length < 1) { alert("生词本是空的哦！要先在正文里点生词进行 Copy 收集！"); return; } container.style.display = 'block'; btn.innerText = "📖 返回课文"; startQuizGame(); container.scrollIntoView({behavior: "smooth"}); } }
function startQuizGame() { quizData = [...saved].sort(() => Math.random() - 0.5); currentQuizIdx = 0; loadQuestion(); }

function loadQuestion() { 
    isLocked = false; 
    const targetIdx = quizData[currentQuizIdx]; 
    const data = lessonData[targetIdx]; 
    document.getElementById('quizProgress').innerText = `第 ${currentQuizIdx + 1} / ${quizData.length} 题`; 
    document.getElementById('quizQuestion').innerText = data[0]; 
    document.getElementById('quizPinyin').innerText = `[${data[1]}]`; 
    
    const correctStr = (data[2].trim() + "；" + data[3].trim()); 
    let options = [correctStr]; 
    let others = lessonData.filter(d => d[1] !== "" && d[0] !== data[0]).map(d => (d[2].trim() + "；" + d[3].trim())); 
    others = [...new Set(others)].filter(s => s !== correctStr).sort(() => Math.random() - 0.5); 
    
    for(let i=0; i<3; i++) { if(others[i]) options.push(others[i]); } 
    options.sort(() => Math.random() - 0.5); 
    
    const optDiv = document.getElementById('quizOptions'); 
    optDiv.innerHTML = ""; 
    options.forEach(opt => { 
        const b = document.createElement('button'); 
        b.className = 'quiz-opt-btn'; 
        b.innerText = opt; 
        b.onclick = () => { 
            if(isLocked || b.classList.contains('wrong')) return; 
            if(opt.trim() === correctStr.trim()) { 
                isLocked = true; 
                b.classList.add('correct'); 
                setTimeout(() => { 
                    currentQuizIdx++; 
                    if(currentQuizIdx < quizData.length) loadQuestion(); 
                    else { alert("🎉 完成测试！你真棒！"); toggleGameMode(); } 
                }, 800); 
            } else { b.classList.add('wrong'); } 
        }; 
        optDiv.appendChild(b); 
    }); 
}

function toggleTheme() { document.documentElement.setAttribute('data-theme', document.documentElement.getAttribute('data-theme')==='dark'?'':'dark'); }
