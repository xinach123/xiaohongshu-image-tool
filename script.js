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
            } catch (error) {
                console.error('绘制图片失败:', error);
                throw error;
            }
            
            // 处理图片...（其余代码保持不变）
            
            return canvas.toDataURL('image/jpeg', 0.92);
        }

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