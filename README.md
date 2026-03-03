# ZoteroCopyCitationKey

## 中文说明

这是一个 Zotero 7/8 插件，用于替换主条目列表中的复制行为：

- 在选中条目后按 `Cmd + C`（macOS）或 `Ctrl + C`（Windows/Linux）
- 将 citation key 复制到剪贴板
- 如果选中多个条目，则按逗号分隔复制多个 citation key
- 复制成功后显示 Zotero 原生通知浮窗（无需用户确认），并显示实际复制内容
- 在 PDF 阅读器中按复制快捷键不会触发 citation key 复制；可通过右键菜单 `Copy Citation Key` 复制当前 PDF 条目的 citation key

## 文件

- `manifest.json`
- `bootstrap.js`
- `install.rdf`

## 安装（开发模式）

1. 在当前目录打包 XPI：

	 ```bash
	 cd /Users/yifangong/Documents/ZoteroCopyCitationKey
	 zip -X -r ZoteroCopyCitationKey.xpi manifest.json bootstrap.js install.rdf README.md
	 ```

2. 打开 Zotero 7/8。
3. 进入 `Tools -> Plugins`。
4. 点击齿轮图标 -> `Install Plugin From File...`。
5. 选择 `ZoteroCopyCitationKey.xpi`。

## 行为说明

- 仅当有条目被选中，且焦点不在可编辑文本输入区域时，才会拦截复制快捷键。
- 仅在主条目列表中处理复制快捷键；Reader/PDF 场景不会拦截。
- 每个条目的 citation key 查找顺序：
	1. `citationKey` 字段
	2. `Extra` 中的 `Citation Key: ...`（或 `BibTeX Citation Key: ...`）
	3. 回退为 Zotero 条目 key

## 模板

- `template/minimal/` 保留了已验证可安装的最小模板（`manifest.json` + `bootstrap.js` + `install.rdf`）。

---

## EN

A Zotero 7/8 plugin that replaces item-copy behavior in the main items list:

- Press `Cmd + C` (macOS) or `Ctrl + C` (Windows/Linux) on selected items
- Copies citation keys to the clipboard
- If multiple items are selected, copies keys as a comma-separated list
- Shows a native Zotero non-blocking notification popup containing the copied content
- In PDF Reader, copy shortcut does not trigger citation-key copy; use the context menu item `Copy Citation Key` to copy the current PDF item's citation key

## Files

- `manifest.json`
- `bootstrap.js`
- `install.rdf`

## Install (Development)

1. In this folder, create an XPI archive:

	 ```bash
	 cd /Users/yifangong/Documents/ZoteroCopyCitationKey
	 zip -X -r ZoteroCopyCitationKey.xpi manifest.json bootstrap.js install.rdf README.md
	 ```

2. Open Zotero 7/8.
3. Go to `Tools -> Plugins`.
4. Click the gear icon -> `Install Plugin From File...`.
5. Select `ZoteroCopyCitationKey.xpi`.

## Behavior Notes

- Shortcut interception only occurs in the main items list (not in Reader/PDF) and when focus is not in an editable text field.
- Citation key lookup order per item:
	1. `citationKey` field
	2. `Citation Key: ...` (or `BibTeX Citation Key: ...`) in `Extra`
	3. Zotero item key fallback

## Template

- `template/minimal/` stores the verified installable minimal template (`manifest.json` + `bootstrap.js` + `install.rdf`).