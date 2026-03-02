var WINDOW_HANDLERS = new WeakMap();

function install() {}

function uninstall() {}

function startup() {
  var windows = Zotero.getMainWindows();
  for (var i = 0; i < windows.length; i++) {
    onMainWindowLoad({ window: windows[i] });
  }
}

function shutdown(data, reason) {
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

    if (isEditableTarget(window, event.target)) {
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
    Services.prompt.alert(
      window,
      "Citation key(s) copied",
      "Copied to clipboard:\n\n" + copiedText
    );

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