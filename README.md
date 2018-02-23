# Qidian Reader
An Brief Qidian Reader app based on Bootstrap + Angular UI Bootstrap, AngularJS, NodeJS+ExpressJS and MongoDB.

## Files
```
.
├── models: MongoDB Models
├── public: Front-End Resources
│      ├── app: Angular App
│      │      ├── components
│      │      ├── shared
│      │      ├── app.module.js
│      │      └── app.routes.js
│      ├── assets: Resources
│      │      ├── css
│      │      ├── img
│      │      ├── js
│      │      └── libs: Bower Libraries
│      └── index.html
├── routes: Express Routes
│      ├── apis: RESTful API Routes
│      └── api.js: RESTful API Entrance
├── .bowerrc
├── .gitignore
├── bower.json
├── package.json
└── server.js
```

## Initialization
1. Make sure you have node installed with npm.
1. Run `npm install` under the repository folder
  * It will handle node modules, bower, and bower modules.
  * Read .bowerrc and package.json for detail.
1. For local debuging, adjust server.js to point to your local mongoDB.
1. For local nodemon, use nodemon.json as the config.

## Development
### Storage
Remember to purchase storage, or a storage request forbidden error will show up when creating database associated.

### Source & Secret
Source Secret is required for private repo deployment.
#### SSH
This credential uses ssh private/public key pairs to pull repo, and is safe because it can be assigned to single repo by deploy key.
1. Create ssh key **without** passphrase (empty passphrase).
1. Add ssh **public** key to the deploy key of the repo on git source.
1. Create a Source Secret in OpenShift, with ssh **private** key. _Remember: Do not modify after browse and import._
1. Check link to builder account before create.
1. In build config (where source is defined), assign the secret to the souce.
1. SSH url will work. _Remember: Do not use HTTP url, Do not add ssh:// before SSH url._
#### Basic Auth
This credential uses username and password to pull repo, but is not safe because the auth is not only for the target repo.
1. Create a Source Secret in OpenShift, with basic auth: git source login information.
1. Check link to builder account before create.
1. In build config (where source is defined), assign the secret to the source.
1. HTTP url will work. SSH url not tested.

### Deployment
* Use Webhooks, set PayLoad URL, set Content type as application/json, and then leave Secret Blank. _For private repo, Secret field should be set._ On OpenShift side, rebuild and deployment will automatically take place.
* Use npm scripts.postinstall "npm install bower && bower install" to install bower component. Also use .bowerrc and bower.json to define bower install content.

### Routing
To host an OpenShift app at a specified url, the following steps should be taken:
1. Generate a default route for this app, naming internal-route for example.
1. Generate a specified route for this app, naming external-route for example.
1. Register the specified domain online (for example using [Name](https://www.name.com)).
1. Under DNS settings add a CNAME DNS with your internal-route url as source, and your external-route url as destination.

## References:
* [Bootstrap 3.3.7](https://getbootstrap.com/docs/3.3/)
* [Angular UI Bootstrap](http://angular-ui.github.io/bootstrap/)
* [AngularJS](https://angularjs.org/)
* [Mongoose](http://mongoosejs.com/docs/guide.html)
* [Cheerio](https://cheerio.js.org/)
* [OpenShift](https://www.openshift.com/)

## TODOs
* update last read chapter on QiDian Server.
* apply more secured authentication.
* deploy on HTTPS.
* pull bookcase from QiDian Server.
