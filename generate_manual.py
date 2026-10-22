#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
尺寸链分析工具使用说明书生成脚本
"""

from docx import Document
from docx.shared import Inches, Pt, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_LINE_SPACING
from docx.enum.style import WD_STYLE_TYPE

def set_chinese_font(run, font_name='微软雅黑', font_size=12, bold=False, color=None):
    """设置中文字体"""
    run.font.name = font_name
    run._element.rPr.rFonts.set(docx.oxml.ns.qn('w:eastAsia'), font_name)
    run.font.size = Pt(font_size)
    run.font.bold = bold
    if color:
        run.font.color.rgb = RGBColor(*color)

def add_heading(doc, text, level=1):
    """添加标题"""
    heading = doc.add_heading(level=level)
    run = heading.add_run(text)
    
    colors = {
        1: (26, 54, 93),    # 深蓝
        2: (45, 55, 72),    # 深灰
        3: (74, 85, 104)   # 中灰
    }
    
    font_sizes = {1: 16, 2: 14, 3: 12}
    
    set_chinese_font(run, '黑体', font_sizes.get(level, 12), bold=True, color=colors.get(level, (0,0,0)))
    heading.alignment = WD_ALIGN_PARAGRAPH.LEFT
    return heading

def add_paragraph(doc, text, indent=True, bold=False, color=None):
    """添加正文段落"""
    p = doc.add_paragraph()
    run = p.add_run(text)
    set_chinese_font(run, '微软雅黑', 12, bold=bold, color=color)
    
    if indent:
        p.paragraph_format.first_line_indent = Cm(0.74)  # 首行缩进2字符
    p.paragraph_format.line_spacing = 1.5
    p.paragraph_format.space_after = Pt(6)
    return p

def add_bullet(doc, text):
    """添加项目符号"""
    p = doc.add_paragraph(style='List Bullet')
    run = p.add_run(text)
    set_chinese_font(run, '微软雅黑', 12)
    p.paragraph_format.line_spacing = 1.5
    p.paragraph_format.left_indent = Cm(0.74)
    return p

def add_note(doc, text):
    """添加提示框"""
    p = doc.add_paragraph()
    p.paragraph_format.left_indent = Cm(0.5)
    p.paragraph_format.right_indent = Cm(0.5)
    p.paragraph_format.space_before = Pt(6)
    p.paragraph_format.space_after = Pt(6)
    
    run1 = p.add_run('【提示】')
    set_chinese_font(run1, '微软雅黑', 11, bold=True, color=(49, 130, 206))
    
    run2 = p.add_run(' ' + text)
    set_chinese_font(run2, '微软雅黑', 11, color=(107, 114, 128))

def add_cover(doc):
    """添加封面"""
    # 添加空行
    for _ in range(8):
        doc.add_paragraph()
    
    # 图标
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = p.add_run('📐')
    run.font.size = Pt(72)
    
    # 标题
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = p.add_run('尺寸链分析工具')
    set_chinese_font(run, '黑体', 28, bold=True, color=(26, 54, 93))
    
    # 副标题
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = p.add_run('使用说明书')
    set_chinese_font(run, '微软雅黑', 18, color=(74, 85, 104))
    
    # 空行
    for _ in range(4):
        doc.add_paragraph()
    
    # 版本信息
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = p.add_run('版本：v1.0')
    set_chinese_font(run, '微软雅黑', 12, color=(107, 114, 128))
    
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = p.add_run('日期：2026年10月')
    set_chinese_font(run, '微软雅黑', 12, color=(107, 114, 128))
    
    # 分页
    doc.add_page_break()

def main():
    # 创建文档
    doc = Document()
    
    # 设置默认字体
    style = doc.styles['Normal']
    style.font.name = '微软雅黑'
    style._element.rPr.rFonts.set(docx.oxml.ns.qn('w:eastAsia'), '微软雅黑')
    style.font.size = Pt(12)
    
    # 添加封面
    add_cover(doc)
    
    # 第一章 概述
    add_heading(doc, '第一章 概述', 1)
    
    add_heading(doc, '1.1 工具简介', 2)
    add_paragraph(doc, '尺寸链分析工具是一款基于Web的尺寸链分析软件，用于计算机械零件尺寸链的封闭环公差。该工具支持极值法和统计法两种计算方式，可帮助工程师快速分析尺寸链的合理性。')
    
    add_heading(doc, '1.2 主要功能', 2)
    add_bullet(doc, '图像上传与标注：支持上传零件图纸，在图像上标注尺寸链点')
    add_bullet(doc, '尺寸链可视化：自动生成尺寸链图示，包含尺寸线和方向标识')
    add_bullet(doc, '极值法计算：计算尺寸链的最大/最小极限值')
    add_bullet(doc, '统计法计算：基于CPK的统计公差分析')
    add_bullet(doc, '数据导出导入：支持JSON格式的数据保存和加载')
    
    add_heading(doc, '1.3 术语说明', 2)
    add_paragraph(doc, '在使用本工具前，请熟悉以下专业术语：')
    add_bullet(doc, '组成环：尺寸链中除封闭环外的其他尺寸，用字母A、B、C…表示')
    add_bullet(doc, '增环：使封闭环增大的组成环，带正号')
    add_bullet(doc, '减环：使封闭环减小的组成环，带负号')
    add_bullet(doc, '封闭环：尺寸链中最后形成的闭合尺寸，用字母X表示')
    add_bullet(doc, '公称值：尺寸的标称值，即理论中心值')
    
    # 第二章 界面说明
    add_heading(doc, '第二章 界面说明', 1)
    
    add_heading(doc, '2.1 界面布局', 2)
    add_paragraph(doc, '工具界面采用三栏式布局：')
    add_bullet(doc, '左侧面板：图像上传、标注控制、标注点列表、尺寸链信息')
    add_bullet(doc, '中间面板：图像预览区，用于显示零件图纸和标注')
    add_bullet(doc, '右侧面板：尺寸代号输入、计算结果、导出功能')
    
    add_heading(doc, '2.2 标注模式', 2)
    add_paragraph(doc, '在左侧面板的"标注模式"区域，可进行以下设置：')
    add_bullet(doc, '链方向：选择X向或Y向，默认为X向')
    add_bullet(doc, '标注类型：选择"普通/起止"或"轴孔"')
    add_note(doc, '链方向决定了尺寸链的计算方向。X向表示水平方向尺寸，Y向表示垂直方向尺寸。')
    
    add_heading(doc, '2.3 图像预览区', 2)
    add_paragraph(doc, '中间面板的图像预览区包含以下功能：')
    add_bullet(doc, '项目名称输入：可输入项目+零件名称，用于导出文件命名')
    add_bullet(doc, '显示点复选框：控制是否显示标注点')
    add_bullet(doc, '显示线复选框：控制是否显示尺寸链连线')
    
    # 第三章 操作指南
    add_heading(doc, '第三章 操作指南', 1)
    
    add_heading(doc, '3.1 基本操作流程', 2)
    add_paragraph(doc, '使用本工具进行尺寸链分析的基本流程如下：')
    add_bullet(doc, '第一步：点击"图像上传"区域，上传零件图纸（支持PNG、JPG格式）')
    add_bullet(doc, '第二步：选择链方向（X向/Y向）和标注类型')
    add_bullet(doc, '第三步：在图像上点击标注尺寸链点（普通点从S开始，到E结束）')
    add_bullet(doc, '第四步：点击"生成"按钮，系统自动生成尺寸代号输入区')
    add_bullet(doc, '第五步：在尺寸代号区输入各环尺寸值、公差、CPK等参数')
    add_bullet(doc, '第六步：点击"开始计算"，查看极值法和统计法结果')
    
    add_heading(doc, '3.2 标注点说明', 2)
    add_paragraph(doc, '本工具支持两种类型的标注点：')
    add_bullet(doc, '普通点（起止点）：用于标注尺寸链的起点和终点，第一个点标记为S，最后一个点标记为E，中间点依次为2、3、4…')
    add_bullet(doc, '轴孔点：用于标注轴孔配合位置，独立从1开始编号，显示"轴"标识')
    add_note(doc, '普通点和轴孔点的编号相互独立，便于区分不同类型的标注。')
    
    add_heading(doc, '3.3 尺寸代号输入', 2)
    add_paragraph(doc, '在右侧面板的"尺寸代号"区域，需要输入以下信息：')
    add_bullet(doc, '基本尺寸：该环的标称尺寸值（输入正值，系统自动根据增/减判断符号）')
    add_bullet(doc, '公差：该尺寸的允许偏差范围')
    add_bullet(doc, 'CPK：过程能力指数，用于统计法计算，默认值为1')
    add_bullet(doc, '备注：尺寸名称，如"左端面"、"右端面"等')
    add_paragraph(doc, '对于轴孔配合，还需输入：')
    add_bullet(doc, '孔径（D1、D2…）和轴径（d1、d2…）')
    add_bullet(doc, '是否有利：选择是否为有利配合')
    add_bullet(doc, '孔备注和轴备注：分别标注孔和轴的名称')
    
    # 第四章 计算方法
    add_heading(doc, '第四章 计算方法', 1)
    
    add_heading(doc, '4.1 极值法', 2)
    add_paragraph(doc, '极值法是尺寸链计算的基本方法，假设所有组成环同时达到极限尺寸。')
    add_paragraph(doc, '计算公式：')
    add_bullet(doc, '公称值 = 增环代数和 - 减环代数和')
    add_bullet(doc, '总公差 = 所有组成环公差之和 + 轴孔公差/2')
    add_bullet(doc, '左极限 = 公称值 - 总公差 - 累积偏移')
    add_bullet(doc, '右极限 = 公称值 + 总公差 + 累积偏移')
    
    add_heading(doc, '4.2 统计法', 2)
    add_paragraph(doc, '统计法基于统计学原理，考虑了尺寸的分布特性和CPK值。')
    add_paragraph(doc, '计算步骤：')
    add_bullet(doc, '计算单方差：(公差 / (3×CPK))²')
    add_bullet(doc, '计算整体方差：所有单方差之和的平方根')
    add_bullet(doc, '最终公差 = 4.5 × 整体方差')
    
    # 第五章 数据管理
    add_heading(doc, '第五章 数据管理', 1)
    
    add_heading(doc, '5.1 导出数据', 2)
    add_paragraph(doc, '点击右侧面板的"导出数据"按钮，可将当前分析结果保存为JSON文件。')
    add_paragraph(doc, '文件命名规则：项目名称_链方向.json')
    add_paragraph(doc, '导出内容包括：')
    add_bullet(doc, '项目名称')
    add_bullet(doc, '图像数据（Base64编码）')
    add_bullet(doc, '标注点坐标和类型')
    add_bullet(doc, '尺寸链方向')
    add_bullet(doc, '所有尺寸代号的值、公差、CPK、备注等')
    
    add_heading(doc, '5.2 导入数据', 2)
    add_paragraph(doc, '点击左侧面板的"加载数据"区域，选择之前导出的JSON文件，可恢复之前的分析状态。')
    add_note(doc, '导入数据时，系统会自动恢复图像、标注点、尺寸值等所有信息，方便用户继续之前的工作。')
    
    add_heading(doc, '5.3 导出图像', 2)
    add_paragraph(doc, '点击"导出图像"按钮，可将当前图像预览区的内容（包含标注点和尺寸线）保存为PNG格式的图片。')
    
    # 第六章 注意事项
    add_heading(doc, '第六章 注意事项', 1)
    
    add_heading(doc, '6.1 输入规范', 2)
    add_bullet(doc, '尺寸值请输入正值，系统会根据增/减环属性自动判断正负号')
    add_bullet(doc, '如果某个尺寸输入为0，系统会自动计算坐标距离作为默认值')
    add_bullet(doc, 'CPK值默认为1，可根据实际工艺能力调整')
    
    add_heading(doc, '6.2 计算说明', 2)
    add_bullet(doc, '轴孔配合的公差计算：孔公差 + 轴公差')
    add_bullet(doc, '轴孔间隙对封闭环的影响：有利配合增加封闭环，不利配合减小封闭环')
    add_bullet(doc, '累积偏移是轴孔间隙对封闭环的累积影响')
    
    add_heading(doc, '6.3 其他提示', 2)
    add_bullet(doc, '建议在开始分析前先输入项目名称，便于文件管理')
    add_bullet(doc, '标注点可以拖动调整位置，方便对齐图纸')
    add_bullet(doc, '使用"清空"按钮会清除所有标注点和数据，请谨慎操作')
    
    # 附录
    add_heading(doc, '附录 常见问题', 1)
    
    add_paragraph(doc, 'Q1：为什么我输入的尺寸值为0时，系统显示的是坐标距离？', bold=True)
    add_paragraph(doc, 'A1：这是正常设计。当用户未输入尺寸值时，系统会自动计算两点之间的坐标距离作为默认值。如果需要真正输入0，请直接输入0即可。')
    
    add_paragraph(doc, 'Q2：如何判断某个尺寸是增环还是减环？', bold=True)
    add_paragraph(doc, 'A2：系统会根据标注点的坐标关系自动判断。X向时，向右为增环（+），向左为减环（-）；Y向时，向下为增环（+），向上为减环（-）。在尺寸代号输入区可看到每个尺寸的正负号标识。')
    
    add_paragraph(doc, 'Q3：什么是"是否有利"？', bold=True)
    add_paragraph(doc, 'A3：在轴孔配合中，如果间隙配合增加封闭环尺寸，则为"有利"；如果过盈配合减小封闭环尺寸，则为"不利"。')
    
    add_paragraph(doc, 'Q4：如何修改已标注的点的位置？', bold=True)
    add_paragraph(doc, 'A4：在图像预览区，鼠标拖动已标注的点即可调整其位置。点击标注点列表中的"删除"按钮可删除该点。')
    
    # 保存文档
    output_path = r'C:\Users\003100CE\ZCodeProject\tolerance_chain_web\尺寸链分析工具使用说明书.docx'
    doc.save(output_path)
    print(f'使用说明书已生成：{output_path}')

if __name__ == '__main__':
    main()
