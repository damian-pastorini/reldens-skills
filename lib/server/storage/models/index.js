
const { ClassPathModel } = require('./class-path');
const { ClassPathLevelLabelsModel } = require('./class-path-level-labels');
const { ClassPathLevelSkillsModel } = require('./class-path-level-skills');
const { LevelModel } = require('./level');
const { LevelModifiersModels } = require('./level-modifiers');
const { LevelsSetModel } = require('./levels-set');
const { OwnersClassPathModel } = require('./owners-class-path');
const { SkillModel } = require('./skill');
const { SkillAttackModel } = require('./skill-attack');
const { SkillTargetEffectsModel } = require('./skill-target-effects');
const { SkillPhysicalDataModel } = require('./skill-physical-data');
const { SkillGroupRelationModel } = require('./skill-group-relation');
const { SkillOwnerConditionsModel } = require('./skill-owner-conditions');
const { SkillOwnerEffectsModel } = require('./skill-owner-effects');
const { SkillsGroupsModel } = require('./skills-groups');

module.exports = {
    classPath: ClassPathModel,
    classPathLevelLabels: ClassPathLevelLabelsModel,
    classPathLevelSkills: ClassPathLevelSkillsModel,
    level: LevelModel,
    levelModifiers: LevelModifiersModels,
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
