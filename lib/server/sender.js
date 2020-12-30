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
    }

    registerListeners()
    {
        this.classPath.listenEvent(SkillsEvents.INIT_CLASS_PATH_END, async (classPath) => {
            await this.onInitClassPathEndSend(classPath);
        }, 'initClassPathEndSender', this.getEventMasterKey());
        // eslint-disable-next-line no-unused-vars
        this.classPath.listenEvent(SkillsEvents.LEVEL_UP, async (classPath) => {
            await this.onLevelUpSend(classPath);
        }, 'levelUpSender', this.getEventMasterKey());
        this.classPath.listenEvent(SkillsEvents.LEVEL_EXPERIENCE_ADDED, async (classPath) => {
            await this.onLevelExperienceAddedSend(classPath);
        }, 'expAddSender', this.getEventMasterKey());
        // @TODO - BETA.17 - CHECK: here skill cast was missing, do we need to include other events?
        // eslint-disable-next-line no-unused-vars
        this.classPath.listenEvent(SkillsEvents.SKILL_BEFORE_CAST, async (skill, target) => {
            await this.onSkillBeforeCastSend(skill, target);
        }, 'skillBeforeCastSender', this.getEventMasterKey());
    }

    async onInitClassPathEndSend(classPath)
    {
        let messageData = {
            lvl: classPath.currentLevel,
            lab: classPath.currentLabel,
            exp: classPath.currentExp,
            skl: Object.keys(classPath.currentSkills),
        };
        let nextLevelExp = classPath.getNextLevelExperience();
        if(nextLevelExp > 0){
            messageData.ne = nextLevelExp;
        }
        // @NOTE: we could send just this.currentLabel but better check if there's an specific one for this level
        // and don't send extra information we already have on the client.
        if(classPath.labelsByLevel[classPath.currentLevel]){
            messageData.nl = classPath.labelsByLevel[classPath.currentLevel];
        }
        await this.runBehaviors(
            messageData,
            SkillsConst.ACTION_INIT_CLASS_PATH_END,
            SkillsConst.BEHAVIOR_SEND,
            classPath.getOwnerId()
        );
    }

    async onLevelUpSend(classPath)
    {
        let messageData = {
            lvl: classPath.currentLevel,
            lab: classPath.currentLabel
        };
        let nextLevelExp = classPath.getNextLevelExperience();
        if(nextLevelExp > 0){
            // new exp:
            messageData.ne = nextLevelExp;
        }
        if(classPath.skillsByLevelKeys[classPath.currentLevel]){
            // new skills:
            messageData.skl = classPath.skillsByLevelKeys[classPath.currentLevel];
        }
        // @NOTE: we could send just this.currentLabel but better check if there's an specific one for this level
        // and don't send extra information we already have on the client.
        if(classPath.labelsByLevel[classPath.currentLevel]){
            // new label:
            messageData.nl = classPath.labelsByLevel[classPath.currentLevel];
        }
        await this.runBehaviors(
            messageData,
            SkillsConst.ACTION_LEVEL_UP,
            SkillsConst.BEHAVIOR_SEND,
            classPath.getOwnerId()
        );
    }

    async onLevelExperienceAddedSend(classPath)
    {
        let messageData = {
            exp: classPath.currentExp
        };
        await this.runBehaviors(
            messageData,
            SkillsConst.ACTION_LEVEL_EXPERIENCE_ADDED,
            SkillsConst.BEHAVIOR_SEND,
            classPath.getOwnerId()
        );
    }

    async onSkillBeforeCastSend(skill, target)
    {
        let messageData = Object.assign({
                skillKey: skill.key
            },
            skill.owner.getPosition()
        );
        if(typeof skill.owner.getSkillExtraData === 'function'){
            Object.assign(messageData, {extraData: skill.owner.getSkillExtraData({skill, target})});
        }
        await this.runBehaviors(
            messageData,
            SkillsConst.ACTION_SKILL_BEFORE_CAST,
            SkillsConst.BEHAVIOR_BROADCAST,
            skill.getOwnerId()
        );
    }

    async runBehaviors(messageData, actionName, behavior, ownerId)
    {
        // @NOTE: since the sender is a new instance for each SkillsServer but it's listening on a single EventsManager
        // which fires the event for every player then we need to check if the current event fired was related to the
        // current player.
        if(this.classPath.getOwnerId() !== ownerId){
            ErrorManager.error('IF YOU SEE THIS, SOMETHING IS REALLY WRONG WITH THE SKILL EVENTS.');
            return false;
        }
        if(behavior === SkillsConst.BEHAVIOR_BROADCAST || behavior === SkillsConst.BEHAVIOR_BOTH){
            await this.client.broadcast({act: actionName, owner: ownerId, data: messageData});
        }
        if(behavior === SkillsConst.BEHAVIOR_SEND || behavior === SkillsConst.BEHAVIOR_BOTH){
            await this.client.send({act: actionName, owner: ownerId, data: messageData});
        }
    }

    getEventMasterKey()
    {
        return this.classPath.getOwnerEventKey();
    }

}

module.exports = Sender;
