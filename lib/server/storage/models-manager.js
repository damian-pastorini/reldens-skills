/**
 *
 * Reldens - Skills - ModelsManager
 *
 */

const ClassPath = require('../../class-path');
const Level = require('../../level');
const { DataServerValidator } = require('../data-server-validator');
const { Modifier, Condition } = require('@reldens/modifiers');
const { ErrorManager, Logger, EventsManagerSingleton, sc } = require('@reldens/utils');

class ModelsManager
{

    constructor(props)
    {
        this.dataServer = DataServerValidator.getValidDataServer(props, this);
        this.events = (props && sc.hasOwn(props, 'events')) ? props.events : EventsManagerSingleton;
    }

    async loadOwnerClassPath(ownerId)
    {
        return this.dataServer.entityManager.get('ownersClassPath')
            .loadOneByWithRelations('owner_id', ownerId, '[owner_full_class_path]');
    }

    async updateLevel(levelsSet)
    {
        return this.dataServer.entityManager.get('ownersClassClassPath')
            .updateBy('owner_id', levelsSet.getOwnerId(), {currentLevel: levelsSet.currentLevel})
    }

    async updateExperience(levelsSet)
    {
        return this.dataServer.entityManager.get('ownersClassClassPath')
            .updateBy('owner_id', levelsSet.getOwnerId(), {currentExp: levelsSet.currentExp})
    }

    // @TODO - BETA - Create a skills instances generator class to replace this function.
    async prepareSkillsInstancesList(skillsClasses)
    {
        let result = {};
        // @TODO - BETA - Replace relations by constants on the registered-entities definition.
        //       This way we will be able to use the get method, save the entity in a variable and call the relations
        //       list from it.
        let skillsModels = await this.dataServer.entityManager.get('skill').loadAllWithRelations([
            'skill_owner_conditions',
            'skill_owner_effects',
            'skill_target_effects'
        ]);
        if(skillsModels.length){
            let skillsList = {};
            for(let skillModel of skillsModels){
                let skillClass = sc.hasOwn(skillsClasses, skillModel.type) ? skillsClasses[skillModel.type] : false;
                if(!skillClass){
                    ErrorManager.error('Undefined skill type in skillsList:' + skillModel.type);
                }
                // force to use the same events manager instance used on the main package:
                skillModel.events = this.events;
                skillsList[skillModel.key] = {class: skillClass, data: skillModel};
            }
            result = {skillsModels, skillsList};
        }
        return result;
    }

    // @TODO - BETA - Create a class path instances generator class to replace this function.
    async prepareClassPathInstancesList(classPathClasses)
    {
        let result = {};
        let classPathModels = await this.dataServer.entityManager.get('classPath').executeCustomQuery('fullPathData');
        if(sc.isArray(classPathModels) && classPathModels.length){
            let classPathsById = {};
            let classPathsByKey = {};
            for(let classPathModel of classPathModels){
                let classPathClass = ClassPath;
                if(sc.hasOwn(classPathClasses, classPathModel.key)){
                    classPathClass = classPathClasses[classPathModel.key];
                }
                let classPathData = {class: classPathClass, data: classPathModel};
                classPathModel.classPathLevels = this.getClassPathLevels(
                    classPathModel.skills_levels_set.skills_levels_set_levels
                );
                classPathModel.labelsByLevel = this.parseLabelsByLevels(classPathModel.skills_class_path_level_labels);
                classPathsById[classPathModel.id] = classPathData;
                classPathsByKey[classPathModel.key] = classPathData;
            }
            result = {classPathModels: classPathModels, classPathsById, classPathsByKey};
        }
        return result;
    }

    parseLabelsByLevels(levelLabelsModel)
    {
        let labelsByLevel = {};
        for(let labelData of levelLabelsModel){
            labelsByLevel[labelData['label_level'].key] = labelData.label;
        }
        return labelsByLevel;
    }

    getClassPathLevels(levelsModels)
    {
        let levels = {};
        for(let levelData of levelsModels){
            let levelModifiers = [];
            if(levelData['level_modifiers'].length){
                for(let modifierData of levelData['level_modifiers']){
                    let modifier = new Modifier(modifierData);
                    levelModifiers.push(modifier);
                }
            }
            levelData.modifiers = levelModifiers;
            let levelKey = parseInt(levelData['key']);
            levelData.key = levelKey;
            levels[levelKey] = new Level(levelData);
        }
        return levels;
    }

