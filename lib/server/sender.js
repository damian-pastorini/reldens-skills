/**
 *
 * Reldens - Skills - Sender
 *
 */

const { ErrorManager } = require('@reldens/utils');
const SkillsConst = require('../constants');
const SkillsEvents = require('../skills-events');

class Sender
{

    constructor(classPath, client = false)
    {
        if(!client){
            ErrorManager.error('Undefined client for Sender.');
        }
        this.classPath = classPath;
        this.client = client;
        this.listenEvents();
    }

    listenEvents()
    {
        // eslint-disable-next-line no-unused-vars
        this.classPath.events.on(SkillsEvents.LEVEL_UP, async (classPath) => {
            let messageData = {
                lvl: classPath.currentLevel,
                exp: classPath.currentExp
            };
            if(classPath.skillsByLevelKeys[classPath.currentLevel]){
                messageData.ns = classPath.skillsByLevelKeys[classPath.currentLevel];
            }
            // @NOTE: we could send just this.currentLabel but better check if there's an specific one for this level
            // and don't send extra information we already have on the client.
            if(classPath.labelsByLevel[classPath.currentLevel]){
                messageData.nl = classPath.labelsByLevel[classPath.currentLevel];
            }
            await this.runBehaviors(
                messageData,
                SkillsConst.ACTION_LEVEL_UP,
                SkillsConst.BEHAVIOR_SEND,
                classPath.getOwnerId()
            );
        });
    }

    async runBehaviors(messageData, actionName, behavior, ownerId)
    {
        // @NOTE: since the sender is a new instance for each SkillsServer but it's listening on a single EventsManager
        // which fires the event for every player then we need to check if the current event fired was related to the
        // current player.
        if(this.classPath.getOwnerId() !== ownerId){
            return false;
        }
        if(behavior === SkillsConst.BEHAVIOR_BROADCAST || behavior === SkillsConst.BEHAVIOR_BOTH){
            await this.client.broadcast({act: actionName, owner: ownerId, data: messageData});
        }
        if(behavior === SkillsConst.BEHAVIOR_SEND || behavior === SkillsConst.BEHAVIOR_BOTH){
            await this.client.send({act: actionName, owner: ownerId, data: messageData});
        }
    }

}

module.exports = Sender;
