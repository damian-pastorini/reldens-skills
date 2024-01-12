/**
 *
 * Reldens - Skills - StorageObserver
 *
 */

const { ModelsManager } = require('./storage/models-manager');
const { DataServerValidator } = require('./data-server-validator');
const SkillsEvents = require('../skills-events');
const { Logger, sc } = require('@reldens/utils');

class StorageObserver
{

    constructor(props)
    {
        this.classPath = props.classPath;
        if(!this.classPath){
            Logger.error('Class Path data undefined for Storage Observer.');
        }
        let modelsManagerConfig = sc.get(props, 'modelsManagerConfig', {});
        if(this.classPath.events){
            modelsManagerConfig['events'] = this.classPath.events;
        }
        this.dataServer = DataServerValidator.getValidDataServer(props);
        modelsManagerConfig['dataServer'] = this.dataServer;
        this.modelsManager = sc.isTrue(props, 'modelsManager') // @NOTE: can't use getDef because it could be false.
            ? props.modelsManager
            : new ModelsManager(modelsManagerConfig);
        if(!this.modelsManager){
            Logger.error('ModelsManager undefined for Skills Storage Observer.');
        }
    }

    registerListeners()
    {
        let ownerEventKey = this.classPath.getOwnerEventKey();
        this.classPath.listenEvent(
            SkillsEvents.LEVEL_UP,
            this.saveLevelUpData.bind(this),
            this.classPath.getOwnerUniqueEventKey('levelUpStorage'),
            ownerEventKey
        );
        this.classPath.listenEvent(
            SkillsEvents.LEVEL_EXPERIENCE_ADDED,
            this.updateExperience.bind(this),
            this.classPath.getOwnerUniqueEventKey('expAddStorage'),
            ownerEventKey
        );
        this.classPath.listenEvent(
            SkillsEvents.SKILL_APPLY_OWNER_EFFECTS,
            this.saveOwnerData.bind(this),
            this.classPath.getOwnerUniqueEventKey('applyOwnerEffectsStorage'),
            ownerEventKey
        );
        this.classPath.listenEvent(
            SkillsEvents.SKILL_EFFECT_TARGET_MODIFIERS,
            this.saveTargetData.bind(this),
            this.classPath.getOwnerUniqueEventKey('applyTargetEffectsStorage'),
            ownerEventKey
        );
    }

    async saveTargetData(skill)
    {
        if(!sc.isFunction(skill?.target?.persistData)){
            return false;
        }
        return await skill.target.persistData();
    }

    async saveOwnerData(skill)
    {
        return await skill.owner.persistData();
    }

    async updateExperience(levelsSet)
    {
        return await this.modelsManager.updateExperience(levelsSet);
    }

    async saveLevelUpData(levelsSet)
    {
        await this.modelsManager.updateLevel(levelsSet);
        return await levelsSet.owner.persistData();
    }
}

module.exports.StorageObserver = StorageObserver;
