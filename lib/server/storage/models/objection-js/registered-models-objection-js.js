/**
 *
 * Reldens - Skills - Registered Entities
 *
 */

const { ClassPathModel } = require('./class-path-model');
const { ClassPathLevelLabelsModel } = require('./class-path-level-labels-model');
const { ClassPathLevelSkillsModel } = require('./class-path-level-skills-model');
const { LevelModel } = require('./level-model');
const { LevelModifiersModel } = require('./level-modifiers-model');
const { LevelsSetModel } = require('./levels-set-model');
const { OwnersClassPathModel } = require('./owners-class-path-model');
const { SkillModel } = require('./skill-model');
const { SkillAttackModel } = require('./skill-attack-model');
const { SkillTargetEffectsModel } = require('./skill-target-effects-model');
const { SkillPhysicalDataModel } = require('./skill-physical-data-model');
const { SkillGroupRelationModel } = require('./skill-group-relation-model');
const { SkillOwnerConditionsModel } = require('./skill-owner-conditions-model');
const { SkillOwnerEffectsModel } = require('./skill-owner-effects-model');
const { SkillsGroupsModel } = require('./skills-groups-model');

module.exports.rawRegisteredEntities = {
    classPath: ClassPathModel,
    classPathLevelLabels: ClassPathLevelLabelsModel,
    classPathLevelSkills: ClassPathLevelSkillsModel,
    level: LevelModel,
    levelModifiers: LevelModifiersModel,
    levelsSet: LevelsSetModel,
    ownersClassPath: OwnersClassPathModel,
    skill: SkillModel,
    skillAttack: SkillAttackModel,
    skillTargetEffects: SkillTargetEffectsModel,
    skillPhysicalData: SkillPhysicalDataModel,
    skillGroupRelation: SkillGroupRelationModel,
    skillOwnerConditions: SkillOwnerConditionsModel,
    skillOwnerEffects: SkillOwnerEffectsModel,
    skillGroups: SkillsGroupsModel
};
