
const { ErrorManager, sc } = require('@reldens/utils');
const SkillsEvents = require('./skills-events');
const LevelsSet = require('./levels-set');

class ClassPath extends LevelsSet
{

    async init(props)
    {
        await super.init(props);
        if(!sc.hasOwn(props, 'key')){
            ErrorManager.error('Undefined key for class path.');
        }
        // key is the code for class-path itself and label y the name that can be used for display:
        this.key = props.key;
        // the label will be the default display name for the class path:
        this.label = sc.hasOwn(props, 'label') ? props.label : props.key;
        // labelsByLevel can be an object of {levelKey: 'path level label'}, the current path level display name.
        // for example: the path "Warrior" (this.label), at level 10 could become "Experienced Warrior".
        this.labelsByLevel = sc.hasOwn(props, 'labelsByLevel') ? props.labelsByLevel : false;
        // the current label is used for the current object instance:
        this.currentLabel = sc.hasOwn(props, 'currentLabel') ?
            props.currentLabel : (
                sc.hasOwn(this.labelsByLevel, this.currentLevel) ? this.labelsByLevel[this.currentLevel] : this.label
            );
        // skillsByLevel can be an object of {levelKey: [skillInstances]}, these will be all the skills available.
        this.skillsByLevel = sc.hasOwn(props, 'skillsByLevel') ? props.skillsByLevel : false;
        this.skillsByLevelKeys = this.getSkillsByLevelKeys();
        // the set of skills for the current object instance:
        if(sc.hasOwn(props, 'currentSkills')){
            this.currentSkills = props.currentSkills;
        } else {
            this.currentSkills = {};
            await this.setOwnerSkills();
        }
        if(sc.hasOwn(props, 'affectedProperty')){
            // the affected property is the one to which the damage calculation will have effect:
            this.affectedProperty = props.affectedProperty;
        }
        await this.fireEvent(SkillsEvents.INIT_CLASS_PATH_END, this);
    }

    async levelUp()
    {
        // @NOTE: the level will be increased in the parent LevelSet call.
        let nextLevel = this.currentLevel + 1;
        if(sc.hasOwn(this.skillsByLevel, nextLevel)){
            await this.addSkills(this.skillsByLevel[nextLevel]);
        }
        if(sc.hasOwn(this.labelsByLevel, nextLevel)){
            this.currentLabel = this.labelsByLevel[nextLevel];
        }
        await super.levelUp();
    }

    async levelDown()
    {
        // @NOTE: the level will be decreased in the parent LevelSet call.
        let previousLevel = this.currentLevel - 1;
        if(sc.hasOwn(this.skillsByLevel, previousLevel)){
            await this.removeSkills(this.skillsByLevel[previousLevel]);
        }
        if(sc.hasOwn(this.labelsByLevel, previousLevel)){
            this.currentLabel = this.labelsByLevel[previousLevel];
        }
        await super.levelDown();
    }

    async addSkills(skills)
    {
        await this.fireEvent(SkillsEvents.ADD_SKILLS_BEFORE, this, skills);
        for(let i of Object.keys(skills)){
            let skill = skills[i];
            this.currentSkills[skill.key] = skill;
        }
        await this.fireEvent(SkillsEvents.ADD_SKILLS_AFTER, this, skills);
    }

    async removeSkills(skills)
    {
        await this.fireEvent(SkillsEvents.REMOVE_SKILLS_BEFORE, this, skills);
        for(let skillKey of skills){
            delete this.currentSkills[skillKey];
        }
        await this.fireEvent(SkillsEvents.REMOVE_SKILLS_AFTER, this, skills);
    }

    async setOwnerSkills()
    {
        for(let i of Object.keys(this.levels)){
            let level = this.levels[i];
            if(this.skillsByLevel && sc.hasOwn(this.skillsByLevel, level.key) && level.key <= this.currentLevel){
                await this.addSkills(this.skillsByLevel[level.key]);
            }
        }
        await this.fireEvent(SkillsEvents.SET_SKILLS, this);
    }

    getSkillsByLevelKeys()
    {
        if(!this.skillsByLevel){
            return false;
        }
        let skillsByLevelKeys = {};
        for(let i of Object.keys(this.skillsByLevel)){
            let level = this.skillsByLevel[i];
            if(!sc.hasOwn(skillsByLevelKeys, level)){
                skillsByLevelKeys[i] = [];
            }
            for(let a of Object.keys(level)){
                let skill = level[a];
                skillsByLevelKeys[i].push(skill.key);
            }
        }
        return skillsByLevelKeys;
    }

}

module.exports = ClassPath;
