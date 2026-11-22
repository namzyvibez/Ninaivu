function updateClock() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");

    document.getElementById("clock").textContent = `${hours}:${minutes}`;
}
updateClock();
setInterval(updateClock, 1000);

/*
For every app:
1. desktop-icon with data-app="app-name"
2. window with data-app="app-name"
3. dock-item is created automatically when opened.
*/

const desktopIcons = document.querySelectorAll(".desktop-icon");
const windows = document.querySelectorAll(".window");
const dock = document.querySelector(".dock");

let topWindowZ = 10;

function getAppWindow(appName) {
    return document.querySelector(`.window[data-app="${appName}"]`);
}
function getAppDockItem(appName) {
    return document.querySelector(`.dock-item[data-app="${appName}"]`);
}
function getAppIcon(appName) {
    return document.querySelector(`.desktop-icon[data-app="${appName}"]`);
}

/*--- create dock item ---*/
function createDockItem(appName) {
    let dockItem = getAppDockItem(appName);
    if (dockItem) return dockItem;

    dockItem = document.createElement("div");
    dockItem.classList.add("dock-item");
    dockItem.dataset.app = appName;

    if (appName === "ninaivu") {
        dockItem.innerHTML = `<span class="ninaivu-mark">✦</span>`;
    } else {
        const desktopIcon = getAppIcon(appName);
        if (!desktopIcon) return null;

        const iconSymbol = desktopIcon.querySelector(".desktop-icon-symbol");
        if (iconSymbol) dockItem.innerHTML = iconSymbol.innerHTML;
    }

    dock.appendChild(dockItem);
    setupDockItem(dockItem);
    return dockItem;
}

function focusWindow(windowElement) {
    topWindowZ += 1;
    windowElement.style.zIndex = topWindowZ;
}

/*--- open ---*/
function openApp(appName) {
    const windowElement = getAppWindow(appName);
    if (!windowElement) return;

    windowElement.style.display = "block";
    windowElement.classList.remove("minimized");

    const dockItem = createDockItem(appName);
    if (dockItem) dockItem.classList.add("app-open");

    focusWindow(windowElement);
}

/*--- close ---*/
function closeApp(appName) {
    const windowElement = getAppWindow(appName);
    const dockItem = getAppDockItem(appName);
    if (!windowElement) return;

    windowElement.style.display = "none";
    windowElement.classList.remove("minimized", "maximized");

    if (dockItem) dockItem.remove();
}

/*--- minimize ---*/
function minimizeApp(appName) {
    const windowElement = getAppWindow(appName);
    if (windowElement) windowElement.classList.add("minimized");
}

/*--- restore ---*/
function restoreApp(appName) {
    const windowElement = getAppWindow(appName);
    if (!windowElement) return;

    windowElement.style.display = "block";
    windowElement.classList.remove("minimized");
    focusWindow(windowElement);
}

/*--- maximize ---*/
/*---function toggleMaximize(appName) {
    const windowElement = getAppWindow(appName);
    if (!windowElement) return;

    windowElement.classList.remove("minimized");
    windowElement.classList.toggle("maximized");
    focusWindow(windowElement);
}---*/


function toggleMaximize(appName) {
    const windowElement = getAppWindow(appName);
    if (!windowElement) return;

    windowElement.classList.remove("minimized");

    if (!windowElement.classList.contains("maximized")) {

        // Save the window's current geometry
        windowElement.dataset.previousLeft = windowElement.style.left;
        windowElement.dataset.previousTop = windowElement.style.top;
        windowElement.dataset.previousWidth = windowElement.style.width;
        windowElement.dataset.previousHeight = windowElement.style.height;
        windowElement.dataset.previousTransform = windowElement.style.transform;

        // Let the maximized CSS take control
        windowElement.classList.add("maximized");

        windowElement.style.left = "";
        windowElement.style.top = "";
        windowElement.style.width = "";
        windowElement.style.height = "";
        windowElement.style.transform = "";

    } else {

        // Return to normal window mode
        windowElement.classList.remove("maximized");

        // Restore the saved geometry
        windowElement.style.left = windowElement.dataset.previousLeft || "";
        windowElement.style.top = windowElement.dataset.previousTop || "";
        windowElement.style.width = windowElement.dataset.previousWidth || "";
        windowElement.style.height = windowElement.dataset.previousHeight || "";
        windowElement.style.transform = windowElement.dataset.previousTransform || "";
    }

    focusWindow(windowElement);
}


