# AgensGraphViewer
Web-based user interface that provides visualization of graph data stored in an AgensGraph database. 

This is a sub-project of [AgensGraph](https://github.com/BitnineGlobal/agensgraph/tree/v2.14)

# Recommended Node Version & install module

- Node version - 14.16.0
- Node Module - pm2 

Install latest **pm2** with :

```bash
npm i pm2
```

> [pm2](https://www.npmjs.com/package/pm2) is an NPM module to run the project in production mode.

# Installing AgensGraphViewer

- Install the required node modules using  :  

```bash
npm run setup
```

# How to start using AgensGraphViewer

AgensGraphViewer is a graphical user interface for AgensGraph, so it needs an AgensGraph server running on the background. 

Tipically, this is done with the command 

```
ag_ctl start [-D /path/created/by/initdb]
```

For the other settings or usage instructions, please follow [AgensGraph's documentation](https://bitnine.net/documentations/quick-guide-1-3.html).

# Running AgensGraphViewer

- Run AgenGraphViewer in production environment using : 

```bash
pm2 start ecosystem.config.js --env release
```

>This will start AgensGraphViewer on http://localhost:4000 if port 4000 is free.

To stop the process use the commands:

```bash
pm2 stop ag-viewer-release 
pm2 delete ag-viewer-release
```

### Connect AgensGraphViewer to AgensGraph Database

**Standard Connection Settings**

- Database type: AgensGraph
- Connect URL:  127.0.0.1
- Connect Port: 5432

