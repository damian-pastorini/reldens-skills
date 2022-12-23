/**
 *
 * Reldens - Skills - Effect
 *
 * This class provides a skill with modifiers that will be applied on the target object when the skill is executed.
 *
 */

const Skill = require('../skill');
const SkillsEvents = require('../skills-events');
const SkillsConst = require('../constants');
const { ErrorManager, sc } = require('@reldens/utils');

class Effect extends Skill
{

    constructor(props)
    {
        super(props);
        this.type = SkillsConst.SKILL_TYPE_EFFECT;
        if(!sc.hasOwn(props, 'targetEffects')){
            ErrorManager.error('Missing targetEffects for skill.');
        }
        this.targetEffects = props.targetEffects;
    }

    async runSkillLogic()
    {
        if(!this.validateRange(this.target)){
            this.lastState = SkillsConst.SKILL_STATES.OUT_OF_RANGE;
            // out of range, the owner or the target could moved away
            return false;
        }
        this.lastState = SkillsConst.SKILL_STATES.APPLYING_EFFECTS;
        // @NOTE: the difference between the normal skills modifiers and the effects are the critical chance applied
        // to the modifiers here.
        this.applyModifiers(this.targetEffects, this.target);
        this.lastState = SkillsConst.SKILL_STATES.APPLIED_EFFECTS;
        await this.fireEvent(SkillsEvents.SKILL_EFFECT_TARGET_MODIFIERS, this);
    }

}

module.exports = Effect;
