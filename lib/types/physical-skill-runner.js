/**
 *
 * Reldens - Skills - PhysicalSkillRunner
 *
 */

class PhysicalSkillRunner
{

    static async runSkillLogic(skill)
    {
        if(!skill.validateRange(skill.target)){
            // out of range, the owner or the target could moved away
            return false;
        }
        await skill.owner.executePhysicalSkill(skill.target, skill);
        return false;
    }

    static async executeOnHit(target, skill, skillType)
    {
        await skill.fireEvent(skillType, skill, target);
        if(!skill.validateTargetOnHit || target === skill.target){
            return await super.runSkillLogic(target);
        }
        return false;
    }

}

module.exports.PhysicalSkillRunner = PhysicalSkillRunner;
