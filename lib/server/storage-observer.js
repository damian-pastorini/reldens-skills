/**
 *
 * Reldens - Skills - StorageObserver
 *
 */

const { ModelsManager } = require('./storage/models-manager');
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
        let modelsManagerConfig = {};
        if(this.classPath.events){
            modelsManagerConfig['events'] = this.classPath.events;
        }
        if(props.dataServer){
            modelsManagerConfig['dataServer'] = props.dataServer;
        }
        this.modelsManager = sc.getDef(props, 'modelsManager', new ModelsManager(modelsManagerConfig));
    }

    registerListeners()
    {
        let ownerEventKey = this.classPath.getOwnerEventKey();
        this.classPath.listenEvent(SkillsEvents.LEVEL_UP, async (levelsSet) => {
            await this.modelsManager.updateLevel(levelsSet);
            await levelsSet.owner.persistData();
        }, 'levelUpStorage', ownerEventKey);
        this.classPath.listenEvent(SkillsEvents.LEVEL_EXPERIENCE_ADDED, async (levelsSet) => {
            return this.modelsManager.updateExperience(levelsSet);
        }, 'expAddStorage', ownerEventKey);
        // eslint-disable-next-line no-unused-vars
        this.classPath.listenEvent(SkillsEvents.SKILL_APPLY_OWNER_EFFECTS, async (skill, target) => {
            await skill.owner.persistData();
        }, 'applyOwnerEffectsStorage', ownerEventKey);
        this.classPath.listenEvent(SkillsEvents.SKILL_EFFECT_TARGET_MODIFIERS, async (skill) => {
            if(skill.target && typeof skill.target.persistData === 'function'){
                await skill.target.persistData();
            }
        }, 'applyTargetEffectsStorage', ownerEventKey);
    }

}

module.exports.StorageObserver = StorageObserver;
