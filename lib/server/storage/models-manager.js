/**
 *
 * Reldens - Skills - ModelsManager
 *
 */

const { ErrorManager, Logger, EventsManagerSingleton, sc } = require('@reldens/utils');
const { ObjectionJsDataServer } = require('@reldens/storage');
const { Modifier, Condition } = require('@reldens/modifiers');
const ClassPath = require('../../class-path');
const Level = require('../../level');
const RegisteredModels = require('./models/index');

class ModelsManager
{

    constructor(props)
    {
        this.dataServer = sc.hasOwn(props, 'dataServer') ? props.dataServer
            : new ObjectionJsDataServer(sc.getDef(props, 'dataServerConfig', {}));
        this.events = (props && sc.hasOwn(props, 'events')) ? props.events : EventsManagerSingleton;
        this.models = RegisteredModels;
    }

    async loadOwnerClassPath(ownerId)
    {
        return this.models.ownersClassPath.loadOwnerClassPath(ownerId);
    }

    async updateLevel(levelsSet)
    {
        return this.models.ownersClassPath
            .updateByOwner(levelsSet.getOwnerId(), {currentLevel: levelsSet.currentLevel});
    }

    async updateExperience(levelsSet)
    {
        return this.models.ownersClassPath
            .updateByOwner(levelsSet.getOwnerId(), {currentExp: levelsSet.currentExp});
    }

    async prepareSkillsInstancesList(skillsClasses)
    {
        let result = {};
        // @TODO: remove the direct call to withGraphFetched from here, create a generic way to add related fields.
        let skillsModels = await this.models.skill.loadAll()
            .withGraphFetched('[skill_owner_conditions, skill_owner_effects, skill_target_effects]');
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

    async prepareClassPathInstancesList(classPathClasses)
    {
        let result = {};
        let classPathModels = await this.models.classPath.fullPathData();
        if(classPathModels.length){
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
        let loadedPlayerClassPath = await this.loadOwnerClassPath(owner[ownerIdProperty]);
        if(!loadedPlayerClassPath.length){
            Logger.error(['Undefined class path for player.', 'ID:', owner[ownerIdProperty]]);
            return false;
        }
        // @TODO - BETA - Temporal index 0 for one class path per player, we will have optional multiple classes.
        let currentPlayerClassPath = loadedPlayerClassPath[0];
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
            // use the same events manager instance from the skills server:
            events: this.events,
            // activate storage:
            persistence: true
        };
    }

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
