/**
 *
 * Reldens - Skills - SkillAttackModel
 *
 */

const { MikroOrmCore } = require('@reldens/storage');
const { EntitySchema } = MikroOrmCore;

class SkillAttackModel
{

    beforeDestroyCalled = 0;
    afterDestroyCalled = 0;

    constructor(
        skill_id,
        affectedProperty,
        allowEffectBelowZero,
        hitDamage,
        applyDirectDamage,
        attackProperties,
        defenseProperties,
        aimProperties,
        dodgeProperties,
        dodgeFullEnabled,
        dodgeOverAimSuccess,
        damageAffected,
        criticalAffected
    ){
        this.skill_id = skill_id;
        this.affectedProperty = affectedProperty;
        this.allowEffectBelowZero = allowEffectBelowZero;
        this.hitDamage = hitDamage;
        this.applyDirectDamage = applyDirectDamage;
        this.attackProperties = attackProperties;
        this.defenseProperties = defenseProperties;
        this.aimProperties = aimProperties;
        this.dodgeProperties = dodgeProperties;
        this.dodgeFullEnabled = dodgeFullEnabled;
        this.dodgeOverAimSuccess = dodgeOverAimSuccess;
        this.damageAffected = damageAffected;
        this.criticalAffected = criticalAffected;
    }

    static createByProps(props)
    {
        const {
            skill_id,
            affectedProperty,
            allowEffectBelowZero,
            hitDamage,
            applyDirectDamage,
            attackProperties,
            defenseProperties,
            aimProperties,
            dodgeProperties,
            dodgeFullEnabled,
            dodgeOverAimSuccess,
            damageAffected,
            criticalAffected
        } = props;
        return new this(
            skill_id,
            affectedProperty,
            allowEffectBelowZero,
            hitDamage,
            applyDirectDamage,
            attackProperties,
            defenseProperties,
            aimProperties,
            dodgeProperties,
            dodgeFullEnabled,
            dodgeOverAimSuccess,
            damageAffected,
            criticalAffected
        );
    }

    static relationMappings()
    {
        return {
            parent_skill: {
                type: 'SkillModel',
                entityName: 'skill',
                reference: 'm:1',
                join: {
                    from: 'skill_id',
                    to: 'id'
                }
            }
        };
    }

}

const schema = new EntitySchema({
    class: SkillAttackModel,
    properties: {
        _id: {
            primary: true,
            type: 'ObjectID'
        },
        id: {
            type: 'string',
            serializedPrimaryKey: true
        },
        skill_id: {
            type: 'SkillModel',
            reference: 'm:1',
            nullable: true
        },
        affectedProperty: {
            type: 'string'
        },
        allowEffectBelowZero: {
            type: 'boolean'
        },
        hitDamage: {
            type: 'number'
        },
        applyDirectDamage: {
            type: 'boolean'
        },
        attackProperties: {
            type: 'string'
        },
        defenseProperties: {
            type: 'string'
        },
        aimProperties: {
            type: 'string'
        },
        dodgeProperties: {
            type: 'string'
        },
        dodgeFullEnabled: {
            type: 'boolean'
        },
        dodgeOverAimSuccess: {
            type: 'boolean'
        },
        damageAffected: {
            type: 'boolean'
        },
        criticalAffected: {
            type: 'boolean'
        }
    }
});

module.exports = {
    SkillAttackModel,
    entity: SkillAttackModel,
    schema
};
