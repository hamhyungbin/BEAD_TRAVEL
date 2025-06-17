// 백엔드 API 주소 (Render 배포 후 이 주소를 변경해야 합니다)
const API_URL = 'https://bead-travel-backend.onrender.com'; // 기본 주소

const form = document.getElementById('recommend-form');
const resultDiv = document.getElementById('result');
const resultContent = document.getElementById('result-content');
const loadingDiv = document.getElementById('loading');
const errorDiv = document.getElementById('error');

// 자동 완성을 위한 요소
const livedCityInput = document.getElementById('lived-city');
const dreamCityInput = document.getElementById('dream-city');
const livedCityList = document.getElementById('lived-city-list');
const dreamCityList = document.getElementById('dream-city-list');

let cityNames = [];

// 페이지 로드 시 도시 목록 가져오기
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch(`${API_URL}/cities`);
        if (!response.ok) {
            throw new Error('도시 목록을 불러오는 데 실패했습니다.');
        }
        cityNames = await response.json();
    } catch (error) {
        displayError(error.message);
    }
});

// 자동 완성 기능 함수
function setupAutocomplete(inputElement, listElement) {
    inputElement.addEventListener('input', () => {
        const value = inputElement.value.toLowerCase();
        listElement.innerHTML = '';
        if (!value) return;

        const filteredCities = cityNames.filter(city =>
            city.toLowerCase().startsWith(value)
        );

        filteredCities.forEach(city => {
            const item = document.createElement('div');
            item.textContent = city;
            item.addEventListener('click', () => {
                inputElement.value = city;
                listElement.innerHTML = '';
            });
            listElement.appendChild(item);
        });
    });
}

setupAutocomplete(livedCityInput, livedCityList);
setupAutocomplete(dreamCityInput, dreamCityList);

// 다른 곳 클릭 시 자동완성 목록 닫기
document.addEventListener('click', (e) => {
    if (!e.target.closest('.autocomplete-container')) {
        livedCityList.innerHTML = '';
        dreamCityList.innerHTML = '';
    }
});


// 폼 제출 이벤트 핸들러
form.addEventListener('submit', async (event) => {
    event.preventDefault();

    resultDiv.classList.add('hidden');
    errorDiv.classList.add('hidden');
    loadingDiv.classList.remove('hidden');

    const livedCity = livedCityInput.value;
    const dreamCity = dreamCityInput.value;
    const priority = document.getElementById('priority').value;

    try {
        const response = await fetch(`${API_URL}/recommend`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                lived_city: livedCity,
                dream_city: dreamCity,
                priority: priority,
            }),
        });

        loadingDiv.classList.add('hidden');

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || '알 수 없는 오류가 발생했습니다.');
        }
        
        displayResult(data);

    } catch (error) {
        displayError(error.message);
    }
});

function displayResult(data) {
    resultContent.innerHTML = `
        <h3>${data.name}, ${data.country}</h3>
        <p>${data.description}</p>
    `;
    resultDiv.classList.remove('hidden');
}

function displayError(message) {
    errorDiv.querySelector('p').textContent = `오류: ${message}`;
    errorDiv.classList.remove('hidden');
}