/**
 *
 * Reldens - Skills - Receiver
 *
 */

const SkillConst = require('../constants');
const { ErrorManager, Logger, sc } = require('@reldens/utils');

class Receiver
{

    constructor(props)
    {
        if(!sc.hasOwn(props, 'owner')){
            ErrorManager.error('Undefined owner.');
        }
        if(typeof props.owner.getPosition !== 'function'){
            ErrorManager.error('Undefined owner position method.');
        }
        this.actions = sc.get(props, 'actions', {});
        if(!sc.hasOwn(props, 'avoidDefaults') || !props['avoidDefaults']){
            this.setDefaultMethods();
        }
    }

    setDefaultMethods()
    {
        this.actions[SkillConst.ACTION_INIT_LEVEL_SET_START] = 'onInitLevelSetStart';
        this.actions[SkillConst.ACTION_INIT_LEVEL_SET_END] = 'onInitLevelSetEnd';
        this.actions[SkillConst.ACTION_INIT_CLASS_PATH_END] = 'onInitClassPathEnd';
        this.actions[SkillConst.ACTION_LOADED_OWNER_SKILLS] = 'onLoadedOwnerSkills';
        this.actions[SkillConst.ACTION_SET_SKILLS] = 'onSetSkills';
        this.actions[SkillConst.ACTION_SET_LEVELS] = 'onSetLevels';
        this.actions[SkillConst.ACTION_ADD_SKILLS_BEFORE] = 'onAddSkillsBefore';
        this.actions[SkillConst.ACTION_ADD_SKILLS_AFTER] = 'onAddSkillsAfter';
        this.actions[SkillConst.ACTION_REMOVE_SKILLS_BEFORE] = 'onRemoveSkillsBefore';
        this.actions[SkillConst.ACTION_REMOVE_SKILLS_AFTER] = 'onRemoveSkillsAfter';
        this.actions[SkillConst.ACTION_VALIDATE_BEFORE] = 'onValidateBefore';
        this.actions[SkillConst.ACTION_VALIDATE_SUCCESS] = 'onValidateSuccess';
        this.actions[SkillConst.ACTION_VALIDATE_FAIL] = 'onValidateFail';
        this.actions[SkillConst.ACTION_EXECUTING_SKILL] = 'onExecutingSkill';
        this.actions[SkillConst.ACTION_LEVEL_EXPERIENCE_ADDED] = 'onLevelExperienceAdded';
        this.actions[SkillConst.ACTION_LEVEL_UP] = 'onLevelUp';
        this.actions[SkillConst.ACTION_LEVEL_DOWN] = 'onLevelDown';
        this.actions[SkillConst.ACTION_LEVEL_APPLY_MODIFIERS] = 'onLevelApplyModifiers';
        this.actions[SkillConst.ACTION_SKILL_BEFORE_IN_RANGE] = 'onSkillBeforeInRange';
        this.actions[SkillConst.ACTION_SKILL_AFTER_IN_RANGE] = 'onSkillAfterInRange';
        this.actions[SkillConst.ACTION_SKILL_BEFORE_EXECUTE] = 'onSkillBeforeExecute';
        this.actions[SkillConst.ACTION_SKILL_AFTER_EXECUTE] = 'onSkillAfterExecute';
        this.actions[SkillConst.ACTION_SKILL_BEFORE_CAST] = 'onSkillBeforeCast';
        this.actions[SkillConst.ACTION_SKILL_AFTER_CAST] = 'onSkillAfterCast';
        this.actions[SkillConst.ACTION_SKILL_ATTACK_APPLY_DAMAGE] = 'onSkillAttackApplyDamage';
        this.actions[SkillConst.ACTION_SKILL_BEFORE_RUN_LOGIC] = 'onSkillBeforeRunLogic';
        this.actions[SkillConst.ACTION_SKILL_AFTER_RUN_LOGIC] = 'onSkillAfterRunLogic';
        this.actions[SkillConst.ACTION_SKILL_PHYSICAL_ATTACK_HIT] = 'onSkillPhysicalAttackHit';
        this.actions[SkillConst.ACTION_SKILL_PHYSICAL_EFFECT_HIT] = 'onSkillPhysicalEffectHit';
    }

    processMessage(message)
    {
        // don't validate the message if the action prefix is not present or at the beginning of the message action:
        if(!this.isValidMessage(message)){
            // Logger.error(['CHECK NOT AN SKILLS ACTION!', message.act]);
            return false;
        }
        if(!sc.hasOwn(this.actions, message.act)){
            Logger.error('Skills action not found', message.act);
            return false;
        }
        if(typeof this[this.actions[message.act]] !== 'function'){
            // for now I'm leaving this a silent return (will probably end up making the error log configurable):
            Logger.error('Skills action is not a function', message.act);
            return false;
        }
        this[this.actions[message.act]](message);
    }

    isValidMessage(message)
    {
        return (message.act.indexOf(SkillConst.ACTIONS_PREF) === 0);
    }

}

module.exports = Receiver;
