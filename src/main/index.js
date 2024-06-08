import {
  app,
  shell,
  BrowserWindow,
  ipcMain,
  clipboard,
  globalShortcut,
  desktopCapturer,
  screen,
  ipcRenderer
} from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import Screenshots from 'electron-screenshots'
import { createWorker } from 'tesseract.js'
import { read } from 'fs'
//import MouseEvents from 'global-mouse-events'
let mainWindow
let dragInterval
let mousePos
let lastRequest = 0
let requestInterval = 1000 * 7
const fetchWithRateLimit = async (url, options) => {
  const currentTime = new Date()
  if (currentTime - lastRequest < requestInterval) {
    console.log('Request blocked due to rate limiting')
    return Promise.reject('Rate limit exceeded. Please try again later.')
  }
  lastRequest = currentTime
  console.log(clipboard.readText())
  return await fetch(new Request(url, options))
}
let screenshots

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 50,
    height: 230,
    show: false,
    frame: false,
    autoHideMenuBar: true,
    transparent: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  // Calculate the position for the window to be in the center of the right corner
  const x = 1375 // Adjust for the width of the window
  const y = 330 // Adjust for the height of the window

  // Set the position of the window
  mainWindow.setPosition(x, y)
  mainWindow.setIgnoreMouseEvents(false)
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
  mainWindow.setAlwaysOnTop(true, 'floating')
  mainWindow.setFullScreenable(false)
  mainWindow.moveTop()

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer based on electron-vite cli.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  createWindow()

  screenshots = new Screenshots({
    lang: {
      magnifier_position_label: 'Position',
      operation_ok_title: 'Ok',
      operation_cancel_title: 'Cancel',
      operation_save_title: 'Save',
      operation_redo_title: 'Redo',
      operation_undo_title: 'Undo',
      operation_mosaic_title: 'Mosaic',
      operation_text_title: 'Text',
      operation_brush_title: 'Brush',
      operation_arrow_title: 'Arrow',
      operation_ellipse_title: 'Ellipse',
      operation_rectangle_title: 'Rectangle'
    },
    logger: false
  })
  // Register global shortcut
  const ret = globalShortcut.register('CommandOrControl+C+M', () => {
    console.log('CommandOrControl+C+M is pressed')
    if (mainWindow) {
      mainWindow.webContents.send('shortcut-triggered')
      ipcMain.emit('shortcut-triggered')
    }
  })

  if (!ret) {
    console.log('registration failed')
  }

  // Check whether a shortcut is registered.
  console.log(globalShortcut.isRegistered('CommandOrControl+C+M'))

  // Register global shortcut
  const screenShotCommand = globalShortcut.register('CommandOrControl+H', async () => {
    console.log('CommandOrControl+h is pressed')
    if (mainWindow) {
      //mainWindow.webContents.send('shortcut-triggered')
      ipcMain.emit('screenshot-triggered')
    }
  })

  if (!screenShotCommand) {
    console.log('registration failed')
  }

  const screenShotCancelCommand = globalShortcut.register('CommandOrControl+C+B', async () => {
    console.log('CommandOrControl+C+F')
    mainWindow.webContents.send('summaryShortcut')
  })

  const summaryShort = globalShortcut.register('esc', async () => {
    console.log('Esc is pressed')
    if (mainWindow) {
      screenshots.endCapture()
    }
  })
  if (!screenShotCommand) {
    console.log('registration failed')
  }

  // Check whether a shortcut is registered.
  console.log(globalShortcut.isRegistered('CommandOrControl+C+M'))

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.on('request-action', () => {
    console.log('request-action')
    console.log(clipboard.readText())
  })

  /*
  MouseEvents.on('mousemove', async (e) => {
    console.log(e)
  })*/

  ipcMain.handle('window-drag', async (position) => {
    dragInterval = setInterval(() => {
      mousePos = Robot.getMousePos()
      console.log(`mouseX${mousePos.mouseX} mouseY:${mousePos.mouseY}`)
    }, 100)
  })

  ipcMain.handle('stop-drag', async (position) => {
    clearInterval(dragInterval)
    // console.log(`mouseX${position.mouseX} mouseY:${position.mouseY}`)
  })

  ipcMain.on('screenshot-triggered', async () => {
    screenshots.startCapture()

    screenshots.on('ok', async (e, buffer, bounds) => {
      console.log('ok', buffer, bounds)

      const worker = await createWorker('eng')(async () => {
        const {
          data: { text }
        } = await worker.recognize(buffer)
        console.log(text)
        clipboard.writeText(text)
        mainWindow.webContents.send('shortcut-triggered')
        await worker.terminate()
      })()
    })
    // 点击取消按钮回调事件
    screenshots.on('cancel', () => {
      console.log('cancel', 'cancel1')
    })
    screenshots.on('cancel', (e) => {
      // 执行了preventDefault
      // 点击取消不会关闭截图窗口
      e.preventDefault()
      console.log('cancel', 'cancel2')
    })
    // 点击保存按钮回调事件
    screenshots.on('save', (e, buffer, bounds) => {
      console.log('save', buffer, bounds)
      console.log(new Blob([buffer], { type: 'image/png' }))
    })
    // 保存后的回调事件
    screenshots.on('afterSave', (e, buffer, bounds, isSaved) => {
      console.log('afterSave', buffer, bounds)
      console.log('isSaved', isSaved) // 是否保存成功
    })
  })

  /*
  ipcMain.on('shortcut-triggered', async () => {
    mainWindow.setSize(100, 100)
    mainWindow.setPosition(900, y)
  })
*/
  ipcMain.handle('get-request', async () => {
    async function streamToBuffer(stream) {
      const chunks = []
      for await (const chunk of stream) {
        chunks.push(chunk)
      }
      return Buffer.concat(chunks)
    }

    const text = clipboard.readText()

    const url = 'https://api.deepgram.com/v1/speak?model=aura-athena-en'
    const apiKey = '1360297d19ef908229f075a039244eb3ec22f67c'

    const options = {
      method: 'POST',
      headers: {
        Authorization: `Token ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text })
    }
    const res = await fetchWithRateLimit(url, options)

    if (!res.ok) {
      throw new Error(`HTTP error ${res.status}`)
    }

    const buffer = await streamToBuffer(res.body)

    return buffer
  })
  ipcMain.handle('get-summary', async () => {
    await getSummary()
  })
  const getSummary = async () => {
    const url = 'https://api.together.xyz/v1/chat/completions'
    const apiKey = '95bd465b25bb6e94615b6792cfe70580438799bf44e585583c5b908060f84a45'
    const prompt = `summarize the given text : ${clipboard.readText()}`

    const headers = new Headers({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    })

    const data = {
      model: 'META-LLAMA/LLAMA-3-8B-CHAT-HF',
      max_tokens: 1024,
      temperature: 0.79,
      messages: [
        {
          role: 'system',
          content: prompt
        }
      ]
    }

    const options = {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    }

    const res = await fetch(new Request(url, options))
    const body = await res.json()
    const final = body.choices[0].message.content
    console.log(final)
    clipboard.writeText(final)
  }

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('will-quit', () => {
  globalShortcut.unregister('CommandOrControl+C+M')
  globalShortcut.unregisterAll()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
  globalShortcut.unregisterAll()
})
