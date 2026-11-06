/**
 * 尺寸链分析工具V1.1
 */

// ==================== 全局状态 ====================
const state = {
    image: null,
    imageLoaded: false,
    scale: 1,
    points: [],
    currentMode: 'normal',
    chainDirection: 'horizontal',
    isDragging: false,
    dragPointIndex: -1,
    isPanning: false, // 中键拖动状态
    panStartX: 0,
    panStartY: 0,
    panScrollLeft: 0,
    panScrollTop: 0,
    dimensionValues: {}, // 存储尺寸代号的值
    showPoints: true, // 是否显示标注点
    showLines: true, // 是否显示内部连线
    projectName: '', // 项目名称
    labelOffsets: {}, // 存储 D/d 标注的偏移量 { pointIndex: { offsetX, offsetY } }
    draggingLabel: null, // 正在拖动的标注信息 { pointIndex, startX, startY, startOffsetX, startOffsetY }
    chainColor: '#1890ff', // 尺寸链颜色
    chainLineOffsets: {}, // 存储每条尺寸线的单独偏移量 { lineIndex: offset }
    draggingChainLine: null, // 正在拖动的尺寸线信息 { lineIndex, startX, startY, startOffset }
};

// ==================== DOM元素 ====================
const elements = {
    uploadArea: document.getElementById('uploadArea'),
    fileInput: document.getElementById('fileInput'),
    canvasWrapper: document.getElementById('canvasWrapper'),
    canvasContainer: document.getElementById('canvasContainer'),
    canvas: document.getElementById('imageCanvas'),
    emptyState: document.getElementById('emptyState'),
    pointList: document.getElementById('pointList'),
    chainInfo: document.getElementById('chainInfo'),
    dimensionInputs: document.getElementById('dimensionInputs'),
    resultBox: document.getElementById('resultBox')
};

const ctx = elements.canvas.getContext('2d');

// ==================== 点的类型定义 ====================
const PointType = {
    NORMAL: 'normal',    // 普通点
    AXIS_HOLE: 'axisHole'  // 轴孔点
};

const PointColors = {
    [PointType.NORMAL]: '#1890ff',
    [PointType.AXIS_HOLE]: '#52c41a'
};

const PointLabels = {
    [PointType.NORMAL]: '',
    [PointType.AXIS_HOLE]: '轴'
};

// ==================== 初始化 ====================
function init() {
    bindEvents();
    updateModeButtons();
    updateDirectionButtons();
}

// ==================== 事件绑定 ====================
function bindEvents() {
    // 文件上传
    elements.uploadArea.addEventListener('click', () => elements.fileInput.click());
    elements.fileInput.addEventListener('change', handleFileSelect);
    elements.uploadArea.addEventListener('dragover', handleDragOver);
    elements.uploadArea.addEventListener('dragleave', handleDragLeave);
    elements.uploadArea.addEventListener('drop', handleDrop);
    
    // 剪切板粘贴事件
    document.addEventListener('paste', handlePaste);

    // 数据文件加载
    const loadDataArea = document.getElementById('loadDataArea');
    const dataFileInput = document.getElementById('dataFileInput');
    if (loadDataArea && dataFileInput) {
        loadDataArea.addEventListener('click', () => dataFileInput.click());
        dataFileInput.addEventListener('change', handleDataFileSelect);
    }

    // 清除图像
    const btnClearImage = document.getElementById('btnClearImage');
    if (btnClearImage) {
        btnClearImage.addEventListener('click', clearImage);
    }

    // 标注模式切换
    document.getElementById('btnNormal').addEventListener('click', () => setMode('normal'));
    document.getElementById('btnAxisHole').addEventListener('click', () => setMode('axisHole'));

// 方向切换
document.getElementById('btnVertical').addEventListener('click', () => setDirection('vertical'));
document.getElementById('btnHorizontal').addEventListener('click', () => setDirection('horizontal'));
document.getElementById('btnDepth').addEventListener('click', () => setDirection('depth'));

    // 按钮事件
    document.getElementById('btnGenerate').addEventListener('click', generateDimensionChain);
    document.getElementById('btnClear').addEventListener('click', clearAllPoints);
    document.getElementById('btnCalculate').addEventListener('click', calculateBoth);
    document.getElementById('btnExportImage').addEventListener('click', exportImage);
    document.getElementById('btnExportData').addEventListener('click', exportData);

    // 尺寸链颜色选择
    const colorDots = document.querySelectorAll('.color-dot');
    colorDots.forEach(dot => {
        dot.addEventListener('click', () => {
            state.chainColor = dot.dataset.color;
            colorDots.forEach(d => {
                d.classList.remove('active');
                d.style.borderColor = 'transparent';
                d.style.transform = 'scale(1)';
            });
            dot.classList.add('active');
            dot.style.borderColor = '#333';
            dot.style.transform = 'scale(1.2)';
            drawCanvas();
        });
    });

    // 显示/隐藏点切换
    const togglePoints = document.getElementById('togglePoints');
    if (togglePoints) {
        togglePoints.addEventListener('change', (e) => {
            state.showPoints = e.target.checked;
            drawCanvas();
        });
    }

    // 显示/隐藏内部连线切换
    const toggleLines = document.getElementById('toggleLines');
    if (toggleLines) {
        toggleLines.addEventListener('change', (e) => {
            state.showLines = e.target.checked;
            drawCanvas();
        });
    }

    // 帮助按钮
    const btnHelp = document.getElementById('btnHelp');
    if (btnHelp) {
        btnHelp.addEventListener('click', openHelp);
    }

    // 画布交互
    elements.canvas.addEventListener('mousedown', handleMouseDown);
    elements.canvas.addEventListener('mousemove', handleMouseMove);
    elements.canvas.addEventListener('mouseup', handleMouseUp);
    elements.canvas.addEventListener('contextmenu', (e) => e.preventDefault()); // 禁用右键菜单
    
    // 画布滚轮缩放
    elements.canvas.addEventListener('wheel', handleCanvasWheelZoom, { passive: false });
}

// ==================== 模式切换 ====================
function setMode(mode) {
    state.currentMode = mode;
    updateModeButtons();
}

function updateModeButtons() {
    ['normal', 'axisHole'].forEach(mode => {
        const btn = document.getElementById('btn' + mode.charAt(0).toUpperCase() + mode.slice(1));
        if (btn) {
            btn.classList.toggle('active', state.currentMode === mode);
        }
    });
}

function setDirection(direction) {
    state.chainDirection = direction;
    updateDirectionButtons();
    drawCanvas();
}

function updateDirectionButtons() {
    document.getElementById('btnVertical').classList.toggle('active', state.chainDirection === 'vertical');
    document.getElementById('btnHorizontal').classList.toggle('active', state.chainDirection === 'horizontal');
    document.getElementById('btnDepth').classList.toggle('active', state.chainDirection === 'depth');
}

// ==================== 文件上传处理 ====================
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) loadImage(file);
}

function handleDragOver(e) {
    e.preventDefault();
    elements.uploadArea.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    elements.uploadArea.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    elements.uploadArea.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
        loadImage(file);
    }
}

// ==================== 剪切板粘贴处理 ====================
function handlePaste(e) {
    const items = e.clipboardData && e.clipboardData.items;
    if (!items) return;
    
    for (const item of items) {
        if (item.type.startsWith('image/')) {
            e.preventDefault();
            const file = item.getAsFile();
            if (file) loadImage(file);
            return;
        }
    }
}

// ==================== 数据文件加载处理 ====================
function handleDataFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        loadDataFile(file);
    }
}

function loadDataFile(file) {
    if (!file.name.endsWith('.json')) {
        alert('请选择JSON格式的数据文件');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
        importData(e.target.result);
    };
    reader.onerror = () => {
        alert('读取文件失败');
    };
    reader.readAsText(file);
}

