let wmctrl;
let otherCmd;
let x11w;
let CFG;
module.exports = (passedCFG) => {
  CFG = passedCFG;
  wmctrl = require('./wmctrl')(CFG);
  otherCmd = require('./other-cmd')(CFG);
  x11w = require('./x11-wrapper')(CFG);

  return {
    // wmctrl
    closeWindow,

    // node x11
    goToFirstWorkspace,
    restoreWindowPosition,
    getWindowGeometry,

    // other cmd
    getActiveWindowList,
    getConnectedDisplaysId,
    readAndSetAdditionalMetaDataForWin,
    locate,
    startProgram,
  };
};

// WMCTRL
function closeWindow(windowId) {
  return wmctrl.closeWindow(windowId);
}

// NODE X11
function goToFirstWorkspace() {
  return x11w.goToViewport(0, 0);
}

function restoreWindowPosition(win) {
  return x11w.restoreWindowPosition(win);
}

function getWindowGeometry(winId) {
  return x11w.getWindowGeometry(winId);
}

// OTHER CMD
function getConnectedDisplaysId() {
  return otherCmd.getConnectedDisplaysId();
}

function readAndSetAdditionalMetaDataForWin(win) {
  return otherCmd.readAndSetAdditionalMetaDataForWin(win);
}

function locate(file) {
  return otherCmd.locate(file);
}

function startProgram(executableFile, desktopFilePath) {
  return otherCmd.startProgram(executableFile, desktopFilePath);
}

// MIXED
function getActiveWindowList() {
  return new Promise((fulfill, reject) => {
    return otherCmd.getActiveWindowList()
      .then((windowList) => {
        const promises = [];
        windowList.forEach((win) => {
          const promise = getWindowGeometry(win.windowId)
            .then((geo) => {
              for (let prop in geo) {
                if (geo.hasOwnProperty(prop)) {
                  win[prop] = geo[prop];
                }
              }

              // TODO order that adding of all those different properties a little better
              // add missing static properties
              win.simpleName = parseSimpleWindowName(win.wmClassName);
              win.executableFile = parseExecutableFileFromWmClassName(win.wmClassName);
            });

          promises.push(promise);
        });

        Promise.all(promises)
          .then(() => {
            fulfill(windowList);
          })
          .catch(reject);
      });
  });
}

function parseExecutableFileFromWmClassName(wmClassName) {
  const executableFile = CFG.WM_CLASS_AND_EXECUTABLE_FILE_MAP[wmClassName];
  if (executableFile) {
    return executableFile;
  } else {
    const splitValues = wmClassName.split('.');
    return splitValues[0] + '.desktop';
  }
}

function parseSimpleWindowName(wmClassName) {
  const splitValues = wmClassName.split('.');
  if (splitValues[1]) {
    return splitValues[1];
  } else {
    return wmClassName;
  }
}