-- --------------------------------------------------------
-- Host:                         localhost
-- Server version:               5.7.26 - MySQL Community Server (GPL)
-- Server OS:                    Win64
-- HeidiSQL Version:             11.0.0.5919
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;

-- Dumping structure for table reldens_test_skills.skills_class_path
CREATE TABLE IF NOT EXISTS `skills_class_path` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `key` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `label` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `levels_set_id` int(11) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `levels_set_id` (`levels_set_id`),
  CONSTRAINT `FK_skills_class_path_skills_levels_set` FOREIGN KEY (`levels_set_id`) REFERENCES `skills_levels_set` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- Dumping data for table reldens_test_skills.skills_class_path: ~0 rows (approximately)
/*!40000 ALTER TABLE `skills_class_path` DISABLE KEYS */;
/*!40000 ALTER TABLE `skills_class_path` ENABLE KEYS */;

-- Dumping structure for table reldens_test_skills.skills_class_path_level_labels
CREATE TABLE IF NOT EXISTS `skills_class_path_level_labels` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `class_path_id` int(11) unsigned NOT NULL,
  `level_key` int(11) unsigned NOT NULL,
  `label` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `class_path_id_level_key` (`class_path_id`,`level_key`),
  KEY `class_path_id` (`class_path_id`),
  KEY `level_key` (`level_key`),
  CONSTRAINT `FK__skills_class_path` FOREIGN KEY (`class_path_id`) REFERENCES `skills_class_path` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `FK_skills_class_path_level_labels_skills_levels` FOREIGN KEY (`level_key`) REFERENCES `skills_levels` (`key`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- Dumping data for table reldens_test_skills.skills_class_path_level_labels: ~0 rows (approximately)
/*!40000 ALTER TABLE `skills_class_path_level_labels` DISABLE KEYS */;
/*!40000 ALTER TABLE `skills_class_path_level_labels` ENABLE KEYS */;

-- Dumping structure for table reldens_test_skills.skills_class_path_level_skills
CREATE TABLE IF NOT EXISTS `skills_class_path_level_skills` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `class_path_id` int(11) unsigned NOT NULL,
  `level_key` int(11) unsigned NOT NULL,
  `skill_id` int(11) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `class_path_id` (`class_path_id`),
  KEY `level_key` (`level_key`),
  KEY `skill_id` (`skill_id`),
  CONSTRAINT `FK_skills_class_path_level_skills_skills_class_path` FOREIGN KEY (`class_path_id`) REFERENCES `skills_class_path` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `FK_skills_class_path_level_skills_skills_levels` FOREIGN KEY (`level_key`) REFERENCES `skills_levels` (`key`) ON UPDATE CASCADE,
  CONSTRAINT `FK_skills_class_path_level_skills_skills_skill` FOREIGN KEY (`skill_id`) REFERENCES `skills_skill` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- Dumping data for table reldens_test_skills.skills_class_path_level_skills: ~0 rows (approximately)
/*!40000 ALTER TABLE `skills_class_path_level_skills` DISABLE KEYS */;
/*!40000 ALTER TABLE `skills_class_path_level_skills` ENABLE KEYS */;

-- Dumping structure for table reldens_test_skills.skills_groups
CREATE TABLE IF NOT EXISTS `skills_groups` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `key` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `label` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `description` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `sort` int(11) unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- Dumping data for table reldens_test_skills.skills_groups: ~0 rows (approximately)
/*!40000 ALTER TABLE `skills_groups` DISABLE KEYS */;
/*!40000 ALTER TABLE `skills_groups` ENABLE KEYS */;

-- Dumping structure for table reldens_test_skills.skills_levels
CREATE TABLE IF NOT EXISTS `skills_levels` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `key` int(11) unsigned NOT NULL,
  `label` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `required_experience` bigint(20) unsigned DEFAULT NULL,
  `level_set_id` int(11) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `key` (`key`),
  KEY `level_set_id` (`level_set_id`),
  CONSTRAINT `FK_skills_levels_skills_levels_set` FOREIGN KEY (`level_set_id`) REFERENCES `skills_levels_set` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- Dumping data for table reldens_test_skills.skills_levels: ~0 rows (approximately)
/*!40000 ALTER TABLE `skills_levels` DISABLE KEYS */;
/*!40000 ALTER TABLE `skills_levels` ENABLE KEYS */;

-- Dumping structure for table reldens_test_skills.skills_levels_modifiers
CREATE TABLE IF NOT EXISTS `skills_levels_modifiers` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `level_key` int(11) unsigned NOT NULL,
  `key` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `property_key` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `operation` int(11) unsigned NOT NULL,
  `value` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `minValue` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `maxValue` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `minProperty` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `maxProperty` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `level_key` (`level_key`),
  KEY `modifier_id` (`key`) USING BTREE,
  CONSTRAINT `FK__skills_levels` FOREIGN KEY (`level_key`) REFERENCES `skills_levels` (`key`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci COMMENT='Modifiers table.';

-- Dumping data for table reldens_test_skills.skills_levels_modifiers: ~0 rows (approximately)
/*!40000 ALTER TABLE `skills_levels_modifiers` DISABLE KEYS */;
/*!40000 ALTER TABLE `skills_levels_modifiers` ENABLE KEYS */;

-- Dumping structure for table reldens_test_skills.skills_levels_modifiers_conditions
CREATE TABLE IF NOT EXISTS `skills_levels_modifiers_conditions` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `levels_modifier_id` int(11) unsigned NOT NULL,
  `key` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `property_key` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `operation` varchar(50) COLLATE utf32_unicode_ci NOT NULL COMMENT 'eq,ne,lt,gt,le,ge',
  `value` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  KEY `levels_modifier_id` (`levels_modifier_id`) USING BTREE,
  CONSTRAINT `FK_skills_levels_modifiers_conditions_skills_levels_modifiers` FOREIGN KEY (`levels_modifier_id`) REFERENCES `skills_levels_modifiers` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf32 COLLATE=utf32_unicode_ci;

-- Dumping data for table reldens_test_skills.skills_levels_modifiers_conditions: ~0 rows (approximately)
/*!40000 ALTER TABLE `skills_levels_modifiers_conditions` DISABLE KEYS */;
/*!40000 ALTER TABLE `skills_levels_modifiers_conditions` ENABLE KEYS */;

-- Dumping structure for table reldens_test_skills.skills_levels_set
CREATE TABLE IF NOT EXISTS `skills_levels_set` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `autoFillRanges` int(1) unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- Dumping data for table reldens_test_skills.skills_levels_set: ~0 rows (approximately)
/*!40000 ALTER TABLE `skills_levels_set` DISABLE KEYS */;
/*!40000 ALTER TABLE `skills_levels_set` ENABLE KEYS */;

-- Dumping structure for table reldens_test_skills.skills_owners_class_path
CREATE TABLE IF NOT EXISTS `skills_owners_class_path` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `class_path_id` int(11) unsigned NOT NULL,
  `owner_id` int(11) unsigned NOT NULL,
  `currentLevel` bigint(20) unsigned NOT NULL DEFAULT '0',
  `currentExp` bigint(20) unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `level_set_id` (`class_path_id`) USING BTREE,
  CONSTRAINT `FK_skills_owners_class_path_skills_class_path` FOREIGN KEY (`class_path_id`) REFERENCES `skills_class_path` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- Dumping data for table reldens_test_skills.skills_owners_class_path: ~0 rows (approximately)
/*!40000 ALTER TABLE `skills_owners_class_path` DISABLE KEYS */;
/*!40000 ALTER TABLE `skills_owners_class_path` ENABLE KEYS */;

-- Dumping structure for table reldens_test_skills.skills_skill
CREATE TABLE `skills_skill` (
	`id` INT(11) UNSIGNED NOT NULL AUTO_INCREMENT,
	`key` VARCHAR(255) NOT NULL COLLATE 'utf8_unicode_ci',
	`type` VARCHAR(255) NOT NULL COMMENT 'B: 1, ATK: 2, EFCT: 3, PHYS-ATK: 4, PHYS-EFCT: 5' COLLATE 'utf8_unicode_ci',
	`autoValidation` INT(1) NOT NULL,
	`skillDelay` INT(11) NOT NULL,
	`castTime` INT(11) NOT NULL,
	`usesLimit` INT(11) NOT NULL DEFAULT '0',
	`range` INT(11) NOT NULL,
	`rangeAutomaticValidation` INT(1) NOT NULL,
	`rangePropertyX` VARCHAR(255) NOT NULL COMMENT 'Property path' COLLATE 'utf8_unicode_ci',
	`rangePropertyY` VARCHAR(255) NOT NULL COMMENT 'Property path' COLLATE 'utf8_unicode_ci',
	`rangeTargetPropertyX` VARCHAR(255) NULL DEFAULT NULL COMMENT 'Target property path' COLLATE 'utf8_unicode_ci',
	`rangeTargetPropertyY` VARCHAR(255) NULL DEFAULT NULL COMMENT 'Target property path' COLLATE 'utf8_unicode_ci',
	`allowSelfTarget` INT(1) NOT NULL,
	`criticalChance` INT(11) NULL DEFAULT NULL,
	`criticalMultiplier` INT(11) NULL DEFAULT NULL,
	`criticalFixedValue` INT(11) NULL DEFAULT NULL,
	`customData` TEXT NULL DEFAULT NULL COMMENT 'Any custom data, recommended JSON format.' COLLATE 'utf8_unicode_ci',
	PRIMARY KEY (`id`) USING BTREE,
	UNIQUE INDEX `key` (`key`) USING BTREE
) COLLATE='utf8_unicode_ci' ENGINE=InnoDB;
-- Dumping data for table reldens_test_skills.skills_skill: ~0 rows (approximately)
/*!40000 ALTER TABLE `skills_skill` DISABLE KEYS */;
/*!40000 ALTER TABLE `skills_skill` ENABLE KEYS */;

-- Dumping structure for table reldens_test_skills.skills_skill_attack
CREATE TABLE IF NOT EXISTS `skills_skill_attack` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `skill_id` int(11) unsigned NOT NULL,
  `affectedProperty` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `allowEffectBelowZero` int(1) unsigned NOT NULL DEFAULT '0',
  `hitDamage` int(11) unsigned NOT NULL,
  `applyDirectDamage` int(1) unsigned NOT NULL DEFAULT '0',
  `attackProperties` text COLLATE utf8_unicode_ci NOT NULL,
  `defenseProperties` text COLLATE utf8_unicode_ci NOT NULL,
  `aimProperties` text COLLATE utf8_unicode_ci NOT NULL,
  `dodgeProperties` text COLLATE utf8_unicode_ci NOT NULL,
  `dodgeFullEnabled` int(1) NOT NULL DEFAULT '1',
  `dodgeOverAimSuccess` int(11) NOT NULL DEFAULT '2',
  `damageAffected` int(1) NOT NULL DEFAULT '0',
  `criticalAffected` int(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `skill_id` (`skill_id`),
  CONSTRAINT `FK__skills_skill_attack` FOREIGN KEY (`skill_id`) REFERENCES `skills_skill` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- Dumping data for table reldens_test_skills.skills_skill_attack: ~0 rows (approximately)
/*!40000 ALTER TABLE `skills_skill_attack` DISABLE KEYS */;
/*!40000 ALTER TABLE `skills_skill_attack` ENABLE KEYS */;

-- Dumping structure for table reldens_test_skills.skills_skill_group_relation
CREATE TABLE IF NOT EXISTS `skills_skill_group_relation` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `skill_id` int(11) unsigned NOT NULL,
  `group_id` int(11) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `group_id` (`group_id`),
  KEY `skill_id` (`skill_id`),
  CONSTRAINT `FK__skills_groups` FOREIGN KEY (`group_id`) REFERENCES `skills_groups` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `FK__skills_skill` FOREIGN KEY (`skill_id`) REFERENCES `skills_skill` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- Dumping data for table reldens_test_skills.skills_skill_group_relation: ~0 rows (approximately)
/*!40000 ALTER TABLE `skills_skill_group_relation` DISABLE KEYS */;
/*!40000 ALTER TABLE `skills_skill_group_relation` ENABLE KEYS */;

-- Dumping structure for table reldens_test_skills.skills_skill_owner_conditions
CREATE TABLE IF NOT EXISTS `skills_skill_owner_conditions` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `skill_id` int(11) unsigned NOT NULL,
  `key` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `property_key` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `operation` varchar(50) COLLATE utf32_unicode_ci NOT NULL COMMENT 'eq,ne,lt,gt,le,ge',
  `value` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `skill_id` (`skill_id`),
  CONSTRAINT `FK_skills_skill_owner_conditions_skills_skill` FOREIGN KEY (`skill_id`) REFERENCES `skills_skill` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf32 COLLATE=utf32_unicode_ci;

-- Dumping data for table reldens_test_skills.skills_skill_owner_conditions: ~0 rows (approximately)
/*!40000 ALTER TABLE `skills_skill_owner_conditions` DISABLE KEYS */;
/*!40000 ALTER TABLE `skills_skill_owner_conditions` ENABLE KEYS */;

-- Dumping structure for table reldens_test_skills.skills_skill_owner_effects
CREATE TABLE IF NOT EXISTS `skills_skill_owner_effects` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `skill_id` int(11) unsigned NOT NULL,
  `key` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `property_key` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `operation` int(11) unsigned NOT NULL,
  `value` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `minValue` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `maxValue` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `minProperty` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `maxProperty` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  KEY `skill_id` (`skill_id`) USING BTREE,
  CONSTRAINT `FK_skills_skill_owner_effects_skills_skill` FOREIGN KEY (`skill_id`) REFERENCES `skills_skill` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci COMMENT='Modifiers table.';

-- Dumping data for table reldens_test_skills.skills_skill_owner_effects: ~0 rows (approximately)
/*!40000 ALTER TABLE `skills_skill_owner_effects` DISABLE KEYS */;
/*!40000 ALTER TABLE `skills_skill_owner_effects` ENABLE KEYS */;

-- Dumping structure for table reldens_test_skills.skills_skill_owner_effects_conditions
CREATE TABLE IF NOT EXISTS `skills_skill_owner_effects_conditions` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `skill_owner_effect_id` int(11) unsigned NOT NULL,
  `key` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `property_key` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `operation` varchar(50) COLLATE utf32_unicode_ci NOT NULL COMMENT 'eq,ne,lt,gt,le,ge',
  `value` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  KEY `skill_owner_effect_id` (`skill_owner_effect_id`) USING BTREE,
  CONSTRAINT `FK_skills_skill_owner_effects_conditions_skill_owner_effects` FOREIGN KEY (`skill_owner_effect_id`) REFERENCES `skills_skill_owner_effects` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf32 COLLATE=utf32_unicode_ci;

-- Dumping data for table reldens_test_skills.skills_skill_owner_effects_conditions: ~0 rows (approximately)
/*!40000 ALTER TABLE `skills_skill_owner_effects_conditions` DISABLE KEYS */;
/*!40000 ALTER TABLE `skills_skill_owner_effects_conditions` ENABLE KEYS */;

-- Dumping structure for table reldens_test_skills.skills_skill_physical_data
CREATE TABLE IF NOT EXISTS `skills_skill_physical_data` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `skill_id` int(11) unsigned NOT NULL,
  `magnitude` int(11) unsigned NOT NULL,
  `objectWidth` int(11) unsigned NOT NULL,
  `objectHeight` int(11) unsigned NOT NULL,
  `validateTargetOnHit` int(1) unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `attack_skill_id` (`skill_id`) USING BTREE,
  CONSTRAINT `FK_skills_skill_physical_data_skills_skill` FOREIGN KEY (`skill_id`) REFERENCES `skills_skill` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- Dumping data for table reldens_test_skills.skills_skill_physical_data: ~0 rows (approximately)
/*!40000 ALTER TABLE `skills_skill_physical_data` DISABLE KEYS */;
/*!40000 ALTER TABLE `skills_skill_physical_data` ENABLE KEYS */;

-- Dumping structure for table reldens_test_skills.skills_skill_target_effects
CREATE TABLE IF NOT EXISTS `skills_skill_target_effects` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `skill_id` int(11) unsigned NOT NULL,
  `key` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `property_key` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `operation` int(11) unsigned NOT NULL,
  `value` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `minValue` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `maxValue` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `minProperty` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `maxProperty` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  KEY `skill_id` (`skill_id`) USING BTREE,
  CONSTRAINT `FK_skills_skill_effect_modifiers` FOREIGN KEY (`skill_id`) REFERENCES `skills_skill` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci COMMENT='Modifiers table.';

-- Dumping data for table reldens_test_skills.skills_skill_target_effects: ~0 rows (approximately)
/*!40000 ALTER TABLE `skills_skill_target_effects` DISABLE KEYS */;
/*!40000 ALTER TABLE `skills_skill_target_effects` ENABLE KEYS */;

-- Dumping structure for table reldens_test_skills.skills_skill_target_effects_conditions
CREATE TABLE IF NOT EXISTS `skills_skill_target_effects_conditions` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `skill_target_effect_id` int(11) unsigned NOT NULL,
  `key` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `property_key` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `operation` varchar(50) COLLATE utf32_unicode_ci NOT NULL COMMENT 'eq,ne,lt,gt,le,ge',
  `value` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  KEY `skill_target_effect_id` (`skill_target_effect_id`) USING BTREE,
  CONSTRAINT `FK_skills_skill_target_effects_conditions_skill_target_effects` FOREIGN KEY (`skill_target_effect_id`) REFERENCES `skills_skill_target_effects` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf32 COLLATE=utf32_unicode_ci;

-- Dumping data for table reldens_test_skills.skills_skill_target_effects_conditions: ~0 rows (approximately)
/*!40000 ALTER TABLE `skills_skill_target_effects_conditions` DISABLE KEYS */;
/*!40000 ALTER TABLE `skills_skill_target_effects_conditions` ENABLE KEYS */;

/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IF(@OLD_FOREIGN_KEY_CHECKS IS NULL, 1, @OLD_FOREIGN_KEY_CHECKS) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