function loadImage(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        state.image = new Image();
        state.image.onload = () => {
            state.imageLoaded = true;
            elements.emptyState.style.display = 'none';
            elements.canvas.style.display = 'block';
            updateClearImageButton(true);
            resetView();
            drawCanvas();
            // 滚动到中心位置
            centerScroll();
        };
        state.image.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function clearImage() {
    state.image = null;
    state.imageLoaded = false;
    state.points = [];
    state.labelOffsets = {};
    state.axisHoleLabelPositions = {};
    state.dimensionValues = {};
    state.draggingLabel = null;
    
    elements.canvas.style.display = 'none';
    elements.emptyState.style.display = 'block';
    elements.pointList.innerHTML = '<p style="color: #999; text-align: center; padding: 10px; font-size: 12px;">暂无标注点</p>';
    elements.chainInfo.innerHTML = '<p style="color: #999; text-align: center; padding: 10px; font-size: 12px;">请先生成尺寸链</p>';
    elements.dimensionInputs.innerHTML = '<p style="color: #999; text-align: center; padding: 8px; font-size: 12px;">请先生成尺寸链</p>';
    elements.resultBox.innerHTML = '点击按钮进行计算';
    elements.fileInput.value = '';
    updateClearImageButton(false);
}

function updateClearImageButton(hasImage) {
    const btn = document.getElementById('btnClearImage');
    if (btn) {
        btn.style.display = hasImage ? 'block' : 'none';
    }
}

// ==================== 画布操作 ====================
function resetView() {
    if (!state.image) return;
    state.scale = 1;
    drawCanvas();
}

function zoomIn() {
    state.scale *= 1.2;
    drawCanvas();
}

function zoomOut() {
    state.scale /= 1.2;
    if (state.scale < 0.1) state.scale = 0.1;
    drawCanvas();
}

function zoomReset() {
    resetView();
}

function drawCanvas() {
    if (!state.image) return;
    
    const width = state.image.width * state.scale;
    const height = state.image.height * state.scale;
    
    // 固定画布容器大小，不随缩放改变
    const containerWidth = elements.canvasWrapper.clientWidth - 100; // 减去padding
    const containerHeight = elements.canvasWrapper.clientHeight - 100;
    
    // 画布大小为容器大小和图片大小中的较大值，确保可以滚动查看
    const canvasWidth = Math.max(containerWidth, width + 800);
    const canvasHeight = Math.max(containerHeight, height + 800);
    
    elements.canvas.width = canvasWidth;
    elements.canvas.height = canvasHeight;
    elements.canvas.style.width = canvasWidth + 'px';
    elements.canvas.style.height = canvasHeight + 'px';
    
    ctx.clearRect(0, 0, elements.canvas.width, elements.canvas.height);
    
    // 计算居中偏移
    const centerOffsetX = (canvasWidth - width) / 2;
    const centerOffsetY = (canvasHeight - height) / 2;
    
    // 保存偏移量，用于后续绘制和鼠标交互
    state.canvasOffsetX = centerOffsetX;
    state.canvasOffsetY = centerOffsetY;
    
    // 绘制图像在中心位置
    ctx.drawImage(state.image, state.canvasOffsetX, state.canvasOffsetY, width, height);
    
    drawDimensionLines();
    if (state.showPoints) {
        drawPoints();
    }
}

// ==================== 绘制点 ====================
function drawPoints() {
    // 分别计算普通点和轴孔点的序号
    let normalIndex = 0;
    let axisHoleIndex = 0;
    let normalCount = state.points.filter(p => p.type === PointType.NORMAL).length;
    
    state.points.forEach((point) => {
        const x = point.x * state.scale + state.canvasOffsetX;
        const y = point.y * state.scale + state.canvasOffsetY;
        
        // 绘制外圈
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, Math.PI * 2);
        ctx.fillStyle = PointColors[point.type];
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // 根据点类型分别计数
        let displayLabel;
        if (point.type === PointType.AXIS_HOLE) {
            axisHoleIndex++;
            displayLabel = axisHoleIndex.toString();
        } else {
            normalIndex++;
            // 普通点：第一个是S，最后一个是E，中间是数字
            if (normalIndex === 1) {
                displayLabel = 'S';
            } else if (normalIndex === normalCount) {
                displayLabel = 'E';
            } else {
                displayLabel = normalIndex.toString();
            }
        }
        
        // 绘制标签
        ctx.fillStyle = 'white';
        ctx.font = 'bold 11px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(displayLabel, x, y);
        
        // 绘制类型文字（轴孔显示"轴"）
        ctx.fillStyle = PointColors[point.type];
        ctx.font = '12px Microsoft YaHei';
        ctx.textAlign = 'left';
        const typeText = PointLabels[point.type];
        ctx.fillText(typeText, x + 14, y);
    });
}

// ==================== 绘制尺寸链 ====================
function drawDimensionLines() {
    if (state.points.length < 2) return;
    
    // 所有点按添加顺序排序
    let sortedPoints = [...state.points].sort((a, b) => a.id - b.id);
    
    // 绘制红色连线（内部点间连线）
    if (state.showLines) {
        ctx.strokeStyle = '#ff4d4f';
        ctx.lineWidth = 2;
        
        for (let i = 0; i < sortedPoints.length - 1; i++) {
            const p1 = sortedPoints[i];
            const p2 = sortedPoints[i + 1];
            
            const x1 = p1.x * state.scale + state.canvasOffsetX;
            const y1 = p1.y * state.scale + state.canvasOffsetY;
            const x2 = p2.x * state.scale + state.canvasOffsetX;
            const y2 = p2.y * state.scale + state.canvasOffsetY;
            
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
            
            // 根据方向绘制箭头
            if (state.chainDirection === 'vertical' || state.chainDirection === 'depth') {
                drawYArrow(x1, y1, x2, y2);
            } else {
                drawXArrow(x1, y1, x2, y2);
            }
        }
        
        // 封闭环（最后一个点连回第一个点）
        if (sortedPoints.length >= 2) {
            const first = sortedPoints[0];
            const last = sortedPoints[sortedPoints.length - 1];
            const sx = first.x * state.scale + state.canvasOffsetX;
            const sy = first.y * state.scale + state.canvasOffsetY;
            const ex = last.x * state.scale + state.canvasOffsetX;
            const ey = last.y * state.scale + state.canvasOffsetY;
            
            ctx.setLineDash([8, 4]);
            ctx.beginPath();
            ctx.moveTo(ex, ey);
            ctx.lineTo(sx, sy);
            ctx.stroke();
            ctx.setLineDash([]);
            
            if (state.chainDirection === 'vertical' || state.chainDirection === 'depth') {
                drawYArrow(ex, ey, sx, sy);
            } else {
                drawXArrow(ex, ey, sx, sy);
            }
        }
    }
    
    // 绘制尺寸标注（始终显示）
    drawDimensionAnnotations(sortedPoints);
}

