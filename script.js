const CONSTANTS = {
    MAX_VIDEOS: 30,
    MILESTONES: [10, 20, 30],
    COLORS: {
        pistis: ['#3b82f6', '#93c5fd', '#ffffff'], // Blue variants for Confetti
        elpis: ['#22c55e', '#86efac', '#ffffff'],  // Green variants
        agape: ['#ef4444', '#fca5a5', '#ffffff']   // Red variants
    }
};

// ==========================================
// 1. INIT HỆ THỐNG SAU KHI DOM TẢI XONG
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

async function initApp() {
    try {
        const teamsData = await fetchTeamData();
        renderGame(teamsData);
    } catch (error) {
        console.error("Lỗi khi tải dữ liệu:", error);
    }
}

// ==========================================
// 2. MOCK FETCH DATA CỦA 3 ĐỘI (Yêu Cầu TDD)
// ==========================================
async function fetchTeamData() {
    const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSgLqhRbRhpB0uxdCQWrvoM_LPBS84zkiLvAsoLHbmP97vpjNY3Ic-f-hlsUBZD84opvNheCwRBoZCf/pub?output=tsv';
    
    try {
        const response = await fetch(csvUrl);
        const tsvText = await response.text();
        
        // Phân tích dữ liệu TSV (Tab-Separated Values)
        const lines = tsvText.trim().split('\n');
        
        // Mảng chứa kết quả mặc định
        const teamsData = [
            { id: 'pistis', count: 0 },
            { id: 'elpis', count: 0 },
            { id: 'agape', count: 0 }
        ];

        // Duyệt qua các dòng (bỏ qua dòng tiêu đề đầu tiên nếu có: i = 1)
        for (let i = 1; i < lines.length; i++) {
            const columns = lines[i].split('\t'); // Dữ liệu tsv cách nhau bằng tab
            if (columns.length >= 2) {
                // Team name trong sheets có thể có chữ in hoa (Pistis, Elpis, Agape), chuyển thành chữ thường để so sánh map ID
                const teamName = columns[0].trim().toLowerCase();
                const videoCount = parseInt(columns[1].trim(), 10);
                
                // Cập nhật số lượng cho đúng đội (nếu tên trong cột trùng với id)
                const targetTeam = teamsData.find(t => t.id === teamName);
                if (targetTeam && !isNaN(videoCount)) {
                    targetTeam.count = videoCount;
                }
            }
        }
        
        console.log("Dữ liệu fetch từ Google Sheets:", teamsData);
        return teamsData;
        
    } catch (error) {
        console.error("Lỗi khi tải dữ liệu từ Google Sheets:", error);
        // Fallback mặc định về 0 nếu người dùng mất mạng
        return [
            { id: 'pistis', count: 0 },
            { id: 'elpis', count: 0 },
            { id: 'agape', count: 0 }
        ];
    }
}

// ==========================================
// 3. LOGIC XỬ LÝ GIAO DIỆN (RENDER SYSTEM)
// ==========================================
function renderGame(teams) {
    // 3.1. Tìm ra đội cao nhất (Top 1 Leaderboard)
    let maxScore = -1;
    teams.forEach(t => {
        if (t.count > maxScore) maxScore = t.count;
    });

    // 3.2 Cập nhật từng đội
    teams.forEach(team => {
        updateTeamDashboard(team, maxScore);
    });
}

function updateTeamDashboard(team, maxScore) {
    const { id, count } = team;
    
    // Selectors
    const card = document.getElementById(`card-${id}`);
    const countText = document.getElementById(`count-${id}`);
    const progressBar = document.getElementById(`progress-${id}`);
    const baseTreeImage = document.querySelector(`#tree-${id} .base-tree`);
    const treeWrapper = document.getElementById(`tree-${id}`);

    // --- A. Text Count & Progress Bar ---
    countText.innerText = count;
    const progressPercentage = Math.min((count / CONSTANTS.MAX_VIDEOS) * 100, 100);
    // Timeout nhỏ để thanh chạy mượt từ 0 chạy lên lúc tải trang (CSS Transition)
    setTimeout(() => {
        progressBar.style.width = `${progressPercentage}%`;
    }, 100);

    // --- B. Image Logic (Seed -> Sprout -> Sapling) ---
    let treeStageStr = 'seed';
    if (count >= 3) {
        treeStageStr = 'sapling';
    } else if (count >= 2) {
        treeStageStr = 'sprout';
    }
    // Gán đường dẫn file tương ứng (seed_tên.png, v.v)
    baseTreeImage.src = `${treeStageStr}_${id}.png`;

    // --- C. Top 1 Leaderboard (Glow & Crown) ---
    // Kiểm tra top 1 (Phải có > 0 clip mới tính là đua và có vương miện)
    if (count === maxScore && count > 0) {
        card.classList.add('top-1');
        // Gắn vương miện nếu chưa có (Tránh gắn đè nhiều crown)
        if (!treeWrapper.querySelector('.crown')) {
            const crownEl = document.createElement('div');
            crownEl.className = 'crown';
            crownEl.innerText = '👑';
            treeWrapper.appendChild(crownEl);
        }
    } else {
        card.classList.remove('top-1');
        const existingCrown = treeWrapper.querySelector('.crown');
        if (existingCrown) existingCrown.remove();
    }

    // --- D. Milestone Confetti ---
    handleMilestoneConfetti(id, count);

    // --- E. Leaf Generation (Mọc lá trên cây sapling) ---
    if (count >= 3) {
        const totalLeavesNeeded = count - 3;
        handleLeafGrowth(id, treeWrapper, totalLeavesNeeded);
    }
}

