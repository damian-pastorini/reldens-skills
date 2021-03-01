/**
 *
 * Reldens - Skills - Events list
 *
 */

// @NOTE: events names are long because these need to be descriptive.

let pref = 'reldens.skills.';

module.exports = {
    PREF: pref,
    INIT_LEVEL_SET_START: pref+'initLevelSetStart',
    INIT_LEVEL_SET_END: pref+'initLevelSetEnd',
    INIT_CLASS_PATH_END: pref+'initClassPathEnd',
    LOADED_OWNER_SKILLS: pref+'loadedOwnerSkills',
    SET_SKILLS: pref+'setSkills',
    SET_LEVELS: pref+'setLevels',
    GENERATED_LEVELS: pref+'generatedLevels',
    ADD_SKILLS_BEFORE: pref+'addSkillBefore',
    ADD_SKILLS_AFTER: pref+'addSkillAfter',
    REMOVE_SKILLS_BEFORE: pref+'removeSkillBefore',
    REMOVE_SKILLS_AFTER: pref+'removeSkillAfter',
    VALIDATE_BEFORE: pref+'beforeValidate',
    VALIDATE_SUCCESS: pref+'validateSuccess',
    VALIDATE_FAIL: pref+'validateFail',
    EXECUTING_SKILL: pref+'executingSkill',
    LEVEL_EXPERIENCE_ADDED: pref+'experienceAdded',
    LEVEL_UP: pref+'levelUp',
    LEVEL_DOWN: pref+'levelDown',
    LEVEL_APPLY_MODIFIERS: pref+'levelApplyModifiers',
    SKILL_BEFORE_IN_RANGE: pref+'beforeIsInRange',
    SKILL_AFTER_IN_RANGE: pref+'afterIsInRange',
    SKILL_BEFORE_EXECUTE: pref+'beforeExecute',
    SKILL_AFTER_EXECUTE: pref+'afterExecute',
    SKILL_BEFORE_CAST: pref+'beforeCast',
    SKILL_AFTER_CAST: pref+'afterCast',
    SKILL_BEFORE_RUN_LOGIC: pref+'beforeRunLogic',
    SKILL_AFTER_RUN_LOGIC: pref+'afterRanLogic',
    SKILL_APPLY_OWNER_EFFECTS: pref+'applyOwnerEffects',
    SKILL_ATTACK_APPLY_DAMAGE: pref+'attackApplyDamage',
    SKILL_EFFECT_TARGET_MODIFIERS: pref+'effectTargetModifiers',
    SKILL_PHYSICAL_ATTACK_HIT: pref+'physicalAttackOnHit',
    SKILL_PHYSICAL_EFFECT_HIT: pref+'physicalEffectOnHit'
};