function drawDimensionAnnotations(sortedPoints) {
    if (sortedPoints.length < 1) return;

    // 清除旧的线段记录
    state.chainLineSegments = [];

    // 计算图片边界（考虑偏移）
    const imgLeft = state.canvasOffsetX;
    const imgRight = state.image.width * state.scale + state.canvasOffsetX;
    const imgTop = state.canvasOffsetY;
    const imgBottom = state.image.height * state.scale + state.canvasOffsetY;
    
    const lineSpacing = 20; // 尺寸线间距
    
    if (state.chainDirection === 'vertical' || state.chainDirection === 'depth') {
        // Y向/Z向尺寸链 - 尺寸线在图片左侧，垂直方向
        // 每条线只能水平(X)方向单独拖动
        const baseOffsetX = imgLeft - 40; // 基准X位置
        
        // 为每个点绘制水平虚线（延长线）
        let axisHoleCount = 0;
        sortedPoints.forEach((point, index) => {
            const py = point.y * state.scale + state.canvasOffsetY;
            
            // 找到该点对应的尺寸线X位置，应用该线的单独偏移
            let pointSegX = baseOffsetX;
            for (let i = 0; i < sortedPoints.length - 1; i++) {
                if (sortedPoints[i] === point || sortedPoints[i + 1] === point) {
                    const lineOffset = state.chainLineOffsets[i] || 0;
                    pointSegX = baseOffsetX - (i * lineSpacing) + lineOffset;
                    break;
                }
            }
            if (point === sortedPoints[sortedPoints.length - 1] && sortedPoints.length > 1) {
                const lastLineOffset = state.chainLineOffsets[sortedPoints.length - 2] || 0;
                pointSegX = baseOffsetX - ((sortedPoints.length - 2) * lineSpacing) + lastLineOffset;
            }
            
            // 水平虚线：从点向左延伸到对应的尺寸线位置
            ctx.strokeStyle = state.chainColor;
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(point.x * state.scale + state.canvasOffsetX, py);
            ctx.lineTo(pointSegX, py);
            ctx.stroke();
            ctx.setLineDash([]);
            
            // 如果是轴孔类型，在水平虚线上添加垂直双向箭头和标注
            if (point.type === PointType.AXIS_HOLE) {
                axisHoleCount++;
                const arrowY = py;
                const arrowX = pointSegX - 5;
                const arrowSize = 5;
                const gap = 3;
                
                ctx.strokeStyle = state.chainColor;
                ctx.lineWidth = 1.5;
                ctx.setLineDash([]);
                
                // 向上箭头
                ctx.beginPath();
                ctx.moveTo(arrowX, arrowY - arrowSize - gap);
                ctx.lineTo(arrowX - arrowSize * 0.5, arrowY - gap);
                ctx.lineTo(arrowX + arrowSize * 0.5, arrowY - gap);
                ctx.closePath();
                ctx.stroke();
                
                // 向下箭头
                ctx.beginPath();
                ctx.moveTo(arrowX, arrowY + arrowSize + gap);
                ctx.lineTo(arrowX - arrowSize * 0.5, arrowY + gap);
                ctx.lineTo(arrowX + arrowSize * 0.5, arrowY + gap);
                ctx.closePath();
                ctx.stroke();
                
                // 标注 D1/d1, D2/d2... (支持拖动偏移)
                const labelKey = `axisHole_${axisHoleCount}`;
                const offset = state.labelOffsets[labelKey] || { x: 0, y: 0 };
                ctx.fillStyle = state.chainColor;
                ctx.font = 'bold 10px Microsoft YaHei';
                ctx.textAlign = 'right';
                ctx.textBaseline = 'middle';
                ctx.fillText('D' + axisHoleCount + '/d' + axisHoleCount, arrowX - 8 + offset.x, arrowY + offset.y);
                
                // 存储标注位置用于拖动检测
                if (!state.axisHoleLabelPositions) state.axisHoleLabelPositions = {};
                state.axisHoleLabelPositions[labelKey] = {
                    x: arrowX - 8 + offset.x,
                    y: arrowY + offset.y,
                    width: 40,
                    height: 14
                };
            }
        });
        
        // 在相邻两点之间绘制垂直尺寸线（带单向箭头）
        for (let i = 0; i < sortedPoints.length - 1; i++) {
            const p1 = sortedPoints[i];
            const p2 = sortedPoints[i + 1];
            const lineOffset = state.chainLineOffsets[i] || 0;
            const segX = baseOffsetX - (i * lineSpacing) + lineOffset;
            
            const y1 = p1.y * state.scale + state.canvasOffsetY;
            const y2 = p2.y * state.scale + state.canvasOffsetY;
            
            // 存储线段用于拖动检测（记录线段索引）
            if (!state.chainLineSegments) state.chainLineSegments = [];
            state.chainLineSegments.push({ x1: segX, y1, x2: segX, y2, lineIndex: i });
            
            // 绘制垂直尺寸线
            ctx.strokeStyle = state.chainColor;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(segX, y1);
            ctx.lineTo(segX, y2);
            ctx.stroke();
            
            // 绘制水平短横线
            ctx.beginPath();
            ctx.moveTo(segX - 4, y1);
            ctx.lineTo(segX + 4, y1);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(segX - 4, y2);
            ctx.lineTo(segX + 4, y2);
            ctx.stroke();
            
            // 绘制单向箭头（根据Y坐标方向）
            const arrowSize = 10;
            const isDownward = p2.y > p1.y;
            ctx.beginPath();
            if (isDownward) {
                ctx.moveTo(segX, y2 - arrowSize);
                ctx.lineTo(segX - arrowSize * 0.5, y2 - arrowSize * 2);
                ctx.lineTo(segX + arrowSize * 0.5, y2 - arrowSize * 2);
            } else {
                ctx.moveTo(segX, y2 + arrowSize);
                ctx.lineTo(segX - arrowSize * 0.5, y2 + arrowSize * 2);
                ctx.lineTo(segX + arrowSize * 0.5, y2 + arrowSize * 2);
            }
            ctx.closePath();
            ctx.fillStyle = state.chainColor;
            ctx.fill();
            
            // 标注字母（支持拖动偏移）
            const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            const letter = letters[i % letters.length];
            const labelKey = `dim_${letter}`;
            const offset = state.labelOffsets[labelKey] || { x: 0, y: 0 };
            ctx.fillStyle = state.chainColor;
            ctx.font = 'bold 12px Microsoft YaHei';
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            ctx.fillText(letter, segX - 8 + offset.x, (y1 + y2) / 2 + offset.y);
            
            // 存储标注位置用于拖动检测
            if (!state.axisHoleLabelPositions) state.axisHoleLabelPositions = {};
            state.axisHoleLabelPositions[labelKey] = {
                x: segX - 8 + offset.x,
                y: (y1 + y2) / 2 + offset.y,
                width: 16,
                height: 16
            };
        }
        
        // 绘制封闭环尺寸线
        if (sortedPoints.length >= 2) {
            const firstPoint = sortedPoints[0];
            const lastPoint = sortedPoints[sortedPoints.length - 1];
            const closeLineIndex = sortedPoints.length - 1; // 封闭环使用单独的索引
            const closeLineOffset = state.chainLineOffsets[closeLineIndex] || 0;
            const segX = baseOffsetX - (sortedPoints.length * lineSpacing) + closeLineOffset;
            
            const y1 = firstPoint.y * state.scale + state.canvasOffsetY;
            const y2 = lastPoint.y * state.scale + state.canvasOffsetY;
            
            // 存储封闭环线段
            state.chainLineSegments.push({ x1: segX, y1, x2: segX, y2, lineIndex: closeLineIndex });
            
            ctx.strokeStyle = '#9C27B0';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(segX, y1);
            ctx.lineTo(segX, y2);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(segX - 4, y1);
            ctx.lineTo(segX + 4, y1);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(segX - 4, y2);
            ctx.lineTo(segX + 4, y2);
            ctx.stroke();
            
            // 箭头指向最后一个点（方向反转）
            const arrowSize = 10;
            const isDownward = lastPoint.y > firstPoint.y;
            ctx.beginPath();
            if (isDownward) {
                ctx.moveTo(segX, y2 - arrowSize);
                ctx.lineTo(segX - arrowSize * 0.5, y2 - arrowSize * 2);
                ctx.lineTo(segX + arrowSize * 0.5, y2 - arrowSize * 2);
            } else {
                ctx.moveTo(segX, y2 + arrowSize);
                ctx.lineTo(segX - arrowSize * 0.5, y2 + arrowSize * 2);
                ctx.lineTo(segX + arrowSize * 0.5, y2 + arrowSize * 2);
            }
            ctx.closePath();
            ctx.fillStyle = '#9C27B0';
            ctx.fill();
            
            // 标注字母 X（封闭环）
            ctx.fillStyle = '#9C27B0';
            ctx.font = 'bold 12px Microsoft YaHei';
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            ctx.fillText('X', segX - 8, (y1 + y2) / 2);
        }
    } else {
        // X向尺寸链 - 尺寸线在图片上方，水平方向
        // 每条线只能竖直(Y)方向单独拖动
        const baseOffsetY = imgTop - 40; // 基准Y位置
        
        // 为每个点绘制垂直虚线（延长线）
        let axisHoleCount = 0;
        sortedPoints.forEach((point, index) => {
            const px = point.x * state.scale + state.canvasOffsetX;
            
            // 找到该点对应的尺寸线Y位置，应用该线的单独偏移
            let pointSegY = baseOffsetY;
            for (let i = 0; i < sortedPoints.length - 1; i++) {
                if (sortedPoints[i] === point || sortedPoints[i + 1] === point) {
                    const lineOffset = state.chainLineOffsets[i] || 0;
                    pointSegY = baseOffsetY - (i * lineSpacing) + lineOffset;
                    break;
                }
            }
            if (point === sortedPoints[sortedPoints.length - 1] && sortedPoints.length > 1) {
                const lastLineOffset = state.chainLineOffsets[sortedPoints.length - 2] || 0;
                pointSegY = baseOffsetY - ((sortedPoints.length - 2) * lineSpacing) + lastLineOffset;
            }
            
            // 垂直虚线：从点向上延伸到对应的尺寸线位置
            ctx.strokeStyle = state.chainColor;
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(px, point.y * state.scale + state.canvasOffsetY);
            ctx.lineTo(px, pointSegY);
            ctx.stroke();
            ctx.setLineDash([]);
            
            // 如果是轴孔类型，在垂直虚线上添加水平双向箭头和标注
            if (point.type === PointType.AXIS_HOLE) {
                axisHoleCount++;
                const arrowX = px;
                const arrowY = pointSegY - 5;
                const arrowSize = 5;
                const gap = 3;
                
                ctx.strokeStyle = state.chainColor;
                ctx.lineWidth = 1.5;
                ctx.setLineDash([]);
                
                // 向左箭头
                ctx.beginPath();
                ctx.moveTo(arrowX - arrowSize - gap, arrowY);
                ctx.lineTo(arrowX - gap, arrowY - arrowSize * 0.5);
                ctx.lineTo(arrowX - gap, arrowY + arrowSize * 0.5);
                ctx.closePath();
                ctx.stroke();
                
                // 向右箭头
                ctx.beginPath();
                ctx.moveTo(arrowX + arrowSize + gap, arrowY);
                ctx.lineTo(arrowX + gap, arrowY - arrowSize * 0.5);
                ctx.lineTo(arrowX + gap, arrowY + arrowSize * 0.5);
                ctx.closePath();
                ctx.stroke();
                
                // 标注 D1/d1, D2/d2... (支持拖动偏移)
                const labelKey = `axisHole_${axisHoleCount}`;
                const offset = state.labelOffsets[labelKey] || { x: 0, y: 0 };
                ctx.fillStyle = state.chainColor;
                ctx.font = 'bold 10px Microsoft YaHei';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'bottom';
                ctx.fillText('D' + axisHoleCount + '/d' + axisHoleCount, arrowX + offset.x, arrowY - 8 + offset.y);
                
                // 存储标注位置用于拖动检测
                if (!state.axisHoleLabelPositions) state.axisHoleLabelPositions = {};
                state.axisHoleLabelPositions[labelKey] = {
                    x: arrowX + offset.x,
                    y: arrowY - 8 + offset.y,
                    width: 40,
                    height: 14
                };
            }
        });
        
        // 在相邻两点之间绘制水平尺寸线（带单向箭头）
        for (let i = 0; i < sortedPoints.length - 1; i++) {
            const p1 = sortedPoints[i];
            const p2 = sortedPoints[i + 1];
            const lineOffset = state.chainLineOffsets[i] || 0;
            const segY = baseOffsetY - (i * lineSpacing) + lineOffset;
            
            const x1 = p1.x * state.scale + state.canvasOffsetX;
            const x2 = p2.x * state.scale + state.canvasOffsetX;
            
            // 存储线段用于拖动检测（记录线段索引）
            if (!state.chainLineSegments) state.chainLineSegments = [];
            state.chainLineSegments.push({ x1, y1: segY, x2, y2: segY, lineIndex: i });
            
            // 绘制水平尺寸线
            ctx.strokeStyle = state.chainColor;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(x1, segY);
            ctx.lineTo(x2, segY);
            ctx.stroke();
            
            // 绘制垂直短横线
            ctx.beginPath();
            ctx.moveTo(x1, segY - 4);
            ctx.lineTo(x1, segY + 4);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(x2, segY - 4);
            ctx.lineTo(x2, segY + 4);
            ctx.stroke();
            
            // 绘制单向箭头（根据X坐标方向）
            const arrowSize = 10;
            const isRightward = p2.x > p1.x;
            ctx.beginPath();
            if (isRightward) {
                ctx.moveTo(x2 - arrowSize, segY);
                ctx.lineTo(x2 - arrowSize * 2, segY - arrowSize * 0.5);
                ctx.lineTo(x2 - arrowSize * 2, segY + arrowSize * 0.5);
            } else {
                ctx.moveTo(x2 + arrowSize, segY);
                ctx.lineTo(x2 + arrowSize * 2, segY - arrowSize * 0.5);
                ctx.lineTo(x2 + arrowSize * 2, segY + arrowSize * 0.5);
            }
            ctx.closePath();
            ctx.fillStyle = state.chainColor;
            ctx.fill();
            
            // 标注字母（支持拖动偏移）
            const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            const letter = letters[i % letters.length];
            const labelKey = `dim_${letter}`;
            const offset = state.labelOffsets[labelKey] || { x: 0, y: 0 };
            ctx.fillStyle = state.chainColor;
            ctx.font = 'bold 12px Microsoft YaHei';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.fillText(letter, (x1 + x2) / 2 + offset.x, segY - 8 + offset.y);
            
            // 存储标注位置用于拖动检测
            if (!state.axisHoleLabelPositions) state.axisHoleLabelPositions = {};
            state.axisHoleLabelPositions[labelKey] = {
                x: (x1 + x2) / 2 + offset.x,
                y: segY - 8 + offset.y,
                width: 16,
                height: 16
            };
        }
        
        // 绘制封闭环尺寸线
        if (sortedPoints.length >= 2) {
            const firstPoint = sortedPoints[0];
            const lastPoint = sortedPoints[sortedPoints.length - 1];
            const closeLineIndex = sortedPoints.length - 1;
            const closeLineOffset = state.chainLineOffsets[closeLineIndex] || 0;
            const segY = baseOffsetY - (sortedPoints.length * lineSpacing) + closeLineOffset;
            
            const x1 = firstPoint.x * state.scale + state.canvasOffsetX;
            const x2 = lastPoint.x * state.scale + state.canvasOffsetX;
            
            // 存储封闭环线段
            state.chainLineSegments.push({ x1, y1: segY, x2, y2: segY, lineIndex: closeLineIndex });
            
            ctx.strokeStyle = '#9C27B0';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(x1, segY);
            ctx.lineTo(x2, segY);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(x1, segY - 4);
            ctx.lineTo(x1, segY + 4);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(x2, segY - 4);
            ctx.lineTo(x2, segY + 4);
            ctx.stroke();
            
            // 箭头指向最后一个点（方向反转）
            const arrowSize = 10;
            const isRightward = lastPoint.x > firstPoint.x;
            ctx.beginPath();
            if (isRightward) {
                ctx.moveTo(x2 - arrowSize, segY);
                ctx.lineTo(x2 - arrowSize * 2, segY - arrowSize * 0.5);
                ctx.lineTo(x2 - arrowSize * 2, segY + arrowSize * 0.5);
            } else {
                ctx.moveTo(x2 + arrowSize, segY);
                ctx.lineTo(x2 + arrowSize * 2, segY - arrowSize * 0.5);
                ctx.lineTo(x2 + arrowSize * 2, segY + arrowSize * 0.5);
            }
            ctx.closePath();
            ctx.fillStyle = '#9C27B0';
            ctx.fill();
            
            // 标注字母 X（封闭环）
            ctx.fillStyle = '#9C27B0';
            ctx.font = 'bold 12px Microsoft YaHei';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.fillText('X', (x1 + x2) / 2, segY - 8);
        }
    }
}

