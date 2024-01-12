/**
 *
 * Reldens - Skills constants
 *
 */

const actionPref = 'rski.';

module.exports = {
    SKILL: {
        TYPE: {
            BASE: 1,
            ATTACK: 2,
            EFFECT: 3,
            PHYSICAL_ATTACK: 4,
            PHYSICAL_EFFECT: 5,
        }
    },
    MODELS_PREFIX: 'skills_',
    BEHAVIOR_SEND: 'send',
    BEHAVIOR_BROADCAST: 'broadcast',
    BEHAVIOR_BOTH: 'both',
    ACTIONS_PREF: actionPref,
    ACTION_INIT_LEVEL_SET_START: actionPref+'ILss',
    ACTION_INIT_LEVEL_SET_END: actionPref+'ILse',
    ACTION_INIT_CLASS_PATH_END: actionPref+'ICpe',
    ACTION_LOADED_OWNER_SKILLS: actionPref+'Los',
    ACTION_SET_SKILLS: actionPref+'Sk',
    ACTION_SET_LEVELS: actionPref+'Sl',
    ACTION_ADD_SKILLS_BEFORE: actionPref+'Asb',
    ACTION_ADD_SKILLS_AFTER: actionPref+'Asa',
    ACTION_REMOVE_SKILLS_BEFORE: actionPref+'Rsb',
    ACTION_REMOVE_SKILLS_AFTER: actionPref+'Rsa',
    ACTION_VALIDATE_BEFORE: actionPref+'Bv',
    ACTION_VALIDATE_SUCCESS: actionPref+'Vs',
    ACTION_VALIDATE_FAIL: actionPref+'Vf',
    ACTION_EXECUTING_SKILL: actionPref+'Es',
    ACTION_LEVEL_EXPERIENCE_ADDED: actionPref+'Ea',
    ACTION_LEVEL_UP: actionPref+'Lu',
    ACTION_LEVEL_DOWN: actionPref+'Ld',
    ACTION_LEVEL_APPLY_MODIFIERS: actionPref+'Apm',
    ACTION_SKILL_BEFORE_IN_RANGE: actionPref+'Bir',
    ACTION_SKILL_AFTER_IN_RANGE: actionPref+'Air',
    ACTION_SKILL_BEFORE_EXECUTE: actionPref+'Be',
    ACTION_SKILL_AFTER_EXECUTE: actionPref+'Ae',
    ACTION_SKILL_BEFORE_CAST: actionPref+'Bc',
    ACTION_SKILL_AFTER_CAST: actionPref+'Ac',
    ACTION_SKILL_ATTACK_APPLY_DAMAGE: actionPref+'Ad',
    ACTION_SKILL_BEFORE_RUN_LOGIC: actionPref+'Brl',
    ACTION_SKILL_AFTER_RUN_LOGIC: actionPref+'Arl',
    ACTION_SKILL_PHYSICAL_ATTACK_HIT: actionPref+'Pah',
    ACTION_SKILL_PHYSICAL_EFFECT_HIT: actionPref+'Peh',
    SKILL_STATES: {
        PHYSICAL_SKILL_INVALID_TARGET: 'physicalSkillInvalidTarget',
        PHYSICAL_SKILL_RUN_LOGIC: 'physicalSkillRunLogic',
        OUT_OF_RANGE: 'outOfRange',
        CAN_NOT_ACTIVATE: 'canNotActivate',
        DODGED: 'dodged',
        APPLYING_DAMAGE: 'applyingDamage',
        APPLIED_DAMAGE: 'appliedDamage',
        APPLIED_CRITICAL_DAMAGE: 'appliedCriticalDamage',
        APPLYING_EFFECTS: 'applyingEffects',
        APPLIED_EFFECTS: 'appliedEffects',
        EXECUTE_PHYSICAL_ATTACK: 'executePhysicalAttack'
    }
};
