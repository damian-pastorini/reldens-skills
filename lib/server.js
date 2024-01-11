/**
 *
 * Reldens - Skills - Server Package
 *
 */

const ClassPath = require('./class-path');
const Sender = require('./server/sender');
const { StorageObserver } = require('./server/storage-observer');
const { DataServerValidator } = require('./server/data-server-validator');
const { Logger, sc } = require('@reldens/utils');

class SkillsServer
{

    constructor(props)
    {
        this.classPath = false;
        this.dataServer = false;
        this.storageObserver = false;
        this.client = false;
        this.setupServer(props);
    }

    setupServer(props)
    {
        if(!sc.hasOwn(props, 'owner')){
            Logger.critical('Undefined owner.');
            return false;
        }
        if(typeof props.owner.getPosition !== 'function'){
            Logger.critical('Undefined owner position method.');
            return false;
        }
        this.classPath = sc.hasOwn(props, 'classPath') ? props.classPath : new ClassPath(props);
        this.classPath.setOwner(props);
        // check if the storage was activated:
        if(sc.isTrue(props, 'persistence')){
            // check if the owner has the required persisData methods in the case the storage is active:
            if(!sc.hasOwn(props.owner, 'persistData') || typeof props.owner.persistData !== 'function'){
                Logger.critical('Required method "persistData" not found in SkillsServer props.owner.');
                return false;
            }
            this.dataServer = DataServerValidator.getValidDataServer(props);
            let storageObserverProps = {
                classPath: this.classPath,
                dataServer: this.dataServer
            };
            let modelsManager = sc.get(props, 'modelsManager', false);
            if(modelsManager){
                storageObserverProps.modelsManager = modelsManager;
            }
            this.storageObserver = new StorageObserver(storageObserverProps);
            this.storageObserver.registerListeners();
        }
        if(sc.hasOwn(props, 'client')){
            // @NOTE: client must implement the "send" method which will be used to send the current action data.
            if(typeof props.client.send !== 'function'){
                Logger.critical('Required method "send" not found in SkillsServer props.client.');
                return false;
            }
            if(typeof props.client.broadcast !== 'function'){
                Logger.critical('Property "broadcast" found in SkillsServer props.client but is not a function.');
                return false;
            }
            this.client = new Sender(this.classPath, props.client);
            this.client.registerListeners();
        }
        this.classPath.init(props).catch((err) => {
            Logger.critical('Broken class. '+err);
            return false;
        });
    }
}

module.exports = SkillsServer;