function drawYArrow(x1, y1, x2, y2) {
    const headLength = 8;
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    
    ctx.save();
    ctx.fillStyle = '#ff4d4f';
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 1;
    
    const isDownward = y2 > y1;
    
    ctx.beginPath();
    if (isDownward) {
        ctx.moveTo(midX, midY + headLength);
        ctx.lineTo(midX - headLength * 0.5, midY - headLength * 0.3);
        ctx.lineTo(midX + headLength * 0.5, midY - headLength * 0.3);
    } else {
        ctx.moveTo(midX, midY - headLength);
        ctx.lineTo(midX - headLength * 0.5, midY + headLength * 0.3);
        ctx.lineTo(midX + headLength * 0.5, midY + headLength * 0.3);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
}

function drawXArrow(x1, y1, x2, y2) {
    const headLength = 8;
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    
    ctx.save();
    ctx.fillStyle = '#ff4d4f';
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 1;
    
    const isRightward = x2 > x1; // 如果终点在起点右侧，箭头向右
    
    ctx.beginPath();
    if (isRightward) {
        // 向右箭头
        ctx.moveTo(midX + headLength, midY);
        ctx.lineTo(midX - headLength * 0.3, midY - headLength * 0.5);
        ctx.lineTo(midX - headLength * 0.3, midY + headLength * 0.5);
    } else {
        // 向左箭头
        ctx.moveTo(midX - headLength, midY);
        ctx.lineTo(midX + headLength * 0.3, midY - headLength * 0.5);
        ctx.lineTo(midX + headLength * 0.3, midY + headLength * 0.5);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
}

// ==================== 鼠标交互 ====================
function handleMouseDown(e) {
    if (!state.imageLoaded) return;
    
    // 中键拖动滚动
    if (e.button === 1) {
        e.preventDefault();
        state.isPanning = true;
        state.panStartX = e.clientX;
        state.panStartY = e.clientY;
        state.panScrollLeft = elements.canvasWrapper.scrollLeft;
        state.panScrollTop = elements.canvasWrapper.scrollTop;
        elements.canvas.style.cursor = 'grabbing';
        return;
    }
    
    // 左键添加/拖动点或标注
    if (e.button === 0) {
        const rect = elements.canvas.getBoundingClientRect();
        // 鼠标在画布上的像素坐标
        const canvasX = e.clientX - rect.left;
        const canvasY = e.clientY - rect.top;
        // 世界坐标（用于添加点和拖动点）
        const x = (canvasX - state.canvasOffsetX) / state.scale;
        const y = (canvasY - state.canvasOffsetY) / state.scale;
        
        // 先检查是否点击了 D/d 标注（用画布像素坐标）
        const clickedLabel = findLabelAt(canvasX, canvasY);
        if (clickedLabel) {
            state.draggingLabel = {
                labelKey: clickedLabel,
                startX: e.clientX,
                startY: e.clientY,
                startOffsetX: state.labelOffsets[clickedLabel]?.x || 0,
                startOffsetY: state.labelOffsets[clickedLabel]?.y || 0
            };
            elements.canvas.style.cursor = 'move';
            return;
        }

        // 检查是否点击了尺寸链线（用于拖动单条尺寸链）
        const clickedChain = findChainLineAt(canvasX, canvasY);
        if (clickedChain) {
            state.draggingChainLine = {
                lineIndex: clickedChain.lineIndex,
                startX: e.clientX,
                startY: e.clientY,
                startOffset: state.chainLineOffsets[clickedChain.lineIndex] || 0
            };
            elements.canvas.style.cursor = 'move';
            return;
        }

        // 检查是否点击了现有点
        const clickedIndex = findPointAt(x, y);

        if (clickedIndex >= 0) {
            state.isDragging = true;
            state.dragPointIndex = clickedIndex;
        } else {
            // 添加新点（允许在图片外面添加）
            addPoint(x, y);
        }
    }
    
    // 右键添加轴孔点
    if (e.button === 2) {
        const rect = elements.canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left - state.canvasOffsetX) / state.scale;
        const y = (e.clientY - rect.top - state.canvasOffsetY) / state.scale;
        addPoint(x, y, PointType.AXIS_HOLE);
    }
}

function handleMouseMove(e) {
    // 中键拖动滚动
    if (state.isPanning) {
        e.preventDefault();
        const dx = e.clientX - state.panStartX;
        const dy = e.clientY - state.panStartY;
        elements.canvasWrapper.scrollLeft = state.panScrollLeft - dx;
        elements.canvasWrapper.scrollTop = state.panScrollTop - dy;
        return;
    }

    // 拖动单条尺寸链
    if (state.draggingChainLine) {
        const lineIndex = state.draggingChainLine.lineIndex;
        
        // 根据尺寸链方向限制拖动方向
        if (state.chainDirection === 'vertical' || state.chainDirection === 'depth') {
            // Y向/Z向尺寸链：只能水平(X)方向拖动
            const dx = (e.clientX - state.draggingChainLine.startX) / state.scale;
            state.chainLineOffsets[lineIndex] = state.draggingChainLine.startOffset + dx;
        } else {
            // X向尺寸链：只能竖直(Y)方向拖动
            const dy = (e.clientY - state.draggingChainLine.startY) / state.scale;
            state.chainLineOffsets[lineIndex] = state.draggingChainLine.startOffset + dy;
        }

        drawCanvas();
        return;
    }

    // 拖动 D/d 标注
    if (state.draggingLabel) {
        const dx = (e.clientX - state.draggingLabel.startX) / state.scale;
        const dy = (e.clientY - state.draggingLabel.startY) / state.scale;

        if (!state.labelOffsets[state.draggingLabel.labelKey]) {
            state.labelOffsets[state.draggingLabel.labelKey] = { x: 0, y: 0 };
        }
        state.labelOffsets[state.draggingLabel.labelKey].x = state.draggingLabel.startOffsetX + dx;
        state.labelOffsets[state.draggingLabel.labelKey].y = state.draggingLabel.startOffsetY + dy;

        drawCanvas();
        return;
    }

    // 鼠标悬停时检查是否在标注或点上，改变光标样式
    if (!state.isDragging && state.imageLoaded) {
        const rect = elements.canvas.getBoundingClientRect();
        const canvasX = e.clientX - rect.left;
        const canvasY = e.clientY - rect.top;
        const x = (canvasX - state.canvasOffsetX) / state.scale;
        const y = (canvasY - state.canvasOffsetY) / state.scale;

        const hoveredLabel = findLabelAt(canvasX, canvasY);
        const hoveredChain = findChainLineAt(canvasX, canvasY);
        const hoveredPoint = findPointAt(x, y);
        
        if (hoveredLabel || hoveredPoint >= 0) {
            elements.canvas.style.cursor = 'move';
        } else if (hoveredChain) {
            // 根据尺寸链方向显示不同的光标
            if (state.chainDirection === 'vertical' || state.chainDirection === 'depth') {
                elements.canvas.style.cursor = 'ew-resize'; // Y向：左右箭头
            } else {
                elements.canvas.style.cursor = 'ns-resize'; // X向：上下箭头
            }
        } else {
            elements.canvas.style.cursor = 'crosshair';
        }
    }

    // 左键拖动点
    if (!state.isDragging || state.dragPointIndex < 0) return;

    const rect = elements.canvas.getBoundingClientRect();
    // 考虑画布偏移量
    const x = (e.clientX - rect.left - state.canvasOffsetX) / state.scale;
    const y = (e.clientY - rect.top - state.canvasOffsetY) / state.scale;

    state.points[state.dragPointIndex].x = x;
    state.points[state.dragPointIndex].y = y;

    drawCanvas();
    updatePointList();
}

function handleMouseUp(e) {
    // 结束中键拖动
    if (state.isPanning) {
        state.isPanning = false;
        elements.canvas.style.cursor = 'crosshair';
    }

    // 结束单条尺寸链拖动
    if (state.draggingChainLine) {
        state.draggingChainLine = null;
        elements.canvas.style.cursor = 'crosshair';
    }

    // 结束 D/d 标注拖动
    if (state.draggingLabel) {
        state.draggingLabel = null;
        elements.canvas.style.cursor = 'crosshair';
    }

    // 结束左键拖动点
    state.isDragging = false;
    state.dragPointIndex = -1;
}

function findPointAt(x, y) {
    const threshold = 15 / state.scale;
    for (let i = 0; i < state.points.length; i++) {
        const p = state.points[i];
        const dist = Math.sqrt((x - p.x) ** 2 + (y - p.y) ** 2);
        if (dist < threshold) return i;
    }
    return -1;
}

// 检测是否点击了 D/d 标注（传入画布像素坐标）
function findLabelAt(canvasX, canvasY) {
    if (!state.axisHoleLabelPositions) return null;

    const threshold = 10; // 像素容差

    for (const [labelKey, pos] of Object.entries(state.axisHoleLabelPositions)) {
        const halfW = pos.width / 2 + threshold;
        const halfH = pos.height / 2 + threshold;

        if (Math.abs(canvasX - pos.x) < halfW && Math.abs(canvasY - pos.y) < halfH) {
            return labelKey;
        }
    }

    return null;
}

// 检测是否点击了尺寸链线（传入画布像素坐标）
function findChainLineAt(canvasX, canvasY) {
    if (!state.chainLineSegments) return null;

    const threshold = 8; // 像素容差

    for (const seg of state.chainLineSegments) {
        // 计算点到线段的距离
        const dist = pointToSegmentDistance(canvasX, canvasY, seg.x1, seg.y1, seg.x2, seg.y2);
        if (dist < threshold) {
            return seg;
        }
    }

    return null;
}

// 计算点到线段的距离
function pointToSegmentDistance(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lenSq = dx * dx + dy * dy;

    if (lenSq === 0) {
        return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2);
    }

    let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));

    const projX = x1 + t * dx;
    const projY = y1 + t * dy;

    return Math.sqrt((px - projX) ** 2 + (py - projY) ** 2);
}

