
const slides = document.querySelectorAll('.carousel-item');
const prevButton = document.querySelector('.prev-button');
const nextButton = document.querySelector('.next-button');
const indicators = document.querySelectorAll('.indicator');
let currentSlide = 0;

function showSlide(index) {
    slides.forEach((slide, i) => {
        if (i === index) {
            slide.classList.add('active-slide');
            slide.classList.remove('opacity-0');
            slide.classList.add('opacity-100');
        } else {
            slide.classList.remove('active-slide');
            slide.classList.remove('opacity-100');
            slide.classList.add('opacity-0');
        }
    });

    indicators.forEach((ind, i) => {
        if (i === index) {
            ind.classList.add('active-indicator');
            ind.classList.remove('opacity-50');
            ind.classList.add('opacity-75');
        } else {
            ind.classList.remove('active-indicator');
            ind.classList.remove('opacity-75');
            ind.classList.add('opacity-50');
        }
    });
}

function nextSlide() {
    currentSlide = (currentSlide + 1) % slides.length;
    showSlide(currentSlide);
}

function prevSlide() {
    currentSlide = (currentSlide - 1 + slides.length) % slides.length;
    showSlide(currentSlide);
}

if(nextButton) nextButton.addEventListener('click', nextSlide);
if(prevButton) prevButton.addEventListener('click', prevSlide);

setInterval(nextSlide, 5000);


const translations = {
    'en': {
        'title': 'Enter a URL to Detect Homoglyphs',
        'subtitle': 'Protect yourself from phishing attacks where characters look identical but point to different websites.',
        'detect': 'Detect',
        'placeholder': 'e.g., apple.cοm or microsoft.com',
        'step1_title': '1. Copy URL',
        'step1_desc': 'Copy the link you want to check.',
        'step2_title': '2. Paste & Detect',
        'step2_desc': 'Paste into the box below and hit Detect.',
        'step3_title': '3. Analyze',
        'step3_desc': 'See if hidden characters are found.',
        'error_empty': 'Please enter a URL.',
        'detecting': 'Scanning...',
        'error_server': 'Failed to connect to the server. Make sure app.py is running.',
        'safe_message': 'No homoglyphs detected. URL structure looks standard.',
        'warning_message': 'Warning: Potential homoglyph attack detected!',
        'cleaned_url': 'Cleaned URL Structure',
        'findings': 'Detailed Findings',
        'part_detected': 'In Part:',
        'looks_like': 'mimics',
        'lang_display': 'ENG'
    },
    'id': {
        'title': 'Masukkan URL untuk Deteksi Homoglyph',
        'subtitle': 'Lindungi diri dari serangan phishing di mana karakter terlihat sama namun menuju situs berbeda.',
        'detect': 'Deteksi',
        'placeholder': 'contoh: apple.cοm',
        'step1_title': '1. Salin URL',
        'step1_desc': 'Salin link yang ingin Anda periksa.',
        'step2_title': '2. Tempel & Cek',
        'step2_desc': 'Tempel di kotak bawah dan klik Deteksi.',
        'step3_title': '3. Analisa',
        'step3_desc': 'Lihat apakah ada karakter tersembunyi.',
        'error_empty': 'Mohon masukkan URL.',
        'detecting': 'Sedang memindai...',
        'error_server': 'Gagal terhubung ke server. Pastikan app.py berjalan.',
        'safe_message': 'Tidak ditemukan homoglyph. Struktur URL terlihat standar.',
        'warning_message': 'Peringatan: Potensi serangan homoglyph terdeteksi!',
        'cleaned_url': 'Struktur URL Bersih',
        'findings': 'Temuan Detail',
        'part_detected': 'Pada Bagian:',
        'looks_like': 'meniru',
        'lang_display': 'IND'
    }
};

let currentLang = 'en';

function getTranslation(key) {
    return translations[currentLang][key] || key;
}

function switchLanguage(lang) {
    currentLang = lang;
    
    document.querySelectorAll('[data-key]').forEach(el => {
        const key = el.getAttribute('data-key');
        if (el.tagName === 'BUTTON' && el.querySelector('.btn-text')) {
             el.querySelector('.btn-text').textContent = getTranslation(key);
        } else {
             el.textContent = getTranslation(key);
        }
    });

    const input = document.getElementById('url-input');
    if(input) input.placeholder = getTranslation('placeholder');

    document.getElementById('current-lang').textContent = getTranslation('lang_display');
}

document.querySelectorAll('.dropdown-content a').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const lang = e.target.getAttribute('data-lang');
        switchLanguage(lang);
    });
});



const detectBtn = document.getElementById('detect-button');
const urlInput = document.getElementById('url-input');
const resultContainer = document.getElementById('result-container');

