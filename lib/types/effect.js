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
const { Logger, sc } = require('@reldens/utils');

class Effect extends Skill
{

    constructor(props)
    {
        super(props);
        this.type = SkillsConst.SKILL.TYPE.EFFECT;
        let targetEffects = sc.get(props, 'targetEffects');
        if(!targetEffects){
            Logger.error('Missing targetEffects for skill.');
            this.isReady = false;
        }
        this.targetEffects = targetEffects;
    }

    async runSkillLogic()
    {
        this.lastState = null;
        if(!this.target || !this.owner){
            this.lastState = SkillsConst.SKILL_STATES.TARGET_NOT_AVAILABLE;
            return false;
        }
        if(!this.isInRange(this.owner.getPosition(), this.target.getPosition())){
            this.lastState = SkillsConst.SKILL_STATES.OUT_OF_RANGE;
            // out of range, the owner or the target could move away
            return false;
        }
        this.lastState = SkillsConst.SKILL_STATES.APPLYING_EFFECTS;
        // @NOTE: the difference between the normal skills modifiers and the effects are the critical chance applied
        // to the modifiers here.
        this.applyModifiers(this.targetEffects, this.target);
        this.lastState = SkillsConst.SKILL_STATES.APPLIED_EFFECTS;
        await this.fireEvent(SkillsEvents.SKILL_EFFECT_TARGET_MODIFIERS, this);
        return true;
    }

}

module.exports = Effect;