function addPoint(x, y, type) {
    const point = {
        x: x,
        y: y,
        type: type || state.currentMode,
        id: Date.now()
    };
    
    state.points.push(point);
    drawCanvas();
    updatePointList();
}

// ==================== 更新点列表 ====================
function updatePointList() {
    if (state.points.length === 0) {
        elements.pointList.innerHTML = '<p style="color: #999; text-align: center; padding: 20px;">暂无标注点</p>';
        return;
    }
    
    // 按添加顺序排序
    const sortedPoints = [...state.points].sort((a, b) => a.id - b.id);
    
    // 统计普通点数量
    const normalCount = sortedPoints.filter(p => p.type === PointType.NORMAL).length;
    
    let html = '';
    let normalIndex = 0;
    let axisHoleIndex = 0;
    
    sortedPoints.forEach((point) => {
        const originalIndex = state.points.indexOf(point);
        let pointLabel;
        
        if (point.type === PointType.AXIS_HOLE) {
            axisHoleIndex++;
            pointLabel = axisHoleIndex + PointLabels[point.type];
        } else {
            normalIndex++;
            // 普通点：第一个是S，最后一个是E，中间是数字
            if (normalIndex === 1) {
                pointLabel = 'S';
            } else if (normalIndex === normalCount) {
                pointLabel = 'E';
            } else {
                pointLabel = normalIndex.toString();
            }
        }
        
        html += `
            <div class="point-item">
                <div class="point-color" style="background: ${PointColors[point.type]}"></div>
                <div class="point-info">
                    <div>${pointLabel}</div>
                    <div class="point-coords">(${point.x.toFixed(1)}, ${point.y.toFixed(1)})</div>
                </div>
                <div class="point-delete" onclick="deletePoint(${originalIndex})">✕</div>
            </div>
        `;
    });
    elements.pointList.innerHTML = html;
}

function deletePoint(index) {
    state.points.splice(index, 1);
    drawCanvas();
    updatePointList();
}

// ==================== 生成尺寸链 ====================
function generateDimensionChain() {
    if (state.points.length < 2) {
        alert('请至少标注2个点');
        return;
    }
    
    drawCanvas();
    
    // 显示尺寸链信息
    const sortedPoints = [...state.points].sort((a, b) => a.id - b.id);
    let html = '<div class="chain-info">';
    let directionText = 'X向(水平)';
    if (state.chainDirection === 'vertical') {
        directionText = 'Y向(垂直)';
    } else if (state.chainDirection === 'depth') {
        directionText = 'Z向(深度)';
    }
    html += '<div class="chain-row"><span>方向:</span><span>' + directionText + '</span></div>';
    html += '<div class="chain-row"><span>总点数:</span><span>' + state.points.length + '</span></div>';
    html += '</div>';
    elements.chainInfo.innerHTML = html;
    
    // 生成尺寸代号输入界面
    generateDimensionInputs(sortedPoints);
}

