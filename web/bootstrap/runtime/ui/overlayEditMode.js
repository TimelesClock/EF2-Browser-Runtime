import { escapeHtml } from "./html.js";

// Every overlay that can be repositioned/hidden from the edit-mode menu.
// posFormat "number" -> { left:number, top:number } (wave-tracker / auto-skiller / config menu style)
// posFormat "px"      -> { left:"123px", top:"45px" } (fossil-solver / session-history style)
const OVERLAY_REGISTRY = [
    { id: "ef-wave-tracker-overlay", label: "Wave Tracker", positionKey: "__EF_WAVE_TRACKER_POSITION__", posFormat: "number" },
    { id: "ef-auto-skiller-overlay", label: "Auto Skiller", positionKey: "__EF_AUTO_SKILLER_POSITION__", posFormat: "number" },
    { id: "ef-solver-overlay", label: "Fossil Solver", positionKey: "ef_solver_pos", posFormat: "px" },
    { id: "ef-session-record-overlay", label: "MPM Record", positionKey: "__EF_SESSION_OVERLAY_POS__", posFormat: "px" },
    { id: "ef-runtime-menu", label: "Config Menu", positionKey: "__EF_RUNTIME_CONFIG_POSITION__", posFormat: "number" }
];

const HIDDEN_KEY_PREFIX = "__EF_OVERLAY_HIDDEN__";
const FAB_ID = "ef-overlay-edit-fab";
const DIM_ID = "ef-overlay-edit-dim";
const PANEL_ID = "ef-overlay-edit-panel";
const HIGHLIGHT_CLASS = "ef-overlay-edit-highlight";
const FORCED_HIDDEN_CLASS = "ef-overlay-edit-forced-hidden";
const MOVE_ICON = `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="5 9 2 12 5 15"></polyline><polyline points="9 5 12 2 15 5"></polyline><polyline points="15 19 12 22 9 19"></polyline><polyline points="19 9 22 12 19 15"></polyline><line x1="2" y1="12" x2="22" y2="12"></line><line x1="12" y1="2" x2="12" y2="22"></line></svg>`;
const CHECK_ICON = `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;

function ensureStyle() {
    if (document.getElementById(`${FAB_ID}-style`)) {
        return;
    }
    const style = document.createElement("style");
    style.id = `${FAB_ID}-style`;
    style.textContent = `
#${FAB_ID} {
  position: fixed;
  right: 14px;
  bottom: 14px;
  z-index: 2147483647;
  width: 52px;
  height: 52px;
  box-sizing: border-box;
  border-radius: 50%;
  border: 1px solid rgba(255, 224, 138, 0.45);
  background: rgba(0, 0, 0, 0.72);
  color: #ffe08a;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  touch-action: none;
  pointer-events: auto;
}
#${FAB_ID}.ef-overlay-edit-fab-active {
  background: rgba(255, 224, 138, 0.22);
  border-color: rgba(255, 224, 138, 0.85);
  box-shadow: 0 0 0 4px rgba(255, 224, 138, 0.15);
}
#${FAB_ID}.ef-overlay-edit-fab-save {
  background: rgba(120, 255, 160, 0.20);
  border-color: rgba(150, 255, 180, 0.85);
  color: #aaffc4;
  box-shadow: 0 0 0 4px rgba(120, 255, 160, 0.15);
}
#${DIM_ID} {
  position: fixed;
  inset: 0;
  z-index: 2147483000;
  background: rgba(0, 0, 0, 0.55);
  pointer-events: auto;
  touch-action: none;
}
#${PANEL_ID} {
  position: fixed;
  left: 8px;
  right: 8px;
  bottom: 76px;
  margin: 0 auto;
  max-width: 320px;
  z-index: 2147483647;
  box-sizing: border-box;
  padding: 10px 12px;
  border: 1px solid rgba(255, 224, 138, 0.45);
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.86);
  color: #ffe08a;
  font-family: monospace;
  font-size: 12px;
  line-height: 1.3;
  pointer-events: auto;
}
#${PANEL_ID} .ef-overlay-edit-title {
  font-size: 14px;
  font-weight: 700;
  margin-bottom: 4px;
  text-align: center;
}
#${PANEL_ID} .ef-overlay-edit-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  gap: 6px;
  align-items: center;
  min-height: 30px;
  border-top: 1px solid rgba(255, 224, 138, 0.18);
  padding-top: 6px;
  margin-top: 6px;
}
#${PANEL_ID} .ef-overlay-edit-row:first-of-type {
  border-top: 0;
  padding-top: 0;
  margin-top: 0;
}
#${PANEL_ID} .ef-overlay-edit-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
#${PANEL_ID} .ef-overlay-edit-btn {
  height: 26px;
  padding: 0 8px;
  border: 1px solid rgba(255, 224, 138, 0.45);
  border-radius: 5px;
  background: rgba(255, 224, 138, 0.12);
  color: #ffe08a;
  font: inherit;
  font-size: 11px;
  cursor: pointer;
}
#${PANEL_ID} .ef-overlay-edit-btn:hover {
  background: rgba(255, 224, 138, 0.22);
}
#${PANEL_ID} .ef-overlay-edit-move {
  width: 100%;
  height: 32px;
  margin-top: 4px;
  border: 1px solid rgba(255, 224, 138, 0.55);
  border-radius: 6px;
  background: rgba(255, 224, 138, 0.16);
  color: #ffe08a;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}
