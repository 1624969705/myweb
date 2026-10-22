/**
 * 尺寸链分析工具使用说明书
 */

const { Document, Packer, Paragraph, TextRun, Header, Footer,
        AlignmentType, HeadingLevel, PageNumber, Table, TableCell, TableRow,
        WidthType, BorderStyle } = require("docx");
const fs = require("fs");

// 配色方案 - 科技蓝
const P = {
  primary: "#1A365D",
  body: "#2D3748",
  secondary: "#4A5568",
  accent: "#3182CE",
  surface: "#F7FAFC"
};
const c = (hex) => hex.replace("#", "");

// 辅助函数
function heading(text, level = HeadingLevel.HEADING_1) {
  const sizes = {
    [HeadingLevel.HEADING_1]: 32,
    [HeadingLevel.HEADING_2]: 28,
    [HeadingLevel.HEADING_3]: 24
  };
  return new Paragraph({
    heading: level,
    spacing: { before: level === HeadingLevel.HEADING_1 ? 400 : 280, after: 160 },
    children: [new TextRun({
      text,
      bold: true,
      size: sizes[level] || 24,
      color: c(P.primary),
      font: { ascii: "Calibri", eastAsia: "SimHei" }
    })]
  });
}

function body(text, options = {}) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    indent: options.noIndent ? {} : { firstLine: 480 },
    spacing: { line: 360, after: 120 },
    children: [new TextRun({
      text,
      size: 24,
      color: c(P.body),
      font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" }
    })]
  });
}

function bullet(text) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    indent: { left: 720, hanging: 360 },
    spacing: { line: 360, after: 80 },
    children: [
      new TextRun({ text: "\u2022  ", color: c(P.accent), size: 24 }),
      new TextRun({ text, size: 24, color: c(P.body), font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } })
    ]
  });
}

function note(text) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    indent: { left: 480, right: 480 },
    spacing: { line: 320, before: 160, after: 160 },
    shading: { fill: c(P.surface) },
    children: [
      new TextRun({ text: "\u3010提示\u3011", bold: true, color: c(P.accent), size: 22 }),
      new TextRun({ text: " " + text, size: 22, color: c(P.secondary), font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } })
    ]
  });
}

// 封面配置
const coverConfig = {
  title: "尺寸链分析工具",
  subtitle: "使用说明书",
  metaLines: [
    "版本：v1.0",
    "日期：2026年10月"
  ]
};

// 封面构建
function buildCover(config) {
  const { title, subtitle, metaLines } = config;
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        height: { value: 8000, rule: "exact" },
        children: [
          new TableCell({
            verticalAlign: "center",
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 200 },
                children: [new TextRun({
                  text: "\ud83d\udcd0",
                  size: 72
                })]
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 120 },
                children: [new TextRun({
                  text: title,
                  bold: true,
                  size: 56,
                  color: c(P.primary),
                  font: { ascii: "Calibri", eastAsia: "SimHei" }
                })]
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 400 },
                children: [new TextRun({
                  text: subtitle,
                  size: 36,
                  color: c(P.secondary),
                  font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" }
                })]
              }),
              ...metaLines.map(line => new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 80 },
                children: [new TextRun({
                  text: line,
                  size: 24,
                  color: c(P.secondary),
                  font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" }
                })]
              }))
            ]
          })
        ]
      })
    ]
  });
}