// 生成尺寸代号输入界面
function generateDimensionInputs(sortedPoints) {
    let html = '<div class="dimension-inputs">';
    
    // 生成封闭环 X设计值 - 放在最上面
    const closedLoopLetter = 'X设计值';
    const firstPoint = sortedPoints[0];
    const lastPoint = sortedPoints[sortedPoints.length - 1];
    
    // 封闭环方向判断
    let isClosedLoopPositive;
    if (state.chainDirection === 'vertical' || state.chainDirection === 'depth') {
        isClosedLoopPositive = firstPoint.y > lastPoint.y; // 第一个点在最后一个点下方为正
    } else {
        isClosedLoopPositive = firstPoint.x > lastPoint.x; // 第一个点在最后一个点右侧为正
    }
    
    const xDesignMin = state.dimensionValues['X设计值_min'] || '';
    const xDesignMax = state.dimensionValues['X设计值_max'] || '';
    const closedSign = isClosedLoopPositive ? '+' : '-';
    
    html += `
        <div class="dimension-row" style="margin-bottom: 10px; border-bottom: 2px solid #9C27B0; padding-bottom: 10px;">
            <label class="dimension-label" style="color: #9C27B0; font-weight: bold;">${closedLoopLetter}:</label>
            <span style="margin-right: 4px; color: ${isClosedLoopPositive ? '#52c41a' : '#ff4d4f'}; font-weight: bold;">${closedSign}</span>
            <input type="number" class="dimension-input" data-dim="X设计值_min" value="${xDesignMin}" placeholder="较小值" onchange="updateDimensionValue('X设计值_min', this.value)">
            <span style="margin: 0 4px; color: #666;">~</span>
            <input type="number" class="dimension-input" data-dim="X设计值_max" value="${xDesignMax}" placeholder="较大值" onchange="updateDimensionValue('X设计值_max', this.value)">
        </div>
    `;
    
    // 生成各段尺寸代号 A, B, C...
    for (let i = 0; i < sortedPoints.length - 1; i++) {
        const p1 = sortedPoints[i];
        const p2 = sortedPoints[i + 1];
        
        // 判断方向：Y向看Y坐标，X向看X坐标
        let isPositive;
        if (state.chainDirection === 'vertical') {
            isPositive = p2.y > p1.y; // 终点在起点下方为正
        } else {
            isPositive = p2.x > p1.x; // 终点在起点右侧为正
        }
        
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const letter = letters[i % letters.length];
        const value = state.dimensionValues[letter] || '';
        const tolerance = state.dimensionValues[letter + '_tol'] || '';
        const cpk = state.dimensionValues[letter + '_cpk'] || '1';
        const remark = state.dimensionValues[letter + '_remark'] || '';
        const sign = isPositive ? '+' : '-';
        
        html += `
            <div class="dimension-row" style="flex-wrap: wrap;">
                <label class="dimension-label">${letter}:</label>
                <span style="margin-right: 4px; color: ${isPositive ? '#52c41a' : '#ff4d4f'}; font-weight: bold;">${sign}</span>
                <input type="number" class="dimension-input" data-dim="${letter}" value="${value}" placeholder="基本尺寸" onchange="updateDimensionValue('${letter}', this.value)">
                <span style="margin: 0 4px;">±</span>
                <input type="number" class="dimension-input tolerance-input" data-dim="${letter}_tol" value="${tolerance}" placeholder="公差" onchange="updateDimensionValue('${letter}_tol', this.value)">
                <span style="margin: 0 4px; color: #666; font-size: 11px;">CPK:</span>
                <input type="number" class="dimension-input" data-dim="${letter}_cpk" value="${cpk}" placeholder="CPK" step="0.01" style="width: 50px;" onchange="updateDimensionValue('${letter}_cpk', this.value)">
            </div>
            <div class="dimension-row" style="margin-bottom: 8px; padding-left: 35px;">
                <input type="text" class="dimension-input" data-dim="${letter}_remark" value="${remark}" placeholder="备注：尺寸名称" style="width: 100%; font-size: 11px; color: #666;" onchange="updateDimensionValue('${letter}_remark', this.value)">
            </div>
        `;
    }
    
    // 生成轴孔尺寸代号 D1/d1, D2/d2...
    let axisHoleCount = 0;
    sortedPoints.forEach((point) => {
        if (point.type === PointType.AXIS_HOLE) {
            axisHoleCount++;
            const dKey = 'D' + axisHoleCount;
            const dValue = state.dimensionValues[dKey] || '';
            const dTol = state.dimensionValues[dKey + '_tol'] || '';
            const dSmallKey = 'd' + axisHoleCount;
            const dSmallValue = state.dimensionValues[dSmallKey] || '';
            const dSmallTol = state.dimensionValues[dSmallKey + '_tol'] || '';
            const isBeneficial = state.dimensionValues[dKey + '_beneficial'] || '否';
            const cpkD = state.dimensionValues[dKey + '_cpk'] || '1';
            const cpkd = state.dimensionValues[dSmallKey + '_cpk'] || '1';
            const remarkD = state.dimensionValues[dKey + '_remark'] || '';
            const remarkd = state.dimensionValues[dSmallKey + '_remark'] || '';
            html += `
                <div style="margin-top: 8px; border: 1px solid #e8e8e8; border-radius: 4px; padding: 8px; background: #f6ffed;">
                    <div style="font-size: 11px; color: #52c41a; font-weight: bold; margin-bottom: 6px;">轴孔 ${axisHoleCount}</div>
                    <!-- D1 行：尺寸 + 公差 + CPK + 备注 -->
                    <div class="dimension-row" style="margin-bottom: 6px;">
                        <label class="dimension-label" style="color: ${state.chainColor}; min-width: 30px;">${dKey}:</label>
                        <input type="number" class="dimension-input" data-dim="${dKey}" value="${dValue}" placeholder="孔径" onchange="updateDimensionValue('${dKey}', this.value)" style="flex: 1;">
                        <span style="margin: 0 3px; color: #999;">±</span>
                        <input type="number" class="dimension-input tolerance-input" data-dim="${dKey}_tol" value="${dTol}" placeholder="公差" onchange="updateDimensionValue('${dKey}_tol', this.value)">
                        <span style="margin: 0 3px; color: #666; font-size: 10px;">CPK:</span>
                        <input type="number" class="dimension-input" data-dim="${dKey}_cpk" value="${cpkD}" placeholder="CPK" step="0.01" style="width: 40px;" onchange="updateDimensionValue('${dKey}_cpk', this.value)">
                    </div>
                    <div class="dimension-row" style="margin-bottom: 6px; padding-left: 30px;">
                        <input type="text" class="dimension-input" data-dim="${dKey}_remark" value="${remarkD}" placeholder="备注：孔名称" style="width: 100%; font-size: 11px; color: #666;" onchange="updateDimensionValue('${dKey}_remark', this.value)">
                    </div>
                    <!-- d1 行：尺寸 + 公差 + CPK + 备注 -->
                    <div class="dimension-row">
                        <label class="dimension-label" style="color: #52c41a; min-width: 30px;">${dSmallKey}:</label>
                        <input type="number" class="dimension-input" data-dim="${dSmallKey}" value="${dSmallValue}" placeholder="轴径" onchange="updateDimensionValue('${dSmallKey}', this.value)" style="flex: 1;">
                        <span style="margin: 0 3px; color: #999;">±</span>
                        <input type="number" class="dimension-input tolerance-input" data-dim="${dSmallKey}_tol" value="${dSmallTol}" placeholder="公差" onchange="updateDimensionValue('${dSmallKey}_tol', this.value)">
                        <span style="margin: 0 3px; color: #666; font-size: 10px;">CPK:</span>
                        <input type="number" class="dimension-input" data-dim="${dSmallKey}_cpk" value="${cpkd}" placeholder="CPK" step="0.01" style="width: 40px;" onchange="updateDimensionValue('${dSmallKey}_cpk', this.value)">
                    </div>
                    <div class="dimension-row" style="padding-left: 30px;">
                        <input type="text" class="dimension-input" data-dim="${dSmallKey}_remark" value="${remarkd}" placeholder="备注：轴名称" style="width: 100%; font-size: 11px; color: #666;" onchange="updateDimensionValue('${dSmallKey}_remark', this.value)">
                    </div>
                    <!-- 是否有利 -->
                    <div style="margin-top: 6px; padding-top: 6px; border-top: 1px dashed #d9f7be;">
                        <label style="font-size: 11px; color: #666; margin-right: 8px;">是否有利:</label>
                        <select data-dim="${dKey}_beneficial" onchange="updateDimensionValue('${dKey}_beneficial', this.value)" style="padding: 2px 6px; font-size: 11px; border: 1px solid #d9d9d9; border-radius: 3px;">
                            <option value="否" ${isBeneficial === '否' ? 'selected' : ''}>否</option>
                            <option value="是" ${isBeneficial === '是' ? 'selected' : ''}>是</option>
                        </select>
                    </div>
                </div>
            `;
        }
    });
    
    html += '</div>';
    elements.dimensionInputs.innerHTML = html;
}

// 更新尺寸值
function updateDimensionValue(dim, value) {
    // 对于是否有利字段和备注字段，保存字符串值；其他字段转换为数字
    if (dim.endsWith('_beneficial') || dim.endsWith('_remark')) {
        state.dimensionValues[dim] = value;
    } else {
        state.dimensionValues[dim] = parseFloat(value) || 0;
    }
}

// 更新项目名称
function updateProjectName(value) {
    state.projectName = value;
}

function clearAllPoints() {
    if (state.points.length === 0) return;
    if (confirm('确定要清空所有标注点吗？')) {
        state.points = [];
        state.dimensionValues = {}; // 清空尺寸值
        drawCanvas();
        updatePointList();
        elements.chainInfo.innerHTML = '<p style="color: #999; text-align: center; padding: 20px;">请先生成尺寸链</p>';
        elements.dimensionInputs.innerHTML = '<p style="color: #999; text-align: center; padding: 20px;">请先生成尺寸链</p>';
        elements.resultBox.innerHTML = '<p style="color: #999; text-align: center;">点击上方按钮进行计算</p>';
        // 清空封闭环X计算结果
        const extremeXResult = document.getElementById('extremeXResult');
        const statXResult = document.getElementById('statXResult');
        if (extremeXResult) extremeXResult.innerHTML = '--';
        if (statXResult) statXResult.innerHTML = '--';
    }
}