#${PANEL_ID} .ef-overlay-edit-done {
  width: 100%;
  height: 28px;
  margin-top: 8px;
  border: 1px solid rgba(255, 224, 138, 0.30);
  border-radius: 6px;
  background: transparent;
  color: rgba(255, 224, 138, 0.75);
  font: inherit;
  cursor: pointer;
}
#${PANEL_ID} .ef-overlay-edit-empty {
  opacity: 0.7;
  text-align: center;
  padding: 4px 0;
}
.${HIGHLIGHT_CLASS} {
  outline: 2px dashed rgba(255, 224, 138, 0.9) !important;
  outline-offset: 3px !important;
  cursor: grab !important;
  touch-action: none !important;
}
.${HIGHLIGHT_CLASS}:active {
  cursor: grabbing !important;
}
.${FORCED_HIDDEN_CLASS} {
  display: none !important;
}
`;
    document.head.appendChild(style);
}

function hiddenStorageKey(id) {
    return `${HIDDEN_KEY_PREFIX}:${id}`;
}

function readHidden(id) {
    try {
        return window.localStorage.getItem(hiddenStorageKey(id)) === "true";
    } catch (error) {
        return false;
    }
}

function writeHidden(id, hidden) {
    try {
        window.localStorage.setItem(hiddenStorageKey(id), hidden ? "true" : "false");
    } catch (error) {
        // Ignore storage errors.
    }
}

function applyHiddenState(node, id) {
    node.classList.toggle(FORCED_HIDDEN_CLASS, readHidden(id));
}

function writePosition(def, left, top) {
    try {
        const value = def.posFormat === "px"
            ? { left: `${Math.round(left)}px`, top: `${Math.round(top)}px` }
            : { left: Math.round(left), top: Math.round(top) };
        window.localStorage.setItem(def.positionKey, JSON.stringify(value));
    } catch (error) {
        // Ignore storage errors.
    }
}

function clampToViewport(node, left, top) {
    const rect = node.getBoundingClientRect();
    const maxLeft = Math.max(0, window.innerWidth - rect.width);
    const maxTop = Math.max(0, window.innerHeight - rect.height);
    return {
        left: Math.min(Math.max(0, left), maxLeft),
        top: Math.min(Math.max(0, top), maxTop)
    };
}

function bindOverlayDrag(node, def, isActive) {
    if (node.__efEditDragBound) {
        return;
    }
    node.__efEditDragBound = true;

    let dragging = false;
    let activePointerId = null;
    let offsetX = 0;
    let offsetY = 0;
    let prevTouchAction = "";

    function onPointerMove(moveEvent) {
        if (!dragging || moveEvent.pointerId !== activePointerId) {
            return;
        }
        moveEvent.preventDefault();
        const next = clampToViewport(node, moveEvent.clientX - offsetX, moveEvent.clientY - offsetY);
        node.style.left = `${next.left}px`;
        node.style.top = `${next.top}px`;
        node.style.right = "auto";
        node.style.bottom = "auto";
    }

    function endDrag(endEvent) {
        if (!dragging || (endEvent && endEvent.pointerId !== activePointerId)) {
            return;
        }
        dragging = false;
        node.releasePointerCapture?.(activePointerId);
        activePointerId = null;
        node.style.touchAction = prevTouchAction;
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup", endDrag);
        window.removeEventListener("pointercancel", endDrag);
        const rect = node.getBoundingClientRect();
        writePosition(def, rect.left, rect.top);
    }

    node.addEventListener("pointerdown", (event) => {
        if (!isActive() || event.button !== 0 || dragging) {
            return;
        }
        if (event.target?.closest?.("button, input, select, textarea, label, a")) {
            return;
        }
        event.preventDefault();
        event.stopPropagation();
        const rect = node.getBoundingClientRect();
        offsetX = event.clientX - rect.left;
        offsetY = event.clientY - rect.top;
        dragging = true;
        activePointerId = event.pointerId;
        // Prevent the browser from hijacking the gesture as a page scroll
        // partway through, which otherwise cancels the drag after a few px.
        prevTouchAction = node.style.touchAction;
        node.style.touchAction = "none";
        node.setPointerCapture?.(event.pointerId);

        window.addEventListener("pointermove", onPointerMove);
        window.addEventListener("pointerup", endDrag);
        window.addEventListener("pointercancel", endDrag);
    });
}

function resolveOverlays() {
    return OVERLAY_REGISTRY
        .map((def) => ({ def, node: document.getElementById(def.id) }))
        .filter((entry) => entry.node);
}

export function installOverlayEditMode() {
    if (!document.body || document.getElementById(FAB_ID)) {
        return;
    }

    ensureStyle();

    // mode "closed" -> just the FAB.
    // mode "menu"   -> light list panel (hide/reset), nothing dimmed, game still playable.
    // mode "move"   -> dim + game input locked, overlays draggable, no list in the way.
    const state = { mode: "closed" };
    const dragActive = () => state.mode === "move";

    // Apply persisted hide/show state and bind dragging to any overlays that
    // already exist; the drag handler only does anything while mode is "move".
    for (const entry of resolveOverlays()) {
        applyHiddenState(entry.node, entry.def.id);
        bindOverlayDrag(entry.node, entry.def, dragActive);
    }

    const fab = document.createElement("button");
    fab.id = FAB_ID;
    fab.type = "button";
    fab.setAttribute("aria-label", "Edit overlays");
    fab.innerHTML = MOVE_ICON;

    let dim = null;
    let panel = null;
    let appElement = null;
    let appPrevPointerEvents = "";

    function renderMenuPanel() {
        const entries = resolveOverlays();
        const rows = entries.length
            ? entries.map(({ def, node }) => {
                const hidden = readHidden(def.id);
                return `<div class="ef-overlay-edit-row" data-overlay-id="${escapeHtml(def.id)}">
  <span class="ef-overlay-edit-name">${escapeHtml(def.label)}</span>
  <button class="ef-overlay-edit-btn" data-action="toggleHidden" type="button">${hidden ? "Show" : "Hide"}</button>
  <button class="ef-overlay-edit-btn" data-action="resetPosition" type="button">Reset</button>
