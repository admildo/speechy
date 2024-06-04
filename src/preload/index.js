import { contextBridge, ipcRenderer, clipboard } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  hello: async () => {
    return 40 * 20
  },
  getRequest: async () => {
    return await ipcRenderer.invoke('get-request')
  },
  getText: async () => {
    return clipboard.readText('selection')
  },
  dragWindow: async (position) => {
    return await ipcRenderer.invoke('window-drag', position)
  },
  stopDrag: async () => {
    return await ipcRenderer.invoke('stop-drag')
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}
