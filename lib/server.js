/**
 *
 * Reldens - Skills - Server Package
 *
 */

const ClassPath = require('./class-path');
const Sender = require('./server/sender');
const { StorageObserver } = require('./server/storage-observer');
const { DataServerValidator } = require('./server/data-server-validator');
const { ErrorManager, sc, Logger} = require('@reldens/utils');

class SkillsServer
{

    constructor(props)
    {
        if(!sc.hasOwn(props, 'owner')){
            ErrorManager.error('Undefined owner.');
        }
        if(typeof props.owner.getPosition !== 'function'){
            ErrorManager.error('Undefined owner position method.');
        }
        this.classPath = sc.hasOwn(props, 'classPath') ? props.classPath : new ClassPath(props);
        this.classPath.setOwner(props);
        // check if the storage was activated:
        if(sc.isTrue(props, 'persistence')){
            // check if the owner has the required persisData methods in the case the storage is active:
            if(!sc.hasOwn(props.owner, 'persistData') || typeof props.owner.persistData !== 'function'){
                ErrorManager.error('Required method "persistData" not found in SkillsServer props.owner.');
            }
            this.dataServer = DataServerValidator.getValidDataServer(props, this);
            let storageObserverProps = {
                classPath: this.classPath,
                dataServer: this.dataServer
            };
            let modelsManager = sc.getDef(props, 'modelsManager', false);
            if(modelsManager){
                storageObserverProps.modelsManager = modelsManager;
            }
            this.storageObserver = new StorageObserver(storageObserverProps);
            this.storageObserver.registerListeners();
        }
        if(sc.hasOwn(props, 'client')){
            // @NOTE: client must implement the sent method with will be used to send the current action parameters.
            if(typeof props.client.send !== 'function'){
                ErrorManager.error('Required method "send" not found in SkillsServer props.client.');
            }
            if(typeof props.client.broadcast !== 'function'){
                ErrorManager.error('Property "broadcast" found in SkillsServer props.client but is not a function.');
            }
            this.client = new Sender(this.classPath, props.client);
            this.client.registerListeners();
        }
        this.classPath.init(props).catch((err) => {
            ErrorManager.error('Broken class. '+err);
        });
    }

}

module.exports = SkillsServer;
