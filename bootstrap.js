var WINDOW_HANDLERS = new WeakMap();
var PLUGIN_ID = "copy-citation-key@example.com";
var READER_MENU_HANDLER = null;

function install() {}

function uninstall() {}

function startup(data) {
  if (data && data.id) {
    PLUGIN_ID = data.id;
  }

  registerReaderContextMenu();

  var windows = Zotero.getMainWindows();
  for (var i = 0; i < windows.length; i++) {
    onMainWindowLoad({ window: windows[i] });
  }
}

function shutdown(data, reason) {
  unregisterReaderContextMenu();

  if (reason === APP_SHUTDOWN) {
    return;
  }

  var windows = Zotero.getMainWindows();
  for (var i = 0; i < windows.length; i++) {
    onMainWindowUnload({ window: windows[i] });
  }
}

function onMainWindowLoad(eventData) {
  var window = eventData && eventData.window;
  if (!window || WINDOW_HANDLERS.has(window)) {
    return;
  }

  var handler = function (event) {
    if (!isCopyShortcut(event)) {
      return;
    }

    if (isReaderTabActive(window)) {
      return;
    }

    if (!isItemsTreeFocused(window, event)) {
      return;
    }

    if (isEditableTarget(window, event.target)) {
      return;
    }

    if (hasSelectedText(window, event)) {
      return;
    }

    var selectedItems = getSelectedItems(window);
    if (!selectedItems.length) {
      return;
    }

    var citationKeys = [];
    for (var i = 0; i < selectedItems.length; i++) {
      var key = getCitationKey(selectedItems[i]);
      if (key) {
        citationKeys.push(key);
      }
    }

    if (!citationKeys.length) {
      return;
    }

    var copiedText = citationKeys.join(", ");
    copyToClipboard(copiedText);
    showCopyNotification(window, copiedText, citationKeys.length);

    event.preventDefault();
    event.stopPropagation();
  };

  window.addEventListener("keydown", handler, true);
  WINDOW_HANDLERS.set(window, handler);
}

function onMainWindowUnload(eventData) {
  var window = eventData && eventData.window;
  var handler = WINDOW_HANDLERS.get(window);
  if (!handler) {
    return;
  }

  window.removeEventListener("keydown", handler, true);
  WINDOW_HANDLERS.delete(window);
}

function isCopyShortcut(event) {
  if (!event || event.defaultPrevented || event.repeat) {
    return false;
  }

  if (!event.key || event.key.toLowerCase() !== "c") {
    return false;
  }

  var commandPressed = Zotero.isMac ? event.metaKey : event.ctrlKey;
  if (!commandPressed) {
    return false;
  }

  if (event.altKey || event.shiftKey) {
    return false;
  }

  return true;
}

function isReaderTabActive(window) {
  try {
    var tabs = window && window.Zotero_Tabs;
    return !!(tabs && tabs.selectedType === "reader");
  }
  catch (error) {
    Zotero.debug("Copy Citation Key: reader tab check failed: " + error);
    return false;
  }
}

function isEditableTarget(window, target) {
  if (!target || !window) {
    return false;
  }

  var activeElement = window.document && window.document.activeElement;
  if (activeElement && activeElement.isContentEditable) {
    return true;
  }

  var element = target;
  while (element) {
    if (element.isContentEditable) {
      return true;
    }

    var tagName = element.localName ? element.localName.toLowerCase() : "";
    if (tagName === "textarea" || tagName === "html:textarea") {
      return true;
    }

    if (tagName === "input" || tagName === "html:input") {
      return true;
    }

    if (tagName === "textbox") {
      return true;
    }

    element = element.parentElement;
  }

  return false;
}

function isItemsTreeFocused(window, event) {
  try {
    var tabs = window && window.Zotero_Tabs;
    if (tabs && tabs.selectedType !== "library") {
      return false;
    }

    var pane = window && window.ZoteroPane;
    var itemsView = pane && pane.itemsView;
    var itemsRoot = itemsView && itemsView.domEl;
    if (!itemsRoot || typeof itemsRoot.contains !== "function") {
      return false;
    }

    if (event && event.target && itemsRoot.contains(event.target)) {
      return true;
    }

    var activeElement = window.document && window.document.activeElement;
    if (activeElement && itemsRoot.contains(activeElement)) {
      return true;
    }
  }
  catch (error) {
    Zotero.debug("Copy Citation Key: items tree focus check failed: " + error);
  }

  return false;
}

