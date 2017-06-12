
DROP TABLE IF EXISTS `employee_project`;
DROP TABLE IF EXISTS `project_equipment`;
DROP TABLE IF EXISTS `project`;
DROP TABLE IF EXISTS `equipment`;
DROP TABLE IF EXISTS `equipment_type`;
DROP TABLE IF EXISTS `employee`;
DROP TABLE IF EXISTS `lab`;

CREATE TABLE `lab` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `ext` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;

CREATE TABLE `employee` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `first_name` varchar(255) NOT NULL,
  `last_name` varchar(255) DEFAULT NULL,
  `ext` int(11) DEFAULT NULL,
  `lab_id` int(11) NOT NULL,
  `manager_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_employee_lab`
    FOREIGN KEY (`lab_id`)
    REFERENCES `lab` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_employee_manager`
    FOREIGN KEY (`manager_id`)
    REFERENCES `employee` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE `equipment_type` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL UNIQUE,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;

CREATE TABLE `equipment` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `type_id` int(11) NOT NULL,
  `lab_id` int(11) NOT NULL,
  `maintainer_id` int(11) DEFAULT NULL,
  `calibration_date` date,
  `purchase_date` date,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_equipment_type`
    FOREIGN KEY (`type_id`)
    REFERENCES `equipment_type` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_equipment_lab`
    FOREIGN KEY (`lab_id`)
    REFERENCES `lab` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_equipment_employee`
    FOREIGN KEY (`maintainer_id`)
    REFERENCES `employee` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE `project` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `start_date` date,
  `due_date` date,
  `objective` text,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;

CREATE TABLE `project_equipment` (
  `project_id` int(11) NOT NULL,
  `equipment_type_id` int(11) NOT NULL,
  PRIMARY KEY (`project_id`,`equipment_type_id`),
  CONSTRAINT `fk_projeq_project`
    FOREIGN KEY (`project_id`)
    REFERENCES `project` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_projeq_equipment`
    FOREIGN KEY (`equipment_type_id`)
    REFERENCES `equipment_type` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE `employee_project` (
  `employee_id` int(11) NOT NULL,
  `project_id` int(11) NOT NULL,
  PRIMARY KEY (`employee_id`,`project_id`),
  CONSTRAINT `fk_emplproj_employee`
    FOREIGN KEY (`employee_id`)
    REFERENCES `employee` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_emplproj_project`
    FOREIGN KEY (`project_id`)
    REFERENCES `project` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB;
