/**
 *
 * Reldens - Skills - Server Package
 *
 */

const ClassPath = require('./class-path');
const { StorageObserver } = require('./server/storage-observer');
const Sender = require('./server/sender');
const { Logger, ErrorManager, sc } = require('@reldens/utils');

class SkillsServer
{

    constructor(props)
    {
        if(!sc.hasOwn(props, 'owner')){
            ErrorManager.error('Undefined owner.');
        }
        this.classPath = sc.hasOwn(props, 'classPath') ? props.classPath : new ClassPath(props);
        // check if the storage was activated:
        if(sc.hasOwn(props, 'persistence') && props.persistence){
            let modelsManager = false;
            if(sc.hasOwn(props, 'modelsManager')){
                modelsManager = props.modelsManager;
            }
            // check if the owner has the required persisData methods in the case the storage is active:
            if(!sc.hasOwn(props.owner, 'persistData') || typeof props.owner.persistData !== 'function'){
                Logger.error('Required method "persistData" not found in SkillsServer props.owner.');
            }
            this.dataServer = new StorageObserver(this.classPath, modelsManager);
            this.dataServer.listenEvents();
        }
        if(sc.hasOwn(props, 'client')){
            // @NOTE: client must implement the sent method with will be used to send the current action parameters.
            if(!sc.hasOwn(props.client, 'send') || typeof props.client.send !== 'function'){
                Logger.error('Required method "send" not found in SkillsServer props.client.');
            }
            if(sc.hasOwn(props.client, 'broadcast') && typeof props.client.broadcast !== 'function'){
                Logger.error('Property "broadcast" found in SkillsServer props.client but is not a function.');
            }
            this.client = new Sender(this.classPath, props.client);
        }
    }

}

module.exports = SkillsServer;