/*--- window controls ---*/
function setupWindow(windowElement) {
    const appName = windowElement.dataset.app;
    const closeButton = windowElement.querySelector(".window-control.close");
    const minimizeButton = windowElement.querySelector(".window-control.minimize");
    const maximizeButton = windowElement.querySelector(".window-control.maximize");

    closeButton.addEventListener("click", event => {
        event.stopPropagation();
        closeApp(appName);
    });
    minimizeButton.addEventListener("click", event => {
        event.stopPropagation();
        minimizeApp(appName);
    });
    maximizeButton.addEventListener("click", event => {
        event.stopPropagation();
        toggleMaximize(appName);
    });

    windowElement.addEventListener("pointerdown", () => focusWindow(windowElement));
    makeWindowDraggable(windowElement);
}
windows.forEach(setupWindow);

/*--- draggable windows (with boundary constraints) ---*/
function makeWindowDraggable(windowElement) {
    const windowBar = windowElement.querySelector(".window-bar");
    let isDragging = false;
    let offsetX = 0;
    let offsetY = 0;

    windowBar.addEventListener("pointerdown", event => {
        if (event.target.closest(".window-control")) return;
        if (windowElement.classList.contains("maximized")) return;

        // Prevent default touch behaviors (like scrolling) while dragging
        if (event.pointerType === "touch") {
            event.preventDefault(); 
        }

        const rect = windowElement.getBoundingClientRect();
        windowElement.style.left = `${rect.left}px`;
        windowElement.style.top = `${rect.top}px`;
        windowElement.style.transform = "none"; // Remove the centering transform

        offsetX = event.clientX - rect.left;
        offsetY = event.clientY - rect.top;
        isDragging = true;
        windowBar.setPointerCapture(event.pointerId);
        focusWindow(windowElement);
    });

    windowBar.addEventListener("pointermove", event => {
        if (!isDragging) return;
        
        // Tell the browser not to scroll while we are moving
        if (event.pointerType === "touch") {
            event.preventDefault();
        }

        let newLeft = event.clientX - offsetX;
        let newTop = event.clientY - offsetY;

        // Boundary constraints: Keep the window inside the screen
        const maxLeft = window.innerWidth - windowElement.offsetWidth;
        const maxTop = window.innerHeight - windowElement.offsetHeight;

        newLeft = Math.max(0, Math.min(newLeft, maxLeft));
        newTop = Math.max(0, Math.min(newTop, maxTop));

        windowElement.style.left = `${newLeft}px`;
        windowElement.style.top = `${newTop}px`;
    });

    function stopDragging(event) {
        isDragging = false;
        if (windowBar.hasPointerCapture(event.pointerId)) {
            windowBar.releasePointerCapture(event.pointerId);
        }
    }
    
    windowBar.addEventListener("pointerup", stopDragging);
    windowBar.addEventListener("pointercancel", stopDragging);
}

/*--- desktop icons ---*/

/*--- 
desktopIcons.forEach(icon => {
    const appName = icon.dataset.app;

    icon.addEventListener("click", event => {
        event.stopPropagation();
        desktopIcons.forEach(other => other.classList.remove("selected"));
        icon.classList.add("selected");
    });

    icon.addEventListener("dblclick", event => {
        event.stopPropagation();
        openApp(appName);
    });
});

---*/

/*--- desktop icons ---*/
desktopIcons.forEach(icon => {
    const appName = icon.dataset.app;

    icon.addEventListener("pointerup", event => {
        event.stopPropagation();
        event.preventDefault(); // Stops default browser behaviors

        // Touchscreen: one tap opens the app
        if (event.pointerType === "touch") {
            openApp(appName);
            return;
        }

        // Mouse or pen: select the icon
        desktopIcons.forEach(other =>
            other.classList.remove("selected")
        );

        icon.classList.add("selected");
    });

    // Mouse: double-click opens the app
    icon.addEventListener("dblclick", event => {
        event.preventDefault();
        event.stopPropagation();
        openApp(appName);
    });
});

document.addEventListener("click", () => {
    desktopIcons.forEach(icon => icon.classList.remove("selected"));
});

/*--- dock items ---*/
/*---
function setupDockItem(dockItem) {
    const appName = dockItem.dataset.app;

    dockItem.addEventListener("click", event => {
        event.stopPropagation();
        restoreApp(appName);
    });

    dockItem.addEventListener("dblclick", event => {
        event.stopPropagation();
        openApp(appName);
    });
}
---*/
function setupDockItem(dockItem) {
    const appName = dockItem.dataset.app;

    dockItem.addEventListener("click", event => {
        event.stopPropagation();
        restoreApp(appName);
    });
}

document.querySelectorAll(".dock-item").forEach(setupDockItem);

document.getElementById("ninaivu-system").addEventListener("dblclick", () => {
    openApp("ninaivu");
});