function hasSelectedText(window, event) {
  try {
    var focusedWindow = null;
    if (window.document
      && window.document.commandDispatcher
      && window.document.commandDispatcher.focusedWindow) {
      focusedWindow = window.document.commandDispatcher.focusedWindow;
    }

    if (selectionHasText(focusedWindow)) {
      return true;
    }

    var ownerDocument = event && event.target && event.target.ownerDocument;
    if (ownerDocument && selectionHasText(ownerDocument.defaultView)) {
      return true;
    }

    if (selectionHasText(window)) {
      return true;
    }
  }
  catch (error) {
    Zotero.debug("Copy Citation Key: text selection check failed: " + error);
  }

  return false;
}

function selectionHasText(targetWindow) {
  if (!targetWindow || typeof targetWindow.getSelection !== "function") {
    return false;
  }

  var selection = targetWindow.getSelection();
  if (!selection || selection.isCollapsed) {
    return false;
  }

  var text = selection.toString();
  return !!(text && text.trim());
}

function getSelectedItems(window) {
  try {
    var pane = window.ZoteroPane;
    if (!pane || typeof pane.getSelectedItems !== "function") {
      return [];
    }
    var items = pane.getSelectedItems();
    if (!Array.isArray(items)) {
      return [];
    }
    return items;
  }
  catch (error) {
    Zotero.debug("Copy Citation Key: failed to get selected items: " + error);
    return [];
  }
}

function getCitationKey(item) {
  try {
    if (item && typeof item.getField === "function") {
      var directField = item.getField("citationKey");
      if (directField) {
        return String(directField).trim();
      }
    }
  }
  catch (error) {
    Zotero.debug("Copy Citation Key: citationKey field lookup failed: " + error);
  }

  try {
    if (item && typeof item.getField === "function") {
      var extra = item.getField("extra") || "";
      var extraKey = parseCitationKeyFromExtra(extra);
      if (extraKey) {
        return extraKey;
      }
    }
  }
  catch (error) {
    Zotero.debug("Copy Citation Key: Extra field lookup failed: " + error);
  }

  return (item && item.key) ? item.key : "";
}

function parseCitationKeyFromExtra(extra) {
  if (!extra) {
    return "";
  }

  var lines = String(extra).split(/\r?\n/);
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    var match = line.match(/^\s*(Citation Key|BibTeX Citation Key)\s*:\s*(.+?)\s*$/i);
    if (match && match[2]) {
      return match[2].trim();
    }
  }

  return "";
}

function copyToClipboard(text) {
  Cc["@mozilla.org/widget/clipboardhelper;1"]
    .getService(Ci.nsIClipboardHelper)
    .copyString(text);
}

function showCopyNotification(window, copiedText, count) {
  try {
    var progressWin = new Zotero.ProgressWindow({
      window: window,
      closeOnClick: true
    });
    var headline = count > 1 ? "Citation keys copied" : "Citation key copied";
    progressWin.changeHeadline(headline);
    progressWin.addLines(copiedText, null);
    progressWin.show();
    progressWin.startCloseTimer(3500);
  }
  catch (error) {
    Zotero.debug("Copy Citation Key: failed to show notification popup: " + error);
  }
}

function registerReaderContextMenu() {
  if (!Zotero.Reader || typeof Zotero.Reader.registerEventListener !== "function") {
    return;
  }

  if (READER_MENU_HANDLER) {
    return;
  }

  READER_MENU_HANDLER = function (event) {
    var reader = event && event.reader;
    var append = event && event.append;
    if (!reader || typeof append !== "function") {
      return;
    }

    append({
      label: "Copy Citation Key",
      onCommand: function () {
        copyCitationKeyFromReader(reader);
      }
    });
  };

  Zotero.Reader.registerEventListener(
    "createViewContextMenu",
    READER_MENU_HANDLER,
    PLUGIN_ID
  );
}

function unregisterReaderContextMenu() {
  if (!READER_MENU_HANDLER) {
    return;
  }

  if (Zotero.Reader && typeof Zotero.Reader.unregisterEventListener === "function") {
    Zotero.Reader.unregisterEventListener("createViewContextMenu", READER_MENU_HANDLER);
  }

  READER_MENU_HANDLER = null;
}

function copyCitationKeyFromReader(reader) {
  try {
    var itemID = reader.itemID || (reader._item && reader._item.id);
    if (!itemID) {
      return;
    }

    var item = Zotero.Items.get(itemID);
    if (!item) {
      return;
    }

    var sourceItem = item;
    if (item.parentItemID) {
      var parentItem = Zotero.Items.get(item.parentItemID);
      if (parentItem) {
        sourceItem = parentItem;
      }
    }

    var citationKey = getCitationKey(sourceItem);
    if (!citationKey) {
      return;
    }

    copyToClipboard(citationKey);
    showCopyNotification(reader._window || Zotero.getMainWindow(), citationKey, 1);
  }
  catch (error) {
    Zotero.debug("Copy Citation Key: reader context menu copy failed: " + error);
  }
}