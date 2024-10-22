/**
 *
 * Reldens - Skills - ModelsManager
 *
 */

const { ClassPathGenerator } = require('./class-path-generator');
const { DataServerValidator } = require('../data-server-validator');
const { SkillsGenerator } = require('./skills-generator');
const { EventsManagerSingleton, Logger, sc } = require('@reldens/utils');

class ModelsManager
{

    constructor(props)
    {
        this.dataServer = DataServerValidator.getValidDataServer(props);
        this.events = (props && sc.hasOwn(props, 'events')) ? props.events : EventsManagerSingleton;
    }

    getEntity(entityName)
    {
        return this.dataServer.entityManager.get(entityName);
    }

    async loadOwnerClassPath(ownerId)
    {
        return await this.getEntity('ownersClassPath').loadOneByWithRelations(
            'owner_id',
            ownerId,
            'owner_full_class_path'
        );
    }

    async updateLevel(levelsSet)
    {
        return await this.getEntity('ownersClassPath').updateBy(
            'owner_id',
            levelsSet.getOwnerId(),
            {currentLevel: levelsSet.currentLevel}
        );
    }

    async updateExperience(levelsSet)
    {
        return await this.getEntity('ownersClassPath').updateBy(
            'owner_id',
            levelsSet.getOwnerId(),
            {currentExp: levelsSet.currentExp}
        );
    }

    async generateSkillsDataFromModels(skillsClasses)
    {
        // @TODO - BETA - Replace relations by constants on the registered-entities definition.
        //   This way we will be able to use the get method, save the entity in a variable and call the relations list
        //   from it.
        let skillsModels = await this.getEntity('skill').loadAllWithRelations([
            'skill_attack',
            'skill_physical_data',
            'skill_owner_conditions',
            'skill_owner_effects',
            'skill_target_effects'
        ]);
        return SkillsGenerator.dataFromSkillsModelsWithClasses(skillsModels, skillsClasses, this.events);
    }

    async generateClassPathInstances(classPathClasses)
    {
        // @TODO - BETA - Remove the executeCustomQuery.
        return ClassPathGenerator.fromClassPathModels(
            await this.getEntity('classPath').executeCustomQuery('fullPathData'),
            classPathClasses
        );
    }

    // @TODO - Refactor or remove this method.
    async prepareClassPathData(owner, ownerIdProperty, classPathsListById, skillsClassesList)
    {
        // @TODO - BETA - Temporal one class path per player, we will have optional multiple classes.
        let currentPlayerClassPath = await this.loadOwnerClassPath(owner[ownerIdProperty]);
        if(!currentPlayerClassPath){
            Logger.error(['Undefined class path for player.', 'ID:', owner[ownerIdProperty]]);
            return false;
        }
        let currentClassPath = classPathsListById[currentPlayerClassPath.class_path_id];
        let skillsByLevel = SkillsGenerator.skillsByLevelsFromSkillsModels(
            currentClassPath.data.skills_class_path_level_skills,
            owner,
            ownerIdProperty,
            skillsClassesList,
            this.events
        );
        return {
            key: currentClassPath.data.key,
            label: currentClassPath.data.label,
            owner,
            ownerIdProperty,
            levels: currentClassPath.data.classPathLevels,
            labelsByLevel: currentClassPath.data.labelsByLevel,
            skillsByLevel,
            autoFillRanges: currentClassPath.data.skills_levels_set.autoFillRanges,
            autoSortLevels: currentClassPath.data.skills_levels_set.autoSortLevels,
            currentLevel: currentPlayerClassPath.currentLevel,
            currentExp: currentPlayerClassPath.currentExp,
        };
    }

}

module.exports.ModelsManager = ModelsManager;
