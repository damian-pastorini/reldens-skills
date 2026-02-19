/**
 *
 * Reldens - Skills - Sender
 *
 */

const SkillsConst = require('../constants');
const SkillsEvents = require('../skills-events');
const { Logger, sc } = require('@reldens/utils');

class Sender
{

    constructor(classPath, client = false)
    {
        this.classPath = classPath;
        this.client = client;
    }

    validateClient()
    {
        if(!this.client){
            Logger.critical('Undefined client for Sender.');
            return false;
        }
        return true;
    }

    registerListeners()
    {
        if(!this.validateClient()){
            return;
        }
        let ownerEventKey = this.classPath.getOwnerEventKey();
        this.classPath.listenEvent(
            SkillsEvents.INIT_CLASS_PATH_END,
            this.sendInitClassPathData.bind(this),
            this.classPath.getOwnerUniqueEventKey('initClassPathEndSender'),
            ownerEventKey
        );
        this.classPath.listenEvent(
            SkillsEvents.LEVEL_UP,
            this.sendLevelUpData.bind(this),
            this.classPath.getOwnerUniqueEventKey('levelUpSender'),
            ownerEventKey
        );
        this.classPath.listenEvent(
            SkillsEvents.LEVEL_EXPERIENCE_ADDED,
            this.sendLevelExperienceAdded.bind(this),
            this.classPath.getOwnerUniqueEventKey('expAddSender'),
            ownerEventKey
        );
        this.classPath.listenEvent(
            SkillsEvents.SKILL_BEFORE_CAST,
            this.sendSkillBeforeCastData.bind(this),
            this.classPath.getOwnerUniqueEventKey('skillBeforeCastSender'),
            ownerEventKey
        );
        this.classPath.listenEvent(
            SkillsEvents.SKILL_ATTACK_APPLY_DAMAGE,
            this.sendSkillAttackApplyDamage.bind(this),
            this.classPath.getOwnerUniqueEventKey('skillAttackApplyDamageSender'),
            ownerEventKey
        );
        // @TODO - BETA - Skill cast and damage were missing, do we need to include other events?
    }

    async sendInitClassPathData(classPath)
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
        // @NOTE: we could send just this.currentLabel but better check if there's a specific one for this level and
        // don't send extra information we already have on the client.
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

    async sendLevelUpData(classPath)
    {
        let messageData = {
            lvl: classPath.currentLevel,
            lab: classPath.currentLabel
        };
        if(classPath.skillsByLevelKeys[classPath.currentLevel]){
            // new skills:
            messageData.skl = classPath.skillsByLevelKeys[classPath.currentLevel];
        }
        let nextLevelExp = classPath.getNextLevelExperience();
        if(nextLevelExp > 0){
            // new exp:
            messageData.ne = nextLevelExp;
        }
        await this.runBehaviors(
            messageData,
            SkillsConst.ACTION_LEVEL_UP,
            SkillsConst.BEHAVIOR_SEND,
            classPath.getOwnerId()
        );
    }

    async sendLevelExperienceAdded(classPath)
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

    async sendSkillBeforeCastData(skill, target)
    {
        let messageData = Object.assign({
                skillKey: skill.key
            },
            skill.owner.getPosition()
        );
        if(sc.isFunction(skill.owner.getSkillExtraData)){
            Object.assign(messageData, {extraData: skill.owner.getSkillExtraData({skill, target})});
        }
        await this.runBehaviors(
            messageData,
            SkillsConst.ACTION_SKILL_BEFORE_CAST,
            SkillsConst.BEHAVIOR_BROADCAST,
            skill.getOwnerId()
        );
    }

    async sendSkillAttackApplyDamage(skill, target, damage, newValue)
    {
        let messageData = {d: damage};
        if(sc.isFunction(skill.owner.getSkillExtraData)){
            Object.assign(messageData, {extraData: skill.owner.getSkillExtraData({skill, target})});
        }
        await this.runBehaviors(
            messageData,
            SkillsConst.ACTION_SKILL_ATTACK_APPLY_DAMAGE,
            SkillsConst.BEHAVIOR_BROADCAST,
            skill.getOwnerId()
        );
    }

    async runBehaviors(messageData, actionName, behavior, ownerId)
    {
        // @NOTE: since the sender is a new instance for each SkillsServer, but it's listening on a single EventsManager
        // which fires the event for every player, then we need to check if the current event fired was related to the
        // current player.
        if(this.classPath.getOwnerId() !== ownerId){
            Logger.critical('Skill owners miss match, please review.');
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