const inputIcon = document.getElementById('input-icon');

function toggleInputIcon() {
    if (urlInput.value.trim().length > 0) {
        inputIcon.classList.add('opacity-0');
    } else {
        inputIcon.classList.remove('opacity-0');
    }
}

if (urlInput && inputIcon) {
    urlInput.addEventListener('input', toggleInputIcon);
    toggleInputIcon();
}

detectBtn.addEventListener('click', () => {
    const url = urlInput.value.trim();
    if (!url) {
        alert(getTranslation('error_empty'));
        return;
    }

    const btnText = detectBtn.querySelector('.btn-text');
    const originalText = btnText.textContent;
    btnText.textContent = getTranslation('detecting');
    detectBtn.disabled = true;

    fetch('/detect', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url: url })
    })
    .then(response => response.json())
    .then(data => {
        displayResult(data);
    })
    .catch(error => {
        console.error('Error:', error);
        resultContainer.innerHTML = `<div class="warning-box"><i class="fi fi-rr-exclamation"></i> <div>${getTranslation('error_server')}</div></div>`;
    })
    .finally(() => {
        btnText.textContent = originalText;
        detectBtn.disabled = false;
    });
});


function highlightPart(text, findings) {
    if (!findings || findings.length === 0) return text;
    
    let chars = Array.from(text);
    
    const sortedFindings = [...findings].sort((a, b) => b.index - a.index);

    sortedFindings.forEach(f => {
        if (f.index >= 0 && f.index < chars.length) {
            chars[f.index] = `<span class="homoglyph-char">${chars[f.index]}</span>`;
        }
    });

    return chars.join('');
}


function displayResult(data) {
    let html = '';

    html += `
        <div class="analysis-card mb-6">
            <h3 class="text-lg font-bold text-white mb-4 border-b border-gray-700 pb-2">${getTranslation('cleaned_url')}</h3>
            <div class="analysis-grid">
                <div class="grid-item"><label>Subdomain</label><span>${data.partitions.Subdomain || '-'}</span></div>
                <div class="grid-item"><label>Domain</label><span>${data.partitions.Domain || '-'}</span></div>
                <div class="grid-item"><label>TLD</label><span>${data.partitions.TLD || '-'}</span></div>
                <div class="grid-item"><label>Path</label><span>${data.partitions.Path || '-'}</span></div>
            </div>
        </div>
    `;

    if (data.detections.length === 0) {
        html += `
            <div class="safe-box">
                <i class="fi fi-rr-check-circle text-2xl"></i>
                <div>
                    <h4 class="font-bold text-lg">Safe</h4>
                    <p>${getTranslation('safe_message')}</p>
                </div>
            </div>
        `;
    } else {
        html += `
            <div class="warning-box">
                <i class="fi fi-rr-triangle-warning text-2xl"></i>
                <div>
                    <h4 class="font-bold text-lg">Warning</h4>
                    <p>${getTranslation('warning_message')}</p>
                </div>
            </div>
            
            <div class="mt-8">
                <h3 class="text-xl font-bold text-white mb-4">${getTranslation('findings')}</h3>
        `;

        data.detections.forEach(detection => {
            html += `<div class="analysis-card mb-4 border-l-4 border-l-red-500">
                        <h4 class="font-bold text-gray-300 mb-2">${getTranslation('part_detected')} <span class="text-white">${detection.part}</span></h4>`;

            const partValue = data.partitions[detection.part]; 
            if (partValue) {
                const highlightedPart = highlightPart(partValue, detection.findings);
                html += `<div class="highlighted-context">
                            <code class="highlighted-code">${highlightedPart}</code>
                         </div>`;
            }

            html += `<ul class="space-y-3 mt-3">`;
            detection.findings.forEach(finding => {
                const unicodeDisplay = finding.unicode ? `<span class="unicode-tag text-red-400">[${finding.unicode}]</span>` : '';
                const targetUnicodeDisplay = finding.looks_like_unicode ? `<span class="unicode-tag text-green-400">[${finding.looks_like_unicode}]</span>` : '';

                html += `<li class="flex items-center flex-wrap gap-2 bg-black/20 p-2 rounded">
                            <span>Found</span> 
                            <code class="homoglyph-char text-lg">'${finding.char}'</code> 
                            ${unicodeDisplay}
                            <span>${getTranslation('looks_like')}</span> 
                            <code class="looks-like-char text-lg">'${finding.looks_like}'</code>
                            ${targetUnicodeDisplay} </li>`;
            });
            html += `</ul></div>`;
        });
        html += `</div>`;
    }
    
    resultContainer.innerHTML = html;
}