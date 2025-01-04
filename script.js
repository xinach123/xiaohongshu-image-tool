// 获取DOM元素
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const previewContainer = document.getElementById('previewContainer');
const downloadBtn = document.getElementById('downloadBtn');

// 图片处理相关参数
const options = {
    brightness: document.querySelector('input[type="range"]:nth-of-type(1)'),
    contrast: document.querySelector('input[type="range"]:nth-of-type(2)'),
    watermark: document.querySelector('input[type="checkbox"]'),
    pixelShift: document.getElementById('pixelShift'),
    modifyMetadata: document.getElementById('modifyMetadata'),
    noiseLevel: document.getElementById('noiseLevel')
};

// 存储上传的图片
let uploadedImages = [];

// 拖拽上传处理
uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('drag-over');
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('drag-over');
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');
    const files = e.dataTransfer.files;
    handleFiles(files);
});

// 点击上传处理
uploadArea.addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
});

// 处理上传的文件
function handleFiles(files) {
    uploadedImages = [];
    previewContainer.innerHTML = '';
    downloadBtn.disabled = false;

    Array.from(files).forEach(file => {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.src = e.target.result;
                img.onload = () => {
                    uploadedImages.push({
                        original: img,
                        processed: null
                    });
                    createPreviewElement(img, uploadedImages.length - 1);
                };
            };
            reader.readAsDataURL(file);
        }
    });
}

// 创建预览元素
function createPreviewElement(img, index) {
    const previewWrapper = document.createElement('div');
    previewWrapper.className = 'preview-wrapper';
    
    const preview = document.createElement('div');
    preview.className = 'preview-item';
    preview.innerHTML = `
        <img src="${img.src}" alt="预览图片">
        <div class="preview-controls">
            <span>原图</span>
            <div class="preview-info">
                <small>处理后MD5值将发生变化</small>
            </div>
        </div>
    `;
    
    previewWrapper.appendChild(preview);
    previewContainer.appendChild(previewWrapper);
}

// 图片处理函数
function processImage(img) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // 添加1像素的padding以改变图片尺寸
    canvas.width = img.width + parseInt(options.pixelShift.value);
    canvas.height = img.height + parseInt(options.pixelShift.value);
    
    // 绘制原始图片，略微偏移位置
    ctx.drawImage(img, 
        options.pixelShift.value / 2, 
        options.pixelShift.value / 2, 
        img.width, 
        img.height
    );
    
    // 应用亮度和对比度调整
    const brightness = parseFloat(options.brightness.value);
    const contrast = parseFloat(options.contrast.value);
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // 添加随机噪点和调整像素
    const noiseLevel = parseInt(options.noiseLevel.value);
    
    for (let i = 0; i < data.length; i += 4) {
        // 添加随机噪点
        const noise = (Math.random() - 0.5) * noiseLevel;
        
        // 调整亮度
        data[i] = Math.min(255, Math.max(0, data[i] + brightness * 2.55 + noise));     // R
        data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + brightness * 2.55 + noise)); // G
        data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + brightness * 2.55 + noise)); // B
        
        // 调整对比度
        const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
        data[i] = factor * (data[i] - 128) + 128;
        data[i + 1] = factor * (data[i + 1] - 128) + 128;
        data[i + 2] = factor * (data[i + 2] - 128) + 128;
        
        // 随机微调像素值
        if (Math.random() < 0.1) {
            data[i] = Math.min(255, Math.max(0, data[i] + (Math.random() - 0.5)));
            data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + (Math.random() - 0.5)));
            data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + (Math.random() - 0.5)));
        }
    }
    
    ctx.putImageData(imageData, 0, 0);
    
    // 添加随机水印
    if (options.watermark.checked) {
        addRandomWatermark(ctx, canvas.width, canvas.height);
    }
    
    // 修改元数据
    if (options.modifyMetadata.checked) {
        // 添加随机注释以改变文件的MD5值
        const randomComment = generateRandomComment();
        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
        return addMetadataComment(dataUrl, randomComment);
    }
    
    return canvas.toDataURL('image/jpeg', 0.92);
}

// 生成随机注释
function generateRandomComment() {
    const timestamp = new Date().getTime();
    const random = Math.random().toString(36).substring(7);
    return `${timestamp}-${random}`;
}

// 添加元数据注释
function addMetadataComment(dataUrl, comment) {
    // 在base64数据中插入注释
    const base64Data = dataUrl.split(',')[1];
    const binaryData = atob(base64Data);
    const array = new Uint8Array(binaryData.length + comment.length + 4);
    
    // 复制原始数据
    for (let i = 0; i < binaryData.length; i++) {
        array[i] = binaryData.charCodeAt(i);
    }
    
    // 在文件末尾添加注释
    const commentData = new TextEncoder().encode(comment);
    array.set(commentData, binaryData.length);
    
    // 转回base64
    const modifiedBinary = String.fromCharCode.apply(null, array);
    return `data:image/jpeg;base64,${btoa(modifiedBinary)}`;
}

// 添加随机水印
function addRandomWatermark(ctx, width, height) {
    ctx.fillStyle = `rgba(255, 255, 255, 0.1)`;
    ctx.font = '12px Arial';
    
    // 生成随机字符
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    const randomText = Array(4).fill(0).map(() => 
        chars[Math.floor(Math.random() * chars.length)]
    ).join('');
    
    // 随机位置
    const x = Math.random() * (width - 50);
    const y = Math.random() * (height - 20);
    
    ctx.fillText(randomText, x, y);
}

// 下载处理后的图片
downloadBtn.addEventListener('click', () => {
    uploadedImages.forEach((image, index) => {
        const processedDataUrl = processImage(image.original);
        const link = document.createElement('a');
        link.download = `processed_image_${index + 1}.jpg`;
        link.href = processedDataUrl;
        link.click();
    });
});

// 实时预览处理效果
Object.values(options).forEach(option => {
    option.addEventListener('input', () => {
        if (uploadedImages.length > 0) {
            updatePreviews();
        }
    });
});

// 更新预览图片
function updatePreviews() {
    const previewItems = document.querySelectorAll('.preview-item img');
    uploadedImages.forEach((image, index) => {
        const processedDataUrl = processImage(image.original);
        previewItems[index].src = processedDataUrl;
    });
} 