// 文档内容
const doc = new Document({
  styles: {
    default: {
      document: {
        run: {
          font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" },
          size: 24,
          color: c(P.body)
        },
        paragraph: { spacing: { line: 360 } }
      }
    }
  },
  sections: [
    // 封面
    {
      properties: {
        page: { margin: { top: 0, bottom: 0, left: 0, right: 0 } }
      },
      children: [buildCover(coverConfig)]
    },
    // 正文
    {
      properties: {
        page: {
          margin: { top: 1440, bottom: 1440, left: 1701, right: 1417 },
          pageNumbers: { start: 1, formatType: "decimal" }
        }
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ children: [PageNumber.CURRENT], size: 20, color: c(P.secondary) })]
            })
          ]
        })
      },
      children: [
        // 第一章 概述
        heading("\u7b2c\u4e00\u7ae0 \u6982\u8ff0", HeadingLevel.HEADING_1),
        
        heading("1.1 \u5de5\u5177\u7b80\u4ecb", HeadingLevel.HEADING_2),
        body("\u5c3a\u5bf8\u94fe\u5206\u6790\u5de5\u5177\u662f\u4e00\u6b3e\u57fa\u4e8eWeb\u7684\u5c3a\u5bf8\u94fe\u5206\u6790\u8f6f\u4ef6\uff0c\u7528\u4e8e\u8ba1\u7b97\u673a\u68b0\u96f6\u4ef6\u5c3a\u5bf8\u94fe\u7684\u5c01\u95ed\u73af\u516c\u5dee\u3002\u8be5\u5de5\u5177\u652f\u6301\u6781\u503c\u6cd5\u548c\u7edf\u8ba1\u6cd5\u4e24\u79cd\u8ba1\u7b97\u65b9\u5f0f\uff0c\u53ef\u5e2e\u52a9\u5de5\u7a0b\u5e08\u5feb\u901f\u5206\u6790\u5c3a\u5bf8\u94fe\u7684\u5408\u7406\u6027\u3002"),
        
        heading("1.2 \u4e3b\u8981\u529f\u80fd", HeadingLevel.HEADING_2),
        bullet("\u56fe\u50cf\u4e0a\u4f20\u4e0e\u6807\u6ce8\uff1a\u652f\u6301\u4e0a\u4f20\u96f6\u4ef6\u56fe\u7eb8\uff0c\u5728\u56fe\u50cf\u4e0a\u6807\u6ce8\u5c3a\u5bf8\u94fe\u70b9"),
        bullet("\u5c3a\u5bf8\u94fe\u53ef\u89c6\u5316\uff1a\u81ea\u52a8\u751f\u6210\u5c3a\u5bf8\u94fe\u56fe\u793a\uff0c\u5305\u542b\u5c3a\u5bf8\u7ebf\u548c\u65b9\u5411\u6807\u8bc6"),
        bullet("\u6781\u503c\u6cd5\u8ba1\u7b97\uff1a\u8ba1\u7b97\u5c3a\u5bf8\u94fe\u7684\u6700\u5927/\u6700\u5c0f\u6781\u9650\u503c"),
        bullet("\u7edf\u8ba1\u6cd5\u8ba1\u7b97\uff1a\u57fa\u4e8eCPK\u7684\u7edf\u8ba1\u516c\u5dee\u5206\u6790"),
        bullet("\u6570\u636e\u5bfc\u51fa\u5bfc\u5165\uff1a\u652f\u6301JSON\u683c\u5f0f\u7684\u6570\u636e\u4fdd\u5b58\u548c\u52a0\u8f7d"),
        
        heading("1.3 \u672f\u8bed\u8bf4\u660e", HeadingLevel.HEADING_2),
        body("\u5728\u4f7f\u7528\u672c\u5de5\u5177\u524d\uff0c\u8bf7\u719f\u6089\u4ee5\u4e0b\u4e13\u4e1a\u672f\u8bed\uff1a"),
        bullet("\u7ec4\u6210\u73af\uff1a\u5c3a\u5bf8\u94fe\u4e2d\u9664\u5c01\u95ed\u73af\u5916\u7684\u5176\u4ed6\u5c3a\u5bf8\uff0c\u7528\u5b57\u6bcdA\u3001B\u3001C\u2026\u8868\u793a"),
        bullet("\u589e\u73af\uff1a\u4f7f\u5c01\u95ed\u73af\u589e\u5927\u7684\u7ec4\u6210\u73af\uff0c\u5e26\u6b63\u53f7"),
        bullet("\u51cf\u73af\uff1a\u4f7f\u5c01\u95ed\u73af\u51cf\u5c0f\u7684\u7ec4\u6210\u73af\uff0c\u5e26\u8d1f\u53f7"),
        bullet("\u5c01\u95ed\u73af\uff1a\u5c3a\u5bf8\u94fe\u4e2d\u6700\u540e\u5f62\u6210\u7684\u95ed\u5408\u5c3a\u5bf8\uff0c\u7528\u5b57\u6bcdX\u8868\u793a"),
        bullet("\u516c\u79f0\u503c\uff1a\u5c3a\u5bf8\u7684\u6807\u79f0\u503c\uff0c\u5373\u7406\u8bba\u4e2d\u5fc3\u503c"),
        
        // 第二章 界面说明
        heading("\u7b2c\u4e8c\u7ae0 \u754c\u9762\u8bf4\u660e", HeadingLevel.HEADING_1),
        
        heading("2.1 \u754c\u9762\u5e03\u5c40", HeadingLevel.HEADING_2),
        body("\u5de5\u5177\u754c\u9762\u91c7\u7528\u4e09\u680f\u5f0f\u5e03\u5c40\uff1a"),
        bullet("\u5de6\u4fa7\u9762\u677f\uff1a\u56fe\u50cf\u4e0a\u4f20\u3001\u6807\u6ce8\u63a7\u5236\u3001\u6807\u6ce8\u70b9\u5217\u8868\u3001\u5c3a\u5bf8\u94fe\u4fe1\u606f"),
        bullet("\u4e2d\u95f4\u9762\u677f\uff1a\u56fe\u50cf\u9884\u89c8\u533a\uff0c\u7528\u4e8e\u663e\u793a\u96f6\u4ef6\u56fe\u7eb8\u548c\u6807\u6ce8"),
        bullet("\u53f3\u4fa7\u9762\u677f\uff1a\u5c3a\u5bf8\u4ee3\u53f7\u8f93\u5165\u3001\u8ba1\u7b97\u7ed3\u679c\u3001\u5bfc\u51fa\u529f\u80fd"),
        
        heading("2.2 \u6807\u6ce8\u6a21\u5f0f", HeadingLevel.HEADING_2),
        body("\u5728\u5de6\u4fa7\u9762\u677f\u7684\u201c\u6807\u6ce8\u6a21\u5f0f\u201d\u533a\u57df\uff0c\u53ef\u8fdb\u884c\u4ee5\u4e0b\u8bbe\u7f6e\uff1a"),
        bullet("\u94fe\u65b9\u5411\uff1a\u9009\u62e9X\u5411\u6216Y\u5411\uff0c\u9ed8\u8ba4\u4e3aX\u5411"),
        bullet("\u6807\u6ce8\u7c7b\u578b\uff1a\u9009\u62e9\u201c\u666e\u901a/\u8d77\u6b62\u201d\u6216\u201c\u8f74\u5b54\u201d"),
        
        note("\u94fe\u65b9\u5411\u51b3\u5b9a\u4e86\u5c3a\u5bf8\u94fe\u7684\u8ba1\u7b97\u65b9\u5411\u3002X\u5411\u8868\u793a\u6c34\u5e73\u65b9\u5411\u5c3a\u5bf8\uff0cY\u5411\u8868\u793a\u5782\u76f4\u65b9\u5411\u5c3a\u5bf8\u3002"),
        
        heading("2.3 \u56fe\u50cf\u9884\u89c8\u533a", HeadingLevel.HEADING_2),
        body("\u4e2d\u95f4\u9762\u677f\u7684\u56fe\u50cf\u9884\u89c8\u533a\u5305\u542b\u4ee5\u4e0b\u529f\u80fd\uff1a"),
        bullet("\u9879\u76ee\u540d\u79f0\u8f93\u5165\uff1a\u53ef\u8f93\u5165\u9879\u76ee+\u96f6\u4ef6\u540d\u79f0\uff0c\u7528\u4e8e\u5bfc\u51fa\u6587\u4ef6\u547d\u540d"),
        bullet("\u663e\u793a\u70b9\u590d\u9009\u6846\uff1a\u63a7\u5236\u662f\u5426\u663e\u793a\u6807\u6ce8\u70b9"),
        bullet("\u663e\u793a\u7ebf\u590d\u9009\u6846\uff1a\u63a7\u5236\u662f\u5426\u663e\u793a\u5c3a\u5bf8\u94fe\u8fde\u7ebf"),
        
        // 第三章 操作指南
        heading("\u7b2c\u4e09\u7ae0 \u64cd\u4f5c\u6307\u5357", HeadingLevel.HEADING_1),
        
        heading("3.1 \u57fa\u672c\u64cd\u4f5c\u6d41\u7a0b", HeadingLevel.HEADING_2),
        body("\u4f7f\u7528\u672c\u5de5\u5177\u8fdb\u884c\u5c3a\u5bf8\u94fe\u5206\u6790\u7684\u57fa\u672c\u6d41\u7a0b\u5982\u4e0b\uff1a"),
        bullet("\u7b2c\u4e00\u6b65\uff1a\u70b9\u51fb\u201c\u56fe\u50cf\u4e0a\u4f20\u201d\u533a\u57df\uff0c\u4e0a\u4f20\u96f6\u4ef6\u56fe\u7eb8\uff08\u652f\u6301PNG\u3001JPG\u683c\u5f0f\uff09"),
        bullet("\u7b2c\u4e8c\u6b65\uff1a\u9009\u62e9\u94fe\u65b9\u5411\uff08X\u5411/Y\u5411\uff09\u548c\u6807\u6ce8\u7c7b\u578b"),
        bullet("\u7b2c\u4e09\u6b65\uff1a\u5728\u56fe\u50cf\u4e0a\u70b9\u51fb\u6807\u6ce8\u5c3a\u5bf8\u94fe\u70b9\uff08\u666e\u901a\u70b9\u4eceS\u5f00\u59cb\uff0c\u5230E\u7ed3\u675f\uff09"),
        bullet("\u7b2c\u56db\u6b65\uff1a\u70b9\u51fb\u201c\u751f\u6210\u201d\u6309\u94ae\uff0c\u7cfb\u7edf\u81ea\u52a8\u751f\u6210\u5c3a\u5bf8\u4ee3\u53f7\u8f93\u5165\u533a"),
        bullet("\u7b2c\u4e94\u6b65\uff1a\u5728\u5c3a\u5bf8\u4ee3\u53f7\u533a\u8f93\u5165\u5404\u73af\u5c3a\u5bf8\u503c\u3001\u516c\u5dee\u3001CPK\u7b49\u53c2\u6570"),
        bullet("\u7b2c\u516d\u6b65\uff1a\u70b9\u51fb\u201c\u5f00\u59cb\u8ba1\u7b97\u201d\uff0c\u67e5\u770b\u6781\u503c\u6cd5\u548c\u7edf\u8ba1\u6cd5\u7ed3\u679c"),
        
        heading("3.2 \u6807\u6ce8\u70b9\u8bf4\u660e", HeadingLevel.HEADING_2),
        body("\u672c\u5de5\u5177\u652f\u6301\u4e24\u79cd\u7c7b\u578b\u7684\u6807\u6ce8\u70b9\uff1a"),
        bullet("\u666e\u901a\u70b9\uff08\u8d77\u6b62\u70b9\uff09\uff1a\u7528\u4e8e\u6807\u6ce8\u5c3a\u5bf8\u94fe\u7684\u8d77\u70b9\u548c\u7ec8\u70b9\uff0c\u7b2c\u4e00\u4e2a\u70b9\u6807\u8bb0\u4e3aS\uff0c\u6700\u540e\u4e00\u4e2a\u70b9\u6807\u8bb0\u4e3aE\uff0c\u4e2d\u95f4\u70b9\u4f9d\u6b21\u4e3a2\u30013\u30014\u2026"),
        bullet("\u8f74\u5b54\u70b9\uff1a\u7528\u4e8e\u6807\u6ce8\u8f74\u5b54\u914d\u5408\u4f4d\u7f6e\uff0c\u72ec\u7acb\u4ece1\u5f00\u59cb\u7f16\u53f7\uff0c\u663e\u793a\u201c\u8f74\u201d\u6807\u8bc6"),
        
        note("\u666e\u901a\u70b9\u548c\u8f74\u5b54\u70b9\u7684\u7f16\u53f7\u76f8\u4e92\u72ec\u7acb\uff0c\u4fbf\u4e8e\u533a\u5206\u4e0d\u540c\u7c7b\u578b\u7684\u6807\u6ce8\u3002"),
        
        heading("3.3 \u5c3a\u5bf8\u4ee3\u53f7\u8f93\u5165", HeadingLevel.HEADING_2),
        body("\u5728\u53f3\u4fa7\u9762\u677f\u7684\u201c\u5c3a\u5bf8\u4ee3\u53f7\u201d\u533a\u57df\uff0c\u9700\u8981\u8f93\u5165\u4ee5\u4e0b\u4fe1\u606f\uff1a"),
        bullet("\u57fa\u672c\u5c3a\u5bf8\uff1a\u8be5\u73af\u7684\u6807\u79f0\u5c3a\u5bf8\u503c\uff08\u8f93\u5165\u6b63\u503c\uff0c\u7cfb\u7edf\u81ea\u52a8\u6839\u636e\u589e/\u51cf\u5224\u65ad\u7b26\u53f7\uff09"),
        bullet("\u516c\u5dee\uff1a\u8be5\u5c3a\u5bf8\u7684\u5141\u8bb8\u504f\u5dee\u8303\u56f4"),
        bullet("CPK\uff1a\u8fc7\u7a0b\u80fd\u529b\u6307\u6570\uff0c\u7528\u4e8e\u7edf\u8ba1\u6cd5\u8ba1\u7b97\uff0c\u9ed8\u8ba4\u503c\u4e3a1"),
        bullet("\u5907\u6ce8\uff1a\u5c3a\u5bf8\u540d\u79f0\uff0c\u5982\u201c\u5de6\u7aef\u9762\u201d\u3001\u201c\u53f3\u7aef\u9762\u201d\u7b49"),
        
        body("\u5bf9\u4e8e\u8f74\u5b54\u914d\u5408\uff0c\u8fd8\u9700\u8f93\u5165\uff1a"),
        bullet("\u5b54\u5f84\uff08D1\u3001D2\u2026\uff09\u548c\u8f74\u5f84\uff08d1\u3001d2\u2026\uff09"),
        bullet("\u662f\u5426\u6709\u5229\uff1a\u9009\u62e9\u662f\u5426\u4e3a\u6709\u5229\u914d\u5408"),
        bullet("\u5b54\u5907\u6ce8\u548c\u8f74\u5907\u6ce8\uff1a\u5206\u522b\u6807\u6ce8\u5b54\u548c\u8f74\u7684\u540d\u79f0"),
        
        // 第四章 计算方法
        heading("\u7b2c\u56db\u7ae0 \u8ba1\u7b97\u65b9\u6cd5", HeadingLevel.HEADING_1),
        
        heading("4.1 \u6781\u503c\u6cd5", HeadingLevel.HEADING_2),
        body("\u6781\u503c\u6cd5\u662f\u5c3a\u5bf8\u94fe\u8ba1\u7b97\u7684\u57fa\u672c\u65b9\u6cd5\uff0c\u5047\u8bbe\u6240\u6709\u7ec4\u6210\u73af\u540c\u65f6\u8fbe\u5230\u6781\u9650\u5c3a\u5bf8\u3002"),
        body("\u8ba1\u7b97\u516c\u5f0f\uff1a"),
        bullet("\u516c\u79f0\u503c = \u589e\u73af\u4ee3\u6570\u548c - \u51cf\u73af\u4ee3\u6570\u548c"),
        bullet("\u603b\u516c\u5dee = \u6240\u6709\u7ec4\u6210\u73af\u516c\u5dee\u4e4b\u548c + \u8f74\u5b54\u516c\u5dee/2"),
        bullet("\u5de6\u6781\u9650 = \u516c\u79f0\u503c - \u603b\u516c\u5dee - \u7d2f\u79ef\u504f\u79fb"),
        bullet("\u53f3\u6781\u9650 = \u516c\u79f0\u503c + \u603b\u516c\u5dee + \u7d2f\u79ef\u504f\u79fb"),
        
        heading("4.2 \u7edf\u8ba1\u6cd5", HeadingLevel.HEADING_2),
        body("\u7edf\u8ba1\u6cd5\u57fa\u4e8e\u7edf\u8ba1\u5b66\u539f\u7406\uff0c\u8003\u8651\u4e86\u5c3a\u5bf8\u7684\u5206\u5e03\u7279\u6027\u548cCPK\u503c\u3002"),
        body("\u8ba1\u7b97\u6b65\u9aa4\uff1a"),
        bullet("\u8ba1\u7b97\u5355\u65b9\u5dee\uff1a(\u516c\u5dee / (3\u00d7CPK))\u00b2"),
        bullet("\u8ba1\u7b97\u6574\u4f53\u65b9\u5dee\uff1a\u6240\u6709\u5355\u65b9\u5dee\u4e4b\u548c\u7684\u5e73\u65b9\u6839"),
        bullet("\u6700\u7ec8\u516c\u5dee = 4.5 \u00d7 \u6574\u4f53\u65b9\u5dee"),
        
        // 第五章 数据管理
        heading("\u7b2c\u4e94\u7ae0 \u6570\u636e\u7ba1\u7406", HeadingLevel.HEADING_1),
        
        heading("5.1 \u5bfc\u51fa\u6570\u636e", HeadingLevel.HEADING_2),
        body("\u70b9\u51fb\u53f3\u4fa7\u9762\u677f\u7684\u201c\u5bfc\u51fa\u6570\u636e\u201d\u6309\u94ae\uff0c\u53ef\u5c06\u5f53\u524d\u5206\u6790\u7ed3\u679c\u4fdd\u5b58\u4e3aJSON\u6587\u4ef6\u3002"),
        body("\u6587\u4ef6\u547d\u540d\u89c4\u5219\uff1a\u9879\u76ee\u540d\u79f0_\u94fe\u65b9\u5411.json"),
        body("\u5bfc\u51fa\u5185\u5bb9\u5305\u62ec\uff1a"),
        bullet("\u9879\u76ee\u540d\u79f0"),
        bullet("\u56fe\u50cf\u6570\u636e\uff08Base64\u7f16\u7801\uff09"),
        bullet("\u6807\u6ce8\u70b9\u5750\u6807\u548c\u7c7b\u578b"),
        bullet("\u5c3a\u5bf8\u94fe\u65b9\u5411"),
        bullet("\u6240\u6709\u5c3a\u5bf8\u4ee3\u53f7\u7684\u503c\u3001\u516c\u5dee\u3001CPK\u3001\u5907\u6ce8\u7b49"),
        
        heading("5.2 \u5bfc\u5165\u6570\u636e", HeadingLevel.HEADING_2),
        body("\u70b9\u51fb\u5de6\u4fa7\u9762\u677f\u7684\u201c\u52a0\u8f7d\u6570\u636e\u201d\u533a\u57df\uff0c\u9009\u62e9\u4e4b\u524d\u5bfc\u51fa\u7684JSON\u6587\u4ef6\uff0c\u53ef\u6062\u590d\u4e4b\u524d\u7684\u5206\u6790\u72b6\u6001\u3002"),
        
        note("\u5bfc\u5165\u6570\u636e\u65f6\uff0c\u7cfb\u7edf\u4f1a\u81ea\u52a8\u6062\u590d\u56fe\u50cf\u3001\u6807\u6ce8\u70b9\u3001\u5c3a\u5bf8\u503c\u7b49\u6240\u6709\u4fe1\u606f\uff0c\u65b9\u4fbf\u7528\u6237\u7ee7\u7eed\u4e4b\u524d\u7684\u5de5\u4f5c\u3002"),
        
        heading("5.3 \u5bfc\u51fa\u56fe\u50cf", HeadingLevel.HEADING_2),
        body("\u70b9\u51fb\u201c\u5bfc\u51fa\u56fe\u50cf\u201d\u6309\u94ae\uff0c\u53ef\u5c06\u5f53\u524d\u56fe\u50cf\u9884\u89c8\u533a\u7684\u5185\u5bb9\uff08\u5305\u542b\u6807\u6ce8\u70b9\u548c\u5c3a\u5bf8\u7ebf\uff09\u4fdd\u5b58\u4e3aPNG\u683c\u5f0f\u7684\u56fe\u7247\u3002"),
        
        // 第六章 注意事项
        heading("\u7b2c\u516d\u7ae0 \u6ce8\u610f\u4e8b\u9879", HeadingLevel.HEADING_1),
        
        heading("6.1 \u8f93\u5165\u89c4\u8303", HeadingLevel.HEADING_2),
        bullet("\u5c3a\u5bf8\u503c\u8bf7\u8f93\u5165\u6b63\u503c\uff0c\u7cfb\u7edf\u4f1a\u6839\u636e\u589e/\u51cf\u73af\u5c5e\u6027\u81ea\u52a8\u5224\u65ad\u6b63\u8d1f\u53f7"),
        bullet("\u5982\u679c\u67d0\u4e2a\u5c3a\u5bf8\u8f93\u5165\u4e3a0\uff0c\u7cfb\u7edf\u4f1a\u81ea\u52a8\u8ba1\u7b97\u5750\u6807\u8ddd\u79bb\u4f5c\u4e3a\u9ed8\u8ba4\u503c"),
        bullet("CPK\u503c\u9ed8\u8ba4\u4e3a1\uff0c\u53ef\u6839\u636e\u5b9e\u9645\u5de5\u827a\u80fd\u529b\u8c03\u6574"),
        
        heading("6.2 \u8ba1\u7b97\u8bf4\u660e", HeadingLevel.HEADING_2),
        bullet("\u8f74\u5b54\u914d\u5408\u7684\u516c\u5dee\u8ba1\u7b97\uff1a\u5b54\u516c\u5dee + \u8f74\u516c\u5dee"),
        bullet("\u8f74\u5b54\u95f4\u9699\u5bf9\u5c01\u95ed\u73af\u7684\u5f71\u54cd\uff1a\u6709\u5229\u914d\u5408\u589e\u52a0\u5c01\u95ed\u73af\uff0c\u4e0d\u5229\u914d\u5408\u51cf\u5c0f\u5c01\u95ed\u73af"),
        bullet("\u7d2f\u79ef\u504f\u79fb\u662f\u8f74\u5b54\u95f4\u9699\u5bf9\u5c01\u95ed\u73af\u7684\u7d2f\u79ef\u5f71\u54cd"),
        
        heading("6.3 \u5176\u4ed6\u63d0\u793a", HeadingLevel.HEADING_2),
        bullet("\u5efa\u8bae\u5728\u5f00\u59cb\u5206\u6790\u524d\u5148\u8f93\u5165\u9879\u76ee\u540d\u79f0\uff0c\u4fbf\u4e8e\u6587\u4ef6\u7ba1\u7406"),
        bullet("\u6807\u6ce8\u70b9\u53ef\u4ee5\u62d6\u52a8\u8c03\u6574\u4f4d\u7f6e\uff0c\u65b9\u4fbf\u5bf9\u9f50\u56fe\u7eb8"),
        bullet("\u4f7f\u7528\u201c\u6e05\u7a7a\u201d\u6309\u94ae\u4f1a\u6e05\u9664\u6240\u6709\u6807\u6ce8\u70b9\u548c\u6570\u636e\uff0c\u8bf7\u8c28\u614e\u64cd\u4f5c"),
        
        // 附录
        heading("\u9644\u5f55 \u5e38\u89c1\u95ee\u9898", HeadingLevel.HEADING_1),
        
        body("Q1\uff1a\u4e3a\u4ec0\u4e48\u6211\u8f93\u5165\u7684\u5c3a\u5bf8\u503c\u4e3a0\u65f6\uff0c\u7cfb\u7edf\u663e\u793a\u7684\u662f\u5750\u6807\u8ddd\u79bb\uff1f"),
        body("A1\uff1a\u8fd9\u662f\u6b63\u5e38\u8bbe\u8ba1\u3002\u5f53\u7528\u6237\u672a\u8f93\u5165\u5c3a\u5bf8\u503c\u65f6\uff0c\u7cfb\u7edf\u4f1a\u81ea\u52a8\u8ba1\u7b97\u4e24\u70b9\u4e4b\u95f4\u7684\u5750\u6807\u8ddd\u79bb\u4f5c\u4e3a\u9ed8\u8ba4\u503c\u3002\u5982\u679c\u9700\u8981\u771f\u6b63\u8f93\u51650\uff0c\u8bf7\u76f4\u63a5\u8f93\u51650\u5373\u53ef\u3002"),
        
        body("Q2\uff1a\u5982\u4f55\u5224\u65ad\u67d0\u4e2a\u5c3a\u5bf8\u662f\u589e\u73af\u8fd8\u662f\u51cf\u73af\uff1f"),
        body("A2\uff1a\u7cfb\u7edf\u4f1a\u6839\u636e\u6807\u6ce8\u70b9\u7684\u5750\u6807\u5173\u7cfb\u81ea\u52a8\u5224\u65ad\u3002X\u5411\u65f6\uff0c\u5411\u53f3\u4e3a\u589e\u73af\uff08+\uff09\uff0c\u5411\u5de6\u4e3a\u51cf\u73af\uff08-\uff09\uff1bY\u5411\u65f6\uff0c\u5411\u4e0b\u4e3a\u589e\u73af\uff08+\uff09\uff0c\u5411\u4e0a\u4e3a\u51cf\u73af\uff08-\uff09\u3002\u5728\u5c3a\u5bf8\u4ee3\u53f7\u8f93\u5165\u533a\u53ef\u770b\u5230\u6bcf\u4e2a\u5c3a\u5bf8\u7684\u6b63\u8d1f\u53f7\u6807\u8bc6\u3002"),
        
        body("Q3\uff1a\u4ec0\u4e48\u662f\u201c\u662f\u5426\u6709\u5229\u201d\uff1f"),
        body("A3\uff1a\u5728\u8f74\u5b54\u914d\u5408\u4e2d\uff0c\u5982\u679c\u95f4\u9699\u914d\u5408\u589e\u52a0\u5c01\u95ed\u73af\u5c3a\u5bf8\uff0c\u5219\u4e3a\u201c\u6709\u5229\u201d\uff1b\u5982\u679c\u8fc7\u76c8\u914d\u5408\u51cf\u5c0f\u5c01\u95ed\u73af\u5c3a\u5bf8\uff0c\u5219\u4e3a\u201c\u4e0d\u5229\u201d\u3002"),
        
        body("Q4\uff1a\u5982\u4f55\u4fee\u6539\u5df2\u6807\u6ce8\u7684\u70b9\u7684\u4f4d\u7f6e\uff1f"),
        body("A4\uff1a\u5728\u56fe\u50cf\u9884\u89c8\u533a\uff0c\u9f20\u6807\u62d6\u52a8\u5df2\u6807\u6ce8\u7684\u70b9\u5373\u53ef\u8c03\u6574\u5176\u4f4d\u7f6e\u3002\u70b9\u51fb\u6807\u6ce8\u70b9\u5217\u8868\u4e2d\u7684\u201c\u5220\u9664\u201d\u6309\u94ae\u53ef\u5220\u9664\u8be5\u70b9\u3002")
      ]
    }
  ]
});

// 生成文档
Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync("C:\\Users\\003100CE\\ZCodeProject\\tolerance_chain_web\\尺寸链分析工具使用说明书.docx", buf);
  console.log("使用说明书已生成！");
});
