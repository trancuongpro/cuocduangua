const horseData = [
    { id: 1, img: 'nguadengoc.gif', name: 'Ngựa Đen' },
    { id: 2, img: 'nguado.gif', name: 'Ngựa Đỏ' },
    { id: 3, img: 'nguahong.gif', name: 'Ngựa Hồng' },
    { id: 4, img: 'nguavang.gif', name: 'Ngựa Vàng' },
    { id: 5, img: 'nguaxanhduong.gif', name: 'Ngựa Xanh Dương' },
    { id: 6, img: 'nguaxanhla.gif', name: 'Ngựa Xanh Lá' }
];

function setupHorses() {
    const trackArea = document.getElementById('track-area');
    trackArea.innerHTML = ''; 

    // ĐÃ CẬP NHẬT: Hạ tọa độ Y xuất phát xuống đúng tầm 124px cho chuẩn lòng đường nhựa trên
    horseData.forEach((h) => {
        const horseDiv = document.createElement('div');
        horseDiv.className = 'horse-entity';
        horseDiv.id = `horse-${h.id}`;
        
        horseDiv.style.left = '-120px';
        horseDiv.style.top = '124px'; 

        horseDiv.innerHTML = `
            <img src="${h.img}" id="gif-${h.id}">
            <div class="horse-number-tag">${h.id}</div>
        `;
        trackArea.appendChild(horseDiv);
    });
}