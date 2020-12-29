/**
 *
 * Reldens - Skills - StorageObserver
 *
 */

const { ModelsManager } = require('./storage/models-manager');
const SkillsEvents = require('../skills-events');

class StorageObserver
{

    constructor(classPath, modelsManager = false)
    {
        this.classPath = classPath;
        if(modelsManager){
            this.modelsManager = modelsManager;
        } else {
            this.modelsManager = new ModelsManager({events: this.classPath.events});
        }
    }

    listenEvents()
    {
        let ownerId = this.classPath.getOwnerId();
        this.classPath.listenEvent(SkillsEvents.LEVEL_UP, async (levelsSet) => {
            await this.modelsManager.updateLevel(levelsSet);
            await levelsSet.owner.persistData();
        }, 'levelUpStorage', 'p'+ownerId);
        this.classPath.listenEvent(SkillsEvents.LEVEL_EXPERIENCE_ADDED, async (levelsSet) => {
            return this.modelsManager.updateExperience(levelsSet);
        }, 'expAddStorage', 'p'+ownerId);
    }

}

module.exports.StorageObserver = StorageObserver;
