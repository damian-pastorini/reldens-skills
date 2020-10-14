/**
 *
 * Reldens - Skills - ModelsManager
 *
 */

const { DataServer } = require('@reldens/storage');
const { ClassPathModel } = require('./models/class-path');
const { ClassPathLevelLabelsModel } = require('./models/class-path-level-labels');
const { ClassPathLevelSkillsModel } = require('./models/class-path-level-skills');
const { LevelModel } = require('./models/level');
const { LevelModifiersModels } = require('./models/level-modifiers');
const { LevelsSetModel } = require('./models/levels-set');
const { OwnersClassPathModel } = require('./models/owners-class-path');
const { SkillModel } = require('./models/skill');
const { SkillAttackModel } = require('./models/skill-attack');
const { SkillTargetEffectsModel } = require('./models/skill-target-effects');
const { SkillPhysicalDataModel } = require('./models/skill-physical-data');
const { SkillGroupRelationModel } = require('./models/skill-group-relation');
const { SkillOwnerConditionsModel } = require('./models/skill-owner-conditions');
const { SkillOwnerEffectsModel } = require('./models/skill-owner-effects');
const { SkillsGroupsModel } = require('./models/skills-groups');

class ModelsManager
{

    constructor()
    {
        this.dataServer = DataServer;
        if(!DataServer.initialized){
            DataServer.initialize();
        }
        this.models = {
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
    }

    async loadOwnerClassPath(ownerId)
    {
        return this.models.ownersClassPath.loadOwnerClassPath(ownerId);
    }

    async updateLevel(levelsSet)
    {
        this.models.ownersClassPath.update(levelsSet.getOwnerId(), {currentLevel: levelsSet.currentLevel});
    }

    async updateExperience(levelsSet)
    {
        this.models.ownersClassPath.update(levelsSet.getOwnerId(), {currentExp: levelsSet.currentExp});
    }

}

module.exports.ModelsManager = ModelsManager;
