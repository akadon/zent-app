import { app, BrowserWindow, Tray, Menu, nativeImage } from "electron";
import * as path from "path";
import { spawn, ChildProcess } from "child_process";

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let serverProcess: ChildProcess | null = null;

const isDev = !app.isPackaged;
const DEV_URL = "http://localhost:3000";
const PROD_PORT = 3456;

function getIconPath(): string {
  if (isDev) {
    return path.join(__dirname, "..", "public", "icon.png");
  }
  return path.join(process.resourcesPath, "icon.png");
}

function startNextServer(): Promise<string> {
  return new Promise((resolve, reject) => {
    if (isDev) {
      resolve(DEV_URL);
      return;
    }

    const serverPath = path.join(
      process.resourcesPath,
      "standalone",
      "server.js"
    );

    const url = `http://localhost:${PROD_PORT}`;
    let settled = false;

    serverProcess = spawn(process.execPath, [serverPath], {
      env: {
        ...process.env,
        PORT: String(PROD_PORT),
        HOSTNAME: "localhost",
      },
      stdio: "pipe",
    });

    serverProcess.stderr?.on("data", (data: Buffer) => {
      console.error("Next.js server:", data.toString());
    });

    serverProcess.on("error", (err) => {
      if (!settled) {
        settled = true;
        reject(err);
      }
    });

    serverProcess.on("exit", (code) => {
      if (!settled) {
        settled = true;
        reject(new Error(`Server process exited with code ${code}`));
      }
    });

    // Health check loop: try fetching every 500ms, reject after 15s
    const startTime = Date.now();
    const interval = setInterval(async () => {
      if (settled) {
        clearInterval(interval);
        return;
      }

      try {
        const res = await fetch(url);
        if (res.ok || res.status < 500) {
          clearInterval(interval);
          if (!settled) {
            settled = true;
            resolve(url);
          }
        }
      } catch {
        // Server not ready yet
      }

      if (Date.now() - startTime > 15000) {
        clearInterval(interval);
        if (!settled) {
          settled = true;
          reject(new Error("Server failed to start within 15 seconds"));
        }
      }
    }, 500);
  });
}

function createTray(): void {
  const icon = nativeImage.createFromPath(getIconPath());
  tray = new Tray(icon.isEmpty() ? nativeImage.createEmpty() : icon);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Show Zent",
      click: () => {
        mainWindow?.show();
        mainWindow?.focus();
      },
    },
    { type: "separator" },
    {
      label: "Quit Zent",
      click: () => {
        app.quit();
      },
    },
  ]);

  tray.setToolTip("Zent");
  tray.setContextMenu(contextMenu);

  tray.on("click", () => {
    mainWindow?.show();
    mainWindow?.focus();
  });
}

async function createWindow(): Promise<void> {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 940,
    minHeight: 500,
    title: "Zent",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Close to tray instead of quitting
  mainWindow.on("close", (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow?.hide();
    }
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  const url = await startNextServer();
  mainWindow.loadURL(url);
}

// Prevent multiple instances
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

app.on("ready", async () => {
  createTray();
  await createWindow();
});

app.on("before-quit", () => {
  (app as any).isQuitting = true;
  if (serverProcess) {
    serverProcess.kill();
    serverProcess = null;
  }
});

app.on("window-all-closed", () => {
  // Don't quit on macOS
  if (process.platform !== "darwin") {
    // Keep running for tray
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  } else {
    mainWindow.show();
  }
});
