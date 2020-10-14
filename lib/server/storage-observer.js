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
            this.modelsManager = new ModelsManager();
        }
    }

    listenEvents()
    {
        let ownerId = this.classPath.getOwnerId();
        this.classPath.events.on(SkillsEvents.LEVEL_UP, async (levelsSet) => {
            if(ownerId !== levelsSet.getOwnerId()){
                return false;
            }
            return this.modelsManager.updateLevel(levelsSet);
        });
        this.classPath.events.on(SkillsEvents.LEVEL_EXPERIENCE_ADDED, async (levelsSet) => {
            if(ownerId !== levelsSet.getOwnerId()){
                return false;
            }
            return this.modelsManager.updateExperience(levelsSet);
        });
    }

}

module.exports.StorageObserver = StorageObserver;