// ==========================================
// 4. PHÁO GIẤY THEO MỐC (CANVAS CONFETTI)
// ==========================================
function handleMilestoneConfetti(teamId, currentCount) {
    const lsConfettiKey = `milestone_reached_${teamId}`;
    const highestMilestoneInStorage = parseInt(localStorage.getItem(lsConfettiKey) || '0', 10);

    // Kiểm tra currentCount có vượt mốc nào chưa
    let currentTopMilestone = 0;
    for (let i = CONSTANTS.MILESTONES.length - 1; i >= 0; i--) {
        const threshold = CONSTANTS.MILESTONES[i];
        if (currentCount >= threshold) {
            currentTopMilestone = threshold;
            break;
        }
    }

    // Nếu mốc đợt này lớn hơn mốc đã lưu trong máy -> BẮN PHÁO GIẤY!
    if (currentTopMilestone > highestMilestoneInStorage) {
        shootConfettiForTeam(teamId);
        // Lưu lại mốc này vào LocalStorage tránh bắn lại lần F5 sau
        localStorage.setItem(lsConfettiKey, currentTopMilestone);
    }

    // EDGE CASE: Admin giảm điểm lùi (VD: nhầm 30 -> sửa về 20)
    // -> Hạ mốc lưu xuống theo để khi đội cày lại từ 20 -> 30, pháo giấy vẫn bắn đúng.
    if (currentTopMilestone < highestMilestoneInStorage) {
        localStorage.setItem(lsConfettiKey, currentTopMilestone);
    }
}

function shootConfettiForTeam(teamId) {
    const colorsArr = CONSTANTS.COLORS[teamId] || ['#ffffff'];
    const duration = 3000; // 3 seconds of glory
    const animationEnd = Date.now() + duration;

    (function frame() {
        // Pháo giấy bắn hai luồng từ 2 góc mép màn hình vào
        confetti({
            particleCount: 7,
            angle: 60,
            spread: 60,
            origin: { x: 0, y: 0.8 },
            colors: colorsArr,
            zIndex: 9999
        });
        confetti({
            particleCount: 7,
            angle: 120,
            spread: 60,
            origin: { x: 1, y: 0.8 },
            colors: colorsArr,
            zIndex: 9999
        });

        if (Date.now() < animationEnd) {
            requestAnimationFrame(frame);
        }
    }());
}

// ==========================================
// 5. THUẬT TOÁN SINH LÁ (LOCALSTORAGE & BOUNDING BOX)
// ==========================================
function handleLeafGrowth(teamId, container, targetTotalLeaves) {
    const lsLeafKey = `leaves_seen_${teamId}`;
    const previousLeaves = parseInt(localStorage.getItem(lsLeafKey) || '0', 10);

    // 1. Render lá cũ (đã từng xem) HIỆN SẴN KHÔNG CẦN TIMEOUT
    const stableLeaves = Math.min(previousLeaves, targetTotalLeaves);
    for (let i = 0; i < stableLeaves; i++) {
        spawnLeafEl(container, false);
    }

    // 2. Render lá MỚI CÓ ANIMATION MỌC CĂNG (Nếu count > số cũ)
    if (targetTotalLeaves > previousLeaves) {
        const newLeavesDelta = targetTotalLeaves - previousLeaves;
        
        // Delay nửa giây cho UX có thời gian tập trung nhìn cây
        setTimeout(() => {
            for (let i = 0; i < newLeavesDelta; i++) {
                spawnLeafEl(container, true);
            }
        }, 600);

        // Lưu lại số lượng mới để sau user vào không animate nữa
        localStorage.setItem(lsLeafKey, targetTotalLeaves);
    }

    // EDGE CASE: Admin giảm điểm lùi (VD: Pistis từ 30 sửa về 20)
    // -> Hạ mức localStorage xuống theo thực tế để khi cày dần về 30, animation vẫn chạy đúng.
    if (targetTotalLeaves < previousLeaves) {
        localStorage.setItem(lsLeafKey, targetTotalLeaves);
    }
}

// Hàm lõi: Tạo ảnh lá, tính tọa độ randomize theo Bounding Box "Upper 1/2" của Sapling
function spawnLeafEl(parentElement, isNewAnimate) {
    const leaf = document.createElement('img');
    leaf.src = 'leaf.png';
    
    // Class CSS
    leaf.className = 'leaf';
    if (isNewAnimate) {
        leaf.classList.add('animate-grow');
    }

    // THUẬT TOÁN BOUNDING BOX: UPPER 1/2 of Container (Container là 260x360)
    // - Chiều dọc (Top): Từ trên cao nhất xuống khoảng giữa thân cây = 15% -> 45% (Chừa không gian hổng góc dưới chậu)
    // - Chiều ngang (Left): Xung quanh trục dọc giữa thân = 25% -> 75%
    const topPer = 15 + Math.random() * 30; // Random trong khoảng [15%, 45%]
    const leftPer = 25 + Math.random() * 50; // Random trong khoảng [25%, 75%]
    const rotDeg = Math.floor(Math.random() * 360); // Random xoay tứ phía
    
    // Flip theo trục ngang (Cùng 1 file lá nhưng hướng ngẫu nhiên)
    const scaleX = Math.random() > 0.5 ? 1 : -1;

    // Set variable vào CSS Inline style để Animation KeyFrames đọc được và xoay mượt mà
    leaf.style.setProperty('--top', `${topPer}%`);
    leaf.style.setProperty('--left', `${leftPer}%`);
    leaf.style.setProperty('--rot', `${rotDeg}deg`);
    leaf.style.setProperty('--scaleX', scaleX);

    parentElement.appendChild(leaf);
}