</div>`;
            }).join("")
            : `<div class="ef-overlay-edit-empty">No overlays loaded yet</div>`;

        panel.innerHTML = `
<div class="ef-overlay-edit-title">Overlays</div>
${rows}
<button class="ef-overlay-edit-move" data-action="enterMove" type="button">Edit Overlay Positions</button>
<button class="ef-overlay-edit-done" data-action="close" type="button">Close</button>
`;

        panel.querySelector('[data-action="enterMove"]')?.addEventListener("click", (event) => {
            event.preventDefault();
            setMode("move");
        });
        panel.querySelector('[data-action="close"]')?.addEventListener("click", (event) => {
            event.preventDefault();
            setMode("closed");
        });

        for (const row of panel.querySelectorAll(".ef-overlay-edit-row")) {
            const overlayId = row.getAttribute("data-overlay-id") || "";
            row.querySelector('[data-action="toggleHidden"]')?.addEventListener("click", (event) => {
                event.preventDefault();
                const entry = resolveOverlays().find((item) => item.def.id === overlayId);
                if (!entry) {
                    return;
                }
                const nextHidden = !readHidden(overlayId);
                writeHidden(overlayId, nextHidden);
                applyHiddenState(entry.node, overlayId);
                renderMenuPanel();
            });
            row.querySelector('[data-action="resetPosition"]')?.addEventListener("click", (event) => {
                event.preventDefault();
                const entry = resolveOverlays().find((item) => item.def.id === overlayId);
                if (!entry) {
                    return;
                }
                try {
                    window.localStorage.removeItem(entry.def.positionKey);
                } catch (error) {
                    // Ignore storage errors.
                }
                entry.node.style.left = "";
                entry.node.style.top = "";
                entry.node.style.right = "";
                entry.node.style.bottom = "";
            });
        }
    }

    function lockGame(locked) {
        if (locked) {
            appElement = document.getElementById("app");
            if (appElement) {
                appPrevPointerEvents = appElement.style.pointerEvents;
                appElement.style.pointerEvents = "none";
            }
        } else if (appElement) {
            appElement.style.pointerEvents = appPrevPointerEvents;
            appElement = null;
        }
    }

    function setMode(nextMode) {
        const prevMode = state.mode;
        state.mode = nextMode;

        fab.classList.toggle("ef-overlay-edit-fab-active", nextMode === "menu");
        fab.classList.toggle("ef-overlay-edit-fab-save", nextMode === "move");
        fab.innerHTML = nextMode === "move" ? CHECK_ICON : MOVE_ICON;
        fab.setAttribute("aria-label", nextMode === "move" ? "Save overlay positions" : "Edit overlays");

        // Menu panel only exists in "menu" mode.
        if (nextMode === "menu") {
            if (!panel) {
                panel = document.createElement("div");
                panel.id = PANEL_ID;
                panel.addEventListener("click", (event) => event.stopPropagation());
                panel.addEventListener("pointerdown", (event) => event.stopPropagation());
                document.body.appendChild(panel);
            }
            renderMenuPanel();
        } else if (panel) {
            panel.remove();
            panel = null;
        }

        // Dim + game lock + highlight only apply in "move" mode.
        if (nextMode === "move") {
            if (!dim) {
                dim = document.createElement("div");
                dim.id = DIM_ID;
                document.body.appendChild(dim);
            }
            lockGame(true);
            for (const entry of resolveOverlays()) {
                entry.node.classList.add(HIGHLIGHT_CLASS);
                bindOverlayDrag(entry.node, entry.def, dragActive);
            }
        } else if (prevMode === "move") {
            dim?.remove();
            dim = null;
            lockGame(false);
            for (const entry of resolveOverlays()) {
                entry.node.classList.remove(HIGHLIGHT_CLASS);
            }
        }
    }

    fab.addEventListener("click", (event) => {
        event.preventDefault();
        if (state.mode === "closed") {
            setMode("menu");
        } else {
            // From "menu" or "move", tapping the FAB (Save, while moving) exits cleanly.
            setMode("closed");
        }
    });

    document.body.appendChild(fab);
}