// ==================== 计算 ====================
function calculateBoth() {
    const dims = getDimensions();
    if (!dims) return;
    
    // 先设置结果框的HTML结构
    const result = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div style="background: #f6ffed; border: 1px solid #b7eb8f; border-radius: 4px; padding: 12px;">
                <div style="font-weight: bold; color: #52c41a; margin-bottom: 8px; font-size: 14px;">极值法</div>
                <div id="extremeResultContent" style="font-size: 12px; line-height: 1.6;">计算中...</div>
            </div>
            <div style="background: #e6f7ff; border: 1px solid #91d5ff; border-radius: 4px; padding: 12px;">
                <div style="font-weight: bold; color: ${state.chainColor}; margin-bottom: 8px; font-size: 14px;">统计法</div>
                <div id="statResultContent" style="font-size: 12px; line-height: 1.6;">计算中...</div>
            </div>
        </div>
    `;
    elements.resultBox.innerHTML = result;
    
    // 执行极值法计算（会更新 extremeResultContent）
    calculateExtreme();
    
    // 执行统计法计算（会更新 statResultContent）
    calculateStatistical();
}

function calculateExtreme() {
    const dims = getDimensions();
    if (!dims) return;
    
    // 分离普通尺寸和轴孔尺寸
    const segmentDims = dims.filter(d => d.type === 'segment');
    const axisHoleDims = dims.filter(d => d.type === 'axisHole');
    
    // 计算公差（普通尺寸公差 + 轴孔公差/2）
    // 参考Excel公式: =SUM(尺寸公差)+SUM(轴孔公差)/2
    const segmentTolerance = segmentDims.reduce((sum, d) => sum + d.tolerance, 0);
    const axisHoleTolerance = axisHoleDims.reduce((sum, d) => sum + d.tolerance, 0);
    const totalTolerance = segmentTolerance + axisHoleTolerance / 2;
    
    // 计算中间值（只考虑普通尺寸，不考虑轴孔间隙）
    const nominal = segmentDims.reduce((sum, d) => sum + (d.increasing ? d.value : -d.value), 0);
    const absNominal = Math.abs(nominal);
    
    // 计算累积偏移（轴孔间隙的影响）
    // Excel公式: =ROUND((SUMIF(是否有利="是",轴尺寸)-SUMIF(是否有利="是",孔直径)+SUMIF(是否有利="否",孔直径)-SUMIF(是否有利="否",轴尺寸))/2,)
    // 有利时: 轴尺寸 - 孔直径 (间隙配合，间隙为正)
    // 不利时: 孔直径 - 轴尺寸 (过盈配合，间隙为负)
    let cumulativeOffset = 0;
    
    // 有利的轴孔: 轴尺寸 - 孔直径
    const beneficialHoles = axisHoleDims.filter(d => d.isBeneficial);
    const beneficialSum = beneficialHoles.reduce((sum, d) => sum + d.d - d.D, 0);
    
    // 不利的轴孔: 孔直径 - 轴尺寸
    const nonBeneficialHoles = axisHoleDims.filter(d => !d.isBeneficial);
    const nonBeneficialSum = nonBeneficialHoles.reduce((sum, d) => sum + d.D - d.d, 0);
    
    cumulativeOffset = (beneficialSum + nonBeneficialSum) / 2;
    
    // 计算轴孔间隙带来的影响（用于显示）
    const axisHoleEffect = axisHoleDims.reduce((sum, d) => {
        return sum + (d.increasing ? d.value : -d.value);
    }, 0);
    
    // 左右极限计算
    // 左极限 = 公称值 - 公差 - 累积偏移
    // 右极限 = 公称值 + 公差 + 累积偏移
    const minLimit = nominal - totalTolerance - cumulativeOffset;
    const maxLimit = nominal + totalTolerance + cumulativeOffset;
    
    // 更新结果框中的极值法结果
    const extremeResultContent = document.getElementById('extremeResultContent');
    if (extremeResultContent) {
        extremeResultContent.innerHTML = `
            <div style="font-size: 11px; color: #666; margin-bottom: 4px;">公差: ${totalTolerance.toFixed(3)}</div>
            <div style="font-size: 11px; color: #666; margin-bottom: 4px;">累积偏移: ${cumulativeOffset.toFixed(3)}</div>
            <div style="font-size: 13px; color: #333; font-weight: bold; margin-bottom: 4px;">公称值: ${nominal.toFixed(2)}</div>
            <div style="font-size: 11px; color: #666;">[${minLimit.toFixed(3)}, ${maxLimit.toFixed(3)}]</div>
        `;
    }
}

function calculateStatistical() {
    const dims = getDimensions();
    if (!dims) return;
    
    // 分离普通尺寸和轴孔尺寸
    const segmentDims = dims.filter(d => d.type === 'segment');
    const axisHoleDims = dims.filter(d => d.type === 'axisHole');
    
    // 统计法计算 - 按照Excel公式
    // 单方差 = (公差 / (3 * CPK))^2
    // 整体方差 = SQRT(SUM(所有单方差))
    // 最终公差 = 1.5 * 3 * 整体方差 = 4.5 * 整体方差
    
    // 1. 计算普通尺寸的单方差
    const segmentVariances = segmentDims.map(d => {
        const cpk = d.cpk || 1;
        const singleVariance = Math.pow(d.tolerance / (3 * cpk), 2);
        return singleVariance;
    });
    
    // 2. 计算轴孔尺寸的单方差（轴和孔分别计算）
    // 孔单方差 = ((孔公差/2) / (3 * 孔CPK))^2
    // 轴单方差 = ((轴公差/2) / (3 * 轴CPK))^2
    const axisHoleVariances = axisHoleDims.map(d => {
        const cpkD = d.cpkD || 1;  // 孔的CPK
        const cpkd = d.cpkd || 1;  // 轴的CPK
        const D_tol = d.D_tol || 0;  // 孔公差（单独存储）
        const d_tol = d.d_tol || 0;  // 轴公差（单独存储）
        
        // 孔的单方差 = ((D_tol/2) / (3*cpkD))^2
        const varianceD = Math.pow((D_tol / 2) / (3 * cpkD), 2);
        // 轴的单方差 = ((d_tol/2) / (3*cpkd))^2
        const varianced = Math.pow((d_tol / 2) / (3 * cpkd), 2);
        
        return varianceD + varianced;
    });
    
    // 3. 计算整体方差 = SQRT(SUM(所有单方差))
    const allVariances = [...segmentVariances, ...axisHoleVariances];
    const sumOfVariances = allVariances.reduce((sum, v) => sum + v, 0);
    const totalVariance = Math.sqrt(sumOfVariances);
    
    // 4. 最终公差 = 4.5 * 整体方差
    const totalTolerance = 4.5 * totalVariance;
    
    // 计算中间值（只考虑普通尺寸）
    const nominal = segmentDims.reduce((sum, d) => sum + (d.increasing ? d.value : -d.value), 0);
    const absNominal = Math.abs(nominal);
    
    // 计算累积偏移（轴孔间隙的影响）
    // Excel公式: =ROUND((SUMIF(是否有利="是",轴尺寸)-SUMIF(是否有利="是",孔直径)+SUMIF(是否有利="否",孔直径)-SUMIF(是否有利="否",轴尺寸))/2,)
    let cumulativeOffset = 0;
    
    // 有利的轴孔: 轴尺寸 - 孔直径
    const beneficialHoles = axisHoleDims.filter(d => d.isBeneficial);
    const beneficialSum = beneficialHoles.reduce((sum, d) => sum + d.d - d.D, 0);
    
    // 不利的轴孔: 孔直径 - 轴尺寸
    const nonBeneficialHoles = axisHoleDims.filter(d => !d.isBeneficial);
    const nonBeneficialSum = nonBeneficialHoles.reduce((sum, d) => sum + d.D - d.d, 0);
    
    cumulativeOffset = (beneficialSum + nonBeneficialSum) / 2;
    
    // 左右极限计算
    // 左极限 = 公称值 - 公差 - 累积偏移
    // 右极限 = 公称值 + 公差 + 累积偏移
    const minLimit = nominal - totalTolerance - cumulativeOffset;
    const maxLimit = nominal + totalTolerance + cumulativeOffset;
    
    // 计算CPK值
    // 获取X设计值的较大值和较小值
    const xDesignMax = state.dimensionValues['X设计值_max'] || 0;
    const xDesignMin = state.dimensionValues['X设计值_min'] || 0;
    
    // CPK计算公式：
    // CPK1 = (X设计值较大值 - X公称值 - 累积偏移) / (3 * 整体方差)
    // CPK2 = (X公称值 - 累积偏移 - X设计值较小值) / (3 * 整体方差)
    // CPK = min(CPK1, CPK2)
    let cpkValue = null;
    if (xDesignMax > 0 || xDesignMin > 0) {
        const cpk1 = (xDesignMax - nominal - cumulativeOffset) / (3 * totalVariance);
        const cpk2 = (nominal - cumulativeOffset - xDesignMin) / (3 * totalVariance);
        cpkValue = Math.min(cpk1, cpk2);
    }
    
    // 更新结果框中的统计法结果
    const statResultContent = document.getElementById('statResultContent');
    if (statResultContent) {
        let cpkHtml = '';
        if (cpkValue !== null) {
            const cpkColor = cpkValue >= 1.33 ? '#52c41a' : (cpkValue >= 1.0 ? '#faad14' : '#ff4d4f');
            cpkHtml = `<div style="font-size: 13px; color: ${cpkColor}; font-weight: bold; margin-bottom: 4px;">CPK: ${cpkValue.toFixed(3)}</div>`;
        }
        
        statResultContent.innerHTML = `
            <div style="font-size: 11px; color: #666; margin-bottom: 4px;">公差: ${totalTolerance.toFixed(3)}</div>
            <div style="font-size: 11px; color: #666; margin-bottom: 4px;">累积偏移: ${cumulativeOffset.toFixed(3)}</div>
            <div style="font-size: 13px; color: #333; font-weight: bold; margin-bottom: 4px;">公称值: ${nominal.toFixed(2)}</div>
            ${cpkHtml}
            <div style="font-size: 11px; color: #666;">[${minLimit.toFixed(3)}, ${maxLimit.toFixed(3)}]</div>
        `;
    }
}

function getDimensions() {
    if (state.points.length < 2) {
        alert('请至少标注2个点');
        return null;
    }
    
    // 所有点按添加顺序排序
    const sorted = [...state.points].sort((a, b) => a.id - b.id);
    
    const dims = [];
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    
    // 1. 添加组成环尺寸 (A, B, C...)
    for (let i = 0; i < sorted.length - 1; i++) {
        const letter = letters[i % letters.length];
        
        // 从尺寸代号输入区获取数值和公差
        // 使用 null 表示未输入，0 表示用户输入了0
        let value = state.dimensionValues.hasOwnProperty(letter) ? state.dimensionValues[letter] : null;
        let tolerance = state.dimensionValues[letter + '_tol'] || 0;
        
        // 判断方向（根据正负号或坐标）
        const p1 = sorted[i];
        const p2 = sorted[i + 1];
        let isIncreasing;
        if (state.chainDirection === 'vertical' || state.chainDirection === 'depth') {
            isIncreasing = p2.y > p1.y; // 向下为正
        } else {
            isIncreasing = p2.x > p1.x; // 向右为正
        }
        
        // 如果用户输入了值（包括0），使用用户输入的值
        // 如果没有输入，使用坐标距离
        if (value === null || value === undefined) {
            if (state.chainDirection === 'vertical' || state.chainDirection === 'depth') {
                value = Math.abs(p2.y - p1.y);
            } else {
                value = Math.abs(p2.x - p1.x);
            }
        }
        
        dims.push({
            value: Math.abs(value),
            tolerance: Math.abs(tolerance),
            increasing: isIncreasing,
            type: 'segment',
            name: letter,
            cpk: state.dimensionValues[letter + '_cpk'] || 1
        });
    }
    
    // 2. 添加轴孔尺寸 (D1/d1, D2/d2...)
    let axisHoleCount = 0;
    sorted.forEach((point) => {
        if (point.type === PointType.AXIS_HOLE) {
            axisHoleCount++;
            const dKey = 'D' + axisHoleCount;
            const dSmallKey = 'd' + axisHoleCount;
            
            const D = state.dimensionValues[dKey] || 0;  // 大径
            const d = state.dimensionValues[dSmallKey] || 0;  // 小径
            const D_tol = state.dimensionValues[dKey + '_tol'] || 0;
            const d_tol = state.dimensionValues[dSmallKey + '_tol'] || 0;
            const isBeneficial = state.dimensionValues[dKey + '_beneficial'] === '是';
            
            if (D > 0 && d > 0) {
                // 计算间隙或干涉
                // 间隙 = 大径 - 小径
                // 如果有利(间隙配合): 间隙为正，增加封闭环尺寸
                // 如果不有利(过盈配合): 间隙为负，减小封闭环尺寸
                const clearance = D - d;
                const clearanceTol = D_tol + d_tol; // 公差累积
                
                // 轴孔分别的CPK
                const cpkD = state.dimensionValues[dKey + '_cpk'] || 1;
                const cpkd = state.dimensionValues[dSmallKey + '_cpk'] || 1;
                
                dims.push({
                    value: Math.abs(clearance),
                    tolerance: Math.abs(clearanceTol),
                    increasing: isBeneficial,
                    type: 'axisHole',
                    name: dKey + '/' + dSmallKey,
                    isBeneficial: isBeneficial,
                    cpkD: cpkD,
                    cpkd: cpkd,
                    D: D,  // 孔的直径
                    d: d,  // 轴的尺寸
                    D_tol: D_tol,  // 孔公差（单独存储）
                    d_tol: d_tol   // 轴公差（单独存储）
                });
            }
        }
    });
    
    return dims;
}

// ==================== 导出 ====================
function exportImage() {
    if (!state.imageLoaded) {
        alert('请先上传图像');
        return;
    }
    
    // 创建裁剪后的画布，只包含图片+尺寸链内容
    const exportCanvas = createCroppedCanvas();
    
    // 检查是否支持剪贴板API
    if (navigator.clipboard && navigator.clipboard.write && typeof ClipboardItem !== 'undefined') {
        exportCanvas.toBlob(async (blob) => {
            if (!blob) {
                downloadImage(exportCanvas);
                return;
            }
            try {
                await navigator.clipboard.write([
                    new ClipboardItem({ 'image/png': blob })
                ]);
                showToast('图像已复制到剪贴板');
            } catch (err) {
                console.warn('复制到剪贴板失败:', err);
                downloadImage(exportCanvas);
            }
        }, 'image/png');
    } else {
        downloadImage(exportCanvas);
    }
}

function createCroppedCanvas() {
    const scale = state.scale;
    const imgW = state.image.width * scale;
    const imgH = state.image.height * scale;
    const padding = 20; // 边距
    
    // 计算尺寸链标注占用的额外空间
    const sortedPoints = [...state.points].sort((a, b) => a.id - b.id);
    const lineSpacing = 20;
    const annotationCount = sortedPoints.length;
    const annotationSpace = annotationCount * lineSpacing + 60; // 标注区域宽度
    
    let cropX, cropY, cropW, cropH;
    
    if (state.chainDirection === 'vertical' || state.chainDirection === 'depth') {
        // 垂直方向：左侧有标注，右侧是图片
        cropX = state.canvasOffsetX - annotationSpace;
        cropY = state.canvasOffsetY - padding;
        cropW = imgW + annotationSpace + padding * 2;
        cropH = imgH + padding * 2;
    } else {
        // 水平方向：上方有标注，下方是图片
        cropX = state.canvasOffsetX - padding;
        cropY = state.canvasOffsetY - annotationSpace;
        cropW = imgW + padding * 2;
        cropH = imgH + annotationSpace + padding * 2;
    }
    
    // 确保不超出画布范围
    cropX = Math.max(0, cropX);
    cropY = Math.max(0, cropY);
    cropW = Math.min(elements.canvas.width - cropX, cropW);
    cropH = Math.min(elements.canvas.height - cropY, cropH);
    
    // 创建新画布并裁剪
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = cropW;
    tempCanvas.height = cropH;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(elements.canvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
    
    return tempCanvas;
}

function downloadImage(canvas) {
    const target = canvas || elements.canvas;
    const link = document.createElement('a');
    link.download = '尺寸链分析_' + new Date().getTime() + '.png';
    link.href = target.toDataURL();
    link.click();
}

function showToast(message) {
    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        toast.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:#333;color:#fff;padding:10px 24px;border-radius:6px;font-size:14px;z-index:99999;opacity:0;transition:opacity 0.3s;pointer-events:none;';
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.style.opacity = '1';
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
        toast.style.opacity = '0';
    }, 2000);
}

function exportData() {
    if (state.points.length === 0) {
        alert('没有数据可导出');
        return;
    }
    
    // 收集所有数据
    const data = {
        // 项目名称
        projectName: state.projectName,
        // 原始图像数据（Base64）- 使用原始图片，不包含标注
        image: state.image ? state.image.src : null,
        // 标注点
        points: state.points,
        // 尺寸链方向
        direction: state.chainDirection,
        // 当前标注模式
        currentMode: state.currentMode,
        // 所有尺寸值
        dimensionValues: state.dimensionValues,
        // 图像缩放比例
        scale: state.scale,
        // D/d 标注偏移量（用于恢复标注位置）
        labelOffsets: state.labelOffsets,
        // 尺寸链线条偏移量（用于恢复拖动后的位置）
        chainLineOffsets: state.chainLineOffsets,
        // 导出时间
        exportTime: new Date().toLocaleString(),
        // 版本号
        version: '1.2'
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    
    // 构建文件名：项目名称 + 链方向
    const projectName = state.projectName || '尺寸链分析';
    let directionText = 'X向';
    if (state.chainDirection === 'vertical') {
        directionText = 'Y向';
    } else if (state.chainDirection === 'depth') {
        directionText = 'Z向';
    }
    const fileName = projectName + '_' + directionText + '.json';
    
    link.download = fileName;
    link.href = URL.createObjectURL(blob);
    link.click();
}

// ==================== 导入数据 ====================
function importData(jsonData) {
    try {
        const data = JSON.parse(jsonData);
        
        // 验证版本
        if (!data.version) {
            throw new Error('数据格式不正确');
        }
        
        // 加载图像
        if (data.image) {
            const img = new Image();
            img.onload = () => {
                state.image = img;
                state.imageLoaded = true;
                elements.emptyState.style.display = 'none';
                elements.canvas.style.display = 'block';
                
                // 恢复缩放比例
                if (data.scale) {
                    state.scale = data.scale;
                }
                
                // 加载标注点
                if (data.points) {
                    state.points = data.points;
                    updatePointList();
                }
                
                // 加载尺寸链方向
                if (data.direction) {
                    state.chainDirection = data.direction;
                    updateDirectionButtons();
                }
                
                // 加载标注模式
                if (data.currentMode) {
                    state.currentMode = data.currentMode;
                    updateModeButtons();
                }
                
                // 加载尺寸值
                if (data.dimensionValues) {
                    state.dimensionValues = data.dimensionValues;
                }
                
                // 加载尺寸链线条偏移量
                if (data.chainLineOffsets) {
                    state.chainLineOffsets = data.chainLineOffsets;
                }
                
                // 加载标注标签偏移量
                if (data.labelOffsets) {
                    state.labelOffsets = data.labelOffsets;
                }
                
                // 加载项目名称
                if (data.projectName) {
                    state.projectName = data.projectName;
                    const projectNameInput = document.getElementById('projectName');
                    if (projectNameInput) {
                        projectNameInput.value = data.projectName;
                    }
                }
                
                // 重绘画布
                drawCanvas();
                
                // 如果有尺寸链，重新生成输入框
                if (state.points.length > 0) {
                    generateDimensionInputs();
                    updateChainInfo();
                }
                
                alert('数据加载成功！');
            };
            img.src = data.image;
        } else {
            // 没有图像，只加载其他数据
            if (data.points) {
                state.points = data.points;
                updatePointList();
            }
            if (data.direction) {
                state.chainDirection = data.direction;
                updateDirectionButtons();
            }
            if (data.currentMode) {
                state.currentMode = data.currentMode;
                updateModeButtons();
            }
            if (data.dimensionValues) {
                state.dimensionValues = data.dimensionValues;
            }
            if (data.chainLineOffsets) {
                state.chainLineOffsets = data.chainLineOffsets;
            }
            if (data.labelOffsets) {
                state.labelOffsets = data.labelOffsets;
            }
            if (data.projectName) {
                state.projectName = data.projectName;
                const projectNameInput = document.getElementById('projectName');
                if (projectNameInput) {
                    projectNameInput.value = data.projectName;
                }
            }
            generateDimensionInputs();
            updateChainInfo();
            alert('数据加载成功！');
        }
    } catch (error) {
        alert('加载数据失败：' + error.message);
    }
}

// 启动
init();

// ==================== 帮助功能 ====================
function openHelp() {
    window.open('help.html', '_blank');
}

// ==================== 画布滚轮缩放 ====================
function handleCanvasWheelZoom(e) {
    e.preventDefault();
    
    if (!state.image) return;
    
    // 确定缩放方向
    const delta = e.deltaY > 0 ? 0.9 : 1.1; // 向下滚动缩小，向上滚动放大
    
    // 限制缩放范围
    const newScale = Math.max(0.1, Math.min(5, state.scale * delta));
    if (newScale === state.scale) return;
    
    // 更新缩放比例，画布会自动重新居中
    state.scale = newScale;
    
    // 重绘画布
    drawCanvas();
}

// 带偏移量的绘制函数
function drawCanvasWithOffset() {
    drawCanvas();
}

// 滚动到画布中心
function centerScroll() {
    const wrapper = elements.canvasWrapper;
    if (wrapper && elements.canvas) {
        const scrollLeft = (elements.canvas.width - wrapper.clientWidth) / 2;
        const scrollTop = (elements.canvas.height - wrapper.clientHeight) / 2;
        wrapper.scrollLeft = Math.max(0, scrollLeft);
        wrapper.scrollTop = Math.max(0, scrollTop);
    }
}
