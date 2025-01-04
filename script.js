// 将所有代码包装在一个立即执行的异步函数中
(async function() {
    try {
        console.log('开始初始化应用');

        // 等待 DOM 加载完成
        if (document.readyState === 'loading') {
            console.log('等待 DOM 加载...');
            await new Promise(resolve => {
                document.addEventListener('DOMContentLoaded', () => {
                    console.log('DOM 加载完成');
                    resolve();
                });
            });
        }

        // 获取并验证 DOM 元素
        const elements = {
            uploadArea: document.getElementById('uploadArea'),
            fileInput: document.getElementById('fileInput'),
            previewContainer: document.getElementById('previewContainer'),
            downloadBtn: document.getElementById('downloadBtn'),
            options: {
                brightness: document.getElementById('brightness'),
                contrast: document.getElementById('contrast'),
                watermark: document.getElementById('watermark'),
                pixelShift: document.getElementById('pixelShift'),
                modifyMetadata: document.getElementById('modifyMetadata'),
                noiseLevel: document.getElementById('noiseLevel')
            }
        };

        // 打印详细的元素状态
        console.log('元素状态详情:');
        console.log('主要元素:', {
            uploadArea: elements.uploadArea?.id || '未找到',
            fileInput: elements.fileInput?.id || '未找到',
            previewContainer: elements.previewContainer?.id || '未找到',
            downloadBtn: elements.downloadBtn?.id || '未找到'
        });
        
        console.log('选项元素:', Object.fromEntries(
            Object.entries(elements.options)
                .map(([k, v]) => [k, {
                    found: v ? true : false,
                    id: v?.id || '未找到',
                    type: v?.type || '未知',
                    value: v?.value || '未知'
                }])
        ));

        // 验证必需的元素
        const requiredElements = ['uploadArea', 'fileInput', 'previewContainer', 'downloadBtn'];
        const missingElements = requiredElements.filter(id => !elements[id]);
        if (missingElements.length > 0) {
            throw new Error(`缺少必需的元素: ${missingElements.join(', ')}`);
        }

        const requiredOptions = ['brightness', 'contrast', 'watermark', 'pixelShift', 'modifyMetadata', 'noiseLevel'];
        const missingOptions = requiredOptions.filter(id => !elements.options[id]);
        if (missingOptions.length > 0) {
            throw new Error(`缺少必需的选项元素: ${missingOptions.join(', ')}`);
        }

        // 存储上传的图片
        let uploadedImages = [];

        // 处理文件上传
        async function handleFiles(files) {
            console.log(`开始处理 ${files.length} 个文件`);
            
            // 清空预览容器
            elements.previewContainer.innerHTML = '';
            uploadedImages = [];

            // 处理每个文件
            for (const file of files) {
                if (!file.type.startsWith('image/')) {
                    console.warn(`跳过非图片文件: ${file.name}`);
                    continue;
                }

                try {
                    console.log(`处理文件: ${file.name}`);
                    
                    // 创建预览元素
                    const previewItem = document.createElement('div');
                    previewItem.className = 'preview-item';
                    const img = document.createElement('img');
                    previewItem.appendChild(img);
                    elements.previewContainer.appendChild(previewItem);

                    // 加载图片
                    const imageUrl = URL.createObjectURL(file);
                    const loadedImage = await new Promise((resolve, reject) => {
                        const img = new Image();
                        img.onload = () => resolve(img);
                        img.onerror = reject;
                        img.src = imageUrl;
                    });

                    // 存储原始图片
                    uploadedImages.push({
                        name: file.name,
                        original: loadedImage
                    });

                    // 更新预览
                    img.src = imageUrl;
                    
                    console.log(`文件 ${file.name} 处理完成`);
                } catch (error) {
                    console.error(`处理文件 ${file.name} 失败:`, error);
                }
            }

            // 更新下载按钮状态
            elements.downloadBtn.disabled = uploadedImages.length === 0;
            
            // 如果有图片，更新预览
            if (uploadedImages.length > 0) {
                updatePreviews();
            }
        }

        // 设置拖放处理
        elements.uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            elements.uploadArea.classList.add('dragover');
        });

        elements.uploadArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            elements.uploadArea.classList.remove('dragover');
        });

        elements.uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            elements.uploadArea.classList.remove('dragover');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                handleFiles(files);
            }
        });

        // 设置点击上传
        elements.uploadArea.addEventListener('click', () => {
            elements.fileInput.click();
        });

        elements.fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handleFiles(e.target.files);
            }
        });

        // 图片处理函数
        function processImage(img) {
            console.log('开始处理图片');
            
            // 验证输入图片
            if (!img || !img.width || !img.height) {
                console.error('无效的图片输入:', img);
                throw new Error('无效的图片输入');
            }

            // 验证所有必需的选项元素是否存在
            if (!elements.options) {
                console.error('选项对象未初始化');
                throw new Error('选项对象未初始化');
            }

            Object.entries(elements.options).forEach(([key, element]) => {
                if (!element) {
                    console.error(`未找到选项元素: ${key}`);
                    throw new Error(`未找到选项元素: ${key}`);
                }
            });

            // 获取选项值（添加默认值和验证）
            const options = {
                brightness: parseFloat(elements.options.brightness.value) || 0,
                contrast: parseFloat(elements.options.contrast.value) || 0,
                pixelShift: parseInt(elements.options.pixelShift.value) || 1,
                noiseLevel: parseInt(elements.options.noiseLevel.value) || 2,
                watermark: elements.options.watermark.checked || false,
                modifyMetadata: elements.options.modifyMetadata.checked || true
            };

            console.log('处理图片使用的选项:', options);

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            // 设置画布尺寸
            canvas.width = img.width + options.pixelShift;
            canvas.height = img.height + options.pixelShift;
            
            // 绘制图片
            try {
                ctx.drawImage(img, 
                    options.pixelShift / 2, 
                    options.pixelShift / 2, 
                    img.width, 
                    img.height
                );

                // 应用亮度和对比度调整
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;
                
                for (let i = 0; i < data.length; i += 4) {
                    // 应用亮度
                    data[i] = Math.min(255, Math.max(0, data[i] + options.brightness * 25.5));     // R
                    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + options.brightness * 25.5)); // G
                    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + options.brightness * 25.5)); // B

                    // 应用对比度
                    const factor = (259 * (options.contrast * 5 + 255)) / (255 * (259 - options.contrast * 5));
                    data[i] = Math.min(255, Math.max(0, factor * (data[i] - 128) + 128));
                    data[i + 1] = Math.min(255, Math.max(0, factor * (data[i + 1] - 128) + 128));
                    data[i + 2] = Math.min(255, Math.max(0, factor * (data[i + 2] - 128) + 128));

                    // 添加随机噪点
                    if (options.noiseLevel > 0) {
                        const noise = (Math.random() - 0.5) * options.noiseLevel;
                        data[i] = Math.min(255, Math.max(0, data[i] + noise));
                        data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
                        data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
                    }
                }

                ctx.putImageData(imageData, 0, 0);

                // 添加水印
                if (options.watermark) {
                    const timestamp = new Date().getTime().toString().slice(-6);
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                    ctx.font = '12px Arial';
                    ctx.fillText(timestamp, Math.random() * (canvas.width - 50), Math.random() * (canvas.height - 20));
                }

            } catch (error) {
                console.error('绘制图片失败:', error);
                throw error;
            }
            
            return canvas.toDataURL('image/jpeg', 0.92);
        }

        // 添加下载按钮事件处理
        elements.downloadBtn.addEventListener('click', async () => {
            console.log('开始下载处理后的图片');
            
            if (uploadedImages.length === 0) {
                console.warn('没有可下载的图片');
                return;
            }

            try {
                // 创建ZIP文件
                const zip = new JSZip();
                
                // 处理每张图片
                for (let i = 0; i < uploadedImages.length; i++) {
                    const image = uploadedImages[i];
                    console.log(`处理第 ${i + 1} 张图片用于下载`);
                    
                    try {
                        // 获取处理后的图片数据
                        const processedDataUrl = processImage(image.original);
                        
                        // 将Base64数据转换为二进制
                        const base64Data = processedDataUrl.replace(/^data:image\/jpeg;base64,/, '');
                        const binaryData = atob(base64Data);
                        const array = new Uint8Array(binaryData.length);
                        for (let j = 0; j < binaryData.length; j++) {
                            array[j] = binaryData.charCodeAt(j);
                        }
                        
                        // 添加到ZIP文件
                        const filename = `processed_${image.name}`;
                        zip.file(filename, array);
                        
                        console.log(`第 ${i + 1} 张图片已添加到ZIP文件`);
                    } catch (error) {
                        console.error(`处理第 ${i + 1} 张图片失败:`, error);
                    }
                }
                
                // 生成并下载ZIP文件
                console.log('生成ZIP文件...');
                const content = await zip.generateAsync({type: 'blob'});
                const downloadUrl = URL.createObjectURL(content);
                
                const link = document.createElement('a');
                link.href = downloadUrl;
                link.download = 'processed_images.zip';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(downloadUrl);
                
                console.log('下载完成');
            } catch (error) {
                console.error('下载过程中出错:', error);
            }
        });

        // 添加事件监听器
        Object.entries(elements.options).forEach(([key, element]) => {
            if (element) {
                console.log(`为 ${key} 添加事件监听器`);
                element.addEventListener('input', (event) => {
                    console.log(`${key} 值改变为:`, event.target.value);
                    if (uploadedImages.length > 0) {
                        updatePreviews();
                    }
                });
            }
        });

        // 更新预览函数
        function updatePreviews() {
            console.log('开始更新预览');
            
            // 验证是否有上传的图片
            if (!uploadedImages || uploadedImages.length === 0) {
                console.warn('没有可以预览的图片');
                return;
            }

            // 获取预览元素
            const previewItems = document.querySelectorAll('.preview-item img');
            if (!previewItems || previewItems.length === 0) {
                console.error('未找到预览元素');
                return;
            }

            console.log(`找到 ${previewItems.length} 个预览元素，处理 ${uploadedImages.length} 张图片`);

            // 处理每张图片
            uploadedImages.forEach((image, index) => {
                if (!image || !image.original) {
                    console.error(`第 ${index + 1} 张图片无效`);
                    return;
                }

                try {
                    console.log(`处理第 ${index + 1} 张图片`);
                    const processedDataUrl = processImage(image.original);
                    
                    if (previewItems[index]) {
                        previewItems[index].src = processedDataUrl;
                        console.log(`第 ${index + 1} 张图片预览更新成功`);
                    } else {
                        console.error(`未找到第 ${index + 1} 张图片的预览元素`);
                    }
                } catch (error) {
                    console.error(`第 ${index + 1} 张图片预览更新失败:`, error);
                }
            });
        }

        console.log('初始化完成');

    } catch (error) {
        console.error('初始化失败:', error);
    }
})(); 