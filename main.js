const { program, version } = require('commander')
const chalk = require('chalk')
const fs = require('fs')
const shell = require('shelljs')
const path = require('path')
const inquirer = require('inquirer')
const { request } = require('http')
program.version('1.0.0')
const promptList = [{
        type: 'input',
        message: 'Author: ',
        name: 'author'
    },
    {
        type: 'version',
        message: 'Version: ',
        name: 'version',
        default: "1.0.0"
    },
    {
        type: 'title',
        message: 'Title: ',
        name: 'title'
    },
    {
        type: 'list',
        message: 'Installing tools:',
        name: 'tool',
        choices: [
            "yarn",
            "npm"
        ]
    },
    {
        type: 'title',
        message: 'Electron Version: ',
        name: 'evers',
        default: '11.2.3'
    },
    {
        type: 'title',
        message: 'Electron Builder Version: ',
        name: 'ebvers',
        default: '22.9.1'
    },
    {
        type: 'title',
        message: 'Electron Windows Store Version: ',
        name: 'ewsvers',
        default: '2.1.0'
    },
    {
        type: 'list',
        message: 'Windows Building Target:',
        name: 'wbt',
        choices: [
            "nsis",
            "msi",
            "zip"
        ]
    },
    {
        type: 'list',
        message: 'macOS Building Target:',
        name: 'mbt',
        choices: [
            "pkg",
            "dmg",
            "zip"
        ]
    },
    {
        type: 'list',
        message: 'Linux Building Target:',
        name: 'lbt',
        choices: [
            "AppImage",
            "tar.gz",
            "deb"
        ]
    },
    {
        type: "confirm",
        message: "Publish to Github?",
        name: "publish"
    },
    {
        type: 'input',
        message: 'The Commit for this publish:',
        name: 'commit',
        when: answers => {
            return answers.publish
        }
    },
    {
        type: 'input',
        message: 'Project Location: ',
        name: 'location',
        when: answers => {
            return answers.publish
        }
    }
]
let using = false
let vers = {
    evers: '',
    ebvers: '',
    ewsvers: ''
}
let tgt = {
    win: '',
    mac: '',
    linux: ''
}
let config = {
    publish: true,
    commit: ``,
    location: ``
}
let licences = []
try {
    request('https://api.github.com/licenses', (error, response, body) => {
        console.log(body)
        let result = JSON.parse(body)
        let i = 0
        for(i in result.key) {
            licences[i] = result.key
            console.log(licences[i])
        }
    })
}
catch {

}
program.arguments('<name>').description('create app', {
    name: 'the name of the project'
}).action((name) => {
    let project
    inquirer.prompt(promptList).then(answers => {
        project = {
            name,
            author: answers.author,
            version: answers.version,
            title: answers.title
        }
        console.log(project)
        using = (String(answers.tool) == "npm"? true : false)
        vers.ebvers = String(answers.ebvers)
        vers.evers = String(answers.evers)
        vers.ewsvers = String(answers.ewsvers)
        tgt.win = String(answers.wbt)
        tgt.mac = String(answers.mbt)
        tgt.linux = String(answers.lbt)
        config.publish = answers.publish
        if(config.publish) {
            config.commit = answers.commit
            config.location = answers.location
        }
        // console.log(using)
        createProject(project)
    })
})
function createProject(app) {
    try {
        try {
            fs.rmdirSync(`${app.name}`)
        }
        catch {

        }
        fs.mkdirSync(`${app.name}`)
        fs.mkdirSync(`${app.name}/commands`)
        fs.mkdirSync(`${app.name}/css`)
        fs.mkdirSync(`${app.name}/js`)
        fs.mkdirSync(`${app.name}/pages`)
        fs.mkdirSync(`${app.name}/template`)
        fs.writeFileSync(`${app.name}/package.json`, `{
            "name": "${app.name}",
            "version": "${app.version}",
            "description": "./commands/main.js",
            "main": "main.js",
            "scripts": {
              "test": "node commands/test.js",
              "serve": "node commands/serve.js",
              "build": "node commands/build.js"
            },
            "keywords": [
              "create",
              "electron",
              "photon"
            ],
            "author": "${app.author}",
            "license": "MIT",
            "dependencies": {
              "extend": "^3.0.2",
              "koa": "^2.13.1",
              "koa-router": "^10.0.0",
              "node-cmd": "^4.0.0",
              "request": "^2.88.2",
              "shelljs": "^0.8.4"
            },
            ${(config.publish? `
            "bugs": {
              "url": "${config.location}/issues"
            },
            "repository": {
              "type": "git",
              "url": "git+${config.location}.git"
            },
            "homepage": "${config.location}#readme",` : ``)}
            "devDependencies": {
              "electron": "^${String(vers.evers)}",
              "electron-builder": "^${String(vers.ebvers)}",
              "electron-windows-store": "^${String(vers.ewsvers)}"
            },
            "build": {
              "productName": "${app.name}",
              "appId": "com.${app.author}.${app.name}",
              "win": {
                "target": {
                  "target": "${String(tgt.win)}",
                  "arch": [
                    "x64",
                    "ia32"${(String(tgt.win) != 'nsis'? `,\n"arm64"` : ``)}
                  ]
                },
                "icon": "./icon.ico",
                "asar": false
              },
              "mac": {
                "icon": "./icon.icns",
                "target": {
                  "target": "${String(tgt.mac)}",
                  "arch": [
                    "x64",
                    "arm64"
                  ]
                }
              },
              "dmg": {
                "contents": [
                  {
                    "x": 410,
                    "y": 210,
                    "type": "link",
                    "path": "./Applications"
                  },
                  {
                    "x": 130,
                    "y": 210,
                    "type": "file"
                  }
                ]
              },
              "linux": {
                "target": {
                  "target": "${String(tgt.linux)}",
                  "arch": [
                    "x64",
                    "ia32",
                    "armv7l",
                    "arm64"
                  ]
                }
              },
              "nsis": {
                "oneClick": false,
                "perMachine": false,
                "allowToChangeInstallationDirectory": true,
                "shortcutName": "${app.title}",
                "menuCategory": "${app.author}"
              }
            }
          }          
        `)
        fs.writeFileSync(`${app.name}/template/tray.js`, `const Electron = require('electron')
        const { Tray } = Electron
        const os = require('os')
        const path = require('path')
        app.on('ready', () => {
            let image = nativeImage.createFromPath(path.join(__dirname, '../icon.png'))
            let tray = new Tray(image)
            const trayMenu = Menu.buildFromTemplate([
                {
                    label: '退出',
                    click: () => {
                        app.quit()
                    }
                }
            ])
            tray.setToolTip('${app.name}')
            tray.setContextMenu(trayMenu)
            tray.on('double-click', () => {
                mainWindow.show()
            })
        })`)
        fs.writeFileSync(`${app.name}/template/window.js`, `const Electron = require('electron')
        const { BrowserWindow, BrowserView } = Electron
        const os = require('os')
        const path = require('path')
        app.on('ready', () => {
            let calcualte = (i, j, k) => {
                return(Math.floor(i * j / k))
            }
            const { width, height } = screen.getPrimaryDisplay().workAreaSize
            let mainWindow = new BrowserWindow({
                width: calcualte(width, 2, 3),
                height: calcualte(height, 2, 3),
                show: true,
                webPreferences: {
                    nodeIntegration: true,
                    enableRemoteModule: true
                },
                frame: (os == 'linux'? true : false)
            })
            if(platform == 'darwin' || platform == "mas") {
                classWindow.setWindowButtonVisibility(true)
            }
            mainWindow.loadURL(path.join(__dirname, '../pages/frame.html'))
            mainWindow.once('ready-to-show', () => {
                mainWindow.show()
            })
            let mainView = new BrowserView({
                webPreferences: {
                    nodeIntegration: true,
                    nodeIntegrationInSubFrames: true,
                    nodeIntegrationInWorker: true,
                    enableRemoteModule: true,
                    webviewTag: true
                }
            })
            mainWindow.setBrowserView(mainView)
            mainView.setBounds({
                x: 0,
                y: 60,
                width: mainWindow.getBounds().width,
                height: mainWindow.getBounds().height - 60
            })
            mainView.webContents.loadURL(path.join(__dirname, '../pages/index.html'))
            mainWindow.on('resize', () => {
                mainView.setBounds({
                    x: 0,
                    y: 60,
                    width: mainWindow.getBounds().width,
                    height: mainWindow.getBounds().height - 60
                })
            })
            ipcMain.on('closeMainWindow', () => {
                mainWindow.close()
            })
            ipcMain.on('minimizeMainWindow', () => {
                mainWindow.minimize()
            })
            ipcMain.on('maximizeMainWindow', () => {
                if(mainWindow.isMaximized()) {
                    mainWindow.unmaximize()
                } 
                else {
                    mainWindow.maximize()
                }
            })
            ipcMain.on('fullscreenMainWindow', () => {
                mainWindow.setFullScreen(!mainWindow.isFullScreen())
            })
            mainWindow.on('close', () => {
                mainWindow = null
            })
        })
        `)
        fs.writeFileSync(`${app.name}/commands/main.js`, `const Electron = require('electron')
        const { Tray, Menu, MenuItem, ipcMain, BrowserWindow, BrowserView, app, screen, dialog, Notification, nativeImage } = Electron
        const fs = require('fs')
        const os = require('os')
        const shell = require('shelljs')
        const cmd = require('node-cmd')
        const path = require('path')
        const extend = require('extend')
        const request = require('request')
        const { platform, arch } = os
        function createWindow() {
            let calcualte = (i, j, k) => {
                return(Math.floor(i * j / k))
            }
            const { width, height } = screen.getPrimaryDisplay().workAreaSize
            let mainWindow = new BrowserWindow({
                width: calcualte(width, 2, 3),
                height: calcualte(height, 2, 3),
                show: true,
                webPreferences: {
                    nodeIntegration: true,
                    enableRemoteModule: true
                },
                frame: (os == 'linux'? true : false)
            })
            if(platform == 'darwin' || platform == "mas") {
                classWindow.setWindowButtonVisibility(true)
            }
            mainWindow.loadURL(path.join(__dirname, '../pages/frame.html'))
            mainWindow.once('ready-to-show', () => {
                mainWindow.show()
            })
            let mainView = new BrowserView({
                webPreferences: {
                    nodeIntegration: true,
                    nodeIntegrationInSubFrames: true,
                    nodeIntegrationInWorker: true,
                    enableRemoteModule: true,
                    webviewTag: true
                }
            })
            mainWindow.setBrowserView(mainView)
            mainView.setBounds({
                x: 0,
                y: 60,
                width: mainWindow.getBounds().width,
                height: mainWindow.getBounds().height - 60
            })
            mainView.webContents.loadURL(path.join(__dirname, '../pages/index.html'))
            mainWindow.on('resize', () => {
                mainView.setBounds({
                    x: 0,
                    y: 60,
                    width: mainWindow.getBounds().width,
                    height: mainWindow.getBounds().height - 60
                })
            })
            ipcMain.on('closeMainWindow', () => {
                mainWindow.close()
            })
            ipcMain.on('minimizeMainWindow', () => {
                mainWindow.minimize()
            })
            ipcMain.on('maximizeMainWindow', () => {
                if(mainWindow.isMaximized()) {
                    mainWindow.unmaximize()
                } 
                else {
                    mainWindow.maximize()
                }
            })
            ipcMain.on('fullscreenMainWindow', () => {
                mainWindow.setFullScreen(!mainWindow.isFullScreen())
            })
            mainWindow.on('close', () => {
                mainWindow = null
            })
        }
        
        app.whenReady().then(createWindow)
        
        app.on('all-window-closed', () => {
            if(os.platform != 'darwin') {
                app.quit()
            }
        })`)
        fs.writeFileSync(`${app.name}/commands/serve.js`, `const Electron = require('electron')
        const { Tray, Menu, MenuItem, ipcMain, BrowserWindow, BrowserView, app, screen, dialog } = Electron
        const fs = require('fs')
        const os = require('os')
        const childProcess = require('child_process')
        const shell = require('shelljs')
        const { mainModule } = require('process')
        const path = require('path')
        const location = path.join(__dirname, './main.js')
        // console.log(location)
        shell.exec(\`electron \${location}\`)`)
        fs.writeFileSync(`${app.name}/commands/build.js`, `const os = require('os')
        const shell = require('shelljs')
        console.log(\`Your system: \${os.platform} \${os.arch}. \${os.version} (build \${os.release})\`)
        if(os.platform == 'darwin') {
            shell.exec('electron-builder --mac')
        }
        if(os.platform == 'win32') {
            shell.exec('electron-builder --win')
        }
        if(os.platform == 'linux') {
            shell.exec('electron-builder --linux')
        }`)
        fs.writeFileSync(`${app.name}/pages/frame.html`, `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta http-equiv="X-UA-Compatible" content="IE=edge">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Document</title>
            <script src="https://unpkg.com/vue@2.6.12/dist/vue.min.js"></script>
            <link rel="stylesheet" href="https://unpkg.com/muse-ui@3.0.2/dist/muse-ui.css">
            <script src="https://unpkg.com/muse-ui@3.0.2/dist/muse-ui.js"></script>
            <link rel="stylesheet" href="https://unpkg.com/bootstrap@4.6.0/dist/css/bootstrap.min.css">
            <link rel="stylesheet" href="https://unpkg.com/animate.css@4.1.1/animate.min.css">
            <link rel="stylesheet" href="https://cdn.bootcss.com/material-design-icons/3.0.1/">
            <style>
                .menuBar {
                    text-align: right;
                    font-size: 24px;
                }
                .control {
                    text-align: center;
                    padding-left: 5em;
                    padding-right: 5em;
                }
            </style>
        </head>
        <body>
            <div id="app">
                <div class="menuBar" v-if="platform == 'win32'">
                    <mu-button icon color="info" @click="fullscreen" class="animate__animated animate__fadeInDown"><mu-icon value=":el-icon-full-screen"></mu-icon></mu-button>
                    <mu-button icon color="warning" @click="minimize" class="animate__animated animate__fadeInLeft"><mu-icon value=":el-icon-minus"></mu-icon></mu-button>
                    <mu-button icon color="success" @click="maximize" class="animate__animated animate__fadeInRight"><mu-icon value=":el-icon-plus"></mu-icon></mu-button>
                    <mu-button icon color="error" @click="close" class="animate__animated animate__fadeInUp"><mu-icon value=":el-icon-close"></mu-icon></mu-button>
                </div>
                <div class="control">
                    
                </div>
            </div>
            <script>
                var vm = new Vue({
                    el: '#app',
                    data() {
                        return {
                            platform: require('os').platform
                        }
                    },
                    methods: {
                        close() {
                            require('electron').ipcRenderer.send('closeBrowserWindow')
                        },
                        minimize() {
                            require('electron').ipcRenderer.send('minimizeBrowserWindow')
                        },
                        maximize() {
                            require('electron').ipcRenderer.send('maximizeBrowserWindow')
                        },
                        fullscreen() {
                            require('electron').ipcRenderer.send('fullScreenBrowserWindow')
                        }
                    }
                })
            </script>
        </body>
        </html>`)
        fs.writeFileSync(`${app.name}/pages/index.html`, `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta http-equiv="X-UA-Compatible" content="IE=edge">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Document</title>
            <script src="https://unpkg.com/vue@2.6.12/dist/vue.min.js"></script>
            <link rel="stylesheet" href="https://unpkg.com/muse-ui@3.0.2/dist/muse-ui.css">
            <script src="https://unpkg.com/muse-ui@3.0.2/dist/muse-ui.js"></script>
            <link rel="stylesheet" href="https://unpkg.com/bootstrap@4.6.0/dist/css/bootstrap.min.css">
            <link rel="stylesheet" href="https://unpkg.com/animate.css@4.1.1/animate.min.css">
            <link rel="stylesheet" href="https://cdn.bootcss.com/material-design-icons/3.0.1/">
            <style>
                .menuBar {
                    text-align: right;
                    font-size: 24px;
                }
                .control {
                    text-align: center;
                    padding-left: 5em;
                    padding-right: 5em;
                }
            </style>
        </head>
        <body>
            <div id="app">
                <mu-row>
                    <mu-col><br><h4 style="text-align: left; padding-left: 5em;" v-if="this.show">${app.name}</h4></mu-col>
                    <mu-col>
                        <div class="menuBar" v-if="platform == 'win32'">
                            <mu-button icon color="primary" @click="showMenu" class="animate__animated animate__fadeInUp"><mu-icon value=":el-icon-menu"></mu-icon></mu-button>
                            <mu-button icon color="info" @click="fullscreen" class="animate__animated animate__fadeInDown"><mu-icon value=":el-icon-full-screen"></mu-icon></mu-button>
                            <mu-button icon color="warning" @click="minimize" class="animate__animated animate__fadeInLeft"><mu-icon value=":el-icon-minus"></mu-icon></mu-button>
                            <mu-button icon color="success" @click="maximize" class="animate__animated animate__fadeInRight"><mu-icon value=":el-icon-plus"></mu-icon></mu-button>
                            <mu-button icon color="error" @click="close" class="animate__animated animate__fadeInUp"><mu-icon value=":el-icon-close" disabled></mu-icon></mu-button>
                            </div>
                    </mu-col>
                </mu-row>
                <el-collapse-transition>
                    <div class="menu" v-if="platform == 'win32' && this.menu">
                        <div>
                            <mu-button flat>文件</mu-button>
                            <mu-button flat>选项</mu-button>
                            <mu-button flat>工具</mu-button>
                            <mu-button flat>帮助</mu-button>
                        </div>
                    </div>
                </el-collapse-transition>
                <div class="control">
                    <h1>Write Here.</h1>
                </div>
            </div>
            <script>
                var vm = new Vue({
                    el: '#app',
                    data() {
                        return {
                            platform: require('os').platform,
                            menu: false
                        }
                    },
                    methods: {
                        close() {
                            require('electron').ipcRenderer.send('closeMainWindow')
                        },
                        minimize() {
                            require('electron').ipcRenderer.send('minimizeMainWindow')
                        },
                        maximize() {
                            require('electron').ipcRenderer.send('maximizeMainWindow')
                        },
                        fullscreen() {
                            require('electron').ipcRenderer.send('fullScreenMainWindow')
                        },
                        showMenu() {
                            this.menu = !this.menu
                        }
                    }
                })
            </script>
        </body>
        </html>`)
        
        console.log(chalk.red('Project Creating...'))
        console.log(chalk.red('project created.'))
        console.log(chalk.green('Please copy the files from js and css'))
        console.log(chalk.bold(`Installing dependencies and devDependencies, please wait...`))
        console.log('\n')
        console.log('----------')
        shell.cd(path.join(__dirname, `./${app.name}`))
        if(using) {
            shell.exec('npm install')
        }
        else {
            shell.exec('yarn')
        }
        shell.cd(path.join(__dirname))
        console.log(chalk.green('Use this sentences to start your project.'))
        console.log('\n')
        console.log(chalk.blue(`$ cd ${app.name}`))
        // console.log(using)
        if(using) {
            console.log(chalk.blue(`$ npm run serve`))
        }
        else {
            console.log(chalk.blue(`$ yarn serve`))
        }
        console.log(chalk.green('If you wanna build your project, you can input: '))
        console.log('\n')
        console.log(chalk.blue(`$ cd ${app.name}`))
        if(using) {
            console.log(chalk.blue(`$ npm run build`))
        }
        else {
            console.log(chalk.blue(`$ yarn build`))
        }
        if(config.publish) {
            try {
                
            }
            catch {
                console.log(chalk.bgRed('upload field. try again.'))
            }
            fs.writeFileSync(`${app.name}/README.md`, `# ${app.name}\n${config.commit}`)
            fs.writeFileSync(`${app.name}/LICENCE`, `MIT License

            Copyright (c) 2021 ${app.author}
            
            Permission is hereby granted, free of charge, to any person obtaining a copy
            of this software and associated documentation files (the "Software"), to deal
            in the Software without restriction, including without limitation the rights
            to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
            copies of the Software, and to permit persons to whom the Software is
            furnished to do so, subject to the following conditions:
            
            The above copyright notice and this permission notice shall be included in all
            copies or substantial portions of the Software.
            
            THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
            IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
            FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
            AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
            LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
            OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
            SOFTWARE.
            `)
            fs.writeFileSync(`${app.name}/.gitignore`, `node_modules`)
            shell.cd(path.join(__dirname, `./${app.name}`))
            shell.exec('git init')
            shell.exec('git add .')
            shell.exec(`git commit -m ${config.commit}`)
            shell.exec(`git remote add ${config.location}`)
            shell.exec(`git push -u origin master`)
        }
    }
    catch {
        console.log(chalk.bgRed('create field. try again.'))
    }
}
program.parse()