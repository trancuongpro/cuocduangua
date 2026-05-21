const pairs = [];
for (let i = 1; i <= 6; i++) {
    for (let j = i + 1; j <= 6; j++) {
        pairs.push(`${i}-${j} và ${j}-${i}`);
    }
}

let userBalance = parseInt(localStorage.getItem('ngua_dua_balance')) || 1000;
const betData = Array(15).fill(0); 
let isMusicPlaying = false;
const WIN_RATE = 12;

const bettingGrid = document.getElementById('betting-grid');
const balanceDisplay = document.getElementById('user-balance');
const btnStart = document.getElementById('btn-start');
const btnGuide = document.getElementById('btn-guide');
const btnCloseGuide = document.getElementById('btn-close-guide');
const guideModal = document.getElementById('guide-modal');
const guideText = document.getElementById('guide-text');
const audioToggle = document.getElementById('audio-toggle');
const bgMusic = document.getElementById('bg-music');
const iconSoundOn = document.getElementById('icon-sound-on');
const iconSoundOff = document.getElementById('icon-sound-off');

const betScreenContent = document.getElementById('bet-screen-content');
const raceScreen = document.getElementById('race-screen');
const countdownDiv = document.getElementById('countdown');
const trackArea = document.getElementById('track-area');
const raceResultOverlay = document.getElementById('race-result-overlay');
const resultText = document.getElementById('result-text');
const soundStart = document.getElementById('sound-start');
const soundRace = document.getElementById('sound-race');

balanceDisplay.textContent = userBalance;
if (typeof noiDungHuongDan !== 'undefined') guideText.textContent = noiDungHuongDan;

document.addEventListener('contextmenu', function(e) { e.preventDefault(); });

function initAutoplayMusic() {
    if (!isMusicPlaying) {
        bgMusic.play().then(() => {
            isMusicPlaying = true;
            iconSoundOn.classList.remove('hidden');
            iconSoundOff.classList.add('hidden');
            document.removeEventListener('click', initAutoplayMusic);
        }).catch(() => {});
    }
}
document.addEventListener('click', initAutoplayMusic);

function playBeepSound() {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine'; osc.frequency.setValueAtTime(850, ctx.currentTime); 
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12); 
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(); osc.stop(ctx.currentTime + 0.12);
    } catch(e) {}
}

pairs.forEach((pairText, index) => {
    const box = document.createElement('div');
    box.className = 'bet-box';
    box.dataset.index = index;
    box.innerHTML = `
        <button class="btn-minus">-</button>
        <span class="bet-box-text">${pairText}</span>
        <div class="bet-count" id="count-${index}">0</div>
    `;
    bettingGrid.appendChild(box);
});

bettingGrid.addEventListener('click', function(e) {
    const box = e.target.closest('.bet-box');
    if (!box) return;
    const index = parseInt(box.dataset.index);

    if (e.target.classList.contains('btn-minus')) {
        e.stopPropagation();
        if (betData[index] > 0) {
            betData[index]--; userBalance++;
            updateBetUI(index);
        }
        return;
    }
    if (betData[index] < 20 && userBalance > 0) {
        createCoinAnimationFromWallet(box);
        betData[index]++; userBalance--;
        updateBetUI(index);
    }
});

function updateBetUI(index) {
    balanceDisplay.textContent = userBalance;
    localStorage.setItem('ngua_dua_balance', userBalance);
    if (index !== -1) {
        const countBadge = document.getElementById(`count-${index}`);
        countBadge.textContent = betData[index];
        countBadge.style.display = betData[index] > 0 ? 'block' : 'none';
    }
}

function createCoinAnimationFromWallet(targetBox) {
    const walletIcon = document.querySelector('.coin-icon');
    if (!walletIcon) return;
    const walletRect = walletIcon.getBoundingClientRect();
    const boxRect = targetBox.getBoundingClientRect();
    const coin = document.createElement('img');
    coin.src = 'tienvang.png'; coin.className = 'floating-coin';
    coin.style.left = `${walletRect.left}px`; coin.style.top = `${walletRect.top}px`;
    document.body.appendChild(coin);
    setTimeout(() => {
        coin.style.left = `${boxRect.left + (boxRect.width / 2) - 12}px`;
        coin.style.top = `${boxRect.top + (boxRect.height / 2) - 12}px`;
    }, 10);
    coin.addEventListener('transitionend', () => coin.remove());
}

