#######################################################################################################################

SET FOREIGN_KEY_CHECKS = 0;

#######################################################################################################################

CREATE TABLE IF NOT EXISTS `operation_types` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `label` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `key` int unsigned NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `key` (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE='utf8mb4_unicode_ci';

CREATE TABLE IF NOT EXISTS `skills_class_path` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `label` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `levels_set_id` int unsigned NOT NULL,
  `enabled` int unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `key` (`key`),
  KEY `levels_set_id` (`levels_set_id`),
  CONSTRAINT `FK_skills_class_path_skills_levels_set` FOREIGN KEY (`levels_set_id`) REFERENCES `skills_levels_set` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE='utf8mb4_unicode_ci';

CREATE TABLE IF NOT EXISTS `skills_class_path_level_labels` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `class_path_id` int unsigned NOT NULL,
  `level_id` int unsigned NOT NULL,
  `label` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `class_path_id_level_key` (`class_path_id`,`level_id`) USING BTREE,
  KEY `class_path_id` (`class_path_id`),
  KEY `level_key` (`level_id`) USING BTREE,
  CONSTRAINT `FK__skills_class_path` FOREIGN KEY (`class_path_id`) REFERENCES `skills_class_path` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `FK_skills_class_path_level_labels_skills_levels` FOREIGN KEY (`level_id`) REFERENCES `skills_levels` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE='utf8mb4_unicode_ci';

CREATE TABLE IF NOT EXISTS `skills_class_path_level_skills` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `class_path_id` int unsigned NOT NULL,
  `level_id` int unsigned NOT NULL,
  `skill_id` int unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `class_path_id` (`class_path_id`),
  KEY `skill_id` (`skill_id`),
  KEY `level_key` (`level_id`) USING BTREE,
  CONSTRAINT `FK_skills_class_path_level_skills_skills_class_path` FOREIGN KEY (`class_path_id`) REFERENCES `skills_class_path` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `FK_skills_class_path_level_skills_skills_levels` FOREIGN KEY (`level_id`) REFERENCES `skills_levels` (`key`) ON UPDATE CASCADE,
  CONSTRAINT `FK_skills_class_path_level_skills_skills_levels_id` FOREIGN KEY (`level_id`) REFERENCES `skills_levels` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `FK_skills_class_path_level_skills_skills_skill` FOREIGN KEY (`skill_id`) REFERENCES `skills_skill` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE='utf8mb4_unicode_ci';

CREATE TABLE IF NOT EXISTS `skills_groups` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `label` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sort` int unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE='utf8mb4_unicode_ci';

CREATE TABLE IF NOT EXISTS `skills_levels` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `key` int unsigned NOT NULL,
  `label` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `required_experience` bigint unsigned DEFAULT NULL,
  `level_set_id` int unsigned NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `key_level_set_id` (`key`,`level_set_id`),
  KEY `level_set_id` (`level_set_id`),
  CONSTRAINT `FK_skills_levels_skills_levels_set` FOREIGN KEY (`level_set_id`) REFERENCES `skills_levels_set` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE='utf8mb4_unicode_ci';

CREATE TABLE IF NOT EXISTS `skills_levels_modifiers` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `level_id` int unsigned NOT NULL,
  `key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `property_key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `operation` int unsigned NOT NULL,
  `value` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `minValue` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `maxValue` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `minProperty` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `maxProperty` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `modifier_id` (`key`) USING BTREE,
  KEY `level_key` (`level_id`) USING BTREE,
  KEY `FK_skills_levels_modifiers_operation_types` (`operation`),
  CONSTRAINT `FK_skills_levels_modifiers_operation_types` FOREIGN KEY (`operation`) REFERENCES `operation_types` (`key`),
  CONSTRAINT `FK_skills_levels_modifiers_skills_levels` FOREIGN KEY (`level_id`) REFERENCES `skills_levels` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE='utf8mb4_unicode_ci';

CREATE TABLE IF NOT EXISTS `skills_levels_modifiers_conditions` (
	`id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
	`levels_modifier_id` INT(10) UNSIGNED NOT NULL,
	`key` VARCHAR(255) NOT NULL COLLATE 'utf8mb4_unicode_ci',
	`property_key` VARCHAR(255) NOT NULL COLLATE 'utf8mb4_unicode_ci',
	`conditional` ENUM('eq','ne','lt','gt','le','ge') NOT NULL COLLATE 'utf8mb4_unicode_ci',
	`value` VARCHAR(255) NOT NULL COLLATE 'utf8mb4_unicode_ci',
	PRIMARY KEY (`id`) USING BTREE,
	INDEX `levels_modifier_id` (`levels_modifier_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE='utf8mb4_unicode_ci';

CREATE TABLE IF NOT EXISTS `skills_levels_set` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `autoFillRanges` int unsigned NOT NULL DEFAULT '0',
  `autoFillExperienceMultiplier` int unsigned DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE='utf8mb4_unicode_ci';

CREATE TABLE IF NOT EXISTS `skills_owners_class_path` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `class_path_id` int unsigned NOT NULL,
  `owner_id` int unsigned NOT NULL,
  `currentLevel` bigint unsigned NOT NULL DEFAULT '0',
  `currentExp` bigint unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `level_set_id` (`class_path_id`) USING BTREE,
  CONSTRAINT `FK_skills_owners_class_path_skills_class_path` FOREIGN KEY (`class_path_id`) REFERENCES `skills_class_path` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE='utf8mb4_unicode_ci';

CREATE TABLE IF NOT EXISTS `skills_skill_type` (
	`id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
	`key` VARCHAR(255) NOT NULL COLLATE 'utf8mb4_unicode_ci',
	PRIMARY KEY (`id`) USING BTREE,
	UNIQUE INDEX `key` (`key`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE='utf8mb4_unicode_ci';

CREATE TABLE IF NOT EXISTS `skills_skill` (
	`id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
	`key` VARCHAR(255) NOT NULL COLLATE 'utf8mb4_unicode_ci',
	`type` INT(10) UNSIGNED NOT NULL,
	`autoValidation` INT(10) NOT NULL,
	`skillDelay` INT(10) NOT NULL,
	`castTime` INT(10) NOT NULL,
	`usesLimit` INT(10) NOT NULL DEFAULT '0',
	`range` INT(10) NOT NULL,
	`rangeAutomaticValidation` INT(10) NOT NULL,
	`rangePropertyX` VARCHAR(255) NOT NULL COLLATE 'utf8mb4_unicode_ci',
	`rangePropertyY` VARCHAR(255) NOT NULL COLLATE 'utf8mb4_unicode_ci',
	`rangeTargetPropertyX` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8mb4_unicode_ci',
	`rangeTargetPropertyY` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8mb4_unicode_ci',
	`allowSelfTarget` INT(10) NOT NULL,
	`criticalChance` INT(10) NULL DEFAULT NULL,
	`criticalMultiplier` INT(10) NULL DEFAULT NULL,
	`criticalFixedValue` INT(10) NULL DEFAULT NULL,
	`customData` TEXT NULL DEFAULT NULL COLLATE 'utf8mb4_unicode_ci',
	PRIMARY KEY (`id`) USING BTREE,
	UNIQUE INDEX `key` (`key`) USING BTREE,
	INDEX `FK_skills_skill_skills_skill_type` (`type`) USING BTREE,
	CONSTRAINT `FK_skills_skill_skills_skill_type` FOREIGN KEY (`type`) REFERENCES `skills_skill_type` (`id`) ON UPDATE NO ACTION ON DELETE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE='utf8mb4_unicode_ci';

CREATE TABLE IF NOT EXISTS `skills_skill_attack` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `skill_id` int unsigned NOT NULL,
  `affectedProperty` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `allowEffectBelowZero` int unsigned NOT NULL DEFAULT '0',
  `hitDamage` int unsigned NOT NULL,
  `applyDirectDamage` int unsigned NOT NULL DEFAULT '0',
  `attackProperties` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `defenseProperties` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `aimProperties` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `dodgeProperties` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `dodgeFullEnabled` int NOT NULL DEFAULT '1',
  `dodgeOverAimSuccess` int NOT NULL DEFAULT '2',
  `damageAffected` int NOT NULL DEFAULT '0',
  `criticalAffected` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `skill_id` (`skill_id`),
  CONSTRAINT `FK__skills_skill_attack` FOREIGN KEY (`skill_id`) REFERENCES `skills_skill` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE='utf8mb4_unicode_ci';

CREATE TABLE IF NOT EXISTS `skills_skill_group_relation` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `skill_id` int unsigned NOT NULL,
  `group_id` int unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `group_id` (`group_id`),
  KEY `skill_id` (`skill_id`),
  CONSTRAINT `FK__skills_groups` FOREIGN KEY (`group_id`) REFERENCES `skills_groups` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `FK__skills_skill` FOREIGN KEY (`skill_id`) REFERENCES `skills_skill` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE='utf8mb4_unicode_ci';

CREATE TABLE IF NOT EXISTS `skills_skill_owner_conditions` (
	`id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
	`skill_id` INT(10) UNSIGNED NOT NULL,
	`key` VARCHAR(255) NOT NULL COLLATE 'utf8mb4_unicode_ci',
	`property_key` VARCHAR(255) NOT NULL COLLATE 'utf8mb4_unicode_ci',
	`conditional` ENUM('eq','ne','lt','gt','le','ge') NOT NULL COLLATE 'utf8mb4_unicode_ci',
	`value` VARCHAR(255) NOT NULL COLLATE 'utf8mb4_unicode_ci',
	PRIMARY KEY (`id`) USING BTREE,
	INDEX `skill_id` (`skill_id`) USING BTREE,
	CONSTRAINT `FK_skills_skill_owner_conditions_skills_skill` FOREIGN KEY (`skill_id`) REFERENCES `skills_skill` (`id`) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE='utf8mb4_unicode_ci';

CREATE TABLE IF NOT EXISTS `skills_skill_owner_effects` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `skill_id` int unsigned NOT NULL,
  `key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `property_key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `operation` int unsigned NOT NULL,
  `value` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `minValue` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `maxValue` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `minProperty` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `maxProperty` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  KEY `skill_id` (`skill_id`) USING BTREE,
  KEY `FK_skills_skill_owner_effects_operation_types` (`operation`),
  CONSTRAINT `FK_skills_skill_owner_effects_operation_types` FOREIGN KEY (`operation`) REFERENCES `operation_types` (`key`) ON UPDATE CASCADE,
  CONSTRAINT `FK_skills_skill_owner_effects_skills_skill` FOREIGN KEY (`skill_id`) REFERENCES `skills_skill` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE='utf8mb4_unicode_ci';

CREATE TABLE IF NOT EXISTS `skills_skill_owner_effects_conditions` (
	`id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
	`skill_owner_effect_id` INT(10) UNSIGNED NOT NULL,
	`key` VARCHAR(255) NOT NULL COLLATE 'utf8mb4_unicode_ci',
	`property_key` VARCHAR(255) NOT NULL COLLATE 'utf8mb4_unicode_ci',
	`conditional` ENUM('eq','ne','lt','gt','le','ge') NOT NULL COLLATE 'utf8mb4_unicode_ci',
	`value` VARCHAR(255) NOT NULL COLLATE 'utf8mb4_unicode_ci',
	PRIMARY KEY (`id`) USING BTREE,
	INDEX `skill_owner_effect_id` (`skill_owner_effect_id`) USING BTREE,
	CONSTRAINT `FK_skills_skill_owner_effects_conditions_skill_owner_effects` FOREIGN KEY (`skill_owner_effect_id`) REFERENCES `skills_skill_owner_effects` (`id`) ON UPDATE CASCADE ON DELETE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE='utf8mb4_unicode_ci';

CREATE TABLE IF NOT EXISTS `skills_skill_physical_data` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `skill_id` int unsigned NOT NULL,
  `magnitude` int unsigned NOT NULL,
  `objectWidth` int unsigned NOT NULL,
  `objectHeight` int unsigned NOT NULL,
  `validateTargetOnHit` int unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `attack_skill_id` (`skill_id`) USING BTREE,
  CONSTRAINT `FK_skills_skill_physical_data_skills_skill` FOREIGN KEY (`skill_id`) REFERENCES `skills_skill` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE='utf8mb4_unicode_ci';

CREATE TABLE IF NOT EXISTS `skills_skill_target_effects` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `skill_id` int unsigned NOT NULL,
  `key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `property_key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `operation` int unsigned NOT NULL,
  `value` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `minValue` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `maxValue` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `minProperty` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `maxProperty` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  KEY `skill_id` (`skill_id`) USING BTREE,
  KEY `FK_skills_skill_target_effects_operation_types` (`operation`),
  CONSTRAINT `FK_skills_skill_effect_modifiers` FOREIGN KEY (`skill_id`) REFERENCES `skills_skill` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `FK_skills_skill_target_effects_operation_types` FOREIGN KEY (`operation`) REFERENCES `operation_types` (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE='utf8mb4_unicode_ci';

CREATE TABLE IF NOT EXISTS `skills_skill_target_effects_conditions` (
	`id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
	`skill_target_effect_id` INT(10) UNSIGNED NOT NULL,
	`key` VARCHAR(255) NOT NULL COLLATE 'utf8mb4_unicode_ci',
	`property_key` VARCHAR(255) NOT NULL COLLATE 'utf8mb4_unicode_ci',
	`conditional` ENUM('eq','ne','lt','gt','le','ge') NOT NULL COLLATE 'utf8mb4_unicode_ci',
	`value` VARCHAR(255) NOT NULL COLLATE 'utf8mb4_unicode_ci',
	PRIMARY KEY (`id`) USING BTREE,
	INDEX `skill_target_effect_id` (`skill_target_effect_id`) USING BTREE,
	CONSTRAINT `FK_skills_skill_target_effects_conditions_skill_target_effects` FOREIGN KEY (`skill_target_effect_id`) REFERENCES `skills_skill_target_effects` (`id`) ON UPDATE CASCADE ON DELETE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE='utf8mb4_unicode_ci';

#######################################################################################################################

SET FOREIGN_KEY_CHECKS = 1;

#######################################################################################################################
