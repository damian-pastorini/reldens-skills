/**
 *
 * Reldens - Skills - PhysicalSkillRunner
 *
 */

const SkillsConst = require('@reldens/skills/lib/constants');

class PhysicalSkillRunner
{

    static async runSkillLogic(skill)
    {
        if(!skill.validateRange(skill.target)){
            this.lastState = SkillsConst.SKILL_STATES.OUT_OF_RANGE;
            // @NOTE: out of range, the owner or the target could have moved away.
            return false;
        }
        this.lastState = SkillsConst.SKILL_STATES.EXECUTE_PHYSICAL_ATTACK;
        await skill.owner.executePhysicalSkill(skill.target, skill);
        return false;
    }

    static async executeOnHit(target, skill, skillType, runSkillLogicCallback)
    {
        await skill.fireEvent(skillType, skill, target);
        if(skill.validateTargetOnHit && target !== skill.target){
            this.lastState = SkillsConst.SKILL_STATES.PHYSICAL_SKILL_INVALID_TARGET;
            return false;
        }
        if('function' !== typeof runSkillLogicCallback){
            return false;
        }
        this.lastState = SkillsConst.SKILL_STATES.PHYSICAL_SKILL_RUN_LOGIC;
        return await runSkillLogicCallback(target);
    }

}

module.exports.PhysicalSkillRunner = PhysicalSkillRunner;