btnGuide.addEventListener('click', () => guideModal.classList.remove('hidden'));
btnCloseGuide.addEventListener('click', () => guideModal.classList.add('hidden'));

audioToggle.addEventListener('click', (e) => {
    e.stopPropagation(); 
    if (!isMusicPlaying) {
        bgMusic.play().then(() => {
            isMusicPlaying = true; iconSoundOn.classList.remove('hidden'); iconSoundOff.classList.add('hidden');
        });
    } else {
        bgMusic.pause(); isMusicPlaying = false;
        iconSoundOn.classList.add('hidden'); iconSoundOff.classList.remove('hidden');
    }
});

btnStart.addEventListener('click', () => {
    if (betData.reduce((a, b) => a + b, 0) === 0) {
        alert("Vui lòng đặt cược ít nhất một ô!"); return;
    }
    if (isMusicPlaying) bgMusic.pause();
    betScreenContent.classList.add('hidden');
    raceScreen.classList.remove('hidden');
    setupHorses();
    triggerCountdown();
});

function triggerCountdown() {
    let count = 3; countdownDiv.textContent = count; playBeepSound(); 
    const interval = setInterval(() => {
        count--;
        if (count > 0) {
            countdownDiv.textContent = count; playBeepSound(); 
        } else if (count === 0) {
            countdownDiv.textContent = "CHẠY!"; soundStart.play();
            soundStart.onended = () => soundRace.play();
            startRaceLogic();
        } else {
            clearInterval(interval); countdownDiv.textContent = "";
        }
    }, 1000);
}