    async prepareClassPathData(owner, ownerIdProperty, classPathsListById, skillsClassesList)
    {
        // @TODO - BETA - Temporal one class path per player, we will have optional multiple classes.
        let currentPlayerClassPath = await this.loadOwnerClassPath(owner[ownerIdProperty]);
        if(!currentPlayerClassPath){
            Logger.error(['Undefined class path for player.', 'ID:', owner[ownerIdProperty]]);
            return false;
        }
        let currentClassPath = classPathsListById[currentPlayerClassPath.class_path_id];
        let skillsByLevel = this.parseSkillsByLevels(
            currentClassPath.data.skills_class_path_level_skills,
            owner,
            ownerIdProperty,
            skillsClassesList
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

    // @TODO - BETA - Create a skills generator class to replace this function.
    parseSkillsByLevels(levelSkillsModel, owner, ownerIdProperty, skillsClassesList)
    {
        let skillsByLevel = {};
        for(let skillData of levelSkillsModel){
            let levelKey = parseInt(skillData['class_path_level'].key);
            if(!sc.hasOwn(skillsByLevel, levelKey)){
                skillsByLevel[levelKey] = {};
            }
            let skillModel = skillData.class_path_level_skill;
            skillModel.owner = owner;
            skillModel.ownerIdProperty = ownerIdProperty;
            skillModel.events = this.events;
            // @TODO - BETA - Make attack properties configurable.
            if(sc.isTrue(skillModel, 'skill_attack')){
                skillModel['attackProperties'] = skillModel['skill_attack'].attackProperties.split(',');
                skillModel['defenseProperties'] = skillModel['skill_attack'].defenseProperties.split(',');
                skillModel['aimProperties'] = skillModel['skill_attack'].aimProperties.split(',');
                skillModel['dodgeProperties'] = skillModel['skill_attack'].dodgeProperties.split(',');
                let attackProps = [
                    'affectedProperty',
                    'allowEffectBelowZero',
                    'hitDamage',
                    'applyDirectDamage',
                    'dodgeFullEnabled',
                    'dodgeOverAimSuccess',
                    'damageAffected',
                    'criticalAffected'
                ];
                for(let i of attackProps){
                    skillModel[i] = skillModel['skill_attack'][i];
                }
            }
            // @TODO - BETA - Make physical properties configurable.
            if(sc.isTrue(skillModel, 'skill_physical_data')){
                let physicalProps = [
                    'magnitude',
                    'objectWidth',
                    'objectHeight',
                    'validateTargetOnHit'
                ];
                for(let i of physicalProps){
                    skillModel[i] = skillModel['skill_physical_data'][i];
                }
            }
            if(sc.isTrue(skillModel, 'skill_owner_conditions')){
                skillModel.ownerConditions = [];
                for(let conditionData of skillModel['skill_owner_conditions']){
                    conditionData['propertyKey'] = conditionData['property_key'];
                    let skillCondition = new Condition(conditionData);
                    skillModel.ownerConditions.push(skillCondition);
                }
            }
            if(sc.isTrue(skillModel, 'skill_owner_effects')){
                // @NOTE: skill effects are just modifiers that will affect the skill owner.
                let skillEffects = [];
                for(let effectData of skillModel['skill_owner_effects']){
                    let effectModifier = new Modifier(effectData);
                    skillEffects.push(effectModifier);
                }
                skillModel.ownerEffects = skillEffects;
            }
            if(sc.isTrue(skillModel, 'skill_target_effects')){
                // @NOTE: skill effects are just modifiers that will affect the skill owner.
                let skillEffects = [];
                for(let effectData of skillModel['skill_target_effects']){
                    let effectModifier = new Modifier(effectData);
                    skillEffects.push(effectModifier);
                }
                skillModel.targetEffects = skillEffects;
            }
            skillsByLevel[levelKey][skillModel.key] = new skillsClassesList[skillModel.key]['class'](skillModel);
        }
        return skillsByLevel;
    }

}

module.exports.ModelsManager = ModelsManager;