// ================= THUẬT TOÁN ĐIỀU PHỐI ĐƯỜNG ĐUA CHUẨN XÁC THEO TIMING CỦA BẠN =================
function startRaceLogic() {
    const horseOrder = [1,2,3,4,5,6].sort(() => Math.random() - 0.5);
    const firstPlace = horseOrder[0];
    const secondPlace = horseOrder[1];

    const startTime = Date.now();
	let resultShown = false;
    const horseParams = {};

    horseData.forEach((h, index) => {
        horseParams[h.id] = {

    // độ lệch đầu game
    baseSpeedOffset: -35 + Math.random() * 70,

    // lệch line nhẹ
    yOffset: Math.random() * 8,

    // delay ôm cua
    curveDelay: index * 40,

    // nhịp tăng tốc riêng
    speedStyle: Math.random(),

    // sức bứt cuối
    sprintPower: 0.7 + Math.random() * 0.9
};
    });

    const moveInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const trackWidth = trackArea.clientWidth || 364;
        
        // Khúc cua ôm lùi lề phải hợp lý cho ngựa 150px
        const maxSafeRight = trackWidth - 150; 

        // ================= GIÂY 25 HIỆN BẢNG =================
if (elapsed >= 25000 && !resultShown) {

    resultShown = true;

    showRaceResultBox(firstPlace, secondPlace);

    // nền hơi trong để còn thấy ngựa lao phía sau
    raceResultOverlay.style.background = 'rgba(0,0,0,0.45)';
}

// ================= GIÂY 27 NGỰA BIẾN MẤT =================
if (elapsed >= 27000) {

    clearInterval(moveInterval);

    horseData.forEach((h) => {
        const el = document.getElementById(`horse-${h.id}`);
        if (el) el.style.left = '-150px';
    });

    return;
}

        // ================= XỬ LÝ LỘ TRÌNH CHẠY NGỰA THEO THỜI GIAN THỰC =================
        horseData.forEach((h, idx) => {
            const el = document.getElementById(`horse-${h.id}`);
            if (!el) return;

            let meta = horseParams[h.id];
            let finalX = 0; 
            let finalY = 0;
            let angleRotation = 0; 
            let flipHorse = false;

            // ĐÃ HẠ XUỐNG: Đường đi hạ xuống 124px, đường về hạ xuống hẳn 254px lọt lòng cực đẹp
            let topLaneY = 124 + (idx * 4.5) + meta.yOffset;
            let bottomLaneY = 254 + (idx * 4.5) + meta.yOffset;

            // Biên độ nhấp nhô so kè liên tục sinh động
            // dao động nhẹ tạo cảm giác bám đuổi
let waveChaos =

    Math.sin(
        elapsed * (
            0.0015 +
            meta.speedStyle * 0.0012
        ) + h.id
    ) * 10;

            if (elapsed <= 10000) {
                // CHẶNG 1: 0 -> 10 giây (Đường trên chạy sang phải tới khúc cua)
                let progress = elapsed / 10000;
                let startX = -100;
                let targetX = maxSafeRight + meta.baseSpeedOffset;
                
                finalX = startX + (targetX - startX) * progress + waveChaos;
                if (finalX > maxSafeRight) finalX = maxSafeRight;
                
                finalY = topLaneY;
                angleRotation = 0;
                flipHorse = false;
            } 
            else if (elapsed > 10000 && elapsed <= 18000) {
                // CHẶNG 2: 10 -> 18 giây (Bo cua xoay đầu mượt mà)
                let localElapsed = elapsed - 10000;
                let progress = Math.max(0, Math.min(1, (localElapsed - meta.curveDelay / 2) / (8000 - meta.curveDelay / 2)));

                if (progress <= 0.5) {

    let p = progress * 2;

    // mỗi ngựa có bán kính cua riêng
    let curveSpread =
        (idx - 2.5) * 10;

    // lệch ngang khi ôm cua
    finalX =
        maxSafeRight
        -
        (idx * 2) * (1 - p)
        +
        curveSpread * 0.22;

    // lệch dọc tạo line riêng
    finalY =
        topLaneY
        +
        (bottomLaneY - topLaneY) *
        0.5 *
        p
        +
        curveSpread * 0.18;

    angleRotation =
        p * (42 + idx * 2);

    flipHorse = false;

} else {

    let p = (progress - 0.5) * 2;

    let curveSpread =
        (idx - 2.5) * 10;

    finalX =
        maxSafeRight
        -
        (maxSafeRight * 0.15 * p)
        +
        curveSpread * 0.22;

    finalY =
        (topLaneY +
        (bottomLaneY - topLaneY) * 0.5)

        +

        (bottomLaneY -
        (topLaneY +
        (bottomLaneY - topLaneY) * 0.5)) * p

        +

        curveSpread * 0.18;

    angleRotation =
        (1 - p) * (35 + idx);

    flipHorse = true;
}
            } 
            else {
                // CHẶNG 3: 18 -> 27 giây (Nước rút về lề trái)
                // Phân bổ tỉ lệ thời gian: Giây 18->25 (Tiến sát mép trái) | Giây 25->27 (Lao mất hút hình)
                flipHorse = true;
                let startX = maxSafeRight - (maxSafeRight * 0.15);
                let edgeLeftX = 1;       // Vị trí sát mép màn hình trái
                let disappearX = -200;   // Vị trí chạy khuất hoàn toàn khỏi khung hình

                if (elapsed <= 25000) {
                    // Từ giây 18 đến 25 (Chạy từ khúc cua về sát mép trái)
                    let stageProgress = (elapsed - 18000) / 9000; // Đoạn này dài 8.5 giây
                    
                    // Thêm khoảng cách phân cấp thứ hạng bứt tốc rõ rệt
                    let rankingBonus = 0;
                    if (h.id === firstPlace) {

    rankingBonus =
        -70 *
        stageProgress *
        meta.sprintPower;

}
else if (h.id === secondPlace) {

    rankingBonus =
        -38 *
        stageProgress *
        meta.sprintPower;

}
else {

    rankingBonus =
        Math.sin(
            elapsed * 0.002 + idx
        ) * 6;
}

                    finalX = startX - (startX - edgeLeftX) * stageProgress + rankingBonus + waveChaos;
                    
                    // Giữ chân không cho ngựa lọt ra ngoài mép trước giây thứ 25
                    if (finalX < edgeLeftX) finalX = edgeLeftX + (idx * 4);
                } else {
                    // Từ giây 25 đến 27 (Lao thẳng ra ngoài mép trái mất hút hình hoàn toàn)
                    let stageProgress = (elapsed - 25000) / 2000; // Đoạn này dài đúng 2 giây còn lại
                    
                    let currentStartX = edgeLeftX + (idx * 4);
                    // Con nào thắng sẽ phóng biến mất nhanh hơn
                    let exitSpeed = 1.0;
                    if (h.id === firstPlace) exitSpeed = 1.4;
                    else if (h.id === secondPlace) exitSpeed = 1.2;

                    finalX = currentStartX - (currentStartX - disappearX) * stageProgress * exitSpeed;
                }

                finalY = bottomLaneY;
                angleRotation = 0;
            }

            // Thực thi hiệu ứng lên CSS
            let scaleStr = flipHorse ? 'scaleX(-1)' : 'scaleX(1)';
            el.style.left = `${finalX}px`;
            el.style.top = `${finalY}px`;
            el.style.transform = `${scaleStr} rotate(${angleRotation}deg)`;
        });
    }, 40);
}

function showRaceResultBox(w1, w2) {
    soundRace.pause(); soundRace.currentTime = 0;
    let totalWin = 0;
    pairs.forEach((pairText, index) => {
        const targetPattern1 = `${w1}-${w2}`;
        const targetPattern2 = `${w2}-${w1}`;
        if (pairText.includes(targetPattern1) || pairText.includes(targetPattern2)) {
            const winAmount = betData[index] * WIN_RATE;
            totalWin += winAmount; userBalance += winAmount;
        }
    });

    localStorage.setItem('ngua_dua_balance', userBalance);

    resultText.innerHTML = `
        KẾT QUẢ CHUNG CUỘC<br>
        <span style="font-size:25px; color:#ffd700;">Hạng 1: Ngựa ${w1} - Hạng 2: Ngựa ${w2}</span>
    `;

    const winHTML = totalWin > 0 
        ? `<div class="win-amount" style="font-size:24px; color:#00ff00; margin-top:10px;">🎉 Bạn Thắng +${totalWin} Tiền Vàng!</div>` 
        : `<div class="win-amount" style="font-size:22px; color:#ff6666; margin-top:10px;">Không Có Cược Nào Trúng</div>`;

    raceResultOverlay.innerHTML = `
        <div style="background: rgba(139, 0, 0, 0.96); border: 3px solid #ffd700; padding: 25px; border-radius: 12px; text-align: center; box-shadow: 0 0 25px #ffd700; width: 85%;">
            <div class="result-text">${resultText.innerHTML}</div>
            ${winHTML}
            <div id="result-countdown-timer" style="font-size: 15px; color: #ffd700; font-weight: bold; margin-top: 20px; background: rgba(0,0,0,0.4); padding: 6px; border-radius: 20px;">Quay Lại Đặt Cược Sau: 7 Giây</div>
        </div>
    `;
    raceResultOverlay.classList.remove('hidden');

    let timeLeft = 7;
    const timerDisplay = document.getElementById('result-countdown-timer');
    const resultCountdownInterval = setInterval(() => {
        timeLeft--;
        if (timeLeft > 0) {
            timerDisplay.textContent = `Quay Lại Đặt Cược Sau: ${timeLeft} Giây`;
        } else {
            clearInterval(resultCountdownInterval);
            if (userBalance === 0) {
                alert("Vì Bạn Chơi Hết Vàng Nên Hệ Thống Tặng Bạn 1000 Vàng Chơi Cho Vui Nha");
                userBalance = 1000;
            }
            resetGame();
        }
    }, 1000);
}

function resetGame() {
    betData.fill(0);
    document.querySelectorAll('.bet-count').forEach(el => el.style.display = 'none');
    betScreenContent.classList.remove('hidden');
    raceScreen.classList.add('hidden');
    raceResultOverlay.classList.add('hidden');
	raceResultOverlay.style.background = 'rgba(0,0,0,0.85)';
    updateBetUI(-1);
}